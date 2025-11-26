const logger = require('../utils/logger');
const { broadcastFlightUpdate } = require('./flightNotificationService');
const { broadcastBookingUpdate } = require('./bookingNotificationService');

/**
 * WebSocket utility functions for integration with existing services
 */

/**
 * Notify flight status change
 * @param {string} flightId - Flight ID
 * @param {string} oldStatus - Previous status
 * @param {string} newStatus - New status
 * @param {Object} additionalData - Additional update data
 */
async function notifyFlightStatusChange(flightId, oldStatus, newStatus, additionalData = {}) {
  try {
    await broadcastFlightUpdate(flightId, {
      oldStatus,
      newStatus,
      ...additionalData
    }, 'status');
    
    logger.info(`Flight status notification sent for flight ${flightId}: ${oldStatus} -> ${newStatus}`);
  } catch (error) {
    logger.error(`Error sending flight status notification for ${flightId}:`, error);
  }
}

/**
 * Notify flight time change
 * @param {string} flightId - Flight ID
 * @param {string} timeType - 'departure' or 'arrival'
 * @param {Date} oldTime - Previous time
 * @param {Date} newTime - New time
 */
async function notifyFlightTimeChange(flightId, timeType, oldTime, newTime) {
  try {
    const delayMinutes = Math.round((new Date(newTime) - new Date(oldTime)) / (1000 * 60));
    
    await broadcastFlightUpdate(flightId, {
      timeType,
      oldTime,
      newTime,
      delayMinutes
    }, `${timeType}_time`);
    
    logger.info(`Flight time change notification sent for flight ${flightId}: ${timeType} ${delayMinutes > 0 ? 'delayed' : 'advanced'} by ${Math.abs(delayMinutes)} minutes`);
  } catch (error) {
    logger.error(`Error sending flight time notification for ${flightId}:`, error);
  }
}

/**
 * Notify flight gate/terminal change
 * @param {string} flightId - Flight ID
 * @param {string} changeType - 'gate' or 'terminal'
 * @param {string} oldValue - Previous value
 * @param {string} newValue - New value
 */
async function notifyFlightLocationChange(flightId, changeType, oldValue, newValue) {
  try {
    await broadcastFlightUpdate(flightId, {
      changeType,
      oldValue,
      newValue,
      [`old${changeType.charAt(0).toUpperCase() + changeType.slice(1)}`]: oldValue,
      [`new${changeType.charAt(0).toUpperCase() + changeType.slice(1)}`]: newValue
    }, changeType);
    
    logger.info(`Flight ${changeType} change notification sent for flight ${flightId}: ${oldValue} -> ${newValue}`);
  } catch (error) {
    logger.error(`Error sending flight ${changeType} notification for ${flightId}:`, error);
  }
}

/**
 * Notify booking status change
 * @param {string} bookingId - Booking ID
 * @param {string} oldStatus - Previous status
 * @param {string} newStatus - New status
 * @param {Object} additionalData - Additional update data
 */
async function notifyBookingStatusChange(bookingId, oldStatus, newStatus, additionalData = {}) {
  try {
    await broadcastBookingUpdate(bookingId, {
      oldStatus,
      newStatus,
      ...additionalData
    }, 'status');
    
    logger.info(`Booking status notification sent for booking ${bookingId}: ${oldStatus} -> ${newStatus}`);
  } catch (error) {
    logger.error(`Error sending booking status notification for ${bookingId}:`, error);
  }
}

/**
 * Notify payment status change
 * @param {string} bookingId - Booking ID
 * @param {string} paymentStatus - New payment status
 * @param {Object} paymentData - Payment details
 */
async function notifyPaymentStatusChange(bookingId, paymentStatus, paymentData = {}) {
  try {
    await broadcastBookingUpdate(bookingId, {
      paymentStatus,
      ...paymentData
    }, 'payment');
    
    logger.info(`Payment status notification sent for booking ${bookingId}: ${paymentStatus}`);
  } catch (error) {
    logger.error(`Error sending payment notification for ${bookingId}:`, error);
  }
}

/**
 * Notify check-in completion
 * @param {string} bookingId - Booking ID
 * @param {Array} seatNumbers - Assigned seat numbers
 * @param {string} boardingPassUrl - Boarding pass URL
 */
async function notifyCheckInComplete(bookingId, seatNumbers = [], boardingPassUrl = null) {
  try {
    await broadcastBookingUpdate(bookingId, {
      seatNumbers,
      boardingPassUrl,
      checkInTime: new Date().toISOString()
    }, 'check_in');
    
    logger.info(`Check-in notification sent for booking ${bookingId}`);
  } catch (error) {
    logger.error(`Error sending check-in notification for ${bookingId}:`, error);
  }
}

/**
 * Notify seat assignment
 * @param {string} bookingId - Booking ID
 * @param {Array} seatNumbers - Assigned seat numbers
 */
async function notifySeatAssignment(bookingId, seatNumbers) {
  try {
    await broadcastBookingUpdate(bookingId, {
      seatNumbers
    }, 'seat_assignment');
    
    logger.info(`Seat assignment notification sent for booking ${bookingId}: ${seatNumbers.join(', ')}`);
  } catch (error) {
    logger.error(`Error sending seat assignment notification for ${bookingId}:`, error);
  }
}

/**
 * Notify e-ticket generation
 * @param {string} bookingId - Booking ID
 * @param {string} eTicketUrl - E-ticket URL
 */
async function notifyETicketGenerated(bookingId, eTicketUrl) {
  try {
    await broadcastBookingUpdate(bookingId, {
      eTicketUrl
    }, 'e_ticket');
    
    logger.info(`E-ticket notification sent for booking ${bookingId}`);
  } catch (error) {
    logger.error(`Error sending e-ticket notification for ${bookingId}:`, error);
  }
}

/**
 * Notify boarding pass generation
 * @param {string} bookingId - Booking ID
 * @param {string} boardingPassUrl - Boarding pass URL
 */
async function notifyBoardingPassGenerated(bookingId, boardingPassUrl) {
  try {
    await broadcastBookingUpdate(bookingId, {
      boardingPassUrl
    }, 'boarding_pass');
    
    logger.info(`Boarding pass notification sent for booking ${bookingId}`);
  } catch (error) {
    logger.error(`Error sending boarding pass notification for ${bookingId}:`, error);
  }
}

/**
 * Send flight boarding announcement
 * @param {string} flightId - Flight ID
 * @param {string} gate - Gate number
 * @param {string} announcementType - 'boarding' or 'final_call'
 */
async function sendFlightBoardingAnnouncement(flightId, gate, announcementType = 'boarding') {
  try {
    await broadcastFlightUpdate(flightId, {
      gate,
      announcementType
    }, announcementType);
    
    logger.info(`Flight ${announcementType} announcement sent for flight ${flightId} at gate ${gate}`);
  } catch (error) {
    logger.error(`Error sending flight ${announcementType} announcement for ${flightId}:`, error);
  }
}

/**
 * Send flight cancellation notification
 * @param {string} flightId - Flight ID
 * @param {string} reason - Cancellation reason
 * @param {Object} compensationInfo - Compensation details
 */
async function notifyFlightCancellation(flightId, reason, compensationInfo = {}) {
  try {
    await broadcastFlightUpdate(flightId, {
      reason,
      compensationInfo
    }, 'cancellation');
    
    logger.info(`Flight cancellation notification sent for flight ${flightId}: ${reason}`);
  } catch (error) {
    logger.error(`Error sending flight cancellation notification for ${flightId}:`, error);
  }
}

/**
 * Integration helpers for existing controllers
 */

/**
 * Hook into flight update operations
 * This should be called from flight service/controller when flights are updated
 */
const flightUpdateHooks = {
  async afterStatusUpdate(flightId, oldStatus, newStatus, additionalData) {
    await notifyFlightStatusChange(flightId, oldStatus, newStatus, additionalData);
  },
  
  async afterTimeUpdate(flightId, timeType, oldTime, newTime) {
    await notifyFlightTimeChange(flightId, timeType, oldTime, newTime);
  },
  
  async afterLocationUpdate(flightId, changeType, oldValue, newValue) {
    await notifyFlightLocationChange(flightId, changeType, oldValue, newValue);
  }
};

/**
 * Hook into booking update operations
 * This should be called from booking service/controller when bookings are updated
 */
const bookingUpdateHooks = {
  async afterStatusUpdate(bookingId, oldStatus, newStatus, additionalData) {
    await notifyBookingStatusChange(bookingId, oldStatus, newStatus, additionalData);
  },
  
  async afterPaymentUpdate(bookingId, paymentStatus, paymentData) {
    await notifyPaymentStatusChange(bookingId, paymentStatus, paymentData);
  },
  
  async afterCheckIn(bookingId, seatNumbers, boardingPassUrl) {
    await notifyCheckInComplete(bookingId, seatNumbers, boardingPassUrl);
  },
  
  async afterSeatAssignment(bookingId, seatNumbers) {
    await notifySeatAssignment(bookingId, seatNumbers);
  },
  
  async afterETicketGeneration(bookingId, eTicketUrl) {
    await notifyETicketGenerated(bookingId, eTicketUrl);
  }
};

/**
 * Utility to format WebSocket message
 * @param {string} type - Message type
 * @param {Object} data - Message data
 * @param {string} message - Human-readable message
 * @returns {Object} Formatted WebSocket message
 */
function formatWebSocketMessage(type, data = {}, message = '') {
  return {
    type,
    data,
    message,
    timestamp: new Date().toISOString()
  };
}

/**
 * Validate WebSocket connection health
 * @param {WebSocket} ws - WebSocket connection
 * @returns {boolean} True if connection is healthy
 */
function isConnectionHealthy(ws) {
  return ws && ws.readyState === ws.OPEN && ws.isAlive !== false;
}

module.exports = {
  // Flight notifications
  notifyFlightStatusChange,
  notifyFlightTimeChange,
  notifyFlightLocationChange,
  sendFlightBoardingAnnouncement,
  notifyFlightCancellation,
  
  // Booking notifications
  notifyBookingStatusChange,
  notifyPaymentStatusChange,
  notifyCheckInComplete,
  notifySeatAssignment,
  notifyETicketGenerated,
  notifyBoardingPassGenerated,
  
  // Integration hooks
  flightUpdateHooks,
  bookingUpdateHooks,
  
  // Utilities
  formatWebSocketMessage,
  isConnectionHealthy
};
