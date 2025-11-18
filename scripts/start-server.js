/**
 * Server Startup Script
 * Handles port conflicts and graceful server startup
 */

const { spawn, exec } = require('child_process');

// Function to kill processes on port 3000
const killPortProcesses = () => {
	return new Promise((resolve, reject) => {
		exec('netstat -ano | findstr :3000', (error, stdout) => {
			if (error) {
				console.log('No processes found on port 3000');
				resolve();
				return;
			}

			const lines = stdout.trim().split('\n');
			const pids = new Set();

			lines.forEach((line) => {
				const parts = line.trim().split(/\s+/);
				if (parts.length >= 5 && parts[1].includes(':3000')) {
					pids.add(parts[4]);
				}
			});

			if (pids.size === 0) {
				console.log('No processes to kill on port 3000');
				resolve();
				return;
			}

			console.log(
				`Found ${pids.size} process(es) on port 3000. Killing...`
			);

			const killPromises = Array.from(pids).map((pid) => {
				return new Promise((resolveKill) => {
					exec(`taskkill /F /PID ${pid}`, (killError) => {
						if (killError) {
							console.log(
								`Failed to kill process ${pid}: ${killError.message}`
							);
						} else {
							console.log(`Killed process ${pid}`);
						}
						resolveKill();
					});
				});
			});

			Promise.all(killPromises).then(() => {
				console.log('All processes killed. Waiting 2 seconds...');
				setTimeout(resolve, 2000);
			});
		});
	});
};

// Function to start the server
const startServer = () => {
	console.log('Starting Flight Booking API Server...');

	const server = spawn('node', ['src/server.js'], {
		stdio: 'inherit',
		cwd: process.cwd(),
	});

	server.on('error', (error) => {
		console.error('Failed to start server:', error);
	});

	server.on('close', (code) => {
		console.log(`Server process exited with code ${code}`);
	});

	// Handle graceful shutdown
	process.on('SIGINT', () => {
		console.log('\nShutting down server...');
		server.kill('SIGINT');
		process.exit(0);
	});

	process.on('SIGTERM', () => {
		console.log('\nShutting down server...');
		server.kill('SIGTERM');
		process.exit(0);
	});
};

// Main execution
const main = async () => {
	try {
		console.log('🚀 Flight Booking API Server Startup Script');
		console.log('==========================================');

		await killPortProcesses();
		startServer();
	} catch (error) {
		console.error('Error starting server:', error);
		process.exit(1);
	}
};

main();
