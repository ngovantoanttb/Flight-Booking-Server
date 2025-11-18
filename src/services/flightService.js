/**
 * Flight Service
 * Handles all flight-related business logic
 */

const BaseService = require('./baseService');
const {
	Flight,
	Airline,
	Aircraft,
	Airport,
	FlightSeat,
	TravelClass,
	BaggageOption,
	MealOption,
} = require('../models');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class FlightService extends BaseService {
	constructor() {
		super(Flight);
	}

	/**
	 * Search available flights
	 * @param {Object} searchParams - Search parameters
	 * @returns {Promise<Object>} Available flights and pagination
	 */
	async searchAvailableFlights(searchParams) {
		try {
			const {
				departure_airport_code,
				arrival_airport_code,
				departure_date,
				passengers = 1,
				class_code,
				flight_type,
				min_price,
				max_price,
				page = 1,
				limit = 10,
				include_past = false,
			} = searchParams || {};

			const where = {};
			// Instead of separate lookups, filter by airport code using JOINs on
			// the DepartureAirport / ArrivalAirport associations. This lets the DB
			// perform the filtering and avoids extra round-trips.
			let departureAirportWhere;
			let arrivalAirportWhere;
			if (departure_airport_code) {
				departureAirportWhere = {
					airport_code: departure_airport_code,
				};
			}
			if (arrival_airport_code) {
				arrivalAirportWhere = { airport_code: arrival_airport_code };
			}

			if (departure_date) {
				// Use Date objects for Sequelize date comparisons
				const departureDate = new Date(departure_date);
				const nextDay = new Date(departureDate);
				nextDay.setDate(departureDate.getDate() + 1);
				where.departure_time = {
					[Op.between]: [departureDate, nextDay],
				};
			}

			// If caller requested a specific departure_date in the past and did not
			// ask to include past flights, return empty result immediately.
			if (departure_date && !include_past) {
				const departureDate = new Date(departure_date);
				const nextDay = new Date(departureDate);
				nextDay.setDate(departureDate.getDate() + 1);
				const now = new Date();
				if (nextDay <= now) {
					return {
						flights: [],
						pagination: {
							currentPage: 1,
							totalPages: 0,
							totalItems: 0,
							itemsPerPage: parseInt(limit, 10) || 10,
							hasNextPage: false,
							hasPrevPage: false,
						},
					};
				}
			}

			// By default exclude already-departed flights; allow caller to include past flights via `include_past=true`.
			if (!include_past) {
				const now = new Date();
				if (!where.departure_time) {
					where.departure_time = { [Op.gte]: now };
				} else {
					// If a between range exists, bump its start to `now` if earlier.
					if (where.departure_time[Op.between]) {
						const [start, end] = where.departure_time[Op.between];
						const newStart = new Date(start) > now ? start : now;
						where.departure_time[Op.between] = [newStart, end];
					} else {
						// Handle existing gte/lte bounds
						const newWhere = {};
						if (where.departure_time[Op.gte]) {
							const existing = new Date(
								where.departure_time[Op.gte]
							);
							newWhere[Op.gte] = existing > now ? existing : now;
						} else {
							newWhere[Op.gte] = now;
						}
						if (where.departure_time[Op.lte]) {
							newWhere[Op.lte] = where.departure_time[Op.lte];
						}
						where.departure_time = newWhere;
					}
				}
			}

			// If caller provided a flight_type filter, normalize and apply to SQL
			// where clause now that `flight_type` is persisted on the model.
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
					where.flight_type = 'domestic';
				} else if (
					ft === 'international' ||
					ft === 'quoc te' ||
					ft.startsWith('int') ||
					ft.startsWith('quo')
				) {
					where.flight_type = 'international';
				} else {
					// pass-through if it already matches enum
					where.flight_type = ft;
				}
			}

			// Exclude cancelled flights from public search results
			where.status = { [Op.ne]: 'cancelled' };

			// Pagination offset
			const parsedPage = parseInt(page, 10) || 1;
			const parsedLimit = parseInt(limit, 10) || 10;
			const offset = (parsedPage - 1) * parsedLimit;

			// Resolve travel class
			let travelClass = null;
			if (class_code) {
				travelClass = await TravelClass.findOne({
					where: { class_code: String(class_code).toUpperCase() },
				});
				if (!travelClass) {
					throw new BadRequestError('Invalid travel class code');
				}
			} else {
				// default to ECONOMY if not provided
				travelClass = await TravelClass.findOne({
					where: { class_code: 'ECONOMY' },
				});
				if (!travelClass) {
					throw new NotFoundError('Default travel class not found');
				}
			}

			const include = [
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
					...(departureAirportWhere
						? { where: departureAirportWhere, required: true }
						: {}),
				},
				{
					model: Airport,
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
					...(arrivalAirportWhere
						? { where: arrivalAirportWhere, required: true }
						: {}),
				},
				{
					model: FlightSeat,
					attributes: [
						'seat_id',
						'seat_number',
						'price',
						'is_available',
						'class_id',
					],
					required: false,
				},
			];

			let flights;
			try {
				flights = await Flight.findAll({
					where,
					include,
					order: [['departure_time', 'ASC']],
					limit: parsedLimit,
					offset,
				});
			} catch (err) {
				// Log query parameters to help debug SQL errors
				logger.error('Flight.findAll failed', {
					where,
					page: parsedPage,
					limit: parsedLimit,
					err: err && err.message,
					stack: err && err.stack,
				});
				throw err;
			}

			// Filter flights by seat availability in the requested class
			let availableFlights = flights.filter((flight) => {
				const seatsInClass = (flight.FlightSeats || []).filter(
					(seat) =>
						seat.is_available &&
						seat.class_id === travelClass.class_id
				);
				if (passengers && seatsInClass.length < passengers)
					return false;
				return true;
			});

			// Price filters
			if (min_price !== undefined || max_price !== undefined) {
				const minPrice =
					min_price !== undefined ? parseFloat(min_price) : null;
				const maxPrice =
					max_price !== undefined ? parseFloat(max_price) : null;
				availableFlights = availableFlights.filter((flight) => {
					const availableSeats = (flight.FlightSeats || []).filter(
						(seat) =>
							seat.is_available &&
							seat.class_id === travelClass.class_id
					);
					const seatPrices = availableSeats
						.map((s) => parseFloat(s.price))
						.filter((p) => !isNaN(p) && p > 0);
					const minSeatPrice =
						seatPrices.length > 0 ? Math.min(...seatPrices) : null;
					const basePrice =
						travelClass.class_code === 'BUSINESS'
							? parseFloat(flight.business_price || 0)
							: parseFloat(flight.economy_price || 0);
					const finalPrice =
						minSeatPrice !== null ? minSeatPrice : basePrice;
					if (minPrice !== null && finalPrice < minPrice)
						return false;
					if (maxPrice !== null && finalPrice > maxPrice)
						return false;
					return true;
				});
			}

			const formattedFlights = availableFlights.map((flight) => {
				const availableSeats = (flight.FlightSeats || []).filter(
					(seat) =>
						seat.is_available &&
						seat.class_id === travelClass.class_id
				);
				const seatPrices = availableSeats
					.map((seat) => parseFloat(seat.price))
					.filter((p) => !isNaN(p) && p > 0);
				const minSeatPrice =
					seatPrices.length > 0 ? Math.min(...seatPrices) : null;
				const fallbackPrice =
					travelClass.class_code === 'BUSINESS'
						? parseFloat(flight.business_price || 0)
						: parseFloat(flight.economy_price || 0);
				const startingPrice =
					minSeatPrice !== null ? minSeatPrice : fallbackPrice || 0;

				const now = new Date();
				const computedStatus =
					new Date(flight.departure_time) < now ||
					availableSeats.length === 0
						? 'closed'
						: flight.status;

				return {
					// include persisted flight_type from DB
					flight_type: flight.flight_type,
					flight_id: flight.flight_id,
					flight_number: flight.flight_number,
					economy_price: parseFloat(flight.economy_price || 0),
					business_price: parseFloat(flight.business_price || 0),
					airline: flight.Airline
						? {
								id: flight.Airline.airline_id,
								name: flight.Airline.airline_name,
								code: flight.Airline.airline_code,
								logo_url: flight.Airline.logo_url,
						  }
						: null,
					aircraft: flight.Aircraft
						? {
								id: flight.Aircraft.aircraft_id,
								model: flight.Aircraft.model,
								total_seats: flight.Aircraft.total_seats,
						  }
						: null,
					departure: flight.DepartureAirport
						? {
								airport: {
									id: flight.DepartureAirport.airport_id,
									code: flight.DepartureAirport.airport_code,
									name: flight.DepartureAirport.airport_name,
									city: flight.DepartureAirport.city,
								},
								time: flight.departure_time,
						  }
						: null,
					arrival: flight.ArrivalAirport
						? {
								airport: {
									id: flight.ArrivalAirport.airport_id,
									code: flight.ArrivalAirport.airport_code,
									name: flight.ArrivalAirport.airport_name,
									city: flight.ArrivalAirport.city,
								},
								time: flight.arrival_time,
						  }
						: null,
					duration: this.calculateDuration(
						flight.departure_time,
						flight.arrival_time
					),
					status: computedStatus,
					available_seats: availableSeats.length,
					starting_price: startingPrice,
					travel_class: {
						id: travelClass.class_id,
						name: travelClass.class_name,
						code: travelClass.class_code,
					},
				};
			});

			// Paginate results
			const startIndex = (parsedPage - 1) * parsedLimit;
			const endIndex = startIndex + parsedLimit;
			const paginatedFlights = formattedFlights.slice(
				startIndex,
				endIndex
			);

			return {
				flights: paginatedFlights,
				pagination: {
					currentPage: parsedPage,
					totalPages: Math.ceil(
						formattedFlights.length / parsedLimit
					),
					totalItems: formattedFlights.length,
					itemsPerPage: parsedLimit,
					hasNextPage: endIndex < formattedFlights.length,
					hasPrevPage: parsedPage > 1,
				},
			};
		} catch (error) {
			logger.error('Error searching available flights:', error);
			throw error;
		}
	}

	/**
	 * Get flight details by ID
	 * @param {number} flightId - Flight ID
	 * @returns {Promise<Object>} Flight details
	 */
	async getFlightDetails(flightId) {
		try {
			const {
				FlightBaggageService,
				FlightMealService,
				ServicePackage,
			} = require('../models');
			const flight = await Flight.findByPk(flightId, {
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
						attributes: [
							'aircraft_id',
							'model',
							'total_seats',
							'business_seats',
							'economy_seats',
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
						attributes: [
							'seat_id',
							'seat_number',
							'price',
							'is_available',
						],
					},
				],
			});

			if (!flight) {
				throw new NotFoundError('Flight not found');
			}

			// Do not expose cancelled flights through public flight details
			if (flight.status === 'cancelled') {
				throw new NotFoundError('Flight not found');
			}

			// Load flight-level services
			const [baggageServices, mealServices, servicePackages] =
				await Promise.all([
					FlightBaggageService.findAll({
						where: { flight_id: flightId, is_active: true },
						attributes: [
							'baggage_service_id',
							'weight_kg',
							'price',
							'description',
						],
						order: [['weight_kg', 'ASC']],
					}),
					FlightMealService.findAll({
						where: { flight_id: flightId, is_active: true },
						attributes: [
							'meal_service_id',
							'meal_name',
							'meal_description',
							'price',
							'is_vegetarian',
							'is_halal',
						],
						order: [['meal_name', 'ASC']],
					}),
					ServicePackage.findAll({
						where: {
							airline_id: flight.airline_id,
							is_active: true,
						},
						attributes: [
							'package_id',
							'package_name',
							'package_code',
							'class_type',
							'package_type',
							'price_multiplier',
							'description',
						],
						order: [
							['class_type', 'ASC'],
							['package_type', 'ASC'],
						],
					}),
				]);

			// Determine if flight should be considered closed (past departure or no available seats)
			const now = new Date();
			const availableSeats = (flight.FlightSeats || []).filter(
				(seat) => seat.is_available
			);
			const displayStatus =
				new Date(flight.departure_time) < now ||
				availableSeats.length === 0
					? 'closed'
					: flight.status;

			// Format response
			return {
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
					business_seats: flight.Aircraft.business_seats,
					economy_seats: flight.Aircraft.economy_seats,
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
				duration: this.calculateDuration(
					flight.departure_time,
					flight.arrival_time
				),
				status: displayStatus,
				seats: flight.FlightSeats.map((seat) => ({
					seat_id: seat.seat_id,
					seat_number: seat.seat_number,
					price: parseFloat(seat.price),
					is_available: seat.is_available,
					travel_class: {
						id: seat.TravelClass.class_id,
						name: seat.TravelClass.class_name,
						code: seat.TravelClass.class_code,
					},
				})),
				flight_services: {
					baggage: baggageServices,
					meals: mealServices,
				},
				service_packages: servicePackages,
			};
		} catch (error) {
			logger.error('Error getting flight details:', error);
			throw error;
		}
	}

	/**
	 * Get flight services (baggage, meals)
	 * @param {number} flightId - Flight ID
	 * @returns {Promise<Object>} Flight services
	 */
	async getFlightServices(flightId) {
		try {
			const flight = await this.findById(flightId);

			// Get airline services
			const baggageOptions = await BaggageOption.findAll({
				where: { airline_id: flight.airline_id },
				attributes: ['baggage_id', 'weight_kg', 'price', 'description'],
			});

			const mealOptions = await MealOption.findAll({
				where: { airline_id: flight.airline_id },
				attributes: [
					'meal_id',
					'meal_name',
					'meal_description',
					'price',
					'is_vegetarian',
					'is_halal',
				],
			});

			return {
				baggage_options: baggageOptions,
				meal_options: mealOptions,
			};
		} catch (error) {
			logger.error('Error getting flight services:', error);
			throw error;
		}
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
	 * Get available seats for a flight
	 * @param {number} flightId - Flight ID
	 * @param {number} classId - Travel class ID
	 * @returns {Promise<Array>} Available seats
	 */
	async getAvailableSeats(flightId, classId) {
		try {
			const seats = await FlightSeat.findAll({
				where: {
					flight_id: flightId,
					class_id: classId,
					is_available: true,
				},
				include: [
					{
						model: TravelClass,
						attributes: ['class_id', 'class_name', 'class_code'],
					},
				],
				order: [['seat_number', 'ASC']],
			});

			return seats.map((seat) => ({
				seat_id: seat.seat_id,
				seat_number: seat.seat_number,
				price: parseFloat(seat.price),
				travel_class: {
					id: seat.TravelClass.class_id,
					name: seat.TravelClass.class_name,
					code: seat.TravelClass.class_code,
				},
			}));
		} catch (error) {
			logger.error('Error getting available seats:', error);
			throw error;
		}
	}
}

module.exports = new FlightService();
