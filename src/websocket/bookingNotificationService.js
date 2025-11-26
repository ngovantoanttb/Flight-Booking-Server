const logger = require('../utils/logger');
const { Booking, Flight, User, Passenger, Airline, Airport } = require('../models');
const { MESSAGE_TYPES } = require('./websocketHandlers');

// Store booking subscriptions: bookingId -> Set of userIds
const bookingSubscriptions = new Map();
// Store user connections: userId -> WebSocket
const userConnections = new Map();

/**
 * Subscribe user to booking updates
 * @param {string} bookingId - Booking ID to subscribe to
 * @param {string} userId - User ID
 * @param {WebSocket} ws - WebSocket connection
 */
async function subscribeToBookingUpdates(bookingId, userId, ws) {
  try {
    // Verify booking exists and user has access
    const booking = await Booking.findOne({
      where: { id: bookingId },
      include: [
        { model: User, as: 'user' },
        { 
          model: Flight, 
          as: 'flight',
          include: [
            { model: Airline, as: 'airline' },
            { model: Airport, as: 'departureAirport' },
            { model: Airport, as: 'arrivalAirport' }
          ]
        },
        { model: Passenger, as: 'passengers' }
      ]
    });
    
    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }
    
    // Check if user has access to this booking (owner or admin)
    if (booking.user_id !== parseInt(userId) && ws.userRole !== 'admin') {
      throw new Error(`Access denied to booking ${bookingId}`);
    }
    
    // Add user to booking subscriptions
    if (!bookingSubscriptions.has(bookingId)) {
      bookingSubscriptions.set(bookingId, new Set());
    }
    bookingSubscriptions.get(bookingId).add(userId);
    
    // Store user connection
    userConnections.set(userId, ws);
    
    logger.info(`User ${userId} subscribed to booking ${bookingId} updates`);
    
    // Send current booking status
    const bookingStatus = await getBookingStatus(bookingId, userId);
    ws.send(JSON.stringify({
      type: MESSAGE_TYPES.BOOKING_STATUS,
      data: bookingStatus,
      timestamp: new Date().toISOString()
    }));
    
  } catch (error) {
    logger.error(`Error subscribing user ${userId} to booking ${bookingId}:`, error);
    throw error;
  }
}

/**
 * Unsubscribe user from booking updates
 * @param {string} bookingId - Booking ID to unsubscribe from
 * @param {string} userId - User ID
 */
async function unsubscribeFromBookingUpdates(bookingId, userId) {
  try {
    if (bookingSubscriptions.has(bookingId)) {
      bookingSubscriptions.get(bookingId).delete(userId);
      
      // Remove empty subscription sets
      if (bookingSubscriptions.get(bookingId).size === 0) {
        bookingSubscriptions.delete(bookingId);
      }
    }
    
    logger.info(`User ${userId} unsubscribed from booking ${bookingId} updates`);
  } catch (error) {
    logger.error(`Error unsubscribing user ${userId} from booking ${bookingId}:`, error);
    throw error;
  }
}

/**
 * Get current booking status
 * @param {string} bookingId - Booking ID
 * @param {string} userId - User ID (for access control)
 * @returns {Object} Booking status information
 */
async function getBookingStatus(bookingId, userId) {
  try {
    const booking = await Booking.findOne({
      where: { id: bookingId },
      include: [
        { model: User, as: 'user' },
        { 
          model: Flight, 
          as: 'flight',
          include: [
            { model: Airline, as: 'airline' },
            { model: Airport, as: 'departureAirport' },
            { model: Airport, as: 'arrivalAirport' }
          ]
        },
        { model: Passenger, as: 'passengers' }
      ]
    });
    
    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }
    
    // Check access (simplified for WebSocket context)
    // In production, you might want more sophisticated access control
    
    return {
      bookingId: booking.id,
      bookingReference: booking.booking_reference,
      status: booking.status,
      bookingDate: booking.booking_date,
      totalAmount: booking.total_amount,
      paymentStatus: booking.payment_status,
      user: {
        id: booking.user.id,
        email: booking.user.email,
        firstName: booking.user.first_name,
        lastName: booking.user.last_name
      },
      flight: {
        id: booking.flight.id,
        flightNumber: booking.flight.flight_number,
        airline: {
          name: booking.flight.airline.name,
          code: booking.flight.airline.iata_code
        },
        departure: {
          airport: {
            name: booking.flight.departureAirport.name,
            code: booking.flight.departureAirport.iata_code,
            city: booking.flight.departureAirport.city
          },
          time: booking.flight.departure_time,
          actualTime: booking.flight.actual_departure_time
        },
        arrival: {
          airport: {
            name: booking.flight.arrivalAirport.name,
            code: booking.flight.arrivalAirport.iata_code,
            city: booking.flight.arrivalAirport.city
          },
          time: booking.flight.arrival_time,
          actualTime: booking.flight.actual_arrival_time
        },
        status: booking.flight.status
      },
      passengers: booking.passengers.map(passenger => ({
        id: passenger.id,
        firstName: passenger.first_name,
        lastName: passenger.last_name,
        dateOfBirth: passenger.date_of_birth,
        gender: passenger.gender,
        nationality: passenger.nationality,
        passportNumber: passenger.passport_number,
        seatNumber: passenger.seat_number,
        seatClass: passenger.seat_class,
        specialRequests: passenger.special_requests
      })),
      checkInStatus: booking.check_in_status,
      checkInTime: booking.check_in_time,
      boardingPass: booking.boarding_pass_url,
      eTicket: booking.e_ticket_url,
      lastUpdated: booking.updatedAt
    };
  } catch (error) {
    logger.error(`Error getting booking status for ${bookingId}:`, error);
    throw error;
  }
}

/**
 * Broadcast booking update to all subscribed users
 * @param {string} bookingId - Booking ID
 * @param {Object} updateData - Update information
 * @param {string} updateType - Type of update
 */
async function broadcastBookingUpdate(bookingId, updateData, updateType = 'general') {
  try {
    if (!bookingSubscriptions.has(bookingId)) {
      logger.debug(`No subscribers for booking ${bookingId}`);
      return;
    }
    
    const subscribers = bookingSubscriptions.get(bookingId);
    
    // Get updated booking status for the first subscriber (to get user context)
    const firstUserId = subscribers.values().next().value;
    const bookingStatus = await getBookingStatus(bookingId, firstUserId);
    
    const message = {
      type: MESSAGE_TYPES.BOOKING_UPDATE,
      data: {
        bookingId,
        updateType,
        updateData,
        bookingStatus,
        message: generateBookingUpdateMessage(updateType, updateData, bookingStatus)
      }
    };
    
    let sentCount = 0;
    subscribers.forEach(userId => {
      const ws = userConnections.get(userId);
      if (ws && ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({
          ...message,
          timestamp: new Date().toISOString()
        }));
        sentCount++;
      } else {
        // Clean up inactive connections
        subscribers.delete(userId);
        userConnections.delete(userId);
      }
    });
    
    logger.info(`Broadcast booking ${bookingId} update to ${sentCount} users`);
    
  } catch (error) {
    logger.error(`Error broadcasting booking update for ${bookingId}:`, error);
  }
}

/**
 * Generate user-friendly booking update message
 * @param {string} updateType - Type of update
 * @param {Object} updateData - Update data
 * @param {Object} bookingStatus - Current booking status
 * @returns {string} User-friendly message
 */
function generateBookingUpdateMessage(updateType, updateData, bookingStatus) {
  const bookingRef = bookingStatus.bookingReference;
  const flightNumber = bookingStatus.flight.flightNumber;
  
  switch (updateType) {
    case 'status':
      return `Booking ${bookingRef} status updated to: ${updateData.newStatus}`;
    case 'payment':
      return `Payment for booking ${bookingRef} is ${updateData.paymentStatus}`;
    case 'check_in':
      return `Check-in completed for booking ${bookingRef}. Boarding pass is ready!`;
    case 'seat_assignment':
      return `Seat assigned for booking ${bookingRef}: ${updateData.seatNumbers.join(', ')}`;
    case 'flight_change':
      return `Flight changed for booking ${bookingRef}. New flight: ${updateData.newFlightNumber}`;
    case 'cancellation':
      return `Booking ${bookingRef} has been cancelled. Refund will be processed.`;
    case 'boarding_pass':
      return `Boarding pass ready for booking ${bookingRef} - Flight ${flightNumber}`;
    case 'e_ticket':
      return `E-ticket issued for booking ${bookingRef} - Flight ${flightNumber}`;
    case 'flight_delay':
      return `Flight ${flightNumber} for booking ${bookingRef} is delayed by ${updateData.delayMinutes} minutes`;
    case 'gate_change':
      return `Gate changed for flight ${flightNumber} (Booking ${bookingRef}): ${updateData.newGate}`;
    case 'reminder':
      return `Reminder: Flight ${flightNumber} (Booking ${bookingRef}) departs in ${updateData.hoursUntilDeparture} hours`;
    default:
      return `Booking ${bookingRef} has been updated`;
  }
}

/**
 * Send booking reminder notifications
 * @param {string} bookingId - Booking ID
 * @param {number} hoursUntilDeparture - Hours until departure
 */
async function sendBookingReminder(bookingId, hoursUntilDeparture) {
  await broadcastBookingUpdate(bookingId, { hoursUntilDeparture }, 'reminder');
}

/**
 * Clean up inactive connections
 */
function cleanupBookingConnections() {
  userConnections.forEach((ws, userId) => {
    if (ws.readyState !== ws.OPEN) {
      userConnections.delete(userId);
      
      // Remove from all booking subscriptions
      bookingSubscriptions.forEach((subscribers, bookingId) => {
        subscribers.delete(userId);
        if (subscribers.size === 0) {
          bookingSubscriptions.delete(bookingId);
        }
      });
    }
  });
}

// Clean up inactive connections every 5 minutes
setInterval(cleanupBookingConnections, 5 * 60 * 1000);

module.exports = {
  subscribeToBookingUpdates,
  unsubscribeFromBookingUpdates,
  getBookingStatus,
  broadcastBookingUpdate,
  sendBookingReminder,
  bookingSubscriptions,
  userConnections
};
