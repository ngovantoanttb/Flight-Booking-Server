# Dashboard và Analytics APIs - Tài liệu tổng hợp

## Tổng quan

Dự án đã được cập nhật với các API dashboard và analytics mới để hỗ trợ quản lý và báo cáo doanh thu, thống kê đặt chỗ, và xuất báo cáo Excel.

## 🚀 Dashboard APIs

### 1. Doanh thu tuần
**Endpoint:** `GET /api/admin/dashboard/weekly-revenue`

**Mô tả:** Lấy thống kê doanh thu tuần hiện tại với so sánh tuần trước.

**Response:**
```json
{
  "success": true,
  "message": "Weekly revenue statistics retrieved successfully",
  "data": {
    "period": "week",
    "total_revenue": 15000000,
    "total_bookings": 25,
    "percentage_change": 15.5,
    "previous_revenue": 13000000,
    "week_start": "2025-01-20T00:00:00.000Z",
    "week_end": "2025-01-26T23:59:59.999Z"
  }
}
```

### 2. Doanh thu tháng
**Endpoint:** `GET /api/admin/dashboard/monthly-revenue`

**Mô tả:** Lấy thống kê doanh thu tháng hiện tại.

**Response:**
```json
{
  "success": true,
  "message": "Monthly revenue statistics retrieved successfully",
  "data": {
    "period": "month",
    "total_revenue": 50000000,
    "total_bookings": 150,
    "month_start": "2025-01-01T00:00:00.000Z",
    "month_end": "2025-01-31T23:59:59.999Z"
  }
}
```

### 3. Đặt chỗ hôm nay
**Endpoint:** `GET /api/admin/dashboard/today-bookings`

**Mô tả:** Lấy thống kê đặt chỗ và vé bán ra trong ngày.

**Response:**
```json
{
  "success": true,
  "message": "Today booking statistics retrieved successfully",
  "data": {
    "date": "2025-01-26T10:30:00.000Z",
    "total_bookings": 8,
    "total_tickets_sold": 12
  }
}
```

### 4. Thống kê người dùng
**Endpoint:** `GET /api/admin/dashboard/user-stats`

**Mô tả:** Lấy thống kê tổng quan về người dùng và hành khách.

**Response:**
```json
{
  "success": true,
  "message": "User statistics retrieved successfully",
  "data": {
    "total_users": 500,
    "total_passengers": 1200,
    "passenger_ratio": 240.0
  }
}
```

## 📊 Analytics APIs

### 5. Thị phần hãng hàng không
**Endpoint:** `GET /api/admin/analytics/airline-market-share`

**Query Parameters:**
- `period`: `7days`, `14days`, `month`, `3months`, `6months`, `12months` (default: `month`)

**Mô tả:** Lấy thống kê thị phần của các hãng hàng không theo khoảng thời gian.

**Response:**
```json
{
  "success": true,
  "message": "Airline market share statistics retrieved successfully",
  "data": {
    "period": "month",
    "period_start": "2025-01-01T00:00:00.000Z",
    "period_end": "2025-01-26T10:30:00.000Z",
    "total_tickets": 150,
    "airlines": [
      {
        "airline_id": 1,
        "airline_code": "VN",
        "airline_name": "Vietnam Airlines",
        "ticket_count": 75,
        "market_share_percentage": 50.0
      }
    ]
  }
}
```

### 6. Xu hướng doanh thu
**Endpoint:** `GET /api/admin/analytics/revenue-trend`

**Query Parameters:**
- `month`: Tháng (1-12, default: tháng hiện tại)
- `year`: Năm (default: năm hiện tại)

**Mô tả:** Lấy xu hướng doanh thu theo ngày trong tháng.

**Response:**
```json
{
  "success": true,
  "message": "Revenue trend statistics retrieved successfully",
  "data": {
    "month": 1,
    "year": 2025,
    "month_start": "2025-01-01T00:00:00.000Z",
    "month_end": "2025-01-31T23:59:59.999Z",
    "total_orders": 150,
    "total_revenue": 50000000,
    "daily_revenue": [
      {
        "date": "2025-01-01",
        "orders_count": 5,
        "revenue": 2000000
      }
    ]
  }
}
```

### 7. Thống kê đặt chỗ
**Endpoint:** `GET /api/admin/analytics/booking-stats`

**Query Parameters:**
- `period`: `7days`, `14days`, `month`, `3months`, `6months`, `12months` (default: `month`)

**Mô tả:** Lấy thống kê đặt chỗ và số vé bán ra theo khoảng thời gian.

**Response:**
```json
{
  "success": true,
  "message": "Booking statistics retrieved successfully",
  "data": {
    "period": "month",
    "period_start": "2025-01-01T00:00:00.000Z",
    "period_end": "2025-01-26T10:30:00.000Z",
    "total_bookings": 150,
    "total_passengers": 300,
    "daily_stats": [
      {
        "date": "2025-01-01",
        "bookings_count": 5,
        "passengers_count": 10
      }
    ]
  }
}
```

### 8. Thống kê dịch vụ hành lý
**Endpoint:** `GET /api/admin/analytics/baggage-service-stats`

**Query Parameters:**
- `period`: `7days`, `14days`, `month`, `3months`, `6months`, `12months` (default: `month`)

**Mô tả:** Lấy thống kê dịch vụ hành lý và doanh thu.

**Response:**
```json
{
  "success": true,
  "message": "Baggage service statistics retrieved successfully",
  "data": {
    "period": "month",
    "period_start": "2025-01-01T00:00:00.000Z",
    "period_end": "2025-01-26T10:30:00.000Z",
    "total_orders": 50,
    "total_revenue": 5000000,
    "baggage_services": [
      {
        "baggage_id": 1,
        "weight_kg": 20,
        "description": "Extra Baggage 20kg",
        "unit_price": 500000,
        "usage_count": 25,
        "total_revenue": 12500000
      }
    ]
  }
}
```

## 📄 Excel Export APIs

### 9. Xuất báo cáo thị phần hãng hàng không
**Endpoint:** `GET /api/admin/analytics/airline-market-share/export`

**Query Parameters:**
- `period`: `7days`, `14days`, `month`, `3months`, `6months`, `12months` (default: `month`)

**Mô tả:** Xuất file Excel báo cáo thị phần hãng hàng không.

**Response:** File Excel (.xlsx)

### 10. Xuất báo cáo doanh thu tháng
**Endpoint:** `GET /api/admin/analytics/revenue-trend/export`

**Query Parameters:**
- `month`: Tháng (1-12, default: tháng hiện tại)
- `year`: Năm (default: năm hiện tại)

**Mô tả:** Xuất file Excel báo cáo doanh thu theo ngày trong tháng.

**Response:** File Excel (.xlsx)

### 11. Xuất báo cáo đặt chỗ
**Endpoint:** `GET /api/admin/analytics/booking-stats/export`

**Query Parameters:**
- `period`: `7days`, `14days`, `month`, `3months`, `6months`, `12months` (default: `month`)

**Mô tả:** Xuất file Excel báo cáo thống kê đặt chỗ.

**Response:** File Excel (.xlsx)

### 12. Xuất báo cáo dịch vụ hành lý
**Endpoint:** `GET /api/admin/analytics/baggage-service-stats/export`

**Query Parameters:**
- `period`: `7days`, `14days`, `month`, `3months`, `6months`, `12months` (default: `month`)

**Mô tả:** Xuất file Excel báo cáo thống kê dịch vụ hành lý.

**Response:** File Excel (.xlsx)

**Nội dung file Excel:**
- Báo cáo dịch vụ hành lý theo thời gian
- Thông tin chi tiết từng dịch vụ: mã dịch vụ, trọng lượng, mô tả, đơn giá, số lượng sử dụng, tổng doanh thu
- Tổng cộng số đơn hàng và doanh thu

## 🔍 User Booking Lookup API

### 13. Tra cứu mã đặt chỗ
**Endpoint:** `GET /api/booking-lookup/lookup/{bookingReference}`

**Mô tả:** API công khai để người dùng tra cứu thông tin đặt chỗ bằng mã đặt chỗ.

**Path Parameters:**
- `bookingReference`: Mã đặt chỗ (6-10 ký tự, chỉ chữ hoa và số)

**Response:**
```json
{
  "success": true,
  "message": "Booking retrieved successfully",
  "data": {
    "booking_id": 1,
    "booking_reference": "ABC123",
    "booking_date": "2025-01-26T10:30:00.000Z",
    "status": "confirmed",
    "payment_status": "paid",
    "total_amount": 2000000,
    "contact_email": "user@example.com",
    "contact_phone": "+84901234567",
    "user": {
      "user_id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe"
    },
    "passengers": [
      {
        "passenger": {
          "passenger_id": 1,
          "first_name": "John",
          "last_name": "Doe",
          "date_of_birth": "1990-01-01",
          "gender": "male",
          "nationality": "VN",
          "passport_number": "P12345678"
        },
        "flight": {
          "flight_id": 1,
          "flight_number": "VN123",
          "airline": {
            "airline_id": 1,
            "airline_name": "Vietnam Airlines",
            "airline_code": "VN",
            "logo_url": "https://example.com/logo.png"
          },
          "departure_airport": {
            "airport_id": 1,
            "airport_code": "SGN",
            "airport_name": "Tan Son Nhat International Airport",
            "city": "Ho Chi Minh City"
          },
          "arrival_airport": {
            "airport_id": 2,
            "airport_code": "HAN",
            "airport_name": "Noi Bai International Airport",
            "city": "Hanoi"
          },
          "departure_time": "2025-01-27T08:00:00.000Z",
          "arrival_time": "2025-01-27T10:00:00.000Z",
          "duration": 120
        },
        "travel_class": {
          "class_id": 1,
          "class_name": "Economy",
          "class_code": "economy"
        },
        "seat_number": "12A",
        "price": 1000000
      }
    ],
    "ticket_type_counts": [
      {
        "class_name": "Economy",
        "class_code": "economy",
        "count": 2
      }
    ],
    "payment": {
      "payment_id": 1,
      "amount": 2000000,
      "payment_method": "credit_card",
      "status": "completed",
      "created_at": "2025-01-26T10:30:00.000Z"
    },
    "created_at": "2025-01-26T10:30:00.000Z",
    "updated_at": "2025-01-26T10:30:00.000Z"
  }
}
```

## 🔧 Cập nhật API Admin Đặt chỗ

### 13. Admin Bookings (Enhanced)
**Endpoint:** `GET /api/admin/bookings`

**Mô tả:** API admin đặt chỗ đã được cập nhật để hiển thị loại vé và số lượng loại vé.

**Response Enhancement:**
```json
{
  "success": true,
  "message": "Bookings retrieved successfully",
  "data": [
    {
      "booking_id": 1,
      "booking_reference": "ABC123",
      "booking_date": "2025-01-26T10:30:00.000Z",
      "status": "confirmed",
      "payment_status": "paid",
      "total_amount": 2000000,
      "contact_email": "user@example.com",
      "contact_phone": "+84901234567",
      "user": {
        "user_id": 1,
        "email": "user@example.com",
        "first_name": "John",
        "last_name": "Doe"
      },
      "BookingDetails": [...],
      "ticket_type_counts": [
        {
          "class_name": "Economy",
          "class_code": "economy",
          "count": 2
        },
        {
          "class_name": "Business",
          "class_code": "business",
          "count": 1
        }
      ],
      "created_at": "2025-01-26T10:30:00.000Z",
      "updated_at": "2025-01-26T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

## 🧪 Testing

### Chạy test Dashboard APIs
```bash
npm run test:dashboard
```

### Các script test khác
```bash
npm run test:airlines      # Test Airlines API
npm run test:airports      # Test Airports API
npm run test:all-airports  # Test Get All Airports API
npm run test:passengers    # Test Passenger Management APIs
```

## 📋 Yêu cầu Authentication

- **Dashboard APIs**: Yêu cầu admin token
- **Analytics APIs**: Yêu cầu admin token
- **Excel Export APIs**: Yêu cầu admin token
- **User Booking Lookup API**: Không cần authentication (public API)

## 🔐 Headers Required

```javascript
{
  'Authorization': 'Bearer <admin-token>',
  'Content-Type': 'application/json'
}
```

## 📝 Ghi chú

1. Tất cả các API dashboard và analytics đều yêu cầu quyền admin.
2. API tra cứu đặt chỗ là public API, không cần authentication.
3. Excel export APIs trả về file binary, cần set header `Accept: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
4. Tất cả các API đều hỗ trợ error handling và logging chi tiết.
5. Dữ liệu được format theo chuẩn VNĐ cho các số tiền.
6. Thời gian được trả về theo format ISO 8601.

## 🚀 Deployment Notes

1. Đảm bảo đã cài đặt package `xlsx` cho Excel export functionality.
2. Kiểm tra database connections và permissions.
3. Cấu hình environment variables cho admin tokens.
4. Test tất cả APIs trước khi deploy production.
