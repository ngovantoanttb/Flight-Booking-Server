# Flight Booking API

REST API cho hệ thống đặt vé máy bay hoàn chỉnh sử dụng Node.js, Express.js và MySQL với các tính năng:

- **User Management**: Đăng ký, đăng nhập, quản lý profile
- **Flight Management**: CRUD chuyến bay với dịch vụ đi kèm
- **Booking System**: Đặt vé, thanh toán, quản lý đặt chỗ
- **Admin Panel**: Quản lý toàn diện hệ thống
- **AI Features**: Gợi ý chuyến bay thông minh
- **Payment Integration**: Tích hợp ZaloPay
- **Email Notifications**: Thông báo qua email
- **E-ticket Generation**: Tạo vé điện tử PDF
- **Flight Services**: Dịch vụ hành lý & đồ ăn theo chuyến bay

## Cấu trúc dự án

```
flight_booking/
├── src/
│   ├── config/           # Cấu hình ứng dụng
│   ├── controllers/      # Xử lý logic nghiệp vụ
│   ├── middleware/       # Middleware
│   ├── models/           # Mô hình dữ liệu
│   ├── routes/           # Định tuyến API
│   ├── services/         # Dịch vụ nghiệp vụ
│   ├── utils/            # Tiện ích
│   └── server.js         # Điểm khởi đầu ứng dụng
├── .env.sample           # Mẫu cấu hình môi trường
├── database/             # Database migrations và schema
├── docs/                 # API documentation
├── logs/                 # Application logs
├── postman/              # Postman collections
├── views/                # HTML templates
├── package.json          # Cấu hình dự án và dependencies
└── README.md             # Tài liệu dự án
```

## Cài đặt

1. Clone dự án:
```bash
git clone <repository-url>
cd flight_booking
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file .env từ .env.sample:
```bash
cp .env.sample .env
```

4. Cập nhật thông tin cấu hình trong file .env

5. Tạo cơ sở dữ liệu:
```bash
mysql -u root -p < flight_booking_db.sql
```

6. Khởi tạo database và sync models:
```bash
npm run init-db
```

7. Seed dữ liệu mẫu (tùy chọn):
```bash
npm run seed
```

## Chạy ứng dụng

### Môi trường phát triển:
```bash
npm run dev
```

### Môi trường sản xuất:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký người dùng mới
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/profile` - Lấy thông tin người dùng hiện tại
- `GET /api/auth/google` - Đăng nhập bằng Google
- `GET /api/auth/google/callback` - Callback URL cho Google OAuth

### Flights
- `GET /api/flights` - Tìm kiếm chuyến bay
- `GET /api/flights/:id` - Lấy thông tin chi tiết chuyến bay
- `GET /api/flights/:id/baggage-services` - Lấy dịch vụ hành lý của chuyến bay
- `GET /api/flights/:id/meal-services` - Lấy dịch vụ đồ ăn của chuyến bay

### Bookings
- `POST /api/bookings` - Tạo đặt chỗ mới
- `GET /api/bookings/:id` - Lấy thông tin đặt chỗ
- `PUT /api/bookings/:id/cancel` - Yêu cầu hủy đặt chỗ
- `GET /api/bookings/:id/ticket` - Lấy vé điện tử

### Payments
- `POST /api/payments/zalopay` - Thanh toán bằng ZaloPay
- `GET /api/payments/zalopay/callback` - Callback URL cho ZaloPay

### Admin API
- `GET /api/admin/airlines` - Quản lý hãng hàng không
- `GET /api/admin/airports` - Quản lý sân bay
- `GET /api/admin/aircraft` - Quản lý máy bay
- `GET /api/admin/passengers` - Quản lý hành khách
- `GET /api/admin/promotions` - Quản lý khuyến mãi
- `GET /api/admin/flights` - Quản lý chuyến bay
- `GET /api/admin/bookings` - Quản lý đặt chỗ
- `GET /api/admin/stats` - Báo cáo và thống kê

### Flight Services API
- `GET /api/admin/flights/:id/baggage-services` - Dịch vụ hành lý
- `POST /api/admin/flights/:id/baggage-services` - Tạo dịch vụ hành lý
- `PUT /api/admin/flights/:id/baggage-services/:serviceId` - Cập nhật dịch vụ hành lý
- `DELETE /api/admin/flights/:id/baggage-services/:serviceId` - Xóa dịch vụ hành lý
- `GET /api/admin/flights/:id/meal-services` - Dịch vụ đồ ăn
- `POST /api/admin/flights/:id/meal-services` - Tạo dịch vụ đồ ăn
- `PUT /api/admin/flights/:id/meal-services/:serviceId` - Cập nhật dịch vụ đồ ăn
- `DELETE /api/admin/flights/:id/meal-services/:serviceId` - Xóa dịch vụ đồ ăn

**📋 [Chi tiết Request Bodies](docs/FLIGHT_SERVICES_REQUEST_BODIES.md)**

## Công nghệ sử dụng

- **Node.js**: Môi trường runtime
- **Express**: Framework web
- **MySQL**: Cơ sở dữ liệu
- **Sequelize**: ORM
- **JWT**: Xác thực
- **Passport**: Xác thực OAuth
- **ZaloPay API**: Thanh toán
- **Nodemailer**: Gửi email
- **Puppeteer**: Tạo PDF e-ticket
- **Google Gemini AI**: Gợi ý chuyến bay

## Documentation

### API Documentation
- [Complete API Overview](docs/API_COMPLETE_OVERVIEW.md) - Tổng quan toàn bộ API
- [Flight Services API](docs/FLIGHT_SERVICES_API.md) - Dịch vụ hành lý & đồ ăn
- [Admin API](docs/ADMIN_API.md) - Quản lý hệ thống
- [AI API](docs/AI_API.md) - Tính năng AI
- [Payment API](docs/PAYMENT_API.md) - Thanh toán ZaloPay
- [E-ticket API](docs/EMAIL_NOTIFICATION.md) - Vé điện tử

### Setup Guides
- [Setup Guide](rules/SETUP_GUIDE.md) - Hướng dẫn cài đặt
- [Coding Standards](rules/CODING_STANDARDS.md) - Chuẩn code
- [Requirements](rules/REQUIREMENT.md) - Yêu cầu hệ thống

### Testing
- [Postman Collections](postman/) - Test collections
- [Test Scripts](src/scripts/) - Automated tests

## Quick Start

```bash
# 1. Clone và cài đặt
git clone <repository-url>
cd flight_booking
npm install

# 2. Setup database
mysql -u root -p < database/flight_booking_db.sql
node src/scripts/runFlightServicesMigration.js

# 3. Seed data
node src/scripts/seedAllEnhanced.js
node src/scripts/createAdminUser.js

# 4. Start server
npm run dev

# 5. Test API
curl http://localhost:3000/api/health
```

## Features Completed ✅

- ✅ User authentication & authorization
- ✅ Flight search & booking
- ✅ Payment integration (ZaloPay)
- ✅ E-ticket PDF generation
- ✅ Admin management panel
- ✅ AI-powered flight recommendations
- ✅ Email notifications
- ✅ Flight services (baggage & meals)
- ✅ Service packages management
- ✅ Comprehensive API documentation
