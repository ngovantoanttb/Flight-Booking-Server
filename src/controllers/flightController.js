/**
 * Flight Controller
 * Handles HTTP requests for flight-related operations
 */

const flightService = require('../services/flightService');
const { Flight, Airline } = require('../models');
const aiRecommendationService = require('../services/aiRecommendationService');
const {
	sendSuccess,
	sendNotFound,
	sendError,
	sendPaginated,
} = require('../utils/response');
const { BadRequestError } = require('../utils/errors');
const logger = require('../utils/logger');

class FlightController {
	/**
	 * Search available flights
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async searchFlights(req, res, next) {
		try {
			const searchParams = {
				departure_airport_code: req.query.departure_airport_code,
				arrival_airport_code: req.query.arrival_airport_code,
				departure_date: req.query.departure_date,
				passengers: req.query.passengers
					? parseInt(req.query.passengers)
					: undefined,
				class_code: req.query.class_code
					? req.query.class_code
					: undefined,
				flight_type: req.query.flight_type, // 'domestic' or 'international' or 'nội địa' or 'quốc tế'
				min_price: req.query.min_price
					? parseFloat(req.query.min_price)
					: null,
				max_price: req.query.max_price
					? parseFloat(req.query.max_price)
					: null,
				page: parseInt(req.query.page) || 1,
				limit: parseInt(req.query.limit) || 10,
			};

			// Normalize and validate optional parameters
			if (
				searchParams.departure_date &&
				isNaN(Date.parse(searchParams.departure_date))
			) {
				return sendError(
					res,
					'Invalid departure_date format. Use YYYY-MM-DD'
				);
			}

			if (searchParams.passengers !== undefined) {
				if (
					isNaN(searchParams.passengers) ||
					searchParams.passengers < 1 ||
					searchParams.passengers > 9
				) {
					return sendError(
						res,
						'Passengers count must be between 1 and 9'
					);
				}
			}

			if (searchParams.class_code) {
				// Accept common variants (ECONOMY, economy, BUSINESS, business)
				const cc = String(searchParams.class_code).toUpperCase();
				if (cc !== 'ECONOMY' && cc !== 'BUSINESS') {
					return sendError(
						res,
						'Class code must be ECONOMY or BUSINESS'
					);
				}
				searchParams.class_code = cc;
			}

			const result = await flightService.searchAvailableFlights(
				// instruct service to exclude flights that have already departed
				{ ...searchParams, exclude_past: true }
			);

			// Track user search for AI learning (if user is authenticated)
			if (req.user && req.user.user_id) {
				try {
					await aiRecommendationService.trackUserSearch(
						req.user.user_id,
						{
							departure_airport_code:
								searchParams.departure_airport_code,
							arrival_airport_code:
								searchParams.arrival_airport_code,
							departure_date: searchParams.departure_date,
							passengers: searchParams.passengers,
							class_code: searchParams.class_code,
						}
					);
				} catch (trackingError) {
					// Don't fail the main request if tracking fails
					logger.warn('Failed to track user search:', trackingError);
				}
			}

			return sendPaginated(
				res,
				'Flights found successfully',
				result.flights,
				result.pagination
			);
		} catch (error) {
			logger.error('Error in searchFlights controller:', error);
			next(error);
		}
	}

	/**
	 * Get flight details by ID
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async getFlightDetails(req, res, next) {
		try {
			const { flightId } = req.params;

			// Validate flight ID
			if (!flightId || isNaN(parseInt(flightId))) {
				return sendError(res, 'Invalid flight ID');
			}

			const flightDetails = await flightService.getFlightDetails(
				parseInt(flightId)
			);

			return sendSuccess(
				res,
				'Flight details retrieved successfully',
				flightDetails
			);
		} catch (error) {
			logger.error('Error in getFlightDetails controller:', error);
			next(error);
		}
	}

	/**
	 * Get flight services (baggage, meals)
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async getFlightServices(req, res, next) {
		try {
			const { flightId } = req.params;

			// Validate flight ID
			if (!flightId || isNaN(parseInt(flightId))) {
				return sendError(res, 'Invalid flight ID');
			}

			const services = await flightService.getFlightServices(
				parseInt(flightId)
			);

			return sendSuccess(
				res,
				'Flight services retrieved successfully',
				services
			);
		} catch (error) {
			logger.error('Error in getFlightServices controller:', error);
			next(error);
		}
	}

	/**
	 * Get available seats for a flight
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async getAvailableSeats(req, res, next) {
		try {
			const { flightId } = req.params;
			const { class_id } = req.query;

			// Validate flight ID
			if (!flightId || isNaN(parseInt(flightId))) {
				return sendError(res, 'Invalid flight ID');
			}

			// Validate class ID
			if (!class_id || isNaN(parseInt(class_id))) {
				return sendError(res, 'Invalid class_id parameter');
			}

			const seats = await flightService.getAvailableSeats(
				parseInt(flightId),
				parseInt(class_id)
			);

			return sendSuccess(
				res,
				'Available seats retrieved successfully',
				seats
			);
		} catch (error) {
			logger.error('Error in getAvailableSeats controller:', error);
			next(error);
		}
	}

	/**
	 * Get seat availability summary for a flight (simplified view)
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async getSeatAvailabilitySummary(req, res, next) {
		try {
			const { flightId } = req.params;

			// Validate flight ID
			if (!flightId || isNaN(parseInt(flightId))) {
				return sendError(res, 'Invalid flight ID');
			}

			const seatAllocationService = require('../services/seatAllocationService');
			const seatSummary =
				await seatAllocationService.getFlightSeatSummary(
					parseInt(flightId)
				);

			return sendSuccess(
				res,
				'Seat availability summary retrieved successfully',
				seatSummary
			);
		} catch (error) {
			logger.error(
				'Error in getSeatAvailabilitySummary controller:',
				error
			);
			next(error);
		}
	}

	/**
	 * Get all flights for users (public access with pagination)
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async getAllFlightsForUsers(req, res, next) {
		try {
			const page = parseInt(req.query.page) || 1;
			const limit = parseInt(req.query.limit) || 10;
			let {
				status,
				airline_id,
				departure_airport_code,
				arrival_airport_code,
				departure_date,
				flight_type, // 'domestic' or 'international' or 'nội địa' or 'quốc tế'
				min_price,
				max_price,
			} = req.query;

			// Build search filters
			const filters = {};
			if (airline_id) filters.airline_id = parseInt(airline_id);
			// For status: if user explicit set, filter by it. If not, return all status except 'cancelled'
			if (status) {
				filters.status = status;
			} else {
				filters.status = { [require('sequelize').Op.ne]: 'cancelled' };
			}
			// Add date filter if provided
			if (departure_date) {
				const startDate = new Date(departure_date);
				const endDate = new Date(departure_date);
				endDate.setDate(endDate.getDate() + 1);
				filters.departure_time = {
					[require('sequelize').Op.gte]: startDate,
					[require('sequelize').Op.lt]: endDate,
				};
			}
			// Add airport filters
			if (departure_airport_code)
				filters['$DepartureAirport.airport_code$'] =
					departure_airport_code;
			if (arrival_airport_code)
				filters['$ArrivalAirport.airport_code$'] = arrival_airport_code;

			// Normalize flight_type to persisted enum and store price filters
			if (flight_type) {
				const normalize = (s) =>
					String(s)
						.toLowerCase()
						.normalize('NFD')
						.replace(/[\u0300-\u036f]/g, '')
						.trim();
				const ft = normalize(flight_type);
				if (
					ft === 'domestic' ||
					ft === 'noi dia' ||
					ft.startsWith('dom')
				) {
					flight_type = 'domestic';
				} else if (
					ft === 'international' ||
					ft === 'quoc te' ||
					ft.startsWith('int')
				) {
					flight_type = 'international';
				} else {
					// pass-through unknown values (may result in no matches)
					flight_type = ft;
				}
				filters.flight_type = flight_type;
			}

			const minPriceFilter = min_price ? parseFloat(min_price) : null;
			const maxPriceFilter = max_price ? parseFloat(max_price) : null;

			const result = await require('../models').Flight.findAndCountAll({
				where: filters,
				include: [
					{
						model: require('../models').Airline,
						attributes: [
							'airline_id',
							'airline_name',
							'airline_code',
							'logo_url',
						],
					},
					{
						model: require('../models').Aircraft,
						attributes: ['aircraft_id', 'model', 'total_seats'],
					},
					{
						model: require('../models').Airport,
						as: 'DepartureAirport',
						attributes: [
							'airport_id',
							'airport_code',
							'airport_name',
							'city',
							'country_id',
						],
						include: [
							{
								model: require('../models').Country,
								attributes: [
									'country_id',
									'country_name',
									'country_code',
								],
							},
						],
					},
					{
						model: require('../models').Airport,
						as: 'ArrivalAirport',
						attributes: [
							'airport_id',
							'airport_code',
							'airport_name',
							'city',
							'country_id',
						],
						include: [
							{
								model: require('../models').Country,
								attributes: [
									'country_id',
									'country_name',
									'country_code',
								],
							},
						],
					},
				],
				order: [['departure_time', 'ASC']],
			});

			// Use persisted `flight_type` already set in `filters` for SQL filtering.
			let filteredRows = result.rows;

			// Apply price filters if specified
			if (minPriceFilter !== null || maxPriceFilter !== null) {
				filteredRows = filteredRows.filter((flight) => {
					const economyPrice = parseFloat(flight.economy_price || 0);
					const businessPrice = parseFloat(
						flight.business_price || 0
					);
					// Use the lower price (economy) for filtering
					const priceToCheck =
						economyPrice > 0 ? economyPrice : businessPrice;

					if (
						minPriceFilter !== null &&
						priceToCheck < minPriceFilter
					) {
						return false;
					}
					if (
						maxPriceFilter !== null &&
						priceToCheck > maxPriceFilter
					) {
						return false;
					}
					return true;
				});
			}

			// Apply pagination after filtering
			const startIndex = (page - 1) * limit;
			const endIndex = startIndex + limit;
			const paginatedRows = filteredRows.slice(startIndex, endIndex);

			const formattedFlights = paginatedRows.map((flight) => ({
				flight_id: flight.flight_id,
				flight_number: flight.flight_number,
				economy_price: parseFloat(flight.economy_price || 0),
				business_price: parseFloat(flight.business_price || 0),
				airline: {
					id: flight.Airline.airline_id,
					name: flight.Airline.airline_name,
					code: flight.Airline.airline_code,
					logo_url: flight.Airline.logo_url,
				},
				aircraft: {
					id: flight.Aircraft.aircraft_id,
					model: flight.Aircraft.model,
					total_seats: flight.Aircraft.total_seats,
				},
				departure: {
					airport: {
						id: flight.DepartureAirport.airport_id,
						code: flight.DepartureAirport.airport_code,
						name: flight.DepartureAirport.airport_name,
						city: flight.DepartureAirport.city,
					},
					time: flight.departure_time,
				},
				arrival: {
					airport: {
						id: flight.ArrivalAirport.airport_id,
						code: flight.ArrivalAirport.airport_code,
						name: flight.ArrivalAirport.airport_name,
						city: flight.ArrivalAirport.city,
					},
					time: flight.arrival_time,
				},
				duration: require('../services/flightService').calculateDuration
					? require('../services/flightService').calculateDuration(
							flight.departure_time,
							flight.arrival_time
					  )
					: '',
				status: flight.status,
			}));

			return sendPaginated(
				res,
				'Flights retrieved successfully',
				formattedFlights,
				{
					currentPage: page,
					totalPages: Math.ceil(filteredRows.length / limit),
					totalItems: filteredRows.length,
					itemsPerPage: limit,
					hasNextPage: endIndex < filteredRows.length,
					hasPrevPage: page > 1,
				}
			);
		} catch (error) {
			logger.error('Error in getAllFlightsForUsers controller:', error);
			next(error);
		}
	}

	/**
	 * Get all flights with pagination (Admin only)
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async getAllFlights(req, res, next) {
		try {
			const page = parseInt(req.query.page) || 1;
			const limit = parseInt(req.query.limit) || 10;
			const status = req.query.status;
			const airline_id = req.query.airline_id;

			// Build search filters
			const filters = {};
			if (status) filters.status = status;
			if (airline_id) filters.airline_id = parseInt(airline_id);

			const options = {
				include: [
					{
						model: require('../models').Airline,
						attributes: [
							'airline_id',
							'airline_name',
							'airline_code',
						],
					},
					{
						model: require('../models').Aircraft,
						attributes: ['aircraft_id', 'model'],
					},
					{
						model: require('../models').Airport,
						as: 'DepartureAirport',
						attributes: [
							'airport_id',
							'airport_code',
							'airport_name',
							'city',
						],
					},
					{
						model: require('../models').Airport,
						as: 'ArrivalAirport',
						attributes: [
							'airport_id',
							'airport_code',
							'airport_name',
							'city',
						],
					},
				],
				order: [['departure_time', 'ASC']],
			};

			const result = await flightService.search(
				filters,
				options,
				page,
				limit
			);

			return sendPaginated(
				res,
				'Flights retrieved successfully',
				result.data,
				result.pagination
			);
		} catch (error) {
			logger.error('Error in getAllFlights controller:', error);
			next(error);
		}
	}

	/**
	 * Create a new flight (Admin only)
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async createFlight(req, res, next) {
		try {
			const flightData = req.body;

			// Validate required fields (flight_number is optional; auto-generated if missing)
			const requiredFields = [
				'airline_id',
				'aircraft_id',
				'departure_airport_id',
				'arrival_airport_id',
				'departure_time',
				'arrival_time',
			];

			for (const field of requiredFields) {
				if (!flightData[field]) {
					return sendError(res, `Missing required field: ${field}`);
				}
			}

			// Validate dates
			if (
				new Date(flightData.departure_time) >=
				new Date(flightData.arrival_time)
			) {
				return sendError(
					res,
					'Arrival time must be after departure time'
				);
			}

			// Auto-generate flight_number if not provided: <AIRLINE_CODE><5-digit sequence>
			let finalFlightNumber = flightData.flight_number;
			if (!finalFlightNumber) {
				const airline = await Airline.findByPk(flightData.airline_id, {
					attributes: ['airline_id', 'airline_code'],
				});
				if (!airline || !airline.airline_code) {
					return sendError(
						res,
						'Invalid airline_id or missing airline_code for auto-generation'
					);
				}
				const prefix = airline.airline_code.toUpperCase();
				const count = await Flight.count({
					where: { airline_id: flightData.airline_id },
				});
				const nextSeq = (count + 1).toString().padStart(5, '0');
				finalFlightNumber = `${prefix}${nextSeq}`;

				// Ensure uniqueness within the same airline (retry a few times if needed)
				let attempts = 0;
				// eslint-disable-next-line no-constant-condition
				while (attempts < 5) {
					const exists = await Flight.findOne({
						where: {
							airline_id: flightData.airline_id,
							flight_number: finalFlightNumber,
						},
					});
					if (!exists) break;
					const seqNum =
						parseInt(finalFlightNumber.slice(prefix.length)) + 1;
					finalFlightNumber = `${prefix}${seqNum
						.toString()
						.padStart(5, '0')}`;
					attempts += 1;
				}
			}

			const newFlight = await flightService.create({
				...flightData,
				flight_number: finalFlightNumber,
			});

			return sendSuccess(
				res,
				'Flight created successfully',
				newFlight,
				201
			);
		} catch (error) {
			logger.error('Error in createFlight controller:', error);
			next(error);
		}
	}

	/**
	 * Update flight (Admin only)
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async updateFlight(req, res, next) {
		try {
			const { flightId } = req.params;
			const updateData = req.body;

			// Validate flight ID
			if (!flightId || isNaN(parseInt(flightId))) {
				return sendError(res, 'Invalid flight ID');
			}

			// Validate dates if provided
			if (updateData.departure_time && updateData.arrival_time) {
				if (
					new Date(updateData.departure_time) >=
					new Date(updateData.arrival_time)
				) {
					return sendError(
						res,
						'Arrival time must be after departure time'
					);
				}
			}

			const updatedFlight = await flightService.updateById(
				parseInt(flightId),
				updateData
			);

			return sendSuccess(
				res,
				'Flight updated successfully',
				updatedFlight
			);
		} catch (error) {
			logger.error('Error in updateFlight controller:', error);
			next(error);
		}
	}

	/**
	 * Delete flight (Admin only)
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async deleteFlight(req, res, next) {
		try {
			const { flightId } = req.params;

			// Validate flight ID
			if (!flightId || isNaN(parseInt(flightId))) {
				return sendError(res, 'Invalid flight ID');
			}

			await flightService.deleteById(parseInt(flightId));

			return sendSuccess(res, 'Flight deleted successfully');
		} catch (error) {
			logger.error('Error in deleteFlight controller:', error);
			next(error);
		}
	}

	/**
	 * Get all airlines (Public access)
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async getAllAirlines(req, res, next) {
		try {
			const { Airline, Country } = require('../models');

			const airlines = await Airline.findAll({
				include: [
					{
						model: Country,
						attributes: [
							'country_id',
							'country_name',
							'country_code',
						],
					},
				],
				attributes: [
					'airline_id',
					'airline_code',
					'airline_name',
					'logo_url',
					'country_id',
				],
				order: [['airline_name', 'ASC']],
			});

			return sendSuccess(
				res,
				'Airlines retrieved successfully',
				airlines
			);
		} catch (error) {
			logger.error('Error in getAllAirlines controller:', error);
			next(error);
		}
	}

	/**
	 * Get all airports (Public access)
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async getAllAirports(req, res, next) {
		try {
			const { Airport, Country } = require('../models');
			const { country_code, airport_type, city } = req.query;

			// Build where conditions
			const whereConditions = {};
			const includeConditions = {};

			if (country_code) {
				includeConditions.where = {
					country_code: country_code.toUpperCase(),
				};
			}

			if (airport_type) {
				whereConditions.airport_type = airport_type.toLowerCase();
			}

			if (city) {
				whereConditions.city = {
					[require('sequelize').Op.iLike]: `%${city}%`,
				};
			}

			const airports = await Airport.findAll({
				where: whereConditions,
				include: [
					{
						model: Country,
						attributes: [
							'country_id',
							'country_name',
							'country_code',
						],
						...includeConditions,
					},
				],
				attributes: [
					'airport_id',
					'airport_code',
					'airport_name',
					'city',
					'airport_type',
					'latitude',
					'longitude',
					'country_id',
				],
				order: [['airport_name', 'ASC']],
			});

			return sendSuccess(
				res,
				'Airports retrieved successfully',
				airports
			);
		} catch (error) {
			logger.error('Error in getAllAirports controller:', error);
			next(error);
		}
	}

	/**
	 * Get flight baggage services
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async getFlightBaggageServices(req, res, next) {
		try {
			const { flightId } = req.params;
			const { FlightBaggageService } = require('../models');

			const baggageServices = await FlightBaggageService.findAll({
				where: {
					flight_id: flightId,
					is_active: true,
				},
				order: [['weight_kg', 'ASC']],
				attributes: [
					'baggage_service_id',
					'weight_kg',
					'price',
					'description',
					'is_active',
				],
			});

			return sendSuccess(
				res,
				'Flight baggage services retrieved successfully',
				baggageServices
			);
		} catch (error) {
			logger.error(
				'Error in getFlightBaggageServices controller:',
				error
			);
			next(error);
		}
	}

	/**
	 * Get flight meal services
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async getFlightMealServices(req, res, next) {
		try {
			const { flightId } = req.params;
			const { FlightMealService } = require('../models');

			const mealServices = await FlightMealService.findAll({
				where: {
					flight_id: flightId,
					is_active: true,
				},
				order: [['meal_name', 'ASC']],
				attributes: [
					'meal_service_id',
					'meal_name',
					'meal_description',
					'price',
					'is_vegetarian',
					'is_halal',
					'is_active',
				],
			});

			return sendSuccess(
				res,
				'Flight meal services retrieved successfully',
				mealServices
			);
		} catch (error) {
			logger.error('Error in getFlightMealServices controller:', error);
			next(error);
		}
	}
}

module.exports = new FlightController();
