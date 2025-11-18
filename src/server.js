const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('passport');
const config = require('./config/env.config');
const { connectDatabase } = require('./config/database');
const logger = require('./utils/logger');
const routes = require('./routes');
const {
	errorHandler,
	handleUnhandledRejection,
	handleUncaughtException,
} = require('./middleware/errorHandler');

// Initialize express app
const app = express();

// Connect to database
connectDatabase();

// Middleware
app.use(
	helmet({
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ["'self'"],
				styleSrc: [
					"'self'",
					"'unsafe-inline'",
					'https://cdnjs.cloudflare.com',
					'https://cdn.jsdelivr.net',
					'https://fonts.googleapis.com',
				],
				scriptSrc: [
					"'self'",
					"'unsafe-inline'",
					'https://cdnjs.cloudflare.com',
					'https://cdn.jsdelivr.net',
				],
				scriptSrcAttr: ["'unsafe-inline'"],
				fontSrc: [
					"'self'",
					'https://cdnjs.cloudflare.com',
					'https://fonts.gstatic.com',
				],
				imgSrc: ["'self'", 'data:', 'https:'],
				connectSrc: ["'self'"],
			},
		},
	})
);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (config.NODE_ENV === 'development') {
	app.use(morgan('dev'));
}

// Initialize passport
app.use(passport.initialize());
require('./config/passport');

// Serve static files
app.use(express.static('views'));

// Simple endpoint to receive auth callback when FRONTEND_URL points to this server
// This helps during local testing when there's no separate frontend running.
app.get('/auth/callback', (req, res) => {
	const { token, error } = req.query;
	if (error) {
		return res
			.status(400)
			.send(`<h1>Authentication Error</h1><p>${error}</p>`);
	}
	if (!token) {
		return res
			.status(200)
			.send(`<h1>Authentication Completed</h1><p>No token provided.</p>`);
	}
	// Show a minimal page with the token (you can copy it to localStorage in the browser)
	return res.status(200).send(`
		<html>
			<body style="font-family: Arial, sans-serif; padding: 2rem;">
				<h1>Authentication Successful</h1>
				<p>Copy the token below and store it in your frontend (localStorage/session):</p>
				<textarea style="width:100%;height:120px">${token}</textarea>
			</body>
		</html>
	`);
});

// API routes
app.use('/api', routes);

// Payment test page
app.get('/payment-test', (req, res) => {
	res.sendFile('payment-test.html', { root: 'views' });
});

// AI test page
app.get('/ai-test', (req, res) => {
	res.sendFile('ai-test.html', { root: 'views' });
});

// Payment success page (handled by payment controller)
const { handlePaymentSuccess } = require('./controllers/paymentController');
app.get('/payment/success', handlePaymentSuccess);

// 404 handler
app.use('*', (req, res) => {
	res.status(404).json({
		success: false,
		message: 'Endpoint not found',
		timestamp: new Date().toISOString(),
	});
});

// Global error handler
app.use(errorHandler);

// Start server
const PORT = config.PORT;
app.listen(PORT, () => {
	logger.info(`Server running in ${config.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', handleUnhandledRejection);

// Handle uncaught exceptions
process.on('uncaughtException', handleUncaughtException);

module.exports = app;
