/**
 * Payment Routes
 * Combines public webhook/callback endpoints with protected payment routes
 */

const express = require('express');
const { body, param } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Validation rules
const paymentIdValidation = [
  param('paymentId')
    .isInt({ min: 1 })
    .withMessage('Payment ID must be a positive integer')
];

const processPaymentValidation = [
  body('booking_id')
    .isInt({ min: 1 })
    .withMessage('Booking ID must be a positive integer'),
  body('payment_method')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['zalopay', 'credit_card', 'bank_transfer', 'cod'])
    .withMessage('Invalid payment method'),
  body('return_url')
    .optional()
    .custom((value) => {
      // Accept empty or valid URLs; allow localhost (which some clients use)
      try {
        const url = new URL(value);
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return true;
        return ['http:', 'https:'].includes(url.protocol);
      } catch (e) {
        throw new Error('Return URL must be a valid URL');
      }
    })
];

// Public routes (no authentication required)
// ZaloPay callback - must be public for ZaloPay to call
router.post('/zalopay/callback', paymentController.handleZaloPayCallback);
// ZaloPay webhook endpoint (also public)
router.post('/webhooks/zalopay', paymentController.zaloPayWebhook);

// Protected routes (authentication required)
router.use(protect);

// ZaloPay payment routes
router.post('/zalopay/create', paymentController.createZaloPayPayment);
router.post('/zalopay/status', paymentController.checkPaymentStatus);
router.post('/zalopay/refund', paymentController.createRefund);

// General payment routes
router.get('/history', paymentController.getPaymentHistory);

// Payment options and processing
router.get('/options', paymentController.getPaymentOptions);
router.post('/', processPaymentValidation, validate, paymentController.processPayment);
router.get('/:paymentId', paymentIdValidation, validate, paymentController.getPaymentStatus);

module.exports = router;