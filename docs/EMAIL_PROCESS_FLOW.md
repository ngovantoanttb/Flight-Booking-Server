# Quy Trình Gửi Email Cho Người Dùng

## Tổng Quan

Hệ thống Flight Booking sử dụng **Nodemailer** để gửi email thông báo cho người dùng. Tất cả email được gửi đều được lưu vào bảng `email_notifications` để theo dõi và audit.

## Kiến Trúc Email Service

### 1. Cấu Trúc Module

```
src/config/emailConfig.js
    ↓ (exports)
src/services/realEmailService.js
    ↓ (sử dụng)
src/controllers/*.js (bookingController, paymentController, adminController)
```

### 2. Email Service Configuration

**File:** `src/config/emailConfig.js`

- Module này export `realEmailService` làm email service chính
- Tự động fallback sang Ethereal Mail nếu không có cấu hình SMTP

**File:** `src/services/realEmailService.js`

- Sử dụng Nodemailer để gửi email thực tế
- Hỗ trợ 2 chế độ:
  - **Production**: Sử dụng SMTP thực (Gmail, SendGrid, etc.)
  - **Development**: Sử dụng Ethereal Mail (test account tự động)

## Quy Trình Gửi Email

### Bước 1: Khởi Tạo Transporter

```javascript
// File: src/services/realEmailService.js

const createTransporter = async () => {
  // Kiểm tra cấu hình SMTP từ environment variables
  if (config.EMAIL_HOST && config.EMAIL_USER && config.EMAIL_PASS) {
    // Sử dụng SMTP thực
    const transporter = nodemailer.createTransport({
      host: config.EMAIL_HOST,
      port: config.EMAIL_PORT || 587,
      secure: config.EMAIL_PORT === 465,
      auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASS,
      },
    });
    return { transporter, useEthereal: false };
  } else {
    // Fallback: Sử dụng Ethereal Mail (development)
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    return { transporter, testAccount, useEthereal: true };
  }
};
```

### Bước 2: Gọi Email Service từ Controller

**Ví dụ: Gửi email xác nhận đặt vé**

```javascript
// File: src/controllers/bookingController.js

// Sau khi tạo booking thành công
try {
  if (
    emailService &&
    typeof emailService.sendBookingConfirmation === 'function'
  ) {
    // Lấy thông tin flight details
    const flightDetails = await Flight.findByPk(flight_id, {
      include: [Airline, DepartureAirport, ArrivalAirport]
    });

    // Gọi email service
    await emailService.sendBookingConfirmation(
      booking.contact_email,  // Email người nhận
      {
        booking_id: booking.booking_id,
        user_id: user_id,
        booking_reference: booking.booking_reference,
        flight: flightDetails,
        passengers: passengers,
        total_amount: booking.total_amount,
        // ... các thông tin khác
      }
    );
  }
} catch (emailErr) {
  // Log lỗi nhưng không làm fail booking
  logger.warn('Failed to send booking confirmation email:', emailErr);
}
```

### Bước 3: Tạo Nội Dung Email

**File:** `src/services/realEmailService.js`

Mỗi loại email có hàm riêng để tạo nội dung HTML:

1. **sendBookingConfirmation**: Email xác nhận đặt vé
   - Chứa thông tin booking reference
   - Chi tiết chuyến bay (flight number, route, thời gian)
   - Danh sách hành khách
   - Bảng chi tiết thanh toán (payment breakdown)
   - Tổng tiền, giảm giá, thuế

2. **sendPaymentConfirmation**: Email xác nhận thanh toán
   - Thông tin thanh toán (amount, payment method)
   - Booking reference
   - Transaction ID (nếu có)

3. **sendCancellationRequest**: Email yêu cầu hủy vé
   - Thông tin booking cần hủy
   - Lý do hủy (nếu có)

4. **sendCancellationNotification**: Email thông báo hủy vé thành công
   - Xác nhận đã hủy
   - Thông tin hoàn tiền (nếu có)

5. **sendCancellationRejection**: Email từ chối yêu cầu hủy
   - Lý do từ chối

### Bước 4: Gửi Email Qua Nodemailer

```javascript
// File: src/services/realEmailService.js

const info = await transporter.sendMail({
  from: config.EMAIL_FROM || 'Flight Booking <noreply@flightbooking.com>',
  to: email,
  subject: subject,
  html: htmlContent,  // Nội dung HTML
  text: textContent,   // Nội dung text thuần (fallback)
});

// Log kết quả
logger.info(`Email sent: ${info.messageId}`);

// Nếu dùng Ethereal, log preview URL
if (useEthereal && info.messageId) {
  logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
}
```

### Bước 5: Lưu Vào Database

Sau khi gửi email thành công, hệ thống lưu record vào bảng `email_notifications`:

```javascript
await EmailNotification.create({
  user_id: bookingData.user_id || 0,
  booking_id: bookingData.booking_id,
  notification_type: "booking_confirmation",  // hoặc "cancellation", "payment_confirmation", etc.
  email_subject: subject,
  email_content: htmlContent,  // Lưu toàn bộ HTML content
  status: "sent",  // hoặc "failed", "pending"
  sent_at: new Date(),
});
```

## Các Điểm Gửi Email Trong Hệ Thống

### 1. Khi Tạo Booking Thành Công

**File:** `src/controllers/bookingController.js` - `createBooking()`

- Gửi email xác nhận đặt vé ngay sau khi booking được tạo
- Email chứa thông tin booking, flight details, passengers, và payment breakdown

### 2. Khi Thanh Toán Thành Công

**File:** `src/controllers/paymentController.js` - `handlePaymentSuccess()`

- Gửi email xác nhận thanh toán khi payment status = 'completed'
- Có thể gửi lại email booking confirmation nếu chưa gửi trước đó

### 3. Khi Yêu Cầu Hủy Vé

**File:** `src/controllers/bookingController.js` - `requestCancellation()`

- Gửi email thông báo yêu cầu hủy đã được gửi
- Thông báo đang chờ admin xử lý

### 4. Khi Admin Xử Lý Hủy Vé

**File:** `src/controllers/adminController.js` - `updateBookingStatus()`

- **Nếu chấp nhận hủy**: Gửi `sendCancellationNotification`
- **Nếu từ chối**: Gửi `sendCancellationRejection`

## Xử Lý Lỗi

### 1. Lỗi Gửi Email Không Làm Fail Business Logic

```javascript
try {
  await emailService.sendBookingConfirmation(...);
} catch (emailErr) {
  // Chỉ log warning, không throw error
  // Booking vẫn được tạo thành công
  logger.warn('Failed to send email:', emailErr);
}
```

**Lý do:**
- Email là tính năng phụ, không phải core business logic
- Người dùng vẫn có thể xem booking trên website
- Email có thể gửi lại sau

### 2. Lưu Trạng Thái Failed

Nếu gửi email thất bại, có thể lưu status = "failed" vào database để retry sau:

```javascript
await EmailNotification.create({
  // ...
  status: "failed",
});
```

## Cấu Hình Environment Variables

### Development (Ethereal Mail)

Không cần cấu hình gì, hệ thống tự động tạo test account.

### Production

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Flight Booking <your-email@gmail.com>
```

**Lưu ý với Gmail:**
- Cần sử dụng App Password, không dùng mật khẩu thường
- Bật 2-Step Verification trước
- Tạo App Password tại: https://myaccount.google.com/apppasswords

## Database Schema

**Bảng:** `email_notifications`

```sql
CREATE TABLE email_notifications (
  notification_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  booking_id INT NOT NULL,
  notification_type ENUM('booking_confirmation', 'cancellation', 'check_in_reminder', 'other'),
  email_subject VARCHAR(255) NOT NULL,
  email_content TEXT NOT NULL,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status ENUM('sent', 'failed', 'pending') DEFAULT 'pending',
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
);
```

## Luồng Hoạt Động Tổng Quan

```
User Action
    ↓
Controller (bookingController, paymentController, etc.)
    ↓
Business Logic (create booking, process payment, etc.)
    ↓
Email Service (realEmailService)
    ↓
1. createTransporter() → Tạo Nodemailer transporter
    ↓
2. Generate HTML content → Tạo nội dung email
    ↓
3. transporter.sendMail() → Gửi email qua SMTP
    ↓
4. EmailNotification.create() → Lưu vào database
    ↓
Response to User (success/error)
```

## Best Practices

1. **Non-blocking**: Email gửi bất đồng bộ, không block main flow
2. **Error Handling**: Lỗi email không làm fail business logic
3. **Logging**: Log đầy đủ để debug và audit
4. **Database Tracking**: Lưu tất cả email đã gửi để audit trail
5. **Retry Mechanism**: Có thể implement retry cho failed emails
6. **Template Management**: HTML templates có thể tách ra file riêng để dễ maintain

## Cải Tiến Có Thể Thực Hiện

1. **Email Queue**: Sử dụng queue system (Bull, RabbitMQ) để xử lý email bất đồng bộ
2. **Email Templates**: Tách HTML templates ra file riêng (Handlebars, EJS)
3. **Retry Logic**: Tự động retry khi gửi email thất bại
4. **Email Scheduling**: Gửi email nhắc nhở (check-in reminder) theo lịch
5. **Email Analytics**: Track open rate, click rate
6. **Multi-language**: Hỗ trợ nhiều ngôn ngữ cho email



