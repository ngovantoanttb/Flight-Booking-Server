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
		.withMessage('ID chuyến bay phải là số nguyên dương'),
];

const searchFlightsValidation = [
	// All filters are optional for user searches — validate only when present
	query('departure_airport_code')
		.optional()
		.isLength({ min: 3, max: 3 })
		.withMessage('Mã sân bay phải có 3 ký tự'),
	query('arrival_airport_code')
		.optional()
		.isLength({ min: 3, max: 3 })
		.withMessage('Mã sân bay phải có 3 ký tự'),
	query('departure_date')
		.optional()
		.isISO8601()
		.withMessage('Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD'),
	query('passengers')
		.optional()
		.isInt({ min: 1, max: 9 })
		.withMessage('Số hành khách phải từ 1 đến 9'),
	query('class_code')
		.optional()
		.isIn(['ECONOMY', 'BUSINESS'])
		.withMessage('Mã hạng vé phải là ECONOMY hoặc BUSINESS'),
	query('page')
		.optional()
		.isInt({ min: 1 })
		.withMessage('Trang phải là số nguyên dương'),
	query('limit')
		.optional()
		.isInt({ min: 1, max: 100 })
		.withMessage('Giới hạn phải từ 1 đến 100'),
];

const createFlightValidation = [
	body('flight_number')
		.optional()
		.isLength({ min: 1, max: 10 })
		.withMessage('Số hiệu chuyến bay phải từ 1 đến 10 ký tự'),
	body('airline_id')
		.isInt({ min: 1 })
		.withMessage('ID hãng hàng không phải là số nguyên dương'),
	body('aircraft_id')
		.isInt({ min: 1 })
		.withMessage('ID máy bay phải là số nguyên dương'),
	body('departure_airport_id')
		.isInt({ min: 1 })
		.withMessage('ID sân bay đi phải là số nguyên dương'),
	body('arrival_airport_id')
		.isInt({ min: 1 })
		.withMessage('ID sân bay đến phải là số nguyên dương'),
	body('departure_time')
		.notEmpty()
		.withMessage('Thời gian khởi hành là bắt buộc')
		.isISO8601()
		.withMessage('Định dạng thời gian khởi hành không hợp lệ'),
	body('arrival_time')
		.notEmpty()
		.withMessage('Thời gian đến là bắt buộc')
		.isISO8601()
		.withMessage('Định dạng thời gian đến không hợp lệ'),
	body('status')
		.optional()
		.isIn(['scheduled', 'delayed', 'cancelled', 'completed'])
		.withMessage('Giá trị trạng thái không hợp lệ'),
];

const updateFlightValidation = [
	...flightIdValidation,
	body('flight_number')
		.optional()
		.isLength({ min: 1, max: 10 })
		.withMessage('Số hiệu chuyến bay phải từ 1 đến 10 ký tự'),
	body('airline_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage('ID hãng hàng không phải là số nguyên dương'),
	body('aircraft_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage('ID máy bay phải là số nguyên dương'),
	body('departure_airport_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage('ID sân bay đi phải là số nguyên dương'),
	body('arrival_airport_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage('ID sân bay đến phải là số nguyên dương'),
	body('departure_time')
		.optional()
		.isISO8601()
		.withMessage('Định dạng thời gian khởi hành không hợp lệ'),
	body('arrival_time')
		.optional()
		.isISO8601()
		.withMessage('Định dạng thời gian đến không hợp lệ'),
	body('status')
		.optional()
		.isIn(['scheduled', 'delayed', 'cancelled', 'completed'])
		.withMessage('Giá trị trạng thái không hợp lệ'),
];

const getSeatsValidation = [
	...flightIdValidation,
	query('class_id')
		.notEmpty()
		.withMessage('ID hạng vé là bắt buộc')
		.isInt({ min: 1 })
		.withMessage('ID hạng vé phải là số nguyên dương'),
];

const getAllFlightsValidation = [
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
		.isIn(['scheduled', 'delayed', 'cancelled', 'completed'])
		.withMessage('Giá trị trạng thái không hợp lệ'),
	query('airline_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage('ID hãng hàng không phải là số nguyên dương'),
];

const getAllFlightsForUsersValidation = [
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
		.isIn(['scheduled', 'delayed', 'cancelled', 'completed'])
		.withMessage('Giá trị trạng thái không hợp lệ'),
	query('airline_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage('ID hãng hàng không phải là số nguyên dương'),
	query('departure_airport_code')
		.optional()
		.isLength({ min: 3, max: 3 })
		.withMessage('Mã sân bay phải có 3 ký tự'),
	query('arrival_airport_code')
		.optional()
		.isLength({ min: 3, max: 3 })
		.withMessage('Mã sân bay phải có 3 ký tự'),
	query('departure_date')
		.optional()
		.isISO8601()
		.withMessage('Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD'),
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
