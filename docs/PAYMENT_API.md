# Payment API Documentation

## Tổng quan

API thanh toán ZaloPay cho hệ thống Flight Booking. Hỗ trợ tạo thanh toán, xử lý callback, kiểm tra trạng thái và hoàn tiền.

## Base URL
```
/api/payments
```

## Authentication

Tất cả các endpoint (trừ callback) đều yêu cầu JWT token trong header:
```
Authorization: Bearer <token>
```

## Endpoints

### 1. Tạo thanh toán ZaloPay

**POST** `/zalopay/create`

Tạo đơn hàng thanh toán ZaloPay cho booking.

#### Request Body
```json
{
  "booking_id": 123
}
```

#### Response
```json
{
  "success": true,
  "message": "Payment created successfully",
  "data": {
    "payment_url": "https://sb-openapi.zalopay.vn/v2/pay/...",
    "app_trans_id": "240101_123456",
    "amount": 1500000,
    "booking_reference": "AB1234"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Xử lý Callback từ ZaloPay

**POST** `/zalopay/callback`

Endpoint để ZaloPay gọi khi thanh toán hoàn tất. Không cần authentication.

#### Request Body (từ ZaloPay)
```json
{
  "data": "encrypted_data",
  "mac": "signature"
}
```

#### Response
```json
{
  "return_code": 1,
  "return_message": "success"
}
```

### 3. Kiểm tra trạng thái thanh toán

**POST** `/zalopay/status`

Kiểm tra trạng thái thanh toán từ ZaloPay.

#### Request Body
```json
{
  "app_trans_id": "240101_123456"
}
```

#### Response
```json
{
  "success": true,
  "message": "Payment status retrieved successfully",
  "data": {
    "app_trans_id": "240101_123456",
    "status": {
      "return_code": 1,
      "return_message": "",
      "sub_return_code": 1,
      "sub_return_message": "",
      "is_processing": false,
      "amount": 1500000,
      "zp_trans_id": 240101000000175,
      "server_time": 1711857138483,
      "discount_amount": 0
    },
    "local_status": "completed",
    "booking_status": "confirmed"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 4. Tạo hoàn tiền

**POST** `/zalopay/refund`

Tạo yêu cầu hoàn tiền cho booking.

#### Request Body
```json
{
  "booking_id": 123,
  "amount": 1500000,
  "reason": "Customer request"
}
```

#### Response
```json
{
  "success": true,
  "message": "Refund created successfully",
  "data": {
    "booking_id": 123,
    "refund_amount": 1500000,
    "refund_result": {
      "return_code": 1,
      "return_message": "success"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 5. Lịch sử thanh toán

**GET** `/history`

Lấy lịch sử thanh toán của user.

#### Query Parameters
- `page` (optional): Số trang (default: 1)
- `limit` (optional): Số items per page (default: 10, max: 100)

#### Response
```json
{
  "success": true,
  "message": "Payment history retrieved successfully",
  "data": {
    "payments": [
      {
        "payment_id": 1,
        "amount": 1500000,
        "payment_method": "zalopay",
        "payment_reference": "240101_123456",
        "status": "completed",
        "payment_date": "2024-01-01T10:00:00.000Z",
        "booking": {
          "booking_reference": "AB1234",
          "booking_date": "2024-01-01T09:00:00.000Z",
          "total_amount": 1500000,
          "status": "confirmed"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "meta": {
    "errors": [
      {
        "field": "booking_id",
        "message": "Booking ID is required"
      }
    ]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access denied. No token provided.",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Booking not found or already processed",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "ZaloPay create payment failed: Invalid amount",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Luồng thanh toán

1. **Tạo booking** - User tạo booking với status 'pending'
2. **Tạo thanh toán** - Gọi `/zalopay/create` để tạo đơn hàng
3. **Thanh toán** - User thanh toán qua ZaloPay
4. **Callback** - ZaloPay gọi `/zalopay/callback` khi hoàn tất
5. **Cập nhật trạng thái** - Booking được cập nhật thành 'confirmed'

## Cấu hình ZaloPay

### Sandbox (Test)
- App ID: `2553`
- Key1: `PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL`
- Key2: `kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz`
- Test STK: `4111 1111 1111 1111`

### Production
Cần đăng ký tài khoản ZaloPay và lấy thông tin từ ZaloPay Developer Portal.

## Bảo mật

1. **MAC Verification**: Tất cả callback từ ZaloPay đều được verify MAC signature
2. **User Authorization**: Chỉ user sở hữu booking mới có thể tạo thanh toán
3. **HTTPS**: Bắt buộc sử dụng HTTPS trong production
4. **Environment Variables**: Lưu trữ thông tin nhạy cảm trong environment variables

## Testing

### Test với Sandbox
1. Sử dụng test STK: `4111 1111 1111 1111`
2. Sử dụng test amount (ví dụ: 1000 VND)
3. Kiểm tra callback URL có thể truy cập được

### Test Callback
Sử dụng ngrok để expose local server:
```bash
ngrok http 3000
```

Cập nhật `ZALOPAY_CALLBACK_URL` với ngrok URL.
