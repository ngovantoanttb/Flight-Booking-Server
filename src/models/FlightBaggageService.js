const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FlightBaggageService = sequelize.define(
	'FlightBaggageService',
	{
		baggage_service_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			field: 'baggage_service_id',
		},
		flight_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		weight_kg: {
			type: DataTypes.DECIMAL(5, 2),
			allowNull: false,
			comment: 'Baggage weight in kilograms',
		},
		price: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
			comment: 'Price for this baggage service',
		},
		description: {
			type: DataTypes.TEXT,
			allowNull: true,
			comment: 'Description of baggage service',
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
		tableName: 'flight_baggage_services',
		timestamps: false,
		indexes: [
			{
				fields: ['flight_id'],
			},
		],
	}
);

module.exports = FlightBaggageService;
