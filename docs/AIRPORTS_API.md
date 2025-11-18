# Airports API Documentation

## Overview

API để lấy danh sách tất cả các sân bay có trong hệ thống, với khả năng lọc theo quốc gia, loại sân bay và thành phố.

## Authentication

- **Không yêu cầu** authentication
- Public API - ai cũng có thể truy cập

---

## Get All Airports

Lấy danh sách tất cả các sân bay có trong hệ thống.

### Endpoint
```
GET /api/flights/airports
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `country_code` | String | No | Mã quốc gia 2 ký tự (VD: VN, TH, SG) |
| `airport_type` | String | No | Loại sân bay: `domestic` hoặc `international` |
| `city` | String | No | Tên thành phố (tìm kiếm không phân biệt hoa thường) |

### Response Format

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Airports retrieved successfully",
  "data": [
    {
      "airport_id": 1,
      "airport_code": "SGN",
      "airport_name": "Tan Son Nhat International Airport",
      "city": "Ho Chi Minh City",
      "airport_type": "international",
      "latitude": "10.8188",
      "longitude": "106.6520",
      "country_id": 1,
      "Country": {
        "country_id": 1,
        "country_name": "Vietnam",
        "country_code": "VN"
      }
    },
    {
      "airport_id": 2,
      "airport_code": "HAN",
      "airport_name": "Noi Bai International Airport",
      "city": "Hanoi",
      "airport_type": "international",
      "latitude": "21.2212",
      "longitude": "105.8072",
      "country_id": 1,
      "Country": {
        "country_id": 1,
        "country_name": "Vietnam",
        "country_code": "VN"
      }
    }
  ]
}
```

#### Error Response (500 Internal Server Error)
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `airport_id` | Integer | ID duy nhất của sân bay |
| `airport_code` | String | Mã sân bay (3 ký tự) |
| `airport_name` | String | Tên đầy đủ của sân bay |
| `city` | String | Thành phố |
| `airport_type` | String | Loại sân bay: `domestic` hoặc `international` |
| `latitude` | Decimal | Vĩ độ |
| `longitude` | Decimal | Kinh độ |
| `country_id` | Integer | ID quốc gia |
| `Country` | Object | Thông tin quốc gia |
| `Country.country_id` | Integer | ID quốc gia |
| `Country.country_name` | String | Tên quốc gia |
| `Country.country_code` | String | Mã quốc gia (2 ký tự) |

---

## Example Usage

### Get All Airports
```bash
curl -X GET "http://localhost:3000/api/flights/airports"
```

### Filter by Country
```bash
curl -X GET "http://localhost:3000/api/flights/airports?country_code=VN"
```

### Filter by Airport Type
```bash
curl -X GET "http://localhost:3000/api/flights/airports?airport_type=international"
```

### Filter by City
```bash
curl -X GET "http://localhost:3000/api/flights/airports?city=Ho Chi Minh"
```

### Multiple Filters
```bash
curl -X GET "http://localhost:3000/api/flights/airports?country_code=TH&airport_type=international"
```

### JavaScript Examples

#### Fetch API
```javascript
// Get all airports
const getAllAirports = async () => {
  const response = await fetch('/api/flights/airports');
  const data = await response.json();
  return data.data;
};

// Get airports by country
const getAirportsByCountry = async (countryCode) => {
  const response = await fetch(`/api/flights/airports?country_code=${countryCode}`);
  const data = await response.json();
  return data.data;
};

// Get international airports
const getInternationalAirports = async () => {
  const response = await fetch('/api/flights/airports?airport_type=international');
  const data = await response.json();
  return data.data;
};

// Search airports by city
const searchAirportsByCity = async (city) => {
  const response = await fetch(`/api/flights/airports?city=${encodeURIComponent(city)}`);
  const data = await response.json();
  return data.data;
};
```

#### Axios
```javascript
const axios = require('axios');

// Get all airports
const getAllAirports = async () => {
  const response = await axios.get('http://localhost:3000/api/flights/airports');
  return response.data.data;
};

// Get airports with filters
const getFilteredAirports = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.country_code) params.append('country_code', filters.country_code);
  if (filters.airport_type) params.append('airport_type', filters.airport_type);
  if (filters.city) params.append('city', filters.city);

  const response = await axios.get(`http://localhost:3000/api/flights/airports?${params}`);
  return response.data.data;
};
```

---

## Use Cases

### 1. Airport Selection Dropdown
```javascript
// Get airports for dropdown selection
const getAirportsForDropdown = async (countryCode) => {
  const airports = await getAirportsByCountry(countryCode);
  return airports.map(airport => ({
    value: airport.airport_code,
    label: `${airport.airport_name} (${airport.airport_code})`,
    city: airport.city
  }));
};
```

### 2. Flight Search Form
```javascript
// Get departure airports (domestic)
const getDepartureAirports = async () => {
  const response = await fetch('/api/flights/airports?airport_type=domestic');
  const data = await response.json();
  return data.data;
};

// Get arrival airports (international)
const getArrivalAirports = async () => {
  const response = await fetch('/api/flights/airports?airport_type=international');
  const data = await response.json();
  return data.data;
};
```

### 3. Airport Information Display
```javascript
// Get airport details by code
const getAirportByCode = async (airportCode) => {
  const airports = await getAllAirports();
  return airports.find(airport => airport.airport_code === airportCode);
};
```

### 4. Mobile App Integration
```javascript
// Get nearby airports (requires latitude/longitude calculation)
const getNearbyAirports = async (userLat, userLng, radiusKm = 100) => {
  const airports = await getAllAirports();

  return airports.filter(airport => {
    const distance = calculateDistance(
      userLat, userLng,
      parseFloat(airport.latitude), parseFloat(airport.longitude)
    );
    return distance <= radiusKm;
  });
};

// Helper function to calculate distance between two points
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};
```

---

## Available Airports

### Vietnam Airports
- **SGN** - Tan Son Nhat International Airport (Ho Chi Minh City)
- **HAN** - Noi Bai International Airport (Hanoi)
- **DAD** - Da Nang International Airport (Da Nang)
- **HPH** - Cat Bi Airport (Hai Phong)
- **VCA** - Can Tho Airport (Can Tho)
- **PQC** - Phu Quoc Airport (Phu Quoc)
- **DLI** - Lien Khuong Airport (Da Lat)
- **VCS** - Con Dao Airport (Con Dao)

### International Airports
- **Thailand**: BKK (Bangkok), CNX (Chiang Mai), HKT (Phuket), USM (Koh Samui), CEI (Chiang Rai)
- **Singapore**: SIN (Singapore)
- **Malaysia**: KUL (Kuala Lumpur), PEN (Penang), LGK (Langkawi), BKI (Kota Kinabalu)
- **Japan**: NRT (Tokyo), KIX (Osaka), CTS (Sapporo), FUK (Fukuoka), NGO (Nagoya)
- **South Korea**: ICN (Seoul), PUS (Busan), CJU (Jeju)
- **China**: PEK (Beijing), PVG (Shanghai), CAN (Guangzhou), SZX (Shenzhen)
- **Taiwan**: TPE (Taipei), KHH (Kaohsiung)
- **Hong Kong**: HKG (Hong Kong)
- **Philippines**: MNL (Manila), CEB (Cebu)
- **Indonesia**: CGK (Jakarta), DPS (Denpasar)
- **Australia**: SYD (Sydney), MEL (Melbourne)
- **India**: DEL (New Delhi), BOM (Mumbai)
- **UAE**: DXB (Dubai), AUH (Abu Dhabi)
- **Qatar**: DOH (Doha)
- **Turkey**: IST (Istanbul)
- **Europe**: LHR (London), CDG (Paris), FRA (Frankfurt)
- **USA**: LAX (Los Angeles), JFK (New York), SFO (San Francisco)

---

## Testing

Để test API này:

```bash
# Test airports API
npm run test:airports

# Hoặc test trực tiếp
curl -X GET "http://localhost:3000/api/flights/airports"
```

---

## Adding More Airports

Để thêm thêm sân bay vào hệ thống:

```bash
# Chạy script thêm sân bay
npm run add:airports
```

Script này sẽ thêm hơn 50 sân bay quốc tế và trong nước từ khắp thế giới.

---

## Related APIs

- `GET /api/flights/airlines` - Get all airlines
- `GET /api/flights/search` - Search flights
- `GET /api/flights/list` - Get flights list
