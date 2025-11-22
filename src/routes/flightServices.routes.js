const express = require('express');
const { body, param, query } = require('express-validator');
const adminService = require('../services/adminService');
const { protect, authorize } = require('../middleware/auth');
const validateRequest = require('../middleware/validate');
const { ApiResponse } = require('../utils/response');
const logger = require('../utils/logger');

const router = express.Router();

// Apply admin authentication to all routes
router.use(protect);
router.use(authorize('admin'));

// Validation rules
const baggageServiceValidation = [
	body('weight_kg').isDecimal().withMessage('Trọng lượng phải là số thập phân hợp lệ'),
	body('price').isDecimal().withMessage('Giá phải là số thập phân hợp lệ'),
	body('description')
		.optional()
		.isString()
		.withMessage('Mô tả phải là chuỗi'),
	body('is_active')
		.optional()
		.isBoolean()
		.withMessage('Trường is_active phải là boolean'),
];

const mealServiceValidation = [
	body('meal_name')
		.isString()
		.isLength({ min: 1, max: 100 })
		.withMessage('Tên bữa ăn là bắt buộc và phải từ 1-100 ký tự'),
	body('meal_description')
		.optional()
		.isString()
		.withMessage('Mô tả bữa ăn phải là chuỗi'),
	body('price').isDecimal().withMessage('Giá phải là số thập phân hợp lệ'),
	body('is_vegetarian')
		.optional()
		.isBoolean()
		.withMessage('Trường is_vegetarian phải là boolean'),
	body('is_halal')
		.optional()
		.isBoolean()
		.withMessage('Trường is_halal phải là boolean'),
	body('is_active')
		.optional()
		.isBoolean()
		.withMessage('Trường is_active phải là boolean'),
];

const flightIdValidation = [
	param('flightId').isInt().withMessage('ID chuyến bay phải là số nguyên hợp lệ'),
];

// Get flight baggage services
router.get(
	'/flights/:flightId/baggage-services',
	flightIdValidation,
	validateRequest,
	async (req, res) => {
		try {
			const { flightId } = req.params;
			const baggageServices = await adminService.getFlightBaggageServices(
				flightId
			);

			res.json(
				ApiResponse.success(
					'Flight baggage services retrieved successfully',
					baggageServices
				)
			);
		} catch (error) {
			logger.error('Error getting flight baggage services:', error);
			res.status(error.statusCode || 500).json(
				ApiResponse.error(
					error.message || 'Failed to get flight baggage services'
				)
			);
		}
	}
);

// Create flight baggage service
router.post(
	'/flights/:flightId/baggage-services',
	flightIdValidation,
	baggageServiceValidation,
	validateRequest,
	async (req, res) => {
		try {
			const { flightId } = req.params;
			const baggageServiceData = req.body;

			const baggageService =
				await adminService.createFlightBaggageService(
					flightId,
					baggageServiceData
				);

			res.status(201).json(
				ApiResponse.success(
					'Flight baggage service created successfully',
					baggageService
				)
			);
		} catch (error) {
			logger.error('Error creating flight baggage service:', error);
			res.status(error.statusCode || 500).json(
				ApiResponse.error(
					error.message || 'Failed to create flight baggage service'
				)
			);
		}
	}
);

// Update flight baggage service
router.put(
	'/flights/:flightId/baggage-services/:serviceId',
	flightIdValidation,
	param('serviceId')
		.isInt()
		.withMessage('ID dịch vụ phải là số nguyên hợp lệ'),
	baggageServiceValidation,
	validateRequest,
	async (req, res) => {
		try {
			const { flightId, serviceId } = req.params;
			const updateData = req.body;

			const baggageService =
				await adminService.updateFlightBaggageService(
					flightId,
					serviceId,
					updateData
				);

			res.json(
				ApiResponse.success(
					'Flight baggage service updated successfully',
					baggageService
				)
			);
		} catch (error) {
			logger.error('Error updating flight baggage service:', error);
			res.status(error.statusCode || 500).json(
				ApiResponse.error(
					error.message || 'Failed to update flight baggage service'
				)
			);
		}
	}
);

// Delete flight baggage service
router.delete(
	'/flights/:flightId/baggage-services/:serviceId',
	flightIdValidation,
	param('serviceId')
		.isInt()
		.withMessage('ID dịch vụ phải là số nguyên hợp lệ'),
	validateRequest,
	async (req, res) => {
		try {
			const { flightId, serviceId } = req.params;

			await adminService.deleteFlightBaggageService(flightId, serviceId);

			res.json(
				ApiResponse.success(
					'Flight baggage service deleted successfully',
					null
				)
			);
		} catch (error) {
			logger.error('Error deleting flight baggage service:', error);
			res.status(error.statusCode || 500).json(
				ApiResponse.error(
					error.message || 'Failed to delete flight baggage service'
				)
			);
		}
	}
);

// Get flight meal services
router.get(
	'/flights/:flightId/meal-services',
	flightIdValidation,
	validateRequest,
	async (req, res) => {
		try {
			const { flightId } = req.params;
			const mealServices = await adminService.getFlightMealServices(
				flightId
			);

			res.json(
				ApiResponse.success(
					'Flight meal services retrieved successfully',
					mealServices
				)
			);
		} catch (error) {
			logger.error('Error getting flight meal services:', error);
			res.status(error.statusCode || 500).json(
				ApiResponse.error(
					error.message || 'Failed to get flight meal services'
				)
			);
		}
	}
);

// Create flight meal service
router.post(
	'/flights/:flightId/meal-services',
	flightIdValidation,
	mealServiceValidation,
	validateRequest,
	async (req, res) => {
		try {
			const { flightId } = req.params;
			const mealServiceData = req.body;

			const mealService = await adminService.createFlightMealService(
				flightId,
				mealServiceData
			);

			res.status(201).json(
				ApiResponse.success(
					'Flight meal service created successfully',
					mealService
				)
			);
		} catch (error) {
			logger.error('Error creating flight meal service:', error);
			res.status(error.statusCode || 500).json(
				ApiResponse.error(
					error.message || 'Failed to create flight meal service'
				)
			);
		}
	}
);

// Update flight meal service
router.put(
	'/flights/:flightId/meal-services/:serviceId',
	flightIdValidation,
	param('serviceId')
		.isInt()
		.withMessage('ID dịch vụ phải là số nguyên hợp lệ'),
	mealServiceValidation,
	validateRequest,
	async (req, res) => {
		try {
			const { flightId, serviceId } = req.params;
			const updateData = req.body;

			const mealService = await adminService.updateFlightMealService(
				flightId,
				serviceId,
				updateData
			);

			res.json(
				ApiResponse.success(
					'Flight meal service updated successfully',
					mealService
				)
			);
		} catch (error) {
			logger.error('Error updating flight meal service:', error);
			res.status(error.statusCode || 500).json(
				ApiResponse.error(
					error.message || 'Failed to update flight meal service'
				)
			);
		}
	}
);

// Delete flight meal service
router.delete(
	'/flights/:flightId/meal-services/:serviceId',
	flightIdValidation,
	param('serviceId')
		.isInt()
		.withMessage('ID dịch vụ phải là số nguyên hợp lệ'),
	validateRequest,
	async (req, res) => {
		try {
			const { flightId, serviceId } = req.params;

			await adminService.deleteFlightMealService(flightId, serviceId);

			res.json(
				ApiResponse.success(
					'Flight meal service deleted successfully',
					null
				)
			);
		} catch (error) {
			logger.error('Error deleting flight meal service:', error);
			res.status(error.statusCode || 500).json(
				ApiResponse.error(
					error.message || 'Failed to delete flight meal service'
				)
			);
		}
	}
);

module.exports = router;
