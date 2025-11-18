/**
 * Controllers for promotion operations
 */

const { Promotion, PromotionUsage } = require('../models');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

const promotionController = {
  // Get active promotions (public)
  async getActivePromotions(req, res) {
    try {
      const now = new Date();
      const promotionsRaw = await Promotion.findAll({
        where: {
          is_active: true,
          start_date: { [Op.lte]: now },
          end_date: { [Op.gte]: now }
        },
        attributes: [
          'promotion_id',
          'promotion_code',
          'description',
          'discount_type',
          'discount_value',
          'start_date',
          'end_date',
          'is_active'
        ]
      });

      // Map model fields to API-friendly shape
      const promotions = promotionsRaw.map(p => {
        const json = p.toJSON();
        return {
          promotion_id: json.promotion_id,
          code: json.promotion_code,
          description: json.description,
          discount_percentage: json.discount_type === 'percentage' ? Number(json.discount_value) : 0,
          discount_amount: json.discount_type === 'fixed_amount' ? Number(json.discount_value) : 0,
          start_date: json.start_date,
          end_date: json.end_date,
          is_active: json.is_active
        };
      });

      return sendSuccess(res, 'Promotions retrieved successfully', promotions);
    } catch (error) {
      logger.error('Error getting active promotions:', error);
      return sendError(res, 'Failed to retrieve promotions', 500);
    }
  },
  
  // Verify promotion code
  async verifyPromotionCode(req, res) {
    try {
      const { code } = req.body;
      const now = new Date();
      
      const promotion = await Promotion.findOne({
        where: {
          promotion_code: code,
          is_active: true,
          start_date: { [Op.lte]: now },
          end_date: { [Op.gte]: now }
        }
      });
      
      if (!promotion) {
        return sendError(res, 'Invalid or expired promotion code', 404);
      }
      
      // Format the response with discount information
      const promotionJson = promotion.toJSON();
      const discountInfo = {
        promotion_id: promotionJson.promotion_id,
        code: promotionJson.promotion_code,
        description: promotionJson.description,
        discount_type: promotionJson.discount_type,
        discount_value: Number(promotionJson.discount_value),
        valid_until: promotionJson.end_date
      };
      
      return sendSuccess(res, 'Promotion code is valid', discountInfo);
    } catch (error) {
      logger.error('Error verifying promotion code:', error);
      return sendError(res, 'Failed to verify promotion code', 500);
    }
  },
  
  // ADMIN: Create a new promotion
  async createPromotion(req, res) {
    try {
      const {
        code,
        description,
        discount_percentage,
        discount_amount = 0,
        start_date,
        end_date,
        is_active,
        usage_limit = null
      } = req.body;
      
      // Check if code already exists
      const existingPromotion = await Promotion.findOne({ where: { code } });
      if (existingPromotion) {
        return sendError(res, 'Promotion code already exists', 400);
      }
      
      // Map incoming request to model fields
      const promotion = await Promotion.create({
        promotion_code: code,
        description,
        discount_type: discount_percentage > 0 ? 'percentage' : 'fixed_amount',
        discount_value: discount_percentage > 0 ? discount_percentage : discount_amount,
        start_date,
        end_date,
        is_active,
        usage_limit,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      return sendSuccess(res, 'Promotion created successfully', promotion);
    } catch (error) {
      logger.error('Error creating promotion:', error);
      return sendError(res, 'Failed to create promotion', 500);
    }
  },
  
  // ADMIN: Get all promotions
  async getAllPromotions(req, res) {
    try {
  const { page = 1, limit = 10, status } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      const filter = {};
      if (status === 'active') {
        const now = new Date();
        filter.is_active = true;
        filter.start_date = { [Op.lte]: now };
        filter.end_date = { [Op.gte]: now };
      } else if (status === 'inactive') {
        filter.is_active = false;
      } else if (status === 'expired') {
        const now = new Date();
        filter.end_date = { [Op.lt]: now };
      } else if (status === 'upcoming') {
        const now = new Date();
        filter.start_date = { [Op.gt]: now };
      }
      
      const { rows: promotionsRaw, count } = await Promotion.findAndCountAll({
        where: filter,
        limit: parseInt(limit),
        offset,
        order: [['created_at', 'DESC']]
      });

      const promotions = promotionsRaw.map(p => {
        const json = p.toJSON();
        return {
          promotion_id: json.promotion_id,
          code: json.promotion_code,
          description: json.description,
          discount_percentage: json.discount_type === 'percentage' ? Number(json.discount_value) : 0,
          discount_amount: json.discount_type === 'fixed_amount' ? Number(json.discount_value) : 0,
          start_date: json.start_date,
          end_date: json.end_date,
          is_active: json.is_active
        };
      });

      return sendPaginated(
        res,
        'Promotions retrieved successfully',
        promotions,
        parseInt(page),
        parseInt(limit),
        count
      );
    } catch (error) {
      logger.error('Error getting all promotions:', error);
      return sendError(res, 'Failed to retrieve promotions', 500);
    }
  },
  
  // ADMIN: Get promotion by ID
  async getPromotionById(req, res) {
    try {
      const { promotionId } = req.params;
      
      const promotion = await Promotion.findByPk(promotionId);
      if (!promotion) {
        return sendError(res, 'Promotion not found', 404);
      }
      
      // Get usage statistics
      const usageCount = await PromotionUsage.count({
        where: { promotion_id: promotionId }
      });
      
      const usageAmount = await PromotionUsage.sum('discount_amount', {
        where: { promotion_id: promotionId }
      });
      
      const json = promotion.toJSON();
      const promotionData = {
        promotion_id: json.promotion_id,
        code: json.promotion_code,
        description: json.description,
        discount_type: json.discount_type,
        discount_value: Number(json.discount_value),
        start_date: json.start_date,
        end_date: json.end_date,
        is_active: json.is_active,
        usage_statistics: {
          total_uses: usageCount,
          total_discount_amount: usageAmount || 0
        }
      };
      
      return sendSuccess(res, 'Promotion retrieved successfully', promotionData);
    } catch (error) {
      logger.error('Error getting promotion:', error);
      return sendError(res, 'Failed to retrieve promotion', 500);
    }
  },
  
  // ADMIN: Update a promotion
  async updatePromotion(req, res) {
    try {
      const { promotionId } = req.params;
      const {
        code,
        description,
        discount_percentage,
        discount_amount,
        start_date,
        end_date,
        is_active,
        usage_limit
      } = req.body;
      
      const promotion = await Promotion.findByPk(promotionId);
      if (!promotion) {
        return sendError(res, 'Promotion not found', 404);
      }
      
      // Check if code already exists (if changed)
      if (code !== promotion.code) {
        const existingPromotion = await Promotion.findOne({ where: { code } });
        if (existingPromotion) {
          return sendError(res, 'Promotion code already exists', 400);
        }
      }
      
      // Update promotion
      await promotion.update({
        code,
        description,
        discount_percentage,
        discount_amount,
        start_date,
        end_date,
        is_active,
        usage_limit,
        updated_by: req.user.id
      });
      
      return sendSuccess(res, 'Promotion updated successfully', promotion);
    } catch (error) {
      logger.error('Error updating promotion:', error);
      return sendError(res, 'Failed to update promotion', 500);
    }
  },
  
  // ADMIN: Delete a promotion
  async deletePromotion(req, res) {
    try {
      const { promotionId } = req.params;
      
      const promotion = await Promotion.findByPk(promotionId);
      if (!promotion) {
        return sendError(res, 'Promotion not found', 404);
      }
      
      // Check if promotion has been used
      const usageCount = await PromotionUsage.count({
        where: { promotion_id: promotionId }
      });
      
      if (usageCount > 0) {
        // Instead of deleting, mark as inactive
        await promotion.update({
          is_active: false,
          updated_by: req.user.id
        });
        
        return sendSuccess(
          res, 
          'Promotion has been used and cannot be deleted. It has been deactivated instead.', 
          { id: promotionId, deactivated: true }
        );
      }
      
      // If not used, delete
      await promotion.destroy();
      
      return sendSuccess(res, 'Promotion deleted successfully', { id: promotionId });
    } catch (error) {
      logger.error('Error deleting promotion:', error);
      return sendError(res, 'Failed to delete promotion', 500);
    }
  }
};

module.exports = promotionController;