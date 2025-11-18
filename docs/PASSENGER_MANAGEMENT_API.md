# Passenger Management API Documentation

## Overview

APIs để quản lý thông tin hành khách trong booking, bao gồm xem và chỉnh sửa thông tin passengers.

## Authentication

Tất cả các API đều yêu cầu authentication:
```
Authorization: Bearer <jwt-token>
```

---

## 1. Get Booking Passengers

Lấy danh sách thông tin hành khách của một booking.

### Endpoint
```
GET /api/bookings/:bookingId/passengers
```

### Parameters
- `bookingId` (path, required): ID của booking

### Response Format

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Passengers information retrieved successfully",
  "data": {
    "booking_id": 1,
    "booking_reference": "ABC123",
    "status": "confirmed",
    "passengers": [
      {
        "passenger_id": 1,
        "first_name": "Ngo Van",
        "middle_name": null,
        "last_name": "Toan",
        "title": "Mr",
        "citizen_id": "123456789012",
        "passenger_type": "adult",
        "date_of_birth": "1990-01-01",
        "nationality": "VN",
        "passport_number": "P12e45678",
        "passport_expiry": "2025-12-31",
        "seat": {
          "seat_id": 1,
          "seat_number": "1A",
          "travel_class": {
            "class_id": 1,
            "class_name": "Business Class",
            "class_code": "BUSINESS"
          }
        }
      }
    ]
  }
}
```

#### Error Response (404 Not Found)
```json
{
  "success": false,
  "message": "Booking not found"
}
```

---

## 2. Update Single Passenger

Cập nhật thông tin của một hành khách cụ thể.

### Endpoint
```
PUT /api/bookings/:bookingId/passengers/:passengerId
```

### Parameters
- `bookingId` (path, required): ID của booking
- `passengerId` (path, required): ID của passenger

### Request Body
```json
{
  "first_name": "Updated First Name",
  "last_name": "Updated Last Name",
  "middle_name": "Middle Name",
  "title": "Mrs",
  "citizen_id": "123456789012",
  "passenger_type": "adult",
  "date_of_birth": "1990-01-01",
  "nationality": "VN",
  "passport_number": "P12345678",
  "passport_expiry": "2025-12-31"
}
```

### Field Validation
- `first_name`: Không được để trống nếu có
- `last_name`: Không được để trống nếu có
- `title`: Phải là một trong: Mr, Mrs, Ms, Dr, Prof
- `citizen_id`: Phải đúng 12 chữ số
- `passenger_type`: Phải là một trong: adult, child, infant
- `date_of_birth`: Phải là định dạng ngày hợp lệ
- `nationality`: 2-50 ký tự
- `passport_number`: 1-50 ký tự
- `passport_expiry`: Phải là định dạng ngày hợp lệ

### Response Format

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Passenger information updated successfully",
  "data": {
    "passenger_id": 1,
    "first_name": "Updated First Name",
    "middle_name": "Middle Name",
    "last_name": "Updated Last Name",
    "title": "Mrs",
    "citizen_id": "123456789012",
    "passenger_type": "adult",
    "date_of_birth": "1990-01-01",
    "nationality": "VN",
    "passport_number": "P12345678",
    "passport_expiry": "2025-12-31"
  }
}
```

#### Error Response (400 Bad Request)
```json
{
  "success": false,
  "message": "First name cannot be empty"
}
```

---

## 3. Update Multiple Passengers

Cập nhật thông tin của nhiều hành khách cùng lúc.

### Endpoint
```
PUT /api/bookings/:bookingId/passengers
```

### Parameters
- `bookingId` (path, required): ID của booking

### Request Body
```json
{
  "passengers": [
    {
      "passenger_id": 1,
      "first_name": "Updated First 1",
      "last_name": "Updated Last 1",
      "nationality": "VN"
    },
    {
      "passenger_id": 2,
      "first_name": "Updated First 2",
      "last_name": "Updated Last 2",
      "nationality": "US"
    }
  ]
}
```

### Response Format

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "All passengers information updated successfully",
  "data": {
    "booking_id": 1,
    "updated_passengers": [
      {
        "passenger_id": 1,
        "first_name": "Updated First 1",
        "last_name": "Updated Last 1",
        "nationality": "VN"
      },
      {
        "passenger_id": 2,
        "first_name": "Updated First 2",
        "last_name": "Updated Last 2",
        "nationality": "US"
      }
    ]
  }
}
```

#### Partial Success Response (400 Bad Request)
```json
{
  "success": false,
  "message": "Some passengers could not be updated",
  "data": {
    "errors": [
      "Passenger 1: First name cannot be empty",
      "Passenger 2: Passenger not found"
    ],
    "updated_passengers": [
      {
        "passenger_id": 3,
        "first_name": "Updated First 3",
        "last_name": "Updated Last 3"
      }
    ]
  }
}
```

---

## Business Rules

### Booking Status Restrictions
- Chỉ có thể chỉnh sửa passengers khi booking có status: `pending`, `confirmed`
- Không thể chỉnh sửa khi booking có status: `completed`, `cancelled`

### Authorization
- Chỉ user sở hữu booking mới có thể xem/chỉnh sửa passengers
- Passenger phải thuộc về booking được chỉ định

### Data Validation
- Tất cả fields đều optional trong update request
- Chỉ validate fields được gửi lên
- Date fields phải đúng format ISO 8601 (YYYY-MM-DD)

---

## Example Usage

### JavaScript (Fetch)
```javascript
// Get passengers
const getPassengers = async (bookingId, token) => {
  const response = await fetch(`/api/bookings/${bookingId}/passengers`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

// Update single passenger
const updatePassenger = async (bookingId, passengerId, data, token) => {
  const response = await fetch(`/api/bookings/${bookingId}/passengers/${passengerId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return response.json();
};

// Update multiple passengers
const updatePassengers = async (bookingId, passengers, token) => {
  const response = await fetch(`/api/bookings/${bookingId}/passengers`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ passengers })
  });
  return response.json();
};
```

### cURL Examples
```bash
# Get passengers
curl -X GET "http://localhost:3000/api/bookings/1/passengers" \
  -H "Authorization: Bearer your-jwt-token"

# Update single passenger
curl -X PUT "http://localhost:3000/api/bookings/1/passengers/1" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Updated Name",
    "nationality": "US"
  }'

# Update multiple passengers
curl -X PUT "http://localhost:3000/api/bookings/1/passengers" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "passengers": [
      {
        "passenger_id": 1,
        "first_name": "Updated First 1"
      },
      {
        "passenger_id": 2,
        "first_name": "Updated First 2"
      }
    ]
  }'
```

---

## Testing

Để test các API này:

```bash
# Test passengers APIs
npm run test:passengers
```

**Lưu ý**: Cần cập nhật `testBookingId`, `testPassengerId`, và `testToken` trong file test script với giá trị thực từ database.

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Validation errors |
| 401 | Unauthorized - Missing or invalid token |
| 404 | Not Found - Booking or passenger not found |
| 500 | Internal Server Error |

---

## Related APIs

- `GET /api/bookings/:bookingId` - Get booking details
- `GET /api/bookings/` - Get user bookings
- `POST /api/bookings/` - Create new booking
