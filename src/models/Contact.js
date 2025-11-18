const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Contact = sequelize.define(
	'Contact',
	{
		contact_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			field: 'contact_id',
		},
		user_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			field: 'user_id',
		},
		first_name: {
			type: DataTypes.STRING(50),
			allowNull: false,
		},
		middle_name: {
			type: DataTypes.STRING(50),
			allowNull: true,
			field: 'middle_name',
		},
		last_name: {
			type: DataTypes.STRING(50),
			allowNull: false,
		},
		phone: {
			type: DataTypes.STRING(20),
			allowNull: false,
		},
		email: {
			type: DataTypes.STRING(100),
			allowNull: false,
			validate: {
				isEmail: true,
			},
		},
		citizen_id: {
			type: DataTypes.STRING(12),
			allowNull: true,
			field: 'citizen_id',
			validate: {
				is: {
					args: /^\d{12}$/,
					msg: 'Citizen ID must be exactly 12 digits',
				},
			},
		},
		is_primary: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			field: 'is_primary',
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
		tableName: 'contacts',
		timestamps: false,
		indexes: [
			{
				fields: ['user_id'],
			},
		],
	}
);

module.exports = Contact;
