const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const { ExtractJwt } = require('passport-jwt');
const { User } = require('../models');
const config = require('./env.config');
const logger = require('../utils/logger');

// JWT strategy for authentication
const jwtOptions = {
	jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
	secretOrKey: config.JWT_SECRET,
};

passport.use(
	new JwtStrategy(jwtOptions, async (payload, done) => {
		try {
			// Find user by id
			const user = await User.findByPk(payload.id);

			if (!user) {
				return done(null, false);
			}

			if (!user.is_active) {
				return done(null, false);
			}

			return done(null, user);
		} catch (error) {
			logger.error('JWT strategy error:', error);
			return done(error, false);
		}
	})
);

// Google OAuth strategy (only if configured)
if (config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET) {
	passport.use(
		new GoogleStrategy(
			{
				clientID: config.GOOGLE_CLIENT_ID,
				clientSecret: config.GOOGLE_CLIENT_SECRET,
				callbackURL: config.GOOGLE_CALLBACK_URL,
				scope: ['profile', 'email'],
			},
			async (accessToken, refreshToken, profile, done) => {
				try {
					// Find user by Google ID
					let user = await User.findOne({
						where: { google_id: profile.id },
					});

					// If user doesn't exist, check by email
					if (!user && profile.emails && profile.emails.length > 0) {
						const email = profile.emails[0].value;
						user = await User.findOne({ where: { email } });

						// If user exists, update Google ID
						if (user) {
							user.google_id = profile.id;
							await user.save();
						}
					}

					// If user still doesn't exist, create new user
					if (!user && profile.emails && profile.emails.length > 0) {
						const email = profile.emails[0].value;
						const firstName = profile.name?.givenName || '';
						const lastName = profile.name?.familyName || '';

						user = await User.create({
							email,
							google_id: profile.id,
							first_name: firstName,
							last_name: lastName,
							password: Math.random().toString(36).slice(-8), // Random password
							is_active: true,
						});

						// Assign user role
						const { Role } = require('../models');
						const userRole = await Role.findOne({
							where: { role_name: 'user' },
						});
						if (userRole) {
							await user.addRole(userRole);
						}
					}

					return done(null, profile);
				} catch (error) {
					logger.error('Google strategy error:', error);
					return done(error, false);
				}
			}
		)
	);
} else {
	logger.warn(
		'Google OAuth not configured. Skipping Google strategy initialization.'
	);
}

module.exports = passport;
