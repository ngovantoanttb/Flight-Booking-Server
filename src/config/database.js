const { Sequelize } = require('sequelize');
const config = require('./env.config');
const logger = require('../utils/logger');

const sequelize = new Sequelize(
	config.DB_NAME,
	config.DB_USER,
	config.DB_PASS,
	{
		host: config.DB_HOST,
		port: config.DB_PORT,
		dialect: 'mysql',
		logging: (msg) => logger.debug(msg),
		pool: {
			max: 10,
			min: 0,
			acquire: 30000,
			idle: 10000,
		},
		define: {
			timestamps: true,
			underscored: true,
		},
	}
);

const connectDatabase = async () => {
	try {
		await sequelize.authenticate();
		logger.info('Database connection has been established successfully.');
	} catch (error) {
		logger.error('Unable to connect to the database:', error);
		logger.warn(
			'Server will continue running without database connection. Please check your database configuration.'
		);
	}
};

module.exports = {
	sequelize,
	connectDatabase,
};
