require('dotenv').config();

module.exports = {
	// Server Configuration
	NODE_ENV: process.env.NODE_ENV || 'development',
	PORT: process.env.PORT || 3000,

	// Database Configuration
	DB_HOST: process.env.DB_HOST || 'localhost',
	DB_PORT: process.env.DB_PORT || 3306,
	DB_USER: process.env.DB_USER || 'root',
	DB_PASS: process.env.DB_PASSWORD || '',
	DB_NAME: process.env.DB_NAME || 'flight_booking_db',

	// JWT Configuration
	JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_key',
	JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m', // Access token expires in 15 minutes
	JWT_REFRESH_SECRET:
		process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key',
	JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d', // Refresh token expires in 7 days

	// Google OAuth
	GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
	GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,

	// ZaloPay Configuration
	ZALOPAY_APP_ID: process.env.ZALOPAY_APP_ID,
	ZALOPAY_KEY1: process.env.ZALOPAY_KEY1,
	ZALOPAY_KEY2: process.env.ZALOPAY_KEY2,
	ZALOPAY_ENDPOINT: process.env.ZALOPAY_ENDPOINT,

	// Email Configuration
	EMAIL_HOST: process.env.EMAIL_HOST,
	EMAIL_PORT: process.env.EMAIL_PORT,
	EMAIL_USER: process.env.EMAIL_USER,
	EMAIL_PASS: process.env.EMAIL_PASS,
	EMAIL_FROM: process.env.EMAIL_FROM,

	// Base URL (Frontend URL)
	BASE_URL: process.env.BASE_URL || 'http://localhost:5000',
};
