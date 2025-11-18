// Full consolidated bookingController
const {
	Booking,
	BookingDetail,
	Flight,
	FlightSeat,
	Passenger,
	User,
	Airport,
	Airline,
	Aircraft,
	TravelClass,
	Payment,
} = require('../models');

const BookingCancellation = require('../models').BookingCancellation || null;
const Contact = require('../models').Contact || null;
const ServicePackage = require('../models').ServicePackage || null;
const BookingServicePackage =
	require('../models').BookingServicePackage || null;
const FlightBaggageService = require('../models').FlightBaggageService || null;
const FlightMealService = require('../models').FlightMealService || null;
const {
	sendSuccess,
	sendError,
	sendServerError,
} = require('../utils/response');
const logger = require('../utils/logger');
const emailService = require('../config/emailConfig');
const PassengerValidationService = require('../services/passengerValidationService');
const ServicePackagePricingService = require('../services/servicePackagePricingService');
const BookingCalculationService = require('../services/bookingCalculationService');

function getUserId(req) {
	return req.user ? req.user.user_id || req.user.id : null;
}

const bookingController = {
	async createBooking(req, res) {
		try {
			const {
				flight_id,
				passengers = [],
				contact_info = {},
				promotion_code,
				class_type = 'economy',
				service_package_id,
				baggage_options = [],
				meal_options = [],
				itinerary,
			} = req.body;
			const user_id = getUserId(req);
			if (!user_id) return sendError(res, 'Not authorized', 401);

			// Validate contact info required fields
			if (
				!contact_info ||
				!contact_info.email ||
				!contact_info.phone ||
				!contact_info.first_name ||
				!contact_info.last_name
			) {
				return sendError(
					res,
					'Missing required contact fields: email, phone, first_name, last_name',
					400
				);
			}

			// If itinerary provided, validate all legs exist; otherwise validate single flight
			let flightsForLegs = [];
			if (Array.isArray(itinerary) && itinerary.length > 0) {
				const flightIds = itinerary.map((l) => l.flight_id);
				flightsForLegs = await Flight.findAll({
					where: { flight_id: flightIds },
				});
				if (
					!flightsForLegs ||
					flightsForLegs.length !== flightIds.length
				) {
					return sendError(
						res,
						'One or more flights in itinerary not found',
						404
					);
				}
			} else {
				const flight = await Flight.findByPk(flight_id);
				if (!flight) return sendError(res, 'Flight not found', 404);
			}

			// After checking contact_info fields (first/last/email/phone) and before processing passengers
			const passengerFieldErrors = [];
			if (!Array.isArray(passengers) || passengers.length === 0) {
				return sendError(
					res,
					'At least one passenger is required',
					400
				);
			}
			passengers.forEach((p, i) => {
				const { isValid, errors } =
					PassengerValidationService.validatePassengerData(p);
				if (!isValid) {
					passengerFieldErrors.push(
						`Passenger ${i + 1}: ${errors.join('; ')}`
					);
				}
			});
			if (passengerFieldErrors.length) {
				return sendError(
					res,
					'Passenger info invalid: ' +
						passengerFieldErrors.join(' | '),
					400
				);
			}

			// Validate passenger rules
			const passengerValidation =
				PassengerValidationService.validatePassengerRules(passengers);
			if (!passengerValidation.isValid) {
				return sendError(
					res,
					'Passenger validation failed',
					passengerValidation.errors,
					400
				);
			}

			// Log warnings if any
			if (passengerValidation.warnings.length > 0) {
				logger.warn(
					'Passenger validation warnings:',
					passengerValidation.warnings
				);
			}

			const isMultiLeg = Array.isArray(itinerary) && itinerary.length > 0;
			// Check if passengers have specific seat numbers or need auto-allocation
			const hasSpecificSeats = passengers.some((p) => p.seat_number);
			let seats = [];

			if (!isMultiLeg && hasSpecificSeats) {
				// Original logic: use specific seat numbers
				const seatNumbers = passengers
					.map((p) => p.seat_number)
					.filter(Boolean);
				seats = await FlightSeat.findAll({
					where: { flight_id, seat_number: seatNumbers },
				});
				if (seats.length !== seatNumbers.length)
					return sendError(
						res,
						'One or more seats are not available',
						400
					);

				const unavailable = seats.find((s) => !s.is_available);
				if (unavailable)
					return sendError(
						res,
						`Seat ${unavailable.seat_number} is not available`,
						400
					);
			} else if (!isMultiLeg) {
				// New logic: auto-allocate seats
				const seatAllocationService = require('../services/seatAllocationService');

				// Determine travel class from first passenger or default to Economy
				const travelClass = passengers[0]?.travel_class || 'ECONOMY';
				const travelClassRecord =
					await require('../models').TravelClass.findOne({
						where: { class_code: travelClass.toUpperCase() },
					});

				if (!travelClassRecord) {
					return sendError(res, 'Invalid travel class', 400);
				}

				// Check availability
				const availability =
					await seatAllocationService.checkSeatAvailability(
						flight_id,
						travelClassRecord.class_id,
						passengers.length
					);

				if (!availability.is_available) {
					return sendError(
						res,
						{
							message: 'Not enough seats available',
							details: {
								requested: passengers.length,
								available: availability.available_seats,
								class: availability.class_name,
								aircraft: availability.aircraft.model,
							},
						},
						400
					);
				}

				// Auto-allocate seats
				const allocatedSeats =
					await seatAllocationService.allocateSeats(
						flight_id,
						travelClassRecord.class_id,
						passengers.length
					);

				// Convert to the format expected by the rest of the code
				seats = allocatedSeats.map((seat) => ({
					seat_id: seat.seat_id,
					seat_number: seat.seat_number,
					price: seat.price,
					class_id: seat.class_id,
					is_available: false, // Already marked as unavailable by allocation service
				}));
			}

			// Calculate amounts (single or itinerary)
			// Convert meal_options (flight-level) to selected_meal_services format
			const selected_meal_services = [];
			if (req.body.meal_options && Array.isArray(req.body.meal_options)) {
				for (const mealOption of req.body.meal_options) {
					selected_meal_services.push({
						service_id:
							mealOption.meal_service_id || mealOption.meal_id,
						quantity: mealOption.quantity || 1,
					});
				}
			}

			// Convert baggage_options (flight-level) to selected_baggage_services format and map per passenger
			const selected_baggage_services = [];
			const baggageOptionMap = {}; // index -> baggage_service_id (single, no quantity)
			if (
				req.body.baggage_options &&
				Array.isArray(req.body.baggage_options)
			) {
				for (const baggageOption of req.body.baggage_options) {
					selected_baggage_services.push({
						service_id:
							baggageOption.baggage_service_id ||
							baggageOption.baggage_id,
						quantity: 1,
					});
					const passengerIndex =
						baggageOption.passenger_id !== undefined
							? baggageOption.passenger_id - 1
							: undefined;
					if (passengerIndex !== undefined && passengerIndex >= 0) {
						baggageOptionMap[passengerIndex] =
							baggageOption.baggage_service_id ||
							baggageOption.baggage_id;
					}
				}
			}

			let calculation;
			if (Array.isArray(itinerary) && itinerary.length > 0) {
				calculation =
					await BookingCalculationService.calculateBookingAmount({
						itinerary,
						passengers,
						discount_code: promotion_code,
					});
			} else {
				calculation =
					await BookingCalculationService.calculateBookingAmount({
						flight_id,
						passengers,
						service_package_id,
						class_type,
						selected_baggage_services,
						selected_meal_services,
						discount_code: promotion_code,
					});
			}
			const totalAmount = calculation.final_amount;
			const bookingReference = Math.random()
				.toString(36)
				.substring(2, 8)
				.toUpperCase();

			// Determine trip_type based on itinerary
			let tripType = 'one-way'; // Default
			if (Array.isArray(itinerary) && itinerary.length > 0) {
				if (itinerary.length === 1) {
					tripType = 'one-way';
				} else if (itinerary.length === 2) {
					tripType = 'round-trip';
				} else {
					tripType = 'multi-city';
				}
			}

			// Capture citizen ID from contact_info if provided
			const citizenId =
				contact_info.citizen_id || contact_info.citizenId || null;

			const booking = await Booking.create({
				user_id,
				booking_reference: bookingReference,
				status: 'pending',
				total_amount: totalAmount,
				base_amount: calculation.base_amount,
				baggage_fees: calculation.baggage_fees,
				meal_fees: calculation.meal_fees,
				service_package_fees: calculation.service_package_fees,
				selected_baggage_services: calculation.selected_baggage_services
					? JSON.stringify(calculation.selected_baggage_services)
					: null,
				selected_meal_services: calculation.selected_meal_services
					? JSON.stringify(calculation.selected_meal_services)
					: null,
				discount_amount: calculation.discount_amount,
				discount_code: calculation.discount_code,
				discount_percentage: calculation.discount_percentage,
				tax_amount: calculation.tax_amount,
				final_amount: calculation.final_amount,
				contact_email: contact_info.email || null,
				contact_phone: contact_info.phone || null,
				citizen_id: citizenId,
				promotion_code: promotion_code || null,
				trip_type: tripType,
			});

			// Optionally update user's citizen_id if provided
			try {
				if (citizenId) {
					await User.update(
						{ citizen_id: citizenId },
						{ where: { user_id } }
					);
				}
			} catch (updateErr) {
				logger.warn('Failed to update user citizen_id:', updateErr);
			}

			// Create contact record for this booking
			try {
				const { Contact } = require('../models');
				await Contact.create({
					user_id,
					first_name: contact_info.first_name || '',
					last_name: contact_info.last_name || '',
					phone: contact_info.phone || null,
					email: contact_info.email || null,
					citizen_id: citizenId,
					is_primary: true, // Make this the primary contact for this booking
				});
				logger.info(
					`Contact created for booking ${booking.booking_id}`
				);
			} catch (contactErr) {
				logger.warn('Failed to create contact record:', contactErr);
				// Don't fail the booking if contact creation fails
			}

			// Map meal_options by passenger index or passenger_id (flight-level IDs)
			// meal_options format: [{ passenger_id: 1, meal_service_id: 4 }, ...]
			// passenger_id in meal_options is 1-based index (1 = first passenger)
			const mealOptionMap = {};
			if (req.body.meal_options && Array.isArray(req.body.meal_options)) {
				for (const mealOption of req.body.meal_options) {
					// If passenger_id is provided, use it (1-based), otherwise map by order
					const passengerIndex =
						mealOption.passenger_id !== undefined
							? mealOption.passenger_id - 1
							: mealOptionMap.length || 0;
					if (!mealOptionMap[passengerIndex]) {
						mealOptionMap[passengerIndex] = [];
					}
					mealOptionMap[passengerIndex].push(
						mealOption.meal_service_id || mealOption.meal_id
					);
				}
			}

			// If client used selected_baggage_services without passenger mapping, we can't assign per passenger here
			// but calculation still works. For per-passenger assignment in BookingDetail, use baggageOptionMap above.

			// Validate baggageOptionMap against baggage_options table to satisfy FK
			const createdPassengers = [];
			let validBaggageIdsSet = new Set();
			try {
				const baggageIds = Object.values(baggageOptionMap).filter(
					(id) => id !== undefined && id !== null
				);
				if (baggageIds.length > 0) {
					const { BaggageOption } = require('../models');
					const foundOptions = await BaggageOption.findAll({
						where: { baggage_id: baggageIds },
						attributes: ['baggage_id'],
					});
					validBaggageIdsSet = new Set(
						foundOptions.map((o) => o.baggage_id)
					);
				}
			} catch (e) {
				// If validation fails, default to empty set so no FK violation
				validBaggageIdsSet = new Set();
			}
			for (let i = 0; i < passengers.length; i++) {
				const p = passengers[i];
				const newPassenger = await Passenger.create({
					first_name: p.first_name,
					last_name: p.last_name,
					date_of_birth: p.date_of_birth,
					gender: p.gender,
					nationality: p.nationality,
					passport_number: p.passport_number,
					passport_expiry: p.passport_expiry,
					passport_issuing_country: p.passport_issuing_country,
					title: p.title,
					citizen_id: p.citizen_id,
					passenger_type: p.passenger_type,
				});
				createdPassengers.push(newPassenger);

				if (Array.isArray(itinerary) && itinerary.length > 0) {
					// For multi-leg: allocate and persist per leg
					for (const leg of itinerary) {
						let legSeat;
						if (hasSpecificSeats) {
							legSeat = seats.find(
								(s) => s.seat_number === p.seat_number
							);
							if (!legSeat)
								throw new Error(
									`Seat ${p.seat_number} not found for leg`
								);
							await legSeat.update({ is_available: false });
						} else {
							// Allocate per leg
							const seatAllocationService = require('../services/seatAllocationService');
							const travelClass = (
								p.travel_class || 'ECONOMY'
							).toUpperCase();
							const travelClassRecord =
								await require('../models').TravelClass.findOne({
									where: { class_code: travelClass },
								});
							const allocatedSeats =
								await seatAllocationService.allocateSeats(
									leg.flight_id,
									travelClassRecord.class_id,
									1
								);
							legSeat = allocatedSeats[0];
						}
						await BookingDetail.create({
							booking_id: booking.booking_id,
							flight_id: leg.flight_id,
							passenger_id: newPassenger.passenger_id,
							seat_id: legSeat.seat_id,
							baggage_option_id: null,
							meal_option_id: null,
						});
					}
				} else {
					let seat;
					if (hasSpecificSeats) {
						seat = seats.find(
							(s) => s.seat_number === p.seat_number
						);
						if (!seat)
							throw new Error(`Seat ${p.seat_number} not found`);
						await seat.update({ is_available: false });
					} else {
						seat = seats[i];
						if (!seat)
							throw new Error(
								`No seat allocated for passenger ${i + 1}`
							);
					}
					await BookingDetail.create({
						booking_id: booking.booking_id,
						flight_id,
						passenger_id: newPassenger.passenger_id,
						seat_id: seat.seat_id,
						baggage_option_id: null,
						meal_option_id: null,
					});
				}
			}

			// Save service packages for each flight in the booking
			if (BookingServicePackage) {
				if (Array.isArray(itinerary) && itinerary.length > 0) {
					// Multi-leg booking: save service_package_id for each leg
					for (const leg of itinerary) {
						if (leg.service_package_id) {
							try {
								await BookingServicePackage.create({
									booking_id: booking.booking_id,
									flight_id: leg.flight_id,
									service_package_id: leg.service_package_id,
								});
							} catch (err) {
								logger.warn(
									`Failed to save service package for flight ${leg.flight_id}:`,
									err
								);
							}
						}
					}
				} else if (service_package_id && flight_id) {
					// Single flight booking
					try {
						await BookingServicePackage.create({
							booking_id: booking.booking_id,
							flight_id: flight_id,
							service_package_id: service_package_id,
						});
					} catch (err) {
						logger.warn(
							`Failed to save service package for flight ${flight_id}:`,
							err
						);
					}
				}
			}

			try {
				if (
					emailService &&
					typeof emailService.sendBookingConfirmation === 'function'
				) {
					// Get flight details for email - handle both single flight and multi-leg bookings
					let flightDetails = null;
					let flights = [];

					if (Array.isArray(itinerary) && itinerary.length > 0) {
						// Multi-leg booking: get all flights from itinerary
						const flightIds = itinerary.map((l) => l.flight_id);
						flights = await Flight.findAll({
							where: { flight_id: flightIds },
							include: [
								{
									model: Airline,
									attributes: [
										'airline_name',
										'airline_code',
									],
								},
								{
									model: Airport,
									as: 'DepartureAirport',
									attributes: [
										'airport_code',
										'airport_name',
										'city',
									],
								},
								{
									model: Airport,
									as: 'ArrivalAirport',
									attributes: [
										'airport_code',
										'airport_name',
										'city',
									],
								},
							],
							order: [['departure_time', 'ASC']],
						});
						// Use first flight for main display, but include all flights
						flightDetails = flights.length > 0 ? flights[0] : null;
					} else if (flight_id) {
						// Single flight booking
						flightDetails = await Flight.findByPk(flight_id, {
							include: [
								{
									model: Airline,
									attributes: [
										'airline_name',
										'airline_code',
									],
								},
								{
									model: Airport,
									as: 'DepartureAirport',
									attributes: [
										'airport_code',
										'airport_name',
										'city',
									],
								},
								{
									model: Airport,
									as: 'ArrivalAirport',
									attributes: [
										'airport_code',
										'airport_name',
										'city',
									],
								},
							],
						});
						if (flightDetails) {
							flights = [flightDetails];
						}
					}

					await emailService.sendBookingConfirmation(
						booking.contact_email,
						{
							booking_id: booking.booking_id,
							user_id,
							booking_reference: booking.booking_reference,
							flight_id:
								flight_id ||
								(flights.length > 0
									? flights[0].flight_id
									: null),
							trip_type: booking.trip_type,
							passengers: createdPassengers,
							passenger_count: createdPassengers.length,
							total_amount: booking.total_amount,
							base_amount: booking.base_amount,
							baggage_fees: booking.baggage_fees,
							meal_fees: booking.meal_fees,
							service_package_fees: booking.service_package_fees,
							discount_amount: booking.discount_amount,
							discount_code: booking.discount_code,
							tax_amount: booking.tax_amount,
							final_amount: booking.final_amount,
							flight: flightDetails
								? {
										flight_number:
											flightDetails.flight_number,
										departure_time:
											flightDetails.departure_time,
										arrival_time:
											flightDetails.arrival_time,
										airline: flightDetails.Airline,
										departure_airport:
											flightDetails.DepartureAirport,
										arrival_airport:
											flightDetails.ArrivalAirport,
								  }
								: null,
							flights:
								flights.length > 0
									? flights.map((f) => ({
											flight_id: f.flight_id,
											flight_number: f.flight_number,
											departure_time: f.departure_time,
											arrival_time: f.arrival_time,
											airline: f.Airline,
											departure_airport:
												f.DepartureAirport,
											arrival_airport: f.ArrivalAirport,
									  }))
									: null,
						}
					);
				}
			} catch (err) {
				logger.warn('Failed to send booking confirmation email:', err);
			}

			// Prepare response with seat information and detailed calculation
			const response = {
				booking_id: booking.booking_id,
				booking_reference: booking.booking_reference,
				user_id: booking.user_id,
				flight_id:
					Array.isArray(itinerary) && itinerary.length > 0
						? undefined
						: flight_id,
				status: booking.status,
				trip_type: booking.trip_type,
				total_amount: booking.total_amount,
				base_amount: booking.base_amount,
				baggage_fees: booking.baggage_fees,
				meal_fees: booking.meal_fees,
				service_package_fees: booking.service_package_fees,
				discount_amount: booking.discount_amount,
				discount_code: booking.discount_code,
				tax_amount: booking.tax_amount,
				final_amount: booking.final_amount,
				passengers: createdPassengers.length,
				allocated_seats: seats.map((seat) => ({
					seat_number: seat.seat_number,
					price: parseFloat(seat.price),
				})),
				calculation_breakdown: calculation.breakdown,
			};

			// Add seat allocation method info
			if (!hasSpecificSeats) {
				response.seat_allocation = 'auto';
				response.message = 'Seats automatically allocated';
			} else {
				response.seat_allocation = 'manual';
				response.message = 'Seats manually selected';
			}

			return sendSuccess(res, 'Booking created successfully', response);
		} catch (error) {
			logger.error('Error creating booking:', error);

			// Check if it's a validation error
			if (
				error.message &&
				error.message.includes('Invalid status code')
			) {
				return sendError(
					res,
					'Passenger validation failed',
					400,
					error.message
				);
			}

			return sendServerError(
				res,
				`Failed to create booking: ${error.message}`
			);
		}
	},

	async getUserBookings(req, res) {
		try {
			const user_id = getUserId(req);
			if (!user_id)
				return sendError(
					res,
					'Not authorized to access this route',
					401
				);
			const { page = 1, limit = 10, status } = req.query;
			const offset = (parseInt(page) - 1) * parseInt(limit);

			const where = { user_id };
			if (status) where.status = status;

			const { rows: bookings, count } = await Booking.findAndCountAll({
				where,
				include: [
					{
						model: BookingDetail,
						include: [
							{
								model: Flight,
								include: [
									{ model: Airport, as: 'DepartureAirport' },
									{ model: Airport, as: 'ArrivalAirport' },
								],
							},
							{
								model: FlightSeat,
								include: [{ model: TravelClass }],
							},
						],
					},
				],
				order: [['booking_date', 'DESC']],
				limit: parseInt(limit),
				offset,
			});

			const formattedBookings = await Promise.all(
				bookings.map(async (booking) => {
					const passengerCount = await BookingDetail.count({
						where: { booking_id: booking.booking_id },
					});
					const firstDetail =
						(booking.BookingDetails && booking.BookingDetails[0]) ||
						null;
					const flight =
						firstDetail && firstDetail.Flight
							? firstDetail.Flight
							: null;
					const depAirport =
						flight && flight.DepartureAirport
							? flight.DepartureAirport
							: null;
					const arrAirport =
						flight && flight.ArrivalAirport
							? flight.ArrivalAirport
							: null;

					// Count seats by class type (economy vs business)
					let economySeats = 0;
					let businessSeats = 0;
					const classTypes = new Set();

					if (
						booking.BookingDetails &&
						booking.BookingDetails.length > 0
					) {
						booking.BookingDetails.forEach((detail) => {
							if (
								detail.FlightSeat &&
								detail.FlightSeat.TravelClass
							) {
								const classCode =
									detail.FlightSeat.TravelClass.class_code;
								const className =
									detail.FlightSeat.TravelClass.class_name;

								// Determine class type based on class_code or class_name
								if (
									classCode === 'ECONOMY' ||
									className.toLowerCase().includes('economy')
								) {
									economySeats++;
									classTypes.add('economy');
								} else if (
									classCode === 'BUSINESS' ||
									className.toLowerCase().includes('business')
								) {
									businessSeats++;
									classTypes.add('business');
								}
							}
						});
					}

					// Get class types as array (if mixed, show both)
					const ticketTypes = Array.from(classTypes);

					return {
						booking_id: booking.booking_id,
						booking_reference: booking.booking_reference,
						flight: {
							flight_id: flight ? flight.flight_id : null,
							flight_number: flight ? flight.flight_number : null,
							departure_airport_code: depAirport
								? depAirport.airport_code
								: null,
							arrival_airport_code: arrAirport
								? arrAirport.airport_code
								: null,
							departure_time: flight
								? flight.departure_time
								: null,
							arrival_time: flight ? flight.arrival_time : null,
						},
						status: booking.status,
						trip_type: booking.trip_type,
						total_amount: booking.total_amount,
						created_at:
							booking.booking_date || booking.created_at || null,
						passenger_count: passengerCount,
						seats: {
							economy: economySeats,
							business: businessSeats,
						},
						ticket_types:
							ticketTypes.length > 0 ? ticketTypes : ['economy'], // Default to economy if no class found
					};
				})
			);

			const totalPages = Math.ceil(count / parseInt(limit));
			return sendSuccess(
				res,
				'User bookings retrieved successfully',
				formattedBookings,
				{
					pagination: {
						currentPage: parseInt(page),
						totalPages,
						totalItems: count,
						itemsPerPage: parseInt(limit),
					},
				}
			);
		} catch (error) {
			logger.error('Error getting user bookings:', error);
			return sendServerError(
				res,
				`Failed to retrieve bookings: ${error.message}`
			);
		}
	},

	async getBookingDetails(req, res) {
		try {
			const { bookingId } = req.params;
			const user_id = getUserId(req);
			if (!user_id)
				return sendError(
					res,
					'Not authorized to access this route',
					401
				);

			const booking = await Booking.findOne({
				where: { booking_id: bookingId, user_id },
				include: [
					{
						model: BookingDetail,
						include: [
							{
								model: Passenger,
								attributes: [
									'passenger_id',
									'first_name',
									'middle_name',
									'last_name',
									'title',
									'citizen_id',
									'passenger_type',
									'date_of_birth',
									'nationality',
									'passport_number',
									'passport_expiry',
									'passport_issuing_country',
								],
							},
							{
								model: FlightSeat,
								include: [{ model: TravelClass }],
							},
							{
								model: Flight,
								include: [
									{ model: Airline },
									{ model: Aircraft },
									{ model: Airport, as: 'DepartureAirport' },
									{ model: Airport, as: 'ArrivalAirport' },
								],
							},
						],
					},
				],
			});
			if (!booking) return sendError(res, 'Booking not found', 404);

			// Get contact information
			let contactInfo = null;
			if (Contact) {
				const contact = await Contact.findOne({
					where: { user_id: booking.user_id, is_primary: true },
					order: [['created_at', 'DESC']],
				});
				if (contact) {
					contactInfo = {
						first_name: contact.first_name,
						last_name: contact.last_name,
						email: contact.email,
						phone: contact.phone,
					};
				}
			}
			// Fallback to booking contact fields if no Contact record found
			if (!contactInfo) {
				contactInfo = {
					first_name: null,
					last_name: null,
					email: booking.contact_email,
					phone: booking.contact_phone,
				};
			}

			// Get unique flights from booking details
			const details = booking.BookingDetails || [];
			const flightMap = new Map();
			details.forEach((detail) => {
				if (detail.Flight && !flightMap.has(detail.flight_id)) {
					flightMap.set(detail.flight_id, detail.Flight);
				}
			});
			const flights = Array.from(flightMap.values());

			// Get service packages that were selected for each flight in the booking
			const servicePackages = [];
			if (BookingServicePackage && ServicePackage && flights.length > 0) {
				for (const flightItem of flights) {
					// Get service packages that were selected for this flight in this booking
					const selectedPackages =
						await BookingServicePackage.findAll({
							where: {
								booking_id: booking.booking_id,
								flight_id: flightItem.flight_id,
							},
							include: [
								{
									model: ServicePackage,
									required: true,
								},
							],
						});

					if (selectedPackages.length > 0) {
						servicePackages.push({
							flight_id: flightItem.flight_id,
							flight_number: flightItem.flight_number,
							packages: selectedPackages.map((bsp) => {
								const pkg = bsp.ServicePackage;
								return {
									package_id: pkg.package_id,
									package_name: pkg.package_name,
									package_code: pkg.package_code,
									class_type: pkg.class_type,
									package_type: pkg.package_type,
									price_multiplier: pkg.price_multiplier,
									description: pkg.description,
									services_included: pkg.services_included,
								};
							}),
						});
					}
				}
			}

			// Get baggage services that were selected for each flight in the booking
			const baggageServices = [];
			if (FlightBaggageService && flights.length > 0) {
				try {
					const selectedBaggageServices =
						booking.selected_baggage_services
							? JSON.parse(booking.selected_baggage_services)
							: [];

					for (const flightItem of flights) {
						const flightBaggageServices =
							await FlightBaggageService.findAll({
								where: {
									flight_id: flightItem.flight_id,
								},
							});

						const matchedServices = [];
						for (const selectedItem of selectedBaggageServices) {
							const serviceId =
								selectedItem.service_id ||
								selectedItem.baggage_service_id;
							const matchingService = flightBaggageServices.find(
								(bs) => bs.baggage_service_id === serviceId
							);

							if (matchingService) {
								matchedServices.push({
									baggage_service_id:
										matchingService.baggage_service_id,
									weight_kg: matchingService.weight_kg,
									price: matchingService.price,
									description: matchingService.description,
									quantity: selectedItem.quantity || 1,
								});
							}
						}

						if (matchedServices.length > 0) {
							baggageServices.push({
								flight_id: flightItem.flight_id,
								flight_number: flightItem.flight_number,
								services: matchedServices,
							});
						}
					}
				} catch (err) {
					logger.warn('Error parsing baggage services:', err);
				}
			}

			// Get meal services that were selected for each flight in the booking
			const mealServices = [];
			if (FlightMealService && flights.length > 0) {
				try {
					const selectedMealServices = booking.selected_meal_services
						? JSON.parse(booking.selected_meal_services)
						: [];

					for (const flightItem of flights) {
						const flightMealServices =
							await FlightMealService.findAll({
								where: {
									flight_id: flightItem.flight_id,
								},
							});

						const matchedServices = [];
						for (const selectedItem of selectedMealServices) {
							const serviceId =
								selectedItem.service_id ||
								selectedItem.meal_service_id;
							const matchingService = flightMealServices.find(
								(ms) => ms.meal_service_id === serviceId
							);

							if (matchingService) {
								matchedServices.push({
									meal_service_id:
										matchingService.meal_service_id,
									meal_name: matchingService.meal_name,
									meal_description:
										matchingService.meal_description,
									price: matchingService.price,
									is_vegetarian:
										matchingService.is_vegetarian,
									is_halal: matchingService.is_halal,
									quantity: selectedItem.quantity || 1,
								});
							}
						}

						if (matchedServices.length > 0) {
							mealServices.push({
								flight_id: flightItem.flight_id,
								flight_number: flightItem.flight_number,
								services: matchedServices,
							});
						}
					}
				} catch (err) {
					logger.warn('Error parsing meal services:', err);
				}
			}

			// Add contact_info and service_packages to booking object
			const bookingData = booking.toJSON();
			bookingData.contact_info = contactInfo;
			bookingData.service_packages = servicePackages;
			bookingData.baggage_services = baggageServices;
			bookingData.meal_services = mealServices;

			return sendSuccess(
				res,
				'Booking details retrieved successfully',
				bookingData
			);
		} catch (error) {
			logger.error('Error getting booking details:', error);
			return sendServerError(
				res,
				`Failed to retrieve booking details: ${error.message}`
			);
		}
	},

	async verifyBooking(req, res) {
		try {
			const { bookingReference } = req.params;
			const booking = await Booking.findOne({
				where: { booking_reference: bookingReference },
				include: [
					{
						model: BookingDetail,
						include: [
							{ model: Passenger },
							{
								model: FlightSeat,
								include: [{ model: TravelClass }],
							},
							{
								model: Flight,
								include: [
									{ model: Airline },
									{ model: Aircraft },
									{ model: Airport, as: 'DepartureAirport' },
									{ model: Airport, as: 'ArrivalAirport' },
								],
							},
						],
					},
				],
			});
			if (!booking) return sendError(res, 'Booking not found', 404);

			// Get contact information
			let contactInfo = null;
			if (Contact) {
				const contact = await Contact.findOne({
					where: { user_id: booking.user_id, is_primary: true },
					order: [['created_at', 'DESC']],
				});
				if (contact) {
					contactInfo = {
						first_name: contact.first_name,
						last_name: contact.last_name,
						email: contact.email,
						phone: contact.phone,
					};
				}
			}
			// Fallback to booking contact fields if no Contact record found
			if (!contactInfo) {
				contactInfo = {
					first_name: null,
					last_name: null,
					email: booking.contact_email,
					phone: booking.contact_phone,
				};
			}

			// Format a comprehensive response similar to booking creation
			const details = booking.BookingDetails || [];

			// Get unique flights from booking details
			const flightMap = new Map();
			details.forEach((detail) => {
				if (detail.Flight && !flightMap.has(detail.flight_id)) {
					flightMap.set(detail.flight_id, detail.Flight);
				}
			});
			const flights = Array.from(flightMap.values());
			const firstDetail = details[0] || null;
			const flight =
				firstDetail && firstDetail.Flight ? firstDetail.Flight : null;
			const depAirport =
				flight && flight.DepartureAirport
					? flight.DepartureAirport
					: null;
			const arrAirport =
				flight && flight.ArrivalAirport ? flight.ArrivalAirport : null;

			// Get service packages that were selected for each flight in the booking
			const servicePackages = [];
			if (BookingServicePackage && ServicePackage && flights.length > 0) {
				for (const flightItem of flights) {
					// Get service packages that were selected for this flight in this booking
					const selectedPackages =
						await BookingServicePackage.findAll({
							where: {
								booking_id: booking.booking_id,
								flight_id: flightItem.flight_id,
							},
							include: [
								{
									model: ServicePackage,
									required: true,
								},
							],
						});

					if (selectedPackages.length > 0) {
						servicePackages.push({
							flight_id: flightItem.flight_id,
							flight_number: flightItem.flight_number,
							packages: selectedPackages.map((bsp) => {
								const pkg = bsp.ServicePackage;
								return {
									package_id: pkg.package_id,
									package_name: pkg.package_name,
									package_code: pkg.package_code,
									class_type: pkg.class_type,
									package_type: pkg.package_type,
									price_multiplier: pkg.price_multiplier,
									description: pkg.description,
									services_included: pkg.services_included,
								};
							}),
						});
					}
				}
			}

			// Get baggage services that were selected for each flight in the booking
			const baggageServices = [];
			if (FlightBaggageService && flights.length > 0) {
				try {
					// Debug: Log the raw data
					logger.debug('Booking selected_baggage_services:', {
						raw: booking.selected_baggage_services,
						type: typeof booking.selected_baggage_services,
					});

					let selectedBaggageServices = [];
					if (booking.selected_baggage_services) {
						if (
							typeof booking.selected_baggage_services ===
							'string'
						) {
							selectedBaggageServices = JSON.parse(
								booking.selected_baggage_services
							);
						} else if (
							Array.isArray(booking.selected_baggage_services)
						) {
							selectedBaggageServices =
								booking.selected_baggage_services;
						}
					}

					logger.debug(
						'Parsed selectedBaggageServices:',
						selectedBaggageServices
					);

					// For multi-leg bookings, check if services have flight_id, otherwise match by service availability
					for (const flightItem of flights) {
						const flightBaggageServices =
							await FlightBaggageService.findAll({
								where: {
									flight_id: flightItem.flight_id,
								},
							});

						logger.debug(
							`Flight ${flightItem.flight_id} baggage services:`,
							{
								available: flightBaggageServices.map((bs) => ({
									id: bs.baggage_service_id,
									weight: bs.weight_kg,
									price: bs.price,
								})),
								selected: selectedBaggageServices,
							}
						);

						// Find matching services from selected_baggage_services
						const matchedServices = [];
						for (const selectedItem of selectedBaggageServices) {
							// Skip if this service belongs to a different flight (multi-leg support)
							if (
								selectedItem.flight_id &&
								selectedItem.flight_id !== flightItem.flight_id
							) {
								continue;
							}

							const serviceId =
								selectedItem.service_id ||
								selectedItem.baggage_service_id;
							if (!serviceId) {
								logger.debug(
									'No service_id found in selectedItem:',
									selectedItem
								);
								continue;
							}

							const matchingService = flightBaggageServices.find(
								(bs) => bs.baggage_service_id === serviceId
							);

							if (matchingService) {
								matchedServices.push({
									baggage_service_id:
										matchingService.baggage_service_id,
									weight_kg: matchingService.weight_kg,
									price: matchingService.price,
									description: matchingService.description,
									quantity: selectedItem.quantity || 1,
								});
							} else {
								logger.debug(
									`No matching baggage service found for service_id: ${serviceId} on flight ${flightItem.flight_id}`
								);
							}
						}

						if (matchedServices.length > 0) {
							baggageServices.push({
								flight_id: flightItem.flight_id,
								flight_number: flightItem.flight_number,
								services: matchedServices,
							});
						}
					}
				} catch (err) {
					logger.warn('Error parsing baggage services:', err);
				}
			}

			// Get meal services that were selected for each flight in the booking
			const mealServices = [];
			if (FlightMealService && flights.length > 0) {
				try {
					// Debug: Log the raw data
					logger.debug('Booking selected_meal_services:', {
						raw: booking.selected_meal_services,
						type: typeof booking.selected_meal_services,
					});

					let selectedMealServices = [];
					if (booking.selected_meal_services) {
						if (
							typeof booking.selected_meal_services === 'string'
						) {
							selectedMealServices = JSON.parse(
								booking.selected_meal_services
							);
						} else if (
							Array.isArray(booking.selected_meal_services)
						) {
							selectedMealServices =
								booking.selected_meal_services;
						}
					}

					logger.debug(
						'Parsed selectedMealServices:',
						selectedMealServices
					);

					// For multi-leg bookings, check if services have flight_id, otherwise match by service availability
					for (const flightItem of flights) {
						const flightMealServices =
							await FlightMealService.findAll({
								where: {
									flight_id: flightItem.flight_id,
								},
							});

						logger.debug(
							`Flight ${flightItem.flight_id} meal services:`,
							{
								available: flightMealServices.map((ms) => ({
									id: ms.meal_service_id,
									name: ms.meal_name,
									price: ms.price,
								})),
								selected: selectedMealServices,
							}
						);

						// Find matching services from selected_meal_services
						const matchedServices = [];
						for (const selectedItem of selectedMealServices) {
							// Skip if this service belongs to a different flight (multi-leg support)
							if (
								selectedItem.flight_id &&
								selectedItem.flight_id !== flightItem.flight_id
							) {
								continue;
							}

							const serviceId =
								selectedItem.service_id ||
								selectedItem.meal_service_id;
							if (!serviceId) {
								logger.debug(
									'No service_id found in selectedItem:',
									selectedItem
								);
								continue;
							}

							const matchingService = flightMealServices.find(
								(ms) => ms.meal_service_id === serviceId
							);

							if (matchingService) {
								matchedServices.push({
									meal_service_id:
										matchingService.meal_service_id,
									meal_name: matchingService.meal_name,
									meal_description:
										matchingService.meal_description,
									price: matchingService.price,
									is_vegetarian:
										matchingService.is_vegetarian,
									is_halal: matchingService.is_halal,
									quantity: selectedItem.quantity || 1,
								});
							} else {
								logger.debug(
									`No matching meal service found for service_id: ${serviceId} on flight ${flightItem.flight_id}`
								);
							}
						}

						if (matchedServices.length > 0) {
							mealServices.push({
								flight_id: flightItem.flight_id,
								flight_number: flightItem.flight_number,
								services: matchedServices,
							});
						}
					}
				} catch (err) {
					logger.warn('Error parsing meal services:', err);
				}
			}

			// Sort flights by departure_time to determine outbound/return
			const sortedFlights = [...flights].sort((a, b) => {
				const timeA = new Date(a.departure_time);
				const timeB = new Date(b.departure_time);
				return timeA - timeB;
			});

			// Group passengers by flight_id
			const passengersByFlight = {};
			details.forEach((d) => {
				const flightId = d.flight_id;
				if (!passengersByFlight[flightId]) {
					passengersByFlight[flightId] = [];
				}

				passengersByFlight[flightId].push({
					passenger_id: d.Passenger ? d.Passenger.passenger_id : null,
					title: d.Passenger ? d.Passenger.title : null,
					first_name: d.Passenger ? d.Passenger.first_name : null,
					middle_name: d.Passenger ? d.Passenger.middle_name : null,
					last_name: d.Passenger ? d.Passenger.last_name : null,
					citizen_id: d.Passenger ? d.Passenger.citizen_id : null,
					passport_number: d.Passenger
						? d.Passenger.passport_number
						: null,
					passport_expiry: d.Passenger
						? d.Passenger.passport_expiry
						: null,
					passport_issuing_country: d.Passenger
						? d.Passenger.passport_issuing_country
						: null,
					nationality: d.Passenger ? d.Passenger.nationality : null,
					date_of_birth: d.Passenger
						? d.Passenger.date_of_birth
						: null,
					passenger_type: d.Passenger
						? d.Passenger.passenger_type
						: null,
					seat_number: d.FlightSeat ? d.FlightSeat.seat_number : null,
					travel_class:
						d.FlightSeat && d.FlightSeat.TravelClass
							? d.FlightSeat.TravelClass.class_name
							: null,
				});
			});

			// Format flights array for response (support multi-leg bookings)
			// Include all related data (service_packages, baggage_services, meal_services, passengers) in each flight
			const formattedFlights = sortedFlights.map((flightItem, index) => {
				const depAirport = flightItem.DepartureAirport || null;
				const arrAirport = flightItem.ArrivalAirport || null;

				// Determine segment_type based on position and trip_type
				let segmentType = null;
				if (booking.trip_type === 'round-trip') {
					segmentType = index === 0 ? 'outbound' : 'return';
				} else if (booking.trip_type === 'multi-city') {
					segmentType = `segment_${index + 1}`;
				} else {
					segmentType = 'outbound';
				}

				// Find service packages for this flight
				const flightServicePackages = servicePackages.find(
					(sp) => sp.flight_id === flightItem.flight_id
				);

				// Find baggage services for this flight
				const flightBaggageServices = baggageServices.find(
					(bs) => bs.flight_id === flightItem.flight_id
				);

				// Find meal services for this flight
				const flightMealServices = mealServices.find(
					(ms) => ms.flight_id === flightItem.flight_id
				);

				// Get passengers for this flight
				const flightPassengers =
					passengersByFlight[flightItem.flight_id] || [];

				return {
					flight_id: flightItem.flight_id,
					flight_number: flightItem.flight_number,
					segment_type: segmentType,
					airline: flightItem.Airline
						? {
								airline_id: flightItem.Airline.airline_id,
								airline_name: flightItem.Airline.airline_name,
								airline_code: flightItem.Airline.airline_code,
						  }
						: null,
					aircraft: flightItem.Aircraft
						? {
								aircraft_id: flightItem.Aircraft.aircraft_id,
								model: flightItem.Aircraft.model,
						  }
						: null,
					departure_airport: depAirport
						? {
								airport_code: depAirport.airport_code,
								airport_name: depAirport.airport_name,
								city: depAirport.city,
						  }
						: null,
					arrival_airport: arrAirport
						? {
								airport_code: arrAirport.airport_code,
								airport_name: arrAirport.airport_name,
								city: arrAirport.city,
						  }
						: null,
					departure_time: flightItem.departure_time,
					arrival_time: flightItem.arrival_time,
					service_packages: flightServicePackages
						? flightServicePackages.packages
						: [],
					baggage_services: flightBaggageServices
						? flightBaggageServices.services
						: [],
					meal_services: flightMealServices
						? flightMealServices.services
						: [],
					passengers: flightPassengers,
				};
			});

			// Fetch payment(s) for this booking and include primary payment info
			let paymentObj = null;
			try {
				const payments = await Payment.findAll({
					where: { booking_id: booking.booking_id },
					order: [['payment_date', 'DESC']],
				});
				if (payments && payments.length > 0) {
					const p = payments[0];
					paymentObj = {
						payment_id: p.payment_id,
						amount: p.amount,
						payment_method: p.payment_method,
						payment_reference: p.payment_reference,
						payment_date: p.payment_date,
						status: p.status,
						transaction_details: p.transaction_details || null,
					};
				}
			} catch (pmErr) {
				logger.warn(
					'Failed to load payment for booking verify:',
					pmErr
				);
			}

			const response = {
				booking_id: booking.booking_id,
				booking_reference: booking.booking_reference,
				status: booking.status,
				trip_type: booking.trip_type,
				total_amount: booking.total_amount,
				base_amount: booking.base_amount,
				baggage_fees: booking.baggage_fees,
				meal_fees: booking.meal_fees,
				service_package_fees: booking.service_package_fees,
				discount_amount: booking.discount_amount,
				discount_code: booking.discount_code,
				tax_amount: booking.tax_amount,
				final_amount: booking.final_amount,
				contact_info: contactInfo,
				flights: formattedFlights,
				payment: paymentObj,
			};

			return sendSuccess(res, 'Booking verified', response);
		} catch (error) {
			logger.error('Error verifying booking:', error);
			return sendServerError(
				res,
				`Failed to verify booking: ${error.message}`
			);
		}
	},

	async getETicket(req, res) {
		try {
			const { bookingReference } = req.params;
			const { format = 'json' } = req.query;
			const user_id = getUserId(req);
			if (!user_id)
				return sendError(
					res,
					'Not authorized to access this route',
					401
				);

			const booking = await Booking.findOne({
				where: { booking_reference: bookingReference, user_id },
				include: [
					{
						model: BookingDetail,
						include: [
							{ model: Passenger },
							{
								model: FlightSeat,
								include: [{ model: TravelClass }],
							},
							{
								model: Flight,
								include: [
									{ model: Airline },
									{ model: Aircraft },
									{ model: Airport, as: 'DepartureAirport' },
									{ model: Airport, as: 'ArrivalAirport' },
								],
							},
						],
					},
				],
			});
			if (!booking) return sendError(res, 'E-ticket not found', 404);
			if (format === 'pdf')
				return sendSuccess(res, 'PDF generation not implemented yet');

			// Get contact information
			let contactInfo = null;
			if (Contact) {
				const contact = await Contact.findOne({
					where: { user_id: booking.user_id, is_primary: true },
					order: [['created_at', 'DESC']],
				});
				if (contact) {
					contactInfo = {
						first_name: contact.first_name,
						last_name: contact.last_name,
						email: contact.email,
						phone: contact.phone,
					};
				}
			}
			// Fallback to booking contact fields if no Contact record found
			if (!contactInfo) {
				contactInfo = {
					first_name: null,
					last_name: null,
					email: booking.contact_email,
					phone: booking.contact_phone,
				};
			}

			const details = booking.BookingDetails || [];

			// Get unique flights from booking details
			const flightMap = new Map();
			details.forEach((detail) => {
				if (detail.Flight && !flightMap.has(detail.flight_id)) {
					flightMap.set(detail.flight_id, detail.Flight);
				}
			});
			const flights = Array.from(flightMap.values());

			// Get service packages that were selected for each flight in the booking
			const servicePackages = [];
			if (BookingServicePackage && ServicePackage && flights.length > 0) {
				for (const flightItem of flights) {
					// Get service packages that were selected for this flight in this booking
					const selectedPackages =
						await BookingServicePackage.findAll({
							where: {
								booking_id: booking.booking_id,
								flight_id: flightItem.flight_id,
							},
							include: [
								{
									model: ServicePackage,
									required: true,
								},
							],
						});

					if (selectedPackages.length > 0) {
						servicePackages.push({
							flight_id: flightItem.flight_id,
							flight_number: flightItem.flight_number,
							packages: selectedPackages.map((bsp) => {
								const pkg = bsp.ServicePackage;
								return {
									package_id: pkg.package_id,
									package_name: pkg.package_name,
									package_code: pkg.package_code,
									class_type: pkg.class_type,
									package_type: pkg.package_type,
									price_multiplier: pkg.price_multiplier,
									description: pkg.description,
									services_included: pkg.services_included,
								};
							}),
						});
					}
				}
			}

			// Get baggage services that were selected for each flight in the booking
			const baggageServices = [];
			if (FlightBaggageService && flights.length > 0) {
				try {
					let selectedBaggageServices = [];
					if (booking.selected_baggage_services) {
						if (
							typeof booking.selected_baggage_services ===
							'string'
						) {
							selectedBaggageServices = JSON.parse(
								booking.selected_baggage_services
							);
						} else if (
							Array.isArray(booking.selected_baggage_services)
						) {
							selectedBaggageServices =
								booking.selected_baggage_services;
						}
					}

					for (const flightItem of flights) {
						const flightBaggageServices =
							await FlightBaggageService.findAll({
								where: {
									flight_id: flightItem.flight_id,
								},
							});

						const matchedServices = [];
						for (const selectedItem of selectedBaggageServices) {
							// Skip if this service belongs to a different flight (multi-leg support)
							if (
								selectedItem.flight_id &&
								selectedItem.flight_id !== flightItem.flight_id
							) {
								continue;
							}

							const serviceId =
								selectedItem.service_id ||
								selectedItem.baggage_service_id;
							if (!serviceId) continue;

							const matchingService = flightBaggageServices.find(
								(bs) => bs.baggage_service_id === serviceId
							);

							if (matchingService) {
								matchedServices.push({
									baggage_service_id:
										matchingService.baggage_service_id,
									weight_kg: matchingService.weight_kg,
									price: matchingService.price,
									description: matchingService.description,
									quantity: selectedItem.quantity || 1,
								});
							}
						}

						if (matchedServices.length > 0) {
							baggageServices.push({
								flight_id: flightItem.flight_id,
								flight_number: flightItem.flight_number,
								services: matchedServices,
							});
						}
					}
				} catch (err) {
					logger.warn('Error parsing baggage services:', err);
				}
			}

			// Get meal services that were selected for each flight in the booking
			const mealServices = [];
			if (FlightMealService && flights.length > 0) {
				try {
					let selectedMealServices = [];
					if (booking.selected_meal_services) {
						if (
							typeof booking.selected_meal_services === 'string'
						) {
							selectedMealServices = JSON.parse(
								booking.selected_meal_services
							);
						} else if (
							Array.isArray(booking.selected_meal_services)
						) {
							selectedMealServices =
								booking.selected_meal_services;
						}
					}

					for (const flightItem of flights) {
						const flightMealServices =
							await FlightMealService.findAll({
								where: {
									flight_id: flightItem.flight_id,
								},
							});

						const matchedServices = [];
						for (const selectedItem of selectedMealServices) {
							// Skip if this service belongs to a different flight (multi-leg support)
							if (
								selectedItem.flight_id &&
								selectedItem.flight_id !== flightItem.flight_id
							) {
								continue;
							}

							const serviceId =
								selectedItem.service_id ||
								selectedItem.meal_service_id;
							if (!serviceId) continue;

							const matchingService = flightMealServices.find(
								(ms) => ms.meal_service_id === serviceId
							);

							if (matchingService) {
								matchedServices.push({
									meal_service_id:
										matchingService.meal_service_id,
									meal_name: matchingService.meal_name,
									meal_description:
										matchingService.meal_description,
									price: matchingService.price,
									is_vegetarian:
										matchingService.is_vegetarian,
									is_halal: matchingService.is_halal,
									quantity: selectedItem.quantity || 1,
								});
							}
						}

						if (matchedServices.length > 0) {
							mealServices.push({
								flight_id: flightItem.flight_id,
								flight_number: flightItem.flight_number,
								services: matchedServices,
							});
						}
					}
				} catch (err) {
					logger.warn('Error parsing meal services:', err);
				}
			}

			// Sort flights by departure_time to determine outbound/return
			const sortedFlights = [...flights].sort((a, b) => {
				const timeA = new Date(a.departure_time);
				const timeB = new Date(b.departure_time);
				return timeA - timeB;
			});

			// Group passengers by flight_id with detailed information
			const passengersByFlight = {};
			details.forEach((d) => {
				const flightId = d.flight_id;
				if (!passengersByFlight[flightId]) {
					passengersByFlight[flightId] = [];
				}

				const passenger = d.Passenger || {};
				const seat = d.FlightSeat || {};
				const travelClass = seat.TravelClass || {};

				// Find baggage services for this passenger's flight
				const flightBaggage = baggageServices.find(
					(bs) => bs.flight_id === flightId
				);

				// Calculate total baggage allowance from selected services
				let baggageAllowance = null;
				if (
					flightBaggage &&
					flightBaggage.services &&
					flightBaggage.services.length > 0
				) {
					// Sum up all baggage weights for this flight
					const totalWeight = flightBaggage.services.reduce(
						(sum, service) => {
							return (
								sum +
								parseFloat(service.weight_kg) *
									(service.quantity || 1)
							);
						},
						0
					);
					baggageAllowance = `${totalWeight}kg`;
				} else {
					// Fallback to default based on travel class
					baggageAllowance =
						travelClass.class_code === 'BUSINESS' ? '30kg' : '20kg';
				}

				passengersByFlight[flightId].push({
					passenger_id: passenger.passenger_id || null,
					name: `${passenger.first_name || ''} ${
						passenger.last_name || ''
					}`.trim(),
					first_name: passenger.first_name || null,
					last_name: passenger.last_name || null,
					passenger_type: passenger.passenger_type || null,
					seat_number: seat.seat_number || null,
					travel_class: travelClass.class_name || null,
					passport_number: passenger.passport_number || null,
					passport_issuing_country:
						passenger.passport_issuing_country || null,
					passport_expiry: passenger.passport_expiry || null,
					baggage_allowance: baggageAllowance,
					meal_preference: d.meal_preference || 'Standard',
				});
			});

			// Format flights array for e-ticket (support multi-leg bookings)
			// Include all related data (service_packages, baggage_services, meal_services, passengers) in each flight
			const formattedFlights = sortedFlights.map((flightItem, index) => {
				const depAirport = flightItem.DepartureAirport || null;
				const arrAirport = flightItem.ArrivalAirport || null;

				// Determine segment_type based on position and trip_type
				let segmentType = null;
				if (booking.trip_type === 'round-trip') {
					segmentType = index === 0 ? 'outbound' : 'return';
				} else if (booking.trip_type === 'multi-city') {
					segmentType = `segment_${index + 1}`;
				} else {
					segmentType = 'outbound';
				}

				// Find service packages for this flight
				const flightServicePackages = servicePackages.find(
					(sp) => sp.flight_id === flightItem.flight_id
				);

				// Find baggage services for this flight
				const flightBaggageServices = baggageServices.find(
					(bs) => bs.flight_id === flightItem.flight_id
				);

				// Find meal services for this flight
				const flightMealServices = mealServices.find(
					(ms) => ms.flight_id === flightItem.flight_id
				);

				// Get passengers for this flight
				const flightPassengers =
					passengersByFlight[flightItem.flight_id] || [];

				// Calculate duration
				const durationMinutes =
					flightItem.departure_time && flightItem.arrival_time
						? Math.round(
								(new Date(flightItem.arrival_time) -
									new Date(flightItem.departure_time)) /
									60000
						  )
						: null;

				return {
					flight_id: flightItem.flight_id,
					flight_number: flightItem.flight_number,
					segment_type: segmentType,
					airline: flightItem.Airline
						? {
								airline_id: flightItem.Airline.airline_id,
								airline_name: flightItem.Airline.airline_name,
								airline_code: flightItem.Airline.airline_code,
						  }
						: null,
					aircraft: flightItem.Aircraft
						? {
								aircraft_id: flightItem.Aircraft.aircraft_id,
								model: flightItem.Aircraft.model,
						  }
						: null,
					departure_airport: depAirport
						? {
								airport_code: depAirport.airport_code,
								airport_name: depAirport.airport_name,
								city: depAirport.city,
								formatted: `${depAirport.airport_name} (${depAirport.airport_code})`,
						  }
						: null,
					arrival_airport: arrAirport
						? {
								airport_code: arrAirport.airport_code,
								airport_name: arrAirport.airport_name,
								city: arrAirport.city,
								formatted: `${arrAirport.airport_name} (${arrAirport.airport_code})`,
						  }
						: null,
					departure_time: flightItem.departure_time,
					arrival_time: flightItem.arrival_time,
					duration_minutes: durationMinutes,
					service_packages: flightServicePackages
						? flightServicePackages.packages
						: [],
					baggage_services: flightBaggageServices
						? flightBaggageServices.services
						: [],
					meal_services: flightMealServices
						? flightMealServices.services
						: [],
					passengers: flightPassengers,
				};
			});

			// Generate PDF URL dynamically from request
			const protocol = req.protocol || 'http';
			const host = req.get('host') || 'localhost:3000';
			const pdfUrl = `${protocol}://${host}/api/eticket/${booking.booking_reference}/pdf`;

			const eTicket = {
				booking_reference: booking.booking_reference,
				trip_type: booking.trip_type,
				contact_info: contactInfo,
				flights: formattedFlights,
				pdf_url: pdfUrl,
				barcode_url: `https://example.com/barcode/${booking.booking_reference}.png`,
				qr_code_url: `https://example.com/qrcode/${booking.booking_reference}.png`,
				boarding_instructions:
					'Please arrive at the airport 2 hours before departure',
			};

			return sendSuccess(res, 'E-ticket retrieved successfully', eTicket);
		} catch (error) {
			logger.error('Error getting e-ticket:', error);
			return sendServerError(
				res,
				`Failed to retrieve e-ticket: ${error.message}`
			);
		}
	},

	async requestCancellation(req, res) {
		try {
			const { bookingId } = req.params;
			const { reason, cancellation_note } = req.body;
			const user_id = getUserId(req);
			if (!user_id)
				return sendError(
					res,
					'Not authorized to access this route',
					401
				);

			const booking = await Booking.findOne({
				where: { booking_id: bookingId, user_id },
				include: [
					{
						model: BookingDetail,
						include: [
							{
								model: Flight,
								include: [
									{ model: Airport, as: 'DepartureAirport' },
									{ model: Airport, as: 'ArrivalAirport' },
								],
							},
						],
					},
				],
			});
			if (!booking) return sendError(res, 'Booking not found', 404);
			if (booking.status === 'cancelled')
				return sendError(res, 'Booking is already cancelled', 400);
			if (booking.status === 'completed')
				return sendError(res, 'Cannot cancel a completed booking', 400);

			const now = new Date();
			const firstDetail =
				booking.BookingDetails && booking.BookingDetails[0];
			const flight =
				firstDetail && firstDetail.Flight ? firstDetail.Flight : null;
			if (!flight)
				return sendError(
					res,
					'Flight information not available for cancellation',
					400
				);

			const finalReason =
				reason || cancellation_note || 'No reason provided';

			// Only calculate refund if payment has been completed
			let refundEstimate = null;
			let cancellationFee = null;
			const isPaid = booking.payment_status === 'paid';

			if (isPaid) {
				// Calculate refund only if booking has been paid
				const departureTime = new Date(flight.departure_time);
				const hoursDifference =
					(departureTime - now) / (1000 * 60 * 60);
				cancellationFee =
					hoursDifference > 24
						? booking.total_amount * 0.2
						: booking.total_amount * 0.5;
				refundEstimate = booking.total_amount - cancellationFee;
			}
			// Do NOT auto-cancel and release seats here. Mark the booking as pending
			// cancellation and let admin confirm (admin will perform final cancel and
			// release seats). This prevents immediate seat release before admin review.

			if (booking.status === 'pending_cancellation') {
				return sendError(
					res,
					'Cancellation request is already pending admin confirmation',
					400
				);
			}

			booking.status = 'pending_cancellation';
			booking.cancellation_reason = finalReason;
			// Save refund estimate/cancellation fee as metadata if needed
			await booking.save();

			// Send cancellation request email to user/admin (no seat release yet)
			try {
				if (
					emailService &&
					typeof emailService.sendCancellationRequest === 'function'
				) {
					await emailService.sendCancellationRequest(
						booking.contact_email,
						{
							booking_id: booking.booking_id,
							user_id,
							booking_reference: booking.booking_reference,
							reason: finalReason,
							refund_amount_estimate: refundEstimate, // null if not paid
							cancellation_fee: cancellationFee, // null if not paid
						}
					);
				} else if (
					emailService &&
					typeof emailService.sendCancellationNotification ===
						'function'
				) {
					await emailService.sendCancellationNotification(
						booking.contact_email,
						{
							booking_id: booking.booking_id,
							user_id,
							booking_reference: booking.booking_reference,
							reason: finalReason,
							refund_amount_estimate: refundEstimate, // null if not paid
							cancellation_fee: cancellationFee, // null if not paid
						}
					);
				}
			} catch (err) {
				logger.warn('Failed to send cancellation email:', err);
			}

			const responseData = {
				booking_id: booking.booking_id,
				status: booking.status,
				cancellation_reason: booking.cancellation_reason,
			};

			// Only include refund info if payment was completed
			if (isPaid) {
				responseData.refund_amount_estimate = refundEstimate;
				responseData.cancellation_fee = cancellationFee;
			}

			return sendSuccess(
				res,
				'Cancellation request submitted and pending admin confirmation',
				responseData
			);
		} catch (error) {
			logger.error('Error requesting cancellation:', error);
			return sendServerError(
				res,
				`Failed to submit cancellation request: ${error.message}`
			);
		}
	},

	async getCancellationStatus(req, res) {
		try {
			const { bookingId } = req.params;
			const user_id = getUserId(req);
			if (!user_id)
				return sendError(
					res,
					'Not authorized to access this route',
					401
				);

			const booking = await Booking.findOne({
				where: { booking_id: bookingId, user_id },
			});
			if (!booking) return sendError(res, 'Booking not found', 404);

			if (BookingCancellation) {
				const cancellation = await BookingCancellation.findOne({
					where: { booking_id: bookingId },
				});
				if (!cancellation)
					return sendError(
						res,
						'No cancellation request found for this booking',
						404
					);
				return sendSuccess(res, 'Cancellation status retrieved', {
					cancellation_id: cancellation.cancellation_id,
					booking_id: cancellation.booking_id,
					status: cancellation.status,
					refund_amount: cancellation.refund_amount,
					refund_method:
						cancellation.refund_method || 'Original payment method',
					refund_date: cancellation.refund_date,
					cancellation_fee: cancellation.cancellation_fee,
					admin_notes: cancellation.admin_notes,
				});
			}

			if (!booking.cancellation_reason)
				return sendError(
					res,
					'No cancellation request found for this booking',
					404
				);
			return sendSuccess(res, 'Cancellation status retrieved', {
				booking_id: booking.booking_id,
				status: booking.status,
				cancellation_reason: booking.cancellation_reason,
			});
		} catch (error) {
			logger.error('Error getting cancellation status:', error);
			return sendServerError(
				res,
				`Failed to retrieve cancellation status: ${error.message}`
			);
		}
	},

	/**
	 * Get passengers information for a booking
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async getBookingPassengers(req, res) {
		try {
			const { bookingId } = req.params;
			const user_id = getUserId(req);
			if (!user_id)
				return sendError(
					res,
					'Not authorized to access this route',
					401
				);

			const booking = await Booking.findOne({
				where: { booking_id: bookingId, user_id },
				include: [
					{
						model: BookingDetail,
						include: [
							{
								model: Passenger,
								attributes: [
									'passenger_id',
									'first_name',
									'middle_name',
									'last_name',
									'title',
									'citizen_id',
									'passenger_type',
									'date_of_birth',
									'nationality',
									'passport_number',
									'passport_expiry',
									'passport_issuing_country',
								],
							},
							{
								model: FlightSeat,
								attributes: ['seat_id', 'seat_number'],
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
			});

			if (!booking) return sendError(res, 'Booking not found', 404);

			// Format passengers data
			const passengers = booking.BookingDetails.map((detail) => {
				const passenger = detail.Passenger;
				const seat = detail.FlightSeat;
				const travelClass = seat.TravelClass;

				return {
					passenger_id: passenger.passenger_id,
					first_name: passenger.first_name,
					middle_name: passenger.middle_name,
					last_name: passenger.last_name,
					title: passenger.title,
					citizen_id: passenger.citizen_id,
					passenger_type: passenger.passenger_type,
					date_of_birth: passenger.date_of_birth,
					nationality: passenger.nationality,
					passport_number: passenger.passport_number,
					passport_expiry: passenger.passport_expiry,
					passport_issuing_country:
						passenger.passport_issuing_country,
					seat: {
						seat_id: seat.seat_id,
						seat_number: seat.seat_number,
						travel_class: {
							class_id: travelClass.class_id,
							class_name: travelClass.class_name,
							class_code: travelClass.class_code,
						},
					},
				};
			});

			return sendSuccess(
				res,
				'Passengers information retrieved successfully',
				{
					booking_id: booking.booking_id,
					booking_reference: booking.booking_reference,
					status: booking.status,
					trip_type: booking.trip_type,
					passengers: passengers,
				}
			);
		} catch (error) {
			logger.error('Error getting booking passengers:', error);
			return sendServerError(
				res,
				`Failed to retrieve passengers information: ${error.message}`
			);
		}
	},

	/**
	 * Update passenger information for a booking
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async updateBookingPassenger(req, res) {
		try {
			const { bookingId, passengerId } = req.params;
			const updateData = req.body;
			const user_id = getUserId(req);
			if (!user_id)
				return sendError(
					res,
					'Not authorized to access this route',
					401
				);

			// Verify booking belongs to user
			const booking = await Booking.findOne({
				where: { booking_id: bookingId, user_id },
			});
			if (!booking) return sendError(res, 'Booking not found', 404);

			// Check if booking can be modified
			if (
				booking.status === 'completed' ||
				booking.status === 'cancelled'
			) {
				return sendError(
					res,
					'Cannot modify passengers for completed or cancelled bookings',
					400
				);
			}

			// Verify passenger belongs to this booking
			const bookingDetail = await BookingDetail.findOne({
				where: {
					booking_id: bookingId,
					passenger_id: passengerId,
				},
			});
			if (!bookingDetail) {
				return sendError(
					res,
					'Passenger not found in this booking',
					404
				);
			}

			// Validate passenger data
			const allowedFields = [
				'first_name',
				'middle_name',
				'last_name',
				'title',
				'citizen_id',
				'passenger_type',
				'date_of_birth',
				'nationality',
				'passport_number',
				'passport_expiry',
				'passport_issuing_country',
			];

			const filteredData = {};
			for (const field of allowedFields) {
				if (updateData[field] !== undefined) {
					filteredData[field] = updateData[field];
				}
			}

			// Validate required fields
			if (filteredData.first_name && !filteredData.first_name.trim()) {
				return sendError(res, 'First name cannot be empty', 400);
			}
			if (filteredData.last_name && !filteredData.last_name.trim()) {
				return sendError(res, 'Last name cannot be empty', 400);
			}
			if (filteredData.date_of_birth) {
				const birthDate = new Date(filteredData.date_of_birth);
				if (isNaN(birthDate.getTime())) {
					return sendError(res, 'Invalid date of birth format', 400);
				}
			}
			if (filteredData.passport_expiry) {
				const expiryDate = new Date(filteredData.passport_expiry);
				if (isNaN(expiryDate.getTime())) {
					return sendError(
						res,
						'Invalid passport expiry format',
						400
					);
				}
			}

			// Update passenger
			const passenger = await Passenger.findByPk(passengerId);
			if (!passenger) {
				return sendError(res, 'Passenger not found', 404);
			}

			await passenger.update(filteredData);

			// Get updated passenger data
			const updatedPassenger = await Passenger.findByPk(passengerId, {
				attributes: [
					'passenger_id',
					'first_name',
					'middle_name',
					'last_name',
					'title',
					'citizen_id',
					'passenger_type',
					'date_of_birth',
					'nationality',
					'passport_number',
					'passport_expiry',
					'passport_issuing_country',
				],
			});

			return sendSuccess(
				res,
				'Passenger information updated successfully',
				updatedPassenger
			);
		} catch (error) {
			logger.error('Error updating passenger:', error);
			return sendServerError(
				res,
				`Failed to update passenger information: ${error.message}`
			);
		}
	},

	/**
	 * Update multiple passengers information for a booking
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async updateBookingPassengers(req, res) {
		try {
			const { bookingId } = req.params;
			const { passengers } = req.body;
			const user_id = getUserId(req);
			if (!user_id)
				return sendError(
					res,
					'Not authorized to access this route',
					401
				);

			// Verify booking belongs to user
			const booking = await Booking.findOne({
				where: { booking_id: bookingId, user_id },
			});
			if (!booking) return sendError(res, 'Booking not found', 404);

			// Check if booking can be modified
			if (
				booking.status === 'completed' ||
				booking.status === 'cancelled'
			) {
				return sendError(
					res,
					'Cannot modify passengers for completed or cancelled bookings',
					400
				);
			}

			if (!passengers || !Array.isArray(passengers)) {
				return sendError(
					res,
					'Passengers data is required and must be an array',
					400
				);
			}

			const updatedPassengers = [];
			const errors = [];

			for (let i = 0; i < passengers.length; i++) {
				const passengerData = passengers[i];
				const { passenger_id } = passengerData;

				if (!passenger_id) {
					errors.push(`Passenger ${i + 1}: passenger_id is required`);
					continue;
				}

				try {
					// Verify passenger belongs to this booking
					const bookingDetail = await BookingDetail.findOne({
						where: {
							booking_id: bookingId,
							passenger_id: passenger_id,
						},
					});

					if (!bookingDetail) {
						errors.push(
							`Passenger ${i + 1}: Not found in this booking`
						);
						continue;
					}

					// Validate passenger data
					const allowedFields = [
						'first_name',
						'middle_name',
						'last_name',
						'title',
						'citizen_id',
						'passenger_type',
						'date_of_birth',
						'nationality',
						'passport_number',
						'passport_expiry',
						'passport_issuing_country',
					];

					const filteredData = {};
					for (const field of allowedFields) {
						if (passengerData[field] !== undefined) {
							filteredData[field] = passengerData[field];
						}
					}

					// Validate required fields
					if (
						filteredData.first_name &&
						!filteredData.first_name.trim()
					) {
						errors.push(
							`Passenger ${i + 1}: First name cannot be empty`
						);
						continue;
					}
					if (
						filteredData.last_name &&
						!filteredData.last_name.trim()
					) {
						errors.push(
							`Passenger ${i + 1}: Last name cannot be empty`
						);
						continue;
					}

					// Update passenger
					const passenger = await Passenger.findByPk(passenger_id);
					if (!passenger) {
						errors.push(`Passenger ${i + 1}: Passenger not found`);
						continue;
					}

					await passenger.update(filteredData);

					// Get updated passenger data
					const updatedPassenger = await Passenger.findByPk(
						passenger_id,
						{
							attributes: [
								'passenger_id',
								'first_name',
								'middle_name',
								'last_name',
								'title',
								'citizen_id',
								'passenger_type',
								'date_of_birth',
								'nationality',
								'passport_number',
								'passport_expiry',
								'passport_issuing_country',
							],
						}
					);

					updatedPassengers.push(updatedPassenger);
				} catch (error) {
					errors.push(`Passenger ${i + 1}: ${error.message}`);
				}
			}

			if (errors.length > 0) {
				return sendError(
					res,
					'Some passengers could not be updated',
					400,
					{
						errors: errors,
						updated_passengers: updatedPassengers,
					}
				);
			}

			return sendSuccess(
				res,
				'All passengers information updated successfully',
				{
					booking_id: booking.booking_id,
					updated_passengers: updatedPassengers,
				}
			);
		} catch (error) {
			logger.error('Error updating passengers:', error);
			return sendServerError(
				res,
				`Failed to update passengers information: ${error.message}`
			);
		}
	},
};

module.exports = bookingController;
