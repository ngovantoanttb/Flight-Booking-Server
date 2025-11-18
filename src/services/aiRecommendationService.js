/**
 * AI Recommendation Service
 * Handles intelligent flight recommendations and booking assistance
 */

const BaseService = require('./baseService');
const {
	Flight,
	Airline,
	Aircraft,
	Airport,
	FlightSeat,
	TravelClass,
	UserSearchHistory,
	FlightRecommendation,
	Booking,
	BookingDetail,
	User,
} = require('../models');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class AIRecommendationService extends BaseService {
	constructor() {
		super(FlightRecommendation);
	}

	/**
	 * Get personalized flight recommendations for a user
	 * @param {number} userId - User ID
	 * @param {Object} options - Recommendation options
	 * @returns {Promise<Array>} Recommended flights
	 */
	async getPersonalizedRecommendations(userId, options = {}) {
		try {
			const {
				limit = 10,
				departure_airport_code,
				arrival_airport_code,
				departure_date,
				class_code = 'ECONOMY',
			} = options;

			// Get user's search history and preferences
			const userPreferences = await this.analyzeUserPreferences(userId);

			// Get user's booking history for pattern analysis
			const bookingPatterns = await this.analyzeBookingPatterns(userId);

			// Build recommendation criteria
			const recommendationCriteria = this.buildRecommendationCriteria(
				userPreferences,
				bookingPatterns,
				options
			);

			// Find recommended flights
			const recommendedFlights = await this.findRecommendedFlights(
				recommendationCriteria,
				limit
			);

			// Calculate recommendation scores and reasons
			const scoredRecommendations = await this.scoreRecommendations(
				recommendedFlights,
				userPreferences,
				bookingPatterns
			);

			// Save recommendations to database
			await this.saveRecommendations(userId, scoredRecommendations);

			return scoredRecommendations;
		} catch (error) {
			logger.error('Error getting personalized recommendations:', error);
			throw error;
		}
	}

	/**
	 * Analyze user preferences from search history
	 * @param {number} userId - User ID
	 * @returns {Promise<Object>} User preferences
	 */
	async analyzeUserPreferences(userId) {
		try {
			// Get recent search history (last 30 days)
			const thirtyDaysAgo = new Date();
			thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

			const searchHistory = await UserSearchHistory.findAll({
				where: {
					user_id: userId,
					search_timestamp: {
						[Op.gte]: thirtyDaysAgo,
					},
				},
				include: [
					{
						model: Airport,
						as: 'DepartureAirport',
						attributes: ['airport_id', 'airport_code', 'city'],
					},
					{
						model: Airport,
						as: 'ArrivalAirport',
						attributes: ['airport_id', 'airport_code', 'city'],
					},
					{
						model: TravelClass,
						attributes: ['class_id', 'class_name', 'class_code'],
					},
				],
				order: [['search_timestamp', 'DESC']],
				limit: 50,
			});

			// Analyze preferences
			const preferences = {
				preferred_airlines:
					this.extractPreferredAirlines(searchHistory),
				preferred_routes: this.extractPreferredRoutes(searchHistory),
				preferred_times: this.extractPreferredTimes(searchHistory),
				preferred_class: this.extractPreferredClass(searchHistory),
				preferred_passengers:
					this.extractPreferredPassengers(searchHistory),
				search_frequency: searchHistory.length,
			};

			return preferences;
		} catch (error) {
			logger.error('Error analyzing user preferences:', error);
			throw error;
		}
	}

	/**
	 * Analyze user's booking patterns
	 * @param {number} userId - User ID
	 * @returns {Promise<Object>} Booking patterns
	 */
	async analyzeBookingPatterns(userId) {
		try {
			const bookings = await Booking.findAll({
				where: {
					user_id: userId,
					status: 'confirmed',
				},
				include: [
					{
						model: BookingDetail,
						include: [
							{
								model: Flight,
								include: [
									{
										model: Airline,
										attributes: [
											'airline_id',
											'airline_name',
											'airline_code',
										],
									},
									{
										model: Airport,
										as: 'DepartureAirport',
										attributes: [
											'airport_id',
											'airport_code',
											'city',
										],
									},
									{
										model: Airport,
										as: 'ArrivalAirport',
										attributes: [
											'airport_id',
											'airport_code',
											'city',
										],
									},
								],
							},
							{
								model: FlightSeat,
								include: [
									{
										model: TravelClass,
										attributes: [
											'class_id',
											'class_name',
											'class_code',
										],
									},
								],
							},
						],
					},
				],
				order: [['booking_date', 'DESC']],
				limit: 20,
			});

			const patterns = {
				booked_airlines: this.extractBookedAirlines(bookings),
				booked_routes: this.extractBookedRoutes(bookings),
				booked_times: this.extractBookedTimes(bookings),
				booked_classes: this.extractBookedClasses(bookings),
				booking_frequency: bookings.length,
				average_booking_advance:
					this.calculateAverageBookingAdvance(bookings),
			};

			return patterns;
		} catch (error) {
			logger.error('Error analyzing booking patterns:', error);
			throw error;
		}
	}

	/**
	 * Build recommendation criteria based on user data
	 * @param {Object} userPreferences - User preferences
	 * @param {Object} bookingPatterns - Booking patterns
	 * @param {Object} options - Search options
	 * @returns {Object} Recommendation criteria
	 */
	buildRecommendationCriteria(userPreferences, bookingPatterns, options) {
		const criteria = {
			// Base search criteria
			departure_airport_code: options.departure_airport_code,
			arrival_airport_code: options.arrival_airport_code,
			departure_date: options.departure_date,
			class_code:
				options.class_code ||
				userPreferences.preferred_class ||
				'ECONOMY',

			// AI-enhanced criteria
			preferred_airlines: userPreferences.preferred_airlines,
			preferred_routes: userPreferences.preferred_routes,
			preferred_times: userPreferences.preferred_times,
			booked_airlines: bookingPatterns.booked_airlines,
			booked_routes: bookingPatterns.booked_routes,

			// Scoring weights
			weights: {
				airline_preference: 0.3,
				route_preference: 0.25,
				time_preference: 0.2,
				price_competitiveness: 0.15,
				availability: 0.1,
			},
		};

		return criteria;
	}

	/**
	 * Find flights matching recommendation criteria
	 * @param {Object} criteria - Recommendation criteria
	 * @param {number} limit - Number of results
	 * @returns {Promise<Array>} Matching flights
	 */
	async findRecommendedFlights(criteria, limit) {
		try {
			// Find airports
			const departureAirport = await Airport.findOne({
				where: { airport_code: criteria.departure_airport_code },
			});
			const arrivalAirport = await Airport.findOne({
				where: { airport_code: criteria.arrival_airport_code },
			});

			if (!departureAirport || !arrivalAirport) {
				throw new NotFoundError('Airport not found');
			}

			// Find travel class
			const travelClass = await TravelClass.findOne({
				where: { class_code: criteria.class_code },
			});

			if (!travelClass) {
				throw new NotFoundError('Travel class not found');
			}

			// Build search conditions
			const whereClause = {
				departure_airport_id: departureAirport.airport_id,
				arrival_airport_id: arrivalAirport.airport_id,
				status: 'scheduled',
				departure_time: {
					[Op.gte]: new Date(criteria.departure_date),
					[Op.lt]: new Date(
						new Date(criteria.departure_date).getTime() +
							24 * 60 * 60 * 1000
					),
				},
			};

			// Add airline preference if available
			if (
				criteria.preferred_airlines &&
				criteria.preferred_airlines.length > 0
			) {
				whereClause.airline_id = {
					[Op.in]: criteria.preferred_airlines,
				};
			}

			// Find flights
			const flights = await Flight.findAll({
				where: whereClause,
				include: [
					{
						model: Airline,
						attributes: [
							'airline_id',
							'airline_name',
							'airline_code',
							'logo_url',
						],
					},
					{
						model: Aircraft,
						attributes: ['aircraft_id', 'model', 'total_seats'],
					},
					{
						model: Airport,
						as: 'DepartureAirport',
						attributes: [
							'airport_id',
							'airport_code',
							'airport_name',
							'city',
						],
					},
					{
						model: Airport,
						as: 'ArrivalAirport',
						attributes: [
							'airport_id',
							'airport_code',
							'airport_name',
							'city',
						],
					},
					{
						model: FlightSeat,
						where: {
							class_id: travelClass.class_id,
							is_available: true,
						},
						attributes: ['seat_id', 'seat_number', 'price'],
						required: true,
					},
				],
				order: [['departure_time', 'ASC']],
				limit: limit * 2, // Get more results for better scoring
			});

			return flights;
		} catch (error) {
			logger.error('Error finding recommended flights:', error);
			throw error;
		}
	}

	/**
	 * Score recommendations based on user preferences
	 * @param {Array} flights - Flights to score
	 * @param {Object} userPreferences - User preferences
	 * @param {Object} bookingPatterns - Booking patterns
	 * @returns {Promise<Array>} Scored recommendations
	 */
	async scoreRecommendations(flights, userPreferences, bookingPatterns) {
		try {
			const scoredFlights = [];

			for (const flight of flights) {
				// Validate flight object
				if (!flight || !flight.flight_id || !flight.flight_number) {
					logger.warn(
						'Invalid flight object in scoreRecommendations:',
						flight
					);
					continue;
				}

				let score = 0;
				const reasons = [];

				// Airline preference score
				if (
					flight.airline_id &&
					userPreferences.preferred_airlines &&
					userPreferences.preferred_airlines.includes(
						flight.airline_id
					)
				) {
					score += 30;
					reasons.push('Matches your preferred airline');
				}

				// Time preference score
				if (flight.departure_time && userPreferences.preferred_times) {
					const departureHour = new Date(
						flight.departure_time
					).getHours();
					if (
						userPreferences.preferred_times.includes(departureHour)
					) {
						score += 20;
						reasons.push('Matches your preferred departure time');
					}
				}

				// Price competitiveness score
				const availableSeats = flight.FlightSeats
					? flight.FlightSeats.filter((seat) => seat.is_available)
					: [];
				if (availableSeats.length > 0) {
					const minPrice = Math.min(
						...availableSeats.map((seat) => parseFloat(seat.price))
					);
					// Simple price scoring (can be enhanced with market data)
					if (minPrice < 500) {
						score += 15;
						reasons.push('Great price');
					} else if (minPrice < 800) {
						score += 10;
						reasons.push('Good price');
					}
				}

				// Availability score
				if (availableSeats.length > 5) {
					score += 10;
					reasons.push('Good seat availability');
				}

				// Route popularity score (based on booking patterns)
				if (
					bookingPatterns.booked_routes &&
					bookingPatterns.booked_routes.some(
						(route) =>
							route.departure_airport_id ===
								flight.departure_airport_id &&
							route.arrival_airport_id ===
								flight.arrival_airport_id
					)
				) {
					score += 15;
					reasons.push("Popular route you've booked before");
				}

				// Format flight data
				const formattedFlight = {
					flight_id: flight.flight_id,
					flight_number: flight.flight_number,
					airline: {
						id: flight.Airline?.airline_id || null,
						name: flight.Airline?.airline_name || 'Unknown',
						code: flight.Airline?.airline_code || 'XX',
						logo_url: flight.Airline?.logo_url || null,
					},
					aircraft: {
						id: flight.Aircraft?.aircraft_id || null,
						model: flight.Aircraft?.model || 'Unknown',
						total_seats: flight.Aircraft?.total_seats || 0,
					},
					departure: {
						airport: {
							id: flight.DepartureAirport?.airport_id || null,
							code:
								flight.DepartureAirport?.airport_code || 'XXX',
							name:
								flight.DepartureAirport?.airport_name ||
								'Unknown',
							city: flight.DepartureAirport?.city || 'Unknown',
						},
						time: flight.departure_time,
					},
					arrival: {
						airport: {
							id: flight.ArrivalAirport?.airport_id || null,
							code: flight.ArrivalAirport?.airport_code || 'XXX',
							name:
								flight.ArrivalAirport?.airport_name ||
								'Unknown',
							city: flight.ArrivalAirport?.city || 'Unknown',
						},
						time: flight.arrival_time,
					},
					duration: this.calculateDuration(
						flight.departure_time,
						flight.arrival_time
					),
					status: flight.status,
					available_seats: availableSeats.length,
					starting_price:
						availableSeats.length > 0
							? Math.min(
									...availableSeats.map((seat) =>
										parseFloat(seat.price || 0)
									)
							  )
							: null,
					recommendation_score: score,
					recommendation_reasons: reasons,
				};

				scoredFlights.push(formattedFlight);
			}

			// Sort by recommendation score (highest first)
			return scoredFlights.sort(
				(a, b) => b.recommendation_score - a.recommendation_score
			);
		} catch (error) {
			logger.error('Error scoring recommendations:', error);
			throw error;
		}
	}

	/**
	 * Save recommendations to database
	 * @param {number} userId - User ID
	 * @param {Array} recommendations - Scored recommendations
	 */
	async saveRecommendations(userId, recommendations) {
		try {
			// Clear old recommendations for this user
			await FlightRecommendation.destroy({
				where: { user_id: userId },
			});

			// Save new recommendations
			const recommendationData = recommendations
				.slice(0, 10)
				.map((rec) => ({
					user_id: userId,
					flight_id: rec.flight_id,
					recommendation_score: rec.recommendation_score,
					recommendation_reason:
						rec.recommendation_reasons.join('; '),
				}));

			await FlightRecommendation.bulkCreate(recommendationData);
		} catch (error) {
			logger.error('Error saving recommendations:', error);
			// Don't throw error here as it's not critical
		}
	}

	/**
	 * Track user search for AI learning
	 * @param {number} userId - User ID
	 * @param {Object} searchParams - Search parameters
	 */
	async trackUserSearch(userId, searchParams) {
		try {
			const {
				departure_airport_code,
				arrival_airport_code,
				departure_date,
				return_date,
				passengers,
				class_code,
			} = searchParams;

			// Find airports
			const departureAirport = await Airport.findOne({
				where: { airport_code: departure_airport_code },
			});
			const arrivalAirport = await Airport.findOne({
				where: { airport_code: arrival_airport_code },
			});

			// Find travel class
			const travelClass = await TravelClass.findOne({
				where: { class_code },
			});

			// Save search history
			await UserSearchHistory.create({
				user_id: userId,
				departure_airport_id: departureAirport?.airport_id,
				arrival_airport_id: arrivalAirport?.airport_id,
				departure_date: departure_date,
				return_date: return_date,
				passengers: passengers,
				travel_class_id: travelClass?.class_id,
			});

			logger.info('User search tracked successfully', {
				userId,
				searchParams,
			});
		} catch (error) {
			logger.error('Error tracking user search:', error);
			// Don't throw error here as it's not critical
		}
	}

	/**
	 * Get AI booking assistant suggestions
	 * @param {number} userId - User ID
	 * @param {Object} bookingContext - Booking context
	 * @returns {Promise<Object>} Booking suggestions
	 */
	async getBookingAssistantSuggestions(userId, bookingContext) {
		try {
			const { flight_id, passengers, class_code } = bookingContext;

			// Get flight details
			const flight = await Flight.findByPk(flight_id, {
				include: [
					{
						model: Airline,
						attributes: [
							'airline_id',
							'airline_name',
							'airline_code',
						],
					},
					{
						model: Airport,
						as: 'DepartureAirport',
						attributes: ['airport_id', 'airport_code', 'city'],
					},
					{
						model: Airport,
						as: 'ArrivalAirport',
						attributes: ['airport_id', 'airport_code', 'city'],
					},
				],
			});

			if (!flight) {
				throw new NotFoundError('Flight not found');
			}

			// Get user preferences
			const userPreferences = await this.analyzeUserPreferences(userId);

			// Generate suggestions
			const suggestions = {
				seat_recommendations: await this.getSeatRecommendations(
					flight_id,
					class_code,
					userPreferences
				),
				baggage_suggestions: await this.getBaggageSuggestions(
					flight.airline_id,
					passengers
				),
				meal_suggestions: await this.getMealSuggestions(
					flight.airline_id,
					userPreferences
				),
				insurance_suggestion: this.getInsuranceSuggestion(
					flight,
					passengers
				),
				check_in_reminder: this.getCheckInReminder(
					flight.departure_time
				),
			};

			return suggestions;
		} catch (error) {
			logger.error('Error getting booking assistant suggestions:', error);
			throw error;
		}
	}

	// Helper methods for preference analysis
	extractPreferredAirlines(searchHistory) {
		const airlineCounts = {};
		searchHistory.forEach((search) => {
			// This would need to be enhanced to track airline preferences from search results
			// For now, return empty array
		});
		return Object.keys(airlineCounts).slice(0, 3);
	}

	extractPreferredRoutes(searchHistory) {
		const routeCounts = {};
		searchHistory.forEach((search) => {
			if (search.departure_airport_id && search.arrival_airport_id) {
				const route = `${search.departure_airport_id}-${search.arrival_airport_id}`;
				routeCounts[route] = (routeCounts[route] || 0) + 1;
			}
		});
		return Object.keys(routeCounts).slice(0, 5);
	}

	extractPreferredTimes(searchHistory) {
		const timeCounts = {};
		searchHistory.forEach((search) => {
			if (search.departure_date) {
				// This would need to be enhanced to track time preferences
				// For now, return common business hours
			}
		});
		return [8, 9, 10, 14, 15, 16]; // Common business hours
	}

	extractPreferredClass(searchHistory) {
		const classCounts = {};
		searchHistory.forEach((search) => {
			if (search.travel_class_id) {
				classCounts[search.travel_class_id] =
					(classCounts[search.travel_class_id] || 0) + 1;
			}
		});
		const mostFrequent = Object.keys(classCounts).reduce(
			(a, b) => (classCounts[a] > classCounts[b] ? a : b),
			'1'
		);
		return mostFrequent === '1' ? 'ECONOMY' : 'BUSINESS';
	}

	extractPreferredPassengers(searchHistory) {
		const passengerCounts = {};
		searchHistory.forEach((search) => {
			if (search.passengers) {
				passengerCounts[search.passengers] =
					(passengerCounts[search.passengers] || 0) + 1;
			}
		});
		return Object.keys(passengerCounts).reduce(
			(a, b) => (passengerCounts[a] > passengerCounts[b] ? a : b),
			'1'
		);
	}

	extractBookedAirlines(bookings) {
		const airlines = new Set();
		bookings.forEach((booking) => {
			booking.BookingDetails.forEach((detail) => {
				airlines.add(detail.Flight.airline_id);
			});
		});
		return Array.from(airlines);
	}

	extractBookedRoutes(bookings) {
		const routes = [];
		bookings.forEach((booking) => {
			booking.BookingDetails.forEach((detail) => {
				routes.push({
					departure_airport_id: detail.Flight.departure_airport_id,
					arrival_airport_id: detail.Flight.arrival_airport_id,
				});
			});
		});
		return routes;
	}

	extractBookedTimes(bookings) {
		const times = [];
		bookings.forEach((booking) => {
			booking.BookingDetails.forEach((detail) => {
				const hour = new Date(detail.Flight.departure_time).getHours();
				times.push(hour);
			});
		});
		return times;
	}

	extractBookedClasses(bookings) {
		const classes = new Set();
		bookings.forEach((booking) => {
			booking.BookingDetails.forEach((detail) => {
				classes.add(detail.FlightSeat.class_id);
			});
		});
		return Array.from(classes);
	}

	calculateAverageBookingAdvance(bookings) {
		if (bookings.length === 0) return 0;

		const totalAdvance = bookings.reduce((sum, booking) => {
			const bookingDate = new Date(booking.booking_date);
			const flightDate = new Date(
				booking.BookingDetails[0]?.Flight?.departure_time
			);
			if (flightDate) {
				const advanceDays =
					(flightDate - bookingDate) / (1000 * 60 * 60 * 24);
				return sum + advanceDays;
			}
			return sum;
		}, 0);

		return totalAdvance / bookings.length;
	}

	// Helper methods for booking assistant
	async getSeatRecommendations(flightId, classCode, userPreferences) {
		// This would implement seat recommendation logic
		return {
			recommended_seats: ['A1', 'B1', 'C1'],
			reason: 'Window seats with extra legroom',
		};
	}

	async getBaggageSuggestions(airlineId, passengers) {
		// This would implement baggage suggestion logic
		return {
			recommended_baggage: '20kg checked baggage',
			reason: 'Based on your travel history',
		};
	}

	async getMealSuggestions(airlineId, userPreferences) {
		// This would implement meal suggestion logic
		return {
			recommended_meals: ['Vegetarian', 'Halal'],
			reason: 'Based on your preferences',
		};
	}

	getInsuranceSuggestion(flight, passengers) {
		const flightValue = passengers * 500; // Estimated flight value
		return {
			recommended: flightValue > 1000,
			reason: 'Travel insurance recommended for high-value bookings',
		};
	}

	getCheckInReminder(departureTime) {
		const checkInTime = new Date(departureTime);
		checkInTime.setHours(checkInTime.getHours() - 24);

		return {
			check_in_time: checkInTime,
			reminder_message: 'Check-in opens 24 hours before departure',
		};
	}

	/**
	 * Get user's search history with pagination
	 * @param {number} userId - User ID
	 * @param {number} page - Page number
	 * @param {number} limit - Records per page
	 * @returns {Promise<Object>} Search history with pagination
	 */
	async getUserSearchHistory(userId, page = 1, limit = 10) {
		try {
			const offset = (page - 1) * limit;

			const { count, rows } = await UserSearchHistory.findAndCountAll({
				where: { user_id: userId },
				include: [
					{
						model: Airport,
						as: 'DepartureAirport',
						attributes: [
							'airport_id',
							'airport_code',
							'airport_name',
							'city',
						],
					},
					{
						model: Airport,
						as: 'ArrivalAirport',
						attributes: [
							'airport_id',
							'airport_code',
							'airport_name',
							'city',
						],
					},
					{
						model: TravelClass,
						attributes: ['class_id', 'class_name', 'class_code'],
					},
				],
				order: [['search_timestamp', 'DESC']],
				limit: parseInt(limit),
				offset: parseInt(offset),
			});

			const totalPages = Math.ceil(count / limit);

			return {
				data: rows,
				pagination: {
					currentPage: parseInt(page),
					totalPages,
					totalItems: count,
					itemsPerPage: parseInt(limit),
					hasNextPage: page < totalPages,
					hasPrevPage: page > 1,
				},
			};
		} catch (error) {
			logger.error('Error getting user search history:', error);
			throw error;
		}
	}

	/**
	 * Get user's recommendations history with pagination
	 * @param {number} userId - User ID
	 * @param {number} page - Page number
	 * @param {number} limit - Records per page
	 * @returns {Promise<Object>} Recommendations history with pagination
	 */
	async getUserRecommendationsHistory(userId, page = 1, limit = 10) {
		try {
			const offset = (page - 1) * limit;

			const { count, rows } = await FlightRecommendation.findAndCountAll({
				where: { user_id: userId },
				include: [
					{
						model: Flight,
						include: [
							{
								model: Airline,
								attributes: [
									'airline_id',
									'airline_name',
									'airline_code',
								],
							},
							{
								model: Airport,
								as: 'DepartureAirport',
								attributes: [
									'airport_id',
									'airport_code',
									'airport_name',
									'city',
								],
							},
							{
								model: Airport,
								as: 'ArrivalAirport',
								attributes: [
									'airport_id',
									'airport_code',
									'airport_name',
									'city',
								],
							},
						],
					},
				],
				order: [['created_at', 'DESC']],
				limit: parseInt(limit),
				offset: parseInt(offset),
			});

			const totalPages = Math.ceil(count / limit);

			return {
				data: rows,
				pagination: {
					currentPage: parseInt(page),
					totalPages,
					totalItems: count,
					itemsPerPage: parseInt(limit),
					hasNextPage: page < totalPages,
					hasPrevPage: page > 1,
				},
			};
		} catch (error) {
			logger.error('Error getting user recommendations history:', error);
			throw error;
		}
	}

	/**
	 * Get AI insights about user preferences
	 * @param {number} userId - User ID
	 * @returns {Promise<Object>} AI insights
	 */
	async getUserAIInsights(userId) {
		try {
			const userPreferences = await this.analyzeUserPreferences(userId);
			const bookingPatterns = await this.analyzeBookingPatterns(userId);

			const insights = {
				preferences: userPreferences,
				patterns: bookingPatterns,
				insights: {
					most_searched_routes:
						this.getMostSearchedRoutes(userPreferences),
					preferred_booking_advance:
						bookingPatterns.average_booking_advance,
					search_frequency: userPreferences.search_frequency,
					booking_frequency: bookingPatterns.booking_frequency,
					preferred_travel_times:
						this.getPreferredTravelTimes(userPreferences),
					airline_loyalty:
						this.calculateAirlineLoyalty(bookingPatterns),
				},
				generated_at: new Date().toISOString(),
			};

			return insights;
		} catch (error) {
			logger.error('Error getting user AI insights:', error);
			throw error;
		}
	}

	/**
	 * Get user travel preferences
	 * @param {number} userId - User ID
	 * @param {number} days - Number of days to look back
	 * @returns {Promise<Object>} User preferences
	 */
	async getUserPreferences(userId, days = 30) {
		try {
			const preferences = await this.analyzeUserPreferences(userId, days);

			return {
				preferred_class: preferences.preferred_class || 'ECONOMY',
				preferred_airlines: preferences.preferred_airlines || [],
				preferred_routes: preferences.preferred_routes || [],
				travel_frequency: preferences.search_frequency || 'Unknown',
				preferred_times: preferences.preferred_times || [],
				analysis_period: `${days} days`,
				generated_at: new Date().toISOString(),
			};
		} catch (error) {
			logger.error('Error getting user preferences:', error);
			throw error;
		}
	}

	/**
	 * Get user travel patterns
	 * @param {number} userId - User ID
	 * @param {number} days - Number of days to look back
	 * @returns {Promise<Object>} User patterns
	 */
	async getUserPatterns(userId, days = 30) {
		try {
			const patterns = await this.analyzeBookingPatterns(userId, days);
			const searchHistory = await this.getUserSearchHistory(
				userId,
				1,
				100
			);

			// Analyze popular routes from search history
			const routeCounts = {};
			searchHistory.data.forEach((search) => {
				const route = `${search.DepartureAirport?.airport_code} → ${search.ArrivalAirport?.airport_code}`;
				routeCounts[route] = (routeCounts[route] || 0) + 1;
			});

			const popularRoutes = Object.entries(routeCounts)
				.sort(([, a], [, b]) => b - a)
				.slice(0, 5)
				.map(([route, count]) => ({ route, count }));

			return {
				popular_routes: popularRoutes,
				booking_patterns:
					patterns.booking_frequency || 'No patterns detected',
				average_booking_advance:
					patterns.average_booking_advance || 'Unknown',
				preferred_booking_days: patterns.preferred_booking_days || [],
				analysis_period: `${days} days`,
				generated_at: new Date().toISOString(),
			};
		} catch (error) {
			logger.error('Error getting user patterns:', error);
			throw error;
		}
	}

	/**
	 * Get user search history insights
	 * @param {number} userId - User ID
	 * @param {number} days - Number of days to look back
	 * @returns {Promise<Object>} Search history insights
	 */
	async getUserSearchHistoryInsights(userId, days = 30) {
		try {
			const searchHistory = await this.getUserSearchHistory(
				userId,
				1,
				100
			);
			const cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - days);

			// Filter recent searches
			const recentSearches = searchHistory.data.filter(
				(search) => new Date(search.search_timestamp) >= cutoffDate
			);

			// Get recent search routes
			const recentRoutes = recentSearches.slice(0, 10).map((search) => ({
				route: `${search.DepartureAirport?.airport_code} → ${search.ArrivalAirport?.airport_code}`,
				date: search.search_timestamp,
			}));

			return {
				total_searches: recentSearches.length,
				recent_searches: recentRoutes,
				most_searched_routes:
					this.getMostSearchedRoutesFromHistory(recentSearches),
				search_frequency: this.calculateSearchFrequency(recentSearches),
				analysis_period: `${days} days`,
				generated_at: new Date().toISOString(),
			};
		} catch (error) {
			logger.error('Error getting user search history insights:', error);
			throw error;
		}
	}

	/**
	 * Get search suggestions based on user history
	 * @param {number} userId - User ID
	 * @param {string} query - Search query
	 * @param {number} limit - Number of suggestions
	 * @returns {Promise<Array>} Search suggestions
	 */
	async getSearchSuggestions(userId, query, limit = 5) {
		try {
			// Get user's recent search history
			const recentSearches = await UserSearchHistory.findAll({
				where: {
					user_id: userId,
					search_timestamp: {
						[Op.gte]: new Date(
							Date.now() - 30 * 24 * 60 * 60 * 1000
						), // Last 30 days
					},
				},
				include: [
					{
						model: Airport,
						as: 'DepartureAirport',
						attributes: [
							'airport_id',
							'airport_code',
							'airport_name',
							'city',
						],
					},
					{
						model: Airport,
						as: 'ArrivalAirport',
						attributes: [
							'airport_id',
							'airport_code',
							'airport_name',
							'city',
						],
					},
				],
				order: [['search_timestamp', 'DESC']],
				limit: 20,
			});

			// Generate suggestions based on query and history
			const suggestions = [];
			const queryLower = query.toLowerCase();

			// Add airport suggestions
			const airports = await Airport.findAll({
				where: {
					[Op.or]: [
						{ airport_code: { [Op.like]: `%${query}%` } },
						{ airport_name: { [Op.like]: `%${query}%` } },
						{ city: { [Op.like]: `%${query}%` } },
					],
				},
				limit: limit,
			});

			airports.forEach((airport) => {
				suggestions.push({
					type: 'airport',
					code: airport.airport_code,
					name: airport.airport_name,
					city: airport.city,
					relevance_score: this.calculateRelevanceScore(
						query,
						airport
					),
				});
			});

			// Add route suggestions from user history
			recentSearches.forEach((search) => {
				if (search.DepartureAirport && search.ArrivalAirport) {
					const departureMatch = this.matchesQuery(
						query,
						search.DepartureAirport
					);
					const arrivalMatch = this.matchesQuery(
						query,
						search.ArrivalAirport
					);

					if (departureMatch || arrivalMatch) {
						suggestions.push({
							type: 'route',
							departure: {
								code: search.DepartureAirport.airport_code,
								name: search.DepartureAirport.airport_name,
								city: search.DepartureAirport.city,
							},
							arrival: {
								code: search.ArrivalAirport.airport_code,
								name: search.ArrivalAirport.airport_name,
								city: search.ArrivalAirport.city,
							},
							relevance_score: this.calculateRouteRelevanceScore(
								query,
								search
							),
						});
					}
				}
			});

			// Sort by relevance score and return top results
			return suggestions
				.sort((a, b) => b.relevance_score - a.relevance_score)
				.slice(0, limit);
		} catch (error) {
			logger.error('Error getting search suggestions:', error);
			throw error;
		}
	}

	/**
	 * Clear user's AI data (for privacy/GDPR compliance)
	 * @param {number} userId - User ID
	 */
	async clearUserAIData(userId) {
		try {
			// Clear search history
			await UserSearchHistory.destroy({
				where: { user_id: userId },
			});

			// Clear recommendations
			await FlightRecommendation.destroy({
				where: { user_id: userId },
			});

			logger.info('User AI data cleared successfully', { userId });
		} catch (error) {
			logger.error('Error clearing user AI data:', error);
			throw error;
		}
	}

	// Helper methods for insights
	getMostSearchedRoutes(preferences) {
		return preferences.preferred_routes.slice(0, 3);
	}

	getPreferredTravelTimes(preferences) {
		return preferences.preferred_times.slice(0, 5);
	}

	calculateAirlineLoyalty(bookingPatterns) {
		if (bookingPatterns.booked_airlines.length === 0) return 0;

		const totalBookings = bookingPatterns.booking_frequency;
		const uniqueAirlines = bookingPatterns.booked_airlines.length;

		// Higher loyalty = fewer unique airlines for same number of bookings
		return Math.round((1 - (uniqueAirlines - 1) / totalBookings) * 100);
	}

	calculateRelevanceScore(query, airport) {
		const queryLower = query.toLowerCase();
		let score = 0;

		if (airport.airport_code.toLowerCase().includes(queryLower))
			score += 10;
		if (airport.airport_name.toLowerCase().includes(queryLower)) score += 8;
		if (airport.city.toLowerCase().includes(queryLower)) score += 6;

		return score;
	}

	calculateRouteRelevanceScore(query, search) {
		const queryLower = query.toLowerCase();
		let score = 0;

		if (
			search.DepartureAirport.airport_code
				.toLowerCase()
				.includes(queryLower)
		)
			score += 5;
		if (search.DepartureAirport.city.toLowerCase().includes(queryLower))
			score += 3;
		if (
			search.ArrivalAirport.airport_code
				.toLowerCase()
				.includes(queryLower)
		)
			score += 5;
		if (search.ArrivalAirport.city.toLowerCase().includes(queryLower))
			score += 3;

		return score;
	}

	matchesQuery(query, airport) {
		const queryLower = query.toLowerCase();
		return (
			airport.airport_code.toLowerCase().includes(queryLower) ||
			airport.airport_name.toLowerCase().includes(queryLower) ||
			airport.city.toLowerCase().includes(queryLower)
		);
	}

	/**
	 * Calculate flight duration
	 * @param {Date} departureTime - Departure time
	 * @param {Date} arrivalTime - Arrival time
	 * @returns {string} Duration in HH:MM format
	 */
	calculateDuration(departureTime, arrivalTime) {
		const durationMs = new Date(arrivalTime) - new Date(departureTime);
		const hours = Math.floor(durationMs / (1000 * 60 * 60));
		const minutes = Math.floor(
			(durationMs % (1000 * 60 * 60)) / (1000 * 60)
		);
		return `${hours.toString().padStart(2, '0')}:${minutes
			.toString()
			.padStart(2, '0')}`;
	}

	/**
	 * Get most searched routes from search history
	 * @param {Array} searches - Array of search history
	 * @returns {Array} Most searched routes
	 */
	getMostSearchedRoutesFromHistory(searches) {
		const routeCounts = {};
		searches.forEach((search) => {
			const route = `${search.DepartureAirport?.airport_code} → ${search.ArrivalAirport?.airport_code}`;
			routeCounts[route] = (routeCounts[route] || 0) + 1;
		});

		return Object.entries(routeCounts)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 5)
			.map(([route, count]) => ({ route, count }));
	}

	/**
	 * Calculate search frequency
	 * @param {Array} searches - Array of search history
	 * @returns {string} Search frequency description
	 */
	calculateSearchFrequency(searches) {
		const count = searches.length;
		if (count === 0) return 'No searches';
		if (count <= 5) return 'Low frequency';
		if (count <= 15) return 'Medium frequency';
		return 'High frequency';
	}
}

module.exports = new AIRecommendationService();
