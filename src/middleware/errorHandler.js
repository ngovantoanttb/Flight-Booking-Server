const { StatusCodes } = require('../utils/response');
const {
	AppError,
	handleValidationError,
	handleDuplicateKeyError,
	handleCastError,
	handleJWTError,
	handleJWTExpiredError,
} = require('../utils/errors');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
	let error = { ...err };
	error.message = err.message;

	// Log error
	logger.error('Error:', {
		message: err.message,
		stack: err.stack,
		url: req.originalUrl,
		method: req.method,
		ip: req.ip,
		userAgent: req.get('User-Agent'),
	});

	// Mongoose bad ObjectId
	if (err.name === 'CastError') {
		error = handleCastError(err);
	}

	// Mongoose duplicate key
	if (err.code === 11000) {
		error = handleDuplicateKeyError(err);
	}

	// Mongoose validation error
	if (err.name === 'ValidationError') {
		error = handleValidationError(err);
	}

	// JWT errors
	if (err.name === 'JsonWebTokenError') {
		error = handleJWTError();
	}

	if (err.name === 'TokenExpiredError') {
		error = handleJWTExpiredError();
	}

	// Sequelize validation error
	if (err.name === 'SequelizeValidationError') {
		const errors = err.errors.map((e) => ({
			field: e.path,
			message: e.message,
		}));
		error = new AppError('Validation failed', 422);
		error.errors = errors;
	}

	// Sequelize unique constraint error
	if (err.name === 'SequelizeUniqueConstraintError') {
		const field = err.errors[0].path;
		error = new AppError(`${field} already exists`, 409);
	}

	// Sequelize foreign key constraint error
	if (err.name === 'SequelizeForeignKeyConstraintError') {
		error = new AppError('Referenced resource not found', 400);
	}

	// Default to 500 server error
	if (!error.statusCode) {
		error.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
		error.message = 'Something went wrong!';
	}

	// Send error response
	const response = {
		success: false,
		message: error.message,
		timestamp: new Date().toISOString(),
		...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
	};

	// Add validation errors if they exist
	if (error.errors) {
		response.meta = { errors: error.errors };
	}

	res.status(error.statusCode).json(response);
};

// Handle unhandled promise rejections
const handleUnhandledRejection = (err) => {
	logger.error('UNHANDLED REJECTION! Shutting down...');
	logger.error(err.name, err.message);
	process.exit(1);
};

// Handle uncaught exceptions
const handleUncaughtException = (err) => {
	logger.error('UNCAUGHT EXCEPTION! Shutting down...');
	logger.error(err.name, err.message);
	process.exit(1);
};

module.exports = {
	errorHandler,
	handleUnhandledRejection,
	handleUncaughtException,
};
