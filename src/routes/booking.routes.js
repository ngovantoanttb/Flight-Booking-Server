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
		.withMessage('Booking ID must be a positive integer'),
];

const bookingReferenceValidation = [
	param('bookingReference')
		.notEmpty()
		.withMessage('Booking reference is required')
		.isLength({ min: 6, max: 8 })
		.withMessage('Booking reference must be between 6 and 8 characters'),
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
			throw new Error('Provide either single flight fields or itinerary');
		}
		if (hasSingle && hasItinerary) {
			throw new Error(
				'Use either single flight fields or itinerary, not both'
			);
		}
		return true;
	}),
	body('flight_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage('Flight ID must be a positive integer'),
	body('class_type')
		.optional()
		.isIn(['economy', 'business'])
		.withMessage('class_type must be economy or business'),
	body('service_package_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage('service_package_id must be a positive integer'),
	// Itinerary validation (round-trip/multi-leg)
	body('itinerary')
		.optional()
		.isArray({ min: 1, max: 4 })
		.withMessage('itinerary must be an array of 1-4 legs'),
	body('itinerary.*.flight_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage('itinerary[*].flight_id must be a positive integer'),
	body('itinerary.*.class_type')
		.optional()
		.isIn(['economy', 'business'])
		.withMessage('itinerary[*].class_type must be economy or business'),
	body('itinerary.*.service_package_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage(
			'itinerary[*].service_package_id must be a positive integer'
		),
	body('itinerary.*.meal_options')
		.optional()
		.isArray()
		.withMessage('itinerary[*].meal_options must be an array'),
	body('itinerary.*.meal_options.*.passenger_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage(
			'itinerary[*].meal_options[*].passenger_id must be positive integer'
		),
	body('itinerary.*.meal_options.*.meal_service_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage(
			'itinerary[*].meal_options[*].meal_service_id must be positive integer'
		),
	body('itinerary.*.meal_options.*.quantity')
		.optional()
		.isInt({ min: 1 })
		.withMessage('itinerary[*].meal_options[*].quantity must be >= 1'),
	body('itinerary.*.baggage_options')
		.optional()
		.isArray()
		.withMessage('itinerary[*].baggage_options must be an array'),
	body('itinerary.*.baggage_options.*.passenger_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage(
			'itinerary[*].baggage_options[*].passenger_id must be positive integer'
		),
	body('itinerary.*.baggage_options.*.baggage_service_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage(
			'itinerary[*].baggage_options[*].baggage_service_id must be positive integer'
		),
	body('passengers')
		.isArray({ min: 1 })
		.withMessage('At least one passenger is required'),
	body('passengers.*.first_name')
		.notEmpty()
		.withMessage('Passenger first name is required'),
	body('passengers.*.last_name')
		.notEmpty()
		.withMessage('Passenger last name is required'),
	body('passengers.*.gender')
		.isIn(['male', 'female', 'other'])
		.withMessage('Gender must be male, female, or other'),
	body('passengers.*.date_of_birth')
		.isDate()
		.withMessage('Date of birth must be a valid date'),
	body('passengers.*.nationality')
		.notEmpty()
		.withMessage('Nationality is required'),
	body('passengers.*.passenger_type')
		.notEmpty()
		.isIn(['adult', 'child', 'infant'])
		.withMessage('Passenger type must be adult, child, or infant'),
	body('passengers.*.title')
		.notEmpty()
		.isIn(['Mr', 'Mrs', 'Ms', 'Dr', 'Prof'])
		.withMessage('Title must be Mr, Mrs, Ms, Dr, or Prof'),
	body('passengers.*.passport_number')
		.notEmpty()
		.isLength({ min: 6, max: 20 })
		.withMessage('Passport number must be between 6 and 20 characters'),
	body('passengers.*.passport_expiry')
		.notEmpty()
		.isDate()
		.withMessage(
			'Passport expiry date is required and must be a valid date'
		)
		.custom((value) => {
			const expiryDate = new Date(value);
			const today = new Date();
			const sixMonthsFromNow = new Date();
			sixMonthsFromNow.setMonth(today.getMonth() + 6);

			if (expiryDate <= sixMonthsFromNow) {
				throw new Error(
					'Passport must be valid for at least 6 months from booking date'
				);
			}
			return true;
		}),
	body('passengers.*.passport_issuing_country')
		.optional()
		.notEmpty()
		.withMessage('Passport issuing country cannot be empty if provided'),
	body('passengers.*.citizen_id')
		.notEmpty()
		.matches(/^\d{12}$/)
		.withMessage('Citizen ID must be exactly 12 digits'),
	body('passengers.*.seat_number')
		.optional()
		.notEmpty()
		.withMessage('Seat number must not be empty if provided'),
	body('contact_info.email')
		.isEmail()
		.withMessage('Valid email address is required'),
	body('contact_info.phone')
		.notEmpty()
		.withMessage('Contact phone is required'),
	body('contact_info.first_name')
		.notEmpty()
		.withMessage('Contact first_name is required'),
	body('contact_info.last_name')
		.notEmpty()
		.withMessage('Contact last_name is required'),
	// Optional baggage services (shared for booking)
	body('selected_baggage_services')
		.optional()
		.isArray()
		.withMessage('selected_baggage_services must be an array'),
	body('selected_baggage_services.*.service_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage('baggage service_id must be a positive integer'),
	body('selected_baggage_services.*.quantity')
		.optional()
		.isInt({ min: 1 })
		.withMessage('baggage quantity must be at least 1'),
	// Flight-level baggage and meal selections
	body('baggage_options')
		.optional()
		.isArray()
		.withMessage('baggage_options must be an array'),
	body('baggage_options.*.passenger_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage('baggage_options.passenger_id must be a positive integer'),
	body('baggage_options.*.baggage_service_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage(
			'baggage_options.baggage_service_id must be a positive integer'
		),
	// Meal options (per passenger, allow quantity)
	body('meal_options')
		.optional()
		.isArray()
		.withMessage('meal_options must be an array'),
	body('meal_options.*.passenger_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage('meal_options.passenger_id must be a positive integer'),
	body('meal_options.*.meal_service_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage('meal_options.meal_service_id must be a positive integer'),
	body('meal_options.*.quantity')
		.optional()
		.isInt({ min: 1 })
		.withMessage('meal_options.quantity must be at least 1'),
	// Promotion code optional
	body('promotion_code')
		.optional()
		.isString()
		.withMessage('promotion_code must be a string'),
];

const getUserBookingsValidation = [
	query('page')
		.optional()
		.isInt({ min: 1 })
		.withMessage('Page must be a positive integer'),
	query('limit')
		.optional()
		.isInt({ min: 1, max: 100 })
		.withMessage('Limit must be between 1 and 100'),
	query('status')
		.optional()
		.isIn(['pending', 'confirmed', 'cancelled', 'completed'])
		.withMessage('Invalid status value'),
];

const cancelBookingValidation = [
	...bookingIdValidation,
	// Require either `reason` or `cancellation_note`
	body().custom((_, { req }) => {
		if (!req.body.reason && !req.body.cancellation_note) {
			throw new Error('Cancellation reason is required');
		}
		return true;
	}),
];

const passengerIdValidation = [
	...bookingIdValidation,
	param('passengerId')
		.isInt({ min: 1 })
		.withMessage('Passenger ID must be a positive integer'),
];

const updatePassengerValidation = [
	...passengerIdValidation,
	body('first_name')
		.optional()
		.notEmpty()
		.withMessage('First name cannot be empty'),
	body('last_name')
		.optional()
		.notEmpty()
		.withMessage('Last name cannot be empty'),
	body('title')
		.optional()
		.isIn(['Mr', 'Mrs', 'Ms', 'Dr', 'Prof'])
		.withMessage('Title must be Mr, Mrs, Ms, Dr, or Prof'),
	body('citizen_id')
		.optional()
		.isLength({ min: 12, max: 12 })
		.withMessage('Citizen ID must be exactly 12 digits'),
	body('passenger_type')
		.optional()
		.isIn(['adult', 'child', 'infant'])
		.withMessage('Passenger type must be adult, child, or infant'),
	body('date_of_birth')
		.optional()
		.isDate()
		.withMessage('Date of birth must be a valid date'),
	body('nationality')
		.optional()
		.isLength({ min: 2, max: 50 })
		.withMessage('Nationality must be between 2 and 50 characters'),
	body('passport_number')
		.optional()
		.isLength({ min: 1, max: 50 })
		.withMessage('Passport number must be between 1 and 50 characters'),
	body('passport_expiry')
		.optional()
		.isDate()
		.withMessage('Passport expiry must be a valid date')
		.custom((value) => {
			if (value) {
				const expiryDate = new Date(value);
				const today = new Date();
				const sixMonthsFromNow = new Date();
				sixMonthsFromNow.setMonth(today.getMonth() + 6);

				if (expiryDate <= sixMonthsFromNow) {
					throw new Error(
						'Passport must be valid for at least 6 months from booking date'
					);
				}
			}
			return true;
		}),
	body('passport_issuing_country')
		.optional()
		.notEmpty()
		.withMessage('Passport issuing country cannot be empty if provided'),
];

const updatePassengersValidation = [
	...bookingIdValidation,
	body('passengers')
		.isArray({ min: 1 })
		.withMessage('Passengers must be an array with at least one passenger'),
	body('passengers.*.passenger_id')
		.isInt({ min: 1 })
		.withMessage('Passenger ID must be a positive integer'),
	body('passengers.*.first_name')
		.optional()
		.notEmpty()
		.withMessage('First name cannot be empty'),
	body('passengers.*.last_name')
		.optional()
		.notEmpty()
		.withMessage('Last name cannot be empty'),
	body('passengers.*.title')
		.optional()
		.isIn(['Mr', 'Mrs', 'Ms', 'Dr', 'Prof'])
		.withMessage('Title must be Mr, Mrs, Ms, Dr, or Prof'),
	body('passengers.*.citizen_id')
		.optional()
		.isLength({ min: 12, max: 12 })
		.withMessage('Citizen ID must be exactly 12 digits'),
	body('passengers.*.passenger_type')
		.optional()
		.isIn(['adult', 'child', 'infant'])
		.withMessage('Passenger type must be adult, child, or infant'),
	body('passengers.*.date_of_birth')
		.optional()
		.isDate()
		.withMessage('Date of birth must be a valid date'),
	body('passengers.*.nationality')
		.optional()
		.isLength({ min: 2, max: 50 })
		.withMessage('Nationality must be between 2 and 50 characters'),
	body('passengers.*.passport_number')
		.optional()
		.isLength({ min: 1, max: 50 })
		.withMessage('Passport number must be between 1 and 50 characters'),
	body('passengers.*.passport_expiry')
		.optional()
		.isDate()
		.withMessage('Passport expiry must be a valid date')
		.custom((value) => {
			if (value) {
				const expiryDate = new Date(value);
				const today = new Date();
				const sixMonthsFromNow = new Date();
				sixMonthsFromNow.setMonth(today.getMonth() + 6);

				if (expiryDate <= sixMonthsFromNow) {
					throw new Error(
						'Passport must be valid for at least 6 months from booking date'
					);
				}
			}
			return true;
		}),
	body('passengers.*.passport_issuing_country')
		.optional()
		.notEmpty()
		.withMessage('Passport issuing country cannot be empty if provided'),
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
