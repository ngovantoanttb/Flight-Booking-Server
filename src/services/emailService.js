/**
 * Mock Email Service
 * This is a placeholder implementation for email notifications
 */

const logger = require('../utils/logger');

const emailService = {
  /**
   * Send booking confirmation email
   * @param {string} email - Recipient email address
   * @param {Object} bookingData - Booking information
   * @returns {Promise<boolean>} - Success status
   */
  sendBookingConfirmation: async (email, bookingData) => {
    try {
      // Log the email sending attempt (for development)
      logger.info(`MOCK EMAIL: Booking confirmation sent to ${email}`);
      logger.info('Booking data:', JSON.stringify(bookingData));
      
      // In a real implementation, this would send an actual email
      // Example: await sendMailWithTemplate('booking-confirmation', email, bookingData);
      
      // Record email notification in database
      try {
        const { EmailNotification } = require('../models');
        await EmailNotification.create({
          user_id: bookingData.user_id || 0,
          booking_id: bookingData.booking_id,
          notification_type: 'booking_confirmation',
          email_subject: `Booking Confirmation - ${bookingData.booking_reference}`,
          email_content: `Dear customer, your booking with reference ${bookingData.booking_reference} has been confirmed. Thank you for choosing our service.`,
          status: 'sent'
        });
      } catch (dbError) {
        logger.error('Error recording email notification:', dbError);
      }
      
      return true;
    } catch (error) {
      logger.error('Error sending booking confirmation email:', error);
      return false;
    }
  },
  
  /**
   * Send e-ticket email
   * @param {string} email - Recipient email address
   * @param {Object} ticketData - E-ticket information
   * @returns {Promise<boolean>} - Success status
   */
  sendETicket: async (email, ticketData) => {
    try {
      // Log the email sending attempt (for development)
      logger.info(`MOCK EMAIL: E-ticket sent to ${email}`);
      logger.info('Ticket data:', JSON.stringify(ticketData));
      
      // In a real implementation, this would send an actual email with PDF attachment
      // Example: await sendMailWithAttachment('e-ticket', email, ticketData, pdfBuffer);
      
      return true;
    } catch (error) {
      logger.error('Error sending e-ticket email:', error);
      return false;
    }
  },
  
  /**
   * Send booking cancellation email
   * @param {string} email - Recipient email address
   * @param {Object} cancellationData - Cancellation information
   * @returns {Promise<boolean>} - Success status
   */
  sendCancellationRequest: async (email, cancellationData) => {
    try {
      // Log the email sending attempt (for development)
      logger.info(`MOCK EMAIL: Cancellation request sent to ${email}`);
      logger.info('Cancellation data:', JSON.stringify(cancellationData));
      
      // In a real implementation, this would send an actual email
      // Example: await sendMailWithTemplate('booking-cancellation-request', email, cancellationData);
      
      // Record email notification in database
      try {
        const { EmailNotification } = require('../models');
        await EmailNotification.create({
          user_id: cancellationData.user_id || 0,
          booking_id: cancellationData.booking_id,
          notification_type: 'cancellation',
          email_subject: `Booking Cancellation Request - ${cancellationData.booking_reference}`,
          email_content: `Your request to cancel booking ${cancellationData.booking_reference} has been submitted. ${cancellationData.reason ? 'Reason: ' + cancellationData.reason : ''} Estimated refund: ${cancellationData.refund_amount_estimate}`,
          status: 'sent'
        });
      } catch (dbError) {
        logger.error('Error recording cancellation request email notification:', dbError);
      }
      
      return true;
    } catch (error) {
      logger.error('Error sending cancellation request email:', error);
      return false;
    }
  },
  
  sendCancellationNotification: async (email, cancellationData) => {
    try {
      // Log the email sending attempt (for development)
      logger.info(`MOCK EMAIL: Cancellation notification sent to ${email}`);
      logger.info('Cancellation data:', JSON.stringify(cancellationData));
      
      // In a real implementation, this would send an actual email
      // Example: await sendMailWithTemplate('booking-cancellation', email, cancellationData);
      
      // Record email notification in database
      try {
        const { EmailNotification } = require('../models');
        await EmailNotification.create({
          user_id: cancellationData.user_id || 0,
          booking_id: cancellationData.booking_id,
          notification_type: 'cancellation',
          email_subject: `Booking Cancellation - ${cancellationData.booking_reference}`,
          email_content: `Your booking with reference ${cancellationData.booking_reference} has been cancelled. ${cancellationData.reason ? 'Reason: ' + cancellationData.reason : ''}`,
          status: 'sent'
        });
      } catch (dbError) {
        logger.error('Error recording cancellation email notification:', dbError);
      }
      
      return true;
    } catch (error) {
      logger.error('Error sending cancellation email:', error);
      return false;
    }
  },
  
  /**
   * Send cancellation rejection email
   * @param {string} email - Recipient email address
   * @param {Object} rejectionData - Rejection information
   * @returns {Promise<boolean>} - Success status
   */
  sendCancellationRejection: async (email, rejectionData) => {
    try {
      // Log the email sending attempt (for development)
      logger.info(`MOCK EMAIL: Cancellation rejection sent to ${email}`);
      logger.info('Rejection data:', JSON.stringify(rejectionData));
      
      // In a real implementation, this would send an actual email
      // Example: await sendMailWithTemplate('cancellation-rejected', email, rejectionData);
      
      // Record email notification in database
      try {
        const { EmailNotification } = require('../models');
        await EmailNotification.create({
          user_id: rejectionData.user_id || 0,
          booking_id: rejectionData.booking_id,
          notification_type: 'other',
          email_subject: `Cancellation Request Rejected - ${rejectionData.booking_reference}`,
          email_content: `Dear customer, your request to cancel booking ${rejectionData.booking_reference} has been rejected. ${rejectionData.reason ? 'Reason: ' + rejectionData.reason : 'Please contact customer support for more information.'}`,
          status: 'sent'
        });
      } catch (dbError) {
        logger.error('Error recording cancellation rejection email notification:', dbError);
      }
      
      return true;
    } catch (error) {
      logger.error('Error sending cancellation rejection email:', error);
      return false;
    }
  },
  
  /**
   * Send payment confirmation email
   * @param {string} email - Recipient email address
   * @param {Object} paymentData - Payment information
   * @returns {Promise<boolean>} - Success status
   */
  sendPaymentConfirmation: async (email, paymentData) => {
    try {
      // Log the email sending attempt (for development)
      logger.info(`MOCK EMAIL: Payment confirmation sent to ${email}`);
      logger.info('Payment data:', JSON.stringify(paymentData));
      
      // In a real implementation, this would send an actual email
      // Example: await sendMailWithTemplate('payment-confirmation', email, paymentData);
      
      return true;
    } catch (error) {
      logger.error('Error sending payment confirmation email:', error);
      return false;
    }
  }
};

module.exports = emailService;