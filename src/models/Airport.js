const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Airport = sequelize.define(
	'Airport',
	{
		airport_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			field: 'airport_id',
		},
		airport_code: {
			type: DataTypes.CHAR(3),
			allowNull: false,
			unique: true,
		},
		airport_name: {
			type: DataTypes.STRING(100),
			allowNull: false,
		},
		city: {
			type: DataTypes.STRING(100),
			allowNull: false,
		},
		country_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		airport_type: {
			type: DataTypes.ENUM('domestic', 'international'),
			allowNull: false,
			defaultValue: 'domestic',
			field: 'airport_type',
		},
		latitude: {
			type: DataTypes.DECIMAL(10, 8),
			allowNull: true,
		},
		longitude: {
			type: DataTypes.DECIMAL(11, 8),
			allowNull: true,
		},
	},
	{
		tableName: 'airports',
		timestamps: false,
		indexes: [
			{
				fields: ['airport_code'],
			},
		],
	}
);

module.exports = Airport;
