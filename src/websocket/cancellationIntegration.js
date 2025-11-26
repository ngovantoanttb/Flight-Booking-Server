/**
 * Integration hooks for cancellation approval workflow
 * Add these to existing booking and admin controllers
 */

const {
  notifyCancellationRequested,
  notifyCancellationApproved,
  notifyCancellationRejected,
  notifyAdminCancellationRequest,
  broadcastPendingCountUpdate
} = require('./cancellationApprovalService');

/**
 * Hook to call after user requests cancellation
 * Add this to simplifiedBookingController.requestCancellation()
 */
async function afterCancellationRequested(bookingData, userData) {
  try {
    // Notify user that request was submitted
    await notifyCancellationRequested(userData.user_id, {
      booking_id: bookingData.booking_id,
      booking_reference: bookingData.booking_reference
    });

    // Get admin user IDs (you may need to adjust this query)
    const { User, UserRole, Role } = require('../models');
    const adminUsers = await User.findAll({
      include: [{
        model: UserRole,
        as: 'userRoles',
        include: [{
          model: Role,
          as: 'role',
          where: { role_name: 'admin' }
        }]
      }]
    });

    const adminUserIds = adminUsers.map(user => user.id.toString());

    // Notify admins about new cancellation request
    await notifyAdminCancellationRequest(adminUserIds, {
      booking_id: bookingData.booking_id,
      booking_reference: bookingData.booking_reference,
      user_id: userData.user_id,
      user_email: userData.email,
      reason: bookingData.cancellation_reason,
      flight_details: bookingData.flight_details
    });

    // Update pending count for admin dashboard
    await broadcastPendingCountUpdate(adminUserIds);

  } catch (error) {
    console.error('Error in afterCancellationRequested hook:', error);
  }
}

/**
 * Hook to call after admin approves cancellation
 * Add this to adminController.updateBookingStatus()
 */
async function afterCancellationApproved(bookingData, adminUserId) {
  try {
    // Notify user that cancellation was approved
    await notifyCancellationApproved(bookingData.user_id.toString(), {
      booking_id: bookingData.booking_id,
      booking_reference: bookingData.booking_reference,
      approved_by: adminUserId,
      refund_amount: bookingData.total_amount,
      refund_method: 'Original payment method'
    });

    // Get admin user IDs for count update
    const { User, UserRole, Role } = require('../models');
    const adminUsers = await User.findAll({
      include: [{
        model: UserRole,
        as: 'userRoles',
        include: [{
          model: Role,
          as: 'role',
          where: { role_name: 'admin' }
        }]
      }]
    });

    const adminUserIds = adminUsers.map(user => user.id.toString());

    // Update pending count for admin dashboard
    await broadcastPendingCountUpdate(adminUserIds);

  } catch (error) {
    console.error('Error in afterCancellationApproved hook:', error);
  }
}

/**
 * Hook to call after admin rejects cancellation
 * Add this to adminController.updateBookingStatus()
 */
async function afterCancellationRejected(bookingData, adminUserId, rejectionReason) {
  try {
    // Notify user that cancellation was rejected
    await notifyCancellationRejected(bookingData.user_id.toString(), {
      booking_id: bookingData.booking_id,
      booking_reference: bookingData.booking_reference,
      rejected_by: adminUserId,
      reason: rejectionReason,
      can_resubmit: true
    });

    // Get admin user IDs for count update
    const { User, UserRole, Role } = require('../models');
    const adminUsers = await User.findAll({
      include: [{
        model: UserRole,
        as: 'userRoles',
        include: [{
          model: Role,
          as: 'role',
          where: { role_name: 'admin' }
        }]
      }]
    });

    const adminUserIds = adminUsers.map(user => user.id.toString());

    // Update pending count for admin dashboard
    await broadcastPendingCountUpdate(adminUserIds);

  } catch (error) {
    console.error('Error in afterCancellationRejected hook:', error);
  }
}

/**
 * Example integration with existing simplifiedBookingController.requestCancellation()
 */
function integrateWithBookingController() {
  return `
// Add this to src/controllers/simplifiedBookingController.js
// After line 359 (after booking.update):

const { afterCancellationRequested } = require('../websocket/cancellationIntegration');

// Add this after the booking update:
await afterCancellationRequested(
  {
    booking_id: booking.booking_id,
    booking_reference: booking.booking_reference,
    cancellation_reason: reason || 'Cancellation requested by user'
  },
  {
    user_id: userId,
    email: booking.contact_email
  }
);
`;
}

/**
 * Example integration with existing adminController.updateBookingStatus()
 */
function integrateWithAdminController() {
  return `
// Add this to src/controllers/adminController.js
// After line 716 (after sendSuccess for rejection):

const { afterCancellationRejected, afterCancellationApproved } = require('../websocket/cancellationIntegration');

// For rejection (after line 716):
await afterCancellationRejected(
  currentBooking,
  adminUserId,
  reject_reason || "Your cancellation request was denied by administration."
);

// For approval (add new logic when status becomes 'cancelled'):
if (status === 'cancelled' && currentBooking.status === 'pending_cancellation') {
  await afterCancellationApproved(currentBooking, adminUserId);
}
`;
}

module.exports = {
  afterCancellationRequested,
  afterCancellationApproved,
  afterCancellationRejected,
  integrateWithBookingController,
  integrateWithAdminController
};
