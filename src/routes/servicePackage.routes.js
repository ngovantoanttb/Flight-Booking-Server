const express = require('express');
const servicePackageController = require('../controllers/servicePackageController');

const router = express.Router();

// Public routes (no authentication required)
router.get(
	'/airlines/:airlineId',
	servicePackageController.getServicePackagesByAirline
);
router.get(
	'/flights/:flightId',
	servicePackageController.getServicePackagesByFlight
);
router.get('/', servicePackageController.getAllServicePackages);
router.get('/:id', servicePackageController.getServicePackageById);

module.exports = router;
