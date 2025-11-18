# AI Recommendation API Documentation

## Overview

The AI Recommendation API provides intelligent flight recommendations and booking assistance features for the Flight Booking System. It uses machine learning algorithms to analyze user behavior and provide personalized suggestions.

## Base URL

```
/api/ai
```

## Authentication

All AI endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Get Personalized Flight Recommendations

Get AI-powered flight recommendations based on user preferences and search history.

**Endpoint:** `GET /api/ai/recommendations`

**Query Parameters:**
- `departure_airport_code` (required): 3-letter airport code
- `arrival_airport_code` (required): 3-letter airport code
- `departure_date` (required): Date in YYYY-MM-DD format
- `class_code` (optional): ECONOMY or BUSINESS (default: ECONOMY)
- `limit` (optional): Number of recommendations (1-20, default: 10)

**Example Request:**
```bash
GET /api/ai/recommendations?departure_airport_code=SGN&arrival_airport_code=HAN&departure_date=2024-03-01&limit=5
```

**Example Response:**
```json
{
  "success": true,
  "message": "Personalized recommendations retrieved successfully",
  "data": {
    "recommendations": [
      {
        "flight_id": 1,
        "flight_number": "VN200",
        "airline": {
          "id": 1,
          "name": "Vietnam Airlines",
          "code": "VN",
          "logo_url": "https://example.com/vn-logo.png"
        },
        "departure": {
          "airport": {
            "id": 1,
            "code": "SGN",
            "name": "Tan Son Nhat International Airport",
            "city": "Ho Chi Minh City"
          },
          "time": "2024-03-01T08:00:00.000Z"
        },
        "arrival": {
          "airport": {
            "id": 2,
            "code": "HAN",
            "name": "Noi Bai International Airport",
            "city": "Hanoi"
          },
          "time": "2024-03-01T10:00:00.000Z"
        },
        "duration": "02:00",
        "status": "scheduled",
        "available_seats": 15,
        "starting_price": 450000,
        "recommendation_score": 85.5,
        "recommendation_reasons": [
          "Matches your preferred airline",
          "Great price",
          "Good seat availability"
        ]
      }
    ],
    "total_count": 5,
    "search_criteria": {
      "departure_airport_code": "SGN",
      "arrival_airport_code": "HAN",
      "departure_date": "2024-03-01",
      "limit": 5
    }
  },
  "timestamp": "2024-02-15T10:30:00.000Z"
}
```

### 2. Get Booking Assistant Suggestions

Get AI-powered suggestions for booking assistance including seat recommendations, baggage options, and more.

**Endpoint:** `POST /api/ai/booking-assistant`

**Request Body:**
```json
{
  "flight_id": 1,
  "passengers": 2,
  "class_code": "ECONOMY"
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Booking assistant suggestions retrieved successfully",
  "data": {
    "seat_recommendations": {
      "recommended_seats": ["A1", "B1", "C1"],
      "reason": "Window seats with extra legroom"
    },
    "baggage_suggestions": {
      "recommended_baggage": "20kg checked baggage",
      "reason": "Based on your travel history"
    },
    "meal_suggestions": {
      "recommended_meals": ["Vegetarian", "Halal"],
      "reason": "Based on your preferences"
    },
    "insurance_suggestion": {
      "recommended": true,
      "reason": "Travel insurance recommended for high-value bookings"
    },
    "check_in_reminder": {
      "check_in_time": "2024-02-14T10:00:00.000Z",
      "reminder_message": "Check-in opens 24 hours before departure"
    }
  },
  "timestamp": "2024-02-15T10:30:00.000Z"
}
```

### 3. Track User Search

Manually track a user search for AI learning (automatically tracked in flight search).

**Endpoint:** `POST /api/ai/track-search`

**Request Body:**
```json
{
  "departure_airport_code": "SGN",
  "arrival_airport_code": "HAN",
  "departure_date": "2024-03-01",
  "return_date": "2024-03-05",
  "passengers": 2,
  "class_code": "ECONOMY"
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "User search tracked successfully",
  "data": {
    "search_params": {
      "departure_airport_code": "SGN",
      "arrival_airport_code": "HAN",
      "departure_date": "2024-03-01",
      "return_date": "2024-03-05",
      "passengers": 2,
      "class_code": "ECONOMY"
    },
    "tracked_at": "2024-02-15T10:30:00.000Z"
  },
  "timestamp": "2024-02-15T10:30:00.000Z"
}
```

### 4. Get User Search History

Get paginated user search history.

**Endpoint:** `GET /api/ai/search-history`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (1-50, default: 10)

**Example Response:**
```json
{
  "success": true,
  "message": "Search history retrieved successfully",
  "data": [
    {
      "search_id": 1,
      "user_id": 1,
      "departure_airport_id": 1,
      "arrival_airport_id": 2,
      "departure_date": "2024-02-15",
      "passengers": 1,
      "search_timestamp": "2024-02-10T08:30:00.000Z",
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
      "TravelClass": {
        "class_id": 1,
        "class_name": "Economy Class",
        "class_code": "ECONOMY"
      }
    }
  ],
  "meta": {
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  },
  "timestamp": "2024-02-15T10:30:00.000Z"
}
```

### 5. Get User Recommendations History

Get paginated user recommendations history.

**Endpoint:** `GET /api/ai/recommendations-history`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (1-50, default: 10)

**Example Response:**
```json
{
  "success": true,
  "message": "Recommendations history retrieved successfully",
  "data": [
    {
      "recommendation_id": 1,
      "user_id": 1,
      "flight_id": 1,
      "recommendation_score": 85.5,
      "recommendation_reason": "Matches your preferred airline; Great price",
      "created_at": "2024-02-10T08:30:00.000Z",
      "Flight": {
        "flight_id": 1,
        "flight_number": "VN200",
        "Airline": {
          "airline_id": 1,
          "airline_name": "Vietnam Airlines",
          "airline_code": "VN"
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
        }
      }
    }
  ],
  "meta": {
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 15,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  },
  "timestamp": "2024-02-15T10:30:00.000Z"
}
```

### 6. Get User AI Insights

Get AI-generated insights about user preferences and behavior patterns.

**Endpoint:** `GET /api/ai/insights`

**Example Response:**
```json
{
  "success": true,
  "message": "AI insights retrieved successfully",
  "data": {
    "preferences": {
      "preferred_airlines": [1, 2],
      "preferred_routes": ["1-2", "2-1", "1-3"],
      "preferred_times": [8, 9, 14, 15],
      "preferred_class": "ECONOMY",
      "preferred_passengers": 1,
      "search_frequency": 15
    },
    "patterns": {
      "booked_airlines": [1, 2],
      "booked_routes": [
        {"departure_airport_id": 1, "arrival_airport_id": 2},
        {"departure_airport_id": 2, "arrival_airport_id": 1}
      ],
      "booked_times": [8, 14],
      "booked_classes": [1],
      "booking_frequency": 5,
      "average_booking_advance": 7.2
    },
    "insights": {
      "most_searched_routes": ["1-2", "2-1", "1-3"],
      "preferred_booking_advance": 7.2,
      "search_frequency": 15,
      "booking_frequency": 5,
      "preferred_travel_times": [8, 9, 14, 15],
      "airline_loyalty": 75
    },
    "generated_at": "2024-02-15T10:30:00.000Z"
  },
  "timestamp": "2024-02-15T10:30:00.000Z"
}
```

### 7. Get Search Suggestions

Get AI-powered search suggestions based on user history and query.

**Endpoint:** `GET /api/ai/search-suggestions`

**Query Parameters:**
- `query` (required): Search query (2-100 characters)
- `limit` (optional): Number of suggestions (1-20, default: 5)

**Example Request:**
```bash
GET /api/ai/search-suggestions?query=han&limit=3
```

**Example Response:**
```json
{
  "success": true,
  "message": "Search suggestions retrieved successfully",
  "data": {
    "suggestions": [
      {
        "type": "airport",
        "code": "HAN",
        "name": "Noi Bai International Airport",
        "city": "Hanoi",
        "relevance_score": 10
      },
      {
        "type": "route",
        "departure": {
          "code": "SGN",
          "name": "Tan Son Nhat International Airport",
          "city": "Ho Chi Minh City"
        },
        "arrival": {
          "code": "HAN",
          "name": "Noi Bai International Airport",
          "city": "Hanoi"
        },
        "relevance_score": 8
      }
    ],
    "query": "han",
    "total_count": 2
  },
  "timestamp": "2024-02-15T10:30:00.000Z"
}
```

### 8. Clear User AI Data

Clear all AI data for a user (for privacy/GDPR compliance).

**Endpoint:** `DELETE /api/ai/clear-data`

**Example Response:**
```json
{
  "success": true,
  "message": "User AI data cleared successfully",
  "data": {
    "cleared_at": "2024-02-15T10:30:00.000Z",
    "user_id": 1
  },
  "timestamp": "2024-02-15T10:30:00.000Z"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "meta": {
    "errors": [
      {
        "field": "field_name",
        "message": "Error message"
      }
    ]
  },
  "timestamp": "2024-02-15T10:30:00.000Z"
}
```

## AI Algorithm Details

### Recommendation Scoring

The AI recommendation system uses a weighted scoring algorithm:

- **Airline Preference (30%)**: Based on user's booking and search history
- **Route Preference (25%)**: Based on frequently searched routes
- **Time Preference (20%)**: Based on preferred departure times
- **Price Competitiveness (15%)**: Based on market pricing
- **Availability (10%)**: Based on seat availability

### Learning Features

- **Search History Tracking**: Automatically tracks user searches
- **Booking Pattern Analysis**: Analyzes booking behavior
- **Preference Learning**: Learns from user interactions
- **Collaborative Filtering**: Uses similar user patterns

## Testing

### Seed AI Data

```bash
# Seed AI test data
npm run seed:ai

# Clear AI data
npm run clear:ai

# Show AI statistics
npm run stats:ai

# Reset AI data (clear and reseed)
npm run reset:ai
```

### Test Scenarios

1. **New User**: No search history, should return general recommendations
2. **Frequent Business Traveler**: Should prioritize business class and preferred airlines
3. **Family Traveler**: Should consider group discounts and family-friendly options

## Privacy & GDPR Compliance

- Users can clear their AI data using the `/api/ai/clear-data` endpoint
- All AI data is user-specific and not shared
- Search history is automatically anonymized after 2 years
- Users can opt-out of AI tracking

## Rate Limiting

- AI endpoints have a rate limit of 100 requests per hour per user
- Search tracking is limited to 50 requests per hour per user
- Exceeding limits returns HTTP 429 (Too Many Requests)
