/**
 * AI Seed Data
 * Sample data for testing AI recommendation features
 */

const aiSeedData = {
	// Sample user search history for testing
	userSearchHistory: [
		{
			user_id: 1,
			departure_airport_id: 1, // SGN
			arrival_airport_id: 2, // HAN
			departure_date: '2024-02-15',
			passengers: 1,
			travel_class_id: 1, // ECONOMY
		},
		{
			user_id: 1,
			departure_airport_id: 2, // HAN
			arrival_airport_id: 1, // SGN
			departure_date: '2024-02-20',
			passengers: 1,
			travel_class_id: 1, // ECONOMY
		},
		{
			user_id: 1,
			departure_airport_id: 1, // SGN
			arrival_airport_id: 3, // DAD
			departure_date: '2024-03-01',
			passengers: 2,
			travel_class_id: 1, // ECONOMY
		},
		{
			user_id: 2,
			departure_airport_id: 1, // SGN
			arrival_airport_id: 2, // HAN
			departure_date: '2024-02-10',
			passengers: 1,
			travel_class_id: 2, // BUSINESS
		},
		{
			user_id: 2,
			departure_airport_id: 2, // HAN
			arrival_airport_id: 4, // PQC
			departure_date: '2024-02-25',
			passengers: 1,
			travel_class_id: 2, // BUSINESS
		},
		{
			user_id: 3,
			departure_airport_id: 1, // SGN
			arrival_airport_id: 2, // HAN
			departure_date: '2024-02-12',
			passengers: 3,
			travel_class_id: 1, // ECONOMY
		},
		{
			user_id: 3,
			departure_airport_id: 1, // SGN
			arrival_airport_id: 3, // DAD
			departure_date: '2024-03-05',
			passengers: 2,
			travel_class_id: 1, // ECONOMY
		},
		{
			user_id: 4,
			departure_airport_id: 2, // HAN
			arrival_airport_id: 1, // SGN
			departure_date: '2024-02-18',
			passengers: 1,
			travel_class_id: 1, // ECONOMY
		},
		{
			user_id: 4,
			departure_airport_id: 1, // SGN
			arrival_airport_id: 2, // HAN
			departure_date: '2024-02-28',
			passengers: 1,
			travel_class_id: 2, // BUSINESS
		},
		{
			user_id: 5,
			departure_airport_id: 3, // DAD
			arrival_airport_id: 1, // SGN
			departure_date: '2024-03-10',
			passengers: 2,
			travel_class_id: 1, // ECONOMY
		},
	],

	// Sample flight recommendations for testing
	flightRecommendations: [
		{
			user_id: 1,
			flight_id: 1,
			recommendation_score: 85.5,
			recommendation_reason:
				'Matches your preferred airline; Great price; Good seat availability',
		},
		{
			user_id: 1,
			flight_id: 2,
			recommendation_score: 78.0,
			recommendation_reason:
				"Matches your preferred departure time; Popular route you've booked before",
		},
		{
			user_id: 1,
			flight_id: 3,
			recommendation_score: 72.5,
			recommendation_reason: 'Good price; Matches your preferred airline',
		},
		{
			user_id: 2,
			flight_id: 4,
			recommendation_score: 92.0,
			recommendation_reason:
				'Matches your preferred airline; Matches your preferred departure time; Great price',
		},
		{
			user_id: 2,
			flight_id: 5,
			recommendation_score: 88.5,
			recommendation_reason:
				'Matches your preferred airline; Good seat availability',
		},
		{
			user_id: 3,
			flight_id: 6,
			recommendation_score: 76.0,
			recommendation_reason:
				"Good price; Popular route you've booked before",
		},
		{
			user_id: 3,
			flight_id: 7,
			recommendation_score: 69.5,
			recommendation_reason: 'Matches your preferred departure time',
		},
		{
			user_id: 4,
			flight_id: 8,
			recommendation_score: 81.0,
			recommendation_reason: 'Matches your preferred airline; Good price',
		},
		{
			user_id: 4,
			flight_id: 9,
			recommendation_score: 74.5,
			recommendation_reason:
				"Popular route you've booked before; Good seat availability",
		},
		{
			user_id: 5,
			flight_id: 10,
			recommendation_score: 83.0,
			recommendation_reason:
				'Matches your preferred departure time; Great price',
		},
	],

	// Sample AI insights for testing
	aiInsights: {
		user_1: {
			preferences: {
				preferred_airlines: [1, 2], // Vietnam Airlines, VietJet Air
				preferred_routes: ['1-2', '2-1', '1-3'], // SGN-HAN, HAN-SGN, SGN-DAD
				preferred_times: [8, 9, 14, 15], // Morning and afternoon flights
				preferred_class: 'ECONOMY',
				preferred_passengers: 1,
				search_frequency: 3,
			},
			patterns: {
				booked_airlines: [1, 2],
				booked_routes: [
					{ departure_airport_id: 1, arrival_airport_id: 2 },
					{ departure_airport_id: 2, arrival_airport_id: 1 },
				],
				booked_times: [8, 14],
				booked_classes: [1],
				booking_frequency: 2,
				average_booking_advance: 5.5,
			},
			insights: {
				most_searched_routes: ['1-2', '2-1', '1-3'],
				preferred_booking_advance: 5.5,
				search_frequency: 3,
				booking_frequency: 2,
				preferred_travel_times: [8, 9, 14, 15],
				airline_loyalty: 75,
			},
		},
		user_2: {
			preferences: {
				preferred_airlines: [1], // Vietnam Airlines
				preferred_routes: ['1-2', '2-4'], // SGN-HAN, HAN-PQC
				preferred_times: [10, 11, 16, 17], // Late morning and evening
				preferred_class: 'BUSINESS',
				preferred_passengers: 1,
				search_frequency: 2,
			},
			patterns: {
				booked_airlines: [1],
				booked_routes: [
					{ departure_airport_id: 1, arrival_airport_id: 2 },
					{ departure_airport_id: 2, arrival_airport_id: 4 },
				],
				booked_times: [10, 16],
				booked_classes: [2],
				booking_frequency: 2,
				average_booking_advance: 8.0,
			},
			insights: {
				most_searched_routes: ['1-2', '2-4'],
				preferred_booking_advance: 8.0,
				search_frequency: 2,
				booking_frequency: 2,
				preferred_travel_times: [10, 11, 16, 17],
				airline_loyalty: 100,
			},
		},
	},

	// Sample search suggestions for testing
	searchSuggestions: {
		han: [
			{
				type: 'airport',
				code: 'HAN',
				name: 'Noi Bai International Airport',
				city: 'Hanoi',
				relevance_score: 10,
			},
			{
				type: 'route',
				departure: {
					code: 'SGN',
					name: 'Tan Son Nhat International Airport',
					city: 'Ho Chi Minh City',
				},
				arrival: {
					code: 'HAN',
					name: 'Noi Bai International Airport',
					city: 'Hanoi',
				},
				relevance_score: 8,
			},
		],
		sgn: [
			{
				type: 'airport',
				code: 'SGN',
				name: 'Tan Son Nhat International Airport',
				city: 'Ho Chi Minh City',
				relevance_score: 10,
			},
			{
				type: 'route',
				departure: {
					code: 'HAN',
					name: 'Noi Bai International Airport',
					city: 'Hanoi',
				},
				arrival: {
					code: 'SGN',
					name: 'Tan Son Nhat International Airport',
					city: 'Ho Chi Minh City',
				},
				relevance_score: 8,
			},
		],
		dad: [
			{
				type: 'airport',
				code: 'DAD',
				name: 'Da Nang International Airport',
				city: 'Da Nang',
				relevance_score: 10,
			},
			{
				type: 'route',
				departure: {
					code: 'SGN',
					name: 'Tan Son Nhat International Airport',
					city: 'Ho Chi Minh City',
				},
				arrival: {
					code: 'DAD',
					name: 'Da Nang International Airport',
					city: 'Da Nang',
				},
				relevance_score: 6,
			},
		],
	},

	// Sample booking assistant suggestions
	bookingAssistantSuggestions: {
		flight_1: {
			seat_recommendations: {
				recommended_seats: ['A1', 'B1', 'C1'],
				reason: 'Window seats with extra legroom',
			},
			baggage_suggestions: {
				recommended_baggage: '20kg checked baggage',
				reason: 'Based on your travel history',
			},
			meal_suggestions: {
				recommended_meals: ['Vegetarian', 'Halal'],
				reason: 'Based on your preferences',
			},
			insurance_suggestion: {
				recommended: true,
				reason: 'Travel insurance recommended for high-value bookings',
			},
			check_in_reminder: {
				check_in_time: '2024-02-14T10:00:00.000Z',
				reminder_message: 'Check-in opens 24 hours before departure',
			},
		},
		flight_2: {
			seat_recommendations: {
				recommended_seats: ['D1', 'E1', 'F1'],
				reason: 'Aisle seats for easy access',
			},
			baggage_suggestions: {
				recommended_baggage: '15kg checked baggage',
				reason: 'Based on your travel history',
			},
			meal_suggestions: {
				recommended_meals: ['Standard', 'Vegetarian'],
				reason: 'Based on your preferences',
			},
			insurance_suggestion: {
				recommended: false,
				reason: 'Travel insurance not required for short domestic flights',
			},
			check_in_reminder: {
				check_in_time: '2024-02-19T10:00:00.000Z',
				reminder_message: 'Check-in opens 24 hours before departure',
			},
		},
	},

	// Sample personalized recommendations
	personalizedRecommendations: {
		user_1: [
			{
				flight_id: 1,
				flight_number: 'VN200',
				airline: {
					id: 1,
					name: 'Vietnam Airlines',
					code: 'VN',
					logo_url: 'https://example.com/vn-logo.png',
				},
				departure: {
					airport: {
						id: 1,
						code: 'SGN',
						name: 'Tan Son Nhat International Airport',
						city: 'Ho Chi Minh City',
					},
					time: '2024-02-15T08:00:00.000Z',
				},
				arrival: {
					airport: {
						id: 2,
						code: 'HAN',
						name: 'Noi Bai International Airport',
						city: 'Hanoi',
					},
					time: '2024-02-15T10:00:00.000Z',
				},
				duration: '02:00',
				status: 'scheduled',
				available_seats: 15,
				starting_price: 450000,
				recommendation_score: 85.5,
				recommendation_reasons: [
					'Matches your preferred airline',
					'Great price',
					'Good seat availability',
				],
			},
			{
				flight_id: 2,
				flight_number: 'VJ300',
				airline: {
					id: 2,
					name: 'VietJet Air',
					code: 'VJ',
					logo_url: 'https://example.com/vj-logo.png',
				},
				departure: {
					airport: {
						id: 1,
						code: 'SGN',
						name: 'Tan Son Nhat International Airport',
						city: 'Ho Chi Minh City',
					},
					time: '2024-02-15T14:00:00.000Z',
				},
				arrival: {
					airport: {
						id: 2,
						code: 'HAN',
						name: 'Noi Bai International Airport',
						city: 'Hanoi',
					},
					time: '2024-02-15T16:00:00.000Z',
				},
				duration: '02:00',
				status: 'scheduled',
				available_seats: 8,
				starting_price: 380000,
				recommendation_score: 78.0,
				recommendation_reasons: [
					'Matches your preferred departure time',
					"Popular route you've booked before",
				],
			},
		],
	},

	// Sample test scenarios
	testScenarios: {
		scenario_1: {
			description: 'New user with no search history',
			user_id: 999,
			search_params: {
				departure_airport_code: 'SGN',
				arrival_airport_code: 'HAN',
				departure_date: '2024-03-01',
				passengers: 1,
				class_code: 'ECONOMY',
			},
			expected_behavior:
				'Should return general recommendations based on popular routes and competitive pricing',
		},
		scenario_2: {
			description: 'Frequent business traveler',
			user_id: 2,
			search_params: {
				departure_airport_code: 'SGN',
				arrival_airport_code: 'HAN',
				departure_date: '2024-03-01',
				passengers: 1,
				class_code: 'BUSINESS',
			},
			expected_behavior:
				'Should prioritize business class flights and preferred airlines',
		},
		scenario_3: {
			description: 'Family traveler',
			user_id: 3,
			search_params: {
				departure_airport_code: 'SGN',
				arrival_airport_code: 'DAD',
				departure_date: '2024-03-01',
				passengers: 3,
				class_code: 'ECONOMY',
			},
			expected_behavior:
				'Should consider family-friendly options and group discounts',
		},
	},
};

module.exports = aiSeedData;
