# 🚀 Flight Booking System - Setup Guide

## 📋 Prerequisites

Trước khi bắt đầu, hãy đảm bảo bạn đã cài đặt:

- **Node.js** (v16 hoặc cao hơn)
- **MySQL** (v8.0 hoặc cao hơn)
- **Git**

## 🗄️ Database Setup

### 1. Khởi động MySQL Server

```bash
# Windows (nếu cài qua XAMPP/WAMP)
# Khởi động XAMPP Control Panel và start MySQL

# Windows (nếu cài standalone)
net start mysql

# macOS (với Homebrew)
brew services start mysql

# Linux (Ubuntu/Debian)
sudo systemctl start mysql
```

### 2. Tạo Database

```sql
-- Kết nối MySQL với user root
mysql -u root -p

-- Tạo database
CREATE DATABASE flight_booking_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tạo user mới (tùy chọn)
CREATE USER 'flight_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON flight_booking_db.* TO 'flight_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Import Database Schema

```bash
# Import schema từ file SQL
mysql -u root -p flight_booking_db < flight_booking_db.sql
```

## ⚙️ Environment Configuration

### 1. Tạo file .env

Tạo file `.env` trong thư mục gốc của project:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=flight_booking_db
DB_USER=root
DB_PASSWORD=your_mysql_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Google OAuth Configuration (Optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# ZaloPay Configuration (Optional)
ZALOPAY_APP_ID=
ZALOPAY_KEY1=
ZALOPAY_KEY2=
ZALOPAY_ENDPOINT=https://sb-openapi.zalopay.vn/v2/create

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=noreply@flightbooking.com
```

### 2. Cập nhật Database Password

Thay đổi `DB_PASSWORD` trong file `.env` thành password MySQL của bạn.

## 📦 Installation & Setup

### 1. Cài đặt Dependencies

```bash
npm install
```

### 2. Khởi tạo Database với Sequelize

```bash
# Tạo tables từ models
npm run init-db
```

### 3. Seed Sample Data

```bash
# Thêm dữ liệu mẫu
npm run seed
```

### 4. Khởi động Server

```bash
# Development mode
npm run dev

# Hoặc
npm start
```

## 🧪 Testing API

### 1. Web Documentation Interface

**Truy cập trang documentation và testing:**
```
http://localhost:3000/api/docs
```

**Tính năng:**
- ✅ **Interactive API Testing** - Test trực tiếp trên web interface
- ✅ **Real-time Response** - Xem kết quả ngay lập tức
- ✅ **Authentication Management** - Tự động lưu và sử dụng JWT token
- ✅ **Parameter Input** - Form nhập liệu cho các parameters
- ✅ **Response Formatting** - JSON response được format đẹp
- ✅ **Status Monitoring** - Hiển thị trạng thái server real-time

### 2. Command Line Testing

**Health Check:**
```bash
curl http://localhost:3000/api/health
```

**Flight Search:**
```bash
curl "http://localhost:3000/api/flights/search?departure_airport_code=SGN&arrival_airport_code=HAN&departure_date=2024-12-25&passengers=1"
```

## 🔧 Troubleshooting

### Database Connection Issues

**Lỗi: `ECONNREFUSED`**
- Kiểm tra MySQL server có đang chạy không
- Kiểm tra port MySQL (mặc định 3306)
- Kiểm tra username/password trong `.env`

**Lỗi: `Access denied`**
- Kiểm tra user có quyền truy cập database không
- Kiểm tra password có đúng không

### Port Already in Use

**Lỗi: `EADDRINUSE` hoặc `UNCAUGHT EXCEPTION! address already in use`**

```bash
# Cách 1: Sử dụng script tự động
npm run start:clean

# Cách 2: Kill thủ công
# Tìm process đang sử dụng port 3000
netstat -ano | findstr :3000

# Kill tất cả process Node.js
taskkill /F /IM node.exe

# Hoặc kill process cụ thể
taskkill /PID <PID> /F

# Cách 3: Thay đổi port trong .env
PORT=3001
```

**Lưu ý:** Script `start:clean` sẽ tự động kill các process cũ trước khi khởi động server mới.

### Missing Dependencies

```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install
```

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Đăng ký user mới
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/profile` - Lấy thông tin profile (cần JWT token)
- `GET /api/auth/google` - Google OAuth login

### Flight Endpoints

- `GET /api/flights/search` - Tìm kiếm chuyến bay
- `GET /api/flights/:id` - Chi tiết chuyến bay
- `GET /api/flights/:id/services` - Dịch vụ chuyến bay
- `GET /api/flights/:id/seats` - Ghế ngồi có sẵn

### Admin Endpoints (cần admin role)

- `GET /api/flights` - Danh sách tất cả chuyến bay
- `POST /api/flights` - Tạo chuyến bay mới
- `PUT /api/flights/:id` - Cập nhật chuyến bay
- `DELETE /api/flights/:id` - Xóa chuyến bay

## 🎯 Next Steps

1. **Setup Database** - Đảm bảo MySQL đang chạy và database đã được tạo
2. **Configure Environment** - Cập nhật file `.env` với thông tin database
3. **Initialize Database** - Chạy `npm run init-db` để tạo tables
4. **Seed Data** - Chạy `npm run seed` để thêm dữ liệu mẫu
5. **Start Server** - Chạy `npm run dev` để khởi động server
6. **Test API** - Sử dụng curl hoặc Postman để test các endpoints

## 📞 Support

Nếu gặp vấn đề, hãy kiểm tra:

1. **Logs** - Xem console output để tìm lỗi
2. **Database** - Đảm bảo MySQL đang chạy
3. **Environment** - Kiểm tra file `.env`
4. **Dependencies** - Chạy `npm install` lại

---

**Chúc bạn setup thành công! 🎉**
