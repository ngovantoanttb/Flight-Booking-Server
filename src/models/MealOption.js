const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MealOption = sequelize.define(
	'MealOption',
	{
		meal_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			field: 'meal_id',
		},
		airline_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		meal_name: {
			type: DataTypes.STRING(100),
			allowNull: false,
		},
		meal_description: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		price: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
		},
		is_vegetarian: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		is_halal: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
	},
	{
		tableName: 'meal_options',
		timestamps: false,
	}
);

module.exports = MealOption;
