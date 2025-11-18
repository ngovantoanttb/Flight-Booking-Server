/**
 * Service Routes
 * Defines all service-related API endpoints (baggage, meals, etc.)
 */

const express = require('express');
const { param } = require('express-validator');
const serviceController = require('../controllers/serviceController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Validation rules
const flightIdValidation = [
  param('flightId')
    .isInt({ min: 1 })
    .withMessage('Flight ID must be a positive integer')
];

// Public routes for service information
router.get(
  '/flights/:flightId/baggage-options',
  flightIdValidation,
  validate,
  serviceController.getBaggageOptions
);

router.get(
  '/flights/:flightId/meal-options',
  flightIdValidation,
  validate,
  serviceController.getMealOptions
);

router.get(
  '/flights/:flightId/services',
  flightIdValidation,
  validate,
  serviceController.getFlightServices
);

// Protected routes for booking services
router.use(protect);

router.post(
  '/bookings/:bookingId/baggage',
  param('bookingId').isInt({ min: 1 }),
  validate,
  serviceController.addBaggageToBooking
);

router.post(
  '/bookings/:bookingId/meals',
  param('bookingId').isInt({ min: 1 }),
  validate,
  serviceController.addMealsToBooking
);

module.exports = router;