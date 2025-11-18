# Airlines API Documentation

## Get All Airlines

Lấy danh sách tất cả các hãng hàng không có trong hệ thống.

### Endpoint
```
GET /api/flights/airlines
```

### Description
API này cho phép user lấy danh sách tất cả các hãng hàng không, bao gồm thông tin về quốc gia của hãng hàng không.

### Authentication
- **Không yêu cầu** authentication
- Public API - ai cũng có thể truy cập

### Request Parameters
Không có parameters

### Response Format

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Airlines retrieved successfully",
  "data": [
    {
      "airline_id": 1,
      "airline_code": "VN",
      "airline_name": "Vietnam Airlines",
      "logo_url": "https://example.com/vn-logo.png",
      "country_id": 1,
      "Country": {
        "country_id": 1,
        "country_name": "Vietnam",
        "country_code": "VN"
      }
    },
    {
      "airline_id": 2,
      "airline_code": "VJ",
      "airline_name": "VietJet Air",
      "logo_url": "https://example.com/vj-logo.png",
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
| `airline_id` | Integer | ID duy nhất của hãng hàng không |
| `airline_code` | String | Mã hãng hàng không (2-3 ký tự) |
| `airline_name` | String | Tên đầy đủ của hãng hàng không |
| `logo_url` | String | URL logo của hãng hàng không |
| `country_id` | Integer | ID quốc gia của hãng hàng không |
| `Country` | Object | Thông tin quốc gia |
| `Country.country_id` | Integer | ID quốc gia |
| `Country.country_name` | String | Tên quốc gia |
| `Country.country_code` | String | Mã quốc gia (2 ký tự) |

### Example Usage

#### cURL
```bash
curl -X GET "http://localhost:3000/api/flights/airlines" \
  -H "Content-Type: application/json"
```

#### JavaScript (Fetch)
```javascript
fetch('http://localhost:3000/api/flights/airlines')
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('Airlines:', data.data);
      data.data.forEach(airline => {
        console.log(`${airline.airline_name} (${airline.airline_code})`);
      });
    }
  })
  .catch(error => console.error('Error:', error));
```

#### JavaScript (Axios)
```javascript
const axios = require('axios');

axios.get('http://localhost:3000/api/flights/airlines')
  .then(response => {
    if (response.data.success) {
      console.log('Airlines:', response.data.data);
    }
  })
  .catch(error => console.error('Error:', error));
```

### Use Cases

1. **Dropdown Selection**: Hiển thị danh sách hãng hàng không trong dropdown khi user tìm kiếm chuyến bay
2. **Filter Options**: Cho phép user lọc chuyến bay theo hãng hàng không
3. **Airline Information**: Hiển thị thông tin hãng hàng không trong giao diện
4. **Mobile App**: Lấy danh sách hãng hàng không để hiển thị trong mobile app

### Notes

- API trả về danh sách được sắp xếp theo tên hãng hàng không (A-Z)
- Bao gồm thông tin quốc gia của mỗi hãng hàng không
- Không cần authentication, có thể gọi từ frontend hoặc mobile app
- Response format nhất quán với các API khác trong hệ thống

### Testing

Để test API này, bạn có thể sử dụng:

```bash
# Test bằng script
npm run test:airlines

# Hoặc test trực tiếp
curl -X GET "http://localhost:3000/api/flights/airlines"
```

### Related APIs

- `GET /api/flights/search` - Tìm kiếm chuyến bay
- `GET /api/flights/list` - Lấy danh sách chuyến bay
- `GET /api/flights/:flightId` - Lấy chi tiết chuyến bay
