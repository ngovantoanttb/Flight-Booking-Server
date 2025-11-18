const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RefreshToken = sequelize.define(
	'RefreshToken',
	{
		token_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			field: 'token_id',
		},
		user_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'users',
				key: 'user_id',
			},
		},
		token: {
			type: DataTypes.STRING(500),
			allowNull: false,
			unique: true,
		},
		expires_at: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		is_revoked: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
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
		tableName: 'refresh_tokens',
		timestamps: false,
		indexes: [
			{
				fields: ['user_id'],
			},
			{
				fields: ['token'],
			},
			{
				fields: ['expires_at'],
			},
		],
	}
);

// Class method to find valid refresh token
RefreshToken.findValidToken = async function (token) {
	return await RefreshToken.findOne({
		where: {
			token,
			is_revoked: false,
			expires_at: {
				[require('sequelize').Op.gt]: new Date(),
			},
		},
	});
};

// Class method to revoke all tokens for a user
RefreshToken.revokeAllUserTokens = async function (userId) {
	return await RefreshToken.update(
		{ is_revoked: true },
		{
			where: {
				user_id: userId,
				is_revoked: false,
			},
		}
	);
};

// Class method to clean up expired tokens
RefreshToken.cleanupExpiredTokens = async function () {
	return await RefreshToken.destroy({
		where: {
			expires_at: {
				[require('sequelize').Op.lt]: new Date(),
			},
		},
	});
};

module.exports = RefreshToken;
