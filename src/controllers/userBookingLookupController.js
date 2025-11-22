/**
 * User Booking Lookup Controller
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

class UserBookingLookupController {
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
				return sendError(res, 'Mã đặt chỗ là bắt buộc', 400);
			}

			// Find booking by reference
			const booking = await Booking.findOne({
				where: {
					booking_reference: bookingReference.toUpperCase(),
				},
				include: [
					{
						model: User,
						attributes: [
							'user_id',
							'email',
							'first_name',
							'last_name',
						],
					},
					{
						model: Payment,
						attributes: [
							'payment_id',
							'amount',
							'payment_method',
							'payment_reference',
							'payment_date',
							'status',
							'transaction_details',
						],
					},
				],
			});

			if (!booking) {
				return sendNotFound(res, 'Không tìm thấy đặt chỗ');
			}

			// Get booking details separately to avoid complex nested includes
			const bookingDetails = await BookingDetail.findAll({
				where: {
					booking_id: booking.booking_id,
				},
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
									'logo_url',
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
					{
						model: Passenger,
						attributes: [
							'passenger_id',
							'title',
							'first_name',
							'middle_name',
							'last_name',
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
						attributes: ['seat_id', 'seat_number', 'price'],
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
			});

			// Enhance booking with ticket type counts
			const ticketTypeCounts = {};
			bookingDetails.forEach((detail) => {
				const classCode =
					detail.FlightSeat?.TravelClass?.class_code || 'unknown';
				if (!ticketTypeCounts[classCode]) {
					ticketTypeCounts[classCode] = {
						class_name:
							detail.FlightSeat?.TravelClass?.class_name ||
							'Unknown',
						class_code: classCode,
						count: 0,
					};
				}
				ticketTypeCounts[classCode].count++;
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
				user: booking.User,
				passengers: bookingDetails.map((detail) => ({
					passenger: detail.Passenger,
					flight: {
						flight_id: detail.Flight.flight_id,
						flight_number: detail.Flight.flight_number,
						airline: detail.Flight.Airline,
						departure_airport: detail.Flight.DepartureAirport,
						arrival_airport: detail.Flight.ArrivalAirport,
						departure_time: detail.Flight.departure_time,
						arrival_time: detail.Flight.arrival_time,
						duration: detail.Flight.duration,
					},
					travel_class: detail.FlightSeat?.TravelClass,
					seat_number: detail.FlightSeat?.seat_number,
					price: detail.FlightSeat?.price,
				})),
				ticket_type_counts: Object.values(ticketTypeCounts),
				payment:
					booking.Payments && booking.Payments.length > 0
						? {
								payment_id: booking.Payments[0].payment_id,
								amount: booking.Payments[0].amount,
								payment_method:
									booking.Payments[0].payment_method,
								payment_reference:
									booking.Payments[0].payment_reference,
								payment_date: booking.Payments[0].payment_date,
								status: booking.Payments[0].status,
								transaction_details:
									booking.Payments[0].transaction_details ||
									null,
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

module.exports = new UserBookingLookupController();
