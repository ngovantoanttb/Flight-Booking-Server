const express = require('express');
const router = express.Router();
const countryController = require('../controllers/countryController');

/**
 * @route   GET /api/countries
 * @desc    Get list of all countries
 * @access  Public
 */
router.get('/', countryController.getCountries);

module.exports = router;
