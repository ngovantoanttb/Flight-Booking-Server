# Flight Services API - Request Bodies

## Tổng quan

Tài liệu này mô tả chi tiết body request cho các API Flight Services.

## 1. Baggage Services APIs

### 1.1 Tạo dịch vụ hành lý
```http
POST /api/admin/flights/{flightId}/baggage-services
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
- `weight_kg`: **Required**, decimal (trọng lượng tính bằng kg)
- `price`: **Required**, decimal (giá tiền)
- `description`: **Optional**, string (mô tả dịch vụ)
- `is_active`: **Optional**, boolean (mặc định: true)

**Example:**
```bash
curl -X POST http://localhost:3000/api/admin/flights/1/baggage-services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "weight_kg": 25.0,
    "price": 600000,
    "description": "Standard checked baggage",
    "is_active": true
  }'
```

### 1.2 Cập nhật dịch vụ hành lý
```http
PUT /api/admin/flights/{flightId}/baggage-services/{serviceId}
```

**Request Body (Partial Update):**
```json
{
  "weight_kg": 30.0,
  "price": 800000,
  "description": "Updated description",
  "is_active": false
}
```

**Validation Rules:**
- Tất cả fields đều **Optional**
- Chỉ cập nhật các fields được gửi lên

**Example:**
```bash
curl -X PUT http://localhost:3000/api/admin/flights/1/baggage-services/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "price": 800000,
    "is_active": false
  }'
```

### 1.3 Lấy danh sách dịch vụ hành lý
```http
GET /api/admin/flights/{flightId}/baggage-services
```

**Request Body:** Không cần

**Example:**
```bash
curl -X GET http://localhost:3000/api/admin/flights/1/baggage-services \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 1.4 Xóa dịch vụ hành lý
```http
DELETE /api/admin/flights/{flightId}/baggage-services/{serviceId}
```

**Request Body:** Không cần

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/admin/flights/1/baggage-services/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 2. Meal Services APIs

### 2.1 Tạo dịch vụ đồ ăn
```http
POST /api/admin/flights/{flightId}/meal-services
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
- `meal_name`: **Required**, string 1-100 ký tự (tên món ăn)
- `meal_description`: **Optional**, string (mô tả món ăn)
- `price`: **Required**, decimal (giá tiền)
- `is_vegetarian`: **Optional**, boolean (mặc định: false)
- `is_halal`: **Optional**, boolean (mặc định: false)
- `is_active`: **Optional**, boolean (mặc định: true)

**Example:**
```bash
curl -X POST http://localhost:3000/api/admin/flights/1/meal-services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "meal_name": "Chicken Rice",
    "meal_description": "Traditional Vietnamese chicken rice",
    "price": 150000,
    "is_vegetarian": false,
    "is_halal": false,
    "is_active": true
  }'
```

### 2.2 Cập nhật dịch vụ đồ ăn
```http
PUT /api/admin/flights/{flightId}/meal-services/{serviceId}
```

**Request Body (Partial Update):**
```json
{
  "meal_name": "Updated Chicken Rice",
  "price": 180000,
  "is_vegetarian": true,
  "is_active": false
}
```

**Validation Rules:**
- Tất cả fields đều **Optional**
- Chỉ cập nhật các fields được gửi lên

**Example:**
```bash
curl -X PUT http://localhost:3000/api/admin/flights/1/meal-services/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "price": 180000,
    "is_vegetarian": true
  }'
```

### 2.3 Lấy danh sách dịch vụ đồ ăn
```http
GET /api/admin/flights/{flightId}/meal-services
```

**Request Body:** Không cần

**Example:**
```bash
curl -X GET http://localhost:3000/api/admin/flights/1/meal-services \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2.4 Xóa dịch vụ đồ ăn
```http
DELETE /api/admin/flights/{flightId}/meal-services/{serviceId}
```

**Request Body:** Không cần

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/admin/flights/1/meal-services/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 3. Create Flight with Services

### 3.1 Tạo chuyến bay kèm dịch vụ
```http
POST /api/admin/flights
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

**Validation Rules:**
- `flight_number`: **Required**, string (mã chuyến bay)
- `airline_id`: **Required**, integer (ID hãng hàng không)
- `aircraft_id`: **Required**, integer (ID máy bay)
- `departure_airport_id`: **Required**, integer (ID sân bay đi)
- `arrival_airport_id`: **Required**, integer (ID sân bay đến)
- `departure_time`: **Required**, ISO datetime (thời gian đi)
- `arrival_time`: **Required**, ISO datetime (thời gian đến)
- `status`: **Required**, enum (scheduled, delayed, cancelled, completed)
- `baggage_services`: **Optional**, array of baggage service objects
- `meal_services`: **Optional**, array of meal service objects

**Example:**
```bash
curl -X POST http://localhost:3000/api/admin/flights \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
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
        "description": "Standard checked baggage"
      }
    ],
    "meal_services": [
      {
        "meal_name": "Chicken Rice",
        "price": 150000,
        "is_vegetarian": false
      }
    ]
  }'
```

## 4. Public APIs (No Authentication)

### 4.1 Lấy dịch vụ hành lý (Public)
```http
GET /api/flights/{flightId}/baggage-services
```

**Request Body:** Không cần

**Example:**
```bash
curl -X GET http://localhost:3000/api/flights/1/baggage-services
```

### 4.2 Lấy dịch vụ đồ ăn (Public)
```http
GET /api/flights/{flightId}/meal-services
```

**Request Body:** Không cần

**Example:**
```bash
curl -X GET http://localhost:3000/api/flights/1/meal-services
```

## 5. Error Responses

### 5.1 Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "weight_kg",
      "message": "Weight must be a valid decimal"
    },
    {
      "field": "price",
      "message": "Price must be a valid decimal"
    }
  ]
}
```

### 5.2 Unauthorized (401)
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### 5.3 Not Found (404)
```json
{
  "success": false,
  "message": "Flight not found"
}
```

### 5.4 Internal Server Error (500)
```json
{
  "success": false,
  "message": "Failed to create flight baggage service"
}
```

## 6. Success Responses

### 6.1 Create Success (201)
```json
{
  "success": true,
  "message": "Flight baggage service created successfully",
  "data": {
    "baggage_service_id": 1,
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

### 6.2 Update Success (200)
```json
{
  "success": true,
  "message": "Flight baggage service updated successfully",
  "data": {
    "baggage_service_id": 1,
    "flight_id": 1,
    "weight_kg": "30.00",
    "price": "800000.00",
    "description": "Updated description",
    "is_active": false,
    "created_at": "2024-12-01T08:00:00.000Z",
    "updated_at": "2024-12-01T08:30:00.000Z"
  }
}
```

### 6.3 Delete Success (200)
```json
{
  "success": true,
  "message": "Flight baggage service deleted successfully",
  "data": null
}
```

## 7. Notes

1. **Authentication**: Tất cả admin APIs yêu cầu Bearer token
2. **Content-Type**: POST/PUT requests cần `Content-Type: application/json`
3. **Partial Updates**: PUT requests chỉ cập nhật fields được gửi lên
4. **Validation**: Tất cả input đều được validate trước khi xử lý
5. **Error Handling**: API trả về error messages chi tiết
6. **Public APIs**: Không cần authentication, chỉ trả về active services
