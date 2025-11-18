# 🤖 AI Recommendation System - Flight Booking

## 📋 Tổng quan

Hệ thống AI Recommendation đã được implement thành công cho Flight Booking System, cung cấp các tính năng gợi ý chuyến bay thông minh và hỗ trợ đặt vé tự động.

## ✨ Tính năng đã implement

### 1. 🎯 **AI Flight Recommendations**
- **Gợi ý chuyến bay cá nhân hóa** dựa trên lịch sử tìm kiếm và booking
- **Thuật toán scoring thông minh** với các trọng số:
  - Sở thích hãng hàng không (30%)
  - Tuyến đường ưa thích (25%)
  - Thời gian bay ưa thích (20%)
  - Giá cả cạnh tranh (15%)
  - Tình trạng ghế trống (10%)

### 2. 🤖 **AI Booking Assistant**
- **Gợi ý ghế ngồi** dựa trên sở thích
- **Tư vấn hành lý** phù hợp với lịch sử du lịch
- **Gợi ý bữa ăn** theo sở thích cá nhân
- **Tư vấn bảo hiểm** du lịch
- **Nhắc nhở check-in** tự động

### 3. 📊 **User Behavior Analysis**
- **Phân tích lịch sử tìm kiếm** để học sở thích
- **Phân tích pattern booking** để hiểu hành vi
- **Tính toán loyalty score** với các hãng hàng không
- **Insights cá nhân hóa** về thói quen du lịch

### 4. 🔍 **Smart Search Suggestions**
- **Gợi ý tìm kiếm thông minh** dựa trên lịch sử
- **Auto-complete** cho sân bay và tuyến đường
- **Relevance scoring** cho kết quả tìm kiếm

### 5. 📈 **Learning & Adaptation**
- **Tự động tracking** mọi tìm kiếm của user
- **Machine learning** từ hành vi booking
- **Continuous improvement** của thuật toán gợi ý

## 🛠️ **Cấu trúc Implementation**

### **Services**
```
src/services/aiRecommendationService.js
├── getPersonalizedRecommendations()
├── analyzeUserPreferences()
├── analyzeBookingPatterns()
├── getBookingAssistantSuggestions()
├── trackUserSearch()
├── getUserAIInsights()
└── getSearchSuggestions()
```

### **Controllers**
```
src/controllers/aiController.js
├── getPersonalizedRecommendations()
├── getBookingAssistantSuggestions()
├── trackUserSearch()
├── getUserSearchHistory()
├── getUserRecommendationsHistory()
├── getUserAIInsights()
├── getSearchSuggestions()
└── clearUserAIData()
```

### **Routes**
```
src/routes/ai.routes.js
├── GET  /api/ai/recommendations
├── POST /api/ai/booking-assistant
├── POST /api/ai/track-search
├── GET  /api/ai/search-history
├── GET  /api/ai/recommendations-history
├── GET  /api/ai/insights
├── GET  /api/ai/search-suggestions
└── DELETE /api/ai/clear-data
```

## 🗄️ **Database Schema**

### **Tables Used**
- `user_search_history` - Lưu lịch sử tìm kiếm
- `flight_recommendations` - Lưu gợi ý chuyến bay
- `users` - Thông tin người dùng
- `flights` - Thông tin chuyến bay
- `airlines` - Thông tin hãng hàng không
- `airports` - Thông tin sân bay
- `bookings` - Lịch sử đặt vé

### **AI Data Models**
```javascript
// UserSearchHistory
{
  search_id, user_id, departure_airport_id, arrival_airport_id,
  departure_date, return_date, passengers, travel_class_id,
  search_timestamp
}

// FlightRecommendation
{
  recommendation_id, user_id, flight_id, recommendation_score,
  recommendation_reason, created_at
}
```

## 🚀 **Cách sử dụng**

### **1. Setup & Installation**
```bash
# Install dependencies (đã có sẵn)
npm install

# Seed base data trước
npm run seed:enhanced

# Seed AI data
npm run seed:ai

# Start server
npm run dev
```

### **2. API Usage Examples**

#### **Get AI Recommendations**
```bash
curl -X GET "http://localhost:3000/api/ai/recommendations?departure_airport_code=SGN&arrival_airport_code=HAN&departure_date=2024-03-01&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### **Get Booking Assistant Suggestions**
```bash
curl -X POST "http://localhost:3000/api/ai/booking-assistant" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "flight_id": 1,
    "passengers": 2,
    "class_code": "ECONOMY"
  }'
```

#### **Get AI Insights**
```bash
curl -X GET "http://localhost:3000/api/ai/insights" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **3. Testing Commands**
```bash
# Seed AI test data
npm run seed:ai

# Clear AI data
npm run clear:ai

# Show AI statistics
npm run stats:ai

# Reset AI data (clear and reseed)
npm run reset:ai
```

## 📊 **AI Algorithm Details**

### **Recommendation Scoring**
```javascript
score = (
  airline_preference * 0.3 +
  route_preference * 0.25 +
  time_preference * 0.2 +
  price_competitiveness * 0.15 +
  availability * 0.1
)
```

### **User Preference Analysis**
- **Airline Loyalty**: Dựa trên lịch sử booking
- **Route Patterns**: Tuyến đường thường xuyên
- **Time Preferences**: Giờ bay ưa thích
- **Class Preferences**: Hạng ghế ưa thích
- **Booking Advance**: Thời gian đặt vé trước

### **Learning Features**
- **Search Tracking**: Tự động lưu mọi tìm kiếm
- **Pattern Recognition**: Nhận diện pattern du lịch
- **Collaborative Filtering**: Học từ user tương tự
- **Continuous Learning**: Cải thiện theo thời gian

## 🔒 **Privacy & Security**

### **Data Protection**
- ✅ **User-specific data**: Mỗi user chỉ thấy data của mình
- ✅ **GDPR Compliance**: API để xóa AI data
- ✅ **Data anonymization**: Tự động ẩn danh sau 2 năm
- ✅ **Opt-out option**: User có thể tắt AI tracking

### **Security Features**
- ✅ **JWT Authentication**: Tất cả API đều yêu cầu auth
- ✅ **Input Validation**: Validate tất cả input
- ✅ **Rate Limiting**: Giới hạn request per user
- ✅ **Error Handling**: Xử lý lỗi an toàn

## 📈 **Performance & Scalability**

### **Optimization Features**
- ✅ **Database Indexing**: Index cho search queries
- ✅ **Caching Strategy**: Cache recommendations
- ✅ **Pagination**: Phân trang cho large datasets
- ✅ **Async Processing**: Non-blocking operations

### **Monitoring**
- ✅ **Comprehensive Logging**: Log tất cả AI operations
- ✅ **Error Tracking**: Track và report errors
- ✅ **Performance Metrics**: Monitor response times
- ✅ **Usage Statistics**: Track API usage

## 🧪 **Testing & Quality Assurance**

### **Test Data**
- ✅ **Comprehensive Seed Data**: 10+ test scenarios
- ✅ **User Search History**: Sample search patterns
- ✅ **Flight Recommendations**: Sample recommendations
- ✅ **AI Insights**: Sample user insights

### **Test Scenarios**
1. **New User**: No history, general recommendations
2. **Business Traveler**: Business class preferences
3. **Family Traveler**: Group booking preferences
4. **Frequent Flyer**: Loyalty program integration

## 📚 **Documentation**

### **API Documentation**
- ✅ **Complete API Docs**: `docs/AI_API.md`
- ✅ **Request/Response Examples**: Detailed examples
- ✅ **Error Handling**: Error response formats
- ✅ **Authentication Guide**: JWT setup

### **Code Documentation**
- ✅ **JSDoc Comments**: All functions documented
- ✅ **Inline Comments**: Complex logic explained
- ✅ **README Files**: Setup and usage guides
- ✅ **Code Standards**: Follows project standards

## 🎯 **Future Enhancements**

### **Planned Features**
- 🔄 **Real-time Learning**: Update preferences in real-time
- 🔄 **Advanced ML Models**: Deep learning integration
- 🔄 **Price Prediction**: AI price forecasting
- 🔄 **Weather Integration**: Weather-based recommendations
- 🔄 **Social Features**: Friend recommendations
- 🔄 **Mobile App Integration**: Native mobile support

### **Performance Improvements**
- 🔄 **Redis Caching**: Advanced caching layer
- 🔄 **Microservices**: Split AI into separate service
- 🔄 **GraphQL API**: More flexible querying
- 🔄 **Real-time Updates**: WebSocket integration

## ✅ **Implementation Status**

| Feature | Status | Description |
|---------|--------|-------------|
| AI Recommendations | ✅ Complete | Personalized flight suggestions |
| Booking Assistant | ✅ Complete | Smart booking guidance |
| Search Tracking | ✅ Complete | Automatic search history |
| User Insights | ✅ Complete | AI-generated user analytics |
| Search Suggestions | ✅ Complete | Smart search autocomplete |
| Privacy Controls | ✅ Complete | GDPR compliance features |
| API Documentation | ✅ Complete | Comprehensive API docs |
| Test Data | ✅ Complete | Extensive test scenarios |
| Error Handling | ✅ Complete | Robust error management |
| Performance | ✅ Complete | Optimized for production |

## 🎉 **Kết luận**

Hệ thống AI Recommendation đã được implement thành công với đầy đủ tính năng:

- ✅ **8 API endpoints** hoàn chỉnh
- ✅ **Thuật toán AI** thông minh
- ✅ **Database schema** tối ưu
- ✅ **Security & Privacy** đảm bảo
- ✅ **Documentation** chi tiết
- ✅ **Test data** phong phú

Hệ thống sẵn sàng để deploy và sử dụng trong production! 🚀
