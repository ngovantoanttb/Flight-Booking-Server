/* eslint-disable no-console */
/**
 * Reset seats for a specific flight
 *
 * Usage examples:
 *   node scripts/reset_flight_seats.js --flight_number=VN2001
 *   node scripts/reset_flight_seats.js --flight_id=123
 *   node scripts/reset_flight_seats.js --flight_number=VN2001 --mode=recreate
 *
 * Modes:
 *   - reset (default): set is_available=true for all flight seats
 *   - recreate: delete all FlightSeat of the flight and recreate seats based on aircraft capacities
 *               WARNING: This can break existing bookings referencing old seat_ids.
 */

const { sequelize, Flight, FlightSeat, TravelClass, Aircraft } = require('../src/models');
const { connectDatabase } = require('../src/config/database');

function parseArgs() {
	const args = {};
	for (const a of process.argv.slice(2)) {
		const [k, v] = a.split('=');
		const key = k.replace(/^--/, '');
		args[key] = v === undefined ? true : v;
	}
	return args;
}

async function getFlightByArg(args) {
	if (args.flight_id) {
		const f = await Flight.findByPk(args.flight_id, {
			include: [{ model: Aircraft }],
		});
		return f;
	}
	if (args.flight_number) {
		const f = await Flight.findOne({
			where: { flight_number: args.flight_number },
			include: [{ model: Aircraft }],
		});
		return f;
	}
	throw new Error('Please provide --flight_id or --flight_number');
}

async function resetAvailability(flightId) {
	const [affected] = await FlightSeat.update(
		{ is_available: true },
		{ where: { flight_id: flightId } }
	);
	return affected;
}

async function recreateSeats(flight) {
	// Fetch class ids
	const classes = await TravelClass.findAll();
	const business = classes.find((c) => c.class_code === 'BUSINESS');
	const economy = classes.find((c) => c.class_code === 'ECONOMY');

	if (!business && !economy) {
		throw new Error('Travel classes BUSINESS/ECONOMY not found, cannot recreate.');
	}

	// Remove old seats
	const removed = await FlightSeat.destroy({ where: { flight_id: flight.flight_id } });

	// Create new seats according to aircraft capacities
	const toCreate = [];
	if (business && Number(flight.Aircraft.business_seats) > 0) {
		const n = Number(flight.Aircraft.business_seats);
		for (let i = 1; i <= n; i++) {
			toCreate.push({
				flight_id: flight.flight_id,
				class_id: business.class_id,
				seat_number: `B${i}`,
				price: flight.business_price || 0,
				is_available: true,
			});
		}
	}
	if (economy && Number(flight.Aircraft.economy_seats) > 0) {
		const n = Number(flight.Aircraft.economy_seats);
		for (let i = 1; i <= n; i++) {
			toCreate.push({
				flight_id: flight.flight_id,
				class_id: economy.class_id,
				seat_number: `E${i}`,
				price: flight.economy_price || 0,
				is_available: true,
			});
		}
	}

	await FlightSeat.bulkCreate(toCreate, { ignoreDuplicates: true });
	return { removed, created: toCreate.length };
}

async function main() {
	const args = parseArgs();
	const mode = (args.mode || 'reset').toString().toLowerCase();

	await connectDatabase();
	await sequelize.authenticate();

	const flight = await getFlightByArg(args);
	if (!flight) {
		throw new Error('Flight not found');
	}

	if (!flight.Aircraft) {
		throw new Error('Flight does not have Aircraft loaded. Ensure association exists.');
	}

	if (mode === 'recreate') {
		console.warn('WARNING: Recreating seats may break existing bookings referencing old seats.');
		const { removed, created } = await recreateSeats(flight);
		console.log(`Recreated seats for flight ${flight.flight_number} (ID: ${flight.flight_id})`);
		console.log(`Removed: ${removed}, Created: ${created}`);
	} else {
		const affected = await resetAvailability(flight.flight_id);
		console.log(`Reset availability for flight ${flight.flight_number} (ID: ${flight.flight_id}). Seats updated: ${affected}`);
	}

	await sequelize.close();
}

main().catch((err) => {
	console.error('Error:', err.message);
	process.exit(1);
});
