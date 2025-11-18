/**
 * E-Ticket Routes
 * Routes for e-ticket PDF generation and data retrieval
 */

const express = require('express');
const router = express.Router();
const EticketController = require('../controllers/eticketController');
const { protect } = require('../middleware/auth');
const { param } = require('express-validator');
const validate = require('../middleware/validate');

// Validation rules
const bookingReferenceValidation = [
	param('bookingReference')
		.notEmpty()
		.withMessage('Booking reference is required')
		.isLength({ min: 6, max: 10 })
		.withMessage('Booking reference must be between 6 and 10 characters')
		.matches(/^[A-Z0-9]+$/)
		.withMessage(
			'Booking reference must contain only uppercase letters and numbers'
		),
];

/**
 * @route   GET /api/eticket/:bookingReference/pdf
 * @desc    Generate and download e-ticket PDF
 * @access  Public (for now, can be protected if needed)
 */
router.get(
	'/:bookingReference/pdf',
	bookingReferenceValidation,
	validate,
	EticketController.generateEticketPdf
);

/**
 * @route   GET /api/eticket/:bookingReference/data
 * @desc    Get e-ticket data (without PDF generation)
 * @access  Public (for now, can be protected if needed)
 */
router.get(
	'/:bookingReference/data',
	bookingReferenceValidation,
	validate,
	EticketController.getEticketData
);

module.exports = router;
