/**
 * Standard Response Helper
 * Provides consistent response format across the API
 */

class ApiResponse {
	constructor(success, message, data = null, meta = null) {
		this.success = success;
		this.message = message;
		this.data = data;
		this.meta = meta;
		this.timestamp = new Date().toISOString();
	}

	// Success responses
	static success(message, data = null, meta = null) {
		return new ApiResponse(true, message, data, meta);
	}

	static created(message, data = null) {
		return new ApiResponse(true, message, data);
	}

	static paginated(message, data, pagination) {
		return new ApiResponse(true, message, data, { pagination });
	}

	// Error responses
	static error(message, errors = null) {
		return new ApiResponse(false, message, null, { errors });
	}

	static validationError(message, errors) {
		return new ApiResponse(false, message, null, { errors });
	}

	static notFound(message = 'Không tìm thấy tài nguyên') {
		return new ApiResponse(false, message);
	}

	static unauthorized(message = 'Không có quyền truy cập') {
		return new ApiResponse(false, message);
	}

	static forbidden(message = 'Truy cập bị cấm') {
		return new ApiResponse(false, message);
	}

	static conflict(message = 'Xung đột tài nguyên') {
		return new ApiResponse(false, message);
	}

	static serverError(message = 'Lỗi máy chủ nội bộ') {
		return new ApiResponse(false, message);
	}
}

// HTTP Status Codes
const StatusCodes = {
	// Success
	OK: 200,
	CREATED: 201,
	ACCEPTED: 202,
	NO_CONTENT: 204,

	// Client Error
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	METHOD_NOT_ALLOWED: 405,
	CONFLICT: 409,
	UNPROCESSABLE_ENTITY: 422,
	TOO_MANY_REQUESTS: 429,

	// Server Error
	INTERNAL_SERVER_ERROR: 500,
	BAD_GATEWAY: 502,
	SERVICE_UNAVAILABLE: 503,
	GATEWAY_TIMEOUT: 504,
};

// Response helper functions
const sendResponse = (res, statusCode, response) => {
	return res.status(statusCode).json(response);
};

const sendSuccess = (
	res,
	message,
	data = null,
	meta = null,
	statusCode = StatusCodes.OK
) => {
	const response = ApiResponse.success(message, data, meta);
	return sendResponse(res, statusCode, response);
};

const sendCreated = (res, message, data = null) => {
	const response = ApiResponse.created(message, data);
	return sendResponse(res, StatusCodes.CREATED, response);
};

const sendPaginated = (res, message, data, pagination) => {
	const response = ApiResponse.paginated(message, data, pagination);
	return sendResponse(res, StatusCodes.OK, response);
};

const sendError = (
	res,
	message,
	errors = null,
	statusCode = StatusCodes.BAD_REQUEST
) => {
	const response = ApiResponse.error(message, errors);
	return sendResponse(res, statusCode, response);
};

const sendValidationError = (res, message, errors) => {
	const response = ApiResponse.validationError(message, errors);
	return sendResponse(res, StatusCodes.UNPROCESSABLE_ENTITY, response);
};

const sendNotFound = (res, message = 'Không tìm thấy tài nguyên') => {
	const response = ApiResponse.notFound(message);
	return sendResponse(res, StatusCodes.NOT_FOUND, response);
};

const sendUnauthorized = (res, message = 'Không có quyền truy cập') => {
	const response = ApiResponse.unauthorized(message);
	return sendResponse(res, StatusCodes.UNAUTHORIZED, response);
};

const sendForbidden = (res, message = 'Truy cập bị cấm') => {
	const response = ApiResponse.forbidden(message);
	return sendResponse(res, StatusCodes.FORBIDDEN, response);
};

const sendConflict = (res, message = 'Xung đột tài nguyên') => {
	const response = ApiResponse.conflict(message);
	return sendResponse(res, StatusCodes.CONFLICT, response);
};

const sendServerError = (res, message = 'Lỗi máy chủ nội bộ') => {
	const response = ApiResponse.serverError(message);
	return sendResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, response);
};

module.exports = {
	ApiResponse,
	StatusCodes,
	sendResponse,
	sendSuccess,
	sendCreated,
	sendPaginated,
	sendError,
	sendValidationError,
	sendNotFound,
	sendUnauthorized,
	sendForbidden,
	sendConflict,
	sendServerError,
};
