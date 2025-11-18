const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FlightService = sequelize.define(
	'FlightService',
	{
		service_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			field: 'service_id',
		},
		flight_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		service_type: {
			type: DataTypes.ENUM('baggage', 'meal', 'other'),
			allowNull: false,
		},
		service_ref_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		is_available: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
		},
	},
	{
		tableName: 'flight_services',
		timestamps: false,
		indexes: [
			{
				fields: ['flight_id', 'service_type'],
			},
		],
	}
);

module.exports = FlightService;
