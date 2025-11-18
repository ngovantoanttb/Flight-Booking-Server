const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Promotion = sequelize.define(
	'Promotion',
	{
		promotion_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			field: 'promotion_id',
		},
		promotion_code: {
			type: DataTypes.STRING(20),
			allowNull: false,
			unique: true,
		},
		description: {
			type: DataTypes.STRING(255),
			allowNull: false,
		},
		discount_type: {
			type: DataTypes.ENUM('percentage', 'fixed_amount'),
			allowNull: false,
		},
		discount_value: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
		},
		min_purchase: {
			type: DataTypes.DECIMAL(10, 2),
			defaultValue: 0,
		},
		start_date: {
			type: DataTypes.DATEONLY,
			allowNull: false,
		},
		end_date: {
			type: DataTypes.DATEONLY,
			allowNull: false,
		},
		is_active: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
		},
		usage_limit: {
			type: DataTypes.INTEGER,
			allowNull: true,
		},
		usage_count: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		created_at: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
		updated_at: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		tableName: 'promotions',
		timestamps: false,
		indexes: [
			{
				fields: ['promotion_code'],
			},
			{
				fields: ['start_date', 'end_date'],
			},
		],
	}
);

module.exports = Promotion;
