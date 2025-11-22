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
    .withMessage('ID khuyến mãi phải là số nguyên dương')
];

const promotionValidation = [
  body('code')
    .notEmpty()
    .withMessage('Mã khuyến mãi là bắt buộc')
    .isLength({ min: 3, max: 20 })
    .withMessage('Mã khuyến mãi phải từ 3 đến 20 ký tự'),
  body('description')
    .notEmpty()
    .withMessage('Mô tả là bắt buộc'),
  body('discount_percentage')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Phần trăm giảm giá phải từ 0 đến 100'),
  body('discount_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Số tiền giảm giá phải là số dương'),
  body('start_date')
    .isISO8601()
    .withMessage('Ngày bắt đầu phải là ngày hợp lệ'),
  body('end_date')
    .isISO8601()
    .withMessage('Ngày kết thúc phải là ngày hợp lệ')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.start_date)) {
        throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
      }
      return true;
    }),
  body('is_active')
    .isBoolean()
    .withMessage('Trường is_active phải là boolean')
];

// Public routes
router.get(
  '/',
  promotionController.getActivePromotions
);

router.post(
  '/verify',
  body('code').notEmpty().withMessage('Mã khuyến mãi là bắt buộc'),
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