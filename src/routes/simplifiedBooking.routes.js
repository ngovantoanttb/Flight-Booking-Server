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
		.withMessage('Flight ID must be a positive integer'),
	body('class_id')
		.isInt({ min: 1 })
		.withMessage('Class ID must be a positive integer'),
	body('passengers')
		.isInt({ min: 1, max: 9 })
		.withMessage('Passengers must be between 1 and 9'),
];

const createBookingValidation = [
	body('flight_id')
		.isInt({ min: 1 })
		.withMessage('Flight ID must be a positive integer'),
	body('class_id')
		.isInt({ min: 1 })
		.withMessage('Class ID must be a positive integer'),
	body('passengers')
		.isArray({ min: 1, max: 9 })
		.withMessage('Passengers must be an array with 1-9 items'),
	body('passengers.*.first_name')
		.notEmpty()
		.withMessage('First name is required for each passenger'),
	body('passengers.*.last_name')
		.notEmpty()
		.withMessage('Last name is required for each passenger'),
	body('passengers.*.date_of_birth')
		.optional()
		.isISO8601()
		.withMessage('Invalid date of birth format'),
	body('passengers.*.gender')
		.optional()
		.isIn(['M', 'F', 'Other'])
		.withMessage('Gender must be M, F, or Other'),
	body('passengers.*.nationality')
		.optional()
		.isLength({ min: 2, max: 3 })
		.withMessage('Nationality must be 2-3 characters'),
	body('passengers.*.passport_number')
		.optional()
		.isLength({ min: 6, max: 20 })
		.withMessage('Passport number must be 6-20 characters'),
	body('contact_info.email')
		.optional()
		.isEmail()
		.withMessage('Invalid email format'),
	body('contact_info.phone')
		.optional()
		.isLength({ min: 10, max: 15 })
		.withMessage('Phone number must be 10-15 characters'),
	body('contact_info.citizen_id')
		.optional()
		.isLength({ min: 12, max: 12 })
		.matches(/^\d{12}$/)
		.withMessage('Citizen ID must be exactly 12 digits'),
	body('promotion_code')
		.optional()
		.isLength({ min: 3, max: 20 })
		.withMessage('Promotion code must be 3-20 characters'),
];

const flightIdValidation = [
	param('flightId')
		.isInt({ min: 1 })
		.withMessage('Flight ID must be a positive integer'),
];

const bookingIdValidation = [
	param('bookingId')
		.isInt({ min: 1 })
		.withMessage('Booking ID must be a positive integer'),
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
