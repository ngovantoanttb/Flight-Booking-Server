const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Aircraft = sequelize.define(
	'Aircraft',
	{
		aircraft_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			field: 'aircraft_id',
		},
		airline_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		model: {
			type: DataTypes.STRING(100),
			allowNull: false,
		},
		total_seats: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		business_seats: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		economy_seats: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		aircraft_type: {
			type: DataTypes.STRING(50),
			allowNull: true,
			field: 'aircraft_type',
			comment: 'Type of aircraft (e.g., Boeing 737, Airbus A320)',
		},
	},
	{
		tableName: 'aircraft',
		timestamps: false,
	}
);

module.exports = Aircraft;
