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
	constructor(message = 'Không tìm thấy tài nguyên') {
		super(message, 404);
	}
}

class UnauthorizedError extends AppError {
	constructor(message = 'Không có quyền truy cập') {
		super(message, 401);
	}
}

class ForbiddenError extends AppError {
	constructor(message = 'Truy cập bị cấm') {
		super(message, 403);
	}
}

class ConflictError extends AppError {
	constructor(message = 'Xung đột tài nguyên') {
		super(message, 409);
	}
}

class BadRequestError extends AppError {
	constructor(message = 'Yêu cầu không hợp lệ') {
		super(message, 400);
	}
}

class DatabaseError extends AppError {
	constructor(message = 'Thao tác cơ sở dữ liệu thất bại') {
		super(message, 500);
	}
}

class ExternalServiceError extends AppError {
	constructor(message = 'Lỗi dịch vụ bên ngoài') {
		super(message, 502);
	}
}

class PaymentError extends AppError {
	constructor(message = 'Xử lý thanh toán thất bại') {
		super(message, 400);
	}
}

class ServiceUnavailableError extends AppError {
	constructor(message = 'Dịch vụ tạm thời không khả dụng') {
		super(message, 503);
	}
}

// Error handling utility functions
const handleValidationError = (error) => {
	const errors = Object.values(error.errors).map((err) => ({
		field: err.path,
		message: err.message,
	}));
	return new ValidationError('Xác thực thất bại', errors);
};

const handleDuplicateKeyError = (error) => {
	const field = Object.keys(error.keyValue)[0];
	const message = `${field} đã tồn tại`;
	return new ConflictError(message);
};

const handleCastError = (error) => {
	const message = `${error.path} không hợp lệ: ${error.value}`;
	return new BadRequestError(message);
};

const handleJWTError = () => {
	return new UnauthorizedError('Token không hợp lệ');
};

const handleJWTExpiredError = () => {
	return new UnauthorizedError('Token đã hết hạn');
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
