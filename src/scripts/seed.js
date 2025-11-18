const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const {
	User,
	Role,
	UserRole,
	Country,
	Airport,
	Airline,
	Aircraft,
	TravelClass,
	Flight,
	FlightSeat,
	BaggageOption,
	MealOption,
	FlightService,
	Passenger,
	Booking,
	BookingDetail,
	Payment,
	Promotion,
	PromotionUsage,
	EmailNotification,
	UserSearchHistory,
	FlightRecommendation,
	RefreshToken,
	Contact,
	ServicePackage,
} = require('../models');
const logger = require('../utils/logger');

const seedDatabase = async () => {
	try {
		logger.info('Starting comprehensive database seeding...');

		// 1. Seed Roles
		logger.info('Seeding roles...');
		const roles = await Role.bulkCreate(
			[
				{ role_name: 'user' },
				{ role_name: 'admin' },
				{ role_name: 'moderator' },
			],
			{ ignoreDuplicates: true }
		);

		// 2. Seed Countries
		logger.info('Seeding countries...');
		const countries = await Country.bulkCreate(
			[
				{ country_code: 'VN', country_name: 'Vietnam' },
				{ country_code: 'TH', country_name: 'Thailand' },
				{ country_code: 'SG', country_name: 'Singapore' },
				{ country_code: 'MY', country_name: 'Malaysia' },
				{ country_code: 'ID', country_name: 'Indonesia' },
				{ country_code: 'JP', country_name: 'Japan' },
				{ country_code: 'KR', country_name: 'South Korea' },
				{ country_code: 'CN', country_name: 'China' },
				{ country_code: 'US', country_name: 'United States' },
				{ country_code: 'GB', country_name: 'United Kingdom' },
				{ country_code: 'AU', country_name: 'Australia' },
				{ country_code: 'FR', country_name: 'France' },
			],
			{ ignoreDuplicates: true }
		);

		// 3. Seed Airports
		logger.info('Seeding airports...');
		const airports = await Airport.bulkCreate(
			[
				// Vietnam
				{
					airport_code: 'SGN',
					airport_name: 'Tan Son Nhat International Airport',
					city: 'Ho Chi Minh City',
					country_id: countries.find((c) => c.country_code === 'VN')
						.country_id,
					latitude: 10.8188,
					longitude: 106.652,
				},
				{
					airport_code: 'HAN',
					airport_name: 'Noi Bai International Airport',
					city: 'Hanoi',
					country_id: countries.find((c) => c.country_code === 'VN')
						.country_id,
					latitude: 21.2212,
					longitude: 105.8072,
				},
				{
					airport_code: 'DAD',
					airport_name: 'Da Nang International Airport',
					city: 'Da Nang',
					country_id: countries.find((c) => c.country_code === 'VN')
						.country_id,
					latitude: 16.0556,
					longitude: 108.1997,
				},
				// Thailand
				{
					airport_code: 'BKK',
					airport_name: 'Suvarnabhumi Airport',
					city: 'Bangkok',
					country_id: countries.find((c) => c.country_code === 'TH')
						.country_id,
					latitude: 13.69,
					longitude: 100.7501,
				},
				{
					airport_code: 'CNX',
					airport_name: 'Chiang Mai International Airport',
					city: 'Chiang Mai',
					country_id: countries.find((c) => c.country_code === 'TH')
						.country_id,
					latitude: 18.7668,
					longitude: 98.9631,
				},
				// Singapore
				{
					airport_code: 'SIN',
					airport_name: 'Singapore Changi Airport',
					city: 'Singapore',
					country_id: countries.find((c) => c.country_code === 'SG')
						.country_id,
					latitude: 1.3644,
					longitude: 103.9915,
				},
				// Malaysia
				{
					airport_code: 'KUL',
					airport_name: 'Kuala Lumpur International Airport',
					city: 'Kuala Lumpur',
					country_id: countries.find((c) => c.country_code === 'MY')
						.country_id,
					latitude: 2.7456,
					longitude: 101.7099,
				},
				// Japan
				{
					airport_code: 'NRT',
					airport_name: 'Narita International Airport',
					city: 'Tokyo',
					country_id: countries.find((c) => c.country_code === 'JP')
						.country_id,
					latitude: 35.772,
					longitude: 140.3928,
				},
				{
					airport_code: 'KIX',
					airport_name: 'Kansai International Airport',
					city: 'Osaka',
					country_id: countries.find((c) => c.country_code === 'JP')
						.country_id,
					latitude: 34.4342,
					longitude: 135.2441,
				},
				// South Korea
				{
					airport_code: 'ICN',
					airport_name: 'Incheon International Airport',
					city: 'Seoul',
					country_id: countries.find((c) => c.country_code === 'KR')
						.country_id,
					latitude: 37.4602,
					longitude: 126.4407,
				},
			],
			{ ignoreDuplicates: true }
		);

		// 4. Seed Airlines
		logger.info('Seeding airlines...');
		const airlines = await Airline.bulkCreate(
			[
				{
					airline_code: 'VN',
					airline_name: 'Vietnam Airlines',
					logo_url: 'https://example.com/vn-logo.png',
					country_id: countries.find((c) => c.country_code === 'VN')
						.country_id,
				},
				{
					airline_code: 'VJ',
					airline_name: 'VietJet Air',
					logo_url: 'https://example.com/vj-logo.png',
					country_id: countries.find((c) => c.country_code === 'VN')
						.country_id,
				},
				{
					airline_code: 'QH',
					airline_name: 'Bamboo Airways',
					logo_url: 'https://example.com/qh-logo.png',
					country_id: countries.find((c) => c.country_code === 'VN')
						.country_id,
				},
				{
					airline_code: 'TG',
					airline_name: 'Thai Airways',
					logo_url: 'https://example.com/tg-logo.png',
					country_id: countries.find((c) => c.country_code === 'TH')
						.country_id,
				},
				{
					airline_code: 'SQ',
					airline_name: 'Singapore Airlines',
					logo_url: 'https://example.com/sq-logo.png',
					country_id: countries.find((c) => c.country_code === 'SG')
						.country_id,
				},
				{
					airline_code: 'MH',
					airline_name: 'Malaysia Airlines',
					logo_url: 'https://example.com/mh-logo.png',
					country_id: countries.find((c) => c.country_code === 'MY')
						.country_id,
				},
				{
					airline_code: 'JL',
					airline_name: 'Japan Airlines',
					logo_url: 'https://example.com/jl-logo.png',
					country_id: countries.find((c) => c.country_code === 'JP')
						.country_id,
				},
				{
					airline_code: 'KE',
					airline_name: 'Korean Air',
					logo_url: 'https://example.com/ke-logo.png',
					country_id: countries.find((c) => c.country_code === 'KR')
						.country_id,
				},
			],
			{ ignoreDuplicates: true }
		);

		// 5. Seed Aircraft
		logger.info('Seeding aircraft...');
		const aircraft = await Aircraft.bulkCreate(
			[
				// Vietnam Airlines
				{
					airline_id: airlines.find((a) => a.airline_code === 'VN')
						.airline_id,
					model: 'Airbus A321',
					total_seats: 200,
					business_seats: 20,
					economy_seats: 180,
				},
				{
					airline_id: airlines.find((a) => a.airline_code === 'VN')
						.airline_id,
					model: 'Boeing 787-9',
					total_seats: 300,
					business_seats: 30,
					economy_seats: 270,
				},
				// VietJet Air
				{
					airline_id: airlines.find((a) => a.airline_code === 'VJ')
						.airline_id,
					model: 'Airbus A320',
					total_seats: 180,
					business_seats: 0,
					economy_seats: 180,
				},
				{
					airline_id: airlines.find((a) => a.airline_code === 'VJ')
						.airline_id,
					model: 'Airbus A321',
					total_seats: 230,
					business_seats: 0,
					economy_seats: 230,
				},
				// Bamboo Airways
				{
					airline_id: airlines.find((a) => a.airline_code === 'QH')
						.airline_id,
					model: 'Boeing 737-800',
					total_seats: 189,
					business_seats: 12,
					economy_seats: 177,
				},
				// Singapore Airlines
				{
					airline_id: airlines.find((a) => a.airline_code === 'SQ')
						.airline_id,
					model: 'Airbus A350-900',
					total_seats: 280,
					business_seats: 40,
					economy_seats: 240,
				},
				// Japan Airlines
				{
					airline_id: airlines.find((a) => a.airline_code === 'JL')
						.airline_id,
					model: 'Boeing 777-300ER',
					total_seats: 244,
					business_seats: 35,
					economy_seats: 209,
				},
			],
			{ ignoreDuplicates: true }
		);

		// 6. Seed Travel Classes
		logger.info('Seeding travel classes...');
		const travelClasses = await TravelClass.bulkCreate(
			[
				{ class_name: 'Business Class', class_code: 'BUSINESS' },
				{ class_name: 'Economy Class', class_code: 'ECONOMY' },
				{ class_name: 'First Class', class_code: 'FIRST' },
				{
					class_name: 'Premium Economy',
					class_code: 'PREMIUM_ECONOMY',
				},
			],
			{ ignoreDuplicates: true }
		);

		// 7. Seed Baggage Options
		logger.info('Seeding baggage options...');
		const baggageOptions = await BaggageOption.bulkCreate(
			[
				// Vietnam Airlines
				{
					airline_id: airlines.find((a) => a.airline_code === 'VN')
						.airline_id,
					weight_kg: 20,
					price: 0,
					description: 'Free baggage allowance',
				},
				{
					airline_id: airlines.find((a) => a.airline_code === 'VN')
						.airline_id,
					weight_kg: 30,
					price: 50,
					description: 'Extra 10kg baggage',
				},
				{
					airline_id: airlines.find((a) => a.airline_code === 'VN')
						.airline_id,
					weight_kg: 40,
					price: 100,
					description: 'Extra 20kg baggage',
				},
				// VietJet Air
				{
					airline_id: airlines.find((a) => a.airline_code === 'VJ')
						.airline_id,
					weight_kg: 7,
					price: 0,
					description: 'Free cabin baggage',
				},
				{
					airline_id: airlines.find((a) => a.airline_code === 'VJ')
						.airline_id,
					weight_kg: 20,
					price: 30,
					description: 'Checked baggage 20kg',
				},
				{
					airline_id: airlines.find((a) => a.airline_code === 'VJ')
						.airline_id,
					weight_kg: 30,
					price: 60,
					description: 'Checked baggage 30kg',
				},
				// Singapore Airlines
				{
					airline_id: airlines.find((a) => a.airline_code === 'SQ')
						.airline_id,
					weight_kg: 30,
					price: 0,
					description: 'Free baggage allowance',
				},
				{
					airline_id: airlines.find((a) => a.airline_code === 'SQ')
						.airline_id,
					weight_kg: 40,
					price: 80,
					description: 'Extra 10kg baggage',
				},
			],
			{ ignoreDuplicates: true }
		);

		// 8. Seed Meal Options
		logger.info('Seeding meal options...');
		const mealOptions = await MealOption.bulkCreate(
			[
				// Vietnam Airlines
				{
					airline_id: airlines.find((a) => a.airline_code === 'VN')
						.airline_id,
					meal_name: 'Vietnamese Beef Pho',
					meal_description: 'Traditional Vietnamese noodle soup',
					price: 15,
					is_vegetarian: false,
					is_halal: false,
				},
				{
					airline_id: airlines.find((a) => a.airline_code === 'VN')
						.airline_id,
					meal_name: 'Vegetarian Spring Rolls',
					meal_description: 'Fresh vegetable spring rolls',
					price: 12,
					is_vegetarian: true,
					is_halal: true,
				},
				{
					airline_id: airlines.find((a) => a.airline_code === 'VN')
						.airline_id,
					meal_name: 'Chicken Rice',
					meal_description: 'Vietnamese style chicken rice',
					price: 10,
					is_vegetarian: false,
					is_halal: true,
				},
				// VietJet Air
				{
					airline_id: airlines.find((a) => a.airline_code === 'VJ')
						.airline_id,
					meal_name: 'Sandwich Combo',
					meal_description: 'Chicken sandwich with drink',
					price: 8,
					is_vegetarian: false,
					is_halal: true,
				},
				{
					airline_id: airlines.find((a) => a.airline_code === 'VJ')
						.airline_id,
					meal_name: 'Vegetarian Wrap',
					meal_description: 'Fresh vegetable wrap',
					price: 6,
					is_vegetarian: true,
					is_halal: true,
				},
				// Singapore Airlines
				{
					airline_id: airlines.find((a) => a.airline_code === 'SQ')
						.airline_id,
					meal_name: 'Singapore Chicken Rice',
					meal_description: 'Famous Singapore chicken rice',
					price: 20,
					is_vegetarian: false,
					is_halal: true,
				},
				{
					airline_id: airlines.find((a) => a.airline_code === 'SQ')
						.airline_id,
					meal_name: 'Laksa',
					meal_description: 'Spicy coconut noodle soup',
					price: 18,
					is_vegetarian: false,
					is_halal: true,
				},
			],
			{ ignoreDuplicates: true }
		);

		// 9. Seed Service Packages
		logger.info('Seeding service packages...');
		const servicePackages = await ServicePackage.bulkCreate(
			[
				{
					airline_id: airlines.find((a) => a.airline_code === 'VN')
						.airline_id,
					package_name: 'Premium Service',
					description:
						'Priority boarding, extra legroom, premium meal',
					price: 150,
					features: JSON.stringify([
						'Priority boarding',
						'Extra legroom',
						'Premium meal',
						'Extra baggage',
					]),
				},
				{
					airline_id: airlines.find((a) => a.airline_code === 'VN')
						.airline_id,
					package_name: 'Standard Service',
					description: 'Standard service package',
					price: 50,
					features: JSON.stringify([
						'Standard meal',
						'Standard baggage',
					]),
				},
				{
					airline_id: airlines.find((a) => a.airline_code === 'VJ')
						.airline_id,
					package_name: 'Basic Service',
					description: 'Basic service package',
					price: 25,
					features: JSON.stringify([
						'Basic meal',
						'Standard baggage',
					]),
				},
			],
			{ ignoreDuplicates: true }
		);

		// 10. Seed Promotions
		logger.info('Seeding promotions...');
		const promotions = await Promotion.bulkCreate(
			[
				{
					promotion_code: 'WELCOME10',
					description: 'Welcome discount 10% for new users',
					discount_type: 'percentage',
					discount_value: 10,
					min_purchase: 100,
					start_date: '2024-01-01',
					end_date: '2025-12-31',
					usage_limit: 1000,
				},
				{
					promotion_code: 'SAVE50',
					description: 'Fixed discount 50,000 VND',
					discount_type: 'fixed_amount',
					discount_value: 50,
					min_purchase: 200,
					start_date: '2024-01-01',
					end_date: '2026-06-30',
					usage_limit: 500,
				},
				{
					promotion_code: 'SUMMER20',
					description: 'Summer promotion 20% off',
					discount_type: 'percentage',
					discount_value: 20,
					min_purchase: 500,
					start_date: '2024-06-01',
					end_date: '2024-08-31',
					usage_limit: 200,
				},
				{
					promotion_code: 'FIRSTTIME',
					description: 'First time booking discount',
					discount_type: 'fixed_amount',
					discount_value: 100,
					min_purchase: 300,
					start_date: '2024-01-01',
					end_date: '2025-12-31',
					usage_limit: 100,
				},
			],
			{ ignoreDuplicates: true }
		);

		// 11. Seed Users
		logger.info('Seeding users...');
		const hashedPassword = await bcrypt.hash('Password123!', 10);
		const users = await User.bulkCreate(
			[
				{
					email: 'admin@flightbooking.com',
					password: hashedPassword,
					first_name: 'Admin',
					last_name: 'System',
					phone: '+84901234567',
					date_of_birth: '1990-01-01',
					is_active: true,
				},
				{
					email: 'user@flightbooking.com',
					password: hashedPassword,
					first_name: 'John',
					last_name: 'Doe',
					phone: '+84901234568',
					date_of_birth: '1992-05-15',
					is_active: true,
				},
				{
					email: 'test@flightbooking.com',
					password: hashedPassword,
					first_name: 'Jane',
					last_name: 'Smith',
					phone: '+84901234569',
					date_of_birth: '1995-12-25',
					is_active: true,
				},
				{
					email: 'google@flightbooking.com',
					password: hashedPassword,
					first_name: 'Google',
					last_name: 'User',
					phone: '+84901234570',
					date_of_birth: '1988-07-20',
					google_id: '123456789',
					is_active: true,
				},
				{
					email: 'premium@flightbooking.com',
					password: hashedPassword,
					first_name: 'Premium',
					last_name: 'Customer',
					phone: '+84901234571',
					date_of_birth: '1985-03-10',
					is_active: true,
				},
			],
			{ ignoreDuplicates: true }
		);

		// 12. Assign Roles to Users
		logger.info('Assigning roles to users...');
		const userRoles = await UserRole.bulkCreate(
			[
				{
					user_id: users[0].user_id,
					role_id: roles.find((r) => r.role_name === 'admin').role_id,
				},
				{
					user_id: users[1].user_id,
					role_id: roles.find((r) => r.role_name === 'user').role_id,
				},
				{
					user_id: users[2].user_id,
					role_id: roles.find((r) => r.role_name === 'user').role_id,
				},
				{
					user_id: users[3].user_id,
					role_id: roles.find((r) => r.role_name === 'user').role_id,
				},
				{
					user_id: users[4].user_id,
					role_id: roles.find((r) => r.role_name === 'user').role_id,
				},
			],
			{ ignoreDuplicates: true }
		);

		// 13. Seed Flights
		logger.info('Seeding flights...');
		const today = new Date();
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);
		const nextWeek = new Date(today);
		nextWeek.setDate(nextWeek.getDate() + 7);

		const formatDate = (date) => {
			return date.toISOString().slice(0, 19).replace('T', ' ');
		};

		// Get airline and aircraft references
		const vnAirline = airlines.find((a) => a.airline_code === 'VN');
		const vjAirline = airlines.find((a) => a.airline_code === 'VJ');
		const qhAirline = airlines.find((a) => a.airline_code === 'QH');
		const sqAirline = airlines.find((a) => a.airline_code === 'SQ');
		const jlAirline = airlines.find((a) => a.airline_code === 'JL');

		// Validate airlines exist
		if (!vnAirline) throw new Error('Vietnam Airlines not found');
		if (!vjAirline) throw new Error('VietJet Air not found');
		if (!qhAirline) throw new Error('Bamboo Airways not found');
		if (!sqAirline) throw new Error('Singapore Airlines not found');
		if (!jlAirline) throw new Error('Japan Airlines not found');

		const vnA321 = aircraft.find(
			(a) =>
				a.model === 'Airbus A321' &&
				a.airline_id === vnAirline.airline_id
		);
		const vnBoeing = aircraft.find(
			(a) =>
				a.model === 'Boeing 787-9' &&
				a.airline_id === vnAirline.airline_id
		);
		const vjA320 = aircraft.find(
			(a) =>
				a.model === 'Airbus A320' &&
				a.airline_id === vjAirline.airline_id
		);
		const sqA350 = aircraft.find(
			(a) =>
				a.model === 'Airbus A350-900' &&
				a.airline_id === sqAirline.airline_id
		);
		const qhBoeing = aircraft.find(
			(a) =>
				a.model === 'Boeing 737-800' &&
				a.airline_id === qhAirline.airline_id
		);
		const jlBoeing = aircraft.find(
			(a) =>
				a.model === 'Boeing 777-300ER' &&
				a.airline_id === jlAirline.airline_id
		);

		// Validate aircraft exist
		if (!vnA321) throw new Error('Vietnam Airlines A321 not found');
		if (!vnBoeing)
			throw new Error('Vietnam Airlines Boeing 787-9 not found');
		if (!vjA320) throw new Error('VietJet A320 not found');
		if (!sqA350) throw new Error('Singapore Airlines A350 not found');
		if (!qhBoeing)
			throw new Error('Bamboo Airways Boeing 737-800 not found');
		if (!jlBoeing)
			throw new Error('Japan Airlines Boeing 777-300ER not found');

		const sgnAirport = airports.find((a) => a.airport_code === 'SGN');
		const hanAirport = airports.find((a) => a.airport_code === 'HAN');
		const bkkAirport = airports.find((a) => a.airport_code === 'BKK');
		const sinAirport = airports.find((a) => a.airport_code === 'SIN');
		const dadAirport = airports.find((a) => a.airport_code === 'DAD');
		const nrtAirport = airports.find((a) => a.airport_code === 'NRT');

		// Validate airports exist
		if (!sgnAirport) throw new Error('SGN airport not found');
		if (!hanAirport) throw new Error('HAN airport not found');
		if (!bkkAirport) throw new Error('BKK airport not found');
		if (!sinAirport) throw new Error('SIN airport not found');
		if (!dadAirport) throw new Error('DAD airport not found');
		if (!nrtAirport) throw new Error('NRT airport not found');

		logger.info(
			`Found ${airlines.length} airlines, ${aircraft.length} aircraft, ${airports.length} airports`
		);

		const flights = await Flight.bulkCreate(
			[
				// Domestic Vietnam flights
				{
					flight_number: 'VN123',
					airline_id: vnAirline.airline_id,
					aircraft_id: vnA321.aircraft_id,
					departure_airport_id: sgnAirport.airport_id,
					arrival_airport_id: hanAirport.airport_id,
					departure_time: formatDate(
						new Date(tomorrow.setHours(8, 0, 0))
					),
					arrival_time: formatDate(
						new Date(tomorrow.setHours(10, 0, 0))
					),
					status: 'scheduled',
				},
				{
					flight_number: 'VN456',
					airline_id: vnAirline.airline_id,
					aircraft_id: vnBoeing.aircraft_id,
					departure_airport_id: hanAirport.airport_id,
					arrival_airport_id: sgnAirport.airport_id,
					departure_time: formatDate(
						new Date(tomorrow.setHours(15, 0, 0))
					),
					arrival_time: formatDate(
						new Date(tomorrow.setHours(17, 0, 0))
					),
					status: 'scheduled',
				},
				// International flights
				{
					flight_number: 'VJ789',
					airline_id: vjAirline.airline_id,
					aircraft_id: vjA320.aircraft_id,
					departure_airport_id: sgnAirport.airport_id,
					arrival_airport_id: bkkAirport.airport_id,
					departure_time: formatDate(
						new Date(tomorrow.setHours(12, 0, 0))
					),
					arrival_time: formatDate(
						new Date(tomorrow.setHours(13, 30, 0))
					),
					status: 'scheduled',
				},
				{
					flight_number: 'SQ567',
					airline_id: sqAirline.airline_id,
					aircraft_id: sqA350.aircraft_id,
					departure_airport_id: sinAirport.airport_id,
					arrival_airport_id: sgnAirport.airport_id,
					departure_time: formatDate(
						new Date(nextWeek.setHours(9, 30, 0))
					),
					arrival_time: formatDate(
						new Date(nextWeek.setHours(10, 45, 0))
					),
					status: 'scheduled',
				},
				{
					flight_number: 'QH321',
					airline_id: qhAirline.airline_id,
					aircraft_id: qhBoeing.aircraft_id,
					departure_airport_id: sgnAirport.airport_id,
					arrival_airport_id: dadAirport.airport_id,
					departure_time: formatDate(
						new Date(tomorrow.setHours(10, 30, 0))
					),
					arrival_time: formatDate(
						new Date(tomorrow.setHours(11, 45, 0))
					),
					status: 'scheduled',
				},
				{
					flight_number: 'JL999',
					airline_id: jlAirline.airline_id,
					aircraft_id: jlBoeing.aircraft_id,
					departure_airport_id: nrtAirport.airport_id,
					arrival_airport_id: sgnAirport.airport_id,
					departure_time: formatDate(
						new Date(nextWeek.setHours(14, 0, 0))
					),
					arrival_time: formatDate(
						new Date(nextWeek.setHours(18, 30, 0))
					),
					status: 'scheduled',
				},
			],
			{ ignoreDuplicates: true }
		);

		logger.info(`Created ${flights.length} flights successfully`);

		// 14. Seed Flight Seats
		logger.info('Seeding flight seats...');
		const flightSeats = [];

		for (const flight of flights) {
			const aircraftData = aircraft.find(
				(a) => a.aircraft_id === flight.aircraft_id
			);

			if (!aircraftData) {
				logger.error(
					`Aircraft not found for flight ${flight.flight_number}`
				);
				continue;
			}

			logger.info(
				`Creating seats for flight ${flight.flight_number} with aircraft ${aircraftData.model}`
			);

			// Business Class Seats
			if (aircraftData.business_seats > 0) {
				const businessRows = ['A', 'B', 'C', 'D'];
				const businessRowCount = Math.ceil(
					aircraftData.business_seats / 4
				);

				for (let row = 1; row <= businessRowCount; row++) {
					for (const col of businessRows) {
						flightSeats.push({
							flight_id: flight.flight_id,
							class_id: travelClasses.find(
								(tc) => tc.class_code === 'BUSINESS'
							).class_id,
							seat_number: `${row}${col}`,
							price: 2500000, // 2,500,000 VND for business
							is_available: true,
						});
					}
				}
			}

			// Economy Class Seats
			const economyRows = ['A', 'B', 'C', 'D', 'E', 'F'];
			const economyRowCount = Math.ceil(aircraftData.economy_seats / 6);

			for (let row = 10; row <= 10 + economyRowCount - 1; row++) {
				for (const col of economyRows) {
					flightSeats.push({
						flight_id: flight.flight_id,
						class_id: travelClasses.find(
							(tc) => tc.class_code === 'ECONOMY'
						).class_id,
						seat_number: `${row}${col}`,
						price: 1200000, // 1,200,000 VND for economy
						is_available: true,
					});
				}
			}
		}

		logger.info(`Generated ${flightSeats.length} flight seats`);

		// Create flight seats in batches
		const batchSize = 100;
		let totalCreated = 0;
		for (let i = 0; i < flightSeats.length; i += batchSize) {
			const batch = flightSeats.slice(i, i + batchSize);
			await FlightSeat.bulkCreate(batch, { ignoreDuplicates: true });
			totalCreated += batch.length;
			logger.info(
				`Created batch ${Math.floor(i / batchSize) + 1}: ${
					batch.length
				} seats (${totalCreated}/${flightSeats.length})`
			);
		}

		logger.info(`Successfully created ${totalCreated} flight seats`);

		// 15. Seed Flight Services
		logger.info('Seeding flight services...');
		const flightServices = [];

		for (const flight of flights) {
			// Add baggage options
			const airlineBaggage = baggageOptions.filter(
				(bo) => bo.airline_id === flight.airline_id
			);
			for (const baggage of airlineBaggage) {
				flightServices.push({
					flight_id: flight.flight_id,
					service_type: 'baggage',
					service_ref_id: baggage.baggage_id,
					is_available: true,
				});
			}

			// Add meal options
			const airlineMeals = mealOptions.filter(
				(mo) => mo.airline_id === flight.airline_id
			);
			for (const meal of airlineMeals) {
				flightServices.push({
					flight_id: flight.flight_id,
					service_type: 'meal',
					service_ref_id: meal.meal_id,
					is_available: true,
				});
			}
		}

		await FlightService.bulkCreate(flightServices, {
			ignoreDuplicates: true,
		});

		// 16. Seed Passengers
		logger.info('Seeding passengers...');
		const passengers = await Passenger.bulkCreate(
			[
				{
					first_name: 'John',
					last_name: 'Doe',
					date_of_birth: '1985-06-15',
					nationality: 'Vietnamese',
					passport_number: 'P12345678',
					passport_expiry: '2030-01-01',
				},
				{
					first_name: 'Jane',
					last_name: 'Smith',
					date_of_birth: '1988-03-22',
					nationality: 'Vietnamese',
					passport_number: 'P87654321',
					passport_expiry: '2030-01-01',
				},
				{
					first_name: 'Robert',
					last_name: 'Johnson',
					date_of_birth: '1975-11-08',
					nationality: 'American',
					passport_number: 'US12345678',
					passport_expiry: '2028-05-15',
				},
				{
					first_name: 'Emily',
					last_name: 'Brown',
					date_of_birth: '1990-04-12',
					nationality: 'British',
					passport_number: 'GB98765432',
					passport_expiry: '2029-08-22',
				},
				{
					first_name: 'Michael',
					last_name: 'Wilson',
					date_of_birth: '1992-09-30',
					nationality: 'Australian',
					passport_number: 'AU55555555',
					passport_expiry: '2031-03-15',
				},
			],
			{ ignoreDuplicates: true }
		);

		// 17. Seed Bookings
		logger.info('Seeding bookings...');
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		const bookings = await Booking.bulkCreate(
			[
				{
					booking_reference: 'AB1234CD',
					user_id: users[1].user_id,
					contact_email: 'user@flightbooking.com',
					contact_phone: '+84901234568',
					booking_date: formatDate(yesterday),
					total_amount: 5000000,
					status: 'confirmed',
					payment_status: 'paid',
				},
				{
					booking_reference: 'EF5678GH',
					user_id: users[2].user_id,
					contact_email: 'test@flightbooking.com',
					contact_phone: '+84901234569',
					booking_date: formatDate(yesterday),
					total_amount: 2850000,
					status: 'confirmed',
					payment_status: 'paid',
				},
				{
					booking_reference: 'IJ9012KL',
					user_id: users[3].user_id,
					contact_email: 'google@flightbooking.com',
					contact_phone: '+84901234570',
					booking_date: formatDate(yesterday),
					total_amount: 7500000,
					status: 'pending',
					payment_status: 'pending',
				},
			],
			{ ignoreDuplicates: true }
		);

		// 18. Seed Booking Details
		logger.info('Seeding booking details...');
		const availableSeats = await FlightSeat.findAll({
			where: { is_available: true },
			limit: 6,
		});

		if (availableSeats.length >= 3) {
			// Mark some seats as unavailable
			for (let i = 0; i < 3; i++) {
				await availableSeats[i].update({ is_available: false });
			}

			const bookingDetails = await BookingDetail.bulkCreate(
				[
					{
						booking_id: bookings[0].booking_id,
						flight_id: availableSeats[0].flight_id,
						passenger_id: passengers[0].passenger_id,
						seat_id: availableSeats[0].seat_id,
						baggage_option_id: baggageOptions[0].baggage_id,
						meal_option_id: mealOptions[0].meal_id,
						ticket_number: 'TKT123456789',
						check_in_status: false,
					},
					{
						booking_id: bookings[1].booking_id,
						flight_id: availableSeats[1].flight_id,
						passenger_id: passengers[1].passenger_id,
						seat_id: availableSeats[1].seat_id,
						baggage_option_id: baggageOptions[1].baggage_id,
						meal_option_id: mealOptions[1].meal_id,
						ticket_number: 'TKT987654321',
						check_in_status: false,
					},
					{
						booking_id: bookings[2].booking_id,
						flight_id: availableSeats[2].flight_id,
						passenger_id: passengers[2].passenger_id,
						seat_id: availableSeats[2].seat_id,
						baggage_option_id: baggageOptions[2].baggage_id,
						meal_option_id: mealOptions[2].meal_id,
						ticket_number: 'TKT555666777',
						check_in_status: false,
					},
				],
				{ ignoreDuplicates: true }
			);
		}

		// 19. Seed Payments
		logger.info('Seeding payments...');
		const payments = await Payment.bulkCreate(
			[
				{
					booking_id: bookings[0].booking_id,
					amount: 5000000,
					payment_method: 'credit_card',
					payment_reference: 'PAY123456789',
					payment_date: formatDate(yesterday),
					status: 'completed',
					transaction_details: JSON.stringify({
						card_type: 'Visa',
						last_digits: '4567',
						payment_processor: 'Stripe',
					}),
				},
				{
					booking_id: bookings[1].booking_id,
					amount: 2850000,
					payment_method: 'zalopay',
					payment_reference: 'PAY987654321',
					payment_date: formatDate(yesterday),
					status: 'completed',
					transaction_details: JSON.stringify({
						zalo_id: '123456789',
						payment_processor: 'ZaloPay',
					}),
				},
			],
			{ ignoreDuplicates: true }
		);

		// 20. Seed Email Notifications
		logger.info('Seeding email notifications...');
		const emailNotifications = await EmailNotification.bulkCreate(
			[
				{
					user_id: users[1].user_id,
					booking_id: bookings[0].booking_id,
					notification_type: 'booking_confirmation',
					email_subject: 'Booking Confirmation - AB1234CD',
					email_content:
						'Dear customer, your booking has been confirmed. Thank you for choosing our airline.',
					sent_at: formatDate(yesterday),
					status: 'sent',
				},
				{
					user_id: users[2].user_id,
					booking_id: bookings[1].booking_id,
					notification_type: 'booking_confirmation',
					email_subject: 'Booking Confirmation - EF5678GH',
					email_content:
						'Dear customer, your booking has been confirmed. Thank you for choosing our airline.',
					sent_at: formatDate(yesterday),
					status: 'sent',
				},
			],
			{ ignoreDuplicates: true }
		);

		// 21. Seed User Search History
		logger.info('Seeding user search history...');
		const userSearchHistory = await UserSearchHistory.bulkCreate(
			[
				{
					user_id: users[1].user_id,
					departure_airport_id: airports.find(
						(a) => a.airport_code === 'SGN'
					).airport_id,
					arrival_airport_id: airports.find(
						(a) => a.airport_code === 'HAN'
					).airport_id,
					departure_date: formatDate(tomorrow),
					return_date: null,
					passengers: 2,
					travel_class_id: travelClasses.find(
						(tc) => tc.class_code === 'ECONOMY'
					).class_id,
				},
				{
					user_id: users[2].user_id,
					departure_airport_id: airports.find(
						(a) => a.airport_code === 'SGN'
					).airport_id,
					arrival_airport_id: airports.find(
						(a) => a.airport_code === 'BKK'
					).airport_id,
					departure_date: formatDate(tomorrow),
					return_date: formatDate(nextWeek),
					passengers: 3,
					travel_class_id: travelClasses.find(
						(tc) => tc.class_code === 'ECONOMY'
					).class_id,
				},
				{
					user_id: users[3].user_id,
					departure_airport_id: airports.find(
						(a) => a.airport_code === 'SIN'
					).airport_id,
					arrival_airport_id: airports.find(
						(a) => a.airport_code === 'SGN'
					).airport_id,
					departure_date: formatDate(nextWeek),
					return_date: null,
					passengers: 1,
					travel_class_id: travelClasses.find(
						(tc) => tc.class_code === 'BUSINESS'
					).class_id,
				},
			],
			{ ignoreDuplicates: true }
		);

		// 22. Seed Flight Recommendations
		logger.info('Seeding flight recommendations...');
		const flightRecommendations = await FlightRecommendation.bulkCreate(
			[
				{
					user_id: users[1].user_id,
					flight_id: flights[0].flight_id,
					recommendation_score: 0.85,
					recommendation_reason:
						'Based on your previous searches for flights to Hanoi',
				},
				{
					user_id: users[2].user_id,
					flight_id: flights[2].flight_id,
					recommendation_score: 0.92,
					recommendation_reason:
						'Popular flight to Bangkok based on your search history',
				},
				{
					user_id: users[3].user_id,
					flight_id: flights[3].flight_id,
					recommendation_score: 0.78,
					recommendation_reason:
						'Singapore Airlines flight matches your preferences',
				},
			],
			{ ignoreDuplicates: true }
		);

		// 23. Seed Contact Messages
		logger.info('Seeding contact messages...');
		const contacts = await Contact.bulkCreate(
			[
				{
					name: 'John Customer',
					email: 'john@example.com',
					phone: '+84901234567',
					subject: 'Flight booking inquiry',
					message:
						'I would like to know about flight availability for next month.',
					status: 'new',
				},
				{
					name: 'Jane Traveler',
					email: 'jane@example.com',
					phone: '+84901234568',
					subject: 'Baggage policy question',
					message:
						'What is the baggage allowance for international flights?',
					status: 'responded',
				},
			],
			{ ignoreDuplicates: true }
		);

		logger.info('Database seeding completed successfully!');
		logger.info('Summary:');
		logger.info(`   - ${roles.length} roles created`);
		logger.info(`   - ${countries.length} countries created`);
		logger.info(`   - ${airports.length} airports created`);
		logger.info(`   - ${airlines.length} airlines created`);
		logger.info(`   - ${aircraft.length} aircraft created`);
		logger.info(`   - ${travelClasses.length} travel classes created`);
		logger.info(`   - ${baggageOptions.length} baggage options created`);
		logger.info(`   - ${mealOptions.length} meal options created`);
		logger.info(`   - ${servicePackages.length} service packages created`);
		logger.info(`   - ${promotions.length} promotions created`);
		logger.info(`   - ${users.length} users created`);
		logger.info(`   - ${flights.length} flights created`);
		logger.info(`   - ${flightSeats.length} flight seats created`);
		logger.info(`   - ${passengers.length} passengers created`);
		logger.info(`   - ${bookings.length} bookings created`);
		logger.info(`   - ${payments.length} payments created`);
		logger.info(
			`   - ${emailNotifications.length} email notifications created`
		);
		logger.info(
			`   - ${userSearchHistory.length} search history records created`
		);
		logger.info(
			`   - ${flightRecommendations.length} flight recommendations created`
		);
		logger.info(`   - ${contacts.length} contact messages created`);

		logger.info('Default credentials:');
		logger.info('   Admin: admin@flightbooking.com / Password123!');
		logger.info('   User: user@flightbooking.com / Password123!');
		logger.info('   Test: test@flightbooking.com / Password123!');
	} catch (error) {
		logger.error('Error seeding database:', error);
		throw error;
	}
};

module.exports = seedDatabase;
