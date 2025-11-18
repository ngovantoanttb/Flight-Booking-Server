# Admin API - Ví dụ Request với đầy đủ tham số

Tài liệu này cung cấp các ví dụ request đầy đủ với tất cả các tham số filter cho các endpoint admin.

## 1. Sân bay (Airports)

### Endpoint: `GET /api/admin/airports`

**Ví dụ với đầy đủ tham số:**
```
GET http://localhost:3000/api/admin/airports?airport_code=SGN&airport_name=Tan%20Son%20Nhat&city=Ho%20Chi%20Minh&airport_type=international&country_id=1&page=1&limit=10
```

**Các tham số có thể truyền:**
- `airport_code` - Mã sân bay (ví dụ: SGN, HAN)
- `airport_name` - Tên sân bay (ví dụ: Tan Son Nhat International Airport)
- `city` - Thành phố (ví dụ: Ho Chi Minh City)
- `airport_type` - Loại sân bay: `domestic` hoặc `international`
- `country_id` - ID quốc gia (ví dụ: 1)
- `search` - Tìm kiếm chung (tìm trong mã, tên, thành phố)
- `page` - Trang hiện tại (mặc định: 1)
- `limit` - Số lượng kết quả mỗi trang (mặc định: 10, tối đa: 100)

**Ví dụ khác:**
```
# Tìm sân bay quốc tế ở Việt Nam
GET http://localhost:3000/api/admin/airports?airport_type=international&country_id=1&page=1&limit=20

# Tìm kiếm theo tên
GET http://localhost:3000/api/admin/airports?airport_name=Noi%20Bai&page=1&limit=10

# Tìm kiếm chung
GET http://localhost:3000/api/admin/airports?search=SGN&page=1&limit=10
```

---

## 2. Hãng hàng không (Airlines)

### Endpoint: `GET /api/admin/airlines`

**Ví dụ với đầy đủ tham số:**
```
GET http://localhost:3000/api/admin/airlines?airline_code=VN&airline_name=Vietnam%20Airlines&country_id=1&is_active=true&page=1&limit=10
```

**Các tham số có thể truyền:**
- `airline_code` - Mã hãng hàng không (ví dụ: VN, VJ)
- `airline_name` - Tên hãng hàng không (ví dụ: Vietnam Airlines)
- `country_id` - ID quốc gia (ví dụ: 1)
- `is_active` - Trạng thái hoạt động: `true` hoặc `false`
- `search` - Tìm kiếm chung (tìm trong mã, tên)
- `page` - Trang hiện tại (mặc định: 1)
- `limit` - Số lượng kết quả mỗi trang (mặc định: 10, tối đa: 100)

**Ví dụ khác:**
```
# Tìm hãng hàng không đang hoạt động
GET http://localhost:3000/api/admin/airlines?is_active=true&page=1&limit=10

# Tìm theo mã
GET http://localhost:3000/api/admin/airlines?airline_code=VN&page=1&limit=10

# Tìm kiếm chung
GET http://localhost:3000/api/admin/airlines?search=Vietnam&page=1&limit=10
```

---

## 3. Chuyến bay (Flights)

### Endpoint: `GET /api/admin/flights`

**Ví dụ với đầy đủ tham số:**
```
GET http://localhost:3000/api/admin/flights?flight_number=VN494&airline_id=1&flight_type=domestic&status=scheduled&departure_airport_id=1&arrival_airport_id=2&departure_time_from=2025-01-01T00:00:00Z&departure_time_to=2025-12-31T23:59:59Z&arrival_time_from=2025-01-01T00:00:00Z&arrival_time_to=2025-12-31T23:59:59Z&page=1&limit=10
```

**Các tham số có thể truyền:**
- `flight_number` - Mã chuyến bay (ví dụ: VN494, VJ123)
- `airline_id` - ID hãng hàng không (ví dụ: 1)
- `flight_type` - Loại chuyến bay: `domestic`, `international`, `nội địa`, `quốc tế`
- `status` - Trạng thái: `scheduled`, `delayed`, `cancelled`, `completed`
- `departure_airport_id` - ID sân bay đi (ví dụ: 1)
- `arrival_airport_id` - ID sân bay đến (ví dụ: 2)
- `departure_time_from` - Thời gian khởi hành từ (ISO 8601 format)
- `departure_time_to` - Thời gian khởi hành đến (ISO 8601 format)
- `arrival_time_from` - Thời gian đến từ (ISO 8601 format)
- `arrival_time_to` - Thời gian đến đến (ISO 8601 format)
- `page` - Trang hiện tại (mặc định: 1)
- `limit` - Số lượng kết quả mỗi trang (mặc định: 10, tối đa: 100)

**Ví dụ khác:**
```
# Tìm chuyến bay nội địa đã lên lịch
GET http://localhost:3000/api/admin/flights?flight_type=domestic&status=scheduled&page=1&limit=10

# Tìm chuyến bay trong khoảng thời gian
GET http://localhost:3000/api/admin/flights?departure_time_from=2025-11-01T00:00:00Z&departure_time_to=2025-11-30T23:59:59Z&page=1&limit=10

# Tìm chuyến bay của một hãng cụ thể
GET http://localhost:3000/api/admin/flights?airline_id=1&status=scheduled&page=1&limit=10

# Tìm chuyến bay quốc tế
GET http://localhost:3000/api/admin/flights?flight_type=international&page=1&limit=10
```

---

## 4. Hành khách (Passengers)

### Endpoint: `GET /api/admin/passengers`

**Ví dụ với đầy đủ tham số:**
```
GET http://localhost:3000/api/admin/passengers?passenger_id=1&first_name=Nguyen&last_name=Van&title=Mr&passport_number=P12345678&date_of_birth=1990-01-01&nationality=Vietnam&passenger_type=adult&page=1&limit=10
```

**Các tham số có thể truyền:**
- `passenger_id` - Mã hành khách (ví dụ: 1)
- `first_name` - Họ (ví dụ: Nguyen)
- `last_name` - Tên (ví dụ: Van)
- `title` - Danh xưng (ví dụ: Mr, Mrs, Ms)
- `passport_number` - Mã CCCD/Hộ chiếu (tìm cả passport_number và citizen_id)
- `date_of_birth` - Ngày sinh (format: YYYY-MM-DD)
- `nationality` - Quốc tịch (ví dụ: Vietnam)
- `passenger_type` - Loại hành khách: `adult`, `child`, `infant`
- `search` - Tìm kiếm chung (tìm trong họ, tên, passport, CCCD)
- `page` - Trang hiện tại (mặc định: 1)
- `limit` - Số lượng kết quả mỗi trang (mặc định: 10, tối đa: 100)

**Ví dụ khác:**
```
# Tìm hành khách người lớn
GET http://localhost:3000/api/admin/passengers?passenger_type=adult&page=1&limit=10

# Tìm theo họ tên
GET http://localhost:3000/api/admin/passengers?first_name=Nguyen&last_name=Van&page=1&limit=10

# Tìm theo mã CCCD/Hộ chiếu
GET http://localhost:3000/api/admin/passengers?passport_number=P12345678&page=1&limit=10

# Tìm trẻ em
GET http://localhost:3000/api/admin/passengers?passenger_type=child&page=1&limit=10

# Tìm kiếm chung
GET http://localhost:3000/api/admin/passengers?search=Nguyen&page=1&limit=10
```

---

## 5. Máy bay (Aircraft)

### Endpoint: `GET /api/admin/aircraft`

**Ví dụ với đầy đủ tham số:**
```
GET http://localhost:3000/api/admin/aircraft?aircraft_id=1&model=Airbus%20A321&airline_id=1&aircraft_type=Airbus&page=1&limit=10
```

**Các tham số có thể truyền:**
- `aircraft_id` - Mã máy bay (ví dụ: 1)
- `model` - Tên máy bay (ví dụ: Airbus A321)
- `airline_id` - ID hãng hàng không (ví dụ: 1)
- `aircraft_type` - Loại máy bay (ví dụ: Airbus, Boeing)
- `search` - Tìm kiếm chung (tìm trong model, aircraft_type)
- `page` - Trang hiện tại (mặc định: 1)
- `limit` - Số lượng kết quả mỗi trang (mặc định: 10, tối đa: 100)

**Ví dụ khác:**
```
# Tìm máy bay của một hãng
GET http://localhost:3000/api/admin/aircraft?airline_id=1&page=1&limit=10

# Tìm theo model
GET http://localhost:3000/api/admin/aircraft?model=Airbus&page=1&limit=10

# Tìm theo loại
GET http://localhost:3000/api/admin/aircraft?aircraft_type=Boeing&page=1&limit=10

# Tìm kiếm chung
GET http://localhost:3000/api/admin/aircraft?search=A321&page=1&limit=10
```

---

## 6. Người liên hệ (Contacts)

### Endpoint: `GET /api/admin/contacts`

**Ví dụ với đầy đủ tham số:**
```
GET http://localhost:3000/api/admin/contacts?contact_id=1&first_name=Nguyen&last_name=Van&phone=%2B84901234567&email=example%40email.com&page=1&limit=10
```

**Các tham số có thể truyền:**
- `contact_id` - Mã người liên hệ (ví dụ: 1)
- `first_name` - Họ (ví dụ: Nguyen)
- `last_name` - Tên (ví dụ: Van)
- `phone` - Số điện thoại (ví dụ: +84901234567)
- `email` - Email (ví dụ: example@email.com)
- `page` - Trang hiện tại (mặc định: 1)
- `limit` - Số lượng kết quả mỗi trang (mặc định: 10, tối đa: 100)

**Ví dụ khác:**
```
# Tìm theo email
GET http://localhost:3000/api/admin/contacts?email=example%40email.com&page=1&limit=10

# Tìm theo số điện thoại
GET http://localhost:3000/api/admin/contacts?phone=%2B84901234567&page=1&limit=10

# Tìm theo họ tên
GET http://localhost:3000/api/admin/contacts?first_name=Nguyen&last_name=Van&page=1&limit=10
```

---

## 7. Khuyến mãi (Promotions)

### Endpoint: `GET /api/admin/promotions`

**Ví dụ với đầy đủ tham số:**
```
GET http://localhost:3000/api/admin/promotions?promotion_code=FIRSTTIME&description=First%20Time%20Customer&discount_type=percentage&is_active=true&page=1&limit=10
```

**Các tham số có thể truyền:**
- `promotion_code` - Mã khuyến mãi (ví dụ: FIRSTTIME)
- `description` - Tên/Mô tả khuyến mãi (ví dụ: First Time Customer)
- `discount_type` - Loại khuyến mãi: `percentage` hoặc `fixed_amount`
- `is_active` - Trạng thái hoạt động: `true` hoặc `false`
- `search` - Tìm kiếm chung (tìm trong mã, mô tả)
- `page` - Trang hiện tại (mặc định: 1)
- `limit` - Số lượng kết quả mỗi trang (mặc định: 10, tối đa: 100)

**Ví dụ khác:**
```
# Tìm khuyến mãi đang hoạt động
GET http://localhost:3000/api/admin/promotions?is_active=true&page=1&limit=10

# Tìm theo mã
GET http://localhost:3000/api/admin/promotions?promotion_code=FIRSTTIME&page=1&limit=10

# Tìm theo loại
GET http://localhost:3000/api/admin/promotions?discount_type=percentage&page=1&limit=10

# Tìm kiếm chung
GET http://localhost:3000/api/admin/promotions?search=First&page=1&limit=10
```

---

## Lưu ý khi sử dụng:

1. **URL Encoding**: Các ký tự đặc biệt trong URL cần được encode:
   - Space → `%20` hoặc `+`
   - `@` → `%40`
   - `+` → `%2B`
   - `&` → `%26`

2. **Date Format**: Sử dụng ISO 8601 format cho các tham số thời gian:
   - `2025-01-01T00:00:00Z`
   - `2025-12-31T23:59:59Z`

3. **Pagination**: Luôn có thể sử dụng `page` và `limit` để phân trang

4. **Kết hợp nhiều filter**: Có thể kết hợp nhiều tham số cùng lúc để lọc chính xác hơn

5. **Authentication**: Tất cả các endpoint đều yêu cầu authentication và quyền admin

---

## Ví dụ sử dụng với cURL:

```bash
# Sân bay
curl -X GET "http://localhost:3000/api/admin/airports?airport_code=SGN&city=Ho%20Chi%20Minh&country_id=1&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Hãng hàng không
curl -X GET "http://localhost:3000/api/admin/airlines?airline_code=VN&country_id=1&is_active=true&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Chuyến bay
curl -X GET "http://localhost:3000/api/admin/flights?flight_number=VN494&airline_id=1&flight_type=domestic&status=scheduled&departure_airport_id=1&arrival_airport_id=2&departure_time_from=2025-01-01T00:00:00Z&departure_time_to=2025-12-31T23:59:59Z&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Hành khách
curl -X GET "http://localhost:3000/api/admin/passengers?first_name=Nguyen&passenger_type=adult&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Máy bay
curl -X GET "http://localhost:3000/api/admin/aircraft?model=Airbus%20A321&airline_id=1&aircraft_type=Airbus&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Người liên hệ
curl -X GET "http://localhost:3000/api/admin/contacts?first_name=Nguyen&last_name=Van&phone=%2B84901234567&email=example%40email.com&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Khuyến mãi
curl -X GET "http://localhost:3000/api/admin/promotions?promotion_code=FIRSTTIME&discount_type=percentage&is_active=true&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Ví dụ sử dụng với JavaScript (Fetch API):

```javascript
// Sân bay
fetch('http://localhost:3000/api/admin/airports?airport_code=SGN&city=Ho%20Chi%20Minh&country_id=1&page=1&limit=10', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
})

// Hãng hàng không
fetch('http://localhost:3000/api/admin/airlines?airline_code=VN&country_id=1&is_active=true&page=1&limit=10', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
})

// Chuyến bay
fetch('http://localhost:3000/api/admin/flights?flight_number=VN494&airline_id=1&flight_type=domestic&status=scheduled&departure_airport_id=1&arrival_airport_id=2&departure_time_from=2025-01-01T00:00:00Z&departure_time_to=2025-12-31T23:59:59Z&page=1&limit=10', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
})

// Hành khách
fetch('http://localhost:3000/api/admin/passengers?first_name=Nguyen&passenger_type=adult&page=1&limit=10', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
})

// Máy bay
fetch('http://localhost:3000/api/admin/aircraft?model=Airbus%20A321&airline_id=1&aircraft_type=Airbus&page=1&limit=10', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
})

// Người liên hệ
fetch('http://localhost:3000/api/admin/contacts?first_name=Nguyen&last_name=Van&phone=%2B84901234567&email=example%40email.com&page=1&limit=10', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
})

// Khuyến mãi
fetch('http://localhost:3000/api/admin/promotions?promotion_code=FIRSTTIME&discount_type=percentage&is_active=true&page=1&limit=10', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
})
```

---

## Ví dụ sử dụng với Postman:

1. **Method**: GET
2. **URL**: `http://localhost:3000/api/admin/passengers`
3. **Params Tab**:
   - `first_name`: `Nguyen`
   - `passenger_type`: `adult`
   - `page`: `1`
   - `limit`: `10`
4. **Headers Tab**:
   - `Authorization`: `Bearer YOUR_TOKEN`

---

## Response Format:

Tất cả các endpoint đều trả về format chuẩn:

```json
{
  "success": true,
  "message": "Passengers retrieved successfully",
  "data": [
    {
      "passenger_id": 1,
      "first_name": "Nguyen",
      "last_name": "Van",
      ...
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "meta": null,
  "timestamp": "2025-11-09T10:00:00.000Z"
}
```
