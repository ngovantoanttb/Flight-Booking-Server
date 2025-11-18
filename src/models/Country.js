const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Country = sequelize.define(
	'Country',
	{
		country_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			field: 'country_id',
		},
		country_code: {
			type: DataTypes.CHAR(2),
			allowNull: false,
			unique: true,
		},
		country_name: {
			type: DataTypes.STRING(100),
			allowNull: false,
		},
	},
	{
		tableName: 'countries',
		timestamps: false,
	}
);

module.exports = Country;
