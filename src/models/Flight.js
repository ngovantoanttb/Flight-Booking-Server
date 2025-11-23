const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Flight = sequelize.define(
	'Flight',
	{
		flight_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			field: 'flight_id',
		},
		flight_number: {
			type: DataTypes.STRING(10),
			allowNull: false,
		},
		airline_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		aircraft_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		departure_airport_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		arrival_airport_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		departure_time: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		arrival_time: {
			type: DataTypes.DATE,
			allowNull: false,
			validate: {
				isAfterDeparture(value) {
					// Get departure_time from instance (could be from this or from dataValues)
					const departureTime = this.departure_time || this.dataValues?.departure_time;
					if (departureTime && value && new Date(value) <= new Date(departureTime)) {
						throw new Error('Thời gian đến phải sau thời gian khởi hành');
					}
				},
			},
		},
		status: {
			type: DataTypes.ENUM(
				'scheduled',
				'delayed',
				'cancelled',
				'completed'
			),
			defaultValue: 'scheduled',
		},
		economy_price: {
			type: DataTypes.DECIMAL(12, 2),
			allowNull: true,
		},
		business_price: {
			type: DataTypes.DECIMAL(12, 2),
			allowNull: true,
		},
		flight_type: {
			type: DataTypes.ENUM('domestic', 'international'),
			allowNull: true,
		},
		created_at: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
		updated_at: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		tableName: 'flights',
		timestamps: false,
		indexes: [
			{
				fields: ['flight_number'],
			},
			{
				fields: ['departure_time'],
			},
			{
				fields: ['arrival_time'],
			},
		],
		hooks: {
			beforeValidate: (flight) => {
				// Validate arrival_time > departure_time
				if (
					flight.departure_time &&
					flight.arrival_time &&
					new Date(flight.arrival_time) <= new Date(flight.departure_time)
				) {
					throw new Error('Thời gian đến phải sau thời gian khởi hành');
				}
			},
			beforeUpdate: (flight) => {
				// Validate on update as well
				if (
					flight.departure_time &&
					flight.arrival_time &&
					new Date(flight.arrival_time) <= new Date(flight.departure_time)
				) {
					throw new Error('Thời gian đến phải sau thời gian khởi hành');
				}
			},
		},
	}
);

// Define associations
Flight.hasMany(require('./FlightBaggageService'), {
	foreignKey: 'flight_id',
	as: 'baggage_services',
});

Flight.hasMany(require('./FlightMealService'), {
	foreignKey: 'flight_id',
	as: 'meal_services',
});

module.exports = Flight;
