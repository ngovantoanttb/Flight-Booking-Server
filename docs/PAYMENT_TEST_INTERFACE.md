# ZaloPay Payment Test Interface

## 📋 Tổng quan

Giao diện web trực quan để test ZaloPay payment integration trong Flight Booking System. Giao diện này cho phép:

- Nhập JWT token để xác thực
- Xem danh sách bookings của người dùng
- Tạo payment ZaloPay cho từng booking
- Kiểm tra trạng thái thanh toán
- Xem lịch sử thanh toán
- Hủy booking (nếu chưa thanh toán)

## 🚀 Cách sử dụng

### 1. Truy cập giao diện

Mở trình duyệt và truy cập: `http://localhost:3000/payment-test`

### 2. Xác thực

- Nhập JWT token vào ô "Authentication"
- Token mặc định đã được điền sẵn: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiaWF0IjoxNzU3OTA5NjIyLCJleHAiOjE3NTc5OTYwMjJ9.eY7Ry0GNp0kQe1zM2BXgGpd80gLPQfwelNltHz7ePt4`
- Nhấn nút "Lấy Bookings" để tải danh sách

### 3. Quản lý Bookings

#### Xem danh sách bookings
- Giao diện sẽ hiển thị tất cả bookings của user
- Mỗi booking card hiển thị:
  - Booking reference và ID
  - Trạng thái (pending, confirmed, cancelled)
  - Thông tin liên hệ (email, SĐT)
  - Tổng tiền
  - Thông tin chuyến bay (nếu có)

#### Thanh toán ZaloPay
- Nhấn nút "Thanh toán ZaloPay" trên booking có trạng thái "pending"
- Hệ thống sẽ tạo payment order và hiển thị thông báo
- Có thể mở trang thanh toán ZaloPay trong tab mới

#### Kiểm tra trạng thái thanh toán
- Nhấn nút "Lịch sử thanh toán" để xem payment history
- Nhấn nút "Kiểm tra trạng thái" để query trạng thái từ ZaloPay

#### Hủy booking
- Nhấn nút "Hủy booking" trên booking có trạng thái "pending"
- Nhập lý do hủy (tùy chọn)
- Booking sẽ được cập nhật trạng thái thành "cancelled"

## 🎨 Tính năng giao diện

### Responsive Design
- Giao diện responsive, hoạt động tốt trên desktop và mobile
- Sử dụng Bootstrap 5 và Font Awesome icons
- Gradient background và modern UI design

### Real-time Updates
- Tự động reload danh sách sau khi thực hiện action
- Loading indicators cho các thao tác
- Alert messages với auto-dismiss

### User Experience
- Token được lưu sẵn để test nhanh
- Auto-load bookings khi có token
- Confirmation dialogs cho các action quan trọng

## 🔧 API Endpoints được sử dụng

### Authentication
- Sử dụng JWT token trong header `Authorization: Bearer <token>`

### Bookings API
- `GET /api/bookings` - Lấy danh sách bookings
- `GET /api/bookings/:id` - Lấy chi tiết booking
- `PATCH /api/bookings/:id/cancel` - Hủy booking

### Payment API
- `POST /api/payments/zalopay/create` - Tạo ZaloPay payment
- `POST /api/payments/zalopay/status` - Kiểm tra trạng thái payment
- `GET /api/payments/history` - Lấy lịch sử thanh toán

## 📱 Test Scenarios

### 1. Happy Path
1. Mở giao diện với token hợp lệ
2. Xem danh sách bookings
3. Tạo payment cho booking pending
4. Kiểm tra trạng thái payment
5. Xem payment history

### 2. Error Handling
1. Test với token không hợp lệ
2. Test với booking không tồn tại
3. Test cancel booking đã confirmed
4. Test payment cho booking đã thanh toán

### 3. Edge Cases
1. Test với user không có booking
2. Test với network error
3. Test với API timeout

## 🛠️ Development

### File Structure
```
views/
├── payment-test.html          # Main test interface
└── assets/                    # Static assets (CSS, JS)

src/
├── controllers/
│   └── bookingController.js   # Booking API controller
├── routes/
│   └── booking.routes.js      # Booking routes
└── server.js                  # Updated to serve static files
```

### Customization
- Có thể thay đổi API_BASE_URL trong JavaScript
- Có thể customize UI colors và styling
- Có thể thêm thêm test scenarios

## 🐛 Troubleshooting

### Common Issues

#### 1. "Cannot load bookings"
- Kiểm tra JWT token có hợp lệ không
- Kiểm tra server có đang chạy không
- Kiểm tra network connection

#### 2. "Payment creation failed"
- Kiểm tra booking có tồn tại không
- Kiểm tra booking status (chỉ pending mới thanh toán được)
- Kiểm tra ZaloPay configuration

#### 3. "CORS error"
- Đảm bảo server đang chạy trên localhost:3000
- Kiểm tra CORS configuration trong server.js

### Debug Tips
- Mở Developer Tools (F12) để xem console logs
- Kiểm tra Network tab để xem API requests
- Kiểm tra server logs để debug backend issues

## 📊 Test Data

### Default Test User
- **Email**: test@flightbooking.com
- **Password**: test123
- **User ID**: 3
- **JWT Token**: (được điền sẵn trong giao diện)

### Sample Bookings
- Booking ID 1: BK001 (pending)
- Booking ID 2: BK002 (pending)
- Có thể tạo thêm booking data bằng seed scripts

## 🚀 Production Considerations

### Security
- Không expose JWT token trong production
- Implement proper authentication flow
- Add rate limiting cho payment APIs

### Performance
- Implement pagination cho large datasets
- Add caching cho frequently accessed data
- Optimize database queries

### Monitoring
- Add logging cho payment transactions
- Implement error tracking
- Monitor API response times

## 📝 Notes

- Giao diện này chỉ dành cho testing và development
- Không sử dụng trong production environment
- ZaloPay integration sử dụng sandbox environment
- Mock responses được enable để test flow mà không cần ZaloPay thật
