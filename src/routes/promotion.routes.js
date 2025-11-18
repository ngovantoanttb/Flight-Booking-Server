/**
 * Promotion Routes
 * Defines all promotion-related API endpoints
 */

const express = require('express');
const { body, param } = require('express-validator');
const promotionController = require('../controllers/promotionController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Validation rules
const promotionIdValidation = [
  param('promotionId')
    .isInt({ min: 1 })
    .withMessage('Promotion ID must be a positive integer')
];

const promotionValidation = [
  body('code')
    .notEmpty()
    .withMessage('Promotion code is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Promotion code must be between 3 and 20 characters'),
  body('description')
    .notEmpty()
    .withMessage('Description is required'),
  body('discount_percentage')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percentage must be between 0 and 100'),
  body('discount_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount amount must be a positive number'),
  body('start_date')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('end_date')
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.start_date)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('is_active')
    .isBoolean()
    .withMessage('Is active must be a boolean')
];

// Public routes
router.get(
  '/',
  promotionController.getActivePromotions
);

router.post(
  '/verify',
  body('code').notEmpty().withMessage('Promotion code is required'),
  validate,
  promotionController.verifyPromotionCode
);

// Protected routes (require authentication)
router.use(protect);

// Admin routes
router.use(authorize('admin'));

router.post(
  '/',
  promotionValidation,
  validate,
  promotionController.createPromotion
);

router.get(
  '/all',
  promotionController.getAllPromotions
);

router.get(
  '/:promotionId',
  promotionIdValidation,
  validate,
  promotionController.getPromotionById
);

router.put(
  '/:promotionId',
  promotionIdValidation,
  promotionValidation,
  validate,
  promotionController.updatePromotion
);

router.delete(
  '/:promotionId',
  promotionIdValidation,
  validate,
  promotionController.deletePromotion
);

module.exports = router;