const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define(
	'User',
	{
		user_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			field: 'user_id',
		},
		email: {
			type: DataTypes.STRING(100),
			allowNull: false,
			unique: true,
			validate: {
				isEmail: true,
			},
		},
		password: {
			type: DataTypes.STRING(255),
			allowNull: false,
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
		phone: {
			type: DataTypes.STRING(20),
			allowNull: true,
		},
		date_of_birth: {
			type: DataTypes.DATEONLY,
			allowNull: true,
		},
		google_id: {
			type: DataTypes.STRING(100),
			allowNull: true,
			unique: true,
		},
		is_active: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
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
		tableName: 'users',
		timestamps: false,
		hooks: {
			beforeCreate: async (user) => {
				if (user.password) {
					const salt = await bcrypt.genSalt(10);
					user.password = await bcrypt.hash(user.password, salt);
				}
			},
			beforeUpdate: async (user) => {
				if (user.changed('password')) {
					const salt = await bcrypt.genSalt(10);
					user.password = await bcrypt.hash(user.password, salt);
				}
			},
		},
	}
);

// Instance method to check password
User.prototype.comparePassword = async function (candidatePassword) {
	return await bcrypt.compare(candidatePassword, this.password);
};

// Class method to find user by email
User.findByEmail = async function (email) {
	return await User.findOne({ where: { email } });
};

module.exports = User;
