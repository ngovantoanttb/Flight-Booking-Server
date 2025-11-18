const axios = require('axios');
const logger = require('../src/utils/logger');

const API_BASE_URL = 'http://localhost:3000/api';
let adminToken = '';

// Helper function to get token
async function getAdminToken() {
	try {
		const response = await axios.post(`${API_BASE_URL}/auth/login`, {
			email: 'admin@test.com',
			password: 'admin123',
		});
		return response.data.data.accessToken;
	} catch (error) {
		logger.error('Failed to get admin token:', error.message);
		return null;
	}
}

// Test scenarios
const testScenarios = {
	authentication: {
		name: 'Authentication Tests',
		tests: [
			{
				name: 'Admin Login',
				method: 'POST',
				url: '/auth/login',
				data: {
					email: 'admin@test.com',
					password: 'admin123',
				},
				expectedStatus: 200,
				onSuccess: (response) => {
					adminToken = response.data.data.accessToken;
					logger.info('✅ Admin login successful. Token obtained.');
					logger.info(
						'Token (first 20 chars):',
						adminToken
							? adminToken.substring(0, 20) + '...'
							: 'No token'
					);
					logger.info('Token type:', typeof adminToken);
				},
			},
		],
	},
	contactManagement: {
		name: 'Contact Management Tests',
		tests: [
			{
				name: 'Get All Contacts (Admin)',
				method: 'GET',
				url: '/admin/contacts?page=1&limit=10',
				headers: { Authorization: `Bearer ${adminToken}` },
				expectedStatus: 200,
				onError: (error) => {
					logger.error(
						'Contact test error - Token:',
						adminToken
							? adminToken.substring(0, 20) + '...'
							: 'No token'
					);
					logger.error('Error response:', error.response?.data);
				},
			},
			{
				name: 'Get Contact Stats (Admin)',
				method: 'GET',
				url: '/admin/contacts/stats',
				headers: { Authorization: `Bearer ${adminToken}` },
				expectedStatus: 200,
			},
			{
				name: 'Search Contacts (Admin)',
				method: 'GET',
				url: '/admin/contacts/search?query=john&page=1&limit=10',
				headers: { Authorization: `Bearer ${adminToken}` },
				expectedStatus: 200,
			},
		],
	},
	servicePackageManagement: {
		name: 'Service Package Management Tests',
		tests: [
			{
				name: 'Get All Service Packages (Admin)',
				method: 'GET',
				url: '/admin/service-packages?page=1&limit=10',
				headers: { Authorization: `Bearer ${adminToken}` },
				expectedStatus: 200,
			},
			{
				name: 'Get Airline Service Packages (Public)',
				method: 'GET',
				url: '/service-packages/airline/1',
				expectedStatus: 200,
			},
			{
				name: 'Get Pricing Summary (Public)',
				method: 'GET',
				url: '/service-packages/airline/1/pricing-summary?basePrice=1000000',
				expectedStatus: 200,
			},
			{
				name: 'Create Default Packages (Admin)',
				method: 'POST',
				url: '/admin/service-packages/airline/1/create-defaults',
				headers: { Authorization: `Bearer ${adminToken}` },
				expectedStatus: 201,
			},
		],
	},
	enhancedFlightManagement: {
		name: 'Enhanced Flight Management Tests',
		tests: [
			{
				name: 'Get All Flights with Enhanced Info (Admin)',
				method: 'GET',
				url: '/admin/flights?page=1&limit=10',
				headers: { Authorization: `Bearer ${adminToken}` },
				expectedStatus: 200,
			},
			{
				name: 'Filter Flights by Status (Admin)',
				method: 'GET',
				url: '/admin/flights?status=scheduled&page=1&limit=10',
				headers: { Authorization: `Bearer ${adminToken}` },
				expectedStatus: 200,
			},
			{
				name: 'Filter Flights by Airline (Admin)',
				method: 'GET',
				url: '/admin/flights?airline_id=1&page=1&limit=10',
				headers: { Authorization: `Bearer ${adminToken}` },
				expectedStatus: 200,
			},
		],
	},
	passengerValidation: {
		name: 'Passenger Validation Tests',
		tests: [
			{
				name: 'Valid Passengers (1 adult + 1 child)',
				method: 'POST',
				url: '/bookings',
				headers: { Authorization: `Bearer ${adminToken}` },
				data: {
					flight_id: 1,
					contact_info: {
						email: 'test@example.com',
						phone: '0123456789',
					},
					passengers: [
						{
							first_name: 'John',
							last_name: 'Doe',
							title: 'Mr',
							gender: 'male',
							date_of_birth: '1990-01-01',
							passenger_type: 'adult',
							citizen_id: '123456789012',
							travel_class: 'Y',
						},
						{
							first_name: 'Jane',
							last_name: 'Doe',
							title: 'Mrs',
							gender: 'female',
							date_of_birth: '2015-06-15',
							passenger_type: 'child',
							travel_class: 'Y',
						},
					],
				},
				expectedStatus: 201,
				shouldFail: false,
			},
			{
				name: 'Invalid: No Adults',
				method: 'POST',
				url: '/bookings',
				headers: { Authorization: `Bearer ${adminToken}` },
				data: {
					flight_id: 1,
					contact_info: {
						email: 'test@example.com',
						phone: '0123456789',
					},
					passengers: [
						{
							first_name: 'Child',
							last_name: 'One',
							gender: 'male',
							date_of_birth: '2015-06-15',
							passenger_type: 'child',
							travel_class: 'Y',
						},
					],
				},
				expectedStatus: 400,
				shouldFail: true,
			},
			{
				name: 'Invalid: Too Many Children (1 adult + 7 children)',
				method: 'POST',
				url: '/bookings',
				headers: { Authorization: `Bearer ${adminToken}` },
				data: {
					flight_id: 1,
					contact_info: {
						email: 'test@example.com',
						phone: '0123456789',
					},
					passengers: [
						{
							first_name: 'Adult',
							last_name: 'One',
							gender: 'male',
							date_of_birth: '1990-01-01',
							passenger_type: 'adult',
							travel_class: 'Y',
						},
						...Array.from({ length: 7 }, (_, i) => ({
							first_name: `Child${i + 1}`,
							last_name: 'Test',
							gender: i % 2 === 0 ? 'male' : 'female',
							date_of_birth: `${2015 + i}-06-15`,
							passenger_type: 'child',
							travel_class: 'Y',
						})),
					],
				},
				expectedStatus: 400,
				shouldFail: true,
			},
			{
				name: 'Invalid: Too Many Infants (1 adult + 2 infants)',
				method: 'POST',
				url: '/bookings',
				headers: { Authorization: `Bearer ${adminToken}` },
				data: {
					flight_id: 1,
					contact_info: {
						email: 'test@example.com',
						phone: '0123456789',
					},
					passengers: [
						{
							first_name: 'Adult',
							last_name: 'One',
							gender: 'male',
							date_of_birth: '1990-01-01',
							passenger_type: 'adult',
							travel_class: 'Y',
						},
						{
							first_name: 'Infant',
							last_name: 'One',
							gender: 'male',
							date_of_birth: '2023-06-15',
							passenger_type: 'infant',
							travel_class: 'Y',
						},
						{
							first_name: 'Infant',
							last_name: 'Two',
							gender: 'female',
							date_of_birth: '2023-08-20',
							passenger_type: 'infant',
							travel_class: 'Y',
						},
					],
				},
				expectedStatus: 400,
				shouldFail: true,
			},
		],
	},
	userContactManagement: {
		name: 'User Contact Management Tests',
		tests: [
			{
				name: 'Get User Contacts',
				method: 'GET',
				url: '/contacts?page=1&limit=10',
				headers: { Authorization: `Bearer ${adminToken}` },
				expectedStatus: 200,
			},
			{
				name: 'Create User Contact',
				method: 'POST',
				url: '/contacts',
				headers: { Authorization: `Bearer ${adminToken}` },
				data: {
					first_name: 'Test',
					middle_name: 'User',
					last_name: 'Contact',
					phone: '0123456789',
					email: 'test.contact@example.com',
					citizen_id: '987654321098',
					is_primary: true,
				},
				expectedStatus: 201,
			},
		],
	},
};

async function runTest(test) {
	try {
		const config = {
			method: test.method,
			url: `${API_BASE_URL}${test.url}`,
			headers: {
				'Content-Type': 'application/json',
				...test.headers,
			},
		};

		if (test.data) {
			config.data = test.data;
		}

		const response = await axios(config);

		if (test.onSuccess) {
			test.onSuccess(response);
		}

		if (response.status === test.expectedStatus) {
			logger.info(`✅ ${test.name}: PASSED (Status: ${response.status})`);
			return { success: true, response };
		} else {
			logger.error(
				`❌ ${test.name}: FAILED - Expected status ${test.expectedStatus}, got ${response.status}`
			);
			return { success: false, response };
		}
	} catch (error) {
		if (test.shouldFail && error.response?.status === test.expectedStatus) {
			logger.info(
				`✅ ${test.name}: PASSED (Expected failure with status: ${error.response.status})`
			);
			return { success: true, response: error.response };
		} else {
			logger.error(
				`❌ ${test.name}: FAILED - ${
					error.response?.data?.message || error.message
				}`
			);
			return { success: false, error };
		}
	}
}

async function runTestSuite(suiteName, suite) {
	logger.info(`\n🧪 Running ${suite.name}...`);
	logger.info('='.repeat(50));

	const results = [];

	for (const test of suite.tests) {
		const result = await runTest(test);
		results.push({ test: test.name, ...result });

		// Small delay between tests
		await new Promise((resolve) => setTimeout(resolve, 500));
	}

	const passed = results.filter((r) => r.success).length;
	const total = results.length;

	logger.info(`\n📊 ${suite.name} Results: ${passed}/${total} tests passed`);

	return results;
}

async function runAllTests() {
	logger.info('🚀 Starting New Features API Tests');
	logger.info('='.repeat(60));

	const allResults = {};

	// Run tests in order (authentication first)
	for (const [suiteName, suite] of Object.entries(testScenarios)) {
		allResults[suiteName] = await runTestSuite(suiteName, suite);
	}

	// Summary
	logger.info('\n🎯 FINAL SUMMARY');
	logger.info('='.repeat(60));

	let totalPassed = 0;
	let totalTests = 0;

	for (const [suiteName, results] of Object.entries(allResults)) {
		const passed = results.filter((r) => r.success).length;
		const total = results.length;
		totalPassed += passed;
		totalTests += total;

		logger.info(`${suiteName}: ${passed}/${total} tests passed`);
	}

	logger.info(`\n🏆 OVERALL: ${totalPassed}/${totalTests} tests passed`);

	if (totalPassed === totalTests) {
		logger.info('🎉 All tests passed! New features are working correctly.');
	} else {
		logger.warn(
			`⚠️  ${
				totalTests - totalPassed
			} tests failed. Please check the logs above.`
		);
	}
}

// Run tests if this script is executed directly
if (require.main === module) {
	runAllTests().catch((error) => {
		logger.error('Test execution failed:', error);
		process.exit(1);
	});
}

module.exports = {
	runAllTests,
	runTestSuite,
	runTest,
	testScenarios,
};
