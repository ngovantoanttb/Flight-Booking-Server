/**
 * Minimal User Booking Lookup Controller
 * Handles booking lookup for users
 */

const {
	Booking,
	BookingDetail,
	Flight,
	Airline,
	Airport,
	Passenger,
	TravelClass,
	User,
	Payment,
	FlightSeat,
} = require('../models');
const { sendSuccess, sendNotFound, sendError } = require('../utils/response');
const logger = require('../utils/logger');

class UserBookingLookupControllerMinimal {
	/**
	 * Lookup booking by reference code
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async lookupBooking(req, res, next) {
		try {
			const { bookingReference } = req.params;

			if (!bookingReference) {
				return sendError(res, 'Booking reference is required', 400);
			}

			// Find booking by reference - minimal query
			const booking = await Booking.findOne({
				where: {
					booking_reference: bookingReference.toUpperCase(),
				},
			});

			if (!booking) {
				return sendNotFound(res, 'Booking not found');
			}

			// Get user separately
			const user = await User.findByPk(booking.user_id, {
				attributes: ['user_id', 'email', 'first_name', 'last_name'],
			});

			// Get payment separately
			const payment = await Payment.findOne({
				where: { booking_id: booking.booking_id },
				attributes: [
					'payment_id',
					'amount',
					'payment_method',
					'payment_reference',
					'payment_date',
					'status',
					'transaction_details',
				],
			});

			// Get booking details separately
			const bookingDetails = await BookingDetail.findAll({
				where: { booking_id: booking.booking_id },
			});

			// Format response
			const response = {
				booking_id: booking.booking_id,
				booking_reference: booking.booking_reference,
				booking_date: booking.booking_date,
				status: booking.status,
				payment_status: booking.payment_status,
				total_amount: booking.total_amount,
				contact_email: booking.contact_email,
				contact_phone: booking.contact_phone,
				user: user,
				passengers: [], // Will be populated later
				ticket_type_counts: [],
				payment: payment
					? {
							payment_id: payment.payment_id,
							amount: payment.amount,
							payment_method: payment.payment_method,
							payment_reference: payment.payment_reference,
							payment_date: payment.payment_date,
							status: payment.status,
							transaction_details:
								payment.transaction_details || null,
					  }
					: null,
				created_at: booking.created_at,
				updated_at: booking.updated_at,
			};

			return sendSuccess(res, 'Booking retrieved successfully', response);
		} catch (error) {
			logger.error('Error in lookupBooking controller:', error);
			next(error);
		}
	}
}

module.exports = new UserBookingLookupControllerMinimal();
