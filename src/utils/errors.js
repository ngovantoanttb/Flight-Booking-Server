/**
 * Custom Error Classes
 * Provides specific error types for better error handling
 */

class AppError extends Error {
	constructor(message, statusCode, isOperational = true) {
		super(message);
		this.statusCode = statusCode;
		this.isOperational = isOperational;
		this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

		Error.captureStackTrace(this, this.constructor);
	}
}

class ValidationError extends AppError {
	constructor(message, errors = []) {
		super(message, 422);
		this.errors = errors;
	}
}

class NotFoundError extends AppError {
	constructor(message = 'Resource not found') {
		super(message, 404);
	}
}

class UnauthorizedError extends AppError {
	constructor(message = 'Unauthorized access') {
		super(message, 401);
	}
}

class ForbiddenError extends AppError {
	constructor(message = 'Forbidden access') {
		super(message, 403);
	}
}

class ConflictError extends AppError {
	constructor(message = 'Resource conflict') {
		super(message, 409);
	}
}

class BadRequestError extends AppError {
	constructor(message = 'Bad request') {
		super(message, 400);
	}
}

class DatabaseError extends AppError {
	constructor(message = 'Database operation failed') {
		super(message, 500);
	}
}

class ExternalServiceError extends AppError {
	constructor(message = 'External service error') {
		super(message, 502);
	}
}

class PaymentError extends AppError {
	constructor(message = 'Payment processing failed') {
		super(message, 400);
	}
}

class ServiceUnavailableError extends AppError {
	constructor(message = 'Service temporarily unavailable') {
		super(message, 503);
	}
}

// Error handling utility functions
const handleValidationError = (error) => {
	const errors = Object.values(error.errors).map((err) => ({
		field: err.path,
		message: err.message,
	}));
	return new ValidationError('Validation failed', errors);
};

const handleDuplicateKeyError = (error) => {
	const field = Object.keys(error.keyValue)[0];
	const message = `${field} already exists`;
	return new ConflictError(message);
};

const handleCastError = (error) => {
	const message = `Invalid ${error.path}: ${error.value}`;
	return new BadRequestError(message);
};

const handleJWTError = () => {
	return new UnauthorizedError('Invalid token');
};

const handleJWTExpiredError = () => {
	return new UnauthorizedError('Token expired');
};

module.exports = {
	AppError,
	ValidationError,
	NotFoundError,
	UnauthorizedError,
	ForbiddenError,
	ConflictError,
	BadRequestError,
	DatabaseError,
	ExternalServiceError,
	PaymentError,
	ServiceUnavailableError,
	handleValidationError,
	handleDuplicateKeyError,
	handleCastError,
	handleJWTError,
	handleJWTExpiredError,
};
