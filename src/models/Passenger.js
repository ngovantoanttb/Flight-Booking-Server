const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Passenger = sequelize.define(
	'Passenger',
	{
		passenger_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			field: 'passenger_id',
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
		title: {
			type: DataTypes.ENUM('Mr', 'Mrs', 'Ms', 'Dr', 'Prof'),
			allowNull: true,
			defaultValue: 'Mr',
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
		passenger_type: {
			type: DataTypes.ENUM('adult', 'child', 'infant'),
			allowNull: false,
			defaultValue: 'adult',
			field: 'passenger_type',
		},
		date_of_birth: {
			type: DataTypes.DATEONLY,
			allowNull: false,
		},
		nationality: {
			type: DataTypes.STRING(50),
			allowNull: true,
		},
		passport_number: {
			type: DataTypes.STRING(50),
			allowNull: true,
		},
		passport_expiry: {
			type: DataTypes.DATEONLY,
			allowNull: true,
		},
		passport_issuing_country: {
			type: DataTypes.STRING(50),
			allowNull: true,
			comment: 'Country that issued the passport',
		},
		created_at: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		tableName: 'passengers',
		timestamps: false,
	}
);

module.exports = Passenger;
