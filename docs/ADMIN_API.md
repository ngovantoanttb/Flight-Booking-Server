<!-- @format -->

# Admin API Documentation

## Overview

Admin API cung cấp các endpoint để quản lý toàn bộ hệ thống đặt vé máy bay. Tất cả các endpoint đều yêu cầu authentication với role `admin`.

## Authentication

Tất cả các API admin yêu cầu:

- Header: `Authorization: Bearer <jwt_token>`
- User phải có role `admin`

## Base URL

```
/api/admin
```

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "meta": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Paginated Response

```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [ ... ],
  "meta": {
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 100,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Airlines Management

### Get All Airlines

```http
GET /api/admin/airlines?page=1&limit=10&search=Vietnam&is_active=true
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search by airline name or code
- `is_active` (optional): Filter by active status (true/false)

### Get Airline by ID

```http
GET /api/admin/airlines/:id
```

### Create Airline

```http
POST /api/admin/airlines
Content-Type: application/json

{
  "airline_code": "VN",
  "airline_name": "Vietnam Airlines",
  "logo_url": "https://example.com/logo.png",
  "is_active": true
}
```

### Update Airline

```http
PUT /api/admin/airlines/:id
Content-Type: application/json

{
  "airline_name": "Vietnam Airlines Corporation",
  "is_active": false
}
```

### Delete Airline

```http
DELETE /api/admin/airlines/:id
```

## Airports Management

### Get All Airports

```http
GET /api/admin/airports?page=1&limit=10&search=Ho Chi Minh&country_id=1
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search by airport name, code, or city
- `country_id` (optional): Filter by country ID

### Get Airport by ID

```http
GET /api/admin/airports/:id
```

### Create Airport

```http
POST /api/admin/airports
Content-Type: application/json

{
  "airport_code": "SGN",
  "airport_name": "Tan Son Nhat International Airport",
  "city": "Ho Chi Minh City",
  "country_id": 1,
  "latitude": 10.8188,
  "longitude": 106.6520
}
```

### Update Airport

```http
PUT /api/admin/airports/:id
Content-Type: application/json

{
  "airport_name": "Tan Son Nhat International Airport (Updated)",
  "city": "Ho Chi Minh City"
}
```

### Delete Airport

```http
DELETE /api/admin/airports/:id
```

## Countries Management

### Get All Countries

```http
GET /api/admin/countries?page=1&limit=10&search=Vietnam
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search by country name or code

### Get Country by ID

```http
GET /api/admin/countries/:id
```

### Create Country

```http
POST /api/admin/countries
Content-Type: application/json

{
  "country_code": "VN",
  "country_name": "Vietnam"
}
```

### Update Country

```http
PUT /api/admin/countries/:id
Content-Type: application/json

{
  "country_name": "Vietnam (Updated)"
}
```

### Delete Country

```http
DELETE /api/admin/countries/:id
```

## Aircraft Management

### Get All Aircraft

```http
GET /api/admin/aircraft?page=1&limit=10&search=Boeing&airline_id=1
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search by aircraft model
- `airline_id` (optional): Filter by airline ID

### Get Aircraft by ID

```http
GET /api/admin/aircraft/:id
```

### Create Aircraft

```http
POST /api/admin/aircraft
Content-Type: application/json

{
  "airline_id": 1,
  "model": "Boeing 737-800",
  "total_seats": 180,
  "business_seats": 20,
  "economy_seats": 160
}
```

### Update Aircraft

```http
PUT /api/admin/aircraft/:id
Content-Type: application/json

{
  "model": "Boeing 737-800 (Updated)",
  "total_seats": 190,
  "business_seats": 25,
  "economy_seats": 165
}
```

### Delete Aircraft

```http
DELETE /api/admin/aircraft/:id
```

## Passengers Management

### Get All Passengers

```http
GET /api/admin/passengers?page=1&limit=10&search=John
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search by first name, last name, or passport number

### Get Passenger by ID

```http
GET /api/admin/passengers/:id
```

### Create Passenger

```http
POST /api/admin/passengers
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "date_of_birth": "1990-01-01",
  "nationality": "Vietnamese",
  "passport_number": "A1234567",
  "passport_expiry": "2030-01-01"
}
```

### Update Passenger

```http
PUT /api/admin/passengers/:id
Content-Type: application/json

{
  "first_name": "John (Updated)",
  "nationality": "American"
}
```

### Delete Passenger

```http
DELETE /api/admin/passengers/:id
```

## Promotions Management

### Get All Promotions

```http
GET /api/admin/promotions?page=1&limit=10&search=SUMMER&is_active=true
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search by promotion code or description
- `is_active` (optional): Filter by active status (true/false)

### Get Promotion by ID

```http
GET /api/admin/promotions/:id
```

### Create Promotion

```http
POST /api/admin/promotions
Content-Type: application/json

{
  "promotion_code": "SUMMER2024",
  "description": "Summer promotion 2024",
  "discount_type": "percentage",
  "discount_value": 20.00,
  "min_purchase": 1000000.00,
  "start_date": "2024-06-01",
  "end_date": "2024-08-31",
  "usage_limit": 1000,
  "is_active": true
}
```

### Update Promotion

```http
PUT /api/admin/promotions/:id
Content-Type: application/json

{
  "discount_value": 25.00,
  "is_active": false
}
```

### Delete Promotion

```http
DELETE /api/admin/promotions/:id
```

## Bookings Management

### Get All Bookings

```http
GET /api/admin/bookings?page=1&limit=10&search=ABC123&status=confirmed&payment_status=paid&date_from=2024-01-01&date_to=2024-12-31
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search by booking reference or contact email
- `status` (optional): Filter by booking status (pending, confirmed, cancelled, completed)
- `payment_status` (optional): Filter by payment status (pending, paid, refunded, failed)
- `date_from` (optional): Filter bookings from date (YYYY-MM-DD)
- `date_to` (optional): Filter bookings to date (YYYY-MM-DD)

### Get Booking by ID

```http
GET /api/admin/bookings/:id
```

### Update Booking Status

```http
PUT /api/admin/bookings/:id/status
Content-Type: application/json

{
  "status": "cancelled",
  "payment_status": "refunded",
  "cancellation_reason": "Customer request"
}
```

### Cancellation Rejection Email (Từ chối hủy vé)

- Khi nào: hệ thống sẽ gửi email thông báo tới `contact_email` của booking trong hai trường hợp:

  - Admin gọi endpoint với `action: "reject_cancellation"` (ưu tiên).
  - Hoặc admin cập nhật trực tiếp `status` thành `cancellation_rejected` (ví dụ: `{"status":"cancellation_rejected"}`).

- Subject email: `Cancellation Request Rejected - <booking_reference>`

- Payload thông tin được gửi/ghi nhận (ví dụ):

```json
{
  "booking_id": 123,
  "user_id": 456,
  "booking_reference": "ABC123",
  "reason": "Lý do từ chối do admin cung cấp"
}
```

- Hành vi hệ thống:

  - Gọi `emailService.sendCancellationRejection(email, payload)` để gửi email thực tế (hoặc mock/ethereal tùy cấu hình).
  - Ghi bản ghi vào bảng `EmailNotification` với `notification_type: 'other'` và `email_subject` tương ứng.

- Lưu ý cho developer:
  - Nếu không cung cấp `reject_reason`, hệ thống sẽ sử dụng thông điệp mặc định: `Your cancellation request was denied by administration.`
  - Template email hiện tại là văn bản đơn giản (plain text) với nội dung chứa booking reference và lý do; có thể mở rộng thành HTML nếu cần (xem `src/services/realEmailService.js`).

### Delete Booking

```http
DELETE /api/admin/bookings/:id
```

## Users Management

### Get All Users

```http
GET /api/admin/users?page=1&limit=10&search=john@example.com&is_active=true
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search by email, first name, or last name
- `is_active` (optional): Filter by active status (true/false)

### Get User by ID

```http
GET /api/admin/users/:id
```

### Update User

```http
PUT /api/admin/users/:id
Content-Type: application/json

{
  "first_name": "John (Updated)",
  "last_name": "Doe (Updated)",
  "phone": "+84901234567"
}
```

### Update User Status

```http
PUT /api/admin/users/:id/status
Content-Type: application/json

{
  "is_active": false
}
```

## Travel Classes Management

### Get All Travel Classes

```http
GET /api/admin/travel-classes?page=1&limit=10&search=Economy
```

### Get Travel Class by ID

```http
GET /api/admin/travel-classes/:id
```

### Create Travel Class

```http
POST /api/admin/travel-classes
Content-Type: application/json

{
  "class_name": "Premium Economy",
  "class_code": "PE",
  "description": "Premium Economy class with extra legroom"
}
```

### Update Travel Class

```http
PUT /api/admin/travel-classes/:id
Content-Type: application/json

{
  "class_name": "Premium Economy (Updated)",
  "description": "Updated description"
}
```

### Delete Travel Class

```http
DELETE /api/admin/travel-classes/:id
```

## Baggage Options Management

### Get All Baggage Options

```http
GET /api/admin/baggage-options?page=1&limit=10&search=20kg&airline_id=1
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search by description
- `airline_id` (optional): Filter by airline ID

### Get Baggage Option by ID

```http
GET /api/admin/baggage-options/:id
```

### Create Baggage Option

```http
POST /api/admin/baggage-options
Content-Type: application/json

{
  "airline_id": 1,
  "weight_kg": 20.00,
  "price": 500000.00,
  "description": "20kg checked baggage"
}
```

### Update Baggage Option

```http
PUT /api/admin/baggage-options/:id
Content-Type: application/json

{
  "price": 600000.00,
  "description": "20kg checked baggage (Updated)"
}
```

### Delete Baggage Option

```http
DELETE /api/admin/baggage-options/:id
```

## Meal Options Management

### Get All Meal Options

```http
GET /api/admin/meal-options?page=1&limit=10&search=Chicken&airline_id=1&is_vegetarian=false&is_halal=true
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search by meal name or description
- `airline_id` (optional): Filter by airline ID
- `is_vegetarian` (optional): Filter by vegetarian status (true/false)
- `is_halal` (optional): Filter by halal status (true/false)

### Get Meal Option by ID

```http
GET /api/admin/meal-options/:id
```

### Create Meal Option

```http
POST /api/admin/meal-options
Content-Type: application/json

{
  "airline_id": 1,
  "meal_name": "Chicken Rice",
  "meal_description": "Grilled chicken with steamed rice",
  "price": 150000.00,
  "is_vegetarian": false,
  "is_halal": true
}
```

### Update Meal Option

```http
PUT /api/admin/meal-options/:id
Content-Type: application/json

{
  "price": 180000.00,
  "meal_description": "Updated description"
}
```

### Delete Meal Option

```http
DELETE /api/admin/meal-options/:id
```

## Statistics and Reports

### Get Overview Statistics

```http
GET /api/admin/stats/overview
```

**Response:**

```json
{
  "success": true,
  "message": "Overview statistics retrieved successfully",
  "data": {
    "total_users": 1500,
    "total_bookings": 5000,
    "total_revenue": 2500000000.0,
    "total_flights": 200,
    "active_promotions": 5
  }
}
```

### Get Revenue Statistics

```http
GET /api/admin/stats/revenue?period=month
```

**Query Parameters:**

- `period` (optional): Period for statistics (day, week, month, year) - default: month

**Response:**

```json
{
  "success": true,
  "message": "Revenue statistics retrieved successfully",
  "data": {
    "period": "month",
    "current_revenue": 500000000.0,
    "previous_revenue": 450000000.0,
    "growth_rate": 11.11
  }
}
```

### Get Booking Statistics

```http
GET /api/admin/stats/bookings?period=month
```

**Query Parameters:**

- `period` (optional): Period for statistics (day, week, month, year) - default: month

**Response:**

```json
{
  "success": true,
  "message": "Booking statistics retrieved successfully",
  "data": {
    "period": "month",
    "total_bookings": 1000,
    "confirmed_bookings": 950,
    "cancelled_bookings": 50,
    "confirmation_rate": 95
  }
}
```

### Get Airline Statistics

```http
GET /api/admin/stats/airlines
```

**Response:**

```json
{
  "success": true,
  "message": "Airline statistics retrieved successfully",
  "data": [
    {
      "airline_name": "Vietnam Airlines",
      "airline_code": "VN",
      "booking_count": 2000,
      "total_revenue": 1000000000.0
    }
  ]
}
```

### Get Passenger Statistics

```http
GET /api/admin/stats/passengers?period=month
```

**Query Parameters:**

- `period` (optional): Period for statistics (day, week, month, year) - default: month

**Response:**

```json
{
  "success": true,
  "message": "Passenger statistics retrieved successfully",
  "data": {
    "period": "month",
    "total_passengers": 2000
  }
}
```

### Get Baggage Statistics

```http
GET /api/admin/stats/baggage
```

**Response:**

```json
{
  "success": true,
  "message": "Baggage statistics retrieved successfully",
  "data": [
    {
      "weight_kg": 20.0,
      "description": "20kg checked baggage",
      "usage_count": 500,
      "total_revenue": 250000000.0
    }
  ]
}
```

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Validation error",
  "meta": {
    "errors": [
      {
        "field": "airline_code",
        "message": "Airline code must be 2 characters"
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
  "message": "Not authorized to access this route",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "Not authorized to access this route",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Airline not found",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Internal server error",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Notes

1. **Authentication Required**: Tất cả các endpoint đều yêu cầu JWT token với role admin
2. **Pagination**: Tất cả các endpoint list đều hỗ trợ pagination
3. **Search**: Hầu hết các endpoint đều hỗ trợ tìm kiếm
4. **Validation**: Tất cả input đều được validate theo chuẩn
5. **Error Handling**: Tất cả lỗi đều được xử lý và trả về format chuẩn
6. **Logging**: Tất cả operations đều được log để audit
7. **Data Integrity**: Các operations delete đều kiểm tra foreign key constraints
