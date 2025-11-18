const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BaggageOption = sequelize.define(
	'BaggageOption',
	{
		baggage_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			field: 'baggage_id',
		},
		airline_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		weight_kg: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		price: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
		},
		description: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
	},
	{
		tableName: 'baggage_options',
		timestamps: false,
	}
);

module.exports = BaggageOption;
