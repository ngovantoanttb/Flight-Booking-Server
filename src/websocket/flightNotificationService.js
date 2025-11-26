const logger = require('../utils/logger');
const { Flight, Airline, Airport } = require('../models');
const { MESSAGE_TYPES } = require('./websocketHandlers');

// Store flight subscriptions: flightId -> Set of userIds
const flightSubscriptions = new Map();
// Store user connections: userId -> WebSocket
const userConnections = new Map();

/**
 * Subscribe user to flight updates
 * @param {string} flightId - Flight ID to subscribe to
 * @param {string} userId - User ID
 * @param {WebSocket} ws - WebSocket connection
 */
async function subscribeToFlightUpdates(flightId, userId, ws) {
  try {
    // Verify flight exists
    const flight = await Flight.findByPk(flightId, {
      include: [
        { model: Airline, as: 'airline' },
        { model: Airport, as: 'departureAirport' },
        { model: Airport, as: 'arrivalAirport' }
      ]
    });
    
    if (!flight) {
      throw new Error(`Flight ${flightId} not found`);
    }
    
    // Add user to flight subscriptions
    if (!flightSubscriptions.has(flightId)) {
      flightSubscriptions.set(flightId, new Set());
    }
    flightSubscriptions.get(flightId).add(userId);
    
    // Store user connection
    userConnections.set(userId, ws);
    
    logger.info(`User ${userId} subscribed to flight ${flightId} updates`);
    
    // Send current flight status
    const flightStatus = await getFlightStatus(flightId);
    ws.send(JSON.stringify({
      type: MESSAGE_TYPES.FLIGHT_STATUS,
      data: flightStatus,
      timestamp: new Date().toISOString()
    }));
    
  } catch (error) {
    logger.error(`Error subscribing user ${userId} to flight ${flightId}:`, error);
    throw error;
  }
}

/**
 * Unsubscribe user from flight updates
 * @param {string} flightId - Flight ID to unsubscribe from
 * @param {string} userId - User ID
 */
async function unsubscribeFromFlightUpdates(flightId, userId) {
  try {
    if (flightSubscriptions.has(flightId)) {
      flightSubscriptions.get(flightId).delete(userId);
      
      // Remove empty subscription sets
      if (flightSubscriptions.get(flightId).size === 0) {
        flightSubscriptions.delete(flightId);
      }
    }
    
    logger.info(`User ${userId} unsubscribed from flight ${flightId} updates`);
  } catch (error) {
    logger.error(`Error unsubscribing user ${userId} from flight ${flightId}:`, error);
    throw error;
  }
}

/**
 * Get current flight status
 * @param {string} flightId - Flight ID
 * @returns {Object} Flight status information
 */
async function getFlightStatus(flightId) {
  try {
    const flight = await Flight.findByPk(flightId, {
      include: [
        { model: Airline, as: 'airline' },
        { model: Airport, as: 'departureAirport' },
        { model: Airport, as: 'arrivalAirport' }
      ]
    });
    
    if (!flight) {
      throw new Error(`Flight ${flightId} not found`);
    }
    
    return {
      flightId: flight.id,
      flightNumber: flight.flight_number,
      airline: {
        id: flight.airline.id,
        name: flight.airline.name,
        code: flight.airline.iata_code
      },
      departure: {
        airport: {
          id: flight.departureAirport.id,
          name: flight.departureAirport.name,
          code: flight.departureAirport.iata_code,
          city: flight.departureAirport.city,
          country: flight.departureAirport.country
        },
        scheduledTime: flight.departure_time,
        actualTime: flight.actual_departure_time,
        terminal: flight.departure_terminal,
        gate: flight.departure_gate
      },
      arrival: {
        airport: {
          id: flight.arrivalAirport.id,
          name: flight.arrivalAirport.name,
          code: flight.arrivalAirport.iata_code,
          city: flight.arrivalAirport.city,
          country: flight.arrivalAirport.country
        },
        scheduledTime: flight.arrival_time,
        actualTime: flight.actual_arrival_time,
        terminal: flight.arrival_terminal,
        gate: flight.arrival_gate
      },
      status: flight.status,
      aircraft: flight.aircraft_type,
      duration: flight.duration,
      price: {
        economy: flight.economy_price,
        business: flight.business_price
      },
      availableSeats: {
        economy: flight.available_economy_seats,
        business: flight.available_business_seats
      },
      lastUpdated: flight.updatedAt
    };
  } catch (error) {
    logger.error(`Error getting flight status for ${flightId}:`, error);
    throw error;
  }
}

/**
 * Broadcast flight update to all subscribed users
 * @param {string} flightId - Flight ID
 * @param {Object} updateData - Update information
 * @param {string} updateType - Type of update (status, time, gate, etc.)
 */
async function broadcastFlightUpdate(flightId, updateData, updateType = 'general') {
  try {
    if (!flightSubscriptions.has(flightId)) {
      logger.debug(`No subscribers for flight ${flightId}`);
      return;
    }
    
    const subscribers = flightSubscriptions.get(flightId);
    const flightStatus = await getFlightStatus(flightId);
    
    const message = {
      type: MESSAGE_TYPES.FLIGHT_UPDATE,
      data: {
        flightId,
        updateType,
        updateData,
        flightStatus,
        message: generateUpdateMessage(updateType, updateData, flightStatus)
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
    
    logger.info(`Broadcast flight ${flightId} update to ${sentCount} users`);
    
  } catch (error) {
    logger.error(`Error broadcasting flight update for ${flightId}:`, error);
  }
}

/**
 * Generate user-friendly update message
 * @param {string} updateType - Type of update
 * @param {Object} updateData - Update data
 * @param {Object} flightStatus - Current flight status
 * @returns {string} User-friendly message
 */
function generateUpdateMessage(updateType, updateData, flightStatus) {
  const flightNumber = flightStatus.flightNumber;
  
  switch (updateType) {
    case 'status':
      return `Flight ${flightNumber} status updated to: ${updateData.newStatus}`;
    case 'departure_time':
      return `Flight ${flightNumber} departure time updated to: ${new Date(updateData.newTime).toLocaleString()}`;
    case 'arrival_time':
      return `Flight ${flightNumber} arrival time updated to: ${new Date(updateData.newTime).toLocaleString()}`;
    case 'gate':
      return `Flight ${flightNumber} gate updated to: ${updateData.newGate}`;
    case 'terminal':
      return `Flight ${flightNumber} terminal updated to: ${updateData.newTerminal}`;
    case 'delay':
      return `Flight ${flightNumber} is delayed by ${updateData.delayMinutes} minutes`;
    case 'cancellation':
      return `Flight ${flightNumber} has been cancelled. Reason: ${updateData.reason || 'Not specified'}`;
    case 'boarding':
      return `Flight ${flightNumber} boarding has started at gate ${updateData.gate}`;
    case 'final_call':
      return `Final call for flight ${flightNumber} at gate ${updateData.gate}`;
    default:
      return `Flight ${flightNumber} has been updated`;
  }
}

/**
 * Clean up inactive connections
 */
function cleanupConnections() {
  userConnections.forEach((ws, userId) => {
    if (ws.readyState !== ws.OPEN) {
      userConnections.delete(userId);
      
      // Remove from all flight subscriptions
      flightSubscriptions.forEach((subscribers, flightId) => {
        subscribers.delete(userId);
        if (subscribers.size === 0) {
          flightSubscriptions.delete(flightId);
        }
      });
    }
  });
}

// Clean up inactive connections every 5 minutes
setInterval(cleanupConnections, 5 * 60 * 1000);

module.exports = {
  subscribeToFlightUpdates,
  unsubscribeFromFlightUpdates,
  getFlightStatus,
  broadcastFlightUpdate,
  flightSubscriptions,
  userConnections
};
