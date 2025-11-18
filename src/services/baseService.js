/**
 * Base Service Class
 * Provides common CRUD operations and utility methods
 */

const { Op } = require('sequelize');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const logger = require('../utils/logger');

class BaseService {
	constructor(model) {
		this.model = model;
	}

	/**
	 * Create a new record
	 * @param {Object} data - Data to create
	 * @returns {Promise<Object>} Created record
	 */
	async create(data) {
		try {
			const record = await this.model.create(data);
			logger.info(`${this.model.name} created successfully`, {
				id: record.id,
			});
			return record;
		} catch (error) {
			logger.error(`Error creating ${this.model.name}:`, error);
			throw error;
		}
	}

	/**
	 * Find record by ID
	 * @param {number} id - Record ID
	 * @param {Object} options - Query options
	 * @returns {Promise<Object>} Found record
	 */
	async findById(id, options = {}) {
		try {
			const record = await this.model.findByPk(id, options);
			if (!record) {
				throw new NotFoundError(`${this.model.name} not found`);
			}
			return record;
		} catch (error) {
			logger.error(`Error finding ${this.model.name} by ID:`, error);
			throw error;
		}
	}

	/**
	 * Find all records with pagination
	 * @param {Object} options - Query options
	 * @param {number} page - Page number
	 * @param {number} limit - Records per page
	 * @returns {Promise<Object>} Paginated results
	 */
	async findAll(options = {}, page = 1, limit = 10) {
		try {
			const offset = (page - 1) * limit;

			const { count, rows } = await this.model.findAndCountAll({
				...options,
				limit: parseInt(limit),
				offset: parseInt(offset),
			});

			const totalPages = Math.ceil(count / limit);

			return {
				data: rows,
				pagination: {
					currentPage: parseInt(page),
					totalPages,
					totalItems: count,
					itemsPerPage: parseInt(limit),
					hasNextPage: page < totalPages,
					hasPrevPage: page > 1,
				},
			};
		} catch (error) {
			logger.error(`Error finding ${this.model.name}:`, error);
			throw error;
		}
	}

	/**
	 * Find one record by conditions
	 * @param {Object} conditions - Search conditions
	 * @param {Object} options - Query options
	 * @returns {Promise<Object>} Found record
	 */
	async findOne(conditions, options = {}) {
		try {
			const record = await this.model.findOne({
				where: conditions,
				...options,
			});
			return record;
		} catch (error) {
			logger.error(`Error finding ${this.model.name}:`, error);
			throw error;
		}
	}

	/**
	 * Update record by ID
	 * @param {number} id - Record ID
	 * @param {Object} data - Update data
	 * @param {Object} options - Update options
	 * @returns {Promise<Object>} Updated record
	 */
	async updateById(id, data, options = {}) {
		try {
			const [updatedRowsCount] = await this.model.update(data, {
				where: { [this.getPrimaryKey()]: id },
				...options,
			});

			// If no rows were updated, it might be because the provided data is
			// identical to the existing record (no-op). In that case, verify the
			// record actually exists and return it instead of throwing NotFound.
			if (updatedRowsCount === 0) {
				try {
					const existing = await this.findById(id, options);
					logger.info(
						`${this.model.name} update had no changes, returning existing record`,
						{ id }
					);
					return existing;
				} catch (err) {
					// If findById fails, the record truly doesn't exist
					if (err instanceof NotFoundError) {
						throw new NotFoundError(`${this.model.name} not found`);
					}
					throw err;
				}
			}

			const updatedRecord = await this.findById(id, options);
			logger.info(`${this.model.name} updated successfully`, { id });
			return updatedRecord;
		} catch (error) {
			logger.error(`Error updating ${this.model.name}:`, error);
			throw error;
		}
	}

	/**
	 * Delete record by ID
	 * @param {number} id - Record ID
	 * @param {Object} options - Delete options
	 * @returns {Promise<boolean>} Success status
	 */
	async deleteById(id, options = {}) {
		try {
			const deletedRowsCount = await this.model.destroy({
				where: { [this.getPrimaryKey()]: id },
				...options,
			});

			if (deletedRowsCount === 0) {
				throw new NotFoundError(`${this.model.name} not found`);
			}

			logger.info(`${this.model.name} deleted successfully`, { id });
			return true;
		} catch (error) {
			logger.error(`Error deleting ${this.model.name}:`, error);
			throw error;
		}
	}

	/**
	 * Search records with filters
	 * @param {Object} filters - Search filters
	 * @param {Object} options - Query options
	 * @param {number} page - Page number
	 * @param {number} limit - Records per page
	 * @returns {Promise<Object>} Search results
	 */
	async search(filters = {}, options = {}, page = 1, limit = 10) {
		try {
			const whereClause = this.buildWhereClause(filters);
			const searchOptions = {
				...options,
				where: whereClause,
			};

			return await this.findAll(searchOptions, page, limit);
		} catch (error) {
			logger.error(`Error searching ${this.model.name}:`, error);
			throw error;
		}
	}

	/**
	 * Build WHERE clause from filters
	 * @param {Object} filters - Search filters
	 * @returns {Object} WHERE clause
	 */
	buildWhereClause(filters) {
		const whereClause = {};

		Object.keys(filters).forEach((key) => {
			const value = filters[key];

			if (value !== undefined && value !== null && value !== '') {
				if (typeof value === 'string') {
					whereClause[key] = {
						[Op.iLike]: `%${value}%`,
					};
				} else if (Array.isArray(value)) {
					whereClause[key] = {
						[Op.in]: value,
					};
				} else {
					whereClause[key] = value;
				}
			}
		});

		return whereClause;
	}

	/**
	 * Get primary key field name
	 * @returns {string} Primary key field name
	 */
	getPrimaryKey() {
		return this.model.primaryKeyAttribute || 'id';
	}

	/**
	 * Count records
	 * @param {Object} conditions - Count conditions
	 * @returns {Promise<number>} Record count
	 */
	async count(conditions = {}) {
		try {
			return await this.model.count({ where: conditions });
		} catch (error) {
			logger.error(`Error counting ${this.model.name}:`, error);
			throw error;
		}
	}

	/**
	 * Check if record exists
	 * @param {Object} conditions - Existence conditions
	 * @returns {Promise<boolean>} Existence status
	 */
	async exists(conditions) {
		try {
			const count = await this.count(conditions);
			return count > 0;
		} catch (error) {
			logger.error(`Error checking ${this.model.name} existence:`, error);
			throw error;
		}
	}
}

module.exports = BaseService;
