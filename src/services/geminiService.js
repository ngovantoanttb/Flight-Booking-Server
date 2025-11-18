/**
 * Gemini AI Service
 * Handles chat interactions with Google Gemini AI
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');
const { BadRequestError, ServiceUnavailableError } = require('../utils/errors');

class GeminiService {
	constructor() {
		this.apiKey =
			process.env.GEMINI_API_KEY ||
			'AIzaSyAi0Mi5xdB02coXXRd6rsKjhzS9AqZVLD0';
		this.genAI = new GoogleGenerativeAI(this.apiKey);
		this.model = this.genAI.getGenerativeModel({
			model: 'gemini-2.5-flash',
		});

		// System prompt for flight booking assistant
		this.systemPrompt = `You are a helpful AI assistant for a flight booking system. You can help users with:

1. Flight search and booking assistance
2. Travel recommendations and tips
3. Airport and airline information
4. Travel planning and itinerary suggestions
5. General travel-related questions

Please provide helpful, accurate, and friendly responses. If you don't know something specific about the flight booking system, please say so and offer to help with what you can.

Keep responses concise but informative. If the user asks about specific flights, bookings, or system features, remind them that you're a general travel assistant and they should use the specific API endpoints for detailed flight information.`;
	}

	/**
	 * Send a chat message to Gemini AI
	 * @param {string} message - User's message
	 * @param {Object} context - Optional context (user info, booking history, etc.)
	 * @returns {Promise<Object>} AI response
	 */
	async sendMessage(message, context = {}) {
		try {
			// Validate input
			if (
				!message ||
				typeof message !== 'string' ||
				message.trim().length === 0
			) {
				throw new BadRequestError(
					'Message is required and must be a non-empty string'
				);
			}

			// Prepare the full prompt with context
			let fullPrompt = this.systemPrompt;

			// Add context if provided
			if (context.user_id) {
				fullPrompt += `\n\nUser ID: ${context.user_id}`;
			}

			if (context.user_email) {
				fullPrompt += `\nUser Email: ${context.user_email}`;
			}

			if (context.recent_searches && context.recent_searches.length > 0) {
				fullPrompt += `\nRecent search history: ${JSON.stringify(
					context.recent_searches
				)}`;
			}

			if (context.recent_bookings && context.recent_bookings.length > 0) {
				fullPrompt += `\nRecent booking history: ${JSON.stringify(
					context.recent_bookings
				)}`;
			}

			fullPrompt += `\n\nUser message: ${message}`;

			logger.info('Sending message to Gemini AI', {
				message_length: message.length,
				has_context: Object.keys(context).length > 0,
			});

			// Generate response
			const result = await this.model.generateContent(fullPrompt);
			const response = await result.response;
			const text = response.text();

			logger.info('Received response from Gemini AI', {
				response_length: text.length,
			});

			return {
				message: text,
				timestamp: new Date().toISOString(),
				model: 'gemini-pro',
				context_used: Object.keys(context).length > 0,
			};
		} catch (error) {
			logger.error('Error in Gemini AI service:', error);

			// Handle specific Gemini API errors
			if (error.message.includes('API key')) {
				throw new ServiceUnavailableError(
					'AI service configuration error'
				);
			}

			if (
				error.message.includes('quota') ||
				error.message.includes('limit')
			) {
				throw new ServiceUnavailableError('AI service quota exceeded');
			}

			if (error.message.includes('safety')) {
				throw new BadRequestError(
					'Message content violates safety guidelines'
				);
			}

			// Generic error
			throw new ServiceUnavailableError(
				'AI service temporarily unavailable'
			);
		}
	}

	/**
	 * Get travel recommendations based on user preferences
	 * @param {Object} preferences - User travel preferences
	 * @returns {Promise<Object>} AI recommendations
	 */
	async getTravelRecommendations(preferences) {
		try {
			const message = `Based on these travel preferences, provide personalized recommendations:

			Preferences: ${JSON.stringify(preferences, null, 2)}

			Please provide:
			1. Destination suggestions
			2. Best time to travel
			3. Travel tips
			4. Budget considerations
			5. Any other relevant advice`;

			return await this.sendMessage(message, preferences);
		} catch (error) {
			logger.error('Error getting travel recommendations:', error);
			throw error;
		}
	}

	/**
	 * Get flight search assistance
	 * @param {Object} searchParams - Flight search parameters
	 * @returns {Promise<Object>} AI assistance
	 */
	async getFlightSearchAssistance(searchParams) {
		try {
			const message = `I'm looking for flights with these parameters:

			${JSON.stringify(searchParams, null, 2)}

			Please provide:
			1. Search tips and suggestions
			2. Alternative dates or routes if applicable
			3. What to consider when booking
			4. Any travel advice for this route`;

			return await this.sendMessage(message, searchParams);
		} catch (error) {
			logger.error('Error getting flight search assistance:', error);
			throw error;
		}
	}

	/**
	 * Get general travel advice
	 * @param {string} topic - Travel topic
	 * @returns {Promise<Object>} AI advice
	 */
	async getTravelAdvice(topic) {
		try {
			const message = `Please provide advice about: ${topic}`;
			return await this.sendMessage(message);
		} catch (error) {
			logger.error('Error getting travel advice:', error);
			throw error;
		}
	}

	/**
	 * Test the Gemini AI connection
	 * @returns {Promise<Object>} Test result
	 */
	async testConnection() {
		try {
			const testMessage = 'Hello! Can you help me with travel planning?';
			const response = await this.sendMessage(testMessage);

			return {
				success: true,
				message: 'Gemini AI connection successful',
				test_response: response.message,
				timestamp: response.timestamp,
			};
		} catch (error) {
			logger.error('Gemini AI connection test failed:', error);
			return {
				success: false,
				message: 'Gemini AI connection failed',
				error: error.message,
			};
		}
	}
}

module.exports = new GeminiService();
