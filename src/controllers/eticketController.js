/**
 * E-Ticket Controller
 * Handles e-ticket PDF generation
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
	Payment,
} = require('../models');
const Contact = require('../models').Contact || null;
const BookingServicePackage =
	require('../models').BookingServicePackage || null;
const FlightBaggageService = require('../models').FlightBaggageService || null;
const FlightMealService = require('../models').FlightMealService || null;
const EticketPdfService = require('../services/eticketPdfService');
const {
	sendSuccess,
	sendError,
	sendServerError,
} = require('../utils/response');
const logger = require('../utils/logger');

class EticketController {
	/**
	 * Generate and download e-ticket PDF
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 */
	static async generateEticketPdf(req, res) {
		try {
			const { bookingReference } = req.params;

			if (!bookingReference) {
				return sendError(res, 'Booking reference is required', 400);
			}

			// Find booking with all related data
			const booking = await Booking.findOne({
				where: { booking_reference: bookingReference },
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
					},
				],
			});

			if (!booking) {
				return sendError(res, 'Booking not found', 404);
			}

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

				// Determine base baggage allowance per passenger by class
				const baggageAllowance =
					travelClass.class_code === 'BUSINESS' ? '30kg' : '20kg';

				passengersByFlight[flightId].push({
					...passenger.toJSON(),
					seat_number: seat.seat_number || null,
					travel_class: travelClass || null,
					baggage_allowance: baggageAllowance,
					meal_preference: d.meal_preference || null,
				});
			});

			// Format flights array for PDF generation (support multi-leg bookings)
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
					airline: flightItem.Airline,
					aircraft: flightItem.Aircraft,
					departure_airport: depAirport,
					arrival_airport: arrAirport,
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

			// Get payment information
			const payment = await Payment.findOne({
				where: { booking_id: booking.booking_id },
			});

			logger.info('Payment data for booking:', {
				booking_id: booking.booking_id,
				has_payment: !!payment,
				payment_id: payment?.payment_id,
			});

			// Prepare data for PDF generation
			const bookingData = {
				booking: booking.toJSON(),
				contact_info: contactInfo,
				flights: formattedFlights,
				payment: payment?.toJSON(),
			};

			// Generate PDF
			const pdfBuffer = await EticketPdfService.generateEticketPdf(
				bookingData
			);

			// Set response headers for PDF download
			const filename = `eticket_${bookingReference}_${
				new Date().toISOString().split('T')[0]
			}.pdf`;

			res.setHeader('Content-Type', 'application/pdf');
			res.setHeader(
				'Content-Disposition',
				`attachment; filename="${filename}"`
			);
			res.setHeader('Content-Length', pdfBuffer.length);

			// Send PDF buffer
			res.send(pdfBuffer);

			logger.info(
				`E-ticket PDF generated for booking: ${bookingReference}`
			);
		} catch (error) {
			logger.error('Error generating e-ticket PDF:', error);
			return sendServerError(res, 'Failed to generate e-ticket PDF');
		}
	}

	/**
	 * Get e-ticket data (without PDF generation)
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 */
	static async getEticketData(req, res) {
		try {
			const { bookingReference } = req.params;

			if (!bookingReference) {
				return sendError(res, 'Booking reference is required', 400);
			}

			// Find booking with all related data
			const booking = await Booking.findOne({
				where: { booking_reference: bookingReference },
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
									'first_name',
									'last_name',
									'date_of_birth',
									'nationality',
									'passport_number',
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
					},
				],
			});

			if (!booking) {
				return sendError(res, 'Booking not found', 404);
			}

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
				flight: {
					flight_number:
						booking.BookingDetails?.[0]?.Flight?.flight_number,
					airline: booking.BookingDetails?.[0]?.Flight?.Airline,
					departure_airport:
						booking.BookingDetails?.[0]?.Flight?.DepartureAirport,
					arrival_airport:
						booking.BookingDetails?.[0]?.Flight?.ArrivalAirport,
					departure_time:
						booking.BookingDetails?.[0]?.Flight?.departure_time,
					arrival_time:
						booking.BookingDetails?.[0]?.Flight?.arrival_time,
					aircraft: booking.BookingDetails?.[0]?.Flight?.Aircraft,
					travel_class:
						booking.BookingDetails?.[0]?.FlightSeat?.TravelClass,
				},
				service_package: servicePackage?.toJSON(),
				passengers:
					booking.BookingDetails?.map((detail) => ({
						...detail.Passenger.toJSON(),
						seat_number: detail.seat_number,
						travel_class: detail.FlightSeat?.TravelClass,
					})) || [],
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

module.exports = EticketController;
