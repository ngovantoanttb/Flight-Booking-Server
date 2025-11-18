# New Features API Testing Guide

Hướng dẫn test các tính năng mới đã implement theo `requirement.txt`.

## 📁 Files trong thư mục Postman

- `New_Features_API_Collection.json` - Postman collection chứa tất cả API endpoints
- `New_Features_Environment.json` - Environment variables cho Postman
- `run-new-features-tests.js` - Script tự động test tất cả APIs
- `run-new-features-tests.bat` - Batch file để chạy tests trên Windows
- `New_Features_Testing_README.md` - File hướng dẫn này

## 🚀 Cách sử dụng

### Option 1: Sử dụng Postman (Manual Testing)

1. **Import Collection và Environment:**
   - Mở Postman
   - Import `New_Features_API_Collection.json`
   - Import `New_Features_Environment.json`
   - Select environment "New Features Environment"

2. **Test theo thứ tự:**
   - **Authentication** → Login Admin để lấy token
   - **Contact Management** → Test quản lý contacts
   - **Service Package Management** → Test quản lý service packages
   - **Enhanced Flight Management** → Test quản lý flights nâng cao
   - **Passenger Validation Testing** → Test validation rules
   - **User Contact Management** → Test quản lý contacts của user

### Option 2: Sử dụng Script tự động (Automated Testing)

1. **Chạy server:**
   ```bash
   npm run dev
   ```

2. **Chạy tests tự động:**
   ```bash
   # Windows
   cd postman
   run-new-features-tests.bat

   # Hoặc chạy trực tiếp
   node run-new-features-tests.js
   ```

## 🧪 Test Scenarios

### 1. Authentication Tests
- ✅ Admin Login với credentials: `admin@test.com` / `admin123`

### 2. Contact Management Tests
- ✅ Get All Contacts (Admin)
- ✅ Get Contact Stats (Admin)
- ✅ Search Contacts (Admin)
- ✅ Update Contact (Admin)

### 3. Service Package Management Tests
- ✅ Get All Service Packages (Admin)
- ✅ Get Airline Service Packages (Public)
- ✅ Get Pricing Summary (Public)
- ✅ Create Default Packages (Admin)

### 4. Enhanced Flight Management Tests
- ✅ Get All Flights with Enhanced Info (Admin)
- ✅ Filter Flights by Status (Admin)
- ✅ Filter Flights by Airline (Admin)

### 5. Passenger Validation Tests
- ✅ Valid Passengers (1 adult + 1 child) → Should PASS
- ✅ Invalid: No Adults → Should FAIL
- ✅ Invalid: Too Many Children (1 adult + 7 children) → Should FAIL
- ✅ Invalid: Too Many Infants (1 adult + 2 infants) → Should FAIL

### 6. User Contact Management Tests
- ✅ Get User Contacts
- ✅ Create User Contact
- ✅ Update User Contact
- ✅ Delete User Contact

## 📊 Expected Results

### ✅ Success Cases:
- **Status 200**: GET requests thành công
- **Status 201**: POST requests tạo mới thành công
- **Valid passenger combinations**: Booking được tạo thành công

### ❌ Expected Failures:
- **Status 400**: Passenger validation failures
- **Status 401**: Unauthorized (không có token)
- **Status 403**: Forbidden (không có quyền admin)

## 🔧 Troubleshooting

### Server không chạy:
```bash
npm run dev
```

### Database chưa có dữ liệu:
```bash
npm run seed:all:enhanced
```

### Test user chưa tồn tại:
```bash
npm run create:test-user
```

### Lỗi kết nối database:
- Kiểm tra MySQL service đang chạy
- Kiểm tra cấu hình database trong `src/config/database.js`

## 📝 API Endpoints Summary

### Authentication
- `POST /api/auth/login` - Login admin user

### Contact Management (Admin)
- `GET /api/admin/contacts` - Get all contacts
- `GET /api/admin/contacts/:id` - Get contact by ID
- `PUT /api/admin/contacts/:id` - Update contact
- `GET /api/admin/contacts/search` - Search contacts
- `GET /api/admin/contacts/stats` - Get contact stats

### Service Package Management
- `GET /api/admin/service-packages` - Get all packages (Admin)
- `GET /api/admin/service-packages/:id` - Get package by ID (Admin)
- `POST /api/admin/service-packages` - Create package (Admin)
- `PUT /api/admin/service-packages/:id` - Update package (Admin)
- `DELETE /api/admin/service-packages/:id` - Delete package (Admin)
- `GET /api/service-packages/airline/:airlineId` - Get airline packages (Public)
- `GET /api/service-packages/airline/:airlineId/pricing-summary` - Get pricing (Public)
- `POST /api/admin/service-packages/airline/:airlineId/create-defaults` - Create defaults (Admin)

### Enhanced Flight Management (Admin)
- `GET /api/admin/flights` - Get all flights with enhanced info
- `GET /api/admin/flights/:id` - Get flight by ID with enhanced info

### User Contact Management
- `GET /api/contacts` - Get user's contacts
- `GET /api/contacts/:id` - Get user's contact by ID
- `POST /api/contacts` - Create user's contact
- `PUT /api/contacts/:id` - Update user's contact
- `DELETE /api/contacts/:id` - Delete user's contact

### Booking (với Passenger Validation)
- `POST /api/bookings` - Create booking (với validation rules mới)

## 🎯 Key Features Tested

1. **Passenger Validation Rules:**
   - Minimum 1 adult per booking
   - 1 adult max 6 children
   - 1 adult max 1 infant

2. **Enhanced Contact Information:**
   - Middle name support
   - Title support (Mr, Mrs, Ms, Dr, Prof)
   - Citizen ID validation

3. **Service Package Pricing:**
   - Economy/Business Class
   - Standard/Plus packages
   - Price multipliers (Class=1.0, Plus=1.2)

4. **Admin Management:**
   - Enhanced flight information
   - Seat counts (total/booked/available)
   - Service package pricing
   - Contact management
   - Service package CRUD

5. **Database Schema Updates:**
   - New Contact model
   - New ServicePackage model
   - Updated User, Passenger, Airport, Airline, Aircraft models
   - New associations and relationships
