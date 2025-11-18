/**
 * Seat Allocation Service
 * Handles automatic seat allocation without specific seat selection
 */

const { FlightSeat, TravelClass, Aircraft } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class SeatAllocationService {
	/**
	 * Check seat availability by travel class
	 * @param {number} flightId - Flight ID
	 * @param {number} classId - Travel class ID
	 * @param {number} requestedSeats - Number of seats requested
	 * @returns {Promise<Object>} Availability status and details
	 */
	async checkSeatAvailability(flightId, classId, requestedSeats) {
		try {
			// Get travel class details
			const travelClass = await TravelClass.findByPk(classId);
			if (!travelClass) {
				throw new Error('Travel class not found');
			}

			// Get flight and aircraft details
			const flight = await require('../models').Flight.findByPk(
				flightId,
				{
					include: [
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
					],
				}
			);

			if (!flight) {
				throw new Error('Flight not found');
			}

			// Count available seats for the requested class
			const availableSeats = await FlightSeat.count({
				where: {
					flight_id: flightId,
					class_id: classId,
					is_available: true,
				},
			});

			// Get total seats for this class from aircraft
			const aircraft = flight.Aircraft;
			let totalSeatsForClass;

			if (travelClass.class_code === 'BUSINESS') {
				totalSeatsForClass = aircraft.business_seats;
			} else if (travelClass.class_code === 'ECONOMY') {
				totalSeatsForClass = aircraft.economy_seats;
			} else {
				// For other classes, use total available seats
				totalSeatsForClass = availableSeats;
			}

			// Calculate booked seats
			const bookedSeats = totalSeatsForClass - availableSeats;

			const availability = {
				flight_id: flightId,
				class_id: classId,
				class_name: travelClass.class_name,
				class_code: travelClass.class_code,
				total_seats: totalSeatsForClass,
				available_seats: availableSeats,
				booked_seats: bookedSeats,
				requested_seats: requestedSeats,
				is_available: availableSeats >= requestedSeats,
				aircraft: {
					model: aircraft.model,
					total_seats: aircraft.total_seats,
					business_seats: aircraft.business_seats,
					economy_seats: aircraft.economy_seats,
				},
			};

			return availability;
		} catch (error) {
			logger.error('Error checking seat availability:', error);
			throw error;
		}
	}

	/**
	 * Automatically allocate seats for passengers
	 * @param {number} flightId - Flight ID
	 * @param {number} classId - Travel class ID
	 * @param {number} passengerCount - Number of passengers
	 * @returns {Promise<Array>} Array of allocated seat IDs
	 */
	async allocateSeats(flightId, classId, passengerCount) {
		try {
			// Get available seats for the class
			const availableSeats = await FlightSeat.findAll({
				where: {
					flight_id: flightId,
					class_id: classId,
					is_available: true,
				},
				order: [['seat_number', 'ASC']],
				limit: passengerCount,
			});

			if (availableSeats.length < passengerCount) {
				throw new Error(
					`Not enough seats available. Requested: ${passengerCount}, Available: ${availableSeats.length}`
				);
			}

			// Mark seats as unavailable
			const seatIds = availableSeats.map((seat) => seat.seat_id);
			await FlightSeat.update(
				{ is_available: false },
				{ where: { seat_id: { [Op.in]: seatIds } } }
			);

			// Return allocated seat details
			return availableSeats.map((seat) => ({
				seat_id: seat.seat_id,
				seat_number: seat.seat_number,
				price: parseFloat(seat.price),
				class_id: seat.class_id,
			}));
		} catch (error) {
			logger.error('Error allocating seats:', error);
			throw error;
		}
	}

	/**
	 * Get seat availability summary for a flight
	 * @param {number} flightId - Flight ID
	 * @returns {Promise<Object>} Seat availability summary
	 */
	async getFlightSeatSummary(flightId) {
		try {
			const flight = await require('../models').Flight.findByPk(
				flightId,
				{
					include: [
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
					],
				}
			);

			if (!flight) {
				throw new Error('Flight not found');
			}

			// Get all travel classes
			const travelClasses = await TravelClass.findAll();

			const seatSummary = {
				flight_id: flightId,
				aircraft: {
					model: flight.Aircraft.model,
					total_seats: flight.Aircraft.total_seats,
					business_seats: flight.Aircraft.business_seats,
					economy_seats: flight.Aircraft.economy_seats,
				},
				classes: [],
			};

			// Get availability for each class
			for (const travelClass of travelClasses) {
				const availability = await this.checkSeatAvailability(
					flightId,
					travelClass.class_id,
					0
				);
				seatSummary.classes.push({
					class_id: travelClass.class_id,
					class_name: travelClass.class_name,
					class_code: travelClass.class_code,
					total_seats: availability.total_seats,
					available_seats: availability.available_seats,
					booked_seats: availability.booked_seats,
					is_available: availability.available_seats > 0,
				});
			}

			return seatSummary;
		} catch (error) {
			logger.error('Error getting flight seat summary:', error);
			throw error;
		}
	}

	/**
	 * Release allocated seats (for booking cancellation)
	 * @param {Array} seatIds - Array of seat IDs to release
	 * @returns {Promise<void>}
	 */
	async releaseSeats(seatIds) {
		try {
			await FlightSeat.update(
				{ is_available: true },
				{ where: { seat_id: { [Op.in]: seatIds } } }
			);
			logger.info(`Released ${seatIds.length} seats`);
		} catch (error) {
			logger.error('Error releasing seats:', error);
			throw error;
		}
	}
}

module.exports = new SeatAllocationService();
