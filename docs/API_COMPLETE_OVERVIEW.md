# Flight Booking API - Complete Overview

## Tổng quan hệ thống

Flight Booking API là một hệ thống đặt vé máy bay hoàn chỉnh với các tính năng:

- ✅ **User Management**: Đăng ký, đăng nhập, quản lý profile
- ✅ **Flight Management**: CRUD chuyến bay với dịch vụ đi kèm
- ✅ **Booking System**: Đặt vé, thanh toán, quản lý đặt chỗ
- ✅ **Admin Panel**: Quản lý toàn diện hệ thống
- ✅ **AI Features**: Gợi ý chuyến bay thông minh
- ✅ **Payment Integration**: Tích hợp ZaloPay
- ✅ **Email Notifications**: Thông báo qua email
- ✅ **E-ticket Generation**: Tạo vé điện tử PDF

## Base URLs

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## API Documentation

### 1. Authentication APIs
- [Auth API](AUTH_API.md) - Đăng ký, đăng nhập, quản lý token

### 2. Flight Management APIs
- [Flight API](FLIGHT_API.md) - Tìm kiếm, lọc chuyến bay
- [Flight Services API](FLIGHT_SERVICES_API.md) - Dịch vụ hành lý & đồ ăn theo chuyến bay

### 3. Booking APIs
- [Booking API](BOOKING_API.md) - Đặt vé, quản lý đặt chỗ
- [Simplified Booking API](SIMPLIFIED_BOOKING_API.md) - Đặt vé đơn giản
- [User Booking Lookup](USER_BOOKING_LOOKUP_API.md) - Tra cứu đặt chỗ

### 4. Admin APIs
- [Admin API](ADMIN_API.md) - Quản lý hệ thống (flights, airlines, aircraft, users, bookings)
- [Service Package API](SERVICE_PACKAGE_API.md) - Quản lý gói dịch vụ

### 5. Payment APIs
- [Payment API](PAYMENT_API.md) - Thanh toán ZaloPay
- [Payment Test Interface](PAYMENT_TEST_INTERFACE.md) - Giao diện test thanh toán

### 6. AI Features
- [AI API](AI_API.md) - Gợi ý chuyến bay thông minh
- [AI Features](AI_FEATURES_README.md) - Tổng quan tính năng AI

### 7. E-ticket APIs
- [E-ticket API](ETICKET_API.md) - Tạo và tải vé điện tử PDF

### 8. Contact & Support
- [Contact API](CONTACT_API.md) - Liên hệ và hỗ trợ

## Database Schema

### Core Tables
- `users` - Thông tin người dùng
- `roles` - Vai trò người dùng
- `user_roles` - Phân quyền người dùng
- `countries` - Danh sách quốc gia
- `airports` - Danh sách sân bay
- `airlines` - Danh sách hãng hàng không
- `aircraft` - Danh sách máy bay
- `flights` - Thông tin chuyến bay
- `flight_seats` - Ghế ngồi trên chuyến bay
- `travel_classes` - Loại vé (Business, Economy)

### Booking Tables
- `bookings` - Thông tin đặt chỗ
- `booking_details` - Chi tiết đặt chỗ
- `passengers` - Thông tin hành khách
- `payments` - Thông tin thanh toán

### Service Tables
- `service_packages` - Gói dịch vụ của hãng hàng không
- `flight_baggage_services` - Dịch vụ hành lý theo chuyến bay
- `flight_meal_services` - Dịch vụ đồ ăn theo chuyến bay
- `baggage_options` - Tùy chọn hành lý
- `meal_options` - Tùy chọn đồ ăn

### AI & Analytics Tables
- `user_search_history` - Lịch sử tìm kiếm
- `flight_recommendations` - Gợi ý chuyến bay
- `email_notifications` - Thông báo email

## Authentication

### JWT Token
```http
Authorization: Bearer <jwt_token>
```

### Roles
- `admin` - Quản trị viên (toàn quyền)
- `user` - Người dùng thường (đặt vé, xem lịch sử)

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "field_name",
      "message": "Validation error message"
    }
  ]
}
```

## Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `500` - Internal Server Error

## Rate Limiting

- **Public APIs**: 100 requests/minute
- **Authenticated APIs**: 1000 requests/minute
- **Admin APIs**: 2000 requests/minute

## Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=flight_booking
DB_USER=root
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# ZaloPay
ZALOPAY_APP_ID=your_app_id
ZALOPAY_APP_USER=your_app_user
ZALOPAY_APP_TRANS=your_app_trans
ZALOPAY_KEY1=your_key1
ZALOPAY_KEY2=your_key2

# Server
PORT=3000
NODE_ENV=development
```

## Installation & Setup

### 1. Clone Repository
```bash
git clone <repository_url>
cd flight_booking
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Database
```bash
# Create database
mysql -u root -p
CREATE DATABASE flight_booking;

# Run migrations
node src/scripts/runFlightServicesMigration.js
```

### 4. Seed Data
```bash
# Seed basic data
node src/scripts/seedAllEnhanced.js

# Create admin user
node src/scripts/createAdminUser.js
```

### 5. Start Server
```bash
# Development
npm run dev

# Production
npm start
```

## Testing

### Unit Tests
```bash
npm test
```

### API Tests
```bash
# Test specific features
node src/scripts/testFlightServicesWithAuth.js
node src/scripts/testCreateAirlineWithServicePackages.js
node src/scripts/testAircraftManagement.js
```

### Postman Collections
- [Admin API Collection](postman/admin/Admin_API_Collection.json)
- [AI API Collection](postman/ai/AI_API_Collection.json)
- [Payment API Collection](postman/payment/Payment_API_Collection.json)
- [New Features Collection](postman/New_Features_API_Collection.json)

## Deployment

### Docker
```bash
# Build image
docker build -t flight-booking-api .

# Run container
docker run -p 3000:3000 flight-booking-api
```

### PM2
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start src/server.js --name flight-booking-api

# Monitor
pm2 monit
```

## Monitoring & Logging

### Logs
- **Combined Log**: `logs/combined.log`
- **Error Log**: `logs/error.log`

### Health Check
```http
GET /api/health
```

### Metrics
- Request count
- Response time
- Error rate
- Database connections

## Security

### Authentication
- JWT tokens với expiration
- Password hashing với bcrypt
- Role-based access control

### Validation
- Input validation với express-validator
- SQL injection protection với Sequelize ORM
- XSS protection

### CORS
```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-frontend.com'],
  credentials: true
}));
```

## Performance

### Database Optimization
- Indexes trên các trường thường query
- Connection pooling
- Query optimization

### Caching
- Redis cho session storage
- Memory cache cho static data

### Load Balancing
- Nginx reverse proxy
- Multiple server instances

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```bash
   # Check database status
   mysql -u root -p -e "SELECT 1"

   # Check connection string
   echo $DB_HOST $DB_PORT $DB_NAME
   ```

2. **JWT Token Expired**
   ```bash
   # Login again to get new token
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@flightbooking.com","password":"admin123"}'
   ```

3. **Port Already in Use**
   ```bash
   # Kill process on port 3000
   lsof -ti:3000 | xargs kill -9

   # Or use different port
   PORT=3001 npm start
   ```

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev

# Or specific modules
DEBUG=sequelize,express npm run dev
```

## Contributing

1. Fork repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## License

MIT License - see LICENSE file for details

## Support

- **Email**: support@flightbooking.com
- **Documentation**: [API Docs](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Maintainer**: Flight Booking Team
