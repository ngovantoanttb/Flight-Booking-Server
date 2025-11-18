const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define(
	'Payment',
	{
		payment_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			field: 'payment_id',
		},
		booking_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		amount: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
		},
		payment_method: {
			type: DataTypes.ENUM('zalopay', 'credit_card', 'bank_transfer', 'cod'),
			allowNull: false,
		},
		payment_reference: {
			type: DataTypes.STRING(100),
			allowNull: true,
		},
		payment_date: {
			type: DataTypes.DATE,
			allowNull: true,
		},
		status: {
			type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
			defaultValue: 'pending',
		},
		transaction_details: {
			type: DataTypes.JSON,
			allowNull: true,
		},
	},
	{
		tableName: 'payments',
		timestamps: false,
		indexes: [
			{
				fields: ['payment_reference'],
			},
		],
	}
);

module.exports = Payment;
