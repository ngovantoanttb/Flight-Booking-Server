const express = require('express');
const authRoutes = require('./auth.routes');
const flightRoutes = require('./flight.routes');
const adminRoutes = require('./admin.routes');
const paymentRoutes = require('./payment.routes');
const bookingRoutes = require('./booking.routes');
const simplifiedBookingRoutes = require('./simplifiedBooking.routes');
const aiRoutes = require('./ai.routes');
const userRoutes = require('./user.routes');
const contactRoutes = require('./contact.routes');
const servicePackageRoutes = require('./servicePackage.routes');
const userBookingLookupRoutes = require('./userBookingLookup.routes');
const eticketRoutes = require('./eticket.routes');
const eticketSimpleRoutes = require('./eticketSimple.routes');
const flightServicesRoutes = require('./flightServices.routes');
const countryRoutes = require('./country.routes');
// const docsRoutes = require('./docs.routes');
// Import other route files as needed

const router = express.Router();

// Documentation routes (served at /docs)
// router.use('/docs', docsRoutes);

// API routes - specific routes first
router.use('/auth', authRoutes);
router.use('/flights', flightRoutes);
router.use('/admin', adminRoutes);
router.use('/payments', paymentRoutes);
router.use('/bookings', bookingRoutes);
router.use('/simple-bookings', simplifiedBookingRoutes);
router.use('/ai', aiRoutes);
router.use('/contacts', contactRoutes);
router.use('/service-packages', servicePackageRoutes);
router.use('/booking-lookup', userBookingLookupRoutes);
router.use('/eticket', eticketRoutes);
router.use('/eticket-simple', eticketSimpleRoutes);
router.use('/admin', flightServicesRoutes);
router.use('/countries', countryRoutes);

// Backwards-compatibility: allow routes under /users/* to map to the same handlers
router.use('/users', userRoutes);
// Generic user routes must come LAST to avoid conflicts
router.use('/', userRoutes);

// API health check
router.get('/health', (req, res) => {
	res.status(200).json({
		success: true,
		message: 'API is running',
		timestamp: new Date().toISOString(),
	});
});

module.exports = router;
