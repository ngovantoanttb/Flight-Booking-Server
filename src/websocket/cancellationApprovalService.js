const logger = require('../utils/logger');
const { MESSAGE_TYPES } = require('./websocketHandlers');
const { broadcastToUser } = require('./websocketServer');

/**
 * Real-time notifications for cancellation approval workflow
 */

/**
 * Notify user when cancellation request is submitted
 * @param {string} userId - User ID
 * @param {Object} cancellationData - Cancellation request data
 */
async function notifyCancellationRequested(userId, cancellationData) {
  try {
    const message = {
      type: 'cancellation_requested',
      data: {
        bookingId: cancellationData.booking_id,
        bookingReference: cancellationData.booking_reference,
        status: 'pending_cancellation',
        message: `Cancellation request submitted for booking ${cancellationData.booking_reference}. Awaiting admin approval.`,
        requestedAt: new Date().toISOString()
      }
    };

    const sent = broadcastToUser(userId, message);
    
    if (sent) {
      logger.info(`Cancellation request notification sent to user ${userId} for booking ${cancellationData.booking_reference}`);
    } else {
      logger.debug(`User ${userId} not connected via WebSocket for cancellation request notification`);
    }
  } catch (error) {
    logger.error(`Error sending cancellation request notification to user ${userId}:`, error);
  }
}

/**
 * Notify user when cancellation is approved
 * @param {string} userId - User ID
 * @param {Object} approvalData - Approval data
 */
async function notifyCancellationApproved(userId, approvalData) {
  try {
    const message = {
      type: 'cancellation_approved',
      data: {
        bookingId: approvalData.booking_id,
        bookingReference: approvalData.booking_reference,
        status: 'cancelled',
        message: `Your cancellation request for booking ${approvalData.booking_reference} has been approved. Refund will be processed.`,
        approvedAt: new Date().toISOString(),
        approvedBy: approvalData.approved_by,
        refundAmount: approvalData.refund_amount,
        refundMethod: approvalData.refund_method
      }
    };

    const sent = broadcastToUser(userId, message);
    
    if (sent) {
      logger.info(`Cancellation approval notification sent to user ${userId} for booking ${approvalData.booking_reference}`);
    } else {
      logger.debug(`User ${userId} not connected via WebSocket for cancellation approval notification`);
    }
  } catch (error) {
    logger.error(`Error sending cancellation approval notification to user ${userId}:`, error);
  }
}

/**
 * Notify user when cancellation is rejected
 * @param {string} userId - User ID
 * @param {Object} rejectionData - Rejection data
 */
async function notifyCancellationRejected(userId, rejectionData) {
  try {
    const message = {
      type: 'cancellation_rejected',
      data: {
        bookingId: rejectionData.booking_id,
        bookingReference: rejectionData.booking_reference,
        status: 'cancellation_rejected',
        message: `Your cancellation request for booking ${rejectionData.booking_reference} has been rejected.`,
        rejectedAt: new Date().toISOString(),
        rejectedBy: rejectionData.rejected_by,
        reason: rejectionData.reason || 'Your cancellation request was denied by administration.',
        canResubmit: rejectionData.can_resubmit || false
      }
    };

    const sent = broadcastToUser(userId, message);
    
    if (sent) {
      logger.info(`Cancellation rejection notification sent to user ${userId} for booking ${rejectionData.booking_reference}`);
    } else {
      logger.debug(`User ${userId} not connected via WebSocket for cancellation rejection notification`);
    }
  } catch (error) {
    logger.error(`Error sending cancellation rejection notification to user ${userId}:`, error);
  }
}

/**
 * Notify admin when new cancellation request is received
 * @param {Array} adminUserIds - Array of admin user IDs
 * @param {Object} requestData - Cancellation request data
 */
async function notifyAdminCancellationRequest(adminUserIds, requestData) {
  try {
    const message = {
      type: 'admin_cancellation_request',
      data: {
        bookingId: requestData.booking_id,
        bookingReference: requestData.booking_reference,
        userId: requestData.user_id,
        userEmail: requestData.user_email,
        reason: requestData.reason,
        requestedAt: new Date().toISOString(),
        flightDetails: requestData.flight_details,
        message: `New cancellation request received for booking ${requestData.booking_reference}`
      }
    };

    let notifiedCount = 0;
    adminUserIds.forEach(adminId => {
      const sent = broadcastToUser(adminId, message);
      if (sent) notifiedCount++;
    });
    
    logger.info(`Cancellation request notification sent to ${notifiedCount} admin users for booking ${requestData.booking_reference}`);
  } catch (error) {
    logger.error(`Error sending cancellation request notification to admins:`, error);
  }
}

/**
 * Get pending cancellation requests count for admin dashboard
 * @returns {Promise<number>} Number of pending cancellation requests
 */
async function getPendingCancellationCount() {
  try {
    const { Booking } = require('../models');
    const count = await Booking.count({
      where: { status: 'pending_cancellation' }
    });
    return count;
  } catch (error) {
    logger.error('Error getting pending cancellation count:', error);
    return 0;
  }
}

/**
 * Broadcast pending cancellation count update to all admin users
 * @param {Array} adminUserIds - Array of admin user IDs
 */
async function broadcastPendingCountUpdate(adminUserIds) {
  try {
    const pendingCount = await getPendingCancellationCount();
    
    const message = {
      type: 'pending_cancellation_count',
      data: {
        count: pendingCount,
        message: `${pendingCount} cancellation requests pending approval`
      }
    };

    let notifiedCount = 0;
    adminUserIds.forEach(adminId => {
      const sent = broadcastToUser(adminId, message);
      if (sent) notifiedCount++;
    });
    
    logger.debug(`Pending cancellation count update sent to ${notifiedCount} admin users`);
  } catch (error) {
    logger.error('Error broadcasting pending cancellation count update:', error);
  }
}

module.exports = {
  notifyCancellationRequested,
  notifyCancellationApproved,
  notifyCancellationRejected,
  notifyAdminCancellationRequest,
  getPendingCancellationCount,
  broadcastPendingCountUpdate
};
