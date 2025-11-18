const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserSearchHistory = sequelize.define(
	'UserSearchHistory',
	{
		search_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			field: 'search_id',
		},
		user_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		departure_airport_id: {
			type: DataTypes.INTEGER,
			allowNull: true,
		},
		arrival_airport_id: {
			type: DataTypes.INTEGER,
			allowNull: true,
		},
		departure_date: {
			type: DataTypes.DATEONLY,
			allowNull: true,
		},
		return_date: {
			type: DataTypes.DATEONLY,
			allowNull: true,
		},
		passengers: {
			type: DataTypes.INTEGER,
			allowNull: true,
		},
		travel_class_id: {
			type: DataTypes.INTEGER,
			allowNull: true,
		},
		search_timestamp: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		tableName: 'user_search_history',
		timestamps: false,
		indexes: [
			{
				fields: ['user_id', 'search_timestamp'],
			},
		],
	}
);

module.exports = UserSearchHistory;
