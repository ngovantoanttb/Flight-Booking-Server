/**
 * Flight Routes
 * Defines all flight-related API endpoints
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const flightController = require('../controllers/flightController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Validation rules
const flightIdValidation = [
	param('flightId')
		.isInt({ min: 1 })
		.withMessage('Flight ID must be a positive integer'),
];

const searchFlightsValidation = [
	// All filters are optional for user searches — validate only when present
	query('departure_airport_code')
		.optional()
		.isLength({ min: 3, max: 3 })
		.withMessage('Airport code must be 3 characters'),
	query('arrival_airport_code')
		.optional()
		.isLength({ min: 3, max: 3 })
		.withMessage('Airport code must be 3 characters'),
	query('departure_date')
		.optional()
		.isISO8601()
		.withMessage('Invalid date format. Use YYYY-MM-DD'),
	query('passengers')
		.optional()
		.isInt({ min: 1, max: 9 })
		.withMessage('Passengers must be between 1 and 9'),
	query('class_code')
		.optional()
		.isIn(['ECONOMY', 'BUSINESS'])
		.withMessage('Class code must be ECONOMY or BUSINESS'),
	query('page')
		.optional()
		.isInt({ min: 1 })
		.withMessage('Page must be a positive integer'),
	query('limit')
		.optional()
		.isInt({ min: 1, max: 100 })
		.withMessage('Limit must be between 1 and 100'),
];

const createFlightValidation = [
	body('flight_number')
		.optional()
		.isLength({ min: 1, max: 10 })
		.withMessage('Flight number must be between 1 and 10 characters'),
	body('airline_id')
		.isInt({ min: 1 })
		.withMessage('Airline ID must be a positive integer'),
	body('aircraft_id')
		.isInt({ min: 1 })
		.withMessage('Aircraft ID must be a positive integer'),
	body('departure_airport_id')
		.isInt({ min: 1 })
		.withMessage('Departure airport ID must be a positive integer'),
	body('arrival_airport_id')
		.isInt({ min: 1 })
		.withMessage('Arrival airport ID must be a positive integer'),
	body('departure_time')
		.notEmpty()
		.withMessage('Departure time is required')
		.isISO8601()
		.withMessage('Invalid departure time format'),
	body('arrival_time')
		.notEmpty()
		.withMessage('Arrival time is required')
		.isISO8601()
		.withMessage('Invalid arrival time format'),
	body('status')
		.optional()
		.isIn(['scheduled', 'delayed', 'cancelled', 'completed'])
		.withMessage('Invalid status value'),
];

const updateFlightValidation = [
	...flightIdValidation,
	body('flight_number')
		.optional()
		.isLength({ min: 1, max: 10 })
		.withMessage('Flight number must be between 1 and 10 characters'),
	body('airline_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage('Airline ID must be a positive integer'),
	body('aircraft_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage('Aircraft ID must be a positive integer'),
	body('departure_airport_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage('Departure airport ID must be a positive integer'),
	body('arrival_airport_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage('Arrival airport ID must be a positive integer'),
	body('departure_time')
		.optional()
		.isISO8601()
		.withMessage('Invalid departure time format'),
	body('arrival_time')
		.optional()
		.isISO8601()
		.withMessage('Invalid arrival time format'),
	body('status')
		.optional()
		.isIn(['scheduled', 'delayed', 'cancelled', 'completed'])
		.withMessage('Invalid status value'),
];

const getSeatsValidation = [
	...flightIdValidation,
	query('class_id')
		.notEmpty()
		.withMessage('Class ID is required')
		.isInt({ min: 1 })
		.withMessage('Class ID must be a positive integer'),
];

const getAllFlightsValidation = [
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
		.isIn(['scheduled', 'delayed', 'cancelled', 'completed'])
		.withMessage('Invalid status value'),
	query('airline_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage('Airline ID must be a positive integer'),
];

const getAllFlightsForUsersValidation = [
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
		.isIn(['scheduled', 'delayed', 'cancelled', 'completed'])
		.withMessage('Invalid status value'),
	query('airline_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage('Airline ID must be a positive integer'),
	query('departure_airport_code')
		.optional()
		.isLength({ min: 3, max: 3 })
		.withMessage('Airport code must be 3 characters'),
	query('arrival_airport_code')
		.optional()
		.isLength({ min: 3, max: 3 })
		.withMessage('Airport code must be 3 characters'),
	query('departure_date')
		.optional()
		.isISO8601()
		.withMessage('Invalid date format. Use YYYY-MM-DD'),
];

// Public routes
router.get(
	'/search',
	searchFlightsValidation,
	validate,
	flightController.searchFlights
);
// Allow GET /flights with query params to act as search for unauthenticated users.
// If no query params present, fall through to protected/admin handler below.
router.get('/', searchFlightsValidation, validate, (req, res, next) => {
	if (Object.keys(req.query).length > 0) {
		return flightController.searchFlights(req, res, next);
	}
	return next();
});
router.get(
	'/list',
	getAllFlightsForUsersValidation,
	validate,
	flightController.getAllFlightsForUsers
);
router.get('/airlines', flightController.getAllAirlines);
router.get('/airports', flightController.getAllAirports);
router.get(
	'/:flightId',
	flightIdValidation,
	validate,
	flightController.getFlightDetails
);
router.get(
	'/:flightId/services',
	flightIdValidation,
	validate,
	flightController.getFlightServices
);
router.get(
	'/:flightId/seats',
	getSeatsValidation,
	validate,
	flightController.getAvailableSeats
);
router.get(
	'/:flightId/seat-availability',
	flightIdValidation,
	validate,
	flightController.getSeatAvailabilitySummary
);

// Public flight services endpoints (no authentication required)
router.get(
	'/:flightId/baggage-services',
	flightIdValidation,
	validate,
	flightController.getFlightBaggageServices
);

router.get(
	'/:flightId/meal-services',
	flightIdValidation,
	validate,
	flightController.getFlightMealServices
);

// Protected routes (require authentication)
router.use(protect);

// Admin routes (require admin role)
router.get(
	'/',
	getAllFlightsValidation,
	validate,
	authorize('admin'),
	flightController.getAllFlights
);
router.post(
	'/',
	createFlightValidation,
	validate,
	authorize('admin'),
	flightController.createFlight
);
router.put(
	'/:flightId',
	updateFlightValidation,
	validate,
	authorize('admin'),
	flightController.updateFlight
);
router.delete(
	'/:flightId',
	flightIdValidation,
	validate,
	authorize('admin'),
	flightController.deleteFlight
);

module.exports = router;
