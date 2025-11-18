# Flight Services API Documentation

## Tổng quan

Flight Services API cho phép quản lý các dịch vụ đi kèm với chuyến bay, bao gồm:
- **Dịch vụ hành lý** (Baggage Services): Quản lý các gói hành lý ký gửi với trọng lượng và giá khác nhau
- **Dịch vụ đồ ăn** (Meal Services): Quản lý các món ăn trên chuyến bay với các tùy chọn đặc biệt

## Đặc điểm chính

- ✅ Dịch vụ đi theo **chuyến bay** thay vì hãng hàng không
- ✅ Mỗi chuyến bay có thể có nhiều dịch vụ hành lý và đồ ăn riêng
- ✅ Hỗ trợ tạo flight kèm services trong 1 request
- ✅ CRUD đầy đủ cho từng loại dịch vụ
- ✅ Validation và authentication

## Base URLs

### Admin APIs (Authentication Required)
```
http://localhost:3000/api/admin
```

### Public APIs (No Authentication Required)
```
http://localhost:3000/api/flights
```

## Authentication

### Admin APIs
Tất cả admin endpoints yêu cầu authentication token:

```http
Authorization: Bearer <your_jwt_token>
```

### Public APIs
Các public endpoints không yêu cầu authentication.

## Endpoints

### Public Flight Services (No Authentication Required)

#### 1. Lấy dịch vụ hành lý của chuyến bay

```http
GET /api/flights/{flightId}/baggage-services
```

**Response:**
```json
{
  "success": true,
  "message": "Flight baggage services retrieved successfully",
  "data": [
    {
      "baggage_service_id": 1,
      "weight_kg": "20.00",
      "price": "500000.00",
      "description": "Standard checked baggage",
      "is_active": true
    }
  ]
}
```

#### 2. Lấy dịch vụ đồ ăn của chuyến bay

```http
GET /api/flights/{flightId}/meal-services
```

**Response:**
```json
{
  "success": true,
  "message": "Flight meal services retrieved successfully",
  "data": [
    {
      "meal_service_id": 1,
      "meal_name": "Chicken Rice",
      "meal_description": "Traditional Vietnamese chicken rice",
      "price": "150000.00",
      "is_vegetarian": false,
      "is_halal": false,
      "is_active": true
    }
  ]
}
```

### Admin Flight Services (Authentication Required)

### 1. Flight Baggage Services

#### 1.1 Lấy danh sách dịch vụ hành lý của chuyến bay

```http
GET /admin/flights/{flightId}/baggage-services
```

**Response:**
```json
{
  "success": true,
  "message": "Flight baggage services retrieved successfully",
  "data": [
    {
      "baggage_service_id": 1,
      "flight_id": 1,
      "weight_kg": "20.00",
      "price": "500000.00",
      "description": "Standard checked baggage",
      "is_active": true,
      "created_at": "2024-12-01T08:00:00.000Z",
      "updated_at": "2024-12-01T08:00:00.000Z"
    }
  ]
}
```

#### 1.2 Tạo dịch vụ hành lý mới

```http
POST /admin/flights/{flightId}/baggage-services
```

**Request Body:**
```json
{
  "weight_kg": 25.0,
  "price": 600000,
  "description": "Standard checked baggage",
  "is_active": true
}
```

**Validation Rules:**
- `weight_kg`: Required, decimal (trọng lượng tính bằng kg)
- `price`: Required, decimal (giá tiền)
- `description`: Optional, string (mô tả dịch vụ)
- `is_active`: Optional, boolean (mặc định: true)

**Response:**
```json
{
  "success": true,
  "message": "Flight baggage service created successfully",
  "data": {
    "baggage_service_id": 2,
    "flight_id": 1,
    "weight_kg": "25.00",
    "price": "600000.00",
    "description": "Standard checked baggage",
    "is_active": true,
    "created_at": "2024-12-01T08:00:00.000Z",
    "updated_at": "2024-12-01T08:00:00.000Z"
  }
}
```

#### 1.3 Cập nhật dịch vụ hành lý

```http
PUT /admin/flights/{flightId}/baggage-services/{serviceId}
```

**Request Body:**
```json
{
  "weight_kg": 30.0,
  "price": 800000,
  "description": "Updated description",
  "is_active": false
}
```

#### 1.4 Xóa dịch vụ hành lý

```http
DELETE /admin/flights/{flightId}/baggage-services/{serviceId}
```

**Response:**
```json
{
  "success": true,
  "message": "Flight baggage service deleted successfully",
  "data": null
}
```

### 2. Flight Meal Services

#### 2.1 Lấy danh sách dịch vụ đồ ăn của chuyến bay

```http
GET /admin/flights/{flightId}/meal-services
```

**Response:**
```json
{
  "success": true,
  "message": "Flight meal services retrieved successfully",
  "data": [
    {
      "meal_service_id": 1,
      "flight_id": 1,
      "meal_name": "Chicken Rice",
      "meal_description": "Traditional Vietnamese chicken rice",
      "price": "150000.00",
      "is_vegetarian": false,
      "is_halal": false,
      "is_active": true,
      "created_at": "2024-12-01T08:00:00.000Z",
      "updated_at": "2024-12-01T08:00:00.000Z"
    }
  ]
}
```

#### 2.2 Tạo dịch vụ đồ ăn mới

```http
POST /admin/flights/{flightId}/meal-services
```

**Request Body:**
```json
{
  "meal_name": "Chicken Rice",
  "meal_description": "Traditional Vietnamese chicken rice",
  "price": 150000,
  "is_vegetarian": false,
  "is_halal": false,
  "is_active": true
}
```

**Validation Rules:**
- `meal_name`: Required, string 1-100 ký tự (tên món ăn)
- `meal_description`: Optional, string (mô tả món ăn)
- `price`: Required, decimal (giá tiền)
- `is_vegetarian`: Optional, boolean (mặc định: false)
- `is_halal`: Optional, boolean (mặc định: false)
- `is_active`: Optional, boolean (mặc định: true)

#### 2.3 Cập nhật dịch vụ đồ ăn

```http
PUT /admin/flights/{flightId}/meal-services/{serviceId}
```

#### 2.4 Xóa dịch vụ đồ ăn

```http
DELETE /admin/flights/{flightId}/meal-services/{serviceId}
```

### 3. Flight Management với Services

#### 3.1 Tạo chuyến bay kèm dịch vụ

```http
POST /admin/flights
```

**Request Body:**
```json
{
  "flight_number": "VN123",
  "airline_id": 1,
  "aircraft_id": 1,
  "departure_airport_id": 1,
  "arrival_airport_id": 2,
  "departure_time": "2024-12-01T08:00:00.000Z",
  "arrival_time": "2024-12-01T10:30:00.000Z",
  "status": "scheduled",
  "baggage_services": [
    {
      "weight_kg": 20.0,
      "price": 500000,
      "description": "Standard checked baggage",
      "is_active": true
    },
    {
      "weight_kg": 30.0,
      "price": 800000,
      "description": "Extra checked baggage",
      "is_active": true
    }
  ],
  "meal_services": [
    {
      "meal_name": "Chicken Rice",
      "meal_description": "Traditional Vietnamese chicken rice",
      "price": 150000,
      "is_vegetarian": false,
      "is_halal": false,
      "is_active": true
    },
    {
      "meal_name": "Vegetarian Noodles",
      "meal_description": "Fresh vegetarian noodles",
      "price": 120000,
      "is_vegetarian": true,
      "is_halal": false,
      "is_active": true
    }
  ]
}
```

#### 3.2 Lấy thông tin chuyến bay kèm dịch vụ

```http
GET /admin/flights/{flightId}
```

**Response:**
```json
{
  "success": true,
  "message": "Flight retrieved successfully",
  "data": {
    "flight_id": 1,
    "flight_number": "VN123",
    "airline_id": 1,
    "aircraft_id": 1,
    "departure_airport_id": 1,
    "arrival_airport_id": 2,
    "departure_time": "2024-12-01T08:00:00.000Z",
    "arrival_time": "2024-12-01T10:30:00.000Z",
    "status": "scheduled",
    "Airline": {
      "airline_id": 1,
      "airline_name": "Vietnam Airlines",
      "airline_code": "VN"
    },
    "Aircraft": {
      "aircraft_id": 1,
      "model": "Boeing 737",
      "aircraft_type": "Domestic",
      "business_seats": 12,
      "economy_seats": 150
    },
    "DepartureAirport": {
      "airport_id": 1,
      "airport_code": "SGN",
      "airport_name": "Tan Son Nhat International Airport",
      "city": "Ho Chi Minh City"
    },
    "ArrivalAirport": {
      "airport_id": 2,
      "airport_code": "HAN",
      "airport_name": "Noi Bai International Airport",
      "city": "Hanoi"
    },
    "baggage_services": [
      {
        "baggage_service_id": 1,
        "weight_kg": "20.00",
        "price": "500000.00",
        "description": "Standard checked baggage",
        "is_active": true
      }
    ],
    "meal_services": [
      {
        "meal_service_id": 1,
        "meal_name": "Chicken Rice",
        "meal_description": "Traditional Vietnamese chicken rice",
        "price": "150000.00",
        "is_vegetarian": false,
        "is_halal": false,
        "is_active": true
      }
    ]
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "weight_kg",
      "message": "Weight must be a valid decimal"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Flight not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to create flight baggage service"
}
```

## Database Schema

### flight_baggage_services
```sql
CREATE TABLE flight_baggage_services (
    baggage_service_id INT AUTO_INCREMENT PRIMARY KEY,
    flight_id INT NOT NULL,
    weight_kg DECIMAL(5,2) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (flight_id) REFERENCES flights(flight_id) ON DELETE CASCADE
);
```

### flight_meal_services
```sql
CREATE TABLE flight_meal_services (
    meal_service_id INT AUTO_INCREMENT PRIMARY KEY,
    flight_id INT NOT NULL,
    meal_name VARCHAR(100) NOT NULL,
    meal_description TEXT,
    price DECIMAL(10,2) NOT NULL,
    is_vegetarian BOOLEAN DEFAULT FALSE,
    is_halal BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (flight_id) REFERENCES flights(flight_id) ON DELETE CASCADE
);
```

## Examples

### Public APIs (No Authentication Required)

#### Lấy dịch vụ hành lý của chuyến bay

```bash
curl -X GET http://localhost:3000/api/flights/1/baggage-services
```

#### Lấy dịch vụ đồ ăn của chuyến bay

```bash
curl -X GET http://localhost:3000/api/flights/1/meal-services
```

### Admin APIs (Authentication Required)

#### Tạo chuyến bay với dịch vụ đầy đủ

```bash
curl -X POST http://localhost:3000/api/admin/flights \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "flight_number": "VN456",
    "airline_id": 1,
    "aircraft_id": 1,
    "departure_airport_id": 1,
    "arrival_airport_id": 2,
    "departure_time": "2024-12-01T08:00:00.000Z",
    "arrival_time": "2024-12-01T10:30:00.000Z",
    "status": "scheduled",
    "baggage_services": [
      {
        "weight_kg": 20.0,
        "price": 500000,
        "description": "Standard checked baggage"
      }
    ],
    "meal_services": [
      {
        "meal_name": "Beef Steak",
        "meal_description": "Premium beef steak with vegetables",
        "price": 200000,
        "is_vegetarian": false,
        "is_halal": true
      }
    ]
  }'
```

### Lấy danh sách dịch vụ hành lý

```bash
curl -X GET http://localhost:3000/api/admin/flights/1/baggage-services \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Thêm dịch vụ đồ ăn mới

```bash
curl -X POST http://localhost:3000/api/admin/flights/1/meal-services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "meal_name": "Vegetarian Pasta",
    "meal_description": "Creamy vegetarian pasta",
    "price": 120000,
    "is_vegetarian": true,
    "is_halal": false
  }'
```

## Notes

1. **Cascade Delete**: Khi xóa chuyến bay, tất cả dịch vụ liên quan sẽ bị xóa tự động
2. **Active Services**: Chỉ hiển thị các dịch vụ có `is_active = true` trong danh sách
3. **Validation**: Tất cả input đều được validate trước khi xử lý
4. **Authentication**: Yêu cầu admin role để truy cập tất cả endpoints
5. **Pricing**: Giá tiền được lưu dưới dạng DECIMAL để đảm bảo độ chính xác

## Testing

Sử dụng các script test có sẵn:

```bash
# Test tạo admin user
node src/scripts/createAdminUser.js

# Test flight services với authentication
node src/scripts/testFlightServicesWithAuth.js

# Test flight services hoàn chỉnh
node src/scripts/testFlightServicesComplete.js
```
