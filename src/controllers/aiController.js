/**
 * AI Controller
 * Handles HTTP requests for AI recommendation and booking assistance
 */

const aiRecommendationService = require('../services/aiRecommendationService');
const geminiService = require('../services/geminiService');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

class AIController {
	/**
	 * Get personalized flight recommendations
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async getPersonalizedRecommendations(req, res, next) {
		try {
			const userId = req.user.user_id;
			const {
				limit = 10,
				departure_airport_code,
				arrival_airport_code,
				departure_date,
				class_code = 'ECONOMY',
			} = req.query;

			// Validate required parameters
			if (
				!departure_airport_code ||
				!arrival_airport_code ||
				!departure_date
			) {
				return sendError(
					res,
					'Missing required parameters: departure_airport_code, arrival_airport_code, departure_date'
				);
			}

			// Validate date format
			if (isNaN(Date.parse(departure_date))) {
				return sendError(
					res,
					'Invalid departure_date format. Use YYYY-MM-DD'
				);
			}

			// Validate limit
			const limitNum = parseInt(limit);
			if (limitNum < 1 || limitNum > 20) {
				return sendError(res, 'Limit must be between 1 and 20');
			}

			const options = {
				limit: limitNum,
				departure_airport_code,
				arrival_airport_code,
				departure_date,
				class_code,
			};

			const recommendations =
				await aiRecommendationService.getPersonalizedRecommendations(
					userId,
					options
				);

			return sendSuccess(
				res,
				'Personalized recommendations retrieved successfully',
				{
					recommendations,
					total_count: recommendations.length,
					search_criteria: options,
				}
			);
		} catch (error) {
			logger.error(
				'Error in getPersonalizedRecommendations controller:',
				error
			);
			next(error);
		}
	}

	/**
	 * Get AI booking assistant suggestions
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async getBookingAssistantSuggestions(req, res, next) {
		try {
			const userId = req.user.user_id;
			const {
				flight_id,
				passengers = 1,
				class_code = 'ECONOMY',
			} = req.body;

			// Validate required parameters
			if (!flight_id) {
				return sendError(res, 'Missing required parameter: flight_id');
			}

			// Validate flight ID
			if (isNaN(parseInt(flight_id))) {
				return sendError(res, 'Invalid flight_id format');
			}

			// Validate passengers
			const passengersNum = parseInt(passengers);
			if (passengersNum < 1 || passengersNum > 9) {
				return sendError(res, 'Passengers must be between 1 and 9');
			}

			const bookingContext = {
				flight_id: parseInt(flight_id),
				passengers: passengersNum,
				class_code,
			};

			const suggestions =
				await aiRecommendationService.getBookingAssistantSuggestions(
					userId,
					bookingContext
				);

			return sendSuccess(
				res,
				'Booking assistant suggestions retrieved successfully',
				suggestions
			);
		} catch (error) {
			logger.error(
				'Error in getBookingAssistantSuggestions controller:',
				error
			);
			next(error);
		}
	}

	/**
	 * Track user search for AI learning
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async trackUserSearch(req, res, next) {
		try {
			const userId = req.user.user_id;
			const {
				departure_airport_code,
				arrival_airport_code,
				departure_date,
				return_date,
				passengers = 1,
				class_code = 'ECONOMY',
			} = req.body;

			// Validate required parameters
			if (
				!departure_airport_code ||
				!arrival_airport_code ||
				!departure_date
			) {
				return sendError(
					res,
					'Missing required parameters: departure_airport_code, arrival_airport_code, departure_date'
				);
			}

			// Validate date format
			if (isNaN(Date.parse(departure_date))) {
				return sendError(
					res,
					'Invalid departure_date format. Use YYYY-MM-DD'
				);
			}

			// Validate return date if provided
			if (return_date && isNaN(Date.parse(return_date))) {
				return sendError(
					res,
					'Invalid return_date format. Use YYYY-MM-DD'
				);
			}

			// Validate passengers
			const passengersNum = parseInt(passengers);
			if (passengersNum < 1 || passengersNum > 9) {
				return sendError(res, 'Passengers must be between 1 and 9');
			}

			const searchParams = {
				departure_airport_code,
				arrival_airport_code,
				departure_date,
				return_date,
				passengers: passengersNum,
				class_code,
			};

			await aiRecommendationService.trackUserSearch(userId, searchParams);

			return sendSuccess(res, 'User search tracked successfully', {
				search_params: searchParams,
				tracked_at: new Date().toISOString(),
			});
		} catch (error) {
			logger.error('Error in trackUserSearch controller:', error);
			next(error);
		}
	}

	/**
	 * Get user's search history
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async getUserSearchHistory(req, res, next) {
		try {
			const userId = req.user.user_id;
			const page = parseInt(req.query.page) || 1;
			const limit = parseInt(req.query.limit) || 10;

			// Validate pagination parameters
			if (page < 1 || limit < 1 || limit > 50) {
				return sendError(res, 'Invalid pagination parameters');
			}

			const searchHistory =
				await aiRecommendationService.getUserSearchHistory(
					userId,
					page,
					limit
				);

			return sendPaginated(
				res,
				'Search history retrieved successfully',
				searchHistory.data,
				searchHistory.pagination
			);
		} catch (error) {
			logger.error('Error in getUserSearchHistory controller:', error);
			next(error);
		}
	}

	/**
	 * Get user's AI recommendations history
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async getUserRecommendationsHistory(req, res, next) {
		try {
			const userId = req.user.user_id;
			const page = parseInt(req.query.page) || 1;
			const limit = parseInt(req.query.limit) || 10;

			// Validate pagination parameters
			if (page < 1 || limit < 1 || limit > 50) {
				return sendError(res, 'Invalid pagination parameters');
			}

			const recommendationsHistory =
				await aiRecommendationService.getUserRecommendationsHistory(
					userId,
					page,
					limit
				);

			return sendPaginated(
				res,
				'Recommendations history retrieved successfully',
				recommendationsHistory.data,
				recommendationsHistory.pagination
			);
		} catch (error) {
			logger.error(
				'Error in getUserRecommendationsHistory controller:',
				error
			);
			next(error);
		}
	}

	/**
	 * Get AI insights about user preferences
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async getUserAIInsights(req, res, next) {
		try {
			const userId = req.user.user_id;

			const insights = await aiRecommendationService.getUserAIInsights(
				userId
			);

			return sendSuccess(
				res,
				'AI insights retrieved successfully',
				insights
			);
		} catch (error) {
			logger.error('Error in getUserAIInsights controller:', error);
			next(error);
		}
	}

	/**
	 * Get user travel preferences
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async getUserPreferences(req, res, next) {
		try {
			const userId = req.user.user_id;
			const { days = 30 } = req.query;

			const preferences =
				await aiRecommendationService.getUserPreferences(
					userId,
					parseInt(days)
				);

			return sendSuccess(
				res,
				'User preferences retrieved successfully',
				preferences
			);
		} catch (error) {
			logger.error('Error in getUserPreferences controller:', error);
			next(error);
		}
	}

	/**
	 * Get user travel patterns
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async getUserPatterns(req, res, next) {
		try {
			const userId = req.user.user_id;
			const { days = 30 } = req.query;

			const patterns = await aiRecommendationService.getUserPatterns(
				userId,
				parseInt(days)
			);

			return sendSuccess(
				res,
				'User patterns retrieved successfully',
				patterns
			);
		} catch (error) {
			logger.error('Error in getUserPatterns controller:', error);
			next(error);
		}
	}

	/**
	 * Get user search history insights
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async getUserSearchHistoryInsights(req, res, next) {
		try {
			const userId = req.user.user_id;
			const { days = 30 } = req.query;

			const insights =
				await aiRecommendationService.getUserSearchHistoryInsights(
					userId,
					parseInt(days)
				);

			return sendSuccess(
				res,
				'User search history insights retrieved successfully',
				insights
			);
		} catch (error) {
			logger.error(
				'Error in getUserSearchHistoryInsights controller:',
				error
			);
			next(error);
		}
	}

	/**
	 * Get search suggestions based on user history
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async getSearchSuggestions(req, res, next) {
		try {
			const userId = req.user.user_id;
			const { query: searchQuery, limit = 5 } = req.query;

			// Validate search query
			if (!searchQuery || searchQuery.trim().length < 2) {
				return sendError(
					res,
					'Search query must be at least 2 characters long'
				);
			}

			// Validate limit
			const limitNum = parseInt(limit);
			if (limitNum < 1 || limitNum > 20) {
				return sendError(res, 'Limit must be between 1 and 20');
			}

			const suggestions =
				await aiRecommendationService.getSearchSuggestions(
					userId,
					searchQuery.trim(),
					limitNum
				);

			return sendSuccess(
				res,
				'Search suggestions retrieved successfully',
				{
					suggestions,
					query: searchQuery,
					total_count: suggestions.length,
				}
			);
		} catch (error) {
			logger.error('Error in getSearchSuggestions controller:', error);
			next(error);
		}
	}

	/**
	 * Clear user's AI data (for privacy/GDPR compliance)
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async clearUserAIData(req, res, next) {
		try {
			const userId = req.user.user_id;

			await aiRecommendationService.clearUserAIData(userId);

			return sendSuccess(res, 'User AI data cleared successfully', {
				cleared_at: new Date().toISOString(),
				user_id: userId,
			});
		} catch (error) {
			logger.error('Error in clearUserAIData controller:', error);
			next(error);
		}
	}

	/**
	 * Chat with Gemini AI
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async chatWithAI(req, res, next) {
		try {
			const userId = req.user.user_id;
			const { message, context } = req.body;

			// Validate message
			if (
				!message ||
				typeof message !== 'string' ||
				message.trim().length === 0
			) {
				return sendError(
					res,
					'Message is required and must be a non-empty string'
				);
			}

			// Prepare context with user information
			const chatContext = {
				user_id: userId,
				user_email: req.user.email,
				...context,
			};

			// Get AI response
			const aiResponse = await geminiService.sendMessage(
				message.trim(),
				chatContext
			);

			return sendSuccess(res, 'AI response generated successfully', {
				user_message: message,
				ai_response: aiResponse.message,
				timestamp: aiResponse.timestamp,
				model: aiResponse.model,
				context_used: aiResponse.context_used,
			});
		} catch (error) {
			logger.error('Error in chatWithAI controller:', error);
			next(error);
		}
	}

	/**
	 * Get travel recommendations from Gemini AI
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async getAITravelRecommendations(req, res, next) {
		try {
			const userId = req.user.user_id;
			const preferences = req.body;

			// Validate preferences
			if (!preferences || typeof preferences !== 'object') {
				return sendError(res, 'Travel preferences are required');
			}

			// Add user context
			const contextWithUser = {
				user_id: userId,
				user_email: req.user.email,
				...preferences,
			};

			// Get AI recommendations
			const recommendations =
				await geminiService.getTravelRecommendations(contextWithUser);

			return sendSuccess(
				res,
				'AI travel recommendations generated successfully',
				{
					preferences,
					recommendations: recommendations.message,
					timestamp: recommendations.timestamp,
					model: recommendations.model,
				}
			);
		} catch (error) {
			logger.error(
				'Error in getAITravelRecommendations controller:',
				error
			);
			next(error);
		}
	}

	/**
	 * Get flight search assistance from Gemini AI
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async getAIFlightSearchAssistance(req, res, next) {
		try {
			const userId = req.user.user_id;
			const searchParams = req.body;

			// Validate search parameters
			if (!searchParams || typeof searchParams !== 'object') {
				return sendError(res, 'Search parameters are required');
			}

			// Add user context
			const contextWithUser = {
				user_id: userId,
				user_email: req.user.email,
				...searchParams,
			};

			// Get AI assistance
			const assistance = await geminiService.getFlightSearchAssistance(
				contextWithUser
			);

			return sendSuccess(
				res,
				'AI flight search assistance generated successfully',
				{
					search_params: searchParams,
					assistance: assistance.message,
					timestamp: assistance.timestamp,
					model: assistance.model,
				}
			);
		} catch (error) {
			logger.error(
				'Error in getAIFlightSearchAssistance controller:',
				error
			);
			next(error);
		}
	}

	/**
	 * Get general travel advice from Gemini AI
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async getAITravelAdvice(req, res, next) {
		try {
			const userId = req.user.user_id;
			const { topic } = req.body;

			// Validate topic
			if (
				!topic ||
				typeof topic !== 'string' ||
				topic.trim().length === 0
			) {
				return sendError(
					res,
					'Travel topic is required and must be a non-empty string'
				);
			}

			// Get AI advice
			const advice = await geminiService.getTravelAdvice(topic.trim());

			return sendSuccess(res, 'AI travel advice generated successfully', {
				topic: topic.trim(),
				advice: advice.message,
				timestamp: advice.timestamp,
				model: advice.model,
			});
		} catch (error) {
			logger.error('Error in getAITravelAdvice controller:', error);
			next(error);
		}
	}

	/**
	 * Test Gemini AI connection
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async testAIConnection(req, res, next) {
		try {
			const testResult = await geminiService.testConnection();

			if (testResult.success) {
				return sendSuccess(
					res,
					'AI connection test successful',
					testResult
				);
			} else {
				return sendError(
					res,
					'AI connection test failed',
					503,
					testResult
				);
			}
		} catch (error) {
			logger.error('Error in testAIConnection controller:', error);
			next(error);
		}
	}
}

module.exports = new AIController();
