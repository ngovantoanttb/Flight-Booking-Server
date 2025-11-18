## Hệ Thống Đặt Vé – Tổng Kết Triển Khai

### Phần ĐÃ hoàn thành

- Kiểm tra hợp lệ hành khách và người liên hệ
  - Bắt buộc trường liên hệ: email, phone, first_name, last_name (khi tạo booking).
  - Quy tắc hành khách: người lớn (>=12), trẻ em (2–11), em bé (<2); từ chối nếu `passenger_type` không khớp tuổi.
  - Kiểm tra cơ bản theo hành khách (citizen_id, passport_number, title, nationality).

- Tính tiền booking và ánh xạ dữ liệu
  - Hỗ trợ giá vé theo hạng/loại gói, số lượng suất ăn theo hành khách, và hành lý.
  - Điều chỉnh ánh xạ: hành lý chọn RIÊNG theo từng hành khách (lưu vào `BookingDetail.baggage_option_id` khi gửi `baggage_options[{passenger_id,baggage_id}]`).
  - Tương thích ngược: vẫn chấp nhận `selected_baggage_services` và `selected_meal_services` để tính phí.
  - Lưu chi tiết phí trên `Booking` (base_amount, baggage_fees, meal_fees, service_package_fees, discount_amount, final_amount) và JSON dịch vụ đã chọn.
  - ĐÃ bỏ thuế theo yêu cầu.

- Email thông báo
  - Mẫu HTML hiển thị bảng chi tiết thanh toán, kèm thông tin chuyến bay và số lượng hành khách chính xác.

- Service Packages và liên kết
  - Endpoint public xem gói dịch vụ; chuẩn hoá field trả về (`service_package_id`).
  - `BookingDetail` liên kết `FlightBaggageService` (alias `BaggageService`) và `FlightMealService` (alias `MealService`).

- API Contacts và tạo contact khi booking
  - Khi đặt vé sẽ tạo contact; `/api/contacts` trả danh sách liên hệ.

### Đang làm / Kế tiếp

- Giá vé và hiển thị
  - Thêm giá Economy/Business cho `Flight` và trả về trong API tìm kiếm/chi tiết.

- Loại sân bay / loại máy bay
  - Thêm trường `airport_type` và `aircraft_type`; quản trị trong admin.

- Chi tiết hãng hàng không / cấu hình dịch vụ
  - Admin API xem chi tiết hãng và cấu hình gói (Economy/Business × Class/Plus hệ số 1.0/1.2).

- API chi tiết chuyến bay public
  - Trả đầy đủ thông tin chuyến bay, dịch vụ hành lý/đồ ăn và danh sách gói.

- Xác nhận tổng tiền cuối cùng
  - Rà soát sau khi áp dụng hành lý theo hành khách và hiển thị giá vé trong tìm kiếm.

### Thay đổi CSDL (migrations)

- Bổ sung cột phí cho `bookings`: base_amount, baggage_fees, meal_fees, service_package_fees, discount_amount, discount_code, discount_percentage, tax_amount, final_amount.
- Thêm cột JSON cho `bookings`: selected_baggage_services, selected_meal_services.
- Chuẩn hoá hệ số gói: Class 1.0, Plus 1.2 cho cả Economy/Business.

### File chính đã cập nhật

- `src/controllers/bookingController.js`
  - Bắt buộc trường liên hệ.
  - Chuyển `meal_options` và `baggage_options` sang selected services và map theo hành khách (set `BookingDetail.meal_option_id` và `baggage_option_id`).
  - Lưu chi tiết phí, dịch vụ chọn; gửi email payload đầy đủ.

- `src/services/passengerValidationService.js`
  - Suy luận `passenger_type` theo tuổi và báo lỗi nếu lệch.
  - Tiện ích kiểm tra và tính giá theo loại hành khách.

- `src/services/realEmailService.js`
  - Mẫu HTML bảng chi tiết và thông tin chuyến bay.

- `src/models/index.js`
  - `BookingDetail` → `FlightBaggageService` (as `BaggageService`), và → `FlightMealService` (as `MealService`).

- `src/services/adminService.js`
  - Include `BaggageService` và `MealService` khi lấy chi tiết booking cho admin.

### Ghi chú sử dụng API

- Tạo booking (POST `/api/booking`)
  - contact_info bắt buộc: { email, phone, first_name, last_name }
  - Passengers: gồm `first_name`, `last_name`, `gender`, `date_of_birth`, `nationality`, `passenger_type`, `citizen_id`, `title`, `passport_number` (nếu cần).
  - Suất ăn theo hành khách:
    - `meal_options`: [{ passenger_id: (1-based), meal_id, quantity }]
  - Hành lý theo hành khách (không có quantity):
    - `baggage_options`: [{ passenger_id: (1-based), baggage_id }]
  - Tương thích cũ cho mục đích tính phí:
    - `selected_meal_services`: [{ service_id, quantity }]
    - `selected_baggage_services`: [{ service_id, quantity: 1 }]

- Service Packages
  - Endpoint public truy vấn theo hãng/chuyến bay (trả `service_package_id`, type, class_type, multiplier).

### Quy tắc kiểm tra

- Ít nhất 1 người lớn; tối đa 6 trẻ em/người lớn; tối đa 1 em bé/người lớn.
- `passenger_type` phải khớp tuổi theo `date_of_birth`, nếu không sẽ bị từ chối.
- Liên hệ bắt buộc có email, phone, first_name, last_name.

### Tổng quan tính tiền (hiện tại)

- Vé cơ bản: theo hạng/gói và số lượng hành khách; hỗ trợ giá trẻ em/em bé.
- Suất ăn: theo hành khách, có quantity.
- Hành lý: theo hành khách (mỗi lựa chọn tính như quantity 1 vào tổng phí).
- Giảm giá: áp dụng sau khi cộng các thành phần.
- Thuế: đã bỏ (0).

### Gợi ý kiểm thử

- Tạo chuyến bay có dịch vụ hành lý/đồ ăn; sau đó đặt vé với:
  - `meal_options` và `baggage_options` dùng đúng ID dịch vụ của chuyến bay.
  - Kiểm tra `BookingDetails[].meal_option_id` và `BookingDetails[].baggage_option_id` có giá trị và `BaggageService`/`MealService` xuất hiện trong response.
  - Kiểm tra log email để thấy bảng HTML chi tiết.

### Hạng mục còn lại để hoàn tất

- Thêm giá Economy/Business cho chuyến bay và hiển thị trong tìm kiếm.
- Thêm trường loại sân bay/máy bay và trang quản trị.
- API chi tiết hãng + cấu hình gói dịch vụ.
- API public chi tiết chuyến bay kèm dịch vụ và gói.
- Xác nhận tổng tiền sau khi chọn đầy đủ và áp dụng khuyến mãi.
