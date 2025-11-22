/**
 * Booking Routes
 * Public and protected booking-related endpoints
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const bookingController = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Validation rules
const bookingIdValidation = [
	param('bookingId')
		.isInt({ min: 1 })
		.withMessage('ID đặt chỗ phải là số nguyên dương'),
];

const bookingReferenceValidation = [
	param('bookingReference')
		.notEmpty()
		.withMessage('Mã đặt chỗ là bắt buộc')
		.isLength({ min: 6, max: 8 })
		.withMessage('Mã đặt chỗ phải từ 6 đến 8 ký tự'),
];

// Public booking lookup by booking reference (no auth required)
router.get(
	'/lookup/:bookingReference',
	bookingReferenceValidation,
	validate,
	bookingController.verifyBooking
);

// All routes below require authentication
router.use(protect);

const createBookingValidation = [
	// Support either single-flight fields or itinerary array
	body().custom((value) => {
		const hasSingle =
			value &&
			(value.flight_id || value.class_type || value.service_package_id);
		const hasItinerary = Array.isArray(value && value.itinerary);
		if (!hasSingle && !hasItinerary) {
			throw new Error('Vui lòng cung cấp thông tin chuyến bay đơn hoặc hành trình');
		}
		if (hasSingle && hasItinerary) {
			throw new Error(
				'Chỉ sử dụng thông tin chuyến bay đơn hoặc hành trình, không được dùng cả hai'
			);
		}
		return true;
	}),
	body('flight_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage('ID chuyến bay phải là số nguyên dương'),
	body('class_type')
		.optional()
		.isIn(['economy', 'business'])
		.withMessage('Loại hạng vé phải là economy hoặc business'),
	body('service_package_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage('ID gói dịch vụ phải là số nguyên dương'),
	// Itinerary validation (round-trip/multi-leg)
	body('itinerary')
		.optional()
		.isArray({ min: 1, max: 4 })
		.withMessage('Hành trình phải là mảng từ 1-4 chặng'),
	body('itinerary.*.flight_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage('ID chuyến bay trong hành trình phải là số nguyên dương'),
	body('itinerary.*.class_type')
		.optional()
		.isIn(['economy', 'business'])
		.withMessage('Loại hạng vé trong hành trình phải là economy hoặc business'),
	body('itinerary.*.service_package_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage(
			'ID gói dịch vụ trong hành trình phải là số nguyên dương'
		),
	body('itinerary.*.meal_options')
		.optional()
		.isArray()
		.withMessage('Tùy chọn bữa ăn trong hành trình phải là mảng'),
	body('itinerary.*.meal_options.*.passenger_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage(
			'ID hành khách trong tùy chọn bữa ăn phải là số nguyên dương'
		),
	body('itinerary.*.meal_options.*.meal_service_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage(
			'ID dịch vụ bữa ăn phải là số nguyên dương'
		),
	body('itinerary.*.meal_options.*.quantity')
		.optional()
		.isInt({ min: 1 })
		.withMessage('Số lượng bữa ăn phải >= 1'),
	body('itinerary.*.baggage_options')
		.optional()
		.isArray()
		.withMessage('Tùy chọn hành lý trong hành trình phải là mảng'),
	body('itinerary.*.baggage_options.*.passenger_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage(
			'ID hành khách trong tùy chọn hành lý phải là số nguyên dương'
		),
	body('itinerary.*.baggage_options.*.baggage_service_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage(
			'ID dịch vụ hành lý phải là số nguyên dương'
		),
	body('passengers')
		.isArray({ min: 1 })
		.withMessage('Cần ít nhất một hành khách'),
	body('passengers.*.first_name')
		.notEmpty()
		.withMessage('Họ của hành khách là bắt buộc'),
	body('passengers.*.last_name')
		.notEmpty()
		.withMessage('Tên của hành khách là bắt buộc'),
	body('passengers.*.gender')
		.isIn(['male', 'female', 'other'])
		.withMessage('Giới tính phải là male, female, hoặc other'),
	body('passengers.*.date_of_birth')
		.isDate()
		.withMessage('Ngày sinh phải là ngày hợp lệ'),
	body('passengers.*.nationality')
		.notEmpty()
		.withMessage('Quốc tịch là bắt buộc'),
	body('passengers.*.passenger_type')
		.notEmpty()
		.isIn(['adult', 'child', 'infant'])
		.withMessage('Loại hành khách phải là adult, child, hoặc infant'),
	body('passengers.*.title')
		.notEmpty()
		.isIn(['Mr', 'Mrs', 'Ms', 'Dr', 'Prof'])
		.withMessage('Danh xưng phải là Mr, Mrs, Ms, Dr, hoặc Prof'),
	body('passengers.*.passport_number')
		.notEmpty()
		.isLength({ min: 6, max: 20 })
		.withMessage('Số hộ chiếu phải từ 6 đến 20 ký tự'),
	body('passengers.*.passport_expiry')
		.notEmpty()
		.isDate()
		.withMessage(
			'Ngày hết hạn hộ chiếu là bắt buộc và phải là ngày hợp lệ'
		)
		.custom((value) => {
			const expiryDate = new Date(value);
			const today = new Date();
			const sixMonthsFromNow = new Date();
			sixMonthsFromNow.setMonth(today.getMonth() + 6);

			if (expiryDate <= sixMonthsFromNow) {
				throw new Error(
					'Hộ chiếu phải còn hiệu lực ít nhất 6 tháng kể từ ngày đặt chỗ'
				);
			}
			return true;
		}),
	body('passengers.*.passport_issuing_country')
		.optional()
		.notEmpty()
		.withMessage('Quốc gia cấp hộ chiếu không được để trống nếu được cung cấp'),
	body('passengers.*.citizen_id')
		.notEmpty()
		.matches(/^\d{12}$/)
		.withMessage('Số CCCD/CMND phải có đúng 12 chữ số'),
	body('passengers.*.seat_number')
		.optional()
		.notEmpty()
		.withMessage('Số ghế không được để trống nếu được cung cấp'),
	body('contact_info.email')
		.isEmail()
		.withMessage('Địa chỉ email hợp lệ là bắt buộc'),
	body('contact_info.phone')
		.notEmpty()
		.withMessage('Số điện thoại liên hệ là bắt buộc'),
	body('contact_info.first_name')
		.notEmpty()
		.withMessage('Họ người liên hệ là bắt buộc'),
	body('contact_info.last_name')
		.notEmpty()
		.withMessage('Tên người liên hệ là bắt buộc'),
	// Optional baggage services (shared for booking)
	body('selected_baggage_services')
		.optional()
		.isArray()
		.withMessage('Dịch vụ hành lý đã chọn phải là mảng'),
	body('selected_baggage_services.*.service_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage('ID dịch vụ hành lý phải là số nguyên dương'),
	body('selected_baggage_services.*.quantity')
		.optional()
		.isInt({ min: 1 })
		.withMessage('Số lượng hành lý phải ít nhất là 1'),
	// Flight-level baggage and meal selections
	body('baggage_options')
		.optional()
		.isArray()
		.withMessage('Tùy chọn hành lý phải là mảng'),
	body('baggage_options.*.passenger_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage('ID hành khách trong tùy chọn hành lý phải là số nguyên dương'),
	body('baggage_options.*.baggage_service_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage(
			'ID dịch vụ hành lý phải là số nguyên dương'
		),
	// Meal options (per passenger, allow quantity)
	body('meal_options')
		.optional()
		.isArray()
		.withMessage('Tùy chọn bữa ăn phải là mảng'),
	body('meal_options.*.passenger_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage('ID hành khách trong tùy chọn bữa ăn phải là số nguyên dương'),
	body('meal_options.*.meal_service_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage('ID dịch vụ bữa ăn phải là số nguyên dương'),
	body('meal_options.*.quantity')
		.optional()
		.isInt({ min: 1 })
		.withMessage('Số lượng bữa ăn phải ít nhất là 1'),
	// Promotion code optional
	body('promotion_code')
		.optional()
		.isString()
		.withMessage('Mã khuyến mãi phải là chuỗi'),
];

const getUserBookingsValidation = [
	query('page')
		.optional()
		.isInt({ min: 1 })
		.withMessage('Trang phải là số nguyên dương'),
	query('limit')
		.optional()
		.isInt({ min: 1, max: 100 })
		.withMessage('Giới hạn phải từ 1 đến 100'),
	query('status')
		.optional()
		.isIn(['pending', 'confirmed', 'cancelled', 'completed'])
		.withMessage('Giá trị trạng thái không hợp lệ'),
	query('search')
		.optional()
		.trim()
		.isLength({ min: 3, max: 12 })
		.withMessage('Tìm kiếm phải từ 3 đến 12 ký tự')
		.matches(/^[A-Za-z0-9-]+$/)
		.withMessage('Tìm kiếm chỉ được chứa chữ cái, số và dấu gạch ngang'),
];

const cancelBookingValidation = [
	...bookingIdValidation,
	// Require either `reason` or `cancellation_note`
	body().custom((_, { req }) => {
		if (!req.body.reason && !req.body.cancellation_note) {
			throw new Error('Lý do hủy là bắt buộc');
		}
		return true;
	}),
];

const passengerIdValidation = [
	...bookingIdValidation,
	param('passengerId')
		.isInt({ min: 1 })
		.withMessage('ID hành khách phải là số nguyên dương'),
];

const updatePassengerValidation = [
	...passengerIdValidation,
	body('first_name')
		.optional()
		.notEmpty()
		.withMessage('Họ không được để trống'),
	body('last_name')
		.optional()
		.notEmpty()
		.withMessage('Tên không được để trống'),
	body('title')
		.optional()
		.isIn(['Mr', 'Mrs', 'Ms', 'Dr', 'Prof'])
		.withMessage('Danh xưng phải là Mr, Mrs, Ms, Dr, hoặc Prof'),
	body('citizen_id')
		.optional()
		.isLength({ min: 12, max: 12 })
		.withMessage('Số CCCD/CMND phải có đúng 12 chữ số'),
	body('passenger_type')
		.optional()
		.isIn(['adult', 'child', 'infant'])
		.withMessage('Loại hành khách phải là adult, child, hoặc infant'),
	body('date_of_birth')
		.optional()
		.isDate()
		.withMessage('Ngày sinh phải là ngày hợp lệ'),
	body('nationality')
		.optional()
		.isLength({ min: 2, max: 50 })
		.withMessage('Quốc tịch phải từ 2 đến 50 ký tự'),
	body('passport_number')
		.optional()
		.isLength({ min: 1, max: 50 })
		.withMessage('Số hộ chiếu phải từ 1 đến 50 ký tự'),
	body('passport_expiry')
		.optional()
		.isDate()
		.withMessage('Ngày hết hạn hộ chiếu phải là ngày hợp lệ')
		.custom((value) => {
			if (value) {
				const expiryDate = new Date(value);
				const today = new Date();
				const sixMonthsFromNow = new Date();
				sixMonthsFromNow.setMonth(today.getMonth() + 6);

				if (expiryDate <= sixMonthsFromNow) {
					throw new Error(
						'Hộ chiếu phải còn hiệu lực ít nhất 6 tháng kể từ ngày đặt chỗ'
					);
				}
			}
			return true;
		}),
	body('passport_issuing_country')
		.optional()
		.notEmpty()
		.withMessage('Quốc gia cấp hộ chiếu không được để trống nếu được cung cấp'),
];

const updatePassengersValidation = [
	...bookingIdValidation,
	body('passengers')
		.isArray({ min: 1 })
		.withMessage('Hành khách phải là mảng có ít nhất một hành khách'),
	body('passengers.*.passenger_id')
		.isInt({ min: 1 })
		.withMessage('ID hành khách phải là số nguyên dương'),
	body('passengers.*.first_name')
		.optional()
		.notEmpty()
		.withMessage('Họ không được để trống'),
	body('passengers.*.last_name')
		.optional()
		.notEmpty()
		.withMessage('Tên không được để trống'),
	body('passengers.*.title')
		.optional()
		.isIn(['Mr', 'Mrs', 'Ms', 'Dr', 'Prof'])
		.withMessage('Danh xưng phải là Mr, Mrs, Ms, Dr, hoặc Prof'),
	body('passengers.*.citizen_id')
		.optional()
		.isLength({ min: 12, max: 12 })
		.withMessage('Số CCCD/CMND phải có đúng 12 chữ số'),
	body('passengers.*.passenger_type')
		.optional()
		.isIn(['adult', 'child', 'infant'])
		.withMessage('Loại hành khách phải là adult, child, hoặc infant'),
	body('passengers.*.date_of_birth')
		.optional()
		.isDate()
		.withMessage('Ngày sinh phải là ngày hợp lệ'),
	body('passengers.*.nationality')
		.optional()
		.isLength({ min: 2, max: 50 })
		.withMessage('Quốc tịch phải từ 2 đến 50 ký tự'),
	body('passengers.*.passport_number')
		.optional()
		.isLength({ min: 1, max: 50 })
		.withMessage('Số hộ chiếu phải từ 1 đến 50 ký tự'),
	body('passengers.*.passport_expiry')
		.optional()
		.isDate()
		.withMessage('Ngày hết hạn hộ chiếu phải là ngày hợp lệ')
		.custom((value) => {
			if (value) {
				const expiryDate = new Date(value);
				const today = new Date();
				const sixMonthsFromNow = new Date();
				sixMonthsFromNow.setMonth(today.getMonth() + 6);

				if (expiryDate <= sixMonthsFromNow) {
					throw new Error(
						'Hộ chiếu phải còn hiệu lực ít nhất 6 tháng kể từ ngày đặt chỗ'
					);
				}
			}
			return true;
		}),
	body('passengers.*.passport_issuing_country')
		.optional()
		.notEmpty()
		.withMessage('Quốc gia cấp hộ chiếu không được để trống nếu được cung cấp'),
];

// User booking routes - ORDER MATTERS! More specific routes first
router.post(
	'/',
	createBookingValidation,
	validate,
	bookingController.createBooking
);

router.get(
	'/',
	getUserBookingsValidation,
	validate,
	bookingController.getUserBookings
);

// Specific routes with actions must come before generic ID routes
router.get(
	'/verify/:bookingReference',
	bookingReferenceValidation,
	validate,
	bookingController.verifyBooking
);

router.get(
	'/e-ticket/:bookingReference',
	bookingReferenceValidation,
	validate,
	bookingController.getETicket
);

router.post(
	'/:bookingId/cancel',
	cancelBookingValidation,
	validate,
	bookingController.requestCancellation
);

router.get(
	'/:bookingId/cancellation',
	bookingIdValidation,
	validate,
	bookingController.getCancellationStatus
);

// Passenger management routes
router.get(
	'/:bookingId/passengers',
	bookingIdValidation,
	validate,
	bookingController.getBookingPassengers
);

router.put(
	'/:bookingId/passengers/:passengerId',
	updatePassengerValidation,
	validate,
	bookingController.updateBookingPassenger
);

router.put(
	'/:bookingId/passengers',
	updatePassengersValidation,
	validate,
	bookingController.updateBookingPassengers
);

// Generic ID route must come LAST to avoid conflicts
router.get(
	'/:bookingId',
	bookingIdValidation,
	validate,
	bookingController.getBookingDetails
);

module.exports = router;
