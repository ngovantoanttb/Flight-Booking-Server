const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BookingServicePackage = sequelize.define(
	'BookingServicePackage',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			field: 'id',
		},
		booking_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		flight_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		service_package_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
	},
	{
		tableName: 'booking_service_packages',
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: false,
	}
);

module.exports = BookingServicePackage;
