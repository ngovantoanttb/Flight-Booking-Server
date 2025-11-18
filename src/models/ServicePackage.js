const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ServicePackage = sequelize.define(
	'ServicePackage',
	{
		package_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			field: 'package_id',
		},
		airline_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		package_name: {
			type: DataTypes.STRING(100),
			allowNull: false,
			field: 'package_name',
		},
		package_code: {
			type: DataTypes.STRING(20),
			allowNull: false,
			field: 'package_code',
			comment: 'e.g., ECONOMY, ECONOMY_PLUS, BUSINESS, BUSINESS_PLUS',
		},
		class_type: {
			type: DataTypes.ENUM('economy', 'business'),
			allowNull: false,
			field: 'class_type',
		},
		package_type: {
			type: DataTypes.ENUM('standard', 'plus'),
			allowNull: false,
			defaultValue: 'standard',
			field: 'package_type',
		},
		price_multiplier: {
			type: DataTypes.DECIMAL(3, 2),
			allowNull: false,
			defaultValue: 1.0,
			field: 'price_multiplier',
			comment: 'Multiplier for base price (Class=1.00, Plus=1.20)',
		},
		description: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		services_included: {
			type: DataTypes.JSON,
			allowNull: true,
			field: 'services_included',
			comment: 'JSON array of included services',
		},
		is_active: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
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
		tableName: 'service_packages',
		timestamps: false,
		indexes: [
			{
				fields: ['airline_id', 'package_code'],
				unique: true,
			},
		],
	}
);

module.exports = ServicePackage;
