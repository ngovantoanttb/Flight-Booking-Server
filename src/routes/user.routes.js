/**
 * User Routes
 * Defines all user-facing API endpoints
 */

const express = require('express');
const router = express.Router();

// Import các routes files
const authRoutes = require('./auth.routes');
const flightRoutes = require('./flight.routes');
const adminRoutes = require('./admin.routes');
const bookingRoutes = require('./booking.routes');
const paymentRoutes = require('./payment.routes');
const serviceRoutes = require('./service.routes');
const promotionRoutes = require('./promotion.routes');

// Đăng ký các routes 
router.use('/auth', authRoutes);
router.use('/flights', flightRoutes);
router.use('/admin', adminRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/services', serviceRoutes);
router.use('/promotions', promotionRoutes);

// Compatibility mounting: expose service routes at root so endpoints like
// GET /api/flights/:flightId/baggage-options work when client hits /api/...
// Service routes are already mounted at /services, but some clients use
// the shorter path. Mount serviceRoutes at root (no prefix) for compatibility.
router.use('/', serviceRoutes);

// API health check
router.get('/health', (req, res) => {
	res.status(200).json({
		success: true,
		message: 'API is running',
		timestamp: new Date().toISOString(),
	});
});

module.exports = router;
