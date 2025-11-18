const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, Role, RefreshToken } = require('../models');
const config = require('../config/env.config');
const logger = require('../utils/logger');

// Generate access token
const generateAccessToken = (userId) => {
	return jwt.sign({ id: userId }, config.JWT_SECRET, {
		expiresIn: config.JWT_EXPIRES_IN,
	});
};

// Generate refresh token
const generateRefreshToken = () => {
	return crypto.randomBytes(64).toString('hex');
};

// Store refresh token in database
const storeRefreshToken = async (userId, token) => {
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

	return await RefreshToken.create({
		user_id: userId,
		token,
		expires_at: expiresAt,
	});
};

// Generate both tokens
const generateTokens = async (userId) => {
	const accessToken = generateAccessToken(userId);
	const refreshToken = generateRefreshToken();

	// Store refresh token in database
	await storeRefreshToken(userId, refreshToken);

	return { accessToken, refreshToken };
};

// Register new user
exports.register = async (req, res) => {
	try {
		const { email, password, first_name, last_name, phone, citizen_id } =
			req.body;

		// Check if user already exists
		const existingUser = await User.findByEmail(email);
		if (existingUser) {
			return res.status(400).json({
				success: false,
				message: 'Email already in use',
			});
		}

		// Create new user
		const user = await User.create({
			email,
			password,
			first_name,
			last_name,
			phone,
			citizen_id: citizen_id || null,
		});

		// Get user role
		const userRole = await Role.findOne({ where: { role_name: 'user' } });

		// Assign role to user
		await user.addRole(userRole);

		// Generate tokens
		const { accessToken, refreshToken } = await generateTokens(
			user.user_id
		);

		res.status(201).json({
			success: true,
			message: 'User registered successfully',
			data: {
				user: {
					id: user.user_id,
					email: user.email,
					first_name: user.first_name,
					last_name: user.last_name,
					citizen_id: user.citizen_id || null,
				},
				accessToken,
				refreshToken,
			},
		});
	} catch (error) {
		logger.error('Registration error:', error);
		res.status(500).json({
			success: false,
			message: 'Error registering user',
			error: error.message,
		});
	}
};

// Login user
exports.login = async (req, res) => {
	try {
		const { email, password } = req.body;

		// Find user by email
		const user = await User.findByEmail(email);
		if (!user) {
			return res.status(401).json({
				success: false,
				message: 'Invalid credentials',
			});
		}

		// Check if user is active
		if (!user.is_active) {
			return res.status(401).json({
				success: false,
				message: 'Account is inactive',
			});
		}

		// Check password
		const isPasswordValid = await user.comparePassword(password);
		if (!isPasswordValid) {
			return res.status(401).json({
				success: false,
				message: 'Invalid credentials',
			});
		}

		// Get user roles
		const roles = await user.getRoles();
		const roleNames = roles.map((role) => role.role_name);

		// Generate tokens
		const { accessToken, refreshToken } = await generateTokens(
			user.user_id
		);

		res.status(200).json({
			success: true,
			message: 'Login successful',
			data: {
				user: {
					id: user.user_id,
					email: user.email,
					first_name: user.first_name,
					last_name: user.last_name,
					citizen_id: user.citizen_id || null,
					roles: roleNames,
				},
				accessToken,
				refreshToken,
			},
		});
	} catch (error) {
		logger.error('Login error:', error);
		res.status(500).json({
			success: false,
			message: 'Error logging in',
			error: error.message,
		});
	}
};

// Google OAuth callback
exports.googleCallback = async (req, res) => {
	try {
		// User information is available in req.user after successful Google authentication
		const { id, emails, name } = req.user;

		// Find or create user
		let user = await User.findOne({ where: { google_id: id } });

		if (!user) {
			// Check if email exists
			user = await User.findByEmail(emails[0].value);

			if (user) {
				// Update existing user with Google ID
				user.google_id = id;
				await user.save();
			} else {
				// Create new user
				user = await User.create({
					email: emails[0].value,
					password: Math.random().toString(36).slice(-8), // Generate random password
					first_name: name.givenName,
					last_name: name.familyName,
					google_id: id,
					is_active: true,
				});

				// Get user role
				const userRole = await Role.findOne({
					where: { role_name: 'user' },
				});

				// Assign role to user
				await user.addRole(userRole);
			}
		}

		// Generate tokens
		const { accessToken, refreshToken } = await generateTokens(
			user.user_id
		);

		// Force absolute URL redirect to avoid path resolution issues with Express
		// This ensures we don't get 'undefined' in the path
		const absoluteUrl = `http://localhost:3000/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`;
		console.log('Redirecting to absolute URL:', absoluteUrl);
		return res.redirect(absoluteUrl);
	} catch (error) {
		logger.error('Google OAuth error:', error);
		return res.redirect(`${config.FRONTEND_URL}/auth/error`);
	}
};

// Get current user profile
exports.getProfile = async (req, res) => {
	try {
		const user = await User.findOne({
			where: { user_id: req.user.user_id },
			attributes: [
				'user_id',
				'email',
				'first_name',
				'middle_name',
				'last_name',
				'title',
				'phone',
				'date_of_birth',
				'citizen_id',
			],
			include: [
				{
					model: Role,
					attributes: ['role_name'],
					through: { attributes: [] },
				},
			],
		});

		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'User not found',
			});
		}

		const roles = user.Roles.map((role) => role.role_name);

		res.status(200).json({
			success: true,
			data: {
				id: user.user_id,
				email: user.email,
				first_name: user.first_name,
				middle_name: user.middle_name || null,
				last_name: user.last_name,
				title: user.title || null,
				phone: user.phone || null,
				date_of_birth: user.date_of_birth || null,
				citizen_id: user.citizen_id || null,
				roles,
			},
		});
	} catch (error) {
		logger.error('Get profile error:', error);
		res.status(500).json({
			success: false,
			message: 'Error fetching user profile',
			error: error.message,
		});
	}
};

// Update user profile
exports.updateProfile = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const {
			first_name,
			middle_name,
			last_name,
			title,
			phone,
			date_of_birth,
			citizen_id,
		} = req.body;

		// Find user
		const user = await User.findByPk(userId);
		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'User not found',
			});
		}

		// Prepare update data (only include fields that are provided)
		const updateData = {};
		if (first_name !== undefined) updateData.first_name = first_name;
		if (middle_name !== undefined) updateData.middle_name = middle_name;
		if (last_name !== undefined) updateData.last_name = last_name;
		if (title !== undefined) updateData.title = title;
		if (phone !== undefined) updateData.phone = phone;
		if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth;
		if (citizen_id !== undefined) updateData.citizen_id = citizen_id;

		// Update user
		await user.update(updateData);

		// Fetch updated user with roles
		const updatedUser = await User.findOne({
			where: { user_id: userId },
			attributes: [
				'user_id',
				'email',
				'first_name',
				'middle_name',
				'last_name',
				'title',
				'phone',
				'date_of_birth',
				'citizen_id',
			],
			include: [
				{
					model: Role,
					attributes: ['role_name'],
					through: { attributes: [] },
				},
			],
		});

		const roles = updatedUser.Roles.map((role) => role.role_name);

		res.status(200).json({
			success: true,
			message: 'Profile updated successfully',
			data: {
				id: updatedUser.user_id,
				email: updatedUser.email,
				first_name: updatedUser.first_name,
				middle_name: updatedUser.middle_name || null,
				last_name: updatedUser.last_name,
				title: updatedUser.title || null,
				phone: updatedUser.phone || null,
				date_of_birth: updatedUser.date_of_birth || null,
				citizen_id: updatedUser.citizen_id || null,
				roles,
			},
		});
	} catch (error) {
		logger.error('Update profile error:', error);
		res.status(500).json({
			success: false,
			message: 'Error updating profile',
			error: error.message,
		});
	}
};

// Change password
exports.changePassword = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const { current_password, new_password } = req.body;

		// Validate required fields
		if (!current_password || !new_password) {
			return res.status(400).json({
				success: false,
				message: 'Current password and new password are required',
			});
		}

		// Validate new password length
		if (new_password.length < 6) {
			return res.status(400).json({
				success: false,
				message: 'New password must be at least 6 characters long',
			});
		}

		// Find user
		const user = await User.findByPk(userId);
		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'User not found',
			});
		}

		// Verify current password
		const isPasswordValid = await user.comparePassword(current_password);
		if (!isPasswordValid) {
			return res.status(401).json({
				success: false,
				message: 'Current password is incorrect',
			});
		}

		// Check if new password is different from current password
		// Compare new_password with the current hashed password
		const isSamePassword = await user.comparePassword(new_password);
		if (isSamePassword) {
			return res.status(400).json({
				success: false,
				message: 'New password must be different from current password',
			});
		}

		// Update password (will be hashed by beforeUpdate hook)
		await user.update({ password: new_password });

		res.status(200).json({
			success: true,
			message: 'Password changed successfully',
		});
	} catch (error) {
		logger.error('Change password error:', error);
		res.status(500).json({
			success: false,
			message: 'Error changing password',
			error: error.message,
		});
	}
};

// Refresh access token
exports.refreshToken = async (req, res) => {
	try {
		const { refreshToken } = req.body;

		if (!refreshToken) {
			return res.status(401).json({
				success: false,
				message: 'Refresh token is required',
			});
		}

		// Find valid refresh token
		const tokenRecord = await RefreshToken.findValidToken(refreshToken);
		if (!tokenRecord) {
			return res.status(401).json({
				success: false,
				message: 'Invalid or expired refresh token',
			});
		}

		// Get user
		const user = await User.findOne({
			where: { user_id: tokenRecord.user_id },
		});
		if (!user || !user.is_active) {
			return res.status(401).json({
				success: false,
				message: 'User not found or inactive',
			});
		}

		// Revoke old refresh token
		await tokenRecord.update({ is_revoked: true });

		// Generate new tokens
		const { accessToken, refreshToken: newRefreshToken } =
			await generateTokens(user.user_id);

		res.status(200).json({
			success: true,
			message: 'Token refreshed successfully',
			data: {
				accessToken,
				refreshToken: newRefreshToken,
			},
		});
	} catch (error) {
		logger.error('Refresh token error:', error);
		res.status(500).json({
			success: false,
			message: 'Error refreshing token',
			error: error.message,
		});
	}
};

// Logout user (revoke refresh token)
exports.logout = async (req, res) => {
	try {
		const { refreshToken } = req.body;

		if (refreshToken) {
			// Revoke specific refresh token
			await RefreshToken.update(
				{ is_revoked: true },
				{ where: { token: refreshToken } }
			);
		} else if (req.user) {
			// Revoke all refresh tokens for the user
			await RefreshToken.revokeAllUserTokens(req.user.user_id);
		}

		res.status(200).json({
			success: true,
			message: 'Logged out successfully',
		});
	} catch (error) {
		logger.error('Logout error:', error);
		res.status(500).json({
			success: false,
			message: 'Error logging out',
			error: error.message,
		});
	}
};
