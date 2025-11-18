const { sequelize } = require('../src/models');
const flightService = require('../src/services/flightService');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    const params = {
      departure_airport_code: 'SGN',
      arrival_airport_code: 'HAN',
      departure_date: '2025-09-15',
      passengers: 1,
      class_code: 'ECONOMY',
      page: 1,
      limit: 10,
    };

    console.log('Searching with params:', params);
    const result = await flightService.searchAvailableFlights(params);
    console.log('Search result summary:', {
      flightsLength: result.flights.length,
      pagination: result.pagination,
    });
    console.dir(result, { depth: 4 });
  } catch (err) {
    console.error('Error running debug search:', err);
  } finally {
    process.exit(0);
  }
})();
