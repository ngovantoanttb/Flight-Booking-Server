/**
 * Service Package Controller
 * Handles HTTP requests for service package operations
 */

const { ServicePackage, Airline } = require('../models');
const { sendSuccess, sendError, sendNotFound } = require('../utils/response');
const logger = require('../utils/logger');

class ServicePackageController {
	/**
	 * Get service packages by airline
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async getServicePackagesByAirline(req, res, next) {
		try {
			const { airlineId } = req.params;
			const { class_type, package_type, is_active } = req.query;

			const whereClause = {
				airline_id: airlineId,
				is_active: is_active !== 'false',
			};

			// Add optional filters
			if (class_type) {
				whereClause.class_type = class_type;
			}
			if (package_type) {
				whereClause.package_type = package_type;
			}

			const servicePackages = await ServicePackage.findAll({
				where: whereClause,
				include: [
					{
						model: Airline,
						attributes: [
							'airline_id',
							'airline_name',
							'airline_code',
						],
					},
				],
				order: [
					['class_type', 'ASC'],
					['package_type', 'ASC'],
				],
			});

			// Transform response to include service_package_id
			const transformedPackages = servicePackages.map((pkg) => ({
				...pkg.toJSON(),
				service_package_id: pkg.package_id,
			}));

			return sendSuccess(
				res,
				'Service packages retrieved successfully',
				transformedPackages
			);
		} catch (error) {
			logger.error('Error in getServicePackagesByAirline:', error);
			next(error);
		}
	}

	/**
	 * Get service packages by flight
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async getServicePackagesByFlight(req, res, next) {
		try {
			const { flightId } = req.params;
			const { class_type, package_type } = req.query;

			// Get flight details first
			const { Flight } = require('../models');
			const flight = await Flight.findByPk(flightId, {
				include: [
					{
						model: Airline,
						attributes: [
							'airline_id',
							'airline_name',
							'airline_code',
						],
					},
				],
			});

			if (!flight) {
				return sendNotFound(res, 'Flight not found');
			}

			const whereClause = {
				airline_id: flight.airline_id,
				is_active: true,
			};

			// Add optional filters
			if (class_type) {
				whereClause.class_type = class_type;
			}
			if (package_type) {
				whereClause.package_type = package_type;
			}

			const servicePackages = await ServicePackage.findAll({
				where: whereClause,
				include: [
					{
						model: Airline,
						attributes: [
							'airline_id',
							'airline_name',
							'airline_code',
						],
					},
				],
				order: [
					['class_type', 'ASC'],
					['package_type', 'ASC'],
				],
			});

			// Transform response to include service_package_id
			const transformedPackages = servicePackages.map((pkg) => ({
				...pkg.toJSON(),
				service_package_id: pkg.package_id,
			}));

			return sendSuccess(res, 'Service packages retrieved successfully', {
				flight: {
					flight_id: flight.flight_id,
					flight_number: flight.flight_number,
					airline: flight.Airline,
				},
				service_packages: transformedPackages,
			});
		} catch (error) {
			logger.error('Error in getServicePackagesByFlight:', error);
			next(error);
		}
	}

	/**
	 * Get all service packages
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async getAllServicePackages(req, res, next) {
		try {
			const { airline_id, class_type, package_type, is_active } =
				req.query;

			const whereClause = {};

			// Add optional filters
			if (airline_id) {
				whereClause.airline_id = airline_id;
			}
			if (class_type) {
				whereClause.class_type = class_type;
			}
			if (package_type) {
				whereClause.package_type = package_type;
			}
			if (is_active !== undefined) {
				whereClause.is_active = is_active === 'true';
			}

			const servicePackages = await ServicePackage.findAll({
				where: whereClause,
				include: [
					{
						model: Airline,
						attributes: [
							'airline_id',
							'airline_name',
							'airline_code',
						],
					},
				],
				order: [
					['airline_id', 'ASC'],
					['class_type', 'ASC'],
					['package_type', 'ASC'],
				],
			});

			// Transform response to include service_package_id
			const transformedPackages = servicePackages.map((pkg) => ({
				...pkg.toJSON(),
				service_package_id: pkg.package_id,
			}));

			return sendSuccess(
				res,
				'Service packages retrieved successfully',
				transformedPackages
			);
		} catch (error) {
			logger.error('Error in getAllServicePackages:', error);
			next(error);
		}
	}

	/**
	 * Get all service packages (admin)
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async getServicePackages(req, res, next) {
		try {
			const { ServicePackage, Airline } = require('../models');
			const { sendPaginated } = require('../utils/response');
			const adminService = require('../services/adminService');

			const page = parseInt(req.query.page) || 1;
			const limit = parseInt(req.query.limit) || 10;
			const airline_id = req.query.airline_id;
			const class_type = req.query.class_type;
			const package_type = req.query.package_type;
			const is_active = req.query.is_active;

			const filters = {};
			if (airline_id) filters.airline_id = airline_id;
			if (class_type) filters.class_type = class_type;
			if (package_type) filters.package_type = package_type;
			if (is_active !== undefined)
				filters.is_active = is_active === 'true';

			const result = await adminService.getServicePackages(
				filters,
				page,
				limit
			);
			return sendPaginated(
				res,
				'Service packages retrieved successfully',
				result.data,
				result.pagination
			);
		} catch (error) {
			logger.error('Error in getServicePackages:', error);
			next(error);
		}
	}

	/**
	 * Get service package by ID
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 * @param {Function} next - Express next function
	 */
	async getServicePackageById(req, res, next) {
		try {
			const { id } = req.params;

			const servicePackage = await ServicePackage.findByPk(id, {
				include: [
					{
						model: Airline,
						attributes: [
							'airline_id',
							'airline_name',
							'airline_code',
						],
					},
				],
			});

			if (!servicePackage) {
				return sendNotFound(res, 'Service package not found');
			}

			// Transform response to include service_package_id
			const transformedPackage = {
				...servicePackage.toJSON(),
				service_package_id: servicePackage.package_id,
			};

			return sendSuccess(
				res,
				'Service package retrieved successfully',
				transformedPackage
			);
		} catch (error) {
			logger.error('Error in getServicePackageById:', error);
			next(error);
		}
	}
}

module.exports = new ServicePackageController();
