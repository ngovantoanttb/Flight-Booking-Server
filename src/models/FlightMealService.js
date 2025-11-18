const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FlightMealService = sequelize.define(
	'FlightMealService',
	{
		meal_service_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			field: 'meal_service_id',
		},
		flight_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		meal_name: {
			type: DataTypes.STRING(100),
			allowNull: false,
			comment: 'Name of the meal',
		},
		meal_description: {
			type: DataTypes.TEXT,
			allowNull: true,
			comment: 'Description of the meal',
		},
		price: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
			comment: 'Price for this meal service',
		},
		is_vegetarian: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		is_halal: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
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
		tableName: 'flight_meal_services',
		timestamps: false,
		indexes: [
			{
				fields: ['flight_id'],
			},
		],
	}
);

module.exports = FlightMealService;
