const adminService = require('../services/adminService');
const {
	Flight,
	FlightSeat,
	Airline,
	Airport,
	Aircraft,
	TravelClass,
	FlightBaggageService,
	FlightMealService,
	Booking,
	BookingDetail,
} = require('../models');
const ServicePackagePricingService = require('../services/servicePackagePricingService');
const ExcelExportService = require('../services/excelExportService');
const {
	sendSuccess,
	sendNotFound,
	sendError,
	sendPaginated,
} = require('../utils/response');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');
const emailService = require('../config/emailConfig');

class AdminController {
	async getAirlineDetails(req, res, next) {
		try {
			const { airlineId } = req.params;
			const data = await adminService.getAirlineDetails(
				parseInt(airlineId)
			);
			return sendSuccess(
				res,
				'Airline details retrieved successfully',
				data
			);
		} catch (error) {
			logger.error('Error in getAirlineDetails controller:', error);
			next(error);
		}
	}
	// Airlines Management
	async getAirlines(req, res, next) {
		try {
			const page = parseInt(req.query.page) || 1;
			const limit = parseInt(req.query.limit) || 10;
			const {
				search,
				airline_code,
				airline_name,
				country_id,
				is_active,
			} = req.query;

			const filters = {};
			if (search) filters.search = search;
			if (airline_code) filters.airline_code = airline_code;
			if (airline_name) filters.airline_name = airline_name;
			if (country_id) filters.country_id = parseInt(country_id);
			if (is_active !== undefined)
				filters.is_active = is_active === 'true';

			const result = await adminService.getAirlines(filters, page, limit);
			return sendPaginated(
				res,
				'Airlines retrieved successfully',
				result.data,
				result.pagination
			);
		} catch (error) {
			logger.error('Error in getAirlines controller:', error);
			next(error);
		}
	}

	async getAirline(req, res, next) {
		try {
			const { id } = req.params;
			const airline = await adminService.getAirline(parseInt(id));
			return sendSuccess(res, 'Airline retrieved successfully', airline);
		} catch (error) {
			logger.error('Error in getAirline controller:', error);
			next(error);
		}
	}

	async createAirline(req, res, next) {
		try {
			const airlineData = req.body;
			const newAirline = await adminService.createAirline(airlineData);
			return sendSuccess(
				res,
				'Airline created successfully',
				newAirline,
				201
			);
		} catch (error) {
			logger.error('Error in createAirline controller:', error);
			next(error);
		}
	}

	async updateAirline(req, res, next) {
		try {
			const { id } = req.params;
			const body = req.body || {};

			const airlineId = parseInt(id);

			// Verify airline exists before attempting update to provide a clear 404
			try {
				await adminService.getAirline(airlineId);
			} catch (err) {
				// If service layer says not found, do a direct lookup and log result to aid debugging
				if (
					err instanceof NotFoundError ||
					/not found/i.test(err.message)
				) {
					try {
						const direct = await Airline.findByPk(airlineId, {
							raw: true,
						});
						logger.warn(
							`Airline ${airlineId} not found via service; direct lookup result: ${
								direct === null ? 'null' : 'found'
							}`
						);
					} catch (lookupErr) {
						logger.warn(
							'Direct Airline.findByPk lookup failed:',
							lookupErr
						);
					}
					return sendNotFound(res, 'Airline not found');
				}
				throw err;
			}
			const { service_packages } = body;
			// Remove service_packages from update payload before updating airline fields
			const { service_packages: _sp, ...updateData } = body;

			let updatedAirline;
			try {
				updatedAirline = await adminService.updateAirline(
					airlineId,
					updateData
				);
			} catch (err) {
				if (
					err instanceof NotFoundError ||
					/not found/i.test(err.message)
				) {
					return sendNotFound(res, 'Airline not found');
				}
				throw err;
			}

			// If service_packages provided, update them (upsert/delete) in a transaction
			if (Array.isArray(service_packages)) {
				await adminService.updateServicePackagesForAirline(
					airlineId,
					service_packages
				);
			}

			// Return refreshed airline details (includes service_packages)
			const data = await adminService.getAirlineDetails(parseInt(id));
			return sendSuccess(res, 'Airline updated successfully', data);
		} catch (error) {
			logger.error('Error in updateAirline controller:', error);
			next(error);
		}
	}

	async updateAirlineServicePackages(req, res, next) {
		try {
			const { id } = req.params;
			const { service_packages } = req.body;

			const airlineId = parseInt(id);

			// Validate payload
			if (!Array.isArray(service_packages)) {
				return sendError(res, 'service_packages must be an array');
			}

			// Ensure airline exists
			try {
				await adminService.getAirline(airlineId);
			} catch (err) {
				if (
					err instanceof NotFoundError ||
					/not found/i.test(err.message)
				) {
					return sendNotFound(res, 'Airline not found');
				}
				throw err;
			}

			// Delegate to adminService to apply updates (upsert/delete)
			const updated = await adminService.updateServicePackagesForAirline(
				airlineId,
				service_packages
			);

			// Return refreshed airline details
			const data = await adminService.getAirlineDetails(airlineId);
			return sendSuccess(
				res,
				'Service packages updated successfully',
				data
			);
		} catch (error) {
			logger.error(
				'Error in updateAirlineServicePackages controller:',
				error
			);
			next(error);
		}
	}

	async deleteAirline(req, res, next) {
		try {
			const { id } = req.params;
			await adminService.deleteAirline(parseInt(id));
			return sendSuccess(res, 'Airline deleted successfully');
		} catch (error) {
			logger.error('Error in deleteAirline controller:', error);
			next(error);
		}
	}

	// Airports Management
	async getAirports(req, res, next) {
		try {
			const page = parseInt(req.query.page) || 1;
			const limit = parseInt(req.query.limit) || 10;
			const {
				search,
				airport_code,
				airport_name,
				city,
				airport_type,
				country_id,
			} = req.query;

			const filters = {};
			if (search) filters.search = search;
			if (airport_code) filters.airport_code = airport_code;
			if (airport_name) filters.airport_name = airport_name;
			if (city) filters.city = city;
			if (airport_type) filters.airport_type = airport_type;
			if (country_id) filters.country_id = parseInt(country_id);

			const result = await adminService.getAirports(filters, page, limit);
			return sendPaginated(
				res,
				'Airports retrieved successfully',
				result.data,
				result.pagination
			);
		} catch (error) {
			logger.error('Error in getAirports controller:', error);
			next(error);
		}
	}

	async getAirport(req, res, next) {
		try {
			const { id } = req.params;
			const airport = await adminService.getAirport(parseInt(id));
			return sendSuccess(res, 'Airport retrieved successfully', airport);
		} catch (error) {
			logger.error('Error in getAirport controller:', error);
			next(error);
		}
	}

	async createAirport(req, res, next) {
		try {
			const airportData = req.body;
			const newAirport = await adminService.createAirport(airportData);
			return sendSuccess(
				res,
				'Airport created successfully',
				newAirport,
				201
			);
		} catch (error) {
			logger.error('Error in createAirport controller:', error);
			next(error);
		}
	}

	async updateAirport(req, res, next) {
		try {
			const { id } = req.params;
			const updateData = req.body;
			const updatedAirport = await adminService.updateAirport(
				parseInt(id),
				updateData
			);
			return sendSuccess(
				res,
				'Airport updated successfully',
				updatedAirport
			);
		} catch (error) {
			logger.error('Error in updateAirport controller:', error);
			next(error);
		}
	}

	async deleteAirport(req, res, next) {
		try {
			const { id } = req.params;
			await adminService.deleteAirport(parseInt(id));
			return sendSuccess(res, 'Airport deleted successfully');
		} catch (error) {
			logger.error('Error in deleteAirport controller:', error);
			next(error);
		}
	}

	// Countries Management
	async getCountries(req, res, next) {
		try {
			const page = parseInt(req.query.page) || 1;
			const limit = parseInt(req.query.limit) || 10;
			const search = req.query.search;

			const filters = {};
			if (search) filters.search = search;

			const result = await adminService.getCountries(
				filters,
				page,
				limit
			);
			return sendPaginated(
				res,
				'Countries retrieved successfully',
				result.data,
				result.pagination
			);
		} catch (error) {
			logger.error('Error in getCountries controller:', error);
			next(error);
		}
	}

	async getCountry(req, res, next) {
		try {
			const { id } = req.params;
			const country = await adminService.getCountry(parseInt(id));
			return sendSuccess(res, 'Country retrieved successfully', country);
		} catch (error) {
			logger.error('Error in getCountry controller:', error);
			next(error);
		}
	}

	async createCountry(req, res, next) {
		try {
			const countryData = req.body;
			const newCountry = await adminService.createCountry(countryData);
			return sendSuccess(
				res,
				'Country created successfully',
				newCountry,
				201
			);
		} catch (error) {
			logger.error('Error in createCountry controller:', error);
			next(error);
		}
	}

	async updateCountry(req, res, next) {
		try {
			const { id } = req.params;
			const updateData = req.body;
			const updatedCountry = await adminService.updateCountry(
				parseInt(id),
				updateData
			);
			return sendSuccess(
				res,
				'Country updated successfully',
				updatedCountry
			);
		} catch (error) {
			logger.error('Error in updateCountry controller:', error);
			next(error);
		}
	}

	async deleteCountry(req, res, next) {
		try {
			const { id } = req.params;
			await adminService.deleteCountry(parseInt(id));
			return sendSuccess(res, 'Country deleted successfully');
		} catch (error) {
			logger.error('Error in deleteCountry controller:', error);
			next(error);
		}
	}

	// Aircraft Management
	async getAircraft(req, res, next) {
		try {
			const page = parseInt(req.query.page) || 1;
			const limit = parseInt(req.query.limit) || 10;
			const { search, aircraft_id, model, airline_id, aircraft_type } =
				req.query;

			const filters = {};
			if (search) filters.search = search;
			if (aircraft_id) filters.aircraft_id = parseInt(aircraft_id);
			if (model) filters.model = model;
			if (airline_id) filters.airline_id = parseInt(airline_id);
			if (aircraft_type) filters.aircraft_type = aircraft_type;

			const result = await adminService.getAircraft(filters, page, limit);
			return sendPaginated(
				res,
				'Aircraft retrieved successfully',
				result.data,
				result.pagination
			);
		} catch (error) {
			logger.error('Error in getAircraft controller:', error);
			next(error);
		}
	}

	async getAircraftById(req, res, next) {
		try {
			const { id } = req.params;
			const aircraft = await adminService.getAircraftById(parseInt(id));
			return sendSuccess(
				res,
				'Aircraft retrieved successfully',
				aircraft
			);
		} catch (error) {
			logger.error('Error in getAircraftById controller:', error);
			next(error);
		}
	}

	async createAircraft(req, res, next) {
		try {
			const aircraftData = req.body;
			const newAircraft = await adminService.createAircraft(aircraftData);
			return sendSuccess(
				res,
				'Aircraft created successfully',
				newAircraft,
				201
			);
		} catch (error) {
			logger.error('Error in createAircraft controller:', error);
			next(error);
		}
	}

	async updateAircraft(req, res, next) {
		try {
			const { id } = req.params;
			const updateData = req.body;
			const updatedAircraft = await adminService.updateAircraft(
				parseInt(id),
				updateData
			);
			return sendSuccess(
				res,
				'Aircraft updated successfully',
				updatedAircraft
			);
		} catch (error) {
			logger.error('Error in updateAircraft controller:', error);
			next(error);
		}
	}

	async deleteAircraft(req, res, next) {
		try {
			const { id } = req.params;
			await adminService.deleteAircraft(parseInt(id));
			return sendSuccess(res, 'Aircraft deleted successfully');
		} catch (error) {
			logger.error('Error in deleteAircraft controller:', error);
			next(error);
		}
	}

	// Passengers Management
	async getPassengers(req, res, next) {
		try {
			const page = parseInt(req.query.page) || 1;
			const limit = parseInt(req.query.limit) || 10;
			const {
				search,
				passenger_id,
				first_name,
				last_name,
				title,
				passport_number,
				citizen_id,
				date_of_birth,
				nationality,
				passenger_type,
			} = req.query;

			const filters = {};
			if (search) filters.search = search;
			if (passenger_id) filters.passenger_id = parseInt(passenger_id);
			if (first_name) filters.first_name = first_name;
			if (last_name) filters.last_name = last_name;
			if (title) filters.title = title;
			if (passport_number) filters.passport_number = passport_number;
			if (citizen_id) filters.citizen_id = citizen_id;
			if (date_of_birth) filters.date_of_birth = date_of_birth;
			if (nationality) filters.nationality = nationality;
			if (passenger_type) filters.passenger_type = passenger_type;

			const result = await adminService.getPassengers(
				filters,
				page,
				limit
			);
			return sendPaginated(
				res,
				'Passengers retrieved successfully',
				result.data,
				result.pagination
			);
		} catch (error) {
			logger.error('Error in getPassengers controller:', error);
			next(error);
		}
	}

	async getPassenger(req, res, next) {
		try {
			const { id } = req.params;
			const passenger = await adminService.getPassenger(parseInt(id));
			return sendSuccess(
				res,
				'Passenger retrieved successfully',
				passenger
			);
		} catch (error) {
			logger.error('Error in getPassenger controller:', error);
			next(error);
		}
	}

	async createPassenger(req, res, next) {
		try {
			const passengerData = req.body;
			const newPassenger = await adminService.createPassenger(
				passengerData
			);
			return sendSuccess(
				res,
				'Passenger created successfully',
				newPassenger,
				201
			);
		} catch (error) {
			logger.error('Error in createPassenger controller:', error);
			next(error);
		}
	}

	async updatePassenger(req, res, next) {
		try {
			const { id } = req.params;
			const updateData = req.body;
			const updatedPassenger = await adminService.updatePassenger(
				parseInt(id),
				updateData
			);
			return sendSuccess(
				res,
				'Passenger updated successfully',
				updatedPassenger
			);
		} catch (error) {
			logger.error('Error in updatePassenger controller:', error);
			next(error);
		}
	}

	async deletePassenger(req, res, next) {
		try {
			const { id } = req.params;
			await adminService.deletePassenger(parseInt(id));
			return sendSuccess(res, 'Passenger deleted successfully');
		} catch (error) {
			logger.error('Error in deletePassenger controller:', error);
			next(error);
		}
	}

	// Promotions Management
	async getPromotions(req, res, next) {
		try {
			const page = parseInt(req.query.page) || 1;
			const limit = parseInt(req.query.limit) || 10;
			const {
				search,
				promotion_code,
				description,
				discount_type,
				is_active,
			} = req.query;

			const filters = {};
			if (search) filters.search = search;
			if (promotion_code) filters.promotion_code = promotion_code;
			if (description) filters.description = description;
			if (discount_type) filters.discount_type = discount_type;
			if (is_active !== undefined)
				filters.is_active = is_active === 'true';

			const result = await adminService.getPromotions(
				filters,
				page,
				limit
			);
			return sendPaginated(
				res,
				'Promotions retrieved successfully',
				result.data,
				result.pagination
			);
		} catch (error) {
			logger.error('Error in getPromotions controller:', error);
			next(error);
		}
	}

	async getPromotion(req, res, next) {
		try {
			const { id } = req.params;
			const promotion = await adminService.getPromotion(parseInt(id));
			return sendSuccess(
				res,
				'Promotion retrieved successfully',
				promotion
			);
		} catch (error) {
			logger.error('Error in getPromotion controller:', error);
			next(error);
		}
	}

	async createPromotion(req, res, next) {
		try {
			const promotionData = req.body;
			const newPromotion = await adminService.createPromotion(
				promotionData
			);
			return sendSuccess(
				res,
				'Promotion created successfully',
				newPromotion,
				201
			);
		} catch (error) {
			logger.error('Error in createPromotion controller:', error);
			next(error);
		}
	}

	async updatePromotion(req, res, next) {
		try {
			const { id } = req.params;
			const updateData = req.body;
			const updatedPromotion = await adminService.updatePromotion(
				parseInt(id),
				updateData
			);
			return sendSuccess(
				res,
				'Promotion updated successfully',
				updatedPromotion
			);
		} catch (error) {
			logger.error('Error in updatePromotion controller:', error);
			next(error);
		}
	}

	async deletePromotion(req, res, next) {
		try {
			const { id } = req.params;
			await adminService.deletePromotion(parseInt(id));
			return sendSuccess(res, 'Promotion deleted successfully');
		} catch (error) {
			logger.error('Error in deletePromotion controller:', error);
			next(error);
		}
	}

	// Bookings Management
	async getBookings(req, res, next) {
		try {
			const page = parseInt(req.query.page) || 1;
			const limit = parseInt(req.query.limit) || 10;
			const search = req.query.search;
			const status = req.query.status;
			const payment_status = req.query.payment_status;
			const date_from = req.query.date_from;
			const date_to = req.query.date_to;

			const filters = {};
			if (search) filters.search = search;
			if (status) filters.status = status;
			if (payment_status) filters.payment_status = payment_status;
			if (date_from) filters.date_from = date_from;
			if (date_to) filters.date_to = date_to;

			const result = await adminService.getBookings(filters, page, limit);
			return sendPaginated(
				res,
				'Bookings retrieved successfully',
				result.data,
				result.pagination
			);
		} catch (error) {
			logger.error('Error in getBookings controller:', error);
			next(error);
		}
	}

	async getBooking(req, res, next) {
		try {
			const { id } = req.params;
			const booking = await adminService.getBooking(parseInt(id));
			return sendSuccess(res, 'Booking retrieved successfully', booking);
		} catch (error) {
			logger.error('Error in getBooking controller:', error);
			next(error);
		}
	}

	async updateBookingStatus(req, res, next) {
		try {
			const { id } = req.params;
			const {
				status,
				payment_status,
				cancellation_reason,
				reject_reason,
				action,
			} = req.body;

			const adminUserId = req.user ? req.user.user_id : null;

			// Get the booking before updating to get email and check previous status
			const currentBooking = await Booking.findByPk(parseInt(id));
			if (!currentBooking) {
				return sendNotFound(res, 'Booking not found');
			}

			// Handle cancellation rejection if action is 'reject_cancellation'
			if (action === 'reject_cancellation') {
				// Mark the cancellation as explicitly rejected by admin
				const updatedBooking = await adminService.updateBookingStatus(
					parseInt(id),
					{
						status: 'cancellation_rejected',
						cancellation_reason:
							reject_reason ||
							'Your cancellation request was denied by administration.',
						cancellation_processed: true,
						cancellation_processed_at: new Date(),
						cancellation_processed_by: adminUserId,
					}
				);

				// Send email notification about rejection
				if (currentBooking.contact_email) {
					await emailService.sendCancellationRejection(
						currentBooking.contact_email,
						{
							booking_id: currentBooking.booking_id,
							user_id: currentBooking.user_id,
							booking_reference: currentBooking.booking_reference,
							reason:
								reject_reason ||
								'Your cancellation request was denied by administration.',
						}
					);
				}

				return sendSuccess(
					res,
					'Cancellation request rejected successfully',
					updatedBooking
				);
			} else {
				// Regular status update
				const updatePayload = {
					status,
					payment_status,
					cancellation_reason,
				};

				// If admin is explicitly cancelling, mark as processed by admin
				if (status === 'cancelled') {
					updatePayload.cancellation_processed = true;
					updatePayload.cancellation_processed_at = new Date();
					updatePayload.cancellation_processed_by = adminUserId;
				}

				const updatedBooking = await adminService.updateBookingStatus(
					parseInt(id),
					updatePayload
				);

				// If booking was cancelled, try to release allocated seats
				if (updatedBooking && updatedBooking.status === 'cancelled') {
					try {
						const seatAllocationService = require('../services/seatAllocationService');
						// fetch booking details to get seat ids
						const bookingDetails =
							await require('../models').BookingDetail.findAll({
								where: {
									booking_id: updatedBooking.booking_id,
								},
								attributes: ['seat_id'],
							});
						const seatIds = bookingDetails
							.map((d) => d.seat_id)
							.filter(Boolean);
						if (seatIds.length > 0) {
							await seatAllocationService.releaseSeats(seatIds);
							logger.info(
								`Released ${seatIds.length} seats for admin-cancelled booking ${updatedBooking.booking_id}`
							);
						}
					} catch (releaseErr) {
						logger.warn(
							'Failed to release seats for admin-cancelled booking:',
							releaseErr
						);
					}
				}

				// Send email notifications based on new status
				try {
					if (currentBooking && currentBooking.contact_email) {
						if (
							status === 'confirmed' &&
							typeof emailService.sendBookingConfirmation ===
								'function'
						) {
							await emailService.sendBookingConfirmation(
								currentBooking.contact_email,
								{
									booking_id: currentBooking.booking_id,
									user_id: currentBooking.user_id,
									booking_reference:
										currentBooking.booking_reference,
									total_amount: currentBooking.total_amount,
								}
							);
						} else if (
							status === 'cancelled' &&
							typeof emailService.sendCancellationNotification ===
								'function'
						) {
							await emailService.sendCancellationNotification(
								currentBooking.contact_email,
								{
									booking_id: currentBooking.booking_id,
									user_id: currentBooking.user_id,
									booking_reference:
										currentBooking.booking_reference,
									reason:
										cancellation_reason ||
										'Your booking was cancelled by administration.',
								}
							);
						}
					}
				} catch (emailErr) {
					logger.warn(
						'Failed to send admin status update email:',
						emailErr
					);
				}
				return sendSuccess(
					res,
					'Booking status updated successfully',
					updatedBooking
				);
			}
		} catch (error) {
			logger.error('Error in updateBookingStatus controller:', error);
			next(error);
		}
	}

	async deleteBooking(req, res, next) {
		try {
			const { id } = req.params;
			await adminService.deleteBooking(parseInt(id));
			return sendSuccess(res, 'Booking deleted successfully');
		} catch (error) {
			logger.error('Error in deleteBooking controller:', error);
			next(error);
		}
	}

	// Users Management
	async getUsers(req, res, next) {
		try {
			const page = parseInt(req.query.page) || 1;
			const limit = parseInt(req.query.limit) || 10;
			const search = req.query.search;
			const is_active = req.query.is_active;

			const filters = {};
			if (search) filters.search = search;
			if (is_active !== undefined)
				filters.is_active = is_active === 'true';

			const result = await adminService.getUsers(filters, page, limit);
			return sendPaginated(
				res,
				'Users retrieved successfully',
				result.data,
				result.pagination
			);
		} catch (error) {
			logger.error('Error in getUsers controller:', error);
			next(error);
		}
	}

	async getUser(req, res, next) {
		try {
			const { id } = req.params;
			const user = await adminService.getUser(parseInt(id));
			return sendSuccess(res, 'User retrieved successfully', user);
		} catch (error) {
			logger.error('Error in getUser controller:', error);
			next(error);
		}
	}

	async updateUser(req, res, next) {
		try {
			const { id } = req.params;
			const updateData = req.body;
			const updatedUser = await adminService.updateUser(
				parseInt(id),
				updateData
			);
			return sendSuccess(res, 'User updated successfully', updatedUser);
		} catch (error) {
			logger.error('Error in updateUser controller:', error);
			next(error);
		}
	}

	async updateUserStatus(req, res, next) {
		try {
			const { id } = req.params;
			const { is_active } = req.body;
			const updatedUser = await adminService.updateUserStatus(
				parseInt(id),
				is_active
			);
			return sendSuccess(
				res,
				'User status updated successfully',
				updatedUser
			);
		} catch (error) {
			logger.error('Error in updateUserStatus controller:', error);
			next(error);
		}
	}

	// Statistics and Reports
	async getOverviewStats(req, res, next) {
		try {
			const stats = await adminService.getOverviewStats();
			return sendSuccess(
				res,
				'Overview statistics retrieved successfully',
				stats
			);
		} catch (error) {
			logger.error('Error in getOverviewStats controller:', error);
			next(error);
		}
	}

	async getRevenueStats(req, res, next) {
		try {
			const period = req.query.period || 'month'; // day, week, month, year
			const stats = await adminService.getRevenueStats(period);
			return sendSuccess(
				res,
				'Revenue statistics retrieved successfully',
				stats
			);
		} catch (error) {
			logger.error('Error in getRevenueStats controller:', error);
			next(error);
		}
	}

	async getBookingStats(req, res, next) {
		try {
			const period = req.query.period || 'month';
			const stats = await adminService.getBookingStats(period);
			return sendSuccess(
				res,
				'Booking statistics retrieved successfully',
				stats
			);
		} catch (error) {
			logger.error('Error in getBookingStats controller:', error);
			next(error);
		}
	}

	async getAirlineStats(req, res, next) {
		try {
			const stats = await adminService.getAirlineStats();
			return sendSuccess(
				res,
				'Airline statistics retrieved successfully',
				stats
			);
		} catch (error) {
			logger.error('Error in getAirlineStats controller:', error);
			next(error);
		}
	}

	async getPassengerStats(req, res, next) {
		try {
			const period = req.query.period || 'month';
			const stats = await adminService.getPassengerStats(period);
			return sendSuccess(
				res,
				'Passenger statistics retrieved successfully',
				stats
			);
		} catch (error) {
			logger.error('Error in getPassengerStats controller:', error);
			next(error);
		}
	}

	async getBaggageStats(req, res, next) {
		try {
			const stats = await adminService.getBaggageStats();
			return sendSuccess(
				res,
				'Baggage statistics retrieved successfully',
				stats
			);
		} catch (error) {
			logger.error('Error in getBaggageStats controller:', error);
			next(error);
		}
	}

	// Dashboard APIs
	async getWeeklyRevenueStats(req, res, next) {
		try {
			const stats = await adminService.getWeeklyRevenueStats();
			return sendSuccess(
				res,
				'Weekly revenue statistics retrieved successfully',
				stats
			);
		} catch (error) {
			logger.error('Error in getWeeklyRevenueStats controller:', error);
			next(error);
		}
	}

	async getMonthlyRevenueStats(req, res, next) {
		try {
			const stats = await adminService.getMonthlyRevenueStats();
			return sendSuccess(
				res,
				'Monthly revenue statistics retrieved successfully',
				stats
			);
		} catch (error) {
			logger.error('Error in getMonthlyRevenueStats controller:', error);
			next(error);
		}
	}

	async getTodayBookingStats(req, res, next) {
		try {
			const stats = await adminService.getTodayBookingStats();
			return sendSuccess(
				res,
				'Today booking statistics retrieved successfully',
				stats
			);
		} catch (error) {
			logger.error('Error in getTodayBookingStats controller:', error);
			next(error);
		}
	}

	async getUserStatistics(req, res, next) {
		try {
			const stats = await adminService.getUserStatistics();
			return sendSuccess(
				res,
				'User statistics retrieved successfully',
				stats
			);
		} catch (error) {
			logger.error('Error in getUserStatistics controller:', error);
			next(error);
		}
	}

	async getAirlineMarketShare(req, res, next) {
		try {
			const period = req.query.period || 'month';
			const stats = await adminService.getAirlineMarketShare(period);
			return sendSuccess(
				res,
				'Airline market share statistics retrieved successfully',
				stats
			);
		} catch (error) {
			logger.error('Error in getAirlineMarketShare controller:', error);
			next(error);
		}
	}

	async exportAirlineMarketShareExcel(req, res, next) {
		try {
			const period = req.query.period || 'month';
			const stats = await adminService.getAirlineMarketShare(period);

			const excelBuffer = ExcelExportService.exportAirlineMarketShare(
				stats,
				period
			);

			// Set response headers for file download
			const filename = `bao-cao-thi-phan-hang-hang-khong-${period}-${
				new Date().toISOString().split('T')[0]
			}.xlsx`;

			res.setHeader(
				'Content-Type',
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
			);
			res.setHeader(
				'Content-Disposition',
				`attachment; filename="${filename}"`
			);
			res.setHeader('Content-Length', excelBuffer.length);

			return res.send(excelBuffer);
		} catch (error) {
			logger.error(
				'Error in exportAirlineMarketShareExcel controller:',
				error
			);
			next(error);
		}
	}

	async getRevenueTrend(req, res, next) {
		try {
			const month =
				parseInt(req.query.month) || new Date().getMonth() + 1;
			const year = parseInt(req.query.year) || new Date().getFullYear();

			const stats = await adminService.getRevenueTrend(month, year);
			return sendSuccess(
				res,
				'Revenue trend statistics retrieved successfully',
				stats
			);
		} catch (error) {
			logger.error('Error in getRevenueTrend controller:', error);
			next(error);
		}
	}

	async exportRevenueTrendExcel(req, res, next) {
		try {
			const month =
				parseInt(req.query.month) || new Date().getMonth() + 1;
			const year = parseInt(req.query.year) || new Date().getFullYear();

			const stats = await adminService.getRevenueTrend(month, year);
			const excelBuffer = ExcelExportService.exportRevenueTrend(
				stats,
				month,
				year
			);

			// Set response headers for file download
			const filename = `bao-cao-doanh-thu-thang-${month}-${year}-${
				new Date().toISOString().split('T')[0]
			}.xlsx`;

			res.setHeader(
				'Content-Type',
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
			);
			res.setHeader(
				'Content-Disposition',
				`attachment; filename="${filename}"`
			);
			res.setHeader('Content-Length', excelBuffer.length);

			return res.send(excelBuffer);
		} catch (error) {
			logger.error('Error in exportRevenueTrendExcel controller:', error);
			next(error);
		}
	}

	async getBookingStatistics(req, res, next) {
		try {
			const period = req.query.period || 'month';
			const stats = await adminService.getBookingStatistics(period);
			return sendSuccess(
				res,
				'Booking statistics retrieved successfully',
				stats
			);
		} catch (error) {
			logger.error('Error in getBookingStatistics controller:', error);
			next(error);
		}
	}

	async exportBookingStatisticsExcel(req, res, next) {
		try {
			const period = req.query.period || 'month';
			const stats = await adminService.getBookingStatistics(period);
			const excelBuffer = ExcelExportService.exportBookingStats(
				stats,
				period
			);

			// Set response headers for file download
			const filename = `bao-cao-dat-cho-${period}-${
				new Date().toISOString().split('T')[0]
			}.xlsx`;

			res.setHeader(
				'Content-Type',
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
			);
			res.setHeader(
				'Content-Disposition',
				`attachment; filename="${filename}"`
			);
			res.setHeader('Content-Length', excelBuffer.length);

			return res.send(excelBuffer);
		} catch (error) {
			logger.error(
				'Error in exportBookingStatisticsExcel controller:',
				error
			);
			next(error);
		}
	}

	async getBaggageServiceStatistics(req, res, next) {
		try {
			const period = req.query.period || 'month';
			const stats = await adminService.getBaggageServiceStatistics(
				period
			);
			return sendSuccess(
				res,
				'Baggage service statistics retrieved successfully',
				stats
			);
		} catch (error) {
			logger.error(
				'Error in getBaggageServiceStatistics controller:',
				error
			);
			next(error);
		}
	}

	async exportBaggageServiceStatisticsExcel(req, res, next) {
		try {
			const period = req.query.period || 'month';
			const stats = await adminService.getBaggageServiceStatistics(
				period
			);

			// Generate Excel file
			const excelBuffer = ExcelExportService.exportBaggageServiceStats(
				stats,
				period
			);

			// Set response headers for file download
			const filename = `bao_cao_dich_vu_hanh_ly_${period}_${
				new Date().toISOString().split('T')[0]
			}.xlsx`;

			res.setHeader(
				'Content-Type',
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
			);
			res.setHeader(
				'Content-Disposition',
				`attachment; filename="${filename}"`
			);
			res.setHeader('Content-Length', excelBuffer.length);

			return res.send(excelBuffer);
		} catch (error) {
			logger.error(
				'Error in exportBaggageServiceStatisticsExcel controller:',
				error
			);
			next(error);
		}
	}

	// Travel Classes Management
	async getTravelClasses(req, res, next) {
		try {
			const page = parseInt(req.query.page) || 1;
			const limit = parseInt(req.query.limit) || 10;
			const search = req.query.search;

			const filters = {};
			if (search) filters.search = search;

			const result = await adminService.getTravelClasses(
				filters,
				page,
				limit
			);
			return sendPaginated(
				res,
				'Travel classes retrieved successfully',
				result.data,
				result.pagination
			);
		} catch (error) {
			logger.error('Error in getTravelClasses controller:', error);
			next(error);
		}
	}

	async getTravelClass(req, res, next) {
		try {
			const { id } = req.params;
			const travelClass = await adminService.getTravelClass(parseInt(id));
			return sendSuccess(
				res,
				'Travel class retrieved successfully',
				travelClass
			);
		} catch (error) {
			logger.error('Error in getTravelClass controller:', error);
			next(error);
		}
	}

	async createTravelClass(req, res, next) {
		try {
			const travelClassData = req.body;
			const newTravelClass = await adminService.createTravelClass(
				travelClassData
			);
			return sendSuccess(
				res,
				'Travel class created successfully',
				newTravelClass,
				201
			);
		} catch (error) {
			logger.error('Error in createTravelClass controller:', error);
			next(error);
		}
	}

	async updateTravelClass(req, res, next) {
		try {
			const { id } = req.params;
			const updateData = req.body;
			const updatedTravelClass = await adminService.updateTravelClass(
				parseInt(id),
				updateData
			);
			return sendSuccess(
				res,
				'Travel class updated successfully',
				updatedTravelClass
			);
		} catch (error) {
			logger.error('Error in updateTravelClass controller:', error);
			next(error);
		}
	}

	async deleteTravelClass(req, res, next) {
		try {
			const { id } = req.params;
			await adminService.deleteTravelClass(parseInt(id));
			return sendSuccess(res, 'Travel class deleted successfully');
		} catch (error) {
			logger.error('Error in deleteTravelClass controller:', error);
			next(error);
		}
	}

	// Baggage Options Management
	async getBaggageOptions(req, res, next) {
		try {
			const page = parseInt(req.query.page) || 1;
			const limit = parseInt(req.query.limit) || 10;
			const search = req.query.search;
			const airline_id = req.query.airline_id;

			const filters = {};
			if (search) filters.search = search;
			if (airline_id) filters.airline_id = parseInt(airline_id);

			const result = await adminService.getBaggageOptions(
				filters,
				page,
				limit
			);
			return sendPaginated(
				res,
				'Baggage options retrieved successfully',
				result.data,
				result.pagination
			);
		} catch (error) {
			logger.error('Error in getBaggageOptions controller:', error);
			next(error);
		}
	}

	async getBaggageOption(req, res, next) {
		try {
			const { id } = req.params;
			const baggageOption = await adminService.getBaggageOption(
				parseInt(id)
			);
			return sendSuccess(
				res,
				'Baggage option retrieved successfully',
				baggageOption
			);
		} catch (error) {
			logger.error('Error in getBaggageOption controller:', error);
			next(error);
		}
	}

	async createBaggageOption(req, res, next) {
		try {
			const baggageOptionData = req.body;
			const newBaggageOption = await adminService.createBaggageOption(
				baggageOptionData
			);
			return sendSuccess(
				res,
				'Baggage option created successfully',
				newBaggageOption,
				201
			);
		} catch (error) {
			logger.error('Error in createBaggageOption controller:', error);
			next(error);
		}
	}

	async updateBaggageOption(req, res, next) {
		try {
			const { id } = req.params;
			const updateData = req.body;
			const updatedBaggageOption = await adminService.updateBaggageOption(
				parseInt(id),
				updateData
			);
			return sendSuccess(
				res,
				'Baggage option updated successfully',
				updatedBaggageOption
			);
		} catch (error) {
			logger.error('Error in updateBaggageOption controller:', error);
			next(error);
		}
	}

	async deleteBaggageOption(req, res, next) {
		try {
			const { id } = req.params;
			await adminService.deleteBaggageOption(parseInt(id));
			return sendSuccess(res, 'Baggage option deleted successfully');
		} catch (error) {
			logger.error('Error in deleteBaggageOption controller:', error);
			next(error);
		}
	}

	// Meal Options Management
	async getMealOptions(req, res, next) {
		try {
			const page = parseInt(req.query.page) || 1;
			const limit = parseInt(req.query.limit) || 10;
			const search = req.query.search;
			const airline_id = req.query.airline_id;
			const is_vegetarian = req.query.is_vegetarian;
			const is_halal = req.query.is_halal;

			const filters = {};
			if (search) filters.search = search;
			if (airline_id) filters.airline_id = parseInt(airline_id);
			if (is_vegetarian !== undefined)
				filters.is_vegetarian = is_vegetarian === 'true';
			if (is_halal !== undefined) filters.is_halal = is_halal === 'true';

			const result = await adminService.getMealOptions(
				filters,
				page,
				limit
			);
			return sendPaginated(
				res,
				'Meal options retrieved successfully',
				result.data,
				result.pagination
			);
		} catch (error) {
			logger.error('Error in getMealOptions controller:', error);
			next(error);
		}
	}

	async getMealOption(req, res, next) {
		try {
			const { id } = req.params;
			const mealOption = await adminService.getMealOption(parseInt(id));
			return sendSuccess(
				res,
				'Meal option retrieved successfully',
				mealOption
			);
		} catch (error) {
			logger.error('Error in getMealOption controller:', error);
			next(error);
		}
	}

	async createMealOption(req, res, next) {
		try {
			const mealOptionData = req.body;
			const newMealOption = await adminService.createMealOption(
				mealOptionData
			);
			return sendSuccess(
				res,
				'Meal option created successfully',
				newMealOption,
				201
			);
		} catch (error) {
			logger.error('Error in createMealOption controller:', error);
			next(error);
		}
	}

	async updateMealOption(req, res, next) {
		try {
			const { id } = req.params;
			const updateData = req.body;
			const updatedMealOption = await adminService.updateMealOption(
				parseInt(id),
				updateData
			);
			return sendSuccess(
				res,
				'Meal option updated successfully',
				updatedMealOption
			);
		} catch (error) {
			logger.error('Error in updateMealOption controller:', error);
			next(error);
		}
	}

	async deleteMealOption(req, res, next) {
		try {
			const { id } = req.params;
			await adminService.deleteMealOption(parseInt(id));
			return sendSuccess(res, 'Meal option deleted successfully');
		} catch (error) {
			logger.error('Error in deleteMealOption controller:', error);
			next(error);
		}
	}

	// Flight Management with enhanced information
	async getAllFlights(req, res, next) {
		try {
			const page = parseInt(req.query.page) || 1;
			const limit = parseInt(req.query.limit) || 10;
			const {
				status,
				airline_id,
				departure_airport_code,
				arrival_airport_code,
				departure_date,
			} = req.query;

			const whereClause = {};
			if (status) whereClause.status = status;
			if (airline_id) whereClause.airline_id = airline_id;
			if (departure_airport_code) {
				const departureAirport = await Airport.findOne({
					where: { airport_code: departure_airport_code },
				});
				if (departureAirport)
					whereClause.departure_airport_id =
						departureAirport.airport_id;
			}
			if (arrival_airport_code) {
				const arrivalAirport = await Airport.findOne({
					where: { airport_code: arrival_airport_code },
				});
				if (arrivalAirport)
					whereClause.arrival_airport_id = arrivalAirport.airport_id;
			}
			if (departure_date) {
				const startDate = new Date(departure_date);
				const endDate = new Date(startDate);
				endDate.setDate(endDate.getDate() + 1);
				whereClause.departure_time = {
					[require('sequelize').Op.gte]: startDate,
					[require('sequelize').Op.lt]: endDate,
				};
			}

			const offset = (page - 1) * limit;

			const { count, rows: flights } = await Flight.findAndCountAll({
				where: whereClause,
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
						model: Aircraft,
						attributes: [
							'aircraft_id',
							'model',
							'total_seats',
							'business_seats',
							'economy_seats',
							'aircraft_type',
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
							'airport_type',
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
							'airport_type',
						],
					},
					{
						model: FlightSeat,
						attributes: [
							'seat_id',
							'class_id',
							'seat_number',
							'price',
							'is_available',
						],
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
				limit,
				offset,
				order: [['departure_time', 'ASC']],
			});

			// Enhance flights with seat counts and pricing information
			const enhancedFlights = await Promise.all(
				flights.map(async (flight) => {
					// Calculate seat counts by class
					const seatCounts = {
						business: { total: 0, booked: 0, available: 0 },
						economy: { total: 0, booked: 0, available: 0 },
					};

					// Calculate pricing by class
					const pricing = {
						business: { min: null, max: null, avg: null },
						economy: { min: null, max: null, avg: null },
					};

					flight.FlightSeats.forEach((seat) => {
						const classCode =
							seat.TravelClass?.class_code?.toLowerCase();
						if (classCode === 'business') {
							seatCounts.business.total++;
							if (seat.is_available) {
								seatCounts.business.available++;
							} else {
								seatCounts.business.booked++;
							}
						} else if (classCode === 'economy') {
							seatCounts.economy.total++;
							if (seat.is_available) {
								seatCounts.economy.available++;
							} else {
								seatCounts.economy.booked++;
							}
						}
					});

					// Get service package pricing
					const servicePackages =
						await ServicePackagePricingService.getServicePackages(
							flight.airline_id
						);
					const basePrice = 1000000; // Default base price for calculation

					return {
						flight_id: flight.flight_id,
						flight_number: flight.flight_number,
						airline: flight.Airline,
						aircraft: flight.Aircraft,
						departure_airport: flight.DepartureAirport,
						arrival_airport: flight.ArrivalAirport,
						departure_time: flight.departure_time,
						arrival_time: flight.arrival_time,
						status: flight.status,
						seat_counts: seatCounts,
						service_packages: servicePackages,
						base_pricing: {
							business: basePrice,
							economy: basePrice * 0.7, // Economy typically 70% of business
						},
						created_at: flight.created_at,
						updated_at: flight.updated_at,
					};
				})
			);

			const totalPages = Math.ceil(count / limit);

			return sendPaginated(res, 'Flights retrieved successfully', {
				flights: enhancedFlights,
				pagination: {
					currentPage: page,
					totalPages,
					totalItems: count,
					itemsPerPage: limit,
					hasNextPage: page < totalPages,
					hasPrevPage: page > 1,
				},
			});
		} catch (error) {
			logger.error('Error in getAllFlights controller:', error);
			next(error);
		}
	}

	// Service Package Management
	async getServicePackages(req, res, next) {
		try {
			const page = parseInt(req.query.page) || 1;
			const limit = parseInt(req.query.limit) || 10;
			const airline_id = req.query.airline_id;
			const class_type = req.query.class_type;
			const package_type = req.query.package_type;
			const is_active = req.query.is_active;

			const filters = {};
			if (airline_id) filters.airline_id = airline_id;
			if (class_type) filters.class_type = class_type;
			if (package_type) filters.package_type = package_type;
			if (is_active !== undefined)
				filters.is_active = is_active === 'true';

			const result = await adminService.getServicePackages(
				filters,
				page,
				limit
			);
			return sendPaginated(
				res,
				'Service packages retrieved successfully',
				result.data,
				result.pagination
			);
		} catch (error) {
			logger.error('Error in getServicePackages controller:', error);
			next(error);
		}
	}

	async getFlight(req, res, next) {
		try {
			const { id } = req.params;
			const flight = await Flight.findByPk(id, {
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
						model: Aircraft,
						attributes: [
							'aircraft_id',
							'model',
							'total_seats',
							'business_seats',
							'economy_seats',
							'aircraft_type',
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
							'airport_type',
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
							'airport_type',
						],
					},
					{
						model: FlightSeat,
						attributes: [
							'seat_id',
							'class_id',
							'seat_number',
							'price',
							'is_available',
						],
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
					{
						model: FlightBaggageService,
						attributes: [
							'baggage_service_id',
							'weight_kg',
							'price',
							'description',
							'is_active',
						],
					},
					{
						model: FlightMealService,
						attributes: [
							'meal_service_id',
							'meal_name',
							'meal_description',
							'price',
							'is_vegetarian',
							'is_halal',
							'is_active',
						],
					},
				],
			});

			if (!flight) {
				return sendNotFound(res, 'Flight not found');
			}

			// Return the persisted flight_type value from the DB only.
			const flightJson = flight.toJSON();

			return sendSuccess(res, 'Flight retrieved successfully', {
				flight: {
					...flightJson,
					flight_type: flightJson.flight_type,
				},
			});
		} catch (error) {
			logger.error('Error in getFlight controller:', error);
			next(error);
		}
	}

	// Flight Management
	async getFlights(req, res, next) {
		try {
			const page = parseInt(req.query.page) || 1;
			const limit = parseInt(req.query.limit) || 10;
			const {
				flight_number,
				airline_id,
				flight_type,
				status,
				departure_airport_id,
				arrival_airport_id,
				departure_time_from,
				departure_time_to,
				// support date-only and airport-code filters
				departure_date,
				departure_airport_code,
				arrival_airport_code,
				arrival_time_from,
				arrival_time_to,
			} = req.query;

			const filters = {};
			if (flight_number) filters.flight_number = flight_number;
			if (airline_id) filters.airline_id = parseInt(airline_id);
			if (flight_type) filters.flight_type = flight_type;
			if (status) filters.status = status;
			if (departure_airport_id)
				filters.departure_airport_id = parseInt(departure_airport_id);
			if (arrival_airport_id)
				filters.arrival_airport_id = parseInt(arrival_airport_id);
			// If client passed airport codes, resolve to IDs
			if (departure_airport_code) {
				const dep = await Airport.findOne({
					where: { airport_code: departure_airport_code },
					attributes: ['airport_id'],
				});
				if (!dep) {
					// no matching airport -> return empty paginated result
					return sendPaginated(
						res,
						'Flights retrieved successfully',
						[],
						{
							currentPage: page,
							totalPages: 0,
							totalItems: 0,
							itemsPerPage: limit,
							hasNextPage: false,
							hasPrevPage: false,
						}
					);
				}
				filters.departure_airport_id = dep.airport_id;
			}
			if (arrival_airport_code) {
				const arr = await Airport.findOne({
					where: { airport_code: arrival_airport_code },
					attributes: ['airport_id'],
				});
				if (!arr) {
					return sendPaginated(
						res,
						'Flights retrieved successfully',
						[],
						{
							currentPage: page,
							totalPages: 0,
							totalItems: 0,
							itemsPerPage: limit,
							hasNextPage: false,
							hasPrevPage: false,
						}
					);
				}
				filters.arrival_airport_id = arr.airport_id;
			}

			// Support a date-only filter `departure_date=YYYY-MM-DD` -> convert to from/to
			// Use Asia/Ho_Chi_Minh (UTC+7) calendar day so admin searches are intuitive
			if (departure_date) {
				// parse YYYY-MM-DD safely
				const parts = String(departure_date)
					.split('-')
					.map((p) => parseInt(p, 10));
				if (parts.length >= 3 && parts.every((n) => !isNaN(n))) {
					const [y, m, d] = parts;
					// Vietnam timezone offset from UTC in hours
					const TZ_OFFSET_HOURS = 7;
					// Compute UTC start for local midnight: equivalent to Date.UTC(y,m-1,d,0,0,0) - TZ_OFFSET
					const startUtcMs =
						Date.UTC(y, m - 1, d, 0, 0, 0) -
						TZ_OFFSET_HOURS * 3600 * 1000;
					const endUtcMs = startUtcMs + 24 * 3600 * 1000;
					const start = new Date(startUtcMs);
					const end = new Date(endUtcMs);
					filters.departure_time_from = start.toISOString();
					filters.departure_time_to = end.toISOString();
				} else {
					// invalid date format
					return sendError(
						res,
						'departure_date must be in YYYY-MM-DD format'
					);
				}
			} else {
				if (departure_time_from)
					filters.departure_time_from = departure_time_from;
				if (departure_time_to)
					filters.departure_time_to = departure_time_to;
			}
			if (arrival_time_from)
				filters.arrival_time_from = arrival_time_from;
			if (arrival_time_to) filters.arrival_time_to = arrival_time_to;

			const result = await adminService.getFlights(filters, page, limit);
			return sendPaginated(
				res,
				'Flights retrieved successfully',
				result.data,
				result.pagination
			);
		} catch (error) {
			logger.error('Error in getFlights controller:', error);
			next(error);
		}
	}

	async createFlight(req, res, next) {
		try {
			const {
				flight_number,
				airline_id,
				aircraft_id,
				departure_airport_id,
				arrival_airport_id,
				departure_time,
				arrival_time,
				status = 'scheduled',
				economy_price,
				business_price,
			} = req.body;

			// Auto-generate flight_number if not provided: <AIRLINE_CODE><5-digit sequence>
			let finalFlightNumber = flight_number;
			if (!finalFlightNumber) {
				const airline = await Airline.findByPk(airline_id, {
					attributes: ['airline_code'],
				});
				const code = (airline && airline.airline_code) || 'FL';
				// Find current count for this airline to generate a sequential code
				const count = await Flight.count({ where: { airline_id } });
				const seq = String(count + 1).padStart(5, '0');
				finalFlightNumber = `${code}${seq}`;
			}

			const flightData = {
				flight_number: finalFlightNumber,
				airline_id,
				aircraft_id,
				departure_airport_id,
				arrival_airport_id,
				departure_time,
				arrival_time,
				status,
				economy_price,
				business_price,
				// allow caller to provide flight_type, otherwise service/controller may derive it
				flight_type: req.body.flight_type,
				// pass-through optional services to be created with flight
				baggage_services: Array.isArray(req.body.baggage_services)
					? req.body.baggage_services
					: undefined,
				meal_services: Array.isArray(req.body.meal_services)
					? req.body.meal_services
					: undefined,
			};

			const flight = await adminService.createFlight(flightData);

			// Fetch created services for verification
			const created = await require('../models').Flight.findByPk(
				flight.flight_id,
				{
					include: [
						{
							model: require('../models').FlightBaggageService,
							as: 'baggage_services',
						},
						{
							model: require('../models').FlightMealService,
							as: 'meal_services',
						},
						{
							model: Airport,
							as: 'DepartureAirport',
							attributes: ['country_id'],
							include: [
								{
									model: require('../models').Country,
									attributes: ['country_id'],
								},
							],
						},
						{
							model: Airport,
							as: 'ArrivalAirport',
							attributes: ['country_id'],
							include: [
								{
									model: require('../models').Country,
									attributes: ['country_id'],
								},
							],
						},
					],
				}
			);

			// Return the persisted flight_type value from the DB (do not derive)
			const flightJson = created.toJSON();

			return sendSuccess(res, 'Flight created successfully', {
				flight: {
					...flightJson,
					flight_type: flightJson.flight_type,
				},
			});
		} catch (error) {
			logger.error('Error in createFlight controller:', error);
			next(error);
		}
	}

	async updateFlight(req, res, next) {
		try {
			const flightId = req.params.id;
			const updateData = req.body;

			const updatedFlight = await adminService.updateFlight(
				flightId,
				updateData
			);

			// After update, fetch full flight details including seats and services
			const flight = await Flight.findByPk(flightId, {
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
						model: Aircraft,
						attributes: [
							'aircraft_id',
							'model',
							'total_seats',
							'business_seats',
							'economy_seats',
							'aircraft_type',
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
							'airport_type',
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
							'airport_type',
						],
					},
					{
						model: FlightSeat,
						attributes: [
							'seat_id',
							'class_id',
							'seat_number',
							'price',
							'is_available',
						],
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
					// include baggage and meal services linked to this flight
					{
						model: require('../models').FlightBaggageService,
						attributes: [
							'baggage_service_id',
							'flight_id',
							'weight_kg',
							'price',
							'description',
							'is_active',
						],
					},
					{
						model: require('../models').FlightMealService,
						attributes: [
							'meal_service_id',
							'flight_id',
							'meal_name',
							'meal_description',
							'price',
							'is_vegetarian',
							'is_halal',
							'is_active',
						],
					},
				],
			});

			if (!flight) {
				return sendNotFound(res, 'Flight not found after update');
			}

			const flightJson = flight.toJSON();

			return sendSuccess(res, 'Flight updated successfully', {
				flight: {
					...flightJson,
					flight_type: flightJson.flight_type,
				},
			});
		} catch (error) {
			logger.error('Error in updateFlight controller:', error);
			next(error);
		}
	}

	async deleteFlight(req, res, next) {
		try {
			const flightId = req.params.id;

			const result = await adminService.deleteFlight(flightId);

			return sendSuccess(res, result.message);
		} catch (error) {
			logger.error('Error in deleteFlight controller:', error);
			next(error);
		}
	}
}

module.exports = new AdminController();
