const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const Role = require('./Role');

const UserRole = sequelize.define(
	'UserRole',
	{
		user_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			references: {
				model: User,
				key: 'user_id',
			},
		},
		role_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			references: {
				model: Role,
				key: 'role_id',
			},
		},
	},
	{
		tableName: 'user_roles',
		timestamps: false,
	}
);

// Define associations
User.belongsToMany(Role, { through: UserRole, foreignKey: 'user_id' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'role_id' });

module.exports = UserRole;
