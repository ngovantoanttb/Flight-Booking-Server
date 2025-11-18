const { sequelize } = require('../config/database');
const seedDatabase = require('./seed');
const logger = require('../utils/logger');

const runSeed = async () => {
	try {
		logger.info('Starting database seeding process...');

		// Test database connection
		await sequelize.authenticate();
		logger.info('Database connection established');

		// Run the seed function
		await seedDatabase();

		logger.info('Database seeding completed successfully!');
		process.exit(0);
	} catch (error) {
		logger.error('Database seeding failed:', error);
		process.exit(1);
	}
};

// Run if called directly
if (require.main === module) {
	runSeed();
}

module.exports = runSeed;
