const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PromotionUsage = sequelize.define(
	'PromotionUsage',
	{
		usage_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			field: 'usage_id',
		},
		promotion_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		booking_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		discount_amount: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
		},
		applied_at: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		tableName: 'promotion_usage',
		timestamps: false,
		indexes: [
			{
				unique: true,
				fields: ['promotion_id', 'booking_id'],
			},
		],
	}
);

module.exports = PromotionUsage;
