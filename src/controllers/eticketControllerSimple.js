/**
 * Simple E-Ticket Controller
 * Simplified version for testing
 */

const {
	Booking,
	BookingDetail,
	Flight,
	Airline,
	Airport,
	Aircraft,
	Passenger,
	TravelClass,
	ServicePackage,
	FlightSeat,
} = require('../models');
const EticketPdfService = require('../services/eticketPdfService');
const {
	sendSuccess,
	sendError,
	sendServerError,
} = require('../utils/response');
const logger = require('../utils/logger');

class EticketControllerSimple {
	/**
	 * Get e-ticket data (simplified version)
	 */
	static async getEticketData(req, res) {
		try {
			const { bookingReference } = req.params;

			if (!bookingReference) {
				return sendError(res, 'Booking reference is required', 400);
			}

			logger.info(`Looking for booking: ${bookingReference}`);

			// Find booking first
			const booking = await Booking.findOne({
				where: { booking_reference: bookingReference },
			});

			if (!booking) {
				logger.info(`Booking not found: ${bookingReference}`);
				return sendError(res, 'Booking not found', 404);
			}

			logger.info(`Found booking: ${booking.booking_reference}`);

			// Get booking details separately
			const bookingDetails = await BookingDetail.findAll({
				where: { booking_id: booking.booking_id },
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
									'airport_name',
									'city',
									'airport_code',
								],
							},
							{
								model: Airport,
								as: 'ArrivalAirport',
								attributes: [
									'airport_id',
									'airport_name',
									'city',
									'airport_code',
								],
							},
							{
								model: Aircraft,
								attributes: [
									'aircraft_id',
									'model',
									'aircraft_type',
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
						include: [
							{
								model: TravelClass,
								attributes: ['class_id', 'class_name'],
							},
						],
					},
				],
			});

			logger.info(`Found ${bookingDetails.length} booking details`);

			// Get service package if exists
			let servicePackage = null;
			if (booking.service_package_id) {
				servicePackage = await ServicePackage.findByPk(
					booking.service_package_id
				);
			}

			// Format response data
			const eticketData = {
				booking: {
					booking_reference: booking.booking_reference,
					booking_date: booking.booking_date,
					total_amount: booking.total_amount,
					status: booking.status,
				},
				flight: bookingDetails[0]?.Flight
					? {
							flight_number:
								bookingDetails[0].Flight.flight_number,
							airline: bookingDetails[0].Flight.Airline,
							departure_airport:
								bookingDetails[0].Flight.DepartureAirport,
							arrival_airport:
								bookingDetails[0].Flight.ArrivalAirport,
							departure_time:
								bookingDetails[0].Flight.departure_time,
							arrival_time: bookingDetails[0].Flight.arrival_time,
							aircraft: bookingDetails[0].Flight.Aircraft,
							travel_class:
								bookingDetails[0].FlightSeat?.TravelClass,
					  }
					: null,
				service_package: servicePackage?.toJSON(),
				passengers: bookingDetails.map((detail) => ({
					...detail.Passenger.toJSON(),
					seat_number: detail.seat_number,
					travel_class: detail.FlightSeat?.TravelClass,
				})),
			};

			return sendSuccess(
				res,
				eticketData,
				'E-ticket data retrieved successfully'
			);
		} catch (error) {
			logger.error('Error getting e-ticket data:', error);
			return sendServerError(res, 'Failed to get e-ticket data');
		}
	}
}

module.exports = EticketControllerSimple;
