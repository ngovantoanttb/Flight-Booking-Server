# AI Tìm Kiếm Chuyến Bay và Gợi Ý Chuyến Bay

## Tổng Quan

Hệ thống Flight Booking sử dụng **Google Gemini AI** và **AI Recommendation Engine** để cung cấp 2 tính năng chính:

1. **Tìm kiếm chuyến bay thông minh** - AI hỗ trợ người dùng tìm kiếm bằng ngôn ngữ tự nhiên
2. **Gợi ý chuyến bay cá nhân hóa** - AI phân tích sở thích và lịch sử để đưa ra gợi ý phù hợp

## 1. AI Tìm Kiếm Chuyến Bay

### 1.1. Chat với AI để Tìm Kiếm

**Endpoint:** `POST /api/ai/chat`

**Cách hoạt động:**

1. Người dùng gửi tin nhắn bằng ngôn ngữ tự nhiên:
   ```
   "Tìm kiếm chuyến bay từ Hà Nội đến TP HCM ngày 25/12/2024"
   "Tìm vé máy bay từ SGN đến HAN"
   "Chuyến bay từ Đà Nẵng đến Hà Nội"
   ```

2. AI (Gemini) phân tích và trích xuất thông tin:
   - Sân bay đi (departure airport)
   - Sân bay đến (arrival airport)
   - Ngày khởi hành (departure date)
   - Số hành khách (passengers)
   - Hạng vé (class)

3. AI phản hồi và hướng dẫn:
   - Xác nhận thông tin đã hiểu
   - Gợi ý cách tìm kiếm chính xác hơn
   - Cung cấp thông tin bổ sung (mã sân bay, thời gian tốt nhất, etc.)

**Ví dụ Request:**
```json
POST /api/ai/chat
{
  "message": "Tìm kiếm chuyến bay từ Hà Nội đến TP HCM ngày 25/12/2024",
  "context": {
    "user_id": 1,
    "recent_searches": [...],
    "recent_bookings": [...]
  }
}
```

**Ví dụ Response:**
```json
{
  "success": true,
  "message": "AI response generated successfully",
  "data": {
    "user_message": "Tìm kiếm chuyến bay từ Hà Nội đến TP HCM ngày 25/12/2024",
    "ai_response": "Tôi hiểu bạn muốn tìm chuyến bay từ Hà Nội (HAN) đến TP HCM (SGN) vào ngày 25/12/2024. Để tìm kiếm chính xác, bạn cần:\n\n1. Sử dụng mã sân bay: HAN → SGN\n2. Định dạng ngày: 2024-12-25\n3. Gọi API: GET /api/flights/search?departure_airport_code=HAN&arrival_airport_code=SGN&departure_date=2024-12-25\n\nBạn có muốn tôi tìm kiếm ngay không?",
    "timestamp": "2024-12-20T10:30:00Z",
    "model": "gemini-pro",
    "context_used": true
  }
}
```

### 1.2. AI Flight Search Assistance

**Endpoint:** `POST /api/ai/flight-search-assistance`

**Mục đích:** AI cung cấp tư vấn và gợi ý khi tìm kiếm chuyến bay

**Ví dụ Request:**
```json
POST /api/ai/flight-search-assistance
{
  "search_params": {
    "departure_airport_code": "HAN",
    "arrival_airport_code": "SGN",
    "departure_date": "2024-12-25",
    "passengers": 2,
    "class_code": "ECONOMY"
  }
}
```

**AI sẽ cung cấp:**
- Gợi ý ngày bay tốt nhất (giá rẻ hơn, ít đông hơn)
- Tuyến đường thay thế
- Thời gian bay lý tưởng
- Lời khuyên về booking (đặt sớm, flexible dates, etc.)
- Thông tin về hãng hàng không phù hợp

### 1.3. Search Suggestions (Gợi Ý Tìm Kiếm)

**Endpoint:** `GET /api/ai/search-suggestions?query=han`

**Cách hoạt động:**

1. Người dùng gõ một phần từ khóa (ví dụ: "han")
2. AI phân tích lịch sử tìm kiếm của user
3. Đưa ra gợi ý tự động hoàn thành:
   - Sân bay: "HAN - Sân bay Nội Bài, Hà Nội"
   - Tuyến đường: "HAN → SGN"
   - Tìm kiếm gần đây: "HAN → DAD (2024-12-20)"

**Ví dụ Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "type": "airport",
        "code": "HAN",
        "name": "Sân bay Nội Bài",
        "city": "Hà Nội",
        "relevance_score": 0.95
      },
      {
        "type": "route",
        "departure": "HAN",
        "arrival": "SGN",
        "relevance_score": 0.85
      },
      {
        "type": "recent_search",
        "departure_airport_code": "HAN",
        "arrival_airport_code": "DAD",
        "departure_date": "2024-12-20",
        "relevance_score": 0.75
      }
    ],
    "query": "han",
    "total_count": 3
  }
}
```

## 2. AI Gợi Ý Chuyến Bay Cá Nhân Hóa

### 2.1. Personalized Flight Recommendations

**Endpoint:** `GET /api/ai/recommendations`

**Quy trình hoạt động:**

#### Bước 1: Phân Tích Sở Thích Người Dùng

```javascript
// File: src/services/aiRecommendationService.js

async analyzeUserPreferences(userId) {
  // Lấy lịch sử tìm kiếm 30 ngày gần nhất
  const searchHistory = await UserSearchHistory.findAll({
    where: {
      user_id: userId,
      search_timestamp: { [Op.gte]: thirtyDaysAgo }
    },
    include: [Airport, TravelClass]
  });

  // Phân tích và trích xuất:
  return {
    preferred_airlines: [...],      // Hãng hàng không ưa thích
    preferred_routes: [...],         // Tuyến đường thường xuyên
    preferred_times: [...],          // Giờ bay ưa thích (6h, 8h, 14h...)
    preferred_class: 'ECONOMY',      // Hạng vé ưa thích
    preferred_passengers: 2,         // Số hành khách thường đặt
    search_frequency: 15            // Tần suất tìm kiếm
  };
}
```

#### Bước 2: Phân Tích Pattern Booking

```javascript
async analyzeBookingPatterns(userId) {
  // Lấy lịch sử booking đã xác nhận
  const bookings = await Booking.findAll({
    where: { user_id: userId, status: 'confirmed' },
    include: [BookingDetail, Flight, Airline]
  });

  // Phân tích:
  return {
    booked_airlines: [...],         // Hãng đã đặt nhiều nhất
    booked_routes: [...],            // Tuyến đường đã đặt
    booked_times: [...],            // Giờ bay đã đặt
    booked_classes: [...],         // Hạng vé đã đặt
    booking_frequency: 5,          // Số lần đặt vé
    average_booking_advance: 7     // Trung bình đặt trước bao nhiêu ngày
  };
}
```

#### Bước 3: Xây Dựng Tiêu Chí Gợi Ý

```javascript
buildRecommendationCriteria(userPreferences, bookingPatterns, options) {
  return {
    // Tiêu chí tìm kiếm cơ bản
    departure_airport_code: options.departure_airport_code,
    arrival_airport_code: options.arrival_airport_code,
    departure_date: options.departure_date,
    class_code: options.class_code || userPreferences.preferred_class,

    // Tiêu chí AI-enhanced
    preferred_airlines: userPreferences.preferred_airlines,
    preferred_routes: userPreferences.preferred_routes,
    preferred_times: userPreferences.preferred_times,
    booked_airlines: bookingPatterns.booked_airlines,
    booked_routes: bookingPatterns.booked_routes,

    // Trọng số scoring
    weights: {
      airline_preference: 0.3,      // 30% - Hãng hàng không
      route_preference: 0.25,         // 25% - Tuyến đường
      time_preference: 0.2,          // 20% - Thời gian
      price_competitiveness: 0.15,   // 15% - Giá cả
      availability: 0.1              // 10% - Ghế trống
    }
  };
}
```

#### Bước 4: Tìm Chuyến Bay Phù Hợp

```javascript
async findRecommendedFlights(criteria, limit) {
  // Tìm sân bay
  const departureAirport = await Airport.findOne({
    where: { airport_code: criteria.departure_airport_code }
  });
  const arrivalAirport = await Airport.findOne({
    where: { airport_code: criteria.arrival_airport_code }
  });

  // Xây dựng điều kiện tìm kiếm
  const whereClause = {
    departure_airport_id: departureAirport.airport_id,
    arrival_airport_id: arrivalAirport.airport_id,
    status: 'scheduled',
    departure_time: {
      [Op.gte]: new Date(criteria.departure_date),
      [Op.lt]: new Date(new Date(criteria.departure_date).getTime() + 24*60*60*1000)
    }
  };

  // Ưu tiên hãng hàng không nếu có
  if (criteria.preferred_airlines?.length > 0) {
    whereClause.airline_id = { [Op.in]: criteria.preferred_airlines };
  }

  // Tìm chuyến bay
  const flights = await Flight.findAll({
    where: whereClause,
    include: [Airline, Aircraft, Airport, FlightSeat],
    order: [['departure_time', 'ASC']],
    limit: limit * 2  // Lấy nhiều hơn để có nhiều lựa chọn scoring
  });

  return flights;
}
```

#### Bước 5: Tính Điểm và Sắp Xếp

```javascript
async scoreRecommendations(flights, userPreferences, bookingPatterns) {
  const scoredFlights = [];

  for (const flight of flights) {
    let score = 0;
    const reasons = [];

    // 1. Điểm hãng hàng không (30%)
    if (userPreferences.preferred_airlines.includes(flight.airline_id)) {
      score += 30;
      reasons.push('Matches your preferred airline');
    }

    // 2. Điểm thời gian (20%)
    const departureHour = new Date(flight.departure_time).getHours();
    if (userPreferences.preferred_times.includes(departureHour)) {
      score += 20;
      reasons.push('Matches your preferred departure time');
    }

    // 3. Điểm giá cả (15%)
    const minPrice = Math.min(...availableSeats.map(s => s.price));
    if (minPrice < 500) {
      score += 15;
      reasons.push('Great price');
    } else if (minPrice < 800) {
      score += 10;
      reasons.push('Good price');
    }

    // 4. Điểm ghế trống (10%)
    if (availableSeats.length > 5) {
      score += 10;
      reasons.push('Good seat availability');
    }

    // 5. Điểm tuyến đường (25%)
    if (bookingPatterns.booked_routes.some(r => 
      r.departure_airport_id === flight.departure_airport_id &&
      r.arrival_airport_id === flight.arrival_airport_id
    )) {
      score += 15;
      reasons.push("Popular route you've booked before");
    }

    scoredFlights.push({
      ...flight.toJSON(),
      recommendation_score: score,
      recommendation_reasons: reasons,
      starting_price: minPrice
    });
  }

  // Sắp xếp theo điểm giảm dần
  return scoredFlights
    .sort((a, b) => b.recommendation_score - a.recommendation_score)
    .slice(0, limit);
}
```

#### Bước 6: Lưu Gợi Ý Vào Database

```javascript
async saveRecommendations(userId, recommendations) {
  for (const rec of recommendations) {
    await FlightRecommendation.create({
      user_id: userId,
      flight_id: rec.flight_id,
      recommendation_score: rec.recommendation_score,
      recommendation_reason: rec.recommendation_reasons.join(', '),
      created_at: new Date()
    });
  }
}
```

### 2.2. Ví Dụ Sử Dụng API

**Request:**
```bash
GET /api/ai/recommendations?departure_airport_code=HAN&arrival_airport_code=SGN&departure_date=2024-12-25&limit=5
Authorization: Bearer JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "Personalized recommendations retrieved successfully",
  "data": {
    "recommendations": [
      {
        "flight_id": 123,
        "flight_number": "VN123",
        "airline": {
          "airline_name": "Vietnam Airlines",
          "airline_code": "VN"
        },
        "departure_airport": {
          "airport_code": "HAN",
          "airport_name": "Sân bay Nội Bài",
          "city": "Hà Nội"
        },
        "arrival_airport": {
          "airport_code": "SGN",
          "airport_name": "Sân bay Tân Sơn Nhất",
          "city": "TP HCM"
        },
        "departure_time": "2024-12-25T08:00:00Z",
        "arrival_time": "2024-12-25T10:30:00Z",
        "starting_price": 1200000,
        "recommendation_score": 85,
        "recommendation_reasons": [
          "Matches your preferred airline",
          "Matches your preferred departure time",
          "Great price",
          "Good seat availability"
        ]
      },
      {
        "flight_id": 124,
        "flight_number": "VJ456",
        "recommendation_score": 70,
        "recommendation_reasons": [
          "Good price",
          "Good seat availability"
        ],
        ...
      }
    ],
    "total_count": 5,
    "search_criteria": {
      "departure_airport_code": "HAN",
      "arrival_airport_code": "SGN",
      "departure_date": "2024-12-25",
      "class_code": "ECONOMY",
      "limit": 5
    }
  }
}
```

## 3. Tracking và Học Từ Hành Vi

### 3.1. Track User Search

**Endpoint:** `POST /api/ai/track-search`

Mỗi khi người dùng tìm kiếm, hệ thống tự động lưu vào `user_search_history`:

```javascript
await UserSearchHistory.create({
  user_id: userId,
  departure_airport_id: departureAirport.airport_id,
  arrival_airport_id: arrivalAirport.airport_id,
  departure_date: departure_date,
  return_date: return_date,
  passengers: passengers,
  travel_class_id: travelClass.class_id,
  search_timestamp: new Date()
});
```

### 3.2. AI Insights

**Endpoint:** `GET /api/ai/insights`

AI phân tích và cung cấp insights về:
- Sở thích du lịch
- Pattern booking
- Hãng hàng không yêu thích
- Tuyến đường thường xuyên
- Thời gian bay ưa thích

## 4. Kiến Trúc AI System

### 4.1. Components

```
┌─────────────────────────────────────────┐
│         AI Controller                   │
│  (aiController.js)                      │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼──────┐  ┌─────▼──────────┐
│ AI          │  │ Gemini        │
│ Recommendation│  │ Service        │
│ Service     │  │ (geminiService)│
└──────┬──────┘  └────────────────┘
       │
       │
┌──────▼──────────────────────────┐
│ Database Models                 │
│ - UserSearchHistory             │
│ - FlightRecommendation          │
│ - Booking, Flight, Airline      │
└─────────────────────────────────┘
```

### 4.2. Data Flow

```
User Request
    ↓
AI Controller
    ↓
┌─────────────────────────────┐
│ 1. Chat với Gemini          │  ← Natural Language Processing
│ 2. Track Search             │  ← Learning
│ 3. Analyze Preferences      │  ← Pattern Recognition
│ 4. Find Flights             │  ← Database Query
│ 5. Score Recommendations    │  ← AI Algorithm
│ 6. Return Results           │  ← Response
└─────────────────────────────┘
```

## 5. Thuật Toán Scoring

### 5.1. Công Thức Tính Điểm

```
Total Score = 
  (Airline Match × 0.3) +
  (Route Match × 0.25) +
  (Time Match × 0.2) +
  (Price Score × 0.15) +
  (Availability Score × 0.1)
```

### 5.2. Chi Tiết Scoring

| Tiêu Chí | Trọng Số | Điểm Tối Đa | Cách Tính |
|---------|----------|-------------|-----------|
| Hãng hàng không | 30% | 30 | Nếu match với preferred_airlines |
| Tuyến đường | 25% | 25 | Nếu match với booked_routes |
| Thời gian | 20% | 20 | Nếu giờ bay match preferred_times |
| Giá cả | 15% | 15 | < 500k: 15, < 800k: 10, khác: 5 |
| Ghế trống | 10% | 10 | > 5 ghế: 10, 1-5: 5, 0: 0 |

## 6. Tính Năng Nâng Cao

### 6.1. Booking Assistant

**Endpoint:** `POST /api/ai/booking-assistant`

Khi người dùng chọn một chuyến bay, AI gợi ý:
- Ghế ngồi tốt nhất
- Hành lý phù hợp
- Bữa ăn
- Bảo hiểm du lịch
- Dịch vụ bổ sung

### 6.2. Travel Recommendations

**Endpoint:** `POST /api/ai/travel-recommendations`

AI đưa ra gợi ý du lịch tổng thể:
- Điểm đến phù hợp
- Thời gian tốt nhất để đi
- Lời khuyên về ngân sách
- Tips du lịch

## 7. Lợi Ích Của AI System

### 7.1. Cho Người Dùng
- ✅ Tìm kiếm bằng ngôn ngữ tự nhiên
- ✅ Gợi ý phù hợp với sở thích cá nhân
- ✅ Tiết kiệm thời gian tìm kiếm
- ✅ Khám phá các lựa chọn tốt nhất

### 7.2. Cho Hệ Thống
- ✅ Tăng tỷ lệ chuyển đổi (conversion rate)
- ✅ Cải thiện trải nghiệm người dùng
- ✅ Học từ hành vi để cải thiện liên tục
- ✅ Phân tích dữ liệu người dùng

## 8. Bảo Mật và Privacy

- ✅ **JWT Authentication**: Tất cả API yêu cầu xác thực
- ✅ **User-specific data**: Mỗi user chỉ thấy data của mình
- ✅ **GDPR Compliance**: API để xóa AI data (`DELETE /api/ai/clear-data`)
- ✅ **Data anonymization**: Tự động ẩn danh sau 2 năm

## 9. Performance Optimization

- ✅ **Database Indexing**: Index cho search queries
- ✅ **Caching**: Cache recommendations (có thể implement Redis)
- ✅ **Pagination**: Phân trang cho large datasets
- ✅ **Async Processing**: Non-blocking operations

## 10. Kết Luận

Hệ thống AI trong Flight Booking cung cấp:

1. **Tìm kiếm thông minh**: Chat với AI để tìm chuyến bay
2. **Gợi ý cá nhân hóa**: Dựa trên sở thích và lịch sử
3. **Học liên tục**: Tự động cải thiện từ hành vi người dùng
4. **Tư vấn toàn diện**: Từ tìm kiếm đến booking

Tất cả được tích hợp mượt mà với hệ thống booking hiện có! 🚀



