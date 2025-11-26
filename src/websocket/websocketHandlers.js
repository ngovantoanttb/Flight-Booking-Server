const logger = require('../utils/logger');
const { 
  subscribeToFlightUpdates, 
  unsubscribeFromFlightUpdates,
  getFlightStatus 
} = require('./flightNotificationService');
const { 
  subscribeToBookingUpdates, 
  unsubscribeFromBookingUpdates,
  getBookingStatus 
} = require('./bookingNotificationService');

// Message types
const MESSAGE_TYPES = {
  // Client to Server
  SUBSCRIBE_FLIGHT: 'subscribe_flight',
  UNSUBSCRIBE_FLIGHT: 'unsubscribe_flight',
  SUBSCRIBE_BOOKING: 'subscribe_booking',
  UNSUBSCRIBE_BOOKING: 'unsubscribe_booking',
  GET_FLIGHT_STATUS: 'get_flight_status',
  GET_BOOKING_STATUS: 'get_booking_status',
  GET_PENDING_CANCELLATIONS: 'get_pending_cancellations',
  PING: 'ping',
  
  // Server to Client
  FLIGHT_UPDATE: 'flight_update',
  BOOKING_UPDATE: 'booking_update',
  FLIGHT_STATUS: 'flight_status',
  BOOKING_STATUS: 'booking_status',
  CANCELLATION_REQUESTED: 'cancellation_requested',
  CANCELLATION_APPROVED: 'cancellation_approved',
  CANCELLATION_REJECTED: 'cancellation_rejected',
  ADMIN_CANCELLATION_REQUEST: 'admin_cancellation_request',
  PENDING_CANCELLATION_COUNT: 'pending_cancellation_count',
  NOTIFICATION: 'notification',
  ERROR: 'error',
  PONG: 'pong',
  WELCOME: 'welcome'
};

/**
 * Handle new WebSocket connection
 * @param {WebSocket} ws - WebSocket connection
 * @param {Object} user - Decoded user info from JWT
 */
function handleConnection(ws, user) {
  logger.info(`WebSocket connected: User ${user.id} (${user.role})`);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: MESSAGE_TYPES.WELCOME,
    message: 'Connected to Flight Booking WebSocket',
    userId: user.id,
    timestamp: new Date().toISOString()
  }));
  
  // Initialize user subscriptions
  ws.flightSubscriptions = new Set();
  ws.bookingSubscriptions = new Set();
}

/**
 * Handle incoming WebSocket messages
 * @param {WebSocket} ws - WebSocket connection
 * @param {Object} message - Parsed message object
 */
async function handleMessage(ws, message) {
  const { type, data } = message;
  
  logger.debug(`WebSocket message from user ${ws.userId}: ${type}`, data);
  
  try {
    switch (type) {
      case MESSAGE_TYPES.PING:
        handlePing(ws);
        break;
        
      case MESSAGE_TYPES.SUBSCRIBE_FLIGHT:
        await handleSubscribeFlight(ws, data);
        break;
        
      case MESSAGE_TYPES.UNSUBSCRIBE_FLIGHT:
        await handleUnsubscribeFlight(ws, data);
        break;
        
      case MESSAGE_TYPES.SUBSCRIBE_BOOKING:
        await handleSubscribeBooking(ws, data);
        break;
        
      case MESSAGE_TYPES.UNSUBSCRIBE_BOOKING:
        await handleUnsubscribeBooking(ws, data);
        break;
        
      case MESSAGE_TYPES.GET_FLIGHT_STATUS:
        await handleGetFlightStatus(ws, data);
        break;
        
      case MESSAGE_TYPES.GET_BOOKING_STATUS:
        await handleGetBookingStatus(ws, data);
        break;
        
      default:
        ws.send(JSON.stringify({
          type: MESSAGE_TYPES.ERROR,
          message: `Unknown message type: ${type}`,
          timestamp: new Date().toISOString()
        }));
    }
  } catch (error) {
    logger.error(`Error handling WebSocket message from user ${ws.userId}:`, error);
    ws.send(JSON.stringify({
      type: MESSAGE_TYPES.ERROR,
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    }));
  }
}

/**
 * Handle WebSocket disconnection
 * @param {WebSocket} ws - WebSocket connection
 * @param {number} code - Close code
 * @param {string} reason - Close reason
 */
function handleDisconnection(ws, code, reason) {
  logger.info(`WebSocket disconnected: User ${ws.userId}, Code: ${code}, Reason: ${reason}`);
  
  // Clean up subscriptions
  if (ws.flightSubscriptions) {
    ws.flightSubscriptions.forEach(flightId => {
      unsubscribeFromFlightUpdates(flightId, ws.userId);
    });
  }
  
  if (ws.bookingSubscriptions) {
    ws.bookingSubscriptions.forEach(bookingId => {
      unsubscribeFromBookingUpdates(bookingId, ws.userId);
    });
  }
}

// Message handlers
function handlePing(ws) {
  ws.send(JSON.stringify({
    type: MESSAGE_TYPES.PONG,
    timestamp: new Date().toISOString()
  }));
}

async function handleSubscribeFlight(ws, data) {
  const { flightId } = data;
  
  if (!flightId) {
    ws.send(JSON.stringify({
      type: MESSAGE_TYPES.ERROR,
      message: 'Flight ID is required',
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  try {
    await subscribeToFlightUpdates(flightId, ws.userId, ws);
    ws.flightSubscriptions.add(flightId);
    
    ws.send(JSON.stringify({
      type: MESSAGE_TYPES.NOTIFICATION,
      message: `Subscribed to flight ${flightId} updates`,
      data: { flightId },
      timestamp: new Date().toISOString()
    }));
    
    logger.info(`User ${ws.userId} subscribed to flight ${flightId}`);
  } catch (error) {
    logger.error(`Error subscribing to flight ${flightId}:`, error);
    ws.send(JSON.stringify({
      type: MESSAGE_TYPES.ERROR,
      message: 'Failed to subscribe to flight updates',
      timestamp: new Date().toISOString()
    }));
  }
}

async function handleUnsubscribeFlight(ws, data) {
  const { flightId } = data;
  
  if (!flightId) {
    ws.send(JSON.stringify({
      type: MESSAGE_TYPES.ERROR,
      message: 'Flight ID is required',
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  try {
    await unsubscribeFromFlightUpdates(flightId, ws.userId);
    ws.flightSubscriptions.delete(flightId);
    
    ws.send(JSON.stringify({
      type: MESSAGE_TYPES.NOTIFICATION,
      message: `Unsubscribed from flight ${flightId} updates`,
      data: { flightId },
      timestamp: new Date().toISOString()
    }));
    
    logger.info(`User ${ws.userId} unsubscribed from flight ${flightId}`);
  } catch (error) {
    logger.error(`Error unsubscribing from flight ${flightId}:`, error);
    ws.send(JSON.stringify({
      type: MESSAGE_TYPES.ERROR,
      message: 'Failed to unsubscribe from flight updates',
      timestamp: new Date().toISOString()
    }));
  }
}

async function handleSubscribeBooking(ws, data) {
  const { bookingId } = data;
  
  if (!bookingId) {
    ws.send(JSON.stringify({
      type: MESSAGE_TYPES.ERROR,
      message: 'Booking ID is required',
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  try {
    await subscribeToBookingUpdates(bookingId, ws.userId, ws);
    ws.bookingSubscriptions.add(bookingId);
    
    ws.send(JSON.stringify({
      type: MESSAGE_TYPES.NOTIFICATION,
      message: `Subscribed to booking ${bookingId} updates`,
      data: { bookingId },
      timestamp: new Date().toISOString()
    }));
    
    logger.info(`User ${ws.userId} subscribed to booking ${bookingId}`);
  } catch (error) {
    logger.error(`Error subscribing to booking ${bookingId}:`, error);
    ws.send(JSON.stringify({
      type: MESSAGE_TYPES.ERROR,
      message: 'Failed to subscribe to booking updates',
      timestamp: new Date().toISOString()
    }));
  }
}

async function handleUnsubscribeBooking(ws, data) {
  const { bookingId } = data;
  
  if (!bookingId) {
    ws.send(JSON.stringify({
      type: MESSAGE_TYPES.ERROR,
      message: 'Booking ID is required',
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  try {
    await unsubscribeFromBookingUpdates(bookingId, ws.userId);
    ws.bookingSubscriptions.delete(bookingId);
    
    ws.send(JSON.stringify({
      type: MESSAGE_TYPES.NOTIFICATION,
      message: `Unsubscribed from booking ${bookingId} updates`,
      data: { bookingId },
      timestamp: new Date().toISOString()
    }));
    
    logger.info(`User ${ws.userId} unsubscribed from booking ${bookingId}`);
  } catch (error) {
    logger.error(`Error unsubscribing from booking ${bookingId}:`, error);
    ws.send(JSON.stringify({
      type: MESSAGE_TYPES.ERROR,
      message: 'Failed to unsubscribe from booking updates',
      timestamp: new Date().toISOString()
    }));
  }
}

async function handleGetFlightStatus(ws, data) {
  const { flightId } = data;
  
  if (!flightId) {
    ws.send(JSON.stringify({
      type: MESSAGE_TYPES.ERROR,
      message: 'Flight ID is required',
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  try {
    const flightStatus = await getFlightStatus(flightId);
    
    ws.send(JSON.stringify({
      type: MESSAGE_TYPES.FLIGHT_STATUS,
      data: flightStatus,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    logger.error(`Error getting flight status for ${flightId}:`, error);
    ws.send(JSON.stringify({
      type: MESSAGE_TYPES.ERROR,
      message: 'Failed to get flight status',
      timestamp: new Date().toISOString()
    }));
  }
}

async function handleGetBookingStatus(ws, data) {
  const { bookingId } = data;
  
  if (!bookingId) {
    ws.send(JSON.stringify({
      type: MESSAGE_TYPES.ERROR,
      message: 'Booking ID is required',
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  try {
    const bookingStatus = await getBookingStatus(bookingId, ws.userId);
    
    ws.send(JSON.stringify({
      type: MESSAGE_TYPES.BOOKING_STATUS,
      data: bookingStatus,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    logger.error(`Error getting booking status for ${bookingId}:`, error);
    ws.send(JSON.stringify({
      type: MESSAGE_TYPES.ERROR,
      message: 'Failed to get booking status',
      timestamp: new Date().toISOString()
    }));
  }
}

// Utility functions
function broadcastToUser(connections, userId, message) {
  const ws = connections.get(userId);
  if (ws && ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({
      ...message,
      timestamp: new Date().toISOString()
    }));
    return true;
  }
  return false;
}

function broadcastToAll(connections, message) {
  let sentCount = 0;
  connections.forEach((ws, userId) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({
        ...message,
        timestamp: new Date().toISOString()
      }));
      sentCount++;
    }
  });
  return sentCount;
}

module.exports = {
  MESSAGE_TYPES,
  handleConnection,
  handleMessage,
  handleDisconnection,
  broadcastToUser,
  broadcastToAll
};
