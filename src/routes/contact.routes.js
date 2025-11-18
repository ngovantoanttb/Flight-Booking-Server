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
		.withMessage('Contact ID must be a positive integer'),
];

const createContactValidation = [
	body('first_name')
		.notEmpty()
		.withMessage('First name is required')
		.isLength({ min: 1, max: 50 })
		.withMessage('First name must be between 1 and 50 characters'),
	body('last_name')
		.notEmpty()
		.withMessage('Last name is required')
		.isLength({ min: 1, max: 50 })
		.withMessage('Last name must be between 1 and 50 characters'),
	body('phone')
		.notEmpty()
		.withMessage('Phone is required')
		.isLength({ min: 10, max: 20 })
		.withMessage('Phone must be between 10 and 20 characters'),
	body('email')
		.notEmpty()
		.withMessage('Email is required')
		.isEmail()
		.withMessage('Email must be a valid email address'),
	body('middle_name')
		.optional()
		.isLength({ min: 1, max: 50 })
		.withMessage('Middle name must be between 1 and 50 characters'),
	body('citizen_id')
		.optional()
		.isLength({ min: 12, max: 12 })
		.withMessage('Citizen ID must be exactly 12 digits'),
	body('is_primary')
		.optional()
		.isBoolean()
		.withMessage('Is primary must be a boolean'),
];

const updateContactValidation = [
	...contactIdValidation,
	body('first_name')
		.optional()
		.isLength({ min: 1, max: 50 })
		.withMessage('First name must be between 1 and 50 characters'),
	body('middle_name')
		.optional()
		.isLength({ min: 1, max: 50 })
		.withMessage('Middle name must be between 1 and 50 characters'),
	body('last_name')
		.optional()
		.isLength({ min: 1, max: 50 })
		.withMessage('Last name must be between 1 and 50 characters'),
	body('phone')
		.optional()
		.isLength({ min: 10, max: 20 })
		.withMessage('Phone must be between 10 and 20 characters'),
	body('email')
		.optional()
		.isEmail()
		.withMessage('Email must be a valid email address'),
	body('citizen_id')
		.optional()
		.isLength({ min: 12, max: 12 })
		.withMessage('Citizen ID must be exactly 12 digits'),
	body('is_primary')
		.optional()
		.isBoolean()
		.withMessage('Is primary must be a boolean'),
];

const paginationValidation = [
	query('page')
		.optional()
		.isInt({ min: 1 })
		.withMessage('Page must be a positive integer'),
	query('limit')
		.optional()
		.isInt({ min: 1, max: 100 })
		.withMessage('Limit must be between 1 and 100'),
];

const searchValidation = [
	query('query')
		.notEmpty()
		.withMessage('Search query is required')
		.isLength({ min: 2, max: 100 })
		.withMessage('Search query must be between 2 and 100 characters'),
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
