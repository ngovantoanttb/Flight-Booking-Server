const config = {
	// ZaloPay Sandbox Configuration
	app_id: process.env.ZALOPAY_APP_ID || '553',
	key1: process.env.ZALOPAY_KEY1 || '9phuAOYhan4urywHTh0ndEXiV3pKHr5Q',
	key2: process.env.ZALOPAY_KEY2 || 'Iyz2habzyr7AG8SgvoBCbKwKi3UzlLi3',

	// API Endpoints
	endpoints: {
		create:
			process.env.ZALOPAY_CREATE_URL ||
			'https://sb-openapi.zalopay.vn/v2/create',
		query:
			process.env.ZALOPAY_QUERY_URL ||
			'https://sb-openapi.zalopay.vn/v2/query',
		refund:
			process.env.ZALOPAY_REFUND_URL ||
			'https://sb-openapi.zalopay.vn/v2/refund',
	},

	// Callback URLs
	callback_url:
		process.env.ZALOPAY_CALLBACK_URL ||
		'http://localhost:3000/api/payments/zalopay/callback',
	redirect_url:
		process.env.ZALOPAY_REDIRECT_URL ||
		'http://localhost:3000/payment/success',

	// Test STK for sandbox
	test_stk: '4111 1111 1111 1111',
};

module.exports = config;
