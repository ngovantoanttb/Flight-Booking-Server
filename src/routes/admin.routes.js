/**
 * Admin Routes
 * Defines all admin-related API endpoints
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const adminController = require('../controllers/adminController');
const contactController = require('../controllers/contactController');
const servicePackageController = require('../controllers/servicePackageController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Validation rules
const idValidation = [
	param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer'),
];

const paginationValidation = [
	query('page')
		.optional()
		.isInt({ min: 1 })
		.withMessage('Page must be a positive integer'),
	query('limit')
		.optional()
		.isInt({ min: 1, max: 100 })
		.withMessage('Limit must be between 1 and 100'),
];

// Airlines Management
const airlineValidation = [
	body('airline_code')
		.notEmpty()
		.withMessage('Airline code is required')
		.isLength({ min: 2, max: 2 })
		.withMessage('Airline code must be 2 characters'),
	body('airline_name')
		.notEmpty()
		.withMessage('Airline name is required')
		.isLength({ min: 1, max: 100 })
		.withMessage('Airline name must be between 1 and 100 characters'),
	body('country_id')
		.isInt({ min: 1 })
		.withMessage('Country ID must be a positive integer'),
	// body('logo_url')
	// 	.optional()
	// 	.isURL()
	// 	.withMessage('Logo URL must be a valid URL'),
	body('is_active')
		.optional()
		.isBoolean()
		.withMessage('is_active must be a boolean'),
];

// Update service packages for an airline (admin)
const servicePackagesValidation = [
	body('service_packages')
		.isArray({ min: 1 })
		.withMessage('service_packages must be a non-empty array'),
	body('service_packages.*.package_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage('package_id must be a positive integer'),
	body('service_packages.*.package_name')
		.notEmpty()
		.withMessage('package_name is required'),
	body('service_packages.*.package_code')
		.notEmpty()
		.withMessage('package_code is required'),
	body('service_packages.*.class_type')
		.isIn(['economy', 'business'])
		.withMessage('class_type must be economy or business'),
	body('service_packages.*.package_type')
		.isIn(['standard', 'plus'])
		.withMessage('package_type must be standard or plus'),
	body('service_packages.*.price_multiplier')
		.optional()
		.isDecimal()
		.withMessage('price_multiplier must be a decimal'),
	body('service_packages.*.is_active')
		.optional()
		.isBoolean()
		.withMessage('is_active must be boolean'),
];

router.get(
	'/airlines',
	paginationValidation,
	validate,
	adminController.getAirlines
);
router.get('/airlines/:id', idValidation, validate, adminController.getAirline);
router.get(
	'/airlines/:airlineId/details',
	[param('airlineId').isInt({ min: 1 })],
	validate,
	adminController.getAirlineDetails
);
router.post(
	'/airlines',
	airlineValidation,
	validate,
	adminController.createAirline
);
router.put(
	'/airlines/:id',
	[...idValidation, ...airlineValidation, ...servicePackagesValidation],
	validate,
	adminController.updateAirline
);
router.delete(
	'/airlines/:id',
	idValidation,
	validate,
	adminController.deleteAirline
);

// Airports Management
const airportValidation = [
	body('airport_code')
		.notEmpty()
		.withMessage('Airport code is required')
		.isLength({ min: 3, max: 3 })
		.withMessage('Airport code must be 3 characters'),
	body('airport_name')
		.notEmpty()
		.withMessage('Airport name is required')
		.isLength({ min: 1, max: 100 })
		.withMessage('Airport name must be between 1 and 100 characters'),
	body('city')
		.notEmpty()
		.withMessage('City is required')
		.isLength({ min: 1, max: 100 })
		.withMessage('City must be between 1 and 100 characters'),
	body('country_id')
		.isInt({ min: 1 })
		.withMessage('Country ID must be a positive integer'),
	body('latitude')
		.optional()
		.isDecimal()
		.withMessage('Latitude must be a decimal number'),
	body('longitude')
		.optional()
		.isDecimal()
		.withMessage('Longitude must be a decimal number'),
];

router.get(
	'/airports',
	paginationValidation,
	validate,
	adminController.getAirports
);
router.get('/airports/:id', idValidation, validate, adminController.getAirport);
router.post(
	'/airports',
	airportValidation,
	validate,
	adminController.createAirport
);
router.put(
	'/airports/:id',
	[...idValidation, ...airportValidation],
	validate,
	adminController.updateAirport
);
router.delete(
	'/airports/:id',
	idValidation,
	validate,
	adminController.deleteAirport
);

// Countries Management
const countryValidation = [
	body('country_code')
		.notEmpty()
		.withMessage('Country code is required')
		.isLength({ min: 2, max: 2 })
		.withMessage('Country code must be 2 characters'),
	body('country_name')
		.notEmpty()
		.withMessage('Country name is required')
		.isLength({ min: 1, max: 100 })
		.withMessage('Country name must be between 1 and 100 characters'),
];

router.get(
	'/countries',
	paginationValidation,
	validate,
	adminController.getCountries
);
router.get(
	'/countries/:id',
	idValidation,
	validate,
	adminController.getCountry
);
router.post(
	'/countries',
	countryValidation,
	validate,
	adminController.createCountry
);
router.put(
	'/countries/:id',
	[...idValidation, ...countryValidation],
	validate,
	adminController.updateCountry
);
router.delete(
	'/countries/:id',
	idValidation,
	validate,
	adminController.deleteCountry
);

// Aircraft Management
const aircraftValidation = [
	body('airline_id')
		.isInt({ min: 1 })
		.withMessage('Airline ID must be a positive integer'),
	body('model')
		.notEmpty()
		.withMessage('Model is required')
		.isLength({ min: 1, max: 100 })
		.withMessage('Model must be between 1 and 100 characters'),
	body('aircraft_type')
		.optional()
		.isLength({ min: 1, max: 50 })
		.withMessage('Aircraft type must be between 1 and 50 characters'),
	body('total_seats')
		.isInt({ min: 1 })
		.withMessage('Total seats must be a positive integer'),
	body('business_seats')
		.isInt({ min: 0 })
		.withMessage('Business seats must be a non-negative integer'),
	body('economy_seats')
		.isInt({ min: 0 })
		.withMessage('Economy seats must be a non-negative integer'),
];

router.get(
	'/aircraft',
	paginationValidation,
	validate,
	adminController.getAircraft
);
router.get(
	'/aircraft/:id',
	idValidation,
	validate,
	adminController.getAircraftById
);
router.post(
	'/aircraft',
	aircraftValidation,
	validate,
	adminController.createAircraft
);
router.put(
	'/aircraft/:id',
	[...idValidation, ...aircraftValidation],
	validate,
	adminController.updateAircraft
);
router.delete(
	'/aircraft/:id',
	idValidation,
	validate,
	adminController.deleteAircraft
);

// Passengers Management
const passengerValidation = [
	body('first_name')
		.notEmpty()
		.withMessage('First name is required')
		.isLength({ min: 1, max: 50 })
		.withMessage('First name must be between 1 and 50 characters'),
	body('last_name')
		.notEmpty()
		.withMessage('Last name is required')
		.isLength({ min: 1, max: 50 })
		.withMessage('Last name must be between 1 and 50 characters'),
	body('date_of_birth')
		.notEmpty()
		.withMessage('Date of birth is required')
		.isISO8601()
		.withMessage('Date of birth must be a valid date'),
	body('nationality')
		.optional()
		.isLength({ min: 1, max: 50 })
		.withMessage('Nationality must be between 1 and 50 characters'),
	body('passport_number')
		.optional()
		.isLength({ min: 1, max: 50 })
		.withMessage('Passport number must be between 1 and 50 characters'),
	body('passport_expiry')
		.optional()
		.isISO8601()
		.withMessage('Passport expiry must be a valid date'),
];

router.get(
	'/passengers',
	paginationValidation,
	validate,
	adminController.getPassengers
);
router.get(
	'/passengers/:id',
	idValidation,
	validate,
	adminController.getPassenger
);
router.post(
	'/passengers',
	passengerValidation,
	validate,
	adminController.createPassenger
);
router.put(
	'/passengers/:id',
	[...idValidation, ...passengerValidation],
	validate,
	adminController.updatePassenger
);
router.delete(
	'/passengers/:id',
	idValidation,
	validate,
	adminController.deletePassenger
);

// Promotions Management
const promotionValidation = [
	body('promotion_code')
		.notEmpty()
		.withMessage('Promotion code is required')
		.isLength({ min: 1, max: 20 })
		.withMessage('Promotion code must be between 1 and 20 characters'),
	body('description')
		.notEmpty()
		.withMessage('Description is required')
		.isLength({ min: 1, max: 255 })
		.withMessage('Description must be between 1 and 255 characters'),
	body('discount_type')
		.isIn(['percentage', 'fixed_amount'])
		.withMessage('Discount type must be percentage or fixed_amount'),
	body('discount_value')
		.isDecimal({ decimal_digits: '0,2' })
		.withMessage('Discount value must be a decimal number'),
	body('min_purchase')
		.optional()
		.isDecimal({ decimal_digits: '0,2' })
		.withMessage('Minimum purchase must be a decimal number'),
	body('start_date')
		.notEmpty()
		.withMessage('Start date is required')
		.isISO8601()
		.withMessage('Start date must be a valid date'),
	body('end_date')
		.notEmpty()
		.withMessage('End date is required')
		.isISO8601()
		.withMessage('End date must be a valid date'),
	body('usage_limit')
		.optional()
		.isInt({ min: 1 })
		.withMessage('Usage limit must be a positive integer'),
	body('is_active')
		.optional()
		.isBoolean()
		.withMessage('is_active must be a boolean'),
];

router.get(
	'/promotions',
	paginationValidation,
	validate,
	adminController.getPromotions
);
router.get(
	'/promotions/:id',
	idValidation,
	validate,
	adminController.getPromotion
);
router.post(
	'/promotions',
	promotionValidation,
	validate,
	adminController.createPromotion
);
router.put(
	'/promotions/:id',
	[...idValidation, ...promotionValidation],
	validate,
	adminController.updatePromotion
);
router.delete(
	'/promotions/:id',
	idValidation,
	validate,
	adminController.deletePromotion
);

// Bookings Management
const bookingStatusValidation = [
	body('status')
		.optional()
		.isIn([
			'pending',
			'confirmed',
			'cancelled',
			'completed',
			'pending_cancellation',
			'cancellation_rejected',
		])
		.withMessage(
			'Status must be one of: pending, confirmed, cancelled, completed, pending_cancellation, or cancellation_rejected'
		),
	body('payment_status')
		.optional()
		.isIn(['pending', 'paid', 'refunded', 'failed'])
		.withMessage(
			'Payment status must be pending, paid, refunded, or failed'
		),
	body('cancellation_reason').optional().isLength({ min: 1, max: 255 }),
	body('reject_reason').optional().isLength({ min: 1, max: 255 }),
	body('action')
		.optional()
		.isIn(['reject_cancellation'])
		.withMessage('Action must be reject_cancellation')
		.withMessage(
			'Cancellation reason must be between 1 and 255 characters'
		),
];

router.get(
	'/bookings',
	paginationValidation,
	validate,
	adminController.getBookings
);
router.get('/bookings/:id', idValidation, validate, adminController.getBooking);
router.put(
	'/bookings/:id/status',
	[...idValidation, ...bookingStatusValidation],
	validate,
	adminController.updateBookingStatus
);
router.delete(
	'/bookings/:id',
	idValidation,
	validate,
	adminController.deleteBooking
);

// Users Management
const userValidation = [
	body('email')
		.optional()
		.isEmail()
		.withMessage('Email must be a valid email address'),
	body('first_name')
		.optional()
		.isLength({ min: 1, max: 50 })
		.withMessage('First name must be between 1 and 50 characters'),
	body('last_name')
		.optional()
		.isLength({ min: 1, max: 50 })
		.withMessage('Last name must be between 1 and 50 characters'),
	body('phone')
		.optional()
		.isLength({ min: 1, max: 20 })
		.withMessage('Phone must be between 1 and 20 characters'),
	body('is_active')
		.optional()
		.isBoolean()
		.withMessage('is_active must be a boolean'),
];

router.get('/users', paginationValidation, validate, adminController.getUsers);
router.get('/users/:id', idValidation, validate, adminController.getUser);
router.put(
	'/users/:id',
	[...idValidation, ...userValidation],
	validate,
	adminController.updateUser
);
router.put(
	'/users/:id/status',
	[...idValidation, body('is_active').isBoolean()],
	validate,
	adminController.updateUserStatus
);

// Travel Classes Management
const travelClassValidation = [
	body('class_name')
		.notEmpty()
		.withMessage('Class name is required')
		.isLength({ min: 1, max: 50 })
		.withMessage('Class name must be between 1 and 50 characters'),
	body('class_code')
		.notEmpty()
		.withMessage('Class code is required')
		.isLength({ min: 1, max: 20 })
		.withMessage('Class code must be between 1 and 20 characters'),
	body('description')
		.optional()
		.isLength({ min: 1, max: 255 })
		.withMessage('Description must be between 1 and 255 characters'),
];

router.get(
	'/travel-classes',
	paginationValidation,
	validate,
	adminController.getTravelClasses
);
router.get(
	'/travel-classes/:id',
	idValidation,
	validate,
	adminController.getTravelClass
);
router.post(
	'/travel-classes',
	travelClassValidation,
	validate,
	adminController.createTravelClass
);
router.put(
	'/travel-classes/:id',
	[...idValidation, ...travelClassValidation],
	validate,
	adminController.updateTravelClass
);
router.delete(
	'/travel-classes/:id',
	idValidation,
	validate,
	adminController.deleteTravelClass
);

// Baggage Options Management
const baggageOptionValidation = [
	body('airline_id')
		.isInt({ min: 1 })
		.withMessage('Airline ID must be a positive integer'),
	body('weight_kg')
		.isDecimal({ decimal_digits: '0,2' })
		.withMessage('Weight must be a decimal number'),
	body('price')
		.isDecimal({ decimal_digits: '0,2' })
		.withMessage('Price must be a decimal number'),
	body('description')
		.notEmpty()
		.withMessage('Description is required')
		.isLength({ min: 1, max: 255 })
		.withMessage('Description must be between 1 and 255 characters'),
];

router.get(
	'/baggage-options',
	paginationValidation,
	validate,
	adminController.getBaggageOptions
);
router.get(
	'/baggage-options/:id',
	idValidation,
	validate,
	adminController.getBaggageOption
);
router.post(
	'/baggage-options',
	baggageOptionValidation,
	validate,
	adminController.createBaggageOption
);
router.put(
	'/baggage-options/:id',
	[...idValidation, ...baggageOptionValidation],
	validate,
	adminController.updateBaggageOption
);
router.delete(
	'/baggage-options/:id',
	idValidation,
	validate,
	adminController.deleteBaggageOption
);

// Meal Options Management
const mealOptionValidation = [
	body('airline_id')
		.isInt({ min: 1 })
		.withMessage('Airline ID must be a positive integer'),
	body('meal_name')
		.notEmpty()
		.withMessage('Meal name is required')
		.isLength({ min: 1, max: 100 })
		.withMessage('Meal name must be between 1 and 100 characters'),
	body('meal_description')
		.optional()
		.isLength({ min: 1, max: 255 })
		.withMessage('Meal description must be between 1 and 255 characters'),
	body('price')
		.isDecimal({ decimal_digits: '0,2' })
		.withMessage('Price must be a decimal number'),
	body('is_vegetarian')
		.optional()
		.isBoolean()
		.withMessage('is_vegetarian must be a boolean'),
	body('is_halal')
		.optional()
		.isBoolean()
		.withMessage('is_halal must be a boolean'),
];

router.get(
	'/meal-options',
	paginationValidation,
	validate,
	adminController.getMealOptions
);
router.get(
	'/meal-options/:id',
	idValidation,
	validate,
	adminController.getMealOption
);
router.post(
	'/meal-options',
	mealOptionValidation,
	validate,
	adminController.createMealOption
);
router.put(
	'/meal-options/:id',
	[...idValidation, ...mealOptionValidation],
	validate,
	adminController.updateMealOption
);
router.delete(
	'/meal-options/:id',
	idValidation,
	validate,
	adminController.deleteMealOption
);

// Contact Management (GET, PUT only as per requirements)
router.get(
	'/contacts',
	paginationValidation,
	validate,
	contactController.getContacts
);
router.get('/contacts/stats', contactController.getContactStats);
router.get(
	'/contacts/search',
	paginationValidation,
	validate,
	contactController.searchContacts
);
router.get(
	'/contacts/:id',
	idValidation,
	validate,
	contactController.getContact
);
router.put(
	'/contacts/:id',
	idValidation,
	validate,
	contactController.updateContact
);

// Service Package Management
router.get(
	'/service-packages',
	paginationValidation,
	validate,
	servicePackageController.getServicePackages
);
router.get(
	'/service-packages/:id',
	idValidation,
	validate,
	servicePackageController.getServicePackageById
);
// Service package CRUD operations can be added later if needed

// Flight Management with enhanced information
const flightValidation = [
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
		.withMessage('Departure time must be a valid date'),
	body('arrival_time')
		.notEmpty()
		.withMessage('Arrival time is required')
		.isISO8601()
		.withMessage('Arrival time must be a valid date'),
	body('force_edit')
		.optional()
		.isBoolean()
		.withMessage('force_edit must be a boolean'),
	body('status')
		.optional()
		.isIn(['scheduled', 'delayed', 'cancelled', 'completed'])
		.withMessage(
			'Status must be scheduled, delayed, cancelled, or completed'
		),
];

router.get(
	'/flights',
	paginationValidation,
	validate,
	adminController.getFlights
);
router.post(
	'/flights',
	flightValidation,
	validate,
	adminController.createFlight
);
router.put(
	'/flights/:id',
	[...idValidation, ...flightValidation],
	validate,
	adminController.updateFlight
);
router.delete(
	'/flights/:id',
	idValidation,
	validate,
	adminController.deleteFlight
);
router.get('/flights/:id', idValidation, validate, adminController.getFlight);

// Statistics and Reports
router.get('/stats/overview', adminController.getOverviewStats);
router.get('/stats/revenue', adminController.getRevenueStats);
router.get('/stats/bookings', adminController.getBookingStats);
router.get('/stats/airlines', adminController.getAirlineStats);
router.get('/stats/passengers', adminController.getPassengerStats);
router.get('/stats/baggage', adminController.getBaggageStats);

// Dashboard APIs
router.get('/dashboard/weekly-revenue', adminController.getWeeklyRevenueStats);
router.get(
	'/dashboard/monthly-revenue',
	adminController.getMonthlyRevenueStats
);
router.get('/dashboard/today-bookings', adminController.getTodayBookingStats);
router.get('/dashboard/user-stats', adminController.getUserStatistics);

// Market Share and Analytics APIs
router.get(
	'/analytics/airline-market-share',
	adminController.getAirlineMarketShare
);
router.get(
	'/analytics/airline-market-share/export',
	adminController.exportAirlineMarketShareExcel
);

// Revenue Trend APIs
router.get('/analytics/revenue-trend', adminController.getRevenueTrend);
router.get(
	'/analytics/revenue-trend/export',
	adminController.exportRevenueTrendExcel
);

// Booking Statistics APIs
router.get('/analytics/booking-stats', adminController.getBookingStatistics);
router.get(
	'/analytics/booking-stats/export',
	adminController.exportBookingStatisticsExcel
);

// Baggage Service Statistics APIs
router.get(
	'/analytics/baggage-service-stats',
	adminController.getBaggageServiceStatistics
);
router.get(
	'/analytics/baggage-service-stats/export',
	adminController.exportBaggageServiceStatisticsExcel
);

module.exports = router;
