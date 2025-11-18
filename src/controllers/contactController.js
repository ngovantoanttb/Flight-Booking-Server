/**
 * Contact Controller
 * Manages contact information (GET, PUT operations only as per requirements)
 */

const { Contact } = require('../models');
const {
	sendSuccess,
	sendError,
	sendNotFound,
	sendServerError,
} = require('../utils/response');
const logger = require('../utils/logger');

class ContactController {
	/**
	 * Get all contacts with pagination
	 * @param {Object} req Express request object
	 * @param {Object} res Express response object
	 * @param {Function} next Express next function
	 */
	async getContacts(req, res, next) {
		try {
			const page = parseInt(req.query.page) || 1;
			const limit = parseInt(req.query.limit) || 10;
			const offset = (page - 1) * limit;
			const {
				search,
				contact_id,
				first_name,
				last_name,
				phone,
				email,
				citizen_id,
			} = req.query;

			const { Op } = require('sequelize');
			const whereClause = {};

			if (search) {
				const term = `%${search}%`;
				whereClause[Op.or] = [
					{ first_name: { [Op.like]: term } },
					{ middle_name: { [Op.like]: term } },
					{ last_name: { [Op.like]: term } },
					{ email: { [Op.like]: term } },
					{ phone: { [Op.like]: term } },
					{ citizen_id: { [Op.like]: term } },
				];
			}

			if (contact_id) {
				whereClause.contact_id = parseInt(contact_id);
			}

			if (first_name) {
				whereClause.first_name = { [Op.like]: `%${first_name}%` };
			}

			if (last_name) {
				whereClause.last_name = { [Op.like]: `%${last_name}%` };
			}

			if (phone) {
				whereClause.phone = { [Op.like]: `%${phone}%` };
			}

			if (email) {
				whereClause.email = { [Op.like]: `%${email}%` };
			}

			if (citizen_id) {
				whereClause.citizen_id = { [Op.like]: `%${citizen_id}%` };
			}

			const { count, rows: contacts } = await Contact.findAndCountAll({
				where: whereClause,
				limit,
				offset,
				order: [['created_at', 'DESC']],
			});

			const totalPages = Math.ceil(count / limit);

			return sendSuccess(res, 'Contacts retrieved successfully', {
				contacts,
				pagination: {
					currentPage: page,
					totalPages,
					totalItems: count,
					itemsPerPage: limit,
					hasNextPage: page < totalPages,
					hasPrevPage: page > 1,
				},
			});
		} catch (error) {
			logger.error('Error getting contacts:', error);
			return sendServerError(res, 'Failed to retrieve contacts');
		}
	}

	/**
	 * Get contact by ID
	 * @param {Object} req Express request object
	 * @param {Object} res Express response object
	 * @param {Function} next Express next function
	 */
	async getContact(req, res, next) {
		try {
			const { id } = req.params;
			const contact = await Contact.findByPk(id);

			// Only allow owner or admin to view the contact
			if (!contact) {
				return sendNotFound(res, 'Contact not found');
			}
			const requesterId = req.user ? req.user.user_id : null;
			const isOwner = requesterId && contact.user_id === requesterId;
			// if not owner, check admin role
			if (!isOwner) {
				// load roles from req.user if possible; fallback to Role lookup
				const { User, Role } = require('../models');
				if (!req.user) {
					return sendError(res, 'Not authorized', 401);
				}
				const user = await User.findByPk(req.user.user_id, {
					include: [{ model: Role, through: { attributes: [] } }],
				});
				const roleNames =
					user && user.Roles
						? user.Roles.map((r) => r.role_name)
						: [];
				if (!roleNames.includes('admin')) {
					return sendError(res, 'Not authorized', 403);
				}
			}

			if (!contact) {
				return sendNotFound(res, 'Contact not found');
			}

			return sendSuccess(res, 'Contact retrieved successfully', {
				contact,
			});
		} catch (error) {
			logger.error('Error getting contact:', error);
			return sendServerError(res, 'Failed to retrieve contact');
		}
	}

	/**
	 * Create a new contact
	 * @param {Object} req Express request object
	 * @param {Object} res Express response object
	 * @param {Function} next Express next function
	 */
	async createContact(req, res, next) {
		try {
			const {
				first_name,
				middle_name,
				last_name,
				phone,
				email,
				citizen_id,
				is_primary,
			} = req.body;
			const user_id = req.user.user_id;

			// Check if this should be the primary contact
			if (is_primary) {
				// Remove primary status from other contacts of this user
				await Contact.update(
					{ is_primary: false },
					{ where: { user_id, is_primary: true } }
				);
			}

			const contact = await Contact.create({
				user_id,
				first_name,
				middle_name,
				last_name,
				phone,
				email,
				citizen_id,
				is_primary: is_primary || false,
			});

			return sendSuccess(
				res,
				'Contact created successfully',
				{ contact },
				201
			);
		} catch (error) {
			logger.error('Error creating contact:', error);

			// Handle validation errors
			if (error.name === 'SequelizeValidationError') {
				const errors = error.errors.map((e) => ({
					field: e.path,
					message: e.message,
				}));
				return sendError(res, 'Validation failed', 422, errors);
			}

			// Handle unique constraint errors
			if (error.name === 'SequelizeUniqueConstraintError') {
				return sendError(res, 'Email already exists', 409);
			}

			return sendServerError(res, 'Failed to create contact');
		}
	}

	/**
	 * Update contact information
	 * @param {Object} req Express request object
	 * @param {Object} res Express response object
	 * @param {Function} next Express next function
	 */
	async updateContact(req, res, next) {
		try {
			const { id } = req.params;
			const { first_name, middle_name, last_name, phone, email } =
				req.body;

			const contact = await Contact.findByPk(id);
			if (!contact) {
				return sendNotFound(res, 'Contact not found');
			}

			// Only allow owner or admin to update the contact
			const requesterId = req.user ? req.user.user_id : null;
			const isOwner = requesterId && contact.user_id === requesterId;
			if (!isOwner) {
				const { User, Role } = require('../models');
				if (!req.user) {
					return sendError(res, 'Not authorized', 401);
				}
				const user = await User.findByPk(req.user.user_id, {
					include: [{ model: Role, through: { attributes: [] } }],
				});
				const roleNames =
					user && user.Roles
						? user.Roles.map((r) => r.role_name)
						: [];
				if (!roleNames.includes('admin')) {
					return sendError(res, 'Not authorized', 403);
				}
			}

			// Update contact fields
			const updateData = {};
			if (first_name !== undefined) updateData.first_name = first_name;
			if (middle_name !== undefined) updateData.middle_name = middle_name;
			if (last_name !== undefined) updateData.last_name = last_name;
			if (phone !== undefined) updateData.phone = phone;
			if (email !== undefined) updateData.email = email;

			// Add updated_at timestamp
			updateData.updated_at = new Date();

			await contact.update(updateData);

			logger.info(`Contact ${id} updated successfully`);
			return sendSuccess(res, 'Contact updated successfully', {
				contact,
			});
		} catch (error) {
			logger.error('Error updating contact:', error);

			// Handle validation errors
			if (error.name === 'SequelizeValidationError') {
				const errors = error.errors.map((e) => ({
					field: e.path,
					message: e.message,
				}));
				return sendError(res, 'Validation failed', 422, errors);
			}

			// Handle unique constraint errors
			if (error.name === 'SequelizeUniqueConstraintError') {
				return sendError(res, 'Email already exists', 409);
			}

			return sendServerError(res, 'Failed to update contact');
		}
	}

	/**
	 * Delete a contact
	 * @param {Object} req Express request object
	 * @param {Object} res Express response object
	 * @param {Function} next Express next function
	 */
	async deleteContact(req, res, next) {
		try {
			const { id } = req.params;
			const user_id = req.user.user_id;

			// Find contact by ID and user_id
			const contact = await Contact.findOne({
				where: {
					contact_id: parseInt(id),
					user_id: user_id,
				},
			});

			if (!contact) {
				return sendNotFound(res, 'Contact not found');
			}

			// Delete the contact
			await contact.destroy();

			logger.info(`Contact ${id} deleted successfully`);
			return sendSuccess(res, 'Contact deleted successfully');
		} catch (error) {
			logger.error('Error deleting contact:', error);

			// Handle specific errors
			if (error.name === 'SequelizeForeignKeyConstraintError') {
				return sendError(
					res,
					'Cannot delete contact: it is referenced by other records',
					409
				);
			}

			return sendServerError(res, 'Failed to delete contact');
		}
	}

	/**
	 * Search contacts by name or email
	 * @param {Object} req Express request object
	 * @param {Object} res Express response object
	 * @param {Function} next Express next function
	 */
	async searchContacts(req, res, next) {
		try {
			const { query } = req.query;
			const page = parseInt(req.query.page) || 1;
			const limit = parseInt(req.query.limit) || 10;
			const offset = (page - 1) * limit;

			if (!query || query.trim().length < 2) {
				return sendError(
					res,
					'Search query must be at least 2 characters',
					400
				);
			}

			const { Op } = require('sequelize');
			const searchTerm = `%${query.trim()}%`;

			const { count, rows: contacts } = await Contact.findAndCountAll({
				where: {
					[Op.or]: [
						{ first_name: { [Op.like]: searchTerm } },
						{ middle_name: { [Op.like]: searchTerm } },
						{ last_name: { [Op.like]: searchTerm } },
						{ email: { [Op.like]: searchTerm } },
					],
				},
				limit,
				offset,
				order: [['created_at', 'DESC']],
			});

			const totalPages = Math.ceil(count / limit);

			return sendSuccess(res, 'Contacts search completed', {
				contacts,
				searchQuery: query,
				pagination: {
					currentPage: page,
					totalPages,
					totalItems: count,
					itemsPerPage: limit,
					hasNextPage: page < totalPages,
					hasPrevPage: page > 1,
				},
			});
		} catch (error) {
			logger.error('Error searching contacts:', error);
			return sendServerError(res, 'Failed to search contacts');
		}
	}

	/**
	 * Get contact statistics
	 * @param {Object} req Express request object
	 * @param {Object} res Express response object
	 * @param {Function} next Express next function
	 */
	async getContactStats(req, res, next) {
		try {
			const totalContacts = await Contact.count();

			// Get contacts created in last 30 days
			const thirtyDaysAgo = new Date();
			thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

			const recentContacts = await Contact.count({
				where: {
					created_at: {
						[require('sequelize').Op.gte]: thirtyDaysAgo,
					},
				},
			});

			return sendSuccess(
				res,
				'Contact statistics retrieved successfully',
				{
					totalContacts,
					recentContacts,
					period: '30 days',
				}
			);
		} catch (error) {
			logger.error('Error getting contact stats:', error);
			return sendServerError(
				res,
				'Failed to retrieve contact statistics'
			);
		}
	}
}

module.exports = new ContactController();
