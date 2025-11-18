const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EmailNotification = sequelize.define(
	'EmailNotification',
	{
		notification_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			field: 'notification_id',
		},
		user_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		booking_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		notification_type: {
			type: DataTypes.ENUM(
				'booking_confirmation',
				'cancellation',
				'check_in_reminder',
				'other'
			),
			allowNull: false,
		},
		email_subject: {
			type: DataTypes.STRING(255),
			allowNull: false,
		},
		email_content: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		sent_at: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
		status: {
			type: DataTypes.ENUM('sent', 'failed', 'pending'),
			defaultValue: 'pending',
		},
	},
	{
		tableName: 'email_notifications',
		timestamps: false,
	}
);

module.exports = EmailNotification;
