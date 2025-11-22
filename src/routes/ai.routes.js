/**
 * AI Routes
 * Defines all AI recommendation and booking assistance API endpoints
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const aiController = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Validation rules
const personalizedRecommendationsValidation = [
	query('departure_airport_code')
		.notEmpty()
		.withMessage('Mã sân bay đi là bắt buộc')
		.isLength({ min: 3, max: 3 })
		.withMessage('Mã sân bay phải có 3 ký tự'),
	query('arrival_airport_code')
		.notEmpty()
		.withMessage('Mã sân bay đến là bắt buộc')
		.isLength({ min: 3, max: 3 })
		.withMessage('Mã sân bay phải có 3 ký tự'),
	query('departure_date')
		.notEmpty()
		.withMessage('Ngày khởi hành là bắt buộc')
		.isISO8601()
		.withMessage('Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD'),
	query('class_code')
		.optional()
		.isIn(['ECONOMY', 'BUSINESS'])
		.withMessage('Mã hạng vé phải là ECONOMY hoặc BUSINESS'),
	query('limit')
		.optional()
		.isInt({ min: 1, max: 20 })
		.withMessage('Giới hạn phải từ 1 đến 20'),
];

const bookingAssistantValidation = [
	body('flight_id')
		.notEmpty()
		.withMessage('ID chuyến bay là bắt buộc')
		.isInt({ min: 1 })
		.withMessage('ID chuyến bay phải là số nguyên dương'),
	body('passengers')
		.optional()
		.isInt({ min: 1, max: 9 })
		.withMessage('Số hành khách phải từ 1 đến 9'),
	body('class_code')
		.optional()
		.isIn(['ECONOMY', 'BUSINESS'])
		.withMessage('Mã hạng vé phải là ECONOMY hoặc BUSINESS'),
];

const trackSearchValidation = [
	body('departure_airport_code')
		.notEmpty()
		.withMessage('Mã sân bay đi là bắt buộc')
		.isLength({ min: 3, max: 3 })
		.withMessage('Mã sân bay phải có 3 ký tự'),
	body('arrival_airport_code')
		.notEmpty()
		.withMessage('Mã sân bay đến là bắt buộc')
		.isLength({ min: 3, max: 3 })
		.withMessage('Mã sân bay phải có 3 ký tự'),
	body('departure_date')
		.notEmpty()
		.withMessage('Ngày khởi hành là bắt buộc')
		.isISO8601()
		.withMessage('Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD'),
	body('return_date')
		.optional()
		.isISO8601()
		.withMessage('Định dạng ngày về không hợp lệ. Sử dụng YYYY-MM-DD'),
	body('passengers')
		.optional()
		.isInt({ min: 1, max: 9 })
		.withMessage('Số hành khách phải từ 1 đến 9'),
	body('class_code')
		.optional()
		.isIn(['ECONOMY', 'BUSINESS'])
		.withMessage('Mã hạng vé phải là ECONOMY hoặc BUSINESS'),
];

const paginationValidation = [
	query('page')
		.optional()
		.isInt({ min: 1 })
		.withMessage('Trang phải là số nguyên dương'),
	query('limit')
		.optional()
		.isInt({ min: 1, max: 50 })
		.withMessage('Giới hạn phải từ 1 đến 50'),
];

const searchSuggestionsValidation = [
	query('query')
		.notEmpty()
		.withMessage('Truy vấn tìm kiếm là bắt buộc')
		.isLength({ min: 2, max: 100 })
		.withMessage('Truy vấn tìm kiếm phải từ 2 đến 100 ký tự'),
	query('limit')
		.optional()
		.isInt({ min: 1, max: 20 })
		.withMessage('Giới hạn phải từ 1 đến 20'),
];

// Chat AI validation rules
const chatValidation = [
	body('message')
		.notEmpty()
		.withMessage('Tin nhắn là bắt buộc')
		.isLength({ min: 1, max: 1000 })
		.withMessage('Tin nhắn phải từ 1 đến 1000 ký tự'),
	body('context')
		.optional()
		.isObject()
		.withMessage('Ngữ cảnh phải là đối tượng'),
];

const travelRecommendationsValidation = [
	body('preferences')
		.notEmpty()
		.withMessage('Sở thích du lịch là bắt buộc')
		.isObject()
		.withMessage('Sở thích phải là đối tượng'),
];

const flightSearchAssistanceValidation = [
	body('search_params')
		.notEmpty()
		.withMessage('Tham số tìm kiếm là bắt buộc')
		.isObject()
		.withMessage('Tham số tìm kiếm phải là đối tượng'),
];

const travelAdviceValidation = [
	body('topic')
		.notEmpty()
		.withMessage('Chủ đề du lịch là bắt buộc')
		.isLength({ min: 2, max: 200 })
		.withMessage('Chủ đề phải từ 2 đến 200 ký tự'),
];

// All AI routes require authentication
router.use(protect);

// AI Recommendation endpoints
router.get(
	'/recommendations',
	personalizedRecommendationsValidation,
	validate,
	aiController.getPersonalizedRecommendations
);

router.post(
	'/booking-assistant',
	bookingAssistantValidation,
	validate,
	aiController.getBookingAssistantSuggestions
);

router.post(
	'/track-search',
	trackSearchValidation,
	validate,
	aiController.trackUserSearch
);

router.get(
	'/search-history',
	paginationValidation,
	validate,
	aiController.getUserSearchHistory
);

router.get(
	'/recommendations-history',
	paginationValidation,
	validate,
	aiController.getUserRecommendationsHistory
);

router.get('/insights', aiController.getUserAIInsights);

// Specific insights endpoints
router.get('/insights/preferences', aiController.getUserPreferences);
router.get('/insights/patterns', aiController.getUserPatterns);
router.get(
	'/insights/recommendations',
	aiController.getUserRecommendationsHistory
);
router.get(
	'/insights/search-history',
	aiController.getUserSearchHistoryInsights
);

router.get(
	'/search-suggestions',
	searchSuggestionsValidation,
	validate,
	aiController.getSearchSuggestions
);

router.delete('/clear-data', aiController.clearUserAIData);

// Chat AI endpoints
router.post('/chat', chatValidation, validate, aiController.chatWithAI);
router.post(
	'/travel-recommendations',
	travelRecommendationsValidation,
	validate,
	aiController.getAITravelRecommendations
);
router.post(
	'/flight-search-assistance',
	flightSearchAssistanceValidation,
	validate,
	aiController.getAIFlightSearchAssistance
);
router.post(
	'/travel-advice',
	travelAdviceValidation,
	validate,
	aiController.getAITravelAdvice
);
router.get('/test-connection', aiController.testAIConnection);

module.exports = router;
