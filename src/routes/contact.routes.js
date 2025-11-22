/**
 * Contact Routes
 * Defines contact management API endpoints (GET, PUT only as per requirements)
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const contactController = require('../controllers/contactController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All contact routes require authentication
router.use(protect);

// Validation rules
const contactIdValidation = [
	param('id')
		.isInt({ min: 1 })
		.withMessage('ID liên hệ phải là số nguyên dương'),
];

const createContactValidation = [
	body('first_name')
		.notEmpty()
		.withMessage('Họ là bắt buộc')
		.isLength({ min: 1, max: 50 })
		.withMessage('Họ phải từ 1 đến 50 ký tự'),
	body('last_name')
		.notEmpty()
		.withMessage('Tên là bắt buộc')
		.isLength({ min: 1, max: 50 })
		.withMessage('Tên phải từ 1 đến 50 ký tự'),
	body('phone')
		.notEmpty()
		.withMessage('Số điện thoại là bắt buộc')
		.isLength({ min: 10, max: 20 })
		.withMessage('Số điện thoại phải từ 10 đến 20 ký tự'),
	body('email')
		.notEmpty()
		.withMessage('Email là bắt buộc')
		.isEmail()
		.withMessage('Email phải là địa chỉ email hợp lệ'),
	body('middle_name')
		.optional()
		.isLength({ min: 1, max: 50 })
		.withMessage('Tên đệm phải từ 1 đến 50 ký tự'),
	body('citizen_id')
		.optional()
		.isLength({ min: 12, max: 12 })
		.withMessage('Số CCCD/CMND phải có đúng 12 chữ số'),
	body('is_primary')
		.optional()
		.isBoolean()
		.withMessage('Trường is_primary phải là boolean'),
];

const updateContactValidation = [
	...contactIdValidation,
	body('first_name')
		.optional()
		.isLength({ min: 1, max: 50 })
		.withMessage('Họ phải từ 1 đến 50 ký tự'),
	body('middle_name')
		.optional()
		.isLength({ min: 1, max: 50 })
		.withMessage('Tên đệm phải từ 1 đến 50 ký tự'),
	body('last_name')
		.optional()
		.isLength({ min: 1, max: 50 })
		.withMessage('Tên phải từ 1 đến 50 ký tự'),
	body('phone')
		.optional()
		.isLength({ min: 10, max: 20 })
		.withMessage('Số điện thoại phải từ 10 đến 20 ký tự'),
	body('email')
		.optional()
		.isEmail()
		.withMessage('Email phải là địa chỉ email hợp lệ'),
	body('citizen_id')
		.optional()
		.isLength({ min: 12, max: 12 })
		.withMessage('Số CCCD/CMND phải có đúng 12 chữ số'),
	body('is_primary')
		.optional()
		.isBoolean()
		.withMessage('Trường is_primary phải là boolean'),
];

const paginationValidation = [
	query('page')
		.optional()
		.isInt({ min: 1 })
		.withMessage('Trang phải là số nguyên dương'),
	query('limit')
		.optional()
		.isInt({ min: 1, max: 100 })
		.withMessage('Giới hạn phải từ 1 đến 100'),
];

const searchValidation = [
	query('query')
		.notEmpty()
		.withMessage('Truy vấn tìm kiếm là bắt buộc')
		.isLength({ min: 2, max: 100 })
		.withMessage('Truy vấn tìm kiếm phải từ 2 đến 100 ký tự'),
];

// Contact routes
// Admin-only: list/search/stats of contacts
router.get(
	'/',
	paginationValidation,
	validate,
	authorize('admin'),
	contactController.getContacts
);

router.get('/stats', authorize('admin'), contactController.getContactStats);

router.get(
	'/search',
	[...paginationValidation, ...searchValidation],
	validate,
	authorize('admin'),
	contactController.searchContacts
);

router.get('/:id', contactIdValidation, validate, contactController.getContact);

router.post(
	'/',
	createContactValidation,
	validate,
	contactController.createContact
);

router.put(
	'/:id',
	updateContactValidation,
	validate,
	contactController.updateContact
);

router.delete(
	'/:id',
	contactIdValidation,
	validate,
	contactController.deleteContact
);

module.exports = router;
