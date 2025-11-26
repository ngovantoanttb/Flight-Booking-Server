<!-- @format -->

# BÁOXCÁO: Cách AI Đọc Database Chuyến Bay

## 📋 Tóm Tắt

Báo cáo này mô tả chi tiết cách mà hệ thống AI trong Flight-Booking-Server có thể đọc và truy vấn database chuyến bay, cùng với các đoạn code cụ thể.

---

## 1️⃣ PHƯƠNG PHÁP CHÍNH: `findRecommendedFlights`

**File:** `src/services/aiRecommendationService.js` (Dòng 271-342)

**Mục đích:** Tìm kiếm và lọc chuyến bay từ database dựa trên tiêu chí của người dùng

```javascript
async findRecommendedFlights(criteria, limit) {
    // Bước 1: Tìm sân bay khởi hành
    const departureAirport = await Airport.findOne({
        where: { airport_code: criteria.departure_airport_code },
    });

    // Bước 2: Tìm sân bay đến
    const arrivalAirport = await Airport.findOne({
        where: { airport_code: criteria.arrival_airport_code },
    });

    // Bước 3: Tìm hạng vé (ECONOMY, BUSINESS)
    const travelClass = await TravelClass.findOne({
        where: { class_code: criteria.class_code },
    });

    // Bước 4: XÂY DỰNG ĐIỀU KIỆN TÌM KIẾM
    const whereClause = {
        departure_airport_id: departureAirport.airport_id,
        arrival_airport_id: arrivalAirport.airport_id,
        status: 'scheduled',
        departure_time: {
            [Op.gte]: new Date(criteria.departure_date),
            [Op.lt]: new Date(new Date(criteria.departure_date).getTime() + 24 * 60 * 60 * 1000),
        },
    };

    // Bước 5: LỌC THEO HÃNG HÀNG KHÔNG ƯUTIÊN (nếu có)
    if (criteria.preferred_airlines && criteria.preferred_airlines.length > 0) {
        whereClause.airline_id = {
            [Op.in]: criteria.preferred_airlines,
        };
    }

    // Bước 6: ĐỌC DỮ LIỆU TỪ DATABASE
    const flights = await Flight.findAll({
        where: whereClause,
        attributes: [
            'flight_id',
            'flight_number',
            'departure_time',
            'arrival_time',
            'status',
            'economy_price',
            'business_price',
            'departure_airport_id',
            'arrival_airport_id',
            'airline_id',
        ],
        include: [
            {
                model: Airline,
                attributes: ['airline_id', 'airline_name', 'airline_code', 'logo_url'],
            },
            {
                model: Aircraft,
                attributes: ['aircraft_id', 'model', 'total_seats'],
            },
            {
                model: Airport,
                as: 'DepartureAirport',
                attributes: ['airport_id', 'airport_code', 'airport_name', 'city'],
            },
            {
                model: Airport,
                as: 'ArrivalAirport',
                attributes: ['airport_id', 'airport_code', 'airport_name', 'city'],
            },
            {
                model: FlightSeat,
                where: {
                    class_id: travelClass.class_id,
                    is_available: true,
                },
                attributes: ['seat_id', 'seat_number', 'price'],
                required: false,
            },
        ],
        order: [['departure_time', 'ASC']],
        limit: limit * 2,
    });

    return flights;
}
```

**Cách hoạt động:**

1. **Tìm sân bay** bằng mã sân bay (VD: SGN, HAN, DAD)
2. **Xây dựng điều kiện WHERE** để lọc chuyến bay
3. **Sử dụng Sequelize ORM** để truy vấn bảng `Flight`
4. **Include các bảng liên quan** (Airline, Airport, Aircraft, FlightSeat)
5. **Trả về danh sách chuyến bay** đã lọc

---

## 2️⃣ HÀM PHỤ: PHÂN TÍCH DỮ LIỆU NGƯỜI DÙNG

### A. `analyzeUserPreferences` (Dòng 46-95)

**Mục đích:** Phân tích lịch sử tìm kiếm của người dùng

```javascript
async analyzeUserPreferences(userId) {
    // Lấy lịch sử tìm kiếm trong 30 ngày qua
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const searchHistory = await UserSearchHistory.findAll({
        where: {
            user_id: userId,
            search_timestamp: {
                [Op.gte]: thirtyDaysAgo, // >= 30 ngày trước
            },
        },
        include: [
            {
                model: Airport,
                as: 'DepartureAirport',
                attributes: ['airport_id', 'airport_code', 'city'],
            },
            {
                model: Airport,
                as: 'ArrivalAirport',
                attributes: ['airport_id', 'airport_code', 'city'],
            },
            {
                model: TravelClass,
                attributes: ['class_id', 'class_name', 'class_code'],
            },
        ],
        order: [['search_timestamp', 'DESC']],
        limit: 50,
    });

    // Phân tích sở thích
    return {
        preferred_airlines: this.extractPreferredAirlines(searchHistory),
        preferred_routes: this.extractPreferredRoutes(searchHistory),
        preferred_times: this.extractPreferredTimes(searchHistory),
        preferred_class: this.extractPreferredClass(searchHistory),
        preferred_passengers: this.extractPreferredPassengers(searchHistory),
        search_frequency: searchHistory.length,
    };
}
```

**Dữ liệu trả về:**

- Hãng hàng không ưu tiên
- Tuyến đường ưu tiên
- Giờ khởi hành ưu tiên
- Hạng vé ưu tiên
- Số hành khách thường xuyên
- Tần suất tìm kiếm

### B. `analyzeBookingPatterns` (Dòng 97-164)

**Mục đích:** Phân tích hành vi đặt vé của người dùng

```javascript
async analyzeBookingPatterns(userId) {
    // Lấy tất cả các đơn đặt vé đã xác nhận
    const bookings = await Booking.findAll({
        where: {
            user_id: userId,
            status: 'confirmed', // Chỉ lấy vé đã xác nhận
        },
        include: [
            {
                model: BookingDetail,
                include: [
                    {
                        model: Flight,
                        include: [
                            { model: Airline, ... },
                            { model: Airport, as: 'DepartureAirport', ... },
                            { model: Airport, as: 'ArrivalAirport', ... },
                        ],
                    },
                    {
                        model: FlightSeat,
                        include: [
                            { model: TravelClass, ... },
                        ],
                    },
                ],
            },
        ],
        order: [['booking_date', 'DESC']],
        limit: 20,
    });

    // Phân tích mẫu đặt vé
    return {
        booked_airlines: this.extractBookedAirlines(bookings),
        booked_routes: this.extractBookedRoutes(bookings),
        booked_times: this.extractBookedTimes(bookings),
        booked_classes: this.extractBookedClasses(bookings),
        booking_frequency: bookings.length,
        average_booking_advance: this.calculateAverageBookingAdvance(bookings),
    };
}
```

---

## 3️⃣ HÀM ĐIỂM SỐ: `scoreRecommendations`

**File:** `src/services/aiRecommendationService.js` (Dòng 241-348)

**Mục đích:** Tính điểm khuyến nghị dựa trên dữ liệu người dùng

```javascript
async scoreRecommendations(flights, userPreferences, bookingPatterns) {
    const scoredFlights = [];

    for (const flight of flights) {
        let score = 0;
        const reasons = [];

        // 1. ĐIỂM HÃ HÀNG KHÔNG ƯU TIÊN (30%)
        if (flight.airline_id && userPreferences.preferred_airlines &&
            userPreferences.preferred_airlines.includes(flight.airline_id)) {
            score += 30;
            reasons.push('Matches your preferred airline');
        }

        // 2. ĐIỂM GIỜ KHỞI HÀNH ƯU TIÊN (20%)
        if (flight.departure_time && userPreferences.preferred_times) {
            const departureHour = new Date(flight.departure_time).getHours();
            if (userPreferences.preferred_times.includes(departureHour)) {
                score += 20;
                reasons.push('Matches your preferred departure time');
            }
        }

        // 3. ĐIỂM GIÁ CẠH TRANH (15%)
        const availableSeats = flight.FlightSeats?.filter(seat => seat.is_available) || [];
        if (availableSeats.length > 0) {
            const minPrice = Math.min(...availableSeats.map(seat => parseFloat(seat.price)));
            if (minPrice < 500) {
                score += 15;
                reasons.push('Great price');
            } else if (minPrice < 800) {
                score += 10;
                reasons.push('Good price');
            }
        }

        // 4. ĐIỂM GHẾ TRỐNG (10%)
        if (availableSeats.length > 5) {
            score += 10;
            reasons.push('Good seat availability');
        }

        // 5. ĐIỂM TUYẾN ĐƯỜNG ƯU TIÊN
        if (bookingPatterns.booked_routes && bookingPatterns.booked_routes.some(route =>
            route.departure_airport_id === flight.departure_airport_id &&
            route.arrival_airport_id === flight.arrival_airport_id)) {
            score += 15;
            reasons.push("Popular route you've booked before");
        }

        // Tính giá bắt đầu
        let startingPrice = null;
        const prices = availableSeats
            .map(seat => parseFloat(seat.price))
            .filter(p => !isNaN(p) && p > 0);

        if (prices.length > 0) {
            startingPrice = Math.min(...prices);
        } else if (flight.economy_price) {
            startingPrice = parseFloat(flight.economy_price);
        }

        // Tạo đối tượng chuyến bay có điểm số
        const formattedFlight = {
            flight_id: flight.flight_id,
            flight_number: flight.flight_number,
            airline: {
                id: flight.Airline?.airline_id,
                name: flight.Airline?.airline_name,
                code: flight.Airline?.airline_code,
            },
            departure: {
                airport: flight.DepartureAirport?.airport_code,
                time: flight.departure_time,
            },
            arrival: {
                airport: flight.ArrivalAirport?.airport_code,
                time: flight.arrival_time,
            },
            starting_price: startingPrice,
            available_seats: availableSeats.length,
            recommendation_score: score,
            recommendation_reasons: reasons,
        };

        scoredFlights.push(formattedFlight);
    }

    // Sắp xếp theo điểm số cao nhất
    return scoredFlights.sort((a, b) =>
        b.recommendation_score - a.recommendation_score
    );
}
```

---

## 4️⃣ BẢNG DỮ LIỆU ĐƯỢC ĐỌC

AI đọc từ các bảng sau:

| Bảng                  | Trường Dữ Liệu                                                                                | Mục Đích                       |
| --------------------- | --------------------------------------------------------------------------------------------- | ------------------------------ |
| **Flight**            | flight_id, flight_number, departure_time, arrival_time, status, economy_price, business_price | Thông tin chuyến bay           |
| **Airline**           | airline_id, airline_name, airline_code, logo_url                                              | Thông tin hãng hàng không      |
| **Airport**           | airport_id, airport_code, airport_name, city                                                  | Thông tin sân bay              |
| **Aircraft**          | aircraft_id, model, total_seats                                                               | Thông tin máy bay              |
| **FlightSeat**        | seat_id, seat_number, price, is_available, class_id                                           | Thông tin ghế và tính khả dụng |
| **TravelClass**       | class_id, class_name, class_code                                                              | Thông tin hạng vé              |
| **UserSearchHistory** | user_id, departure_airport_id, arrival_airport_id, departure_date, search_timestamp           | Lịch sử tìm kiếm người dùng    |
| **Booking**           | booking_id, user_id, booking_date, status, total_price                                        | Lịch sử đặt vé                 |
| **BookingDetail**     | booking_id, flight_id                                                                         | Chi tiết đơn đặt vé            |

---

## 5️⃣ QUÁ TRÌNH HOẠT ĐỘNG

```
1. Người dùng gọi API: /api/ai/recommendations
   ↓
2. Controller: aiController.getPersonalizedRecommendations()
   ↓
3. Service: aiRecommendationService.getPersonalizedRecommendations()
   ↓
4. Phân tích dữ liệu:
   a) analyzeUserPreferences() → Đọc UserSearchHistory
   b) analyzeBookingPatterns() → Đọc Booking + BookingDetail
   ↓
5. Xây dựng tiêu chí:
   buildRecommendationCriteria()
   ↓
6. Tìm chuyến bay:
   findRecommendedFlights()
   ├─ Tìm Airport (departure + arrival)
   ├─ Tìm TravelClass
   ├─ Truy vấn Flight với WHERE clause
   └─ Include: Airline, Aircraft, Airport, FlightSeat
   ↓
7. Tính điểm:
   scoreRecommendations()
   ├─ Điểm hãng hàng không (30%)
   ├─ Điểm giờ khởi hành (20%)
   ├─ Điểm giá cạnh tranh (15%)
   ├─ Điểm ghế trống (10%)
   └─ Điểm tuyến đường (25%)
   ↓
8. Lưu khuyến nghị:
   saveRecommendations()
   ↓
9. Trả về dữ liệu cho người dùng
```

---

## 6️⃣ TRUY VẤN SEQUELIZE CHI TIẾT

**Ví dụ:** Truy vấn hoàn chỉnh trong `findRecommendedFlights`:

```sql
-- SQL tương đương:
SELECT
    f.flight_id,
    f.flight_number,
    f.departure_time,
    f.arrival_time,
    f.economy_price,
    f.business_price,
    a.airline_name,
    ac.model,
    dep.airport_code as dep_code,
    arr.airport_code as arr_code,
    fs.seat_number,
    fs.price,
    fs.is_available
FROM Flight f
LEFT JOIN Airline a ON f.airline_id = a.airline_id
LEFT JOIN Aircraft ac ON f.aircraft_id = ac.aircraft_id
LEFT JOIN Airport dep ON f.departure_airport_id = dep.airport_id
LEFT JOIN Airport arr ON f.arrival_airport_id = arr.airport_id
LEFT JOIN FlightSeat fs ON f.flight_id = fs.flight_id
WHERE
    f.departure_airport_id = ?
    AND f.arrival_airport_id = ?
    AND f.status = 'scheduled'
    AND f.departure_time >= ?
    AND f.departure_time < ?
    AND fs.class_id = ?
    AND fs.is_available = true
ORDER BY f.departure_time ASC
LIMIT ?
```

---

## 7️⃣ API ENDPOINTS ĐỂ AI TRUY VẤN

**File:** `src/routes/ai.routes.js`

```javascript
// Các endpoint chính:
GET  /api/ai/recommendations
     ├─ Tham số: departure_airport_code, arrival_airport_code,
     │           departure_date, class_code, limit
     └─ Trả về: Danh sách chuyến bay được khuyến nghị

GET  /api/ai/insights
     └─ Trả về: Phân tích sở thích và mẫu của người dùng

GET  /api/ai/insights/preferences
     └─ Trả về: Sở thích cụ thể của người dùng

GET  /api/ai/insights/patterns
     └─ Trả về: Mẫu hành vi đặt vé

POST /api/ai/track-search
     ├─ Tham số: departure_airport_code, arrival_airport_code,
     │           departure_date, passengers, class_code
     └─ Mục đích: Ghi lại tìm kiếm để AI học hỏi
```

---

## 8️⃣ GIẢI THÍCH CHỈ SỐ ĐIỂM SỐ (Scoring)

```
Tổng điểm tối đa: 100

1. Hãng hàng không ưu tiên (30 điểm)
   - Nếu chuyến bay của hãng mà user từng chọn

2. Giờ khởi hành ưu tiên (20 điểm)
   - Nếu thời gian khởi hành khớp với thói quen của user

3. Ghế trống (10 điểm)
   - Nếu có >5 ghế trống

4. Giá cạnh tranh (15 điểm)
   - < 500: +15 điểm (Great price)
   - < 800: +10 điểm (Good price)

5. Tuyến đường ưu tiên (15 điểm)
   - Nếu là tuyến mà user từng đặt vé

TÍNH TOÁN:
Điểm = (Hãng ưu tiên × 0.3) + (Giờ ưu tiên × 0.2)
        + (Giá cạnh tranh × 0.15) + (Ghế trống × 0.1)
        + (Tuyến ưu tiên × 0.25)
```

---

## 9️⃣ DÒNG CODE QUAN TRỌNG NHẤT

### Dòng 1: Truy vấn Flight

```javascript
const flights = await Flight.findAll({
    where: whereClause,
    include: [
        { model: Airline, ... },
        { model: Airport, as: 'DepartureAirport', ... },
        { model: Airport, as: 'ArrivalAirport', ... },
        { model: FlightSeat, ... },
    ],
    limit: limit * 2,
});
```

**→ Đây là câu lệnh chính để AI đọc chuyến bay từ database**

### Dòng 2: Phân tích lịch sử tìm kiếm

```javascript
const searchHistory = await UserSearchHistory.findAll({
    where: {
        user_id: userId,
        search_timestamp: { [Op.gte]: thirtyDaysAgo },
    },
    include: [
        { model: Airport, as: 'DepartureAirport', ... },
        { model: Airport, as: 'ArrivalAirport', ... },
    ],
    limit: 50,
});
```

**→ AI đọc lịch sử tìm kiếm để học hỏi sở thích**

### Dòng 3: Phân tích lịch sử đặt vé

```javascript
const bookings = await Booking.findAll({
    where: { user_id: userId, status: 'confirmed' },
    include: [
        {
            model: BookingDetail,
            include: [
                { model: Flight, include: [Airline, Airport, ...] },
                { model: FlightSeat, include: [TravelClass] },
            ],
        },
    ],
    limit: 20,
});
```

**→ AI đọc lịch sử đặt vé để phân tích hành vi**

---

## 🔟 KẾT LUẬN

**AI có thể đọc database chuyến bay thông qua:**

1. ✅ **Service Layer** (`aiRecommendationService.js`)

   - Phương pháp: Sequelize ORM
   - Bảng: Flight, Airline, Airport, Aircraft, FlightSeat, TravelClass

2. ✅ **Phân tích User Data**

   - Lịch sử tìm kiếm (UserSearchHistory)
   - Lịch sử đặt vé (Booking + BookingDetail)

3. ✅ **Tính toán Scoring**

   - Dựa trên sở thích người dùng
   - Dựa trên hành vi trước đó

4. ✅ **API Endpoints**
   - GET `/api/ai/recommendations`
   - GET `/api/ai/insights`
   - Các endpoint khác trong `ai.routes.js`

**Từ khóa:** `Flight.findAll()`, `UserSearchHistory.findAll()`, `Booking.findAll()`, `scoreRecommendations()`

---

**Lưu ý:** Tất cả các truy vấn đều yêu cầu authentication (`protect` middleware)
