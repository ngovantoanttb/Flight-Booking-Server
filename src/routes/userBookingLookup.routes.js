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
		.withMessage('Mã đặt chỗ là bắt buộc')
		.isLength({ min: 6, max: 10 })
		.withMessage('Mã đặt chỗ phải từ 6 đến 10 ký tự')
		.matches(/^[A-Z0-9]+$/)
		.withMessage(
			'Mã đặt chỗ chỉ được chứa chữ cái in hoa và số'
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
