const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Validation rules
const registerValidation = [
	body('email').isEmail().withMessage('Please provide a valid email'),
	body('password')
		.isLength({ min: 6 })
		.withMessage('Password must be at least 6 characters long'),
	body('first_name').notEmpty().withMessage('First name is required'),
	body('last_name').notEmpty().withMessage('Last name is required'),
	body('citizen_id')
		.optional()
		.isLength({ min: 12, max: 12 })
		.withMessage('Citizen ID must be exactly 12 digits')
		.matches(/^\d{12}$/)
		.withMessage('Citizen ID must contain only digits'),
];

const loginValidation = [
	body('email').isEmail().withMessage('Please provide a valid email'),
	body('password').notEmpty().withMessage('Password is required'),
];

const refreshTokenValidation = [
	body('refreshToken').notEmpty().withMessage('Refresh token is required'),
];

const logoutValidation = [
	body('refreshToken')
		.optional()
		.notEmpty()
		.withMessage('Refresh token must not be empty if provided'),
];

const updateProfileValidation = [
	body('first_name')
		.optional()
		.notEmpty()
		.withMessage('First name must not be empty'),
	body('last_name')
		.optional()
		.notEmpty()
		.withMessage('Last name must not be empty'),
	body('middle_name')
		.optional()
		.isString()
		.withMessage('Middle name must be a string'),
	body('title')
		.optional()
		.isIn(['Mr', 'Mrs', 'Ms', 'Dr', 'Prof'])
		.withMessage('Title must be one of: Mr, Mrs, Ms, Dr, Prof'),
	body('phone')
		.optional()
		.isString()
		.withMessage('Phone must be a string'),
	body('date_of_birth')
		.optional()
		.isISO8601()
		.toDate()
		.withMessage('Date of birth must be a valid date'),
	body('citizen_id')
		.optional()
		.isLength({ min: 12, max: 12 })
		.withMessage('Citizen ID must be exactly 12 digits')
		.matches(/^\d{12}$/)
		.withMessage('Citizen ID must contain only digits'),
];

const changePasswordValidation = [
	body('current_password')
		.notEmpty()
		.withMessage('Current password is required'),
	body('new_password')
		.isLength({ min: 6 })
		.withMessage('New password must be at least 6 characters long'),
];

// Routes
router.post('/register', registerValidation, validate, authController.register);
router.post('/login', loginValidation, validate, authController.login);
router.post(
	'/refresh-token',
	refreshTokenValidation,
	validate,
	authController.refreshToken
);
router.post('/logout', logoutValidation, validate, authController.logout);
router.get('/profile', protect, authController.getProfile);
router.put(
	'/profile',
	protect,
	updateProfileValidation,
	validate,
	authController.updateProfile
);
router.put(
	'/change-password',
	protect,
	changePasswordValidation,
	validate,
	authController.changePassword
);

// Google OAuth routes
const passport = require('passport');

// Initiate Google OAuth flow (no session)
router.get(
	'/google',
	passport.authenticate('google', {
		scope: ['profile', 'email'],
		session: false,
	})
);

// Google OAuth callback - handle authentication and then pass control to controller (no session)
router.get(
	'/google/callback',
	passport.authenticate('google', {
		failureRedirect: '/auth/google/failure',
		session: false,
	}),
	authController.googleCallback
);

// Optional failure route
router.get('/google/failure', (req, res) => {
	res.status(401).json({
		success: false,
		message: 'Google authentication failed',
	});
});

module.exports = router;
