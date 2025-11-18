const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TravelClass = sequelize.define(
	'TravelClass',
	{
		class_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			field: 'class_id',
		},
		class_name: {
			type: DataTypes.STRING(50),
			allowNull: false,
		},
		class_code: {
			type: DataTypes.STRING(10),
			allowNull: false,
		},
	},
	{
		tableName: 'travel_classes',
		timestamps: false,
	}
);

module.exports = TravelClass;
