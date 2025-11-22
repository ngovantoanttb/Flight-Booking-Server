const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Validation rules
const registerValidation = [
	body('email').isEmail().withMessage('Vui lòng cung cấp email hợp lệ'),
	body('password')
		.isLength({ min: 6 })
		.withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
	body('first_name').notEmpty().withMessage('Họ là bắt buộc'),
	body('last_name').notEmpty().withMessage('Tên là bắt buộc'),
	body('citizen_id')
		.optional()
		.isLength({ min: 12, max: 12 })
		.withMessage('Số CCCD/CMND phải có đúng 12 chữ số')
		.matches(/^\d{12}$/)
		.withMessage('Số CCCD/CMND chỉ được chứa chữ số'),
];

const loginValidation = [
	body('email').isEmail().withMessage('Vui lòng cung cấp email hợp lệ'),
	body('password').notEmpty().withMessage('Mật khẩu là bắt buộc'),
];

const refreshTokenValidation = [
	body('refreshToken').notEmpty().withMessage('Refresh token là bắt buộc'),
];

const logoutValidation = [
	body('refreshToken')
		.optional()
		.notEmpty()
		.withMessage('Refresh token không được để trống nếu được cung cấp'),
];

const updateProfileValidation = [
	body('first_name')
		.optional()
		.notEmpty()
		.withMessage('Họ không được để trống'),
	body('last_name')
		.optional()
		.notEmpty()
		.withMessage('Tên không được để trống'),
	body('middle_name')
		.optional()
		.isString()
		.withMessage('Tên đệm phải là chuỗi'),
	body('title')
		.optional()
		.isIn(['Mr', 'Mrs', 'Ms', 'Dr', 'Prof'])
		.withMessage('Danh xưng phải là một trong: Mr, Mrs, Ms, Dr, Prof'),
	body('phone')
		.optional()
		.isString()
		.withMessage('Số điện thoại phải là chuỗi'),
	body('date_of_birth')
		.optional()
		.isISO8601()
		.toDate()
		.withMessage('Ngày sinh phải là ngày hợp lệ'),
	body('citizen_id')
		.optional()
		.isLength({ min: 12, max: 12 })
		.withMessage('Số CCCD/CMND phải có đúng 12 chữ số')
		.matches(/^\d{12}$/)
		.withMessage('Số CCCD/CMND chỉ được chứa chữ số'),
];

const changePasswordValidation = [
	body('current_password')
		.notEmpty()
		.withMessage('Mật khẩu hiện tại là bắt buộc'),
	body('new_password')
		.isLength({ min: 6 })
		.withMessage('Mật khẩu mới phải có ít nhất 6 ký tự'),
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
		message: 'Xác thực Google thất bại',
	});
});

module.exports = router;
