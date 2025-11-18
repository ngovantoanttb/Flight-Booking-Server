# Flight Booking API Documentation

This document provides a comprehensive guide to all endpoints in the Flight Booking API, organized by user requirements.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints (except public ones like search) require authentication via JWT token:

```
Authorization: Bearer <token>
```

---

## User APIs

### 1. Flight Search

#### Get Available Flights
```http
GET /api/flights/search?departure_airport_code={code}&arrival_airport_code={code}&departure_date={YYYY-MM-DD}&passengers={count}&class_code={ECONOMY|BUSINESS}
```

**Parameters:**
- `departure_airport_code` (required): 3-letter IATA code of departure airport (e.g., "SGN")
- `arrival_airport_code` (required): 3-letter IATA code of arrival airport (e.g., "HAN")
- `departure_date` (required): Date in YYYY-MM-DD format
- `passengers` (optional): Number of passengers (default: 1)
- `class_code` (optional): "ECONOMY" or "BUSINESS" (default: "ECONOMY")
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10)

**Response:**
```json
{
  "success": true,
  "message": "Flights found successfully",
  "data": [
    {
      "flight_id": 1,
      "flight_number": "VN123",
      "airline": {
        "airline_id": 1,
        "airline_name": "Vietnam Airlines",
        "logo_url": "https://example.com/va-logo.png"
      },
      "aircraft": {
        "aircraft_id": 1,
        "model": "Boeing 787"
      },
      "departureAirport": {
        "airport_id": 1,
        "airport_code": "SGN",
        "airport_name": "Tan Son Nhat International Airport",
        "city": "Ho Chi Minh City"
      },
      "arrivalAirport": {
        "airport_id": 2,
        "airport_code": "HAN",
        "airport_name": "Noi Bai International Airport",
        "city": "Hanoi"
      },
      "departure_time": "2025-09-15T08:00:00.000Z",
      "arrival_time": "2025-09-15T10:00:00.000Z",
      "duration_minutes": 120,
      "available_seats": 50,
      "starting_price": 100.00
    }
  ],
  "meta": {
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "itemsPerPage": 10,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

### 2. Flight Booking

#### Create a Booking
```http
POST /api/bookings
```

**Request Body:**
```json
{
  "flight_id": 1,
  "passengers": [
    {
      "first_name": "John",
      "last_name": "Doe",
      "gender": "male",
      "date_of_birth": "1990-01-01",
      "nationality": "VN",
      "passport_number": "P12345678",
      "seat_number": "10A"
    }
  ],
  "contact_info": {
    "email": "john.doe@example.com",
    "phone": "+84123456789"
  },
  "baggage_options": [
    {
      "passenger_id": 1,
      "baggage_option_id": 2
    }
  ],
  "meal_options": [
    {
      "passenger_id": 1,
      "meal_option_id": 3
    }
  ],
  "promotion_code": "SUMMER2025"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "booking_id": 1,
    "booking_reference": "ABC123",
    "user_id": 5,
    "flight_id": 1,
    "status": "pending",
    "total_amount": 150.00,
    "created_at": "2025-09-15T08:30:00.000Z",
    "passengers": [...],
    "payment_url": "http://localhost:3000/api/payments/1/checkout"
  }
}
```

### 3. Booking Confirmation and Payment

#### Get Payment Options
```http
GET /api/payments/options
```

**Response:**
```json
{
  "success": true,
  "message": "Payment options retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "ZaloPay",
      "icon_url": "https://example.com/zalopay.png"
    },
    {
      "id": 2,
      "name": "Credit Card",
      "icon_url": "https://example.com/credit-card.png"
    }
  ]
}
```

#### Process Payment
```http
POST /api/payments
```

**Request Body:**
```json
{
  "booking_id": 1,
  "payment_method": "zalopay",
  "return_url": "http://yourfrontend.com/booking-confirmation"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment initiated",
  "data": {
    "payment_id": 1,
    "status": "pending",
    "redirect_url": "https://zalopay.com/payment?orderid=ABC123",
    "booking_reference": "ABC123"
  }
}
```

#### Verify Payment Status
```http
GET /api/payments/{payment_id}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment status retrieved",
  "data": {
    "payment_id": 1,
    "booking_id": 1,
    "status": "completed",
    "amount": 150.00,
    "payment_method": "zalopay",
    "transaction_id": "ZLP12345678",
    "payment_date": "2025-09-15T08:45:00.000Z"
  }
}
```

### 4. User Booking Information and Promotions

#### Get User Bookings
```http
GET /api/users/bookings?status={status}&page={page}&limit={limit}
```

**Parameters:**
- `status` (optional): Filter by status ("pending", "confirmed", "cancelled", "completed")
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10)

**Response:**
```json
{
  "success": true,
  "message": "User bookings retrieved successfully",
  "data": [
    {
      "booking_id": 1,
      "booking_reference": "ABC123",
      "flight": {
        "flight_id": 1,
        "flight_number": "VN123",
        "departure_airport_code": "SGN",
        "arrival_airport_code": "HAN",
        "departure_time": "2025-09-15T08:00:00.000Z",
        "arrival_time": "2025-09-15T10:00:00.000Z"
      },
      "status": "confirmed",
      "total_amount": 150.00,
      "created_at": "2025-09-14T14:30:00.000Z",
      "passenger_count": 1
    }
  ],
  "meta": {
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "itemsPerPage": 10
    }
  }
}
```

#### Get Available Promotions
```http
GET /api/promotions
```

**Response:**
```json
{
  "success": true,
  "message": "Promotions retrieved successfully",
  "data": [
    {
      "promotion_id": 1,
      "code": "SUMMER2025",
      "description": "Summer special discount",
      "discount_percentage": 10,
      "start_date": "2025-06-01T00:00:00.000Z",
      "end_date": "2025-08-31T23:59:59.000Z",
      "is_active": true
    }
  ]
}
```

### 5. E-Ticket Information

#### Get E-Ticket
```http
GET /api/bookings/{booking_reference}/e-ticket
```

**Parameters:**
- `format` (optional): Response format, "json" or "pdf" (default: "json")

**Response (JSON):**
```json
{
  "success": true,
  "message": "E-ticket retrieved successfully",
  "data": {
    "booking_reference": "ABC123",
    "flight": {
      "flight_number": "VN123",
      "airline_name": "Vietnam Airlines",
      "aircraft_model": "Boeing 787",
      "departure_airport": "Tan Son Nhat International Airport (SGN)",
      "arrival_airport": "Noi Bai International Airport (HAN)",
      "departure_time": "2025-09-15T08:00:00.000Z",
      "arrival_time": "2025-09-15T10:00:00.000Z",
      "duration_minutes": 120
    },
    "passengers": [
      {
        "name": "John Doe",
        "seat_number": "10A",
        "travel_class": "Business",
        "baggage_allowance": "30kg",
        "meal_preference": "Vegetarian"
      }
    ],
    "barcode_url": "https://example.com/barcode/ABC123.png",
    "qr_code_url": "https://example.com/qrcode/ABC123.png",
    "boarding_instructions": "Please arrive at the airport 2 hours before departure"
  }
}
```

**Response (PDF):**
Binary PDF file with e-ticket information for printing.

### 6. Booking Cancellation

#### Request Booking Cancellation
```http
POST /api/bookings/{booking_id}/cancel
```

**Request Body:**
```json
{
  "reason": "Change of plans",
  "cancellation_note": "Need to reschedule for next month"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cancellation request submitted successfully",
  "data": {
    "booking_id": 1,
    "cancellation_id": 5,
    "status": "pending_review",
    "refund_amount_estimate": 120.00,
    "cancellation_fee": 30.00,
    "processing_time_estimate": "3-5 business days"
  }
}
```

#### Check Cancellation Status
```http
GET /api/bookings/{booking_id}/cancellation
```

**Response:**
```json
{
  "success": true,
  "message": "Cancellation status retrieved",
  "data": {
    "cancellation_id": 5,
    "booking_id": 1,
    "status": "approved",
    "refund_amount": 120.00,
    "refund_method": "Original payment method",
    "refund_date": "2025-09-18T14:30:00.000Z",
    "cancellation_fee": 30.00,
    "admin_notes": "Refund processed to original ZaloPay account"
  }
}
```

### 7. Flight Details

#### Get Flight Details
```http
GET /api/flights/{flight_id}
```

**Response:**
```json
{
  "success": true,
  "message": "Flight details retrieved successfully",
  "data": {
    "flight_id": 1,
    "flight_number": "VN123",
    "airline": {
      "airline_id": 1,
      "airline_name": "Vietnam Airlines",
      "logo_url": "https://example.com/va-logo.png"
    },
    "aircraft": {
      "aircraft_id": 1,
      "model": "Boeing 787",
      "seat_map_url": "https://example.com/seat-map-b787.png"
    },
    "departureAirport": {
      "airport_id": 1,
      "airport_code": "SGN",
      "airport_name": "Tan Son Nhat International Airport",
      "city": "Ho Chi Minh City",
      "country": "Vietnam",
      "latitude": 10.8188,
      "longitude": 106.6520
    },
    "arrivalAirport": {
      "airport_id": 2,
      "airport_code": "HAN",
      "airport_name": "Noi Bai International Airport",
      "city": "Hanoi",
      "country": "Vietnam",
      "latitude": 21.2187,
      "longitude": 105.8041
    },
    "departure_time": "2025-09-15T08:00:00.000Z",
    "arrival_time": "2025-09-15T10:00:00.000Z",
    "duration_minutes": 120,
    "status": "scheduled",
    "travelClasses": [
      {
        "class_id": 1,
        "class_name": "Business Class",
        "class_code": "BUSINESS",
        "amenities": ["Lie-flat seats", "Priority boarding", "Gourmet meals"],
        "starting_price": 300.00
      },
      {
        "class_id": 2,
        "class_name": "Economy Class",
        "class_code": "ECONOMY",
        "amenities": ["Standard seats", "Complimentary meals"],
        "starting_price": 100.00
      }
    ]
  }
}
```

### 8. Flight Services

#### Get Flight Services
```http
GET /api/flights/{flight_id}/services
```

**Response:**
```json
{
  "success": true,
  "message": "Flight services retrieved successfully",
  "data": {
    "flight_id": 1,
    "flight_number": "VN123",
    "services": [
      {
        "service_id": 1,
        "service_name": "Wi-Fi",
        "description": "In-flight Wi-Fi service",
        "price": 5.00,
        "is_available": true
      },
      {
        "service_id": 2,
        "service_name": "Priority Boarding",
        "description": "Board before other passengers",
        "price": 10.00,
        "is_available": true
      }
    ],
    "travel_class_services": {
      "BUSINESS": [
        "Complimentary Wi-Fi", 
        "Priority Boarding", 
        "Lounge Access"
      ],
      "ECONOMY": [
        "In-flight Entertainment", 
        "Basic Refreshments"
      ]
    }
  }
}
```

### 9. Baggage Services

#### Get Flight Baggage Options
```http
GET /api/flights/{flight_id}/baggage-options
```

**Response:**
```json
{
  "success": true,
  "message": "Baggage options retrieved successfully",
  "data": [
    {
      "baggage_id": 1,
      "description": "Carry-on only (7kg)",
      "weight_kg": 7,
      "price": 0.00,
      "travel_class_code": "ECONOMY"
    },
    {
      "baggage_id": 2,
      "description": "Checked baggage (23kg)",
      "weight_kg": 23,
      "price": 20.00,
      "travel_class_code": "ECONOMY"
    },
    {
      "baggage_id": 3,
      "description": "Checked baggage (30kg)",
      "weight_kg": 30,
      "price": 0.00,
      "travel_class_code": "BUSINESS"
    }
  ]
}
```

### 10. Meal Services

#### Get Flight Meal Options
```http
GET /api/flights/{flight_id}/meal-options
```

**Response:**
```json
{
  "success": true,
  "message": "Meal options retrieved successfully",
  "data": [
    {
      "meal_id": 1,
      "name": "Standard Meal",
      "description": "Regular in-flight meal",
      "price": 0.00,
      "dietary_type": "regular",
      "travel_class_code": "ECONOMY"
    },
    {
      "meal_id": 2,
      "name": "Vegetarian Meal",
      "description": "Vegetarian meal option",
      "price": 0.00,
      "dietary_type": "vegetarian",
      "travel_class_code": "ECONOMY"
    },
    {
      "meal_id": 3,
      "name": "Gourmet Selection",
      "description": "Premium meal with multiple courses",
      "price": 0.00,
      "dietary_type": "regular",
      "travel_class_code": "BUSINESS"
    }
  ]
}
```

---

## Implementation Notes

This API documentation provides the expected endpoints for the requirements in the REQUIREMENT.md file. To implement these endpoints:

1. Create new route files for features not yet implemented:
   - `src/routes/booking.routes.js`
   - `src/routes/payment.routes.js`
   - `src/routes/promotion.routes.js`

2. Add corresponding controllers:
   - `src/controllers/bookingController.js`
   - `src/controllers/paymentController.js`
   - `src/controllers/promotionController.js`

3. Update `src/routes/index.js` to include all new routes.

4. Ensure validation middleware is applied to all routes using express-validator.

5. Protect appropriate routes with authentication middleware.

6. For PDF generation (e-tickets), consider using libraries like PDFKit or html-pdf.

7. For email notifications, implement using Nodemailer or similar service.

8. For ZaloPay integration, implement a payment gateway service.