/**
 * Simplified Booking Controller
 * Handles booking without specific seat selection
 */

const {
	Flight,
	Booking,
	Passenger,
	BookingDetail,
	TravelClass,
} = require('../models');
const seatAllocationService = require('../services/seatAllocationService');
const {
	sendSuccess,
	sendError,
	sendServerError,
} = require('../utils/response');
const logger = require('../utils/logger');

// Helper function to get user ID from request
function getUserId(req) {
	return req.user ? req.user.user_id : null;
}

const simplifiedBookingController = {
	/**
	 * Check seat availability before booking
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 */
	async checkAvailability(req, res) {
		try {
			const { flight_id, class_id, passengers } = req.body;

			// Validate required parameters
			if (!flight_id || !class_id || !passengers || passengers <= 0) {
				return sendError(
					res,
					'Missing required parameters: flight_id, class_id, passengers',
					400
				);
			}

			// Check seat availability
			const availability =
				await seatAllocationService.checkSeatAvailability(
					flight_id,
					class_id,
					passengers
				);

			if (!availability.is_available) {
				return sendError(
					res,
					{
						message: 'Not enough seats available',
						details: {
							requested: passengers,
							available: availability.available_seats,
							class: availability.class_name,
							aircraft: availability.aircraft.model,
						},
					},
					400
				);
			}

			return sendSuccess(res, 'Seats are available', availability);
		} catch (error) {
			logger.error('Error checking availability:', error);
			return sendServerError(
				res,
				`Failed to check availability: ${error.message}`
			);
		}
	},

	/**
	 * Create simplified booking without seat selection
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 */
	async createBooking(req, res) {
		try {
			const {
				flight_id,
				class_id,
				passengers = [],
				contact_info = {},
				promotion_code,
			} = req.body;

			const user_id = getUserId(req);
			if (!user_id) {
				return sendError(res, 'Not authorized', 401);
			}

			// Validate required parameters
			if (
				!flight_id ||
				!class_id ||
				!passengers ||
				passengers.length === 0
			) {
				return sendError(
					res,
					'Missing required parameters: flight_id, class_id, passengers',
					400
				);
			}

			// Check if flight exists
			const flight = await Flight.findByPk(flight_id);
			if (!flight) {
				return sendError(res, 'Flight not found', 404);
			}

			// Check seat availability
			const availability =
				await seatAllocationService.checkSeatAvailability(
					flight_id,
					class_id,
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

			// Allocate seats automatically
			const allocatedSeats = await seatAllocationService.allocateSeats(
				flight_id,
				class_id,
				passengers.length
			);

			// Calculate total amount
			const totalAmount = allocatedSeats.reduce(
				(sum, seat) => sum + seat.price,
				0
			);

			// Generate booking reference
			const bookingReference = Math.random()
				.toString(36)
				.substring(2, 8)
				.toUpperCase();

			// Capture citizen ID from contact_info if provided
			const citizenId =
				contact_info.citizen_id || contact_info.citizenId || null;

			// Create booking
			const booking = await Booking.create({
				user_id,
				booking_reference: bookingReference,
				status: 'pending',
				total_amount: totalAmount,
				contact_email: contact_info.email || null,
				contact_phone: contact_info.phone || null,
				citizen_id: citizenId,
				promotion_code: promotion_code || null,
			});

			// Create passengers and booking details
			const createdPassengers = [];
			for (let i = 0; i < passengers.length; i++) {
				const passenger = passengers[i];
				const allocatedSeat = allocatedSeats[i];

				// Create passenger
				const newPassenger = await Passenger.create({
					first_name: passenger.first_name,
					last_name: passenger.last_name,
					date_of_birth: passenger.date_of_birth,
					gender: passenger.gender,
					nationality: passenger.nationality,
					passport_number: passenger.passport_number,
				});
				createdPassengers.push(newPassenger);

				// Create booking detail
				await BookingDetail.create({
					booking_id: booking.booking_id,
					flight_id,
					passenger_id: newPassenger.passenger_id,
					seat_id: allocatedSeat.seat_id,
				});
			}

			// Update user's citizen_id if provided
			try {
				if (citizenId) {
					await require('../models').User.update(
						{ citizen_id: citizenId },
						{ where: { user_id } }
					);
				}
			} catch (updateErr) {
				logger.warn('Failed to update user citizen_id:', updateErr);
			}

			// Send booking confirmation email (if email service is available)
			try {
				const emailService = require('../services/emailService');
				if (
					emailService &&
					typeof emailService.sendBookingConfirmation === 'function'
				) {
					await emailService.sendBookingConfirmation(
						booking.contact_email,
						{
							booking_id: booking.booking_id,
							user_id,
							booking_reference: booking.booking_reference,
							flight_id,
							passengers: createdPassengers,
							total_amount: booking.total_amount,
							allocated_seats: allocatedSeats,
						}
					);
				}
			} catch (err) {
				logger.warn('Failed to send booking confirmation email:', err);
			}

			return sendSuccess(res, 'Booking created successfully', {
				booking_id: booking.booking_id,
				booking_reference: booking.booking_reference,
				user_id: booking.user_id,
				flight_id,
				status: booking.status,
				total_amount: booking.total_amount,
				passengers: createdPassengers.length,
				allocated_seats: allocatedSeats.map((seat) => ({
					seat_number: seat.seat_number,
					price: seat.price,
				})),
				class_info: {
					class_id: class_id,
					class_name: availability.class_name,
					class_code: availability.class_code,
				},
			});
		} catch (error) {
			logger.error('Error creating simplified booking:', error);
			return sendServerError(
				res,
				`Failed to create booking: ${error.message}`
			);
		}
	},

	/**
	 * Get seat availability summary for a flight
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 */
	async getSeatSummary(req, res) {
		try {
			const { flightId } = req.params;

			if (!flightId || isNaN(parseInt(flightId))) {
				return sendError(res, 'Invalid flight ID', 400);
			}

			const seatSummary =
				await seatAllocationService.getFlightSeatSummary(
					parseInt(flightId)
				);

			return sendSuccess(
				res,
				'Seat summary retrieved successfully',
				seatSummary
			);
		} catch (error) {
			logger.error('Error getting seat summary:', error);
			return sendServerError(
				res,
				`Failed to get seat summary: ${error.message}`
			);
		}
	},

	/**
	 * Cancel booking and release seats
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 */
	async cancelBooking(req, res) {
		try {
			const { bookingId } = req.params;
			const user_id = getUserId(req);
			const reason =
				req.body && (req.body.reason || req.body.cancellation_reason);

			if (!user_id) {
				return sendError(res, 'Not authorized', 401);
			}

			if (!bookingId || isNaN(parseInt(bookingId))) {
				return sendError(res, 'Invalid booking ID', 400);
			}

			// Find booking
			const booking = await Booking.findOne({
				where: {
					booking_id: parseInt(bookingId),
					user_id: user_id,
				},
				include: [
					{
						model: BookingDetail,
						include: [
							{
								model: require('../models').FlightSeat,
								attributes: ['seat_id', 'seat_number'],
							},
						],
					},
				],
			});

			if (!booking) {
				return sendError(res, 'Booking not found', 404);
			}

			if (booking.status === 'cancelled') {
				return sendError(res, 'Booking is already cancelled', 400);
			}

			if (booking.status === 'pending_cancellation') {
				return sendError(
					res,
					'Cancellation request is already pending admin confirmation',
					400
				);
			}

			// For user-initiated cancellations we mark the booking as pending_cancellation
			// Admin must confirm to move it to 'cancelled' and release seats.
			await booking.update({
				status: 'pending_cancellation',
				cancellation_reason: reason || 'Cancellation requested by user',
			});

			return sendSuccess(res, 'Cancellation request submitted', {
				booking_id: booking.booking_id,
				booking_reference: booking.booking_reference,
				status: 'pending_cancellation',
			});
		} catch (error) {
			logger.error('Error cancelling booking:', error);
			return sendServerError(
				res,
				`Failed to cancel booking: ${error.message}`
			);
		}
	},
};

module.exports = simplifiedBookingController;
