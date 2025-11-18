const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');
const config = require('../config/env.config');
const logger = require('../utils/logger');

// Middleware to protect routes
exports.protect = async (req, res, next) => {
	try {
		let token;

		// Get token from Authorization header
		if (
			req.headers.authorization &&
			req.headers.authorization.startsWith('Bearer')
		) {
			token = req.headers.authorization.split(' ')[1];
		}

		// Check if token exists
		if (!token) {
			return res.status(401).json({
				success: false,
				message: 'Not authorized to access this route',
			});
		}

		try {
			// Verify token
			const decoded = jwt.verify(token, config.JWT_SECRET);

			// Get user from token
			const user = await User.findOne({ where: { user_id: decoded.id } });

			if (!user) {
				return res.status(401).json({
					success: false,
					message: 'User not found',
				});
			}

			// Check if user is active
			if (!user.is_active) {
				return res.status(401).json({
					success: false,
					message: 'User account is inactive',
				});
			}

			// Add user to request object
			req.user = {
				user_id: user.user_id,
				email: user.email,
				first_name: user.first_name,
				last_name: user.last_name,
			};
			next();
		} catch (error) {
			return res.status(401).json({
				success: false,
				message: 'Not authorized to access this route',
			});
		}
	} catch (error) {
		logger.error('Auth middleware error:', error);
		res.status(500).json({
			success: false,
			message: 'Server error in auth middleware',
		});
	}
};

// Middleware to restrict access to specific roles
exports.authorize = (...roles) => {
	return async (req, res, next) => {
		try {
			// Get user roles through UserRole association
			const user = await User.findByPk(req.user.user_id, {
				include: [
					{
						model: Role,
						through: { attributes: [] }, // Exclude UserRole attributes
					},
				],
			});

			if (!user) {
				return res.status(401).json({
					success: false,
					message: 'User not found',
				});
			}

			const roleNames = user.Roles.map((role) => role.role_name);

			// Check if user has required role
			const authorized = roles.some((role) => roleNames.includes(role));

			if (!authorized) {
				return res.status(403).json({
					success: false,
					message: 'Not authorized to access this route',
				});
			}

			next();
		} catch (error) {
			logger.error('Role authorization error:', error);
			res.status(500).json({
				success: false,
				message: 'Server error in role authorization',
			});
		}
	};
};
