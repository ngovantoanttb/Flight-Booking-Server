const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BookingDetail = sequelize.define(
	'BookingDetail',
	{
		booking_detail_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			field: 'booking_detail_id',
		},
		booking_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		flight_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		passenger_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		seat_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		baggage_option_id: {
			type: DataTypes.INTEGER,
			allowNull: true,
		},
		meal_option_id: {
			type: DataTypes.INTEGER,
			allowNull: true,
		},
		ticket_number: {
			type: DataTypes.STRING(20),
			allowNull: true,
			unique: true,
		},
		check_in_status: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
	},
	{
		tableName: 'booking_details',
		timestamps: false,
	}
);

module.exports = BookingDetail;
