/**
 * User Booking Lookup Routes
 * Defines routes for user booking lookup functionality
 */

const express = require('express');
const { param } = require('express-validator');
const userBookingLookupController = require('../controllers/userBookingLookupController');
const validate = require('../middleware/validate');

const router = express.Router();

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

// Public routes (no authentication required for booking lookup)
router.get(
	'/lookup/:bookingReference',
	bookingReferenceValidation,
	validate,
	userBookingLookupController.lookupBooking
);

module.exports = router;
