# E-Ticket API Documentation

## Overview
The E-Ticket API provides functionality to generate and download PDF e-tickets for flight bookings. The generated PDFs include comprehensive booking information, flight details, service packages, and passenger information in a professional format.

## Base URL
```
http://localhost:3000/api/eticket
```

## Endpoints

### 1. Generate E-Ticket PDF

**Endpoint:** `GET /api/eticket/:bookingReference/pdf`

**Description:** Generates and downloads a PDF e-ticket for the specified booking reference.

**Parameters:**
- `bookingReference` (path parameter, required): The booking reference code (6-10 characters, uppercase letters and numbers only)

**Response:**
- **Content-Type:** `application/pdf`
- **Content-Disposition:** `attachment; filename="eticket_{bookingReference}_{date}.pdf"`
- **Body:** PDF file buffer

**Example Request:**
```bash
GET /api/eticket/AB1234CD/pdf
```

**Example Response:**
- Downloads a PDF file named `eticket_AB1234CD_2025-01-25.pdf`

**Error Responses:**
- `400 Bad Request`: Invalid booking reference format
- `404 Not Found`: Booking not found
- `500 Internal Server Error`: PDF generation failed

### 2. Get E-Ticket Data

**Endpoint:** `GET /api/eticket/:bookingReference/data`

**Description:** Retrieves e-ticket data in JSON format without generating a PDF.

**Parameters:**
- `bookingReference` (path parameter, required): The booking reference code (6-10 characters, uppercase letters and numbers only)

**Response:**
```json
{
  "success": true,
  "message": "E-ticket data retrieved successfully",
  "data": {
    "booking": {
      "booking_reference": "AB1234CD",
      "booking_date": "2025-01-25T10:30:00.000Z",
      "total_amount": 1500000,
      "status": "confirmed"
    },
    "flight": {
      "flight_number": "VN102",
      "airline": {
        "airline_id": 1,
        "airline_name": "Vietnam Airlines",
        "airline_code": "VN"
      },
      "departure_airport": {
        "airport_id": 1,
        "airport_name": "Noi Bai International Airport",
        "city": "Hanoi",
        "country_code": "VN"
      },
      "arrival_airport": {
        "airport_id": 2,
        "airport_name": "Tan Son Nhat International Airport",
        "city": "Ho Chi Minh City",
        "country_code": "VN"
      },
      "departure_time": "2025-01-25T10:30:00.000Z",
      "arrival_time": "2025-01-25T12:40:00.000Z",
      "aircraft": {
        "aircraft_id": 1,
        "model": "A320-200",
        "manufacturer": "Airbus"
      },
      "travel_class": {
        "class_id": 1,
        "class_name": "Economy"
      }
    },
    "service_package": {
      "package_id": 1,
      "package_name": "Economy Plus",
      "description": "Enhanced service package for economy class",
      "carry_on_baggage": 7.0,
      "checked_baggage": 20.0,
      "refund_percentage": 70.0,
      "travel_insurance": true
    },
    "passengers": [
      {
        "passenger_id": 1,
        "first_name": "John",
        "last_name": "Doe",
        "date_of_birth": "1990-01-01",
        "nationality": "US",
        "passport_number": "P12345678",
        "gender": "male",
        "seat_number": "A1"
      }
    ]
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid booking reference format
- `404 Not Found`: Booking not found
- `500 Internal Server Error`: Data retrieval failed

## PDF Content Structure

The generated PDF e-ticket includes the following sections:

### 1. Header
- **Title:** "VÉ ĐIỆN TỬ - [Airline Name]"
- **Booking Information:** Reference, booking date, total amount

### 2. Flight Information
- Flight number
- Departure and arrival airports
- Departure and arrival times
- Aircraft information
- Travel class

### 3. Service Package Information (if applicable)
- Package name and description
- Carry-on and checked baggage allowances
- Refund policy
- Travel insurance status

### 4. Passenger List
- Individual passenger sections with:
  - Passenger type (Adult/Child/Infant)
  - Title (Mr./Mrs./Ms.)
  - Full name (uppercase)
  - ID/Passport number
  - Date of birth
  - Nationality
  - Baggage information

## Validation Rules

### Booking Reference
- **Required:** Yes
- **Length:** 6-10 characters
- **Format:** Uppercase letters and numbers only
- **Pattern:** `^[A-Z0-9]+$`

## Error Handling

The API includes comprehensive error handling:

1. **Validation Errors:** Returns 400 with validation details
2. **Not Found:** Returns 404 when booking doesn't exist
3. **Server Errors:** Returns 500 with error details
4. **PDF Generation Errors:** Logs errors and returns appropriate HTTP status

## Usage Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

// Get e-ticket data
const getEticketData = async (bookingReference) => {
  try {
    const response = await axios.get(`http://localhost:3000/api/eticket/${bookingReference}/data`);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
};

// Download PDF
const downloadEticketPdf = async (bookingReference) => {
  try {
    const response = await axios.get(`http://localhost:3000/api/eticket/${bookingReference}/pdf`, {
      responseType: 'arraybuffer'
    });

    // Save PDF to file
    const fs = require('fs');
    fs.writeFileSync(`eticket_${bookingReference}.pdf`, response.data);
    console.log('PDF downloaded successfully');
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
};
```

### cURL
```bash
# Get e-ticket data
curl -X GET "http://localhost:3000/api/eticket/AB1234CD/data"

# Download PDF
curl -X GET "http://localhost:3000/api/eticket/AB1234CD/pdf" -o eticket.pdf
```

## Testing

### Test Scripts
- `src/scripts/testEticketAPI.js`: Tests both endpoints via HTTP
- `src/scripts/testEticketPdfDirect.js`: Tests PDF generation service directly

### Running Tests
```bash
# Test via HTTP API
npm run test:eticket

# Test PDF service directly
npm run test:eticket-direct
```

## Dependencies

- **puppeteer**: PDF generation from HTML
- **express-validator**: Input validation
- **sequelize**: Database operations

## Notes

- The PDF generation uses Puppeteer to convert HTML to PDF
- All dates are formatted in Vietnamese locale (DD/MM/YYYY)
- Passenger names are displayed in uppercase
- The API is currently public (no authentication required)
- PDF files are generated with A4 format and proper margins
- HTML content is also saved for debugging purposes
