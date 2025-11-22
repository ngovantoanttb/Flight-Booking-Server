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
		.withMessage('Mã đặt chỗ là bắt buộc')
		.isLength({ min: 6, max: 10 })
		.withMessage('Mã đặt chỗ phải từ 6 đến 10 ký tự')
		.matches(/^[A-Z0-9]+$/)
		.withMessage(
			'Mã đặt chỗ chỉ được chứa chữ cái in hoa và số'
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
