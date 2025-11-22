/**
 * Simplified Booking Routes
 * Routes for booking without specific seat selection
 */

const express = require('express');
const { body, param } = require('express-validator');
const simplifiedBookingController = require('../controllers/simplifiedBookingController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Validation rules
const checkAvailabilityValidation = [
	body('flight_id')
		.isInt({ min: 1 })
		.withMessage('ID chuyến bay phải là số nguyên dương'),
	body('class_id')
		.isInt({ min: 1 })
		.withMessage('ID hạng vé phải là số nguyên dương'),
	body('passengers')
		.isInt({ min: 1, max: 9 })
		.withMessage('Số hành khách phải từ 1 đến 9'),
];

const createBookingValidation = [
	body('flight_id')
		.isInt({ min: 1 })
		.withMessage('ID chuyến bay phải là số nguyên dương'),
	body('class_id')
		.isInt({ min: 1 })
		.withMessage('ID hạng vé phải là số nguyên dương'),
	body('passengers')
		.isArray({ min: 1, max: 9 })
		.withMessage('Hành khách phải là mảng từ 1-9 phần tử'),
	body('passengers.*.first_name')
		.notEmpty()
		.withMessage('Họ của mỗi hành khách là bắt buộc'),
	body('passengers.*.last_name')
		.notEmpty()
		.withMessage('Tên của mỗi hành khách là bắt buộc'),
	body('passengers.*.date_of_birth')
		.optional()
		.isISO8601()
		.withMessage('Định dạng ngày sinh không hợp lệ'),
	body('passengers.*.gender')
		.optional()
		.isIn(['M', 'F', 'Other'])
		.withMessage('Giới tính phải là M, F, hoặc Other'),
	body('passengers.*.nationality')
		.optional()
		.isLength({ min: 2, max: 3 })
		.withMessage('Quốc tịch phải từ 2-3 ký tự'),
	body('passengers.*.passport_number')
		.optional()
		.isLength({ min: 6, max: 20 })
		.withMessage('Số hộ chiếu phải từ 6-20 ký tự'),
	body('contact_info.email')
		.optional()
		.isEmail()
		.withMessage('Định dạng email không hợp lệ'),
	body('contact_info.phone')
		.optional()
		.isLength({ min: 10, max: 15 })
		.withMessage('Số điện thoại phải từ 10-15 ký tự'),
	body('contact_info.citizen_id')
		.optional()
		.isLength({ min: 12, max: 12 })
		.matches(/^\d{12}$/)
		.withMessage('Số CCCD/CMND phải có đúng 12 chữ số'),
	body('promotion_code')
		.optional()
		.isLength({ min: 3, max: 20 })
		.withMessage('Mã khuyến mãi phải từ 3-20 ký tự'),
];

const flightIdValidation = [
	param('flightId')
		.isInt({ min: 1 })
		.withMessage('ID chuyến bay phải là số nguyên dương'),
];

const bookingIdValidation = [
	param('bookingId')
		.isInt({ min: 1 })
		.withMessage('ID đặt chỗ phải là số nguyên dương'),
];

// Public routes
router.get(
	'/:flightId/seat-summary',
	flightIdValidation,
	validate,
	simplifiedBookingController.getSeatSummary
);

// Protected routes (require authentication)
router.use(protect);

router.post(
	'/check-availability',
	checkAvailabilityValidation,
	validate,
	simplifiedBookingController.checkAvailability
);

router.post(
	'/create',
	createBookingValidation,
	validate,
	simplifiedBookingController.createBooking
);

router.put(
	'/:bookingId/cancel',
	bookingIdValidation,
	validate,
	simplifiedBookingController.cancelBooking
);

module.exports = router;
