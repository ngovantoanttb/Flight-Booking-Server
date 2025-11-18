const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Airline = sequelize.define(
	'Airline',
	{
		airline_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			field: 'airline_id',
		},
		airline_code: {
			type: DataTypes.CHAR(2),
			allowNull: false,
			unique: true,
		},
		airline_name: {
			type: DataTypes.STRING(100),
			allowNull: false,
		},
		country_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		service_config: {
			type: DataTypes.JSON,
			allowNull: true,
			field: 'service_config',
			comment: 'Configuration for Economy/Business Class services',
		},
		logo_url: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		is_active: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
		},
	},
	{
		tableName: 'airlines',
		timestamps: false,
	}
);

module.exports = Airline;
