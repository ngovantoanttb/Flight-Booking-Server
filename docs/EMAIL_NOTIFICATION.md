# Email Notification System

Hệ thống thông báo email cho ứng dụng Flight Booking.

## Tính năng

- Thông báo đặt vé thành công
- Thông báo hủy vé thành công
- Thông báo từ chối hủy vé

## Cấu hình

Hệ thống email hỗ trợ hai chế độ:

1. **Chế độ mô phỏng (Mock)**: Sử dụng cho môi trường phát triển, không gửi email thực tế nhưng vẫn ghi log và lưu thông báo vào database.

2. **Chế độ thực tế (Real)**: Sử dụng Nodemailer để gửi email thực sự đến người dùng.

### Cấu hình trong môi trường phát triển

Trong môi trường phát triển, hệ thống sử dụng Ethereal Mail để tạo tài khoản test email tự động. Các email không được gửi đến địa chỉ thực, nhưng bạn có thể xem chúng thông qua URL preview được hiển thị trong console log.

### Cấu hình trong môi trường sản xuất

Để sử dụng dịch vụ email thực tế (ví dụ: Gmail, SendGrid, ...), hãy cấu hình các biến môi trường sau trong file .env:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Flight Booking <your-email@gmail.com>
```

## Các loại email

1. **Booking Confirmation**: Gửi khi đặt vé thành công
2. **Cancellation Request**: Gửi khi người dùng yêu cầu hủy vé
3. **Cancellation Notification**: Gửi khi vé được hủy thành công
4. **Cancellation Rejection**: Gửi khi yêu cầu hủy vé bị từ chối

## Lưu trữ trong cơ sở dữ liệu

Tất cả các email gửi đi đều được lưu trong bảng `email_notifications` với các thông tin:
- Loại thông báo
- Tiêu đề email
- Nội dung email
- Thời gian gửi
- Trạng thái gửi