const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Booking = sequelize.define(
	'Booking',
	{
		booking_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			field: 'booking_id',
		},
		booking_reference: {
			type: DataTypes.STRING(10),
			allowNull: false,
			unique: true,
		},
		user_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		contact_email: {
			type: DataTypes.STRING(100),
			allowNull: false,
		},
		contact_phone: {
			type: DataTypes.STRING(20),
			allowNull: false,
		},
		citizen_id: {
			type: DataTypes.STRING(12),
			allowNull: true,
			validate: {
				is: {
					args: /^\d{12}$/,
					msg: 'Citizen ID must be exactly 12 digits',
				},
			},
		},
		booking_date: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
		total_amount: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
		},
		base_amount: {
			type: DataTypes.DECIMAL(10, 2),
			defaultValue: 0.0,
			comment: 'Base flight ticket amount',
		},
		baggage_fees: {
			type: DataTypes.DECIMAL(10, 2),
			defaultValue: 0.0,
			comment: 'Total baggage fees',
		},
		meal_fees: {
			type: DataTypes.DECIMAL(10, 2),
			defaultValue: 0.0,
			comment: 'Total meal fees',
		},
		service_package_fees: {
			type: DataTypes.DECIMAL(10, 2),
			defaultValue: 0.0,
			comment: 'Service package fees',
		},
		selected_baggage_services: {
			type: DataTypes.JSON,
			allowNull: true,
		},
		selected_meal_services: {
			type: DataTypes.JSON,
			allowNull: true,
		},
		discount_amount: {
			type: DataTypes.DECIMAL(10, 2),
			defaultValue: 0.0,
			comment: 'Discount amount',
		},
		discount_code: {
			type: DataTypes.STRING(50),
			allowNull: true,
			comment: 'Discount code used',
		},
		discount_percentage: {
			type: DataTypes.DECIMAL(5, 2),
			allowNull: true,
			comment: 'Discount percentage',
		},
		tax_amount: {
			type: DataTypes.DECIMAL(10, 2),
			defaultValue: 0.0,
			comment: 'Tax amount',
		},
		final_amount: {
			type: DataTypes.DECIMAL(10, 2),
			defaultValue: 0.0,
			comment: 'Final amount after all calculations',
		},
		status: {
			type: DataTypes.ENUM(
				'pending',
				'confirmed',
				'cancelled',
				'completed',
				'pending_cancellation',
				'cancellation_rejected'
			),
			defaultValue: 'pending',
		},
		cancellation_processed: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		cancellation_processed_at: {
			type: DataTypes.DATE,
			allowNull: true,
		},
		cancellation_processed_by: {
			type: DataTypes.INTEGER,
			allowNull: true,
		},
		payment_status: {
			type: DataTypes.ENUM('pending', 'paid', 'refunded', 'failed'),
			defaultValue: 'pending',
		},
		cancellation_reason: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		trip_type: {
			type: DataTypes.ENUM('one-way', 'round-trip', 'multi-city'),
			allowNull: true,
			comment: 'Trip type: one-way, round-trip, or multi-city',
		},
		updated_at: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		tableName: 'bookings',
		timestamps: false,
		indexes: [
			{
				fields: ['booking_reference'],
			},
			{
				fields: ['user_id'],
			},
		],
	}
);

module.exports = Booking;
