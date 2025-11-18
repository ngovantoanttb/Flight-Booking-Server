const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FlightRecommendation = sequelize.define(
	'FlightRecommendation',
	{
		recommendation_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			field: 'recommendation_id',
		},
		user_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		flight_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		recommendation_score: {
			type: DataTypes.DECIMAL(5, 2),
			allowNull: false,
		},
		recommendation_reason: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		created_at: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		tableName: 'flight_recommendations',
		timestamps: false,
	}
);

module.exports = FlightRecommendation;
