/**
 * Simple E-Ticket Routes
 * Simplified routes for testing
 */

const express = require('express');
const router = express.Router();
const EticketControllerSimple = require('../controllers/eticketControllerSimple');
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
 * @route   GET /api/eticket-simple/:bookingReference/data
 * @desc    Get e-ticket data (simplified version)
 * @access  Public
 */
router.get(
	'/:bookingReference/data',
	bookingReferenceValidation,
	validate,
	EticketControllerSimple.getEticketData
);

module.exports = router;
