const { Country } = require('../models');
const { sendSuccess, sendError, sendServerError } = require('../utils/response');
const logger = require('../utils/logger');

const countryController = {
	/**
	 * Get list of all countries
	 * GET /api/countries
	 */
	async getCountries(req, res) {
		try {
			const countries = await Country.findAll({
				attributes: ['country_id', 'country_code', 'country_name'],
				order: [['country_name', 'ASC']],
			});

			return sendSuccess(
				res,
				'Countries retrieved successfully',
				countries
			);
		} catch (error) {
			logger.error('Error getting countries:', error);
			return sendServerError(
				res,
				`Failed to retrieve countries: ${error.message}`
			);
		}
	},
};

module.exports = countryController;
