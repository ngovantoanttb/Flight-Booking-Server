const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FlightSeat = sequelize.define(
	'FlightSeat',
	{
		seat_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			field: 'seat_id',
		},
		flight_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		class_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		seat_number: {
			type: DataTypes.STRING(8),
			allowNull: false,
		},
		price: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
		},
		is_available: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
		},
	},
	{
		tableName: 'flight_seats',
		timestamps: false,
		indexes: [
			{
				unique: true,
				fields: ['flight_id', 'seat_number'],
			},
		],
	}
);

module.exports = FlightSeat;
