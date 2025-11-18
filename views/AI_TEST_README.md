# AI Flight Recommendation Test Interface

## 🎯 Tổng quan

Giao diện test AI được thiết kế để test trực quan tất cả các tính năng AI của hệ thống Flight Booking. Giao diện này cung cấp một cách dễ dàng và trực quan để test các AI APIs mà không cần sử dụng Postman hoặc các công cụ khác.

## 🚀 Cách truy cập

1. **Khởi động server:**
   ```bash
   npm run dev
   ```

2. **Truy cập giao diện:**
   ```
   http://localhost:3000/ai-test
   ```

## 🔑 Authentication

### JWT Token
- Giao diện sử dụng JWT token để xác thực
- Token mặc định được cung cấp sẵn cho user test
- Có thể thay đổi token nếu cần test với user khác

### Test User
- **Email:** test@flightbooking.com
- **Password:** test123
- **Token:** Được cung cấp sẵn trong giao diện

## 🧪 Các tính năng test

### 1. **Personalized Flight Recommendations**
- **Mục đích:** Test AI gợi ý chuyến bay cá nhân hóa
- **Cách sử dụng:**
  1. Chọn sân bay đi và đến
  2. Chọn ngày khởi hành
  3. Chọn hạng vé (Economy/Business)
  4. Chọn số lượng gợi ý (5-20)
  5. Click "Get AI Recommendations"

- **Kết quả:** Hiển thị danh sách chuyến bay được AI gợi ý với:
  - Điểm số gợi ý (0-100%)
  - Lý do gợi ý
  - Thông tin chuyến bay chi tiết
  - Giá vé

### 2. **AI Booking Assistance**
- **Mục đích:** Test AI hỗ trợ đặt vé thông minh
- **Cách sử dụng:**
  1. Nhập Flight ID
  2. Chọn số hành khách
  3. Chọn hạng vé
  4. Click "Get Booking Tips"

- **Kết quả:** Hiển thị:
  - Thông tin chuyến bay
  - Mẹo đặt vé từ AI
  - Phân tích giá cả
  - Khuyến nghị thời gian đặt vé

### 3. **User Behavior Insights**
- **Mục đích:** Test phân tích hành vi người dùng
- **Cách sử dụng:**
  1. Chọn loại phân tích (Preferences/Patterns/Recommendations/Search History)
  2. Chọn khoảng thời gian
  3. Click "Analyze User Behavior"

- **Kết quả:** Hiển thị:
  - Sở thích du lịch
  - Mẫu hành vi
  - Lịch sử gợi ý
  - Lịch sử tìm kiếm

### 4. **Smart Search Suggestions**
- **Mục đích:** Test gợi ý tìm kiếm thông minh
- **Cách sử dụng:**
  1. Nhập query tìm kiếm (VD: "SGN to HAN")
  2. Chọn loại gợi ý
  3. Click "Get Smart Suggestions"

- **Kết quả:** Hiển thị các gợi ý thông minh dựa trên:
  - Tuyến đường phổ biến
  - Gợi ý sân bay
  - Gợi ý ngày
  - Xu hướng giá

## 📊 Hiển thị kết quả

### Recommendation Cards
- **Score Badge:** Màu sắc theo điểm số
  - 🟢 Xanh: 80-100% (Cao)
  - 🟡 Vàng: 60-79% (Trung bình)
  - 🔴 Đỏ: 0-59% (Thấp)

### Flight Information
- **Departure/Arrival:** Sân bay và thành phố
- **Time:** Thời gian khởi hành/đến
- **Price:** Giá vé định dạng VND
- **Class:** Hạng vé

### AI Insights
- **Preferences:** Sở thích du lịch
- **Patterns:** Mẫu hành vi
- **Statistics:** Thống kê chi tiết

## 🔧 Troubleshooting

### Lỗi thường gặp

1. **"Please test connection first!"**
   - **Nguyên nhân:** Chưa test kết nối
   - **Giải pháp:** Click "Test Connection" trước

2. **"Connection failed"**
   - **Nguyên nhân:** Token không hợp lệ hoặc server chưa chạy
   - **Giải pháp:**
     - Kiểm tra server đã chạy chưa
     - Kiểm tra token có đúng không
     - Thử đăng nhập lại để lấy token mới

3. **"No recommendations found"**
   - **Nguyên nhân:** Không có dữ liệu phù hợp
   - **Giải pháp:**
     - Thử thay đổi ngày khởi hành
     - Thử tuyến đường khác
     - Kiểm tra dữ liệu đã được seed chưa

4. **"Unable to get insights"**
   - **Nguyên nhân:** User chưa có đủ dữ liệu
   - **Giải pháp:**
     - Chạy enhanced AI data seeding
     - Thử với user khác có nhiều dữ liệu hơn

### Kiểm tra dữ liệu

```bash
# Kiểm tra dữ liệu AI
npm run stats:ai:enhanced

# Seed thêm dữ liệu nếu cần
npm run seed:ai:enhanced
```

## 📈 Performance Tips

### Tối ưu hóa test
1. **Sử dụng dữ liệu thực tế:** Đảm bảo đã seed đủ dữ liệu
2. **Test từng tính năng:** Không test tất cả cùng lúc
3. **Kiểm tra network:** Đảm bảo kết nối ổn định
4. **Clear cache:** Refresh trang nếu có lỗi

### Dữ liệu test tốt nhất
- **Users:** 10+ users với lịch sử tìm kiếm
- **Flights:** 200+ chuyến bay đa dạng
- **Search History:** 500+ lịch sử tìm kiếm
- **Recommendations:** 300+ gợi ý AI

## 🎨 Customization

### Thay đổi giao diện
- **Colors:** Sửa CSS variables trong `<style>`
- **Layout:** Thay đổi Bootstrap classes
- **Icons:** Thay đổi Font Awesome icons

### Thêm tính năng mới
1. Thêm test card mới trong HTML
2. Thêm JavaScript function tương ứng
3. Thêm API endpoint nếu cần

## 📝 Logs và Debugging

### Browser Console
- Mở Developer Tools (F12)
- Xem tab Console để debug
- Kiểm tra Network tab cho API calls

### Server Logs
```bash
# Xem logs server
npm run dev

# Logs sẽ hiển thị:
# - API requests
# - Database queries
# - AI processing
# - Errors
```

## 🔗 Related Files

- **HTML:** `views/ai-test.html`
- **Server Route:** `src/server.js` (line 100-102)
- **AI APIs:** `src/routes/ai.routes.js`
- **AI Service:** `src/services/aiRecommendationService.js`
- **AI Controller:** `src/controllers/aiController.js`

## 🚀 Next Steps

1. **Test tất cả tính năng** với dữ liệu thực
2. **Tối ưu hóa AI algorithms** dựa trên kết quả
3. **Thêm tính năng mới** nếu cần
4. **Tích hợp vào frontend** chính

---

**Lưu ý:** Giao diện này chỉ dành cho testing và development. Không sử dụng trong production environment.
