/**
 * Documentation Routes
 * Serves API documentation and testing interface
 */

const express = require('express');
const path = require('path');
const router = express.Router();

// Serve static files from views directory
router.use(
	'/assets',
	express.static(path.join(__dirname, '../../views/assets'))
);

// Serve main documentation page
router.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '../../views/index.html'));
});

// API status endpoint for documentation
router.get('/status', async (req, res) => {
	try {
		// Check if main API is running
		const fetch = require('node-fetch');
		const response = await fetch('http://localhost:3000/api/health');

		if (response.ok) {
			res.json({
				success: true,
				message: 'API is running',
				timestamp: new Date().toISOString(),
			});
		} else {
			res.json({
				success: false,
				message: 'API is not responding',
				timestamp: new Date().toISOString(),
			});
		}
	} catch (error) {
		res.json({
			success: false,
			message: 'API is offline',
			error: error.message,
			timestamp: new Date().toISOString(),
		});
	}
});

module.exports = router;
