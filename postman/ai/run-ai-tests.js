#!/usr/bin/env node

/**
 * AI API Test Runner
 * Script để chạy automated tests cho AI API
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
	console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkPrerequisites() {
	log('🔍 Checking prerequisites...', 'cyan');

	// Check if Newman is installed
	try {
		execSync('newman --version', { stdio: 'pipe' });
		log('✅ Newman is installed', 'green');
	} catch (error) {
		log('❌ Newman is not installed. Installing...', 'yellow');
		try {
			execSync('npm install -g newman', { stdio: 'inherit' });
			log('✅ Newman installed successfully', 'green');
		} catch (installError) {
			log(
				'❌ Failed to install Newman. Please install manually: npm install -g newman',
				'red'
			);
			process.exit(1);
		}
	}

	// Check if collections exist
	const collectionPath = path.join(__dirname, 'AI_API_Collection.json');
	const environmentPath = path.join(__dirname, 'AI_API_Environment.json');
	const testsPath = path.join(__dirname, 'AI_API_Tests_Collection.json');

	if (!fs.existsSync(collectionPath)) {
		log('❌ AI_API_Collection.json not found', 'red');
		process.exit(1);
	}

	if (!fs.existsSync(environmentPath)) {
		log('❌ AI_API_Environment.json not found', 'red');
		process.exit(1);
	}

	if (!fs.existsSync(testsPath)) {
		log('❌ AI_API_Tests_Collection.json not found', 'red');
		process.exit(1);
	}

	log('✅ All collection files found', 'green');
}

function checkServerStatus() {
	log('🔍 Checking server status...', 'cyan');

	try {
		const response = execSync(
			'curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health',
			{
				encoding: 'utf8',
				timeout: 5000,
			}
		);

		if (response.trim() === '200') {
			log('✅ Server is running on localhost:3000', 'green');
		} else {
			log('❌ Server is not responding correctly', 'red');
			log('Please start the server: npm run dev', 'yellow');
			process.exit(1);
		}
	} catch (error) {
		log('❌ Server is not running on localhost:3000', 'red');
		log('Please start the server: npm run dev', 'yellow');
		process.exit(1);
	}
}

function runCollection(collectionName, description) {
	log(`\n🚀 Running ${description}...`, 'blue');

	const collectionPath = path.join(__dirname, `${collectionName}.json`);
	const environmentPath = path.join(__dirname, 'AI_API_Environment.json');

	try {
		const command = `newman run "${collectionPath}" -e "${environmentPath}" --reporters cli,json --reporter-json-export results/${collectionName}-results.json`;

		execSync(command, {
			stdio: 'inherit',
			cwd: __dirname,
		});

		log(`✅ ${description} completed successfully`, 'green');
		return true;
	} catch (error) {
		log(`❌ ${description} failed`, 'red');
		return false;
	}
}

function createResultsDirectory() {
	const resultsDir = path.join(__dirname, 'results');
	if (!fs.existsSync(resultsDir)) {
		fs.mkdirSync(resultsDir);
		log('📁 Created results directory', 'cyan');
	}
}

function generateTestReport() {
	log('\n📊 Generating test report...', 'cyan');

	const resultsDir = path.join(__dirname, 'results');
	const reportPath = path.join(resultsDir, 'test-report.html');

	const report = `
<!DOCTYPE html>
<html>
<head>
    <title>AI API Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .success { color: green; }
        .failure { color: red; }
        .summary { margin: 20px 0; }
        .test-result { margin: 10px 0; padding: 10px; border-left: 4px solid #ccc; }
        .test-result.success { border-left-color: green; }
        .test-result.failure { border-left-color: red; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🤖 AI API Test Report</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
    </div>

    <div class="summary">
        <h2>Test Summary</h2>
        <p>This report contains the results of automated testing for the AI Recommendation API.</p>
    </div>

    <div class="test-result">
        <h3>Test Collections</h3>
        <ul>
            <li>AI_API_Collection.json - Main API endpoints</li>
            <li>AI_API_Tests_Collection.json - Automated tests</li>
        </ul>
    </div>

    <div class="test-result">
        <h3>Test Results</h3>
        <p>Check the individual JSON result files in the results/ directory for detailed test results.</p>
    </div>
</body>
</html>`;

	fs.writeFileSync(reportPath, report);
	log(`📄 Test report generated: ${reportPath}`, 'green');
}

function main() {
	log('🤖 AI API Test Runner', 'bright');
	log('====================', 'bright');

	try {
		// Check prerequisites
		checkPrerequisites();

		// Check server status
		checkServerStatus();

		// Create results directory
		createResultsDirectory();

		// Run test collections
		const collections = [
			{
				name: 'AI_API_Collection',
				description: 'Main AI API Collection',
			},
			{
				name: 'AI_API_Tests_Collection',
				description: 'AI API Automated Tests',
			},
		];

		let allPassed = true;

		for (const collection of collections) {
			const success = runCollection(
				collection.name,
				collection.description
			);
			if (!success) {
				allPassed = false;
			}
		}

		// Generate test report
		generateTestReport();

		// Final summary
		log('\n📋 Test Summary', 'bright');
		log('================', 'bright');

		if (allPassed) {
			log('🎉 All tests passed successfully!', 'green');
			log('✅ AI API is working correctly', 'green');
		} else {
			log('❌ Some tests failed', 'red');
			log(
				'🔍 Check the detailed results in the results/ directory',
				'yellow'
			);
		}

		log('\n📁 Test results saved in: postman/ai/results/', 'cyan');
		log('📄 HTML report: postman/ai/results/test-report.html', 'cyan');
	} catch (error) {
		log(`❌ Test runner failed: ${error.message}`, 'red');
		process.exit(1);
	}
}

// Run the test runner
if (require.main === module) {
	main();
}

module.exports = { main };
