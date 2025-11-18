/* eslint-disable no-console */
/**
 * Seed script: creates minimal data to successfully place a booking
 * How to run:
 *   node scripts/seed_demo_booking.js
 */

const { sequelize, Country, Airline, Airport, Aircraft, TravelClass, Flight, FlightSeat, User, Passenger, Booking, BookingDetail, FlightBaggageService, FlightMealService } = require('../src/models');
const { connectDatabase } = require('../src/config/database');
const seatAllocationService = require('../src/services/seatAllocationService');

async function ensureTravelClasses() {
	const defs = [
		{ class_name: 'Business', class_code: 'BUSINESS' },
		{ class_name: 'Economy', class_code: 'ECONOMY' },
	];

	const results = {};
	for (const def of defs) {
		const [rec] = await TravelClass.findOrCreate({
			where: { class_code: def.class_code },
			defaults: def,
		});
		results[def.class_code] = rec;
	}
	return results;
}

async function ensureCountry() {
	const [vn] = await Country.findOrCreate({
		where: { country_code: 'VN' },
		defaults: { country_name: 'Vietnam', country_code: 'VN' },
	});
	return vn;
}

async function ensureAirline(country) {
	const [airline] = await Airline.findOrCreate({
		where: { airline_code: 'VN' },
		defaults: {
			airline_code: 'VN',
			airline_name: 'Vietnam Airlines',
			country_id: country.country_id,
			logo_url: null,
			is_active: true,
		},
	});
	return airline;
}

async function ensureAirports(country) {
	const [sgn] = await Airport.findOrCreate({
		where: { airport_code: 'SGN' },
		defaults: {
			airport_code: 'SGN',
			airport_name: 'Tan Son Nhat',
			city: 'Ho Chi Minh City',
			country_id: country.country_id,
			airport_type: 'international',
		},
	});
	const [han] = await Airport.findOrCreate({
		where: { airport_code: 'HAN' },
		defaults: {
			airport_code: 'HAN',
			airport_name: 'Noi Bai',
			city: 'Hanoi',
			country_id: country.country_id,
			airport_type: 'international',
		},
	});
	return { sgn, han };
}

async function ensureAircraft(airline) {
	const [ac] = await Aircraft.findOrCreate({
		where: { model: 'A321 - Demo' },
		defaults: {
			airline_id: airline.airline_id,
			model: 'A321 - Demo',
			total_seats: 24,
			business_seats: 4,
			economy_seats: 20,
			aircraft_type: 'Airbus A321',
		},
	});
	return ac;
}

async function ensureFlight(airline, aircraft, airports) {
	const dep = new Date();
	dep.setDate(dep.getDate() + 1);
	dep.setHours(9, 0, 0, 0);
	const arr = new Date(dep.getTime() + 2 * 60 * 60 * 1000);

	const [flight] = await Flight.findOrCreate({
		where: { flight_number: 'VN2001' },
		defaults: {
			flight_number: 'VN2001',
			airline_id: airline.airline_id,
			aircraft_id: aircraft.aircraft_id,
			departure_airport_id: airports.sgn.airport_id,
			arrival_airport_id: airports.han.airport_id,
			departure_time: dep,
			arrival_time: arr,
			status: 'scheduled',
			economy_price: 1200000,
			business_price: 3200000,
		},
	});
	return flight;
}

async function seedSeatsForFlight(flight, travelClasses) {
	// Create business seats (rows B1-B4)
	for (let i = 1; i <= 4; i++) {
		const seatNumber = `B${i}`;
		await FlightSeat.findOrCreate({
			where: { flight_id: flight.flight_id, seat_number: seatNumber },
			defaults: {
				flight_id: flight.flight_id,
				class_id: travelClasses.BUSINESS.class_id,
				seat_number: seatNumber,
				price: 3200000,
				is_available: true,
			},
		});
	}
	// Create economy seats (rows E1-E20)
	for (let i = 1; i <= 20; i++) {
		const seatNumber = `E${i}`;
		await FlightSeat.findOrCreate({
			where: { flight_id: flight.flight_id, seat_number: seatNumber },
			defaults: {
				flight_id: flight.flight_id,
				class_id: travelClasses.ECONOMY.class_id,
				seat_number: seatNumber,
				price: 1200000,
				is_available: true,
			},
		});
	}
}

async function ensureFlightServices(flight) {
	// Minimal baggage options
	await FlightBaggageService.findOrCreate({
		where: { flight_id: flight.flight_id, weight_kg: 15 },
		defaults: {
			flight_id: flight.flight_id,
			weight_kg: 15,
			price: 200000,
			description: 'Hành lý mua thêm 15kg',
		},
	});
	await FlightBaggageService.findOrCreate({
		where: { flight_id: flight.flight_id, weight_kg: 20 },
		defaults: {
			flight_id: flight.flight_id,
			weight_kg: 20,
			price: 300000,
			description: 'Hành lý mua thêm 20kg',
		},
	});

	// Minimal meal options
	await FlightMealService.findOrCreate({
		where: { flight_id: flight.flight_id, meal_name: 'Bún thịt nướng' },
		defaults: {
			flight_id: flight.flight_id,
			meal_name: 'Bún thịt nướng',
			meal_description: 'Suất ăn tiêu chuẩn',
			price: 80000,
			is_vegetarian: false,
			is_halal: false,
		},
	});
	await FlightMealService.findOrCreate({
		where: { flight_id: flight.flight_id, meal_name: 'Cơm chay' },
		defaults: {
			flight_id: flight.flight_id,
			meal_name: 'Cơm chay',
			meal_description: 'Suất ăn chay',
			price: 90000,
			is_vegetarian: true,
			is_halal: false,
		},
	});
}

async function ensureDemoUser() {
	const [user] = await User.findOrCreate({
		where: { email: 'demo@flight.local' },
		defaults: {
			email: 'demo@flight.local',
			password: 'demo1234',
			first_name: 'Demo',
			last_name: 'User',
			title: 'Mr',
			phone: '0900000000',
		},
	});
	return user;
}

async function createPassengers() {
	const [p1] = await Passenger.findOrCreate({
		where: { passport_number: 'P1234567' },
		defaults: {
			first_name: 'NGUYEN',
			last_name: 'VANA',
			title: 'Mr',
			passenger_type: 'adult',
			date_of_birth: '1990-01-01',
			nationality: 'Việt Nam',
			passport_number: 'P1234567',
			passport_expiry: '2030-12-31',
			passport_issuing_country: 'VN',
		},
	});
	return [p1];
}

function generateBookingRef() {
	const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	let ref = '';
	for (let i = 0; i < 6; i++) {
		ref += alphabet[Math.floor(Math.random() * alphabet.length)];
	}
	return ref;
}

async function createBookingForFlight(user, flight, travelClasses, passengers) {
	const booking_reference = generateBookingRef();

	// Allocate seats in ECONOMY for every passenger
	const allocated = await seatAllocationService.allocateSeats(
		flight.flight_id,
		travelClasses.ECONOMY.class_id,
		passengers.length
	);

	// Price basis
	const baseFare = Number(flight.economy_price || 1200000);
	const base_amount = baseFare * passengers.length;
	const total_amount = base_amount; // no extras in seed

	const booking = await Booking.create({
		booking_reference,
		user_id: user.user_id,
		contact_email: user.email,
		contact_phone: user.phone || '0900000000',
		total_amount,
		base_amount,
		baggage_fees: 0,
		meal_fees: 0,
		service_package_fees: 0,
		status: 'confirmed',
		payment_status: 'paid',
		trip_type: 'one-way',
	});

	// Create booking details
	for (let i = 0; i < passengers.length; i++) {
		const passenger = passengers[i];
		const seat = allocated[i];
		await BookingDetail.create({
			booking_id: booking.booking_id,
			flight_id: flight.flight_id,
			passenger_id: passenger.passenger_id,
			seat_id: seat.seat_id,
			baggage_option_id: null,
			meal_option_id: null,
			ticket_number: `${booking_reference}-${i + 1}`,
			check_in_status: false,
		});
	}

	return booking;
}

async function main() {
	await connectDatabase();
	await sequelize.sync(); // ensure models are in sync (non-destructive with existing tables)

	const travelClasses = await ensureTravelClasses();
	const country = await ensureCountry();
	const airline = await ensureAirline(country);
	const airports = await ensureAirports(country);
	const aircraft = await ensureAircraft(airline);
	const flight = await ensureFlight(airline, aircraft, airports);
	await seedSeatsForFlight(flight, travelClasses);
	await ensureFlightServices(flight);
	const user = await ensureDemoUser();
	const passengers = await createPassengers();

	const booking = await createBookingForFlight(user, flight, travelClasses, passengers);

	console.log('Seed completed.');
	console.log('Flight:', flight.flight_number, 'ID:', flight.flight_id);
	console.log('Booking reference:', booking.booking_reference);
}

main()
	.then(() => {
		console.log('All done.');
		process.exit(0);
	})
	.catch((err) => {
		console.error('Seed error:', err);
		process.exit(1);
	});
