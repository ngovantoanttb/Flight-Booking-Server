# Postman Collections for Flight Booking Admin API

Thư mục này chứa các Postman collection để test toàn bộ Admin API của hệ thống đặt vé máy bay.

## Files

1. **Admin_API_Collection.json** - Collection chính với tất cả endpoints
2. **Admin_API_Tests_Collection.json** - Collection với test cases tự động
3. **Admin_API_Environment.json** - Environment variables
4. **README.md** - Hướng dẫn sử dụng

## Cách sử dụng

### 1. Import vào Postman

1. Mở Postman
2. Click **Import**
3. Chọn tất cả các file JSON trong thư mục này
4. Click **Import**

### 2. Cấu hình Environment

1. Trong Postman, chọn environment **Flight Booking Admin Environment**
2. Cập nhật các biến sau:
   - `base_url`: URL của API server (mặc định: http://localhost:3000/api/admin)
   - `auth_url`: URL của Auth API (mặc định: http://localhost:3000/api/auth)
   - `admin_token`: JWT token của admin user
   - `admin_email`: Email admin để login
   - `admin_password`: Password admin để login

### 3. Lấy Admin Token

#### Cách 1: Sử dụng Login Request trong Test Collection
1. Chạy collection **Admin_API_Tests_Collection**
2. Request đầu tiên "Setup - Login Admin" sẽ tự động lấy token và lưu vào environment

#### Cách 2: Login thủ công
1. Gửi POST request đến `/api/auth/login` với:
   ```json
   {
     "email": "admin@example.com",
     "password": "admin123"
   }
   ```
2. Copy token từ response
3. Paste vào biến `admin_token` trong environment

### 4. Chạy Tests

#### Test toàn bộ API:
1. Chọn collection **Flight Booking Admin API**
2. Click **Run collection**
3. Chọn environment **Flight Booking Admin Environment**
4. Click **Run**

#### Test với automation:
1. Chọn collection **Admin_API_Tests_Collection**
2. Click **Run collection**
3. Các test sẽ tự động validate response và lưu IDs để dùng cho requests tiếp theo

## Cấu trúc Collection

### Admin_API_Collection.json

```
├── 1. Airlines Management
│   ├── Get All Airlines
│   ├── Get Airline by ID
│   ├── Create Airline
│   ├── Update Airline
│   └── Delete Airline
├── 2. Countries Management
├── 3. Airports Management
├── 4. Aircraft Management
├── 5. Passengers Management
├── 6. Promotions Management
├── 7. Bookings Management
├── 8. Users Management
├── 9. Travel Classes Management
├── 10. Baggage Options Management
├── 11. Meal Options Management
└── 12. Statistics & Reports
    ├── Get Overview Statistics
    ├── Get Revenue Statistics
    ├── Get Booking Statistics
    ├── Get Airline Statistics
    ├── Get Passenger Statistics
    └── Get Baggage Statistics
```

### Admin_API_Tests_Collection.json

```
├── Setup - Login Admin
├── Test Complete CRUD - Airlines
│   ├── 1. Create Test Airline
│   ├── 2. Get Created Airline
│   ├── 3. Update Airline
│   └── 4. Delete Airline
├── Test Validation Errors
├── Test Pagination and Search
├── Test Statistics Endpoints
└── Test Authorization
```

## Test Scenarios

### 1. CRUD Operations
- Tạo, đọc, cập nhật, xóa cho tất cả entities
- Validation data đầu vào
- Kiểm tra response format

### 2. Authentication & Authorization
- Kiểm tra yêu cầu JWT token
- Kiểm tra quyền admin
- Test truy cập không được phép

### 3. Pagination & Search
- Test phân trang với các tham số khác nhau
- Test tìm kiếm với từ khóa
- Test filter theo các tiêu chí

### 4. Statistics & Reports
- Kiểm tra các endpoint thống kê
- Validate format dữ liệu trả về
- Test với các period khác nhau

### 5. Error Handling
- Test với dữ liệu không hợp lệ
- Test với ID không tồn tại
- Test validation errors

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `base_url` | Admin API base URL | `http://localhost:3000/api/admin` |
| `auth_url` | Auth API base URL | `http://localhost:3000/api/auth` |
| `admin_token` | JWT token cho admin | `eyJhbGciOiJIUzI1NiIs...` |
| `admin_email` | Email admin | `admin@example.com` |
| `admin_password` | Password admin | `admin123` |
| `test_*_id` | IDs của test data | `1`, `2`, `3` |

## Common Test Scripts

### Pre-request Scripts
```javascript
// Set common headers
pm.request.headers.add({
    key: 'Content-Type',
    value: 'application/json'
});

// Log request info
console.log('Running request: ' + pm.info.requestName);
```

### Test Scripts
```javascript
// Check status code
pm.test('Status code is successful', function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 201, 202, 204]);
});

// Check response format
pm.test('Response has success field', function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
});

// Save ID for next requests
pm.test('Save created ID', function () {
    const jsonData = pm.response.json();
    if (jsonData.success && jsonData.data && jsonData.data.id) {
        pm.environment.set('last_created_id', jsonData.data.id);
    }
});
```

## Troubleshooting

### 1. 401 Unauthorized
- Kiểm tra `admin_token` trong environment
- Đảm bảo token chưa hết hạn
- Chạy lại login request để lấy token mới

### 2. 403 Forbidden
- Đảm bảo user có role `admin`
- Kiểm tra token đúng định dạng Bearer

### 3. 404 Not Found
- Kiểm tra URL base đúng chưa
- Đảm bảo server đang chạy
- Kiểm tra ID tồn tại

### 4. 500 Internal Server Error
- Kiểm tra logs server
- Đảm bảo database đang chạy
- Kiểm tra dữ liệu đầu vào hợp lệ

## Tips

1. **Chạy theo thứ tự**: Một số requests phụ thuộc vào kết quả của requests trước
2. **Kiểm tra Environment**: Đảm bảo chọn đúng environment trước khi chạy
3. **Sử dụng Variables**: Dùng environment variables thay vì hardcode values
4. **Check Tests**: Xem kết quả tests để hiểu response format
5. **Monitor Console**: Kiểm tra Postman console để debug

## Advanced Usage

### 1. Newman (CLI)
```bash
# Install Newman
npm install -g newman

# Run collection
newman run Admin_API_Collection.json -e Admin_API_Environment.json

# Generate HTML report
newman run Admin_API_Collection.json -e Admin_API_Environment.json -r html
```

### 2. CI/CD Integration
```yaml
# GitHub Actions example
- name: Run API Tests
  run: |
    newman run postman/Admin_API_Tests_Collection.json \
           -e postman/Admin_API_Environment.json \
           --reporters cli,junit \
           --reporter-junit-export results.xml
```

### 3. Data-driven Testing
- Sử dụng CSV files để test với nhiều bộ dữ liệu
- Import CSV vào collection runner
- Sử dụng `{{variable}}` syntax trong requests

## Support

Nếu gặp vấn đề:
1. Kiểm tra server logs
2. Xem Postman console
3. Đọc API documentation trong `docs/ADMIN_API.md`
4. Kiểm tra source code trong `src/routes/admin.routes.js`
