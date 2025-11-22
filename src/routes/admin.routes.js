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
	param('id').isInt({ min: 1 }).withMessage('ID phải là số nguyên dương'),
];

const paginationValidation = [
	query('page')
		.optional()
		.isInt({ min: 1 })
		.withMessage('Trang phải là số nguyên dương'),
	query('limit')
		.optional()
		.isInt({ min: 1, max: 100 })
		.withMessage('Giới hạn phải từ 1 đến 100'),
];

// Airlines Management
const airlineValidation = [
	body('airline_code')
		.notEmpty()
		.withMessage('Mã hãng hàng không là bắt buộc')
		.isLength({ min: 2, max: 2 })
		.withMessage('Mã hãng hàng không phải có 2 ký tự'),
	body('airline_name')
		.notEmpty()
		.withMessage('Tên hãng hàng không là bắt buộc')
		.isLength({ min: 1, max: 100 })
		.withMessage('Tên hãng hàng không phải từ 1 đến 100 ký tự'),
	body('country_id')
		.isInt({ min: 1 })
		.withMessage('ID quốc gia phải là số nguyên dương'),
	// body('logo_url')
	// 	.optional()
	// 	.isURL()
	// 	.withMessage('Logo URL phải là URL hợp lệ'),
	body('is_active')
		.optional()
		.isBoolean()
		.withMessage('Trường is_active phải là boolean'),
];

// Update service packages for an airline (admin)
const servicePackagesValidation = [
	body('service_packages')
		.isArray({ min: 1 })
		.withMessage('Gói dịch vụ phải là mảng không rỗng'),
	body('service_packages.*.package_id')
		.optional()
		.isInt({ min: 1 })
		.withMessage('ID gói dịch vụ phải là số nguyên dương'),
	body('service_packages.*.package_name')
		.notEmpty()
		.withMessage('Tên gói dịch vụ là bắt buộc'),
	body('service_packages.*.package_code')
		.notEmpty()
		.withMessage('Mã gói dịch vụ là bắt buộc'),
	body('service_packages.*.class_type')
		.isIn(['economy', 'business'])
		.withMessage('Loại hạng vé phải là economy hoặc business'),
	body('service_packages.*.package_type')
		.isIn(['standard', 'plus'])
		.withMessage('Loại gói phải là standard hoặc plus'),
	body('service_packages.*.price_multiplier')
		.optional()
		.isDecimal()
		.withMessage('Hệ số giá phải là số thập phân'),
	body('service_packages.*.is_active')
		.optional()
		.isBoolean()
		.withMessage('Trường is_active phải là boolean'),
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
	[param('airlineId').isInt({ min: 1 }).withMessage('ID hãng hàng không phải là số nguyên dương')],
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
		.withMessage('Mã sân bay là bắt buộc')
		.isLength({ min: 3, max: 3 })
		.withMessage('Mã sân bay phải có 3 ký tự'),
	body('airport_name')
		.notEmpty()
		.withMessage('Tên sân bay là bắt buộc')
		.isLength({ min: 1, max: 100 })
		.withMessage('Tên sân bay phải từ 1 đến 100 ký tự'),
	body('city')
		.notEmpty()
		.withMessage('Thành phố là bắt buộc')
		.isLength({ min: 1, max: 100 })
		.withMessage('Thành phố phải từ 1 đến 100 ký tự'),
	body('country_id')
		.isInt({ min: 1 })
		.withMessage('ID quốc gia phải là số nguyên dương'),
	body('latitude')
		.optional()
		.isDecimal()
		.withMessage('Vĩ độ phải là số thập phân'),
	body('longitude')
		.optional()
		.isDecimal()
		.withMessage('Kinh độ phải là số thập phân'),
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
		.withMessage('Mã quốc gia là bắt buộc')
		.isLength({ min: 2, max: 2 })
		.withMessage('Mã quốc gia phải có 2 ký tự'),
	body('country_name')
		.notEmpty()
		.withMessage('Tên quốc gia là bắt buộc')
		.isLength({ min: 1, max: 100 })
		.withMessage('Tên quốc gia phải từ 1 đến 100 ký tự'),
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
		.withMessage('ID hãng hàng không phải là số nguyên dương'),
	body('model')
		.notEmpty()
		.withMessage('Model là bắt buộc')
		.isLength({ min: 1, max: 100 })
		.withMessage('Model phải từ 1 đến 100 ký tự'),
	body('aircraft_type')
		.optional()
		.isLength({ min: 1, max: 50 })
		.withMessage('Loại máy bay phải từ 1 đến 50 ký tự'),
	body('total_seats')
		.isInt({ min: 1 })
		.withMessage('Tổng số ghế phải là số nguyên dương'),
	body('business_seats')
		.isInt({ min: 0 })
		.withMessage('Số ghế hạng thương gia phải là số nguyên không âm'),
	body('economy_seats')
		.isInt({ min: 0 })
		.withMessage('Số ghế hạng phổ thông phải là số nguyên không âm'),
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
		.withMessage('Họ là bắt buộc')
		.isLength({ min: 1, max: 50 })
		.withMessage('Họ phải từ 1 đến 50 ký tự'),
	body('last_name')
		.notEmpty()
		.withMessage('Tên là bắt buộc')
		.isLength({ min: 1, max: 50 })
		.withMessage('Tên phải từ 1 đến 50 ký tự'),
	body('date_of_birth')
		.notEmpty()
		.withMessage('Ngày sinh là bắt buộc')
		.isISO8601()
		.withMessage('Ngày sinh phải là ngày hợp lệ'),
	body('nationality')
		.optional()
		.isLength({ min: 1, max: 50 })
		.withMessage('Quốc tịch phải từ 1 đến 50 ký tự'),
	body('passport_number')
		.optional()
		.isLength({ min: 1, max: 50 })
		.withMessage('Số hộ chiếu phải từ 1 đến 50 ký tự'),
	body('passport_expiry')
		.optional()
		.isISO8601()
		.withMessage('Ngày hết hạn hộ chiếu phải là ngày hợp lệ'),
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
		.withMessage('Mã khuyến mãi là bắt buộc')
		.isLength({ min: 1, max: 20 })
		.withMessage('Mã khuyến mãi phải từ 1 đến 20 ký tự'),
	body('description')
		.notEmpty()
		.withMessage('Mô tả là bắt buộc')
		.isLength({ min: 1, max: 255 })
		.withMessage('Mô tả phải từ 1 đến 255 ký tự'),
	body('discount_type')
		.isIn(['percentage', 'fixed_amount'])
		.withMessage('Loại giảm giá phải là percentage hoặc fixed_amount'),
	body('discount_value')
		.isDecimal({ decimal_digits: '0,2' })
		.withMessage('Giá trị giảm giá phải là số thập phân'),
	body('min_purchase')
		.optional()
		.isDecimal({ decimal_digits: '0,2' })
		.withMessage('Giá trị mua tối thiểu phải là số thập phân'),
	body('start_date')
		.notEmpty()
		.withMessage('Ngày bắt đầu là bắt buộc')
		.isISO8601()
		.withMessage('Ngày bắt đầu phải là ngày hợp lệ'),
	body('end_date')
		.notEmpty()
		.withMessage('Ngày kết thúc là bắt buộc')
		.isISO8601()
		.withMessage('Ngày kết thúc phải là ngày hợp lệ'),
	body('usage_limit')
		.optional()
		.isInt({ min: 1 })
		.withMessage('Giới hạn sử dụng phải là số nguyên dương'),
	body('is_active')
		.optional()
		.isBoolean()
		.withMessage('Trường is_active phải là boolean'),
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
			'Trạng thái phải là một trong: pending, confirmed, cancelled, completed, pending_cancellation, hoặc cancellation_rejected'
		),
	body('payment_status')
		.optional()
		.isIn(['pending', 'paid', 'refunded', 'failed'])
		.withMessage(
			'Trạng thái thanh toán phải là pending, paid, refunded, hoặc failed'
		),
	body('cancellation_reason').optional().isLength({ min: 1, max: 255 }).withMessage('Lý do hủy phải từ 1 đến 255 ký tự'),
	body('reject_reason').optional().isLength({ min: 1, max: 255 }).withMessage('Lý do từ chối phải từ 1 đến 255 ký tự'),
	body('action')
		.optional()
		.isIn(['reject_cancellation'])
		.withMessage('Hành động phải là reject_cancellation'),
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
		.withMessage('Email phải là địa chỉ email hợp lệ'),
	body('first_name')
		.optional()
		.isLength({ min: 1, max: 50 })
		.withMessage('Họ phải từ 1 đến 50 ký tự'),
	body('last_name')
		.optional()
		.isLength({ min: 1, max: 50 })
		.withMessage('Tên phải từ 1 đến 50 ký tự'),
	body('phone')
		.optional()
		.isLength({ min: 1, max: 20 })
		.withMessage('Số điện thoại phải từ 1 đến 20 ký tự'),
	body('is_active')
		.optional()
		.isBoolean()
		.withMessage('Trường is_active phải là boolean'),
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
	[...idValidation, body('is_active').isBoolean().withMessage('Trường is_active phải là boolean')],
	validate,
	adminController.updateUserStatus
);

// Travel Classes Management
const travelClassValidation = [
	body('class_name')
		.notEmpty()
		.withMessage('Tên hạng vé là bắt buộc')
		.isLength({ min: 1, max: 50 })
		.withMessage('Tên hạng vé phải từ 1 đến 50 ký tự'),
	body('class_code')
		.notEmpty()
		.withMessage('Mã hạng vé là bắt buộc')
		.isLength({ min: 1, max: 20 })
		.withMessage('Mã hạng vé phải từ 1 đến 20 ký tự'),
	body('description')
		.optional()
		.isLength({ min: 1, max: 255 })
		.withMessage('Mô tả phải từ 1 đến 255 ký tự'),
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
		.withMessage('ID hãng hàng không phải là số nguyên dương'),
	body('weight_kg')
		.isDecimal({ decimal_digits: '0,2' })
		.withMessage('Trọng lượng phải là số thập phân'),
	body('price')
		.isDecimal({ decimal_digits: '0,2' })
		.withMessage('Giá phải là số thập phân'),
	body('description')
		.notEmpty()
		.withMessage('Mô tả là bắt buộc')
		.isLength({ min: 1, max: 255 })
		.withMessage('Mô tả phải từ 1 đến 255 ký tự'),
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
		.withMessage('ID hãng hàng không phải là số nguyên dương'),
	body('meal_name')
		.notEmpty()
		.withMessage('Tên bữa ăn là bắt buộc')
		.isLength({ min: 1, max: 100 })
		.withMessage('Tên bữa ăn phải từ 1 đến 100 ký tự'),
	body('meal_description')
		.optional()
		.isLength({ min: 1, max: 255 })
		.withMessage('Mô tả bữa ăn phải từ 1 đến 255 ký tự'),
	body('price')
		.isDecimal({ decimal_digits: '0,2' })
		.withMessage('Giá phải là số thập phân'),
	body('is_vegetarian')
		.optional()
		.isBoolean()
		.withMessage('Trường is_vegetarian phải là boolean'),
	body('is_halal')
		.optional()
		.isBoolean()
		.withMessage('Trường is_halal phải là boolean'),
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
		.withMessage('Thời gian khởi hành phải là ngày hợp lệ'),
	body('arrival_time')
		.notEmpty()
		.withMessage('Thời gian đến là bắt buộc')
		.isISO8601()
		.withMessage('Thời gian đến phải là ngày hợp lệ'),
	body('force_edit')
		.optional()
		.isBoolean()
		.withMessage('Trường force_edit phải là boolean'),
	body('status')
		.optional()
		.isIn(['scheduled', 'delayed', 'cancelled', 'completed'])
		.withMessage(
			'Trạng thái phải là scheduled, delayed, cancelled, hoặc completed'
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
