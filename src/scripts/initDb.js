const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

// Import all models to ensure they are registered
require('../models');

const initDatabase = async () => {
	try {
		logger.info('Initializing database...');

		// Sync all models with database
		await sequelize.sync({ force: false, alter: true });

		logger.info('Database initialized successfully!');
		process.exit(0);
	} catch (error) {
		logger.error('Database initialization failed:', error);
		process.exit(1);
	}
};

initDatabase();
