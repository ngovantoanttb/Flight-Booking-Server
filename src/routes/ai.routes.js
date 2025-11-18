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
		.withMessage('Departure airport code is required')
		.isLength({ min: 3, max: 3 })
		.withMessage('Airport code must be 3 characters'),
	query('arrival_airport_code')
		.notEmpty()
		.withMessage('Arrival airport code is required')
		.isLength({ min: 3, max: 3 })
		.withMessage('Airport code must be 3 characters'),
	query('departure_date')
		.notEmpty()
		.withMessage('Departure date is required')
		.isISO8601()
		.withMessage('Invalid date format. Use YYYY-MM-DD'),
	query('class_code')
		.optional()
		.isIn(['ECONOMY', 'BUSINESS'])
		.withMessage('Class code must be ECONOMY or BUSINESS'),
	query('limit')
		.optional()
		.isInt({ min: 1, max: 20 })
		.withMessage('Limit must be between 1 and 20'),
];

const bookingAssistantValidation = [
	body('flight_id')
		.notEmpty()
		.withMessage('Flight ID is required')
		.isInt({ min: 1 })
		.withMessage('Flight ID must be a positive integer'),
	body('passengers')
		.optional()
		.isInt({ min: 1, max: 9 })
		.withMessage('Passengers must be between 1 and 9'),
	body('class_code')
		.optional()
		.isIn(['ECONOMY', 'BUSINESS'])
		.withMessage('Class code must be ECONOMY or BUSINESS'),
];

const trackSearchValidation = [
	body('departure_airport_code')
		.notEmpty()
		.withMessage('Departure airport code is required')
		.isLength({ min: 3, max: 3 })
		.withMessage('Airport code must be 3 characters'),
	body('arrival_airport_code')
		.notEmpty()
		.withMessage('Arrival airport code is required')
		.isLength({ min: 3, max: 3 })
		.withMessage('Airport code must be 3 characters'),
	body('departure_date')
		.notEmpty()
		.withMessage('Departure date is required')
		.isISO8601()
		.withMessage('Invalid date format. Use YYYY-MM-DD'),
	body('return_date')
		.optional()
		.isISO8601()
		.withMessage('Invalid return date format. Use YYYY-MM-DD'),
	body('passengers')
		.optional()
		.isInt({ min: 1, max: 9 })
		.withMessage('Passengers must be between 1 and 9'),
	body('class_code')
		.optional()
		.isIn(['ECONOMY', 'BUSINESS'])
		.withMessage('Class code must be ECONOMY or BUSINESS'),
];

const paginationValidation = [
	query('page')
		.optional()
		.isInt({ min: 1 })
		.withMessage('Page must be a positive integer'),
	query('limit')
		.optional()
		.isInt({ min: 1, max: 50 })
		.withMessage('Limit must be between 1 and 50'),
];

const searchSuggestionsValidation = [
	query('query')
		.notEmpty()
		.withMessage('Search query is required')
		.isLength({ min: 2, max: 100 })
		.withMessage('Search query must be between 2 and 100 characters'),
	query('limit')
		.optional()
		.isInt({ min: 1, max: 20 })
		.withMessage('Limit must be between 1 and 20'),
];

// Chat AI validation rules
const chatValidation = [
	body('message')
		.notEmpty()
		.withMessage('Message is required')
		.isLength({ min: 1, max: 1000 })
		.withMessage('Message must be between 1 and 1000 characters'),
	body('context')
		.optional()
		.isObject()
		.withMessage('Context must be an object'),
];

const travelRecommendationsValidation = [
	body('preferences')
		.notEmpty()
		.withMessage('Travel preferences are required')
		.isObject()
		.withMessage('Preferences must be an object'),
];

const flightSearchAssistanceValidation = [
	body('search_params')
		.notEmpty()
		.withMessage('Search parameters are required')
		.isObject()
		.withMessage('Search parameters must be an object'),
];

const travelAdviceValidation = [
	body('topic')
		.notEmpty()
		.withMessage('Travel topic is required')
		.isLength({ min: 2, max: 200 })
		.withMessage('Topic must be between 2 and 200 characters'),
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
