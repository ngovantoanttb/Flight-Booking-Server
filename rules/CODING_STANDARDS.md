# Coding Standards & API Guidelines

## 📋 Tổng quan

Tài liệu này định nghĩa các chuẩn code và quy tắc API cho dự án Flight Booking System.

## 🏗️ Kiến trúc tổng thể

```
src/
├── config/          # Cấu hình ứng dụng
├── controllers/     # Xử lý HTTP requests
├── middleware/      # Middleware functions
├── models/          # Database models (Sequelize)
├── routes/          # API route definitions
├── services/        # Business logic layer
├── utils/           # Utility functions
└── server.js        # Application entry point
```

## 🔄 Luồng xử lý request

```
Request → Route → Middleware → Controller → Service → Model → Database
                ↓
Response ← Controller ← Service ← Model ← Database
```

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "meta": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "meta": {
    "errors": [
      {
        "field": "field_name",
        "message": "Error message"
      }
    ]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [ ... ],
  "meta": {
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 100,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🚦 HTTP Status Codes

### Success Codes
- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `202 Accepted` - Request accepted for processing
- `204 No Content` - Request successful, no content returned

### Client Error Codes
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict
- `422 Unprocessable Entity` - Validation errors
- `429 Too Many Requests` - Rate limit exceeded

### Server Error Codes
- `500 Internal Server Error` - Server error
- `502 Bad Gateway` - External service error
- `503 Service Unavailable` - Service temporarily unavailable

## 🎯 Controller Standards

### Cấu trúc Controller
```javascript
class ExampleController {
  async methodName(req, res, next) {
    try {
      // 1. Validate input
      // 2. Call service
      // 3. Return response
    } catch (error) {
      next(error);
    }
  }
}
```

### Quy tắc Controller
1. **Chỉ xử lý HTTP logic** - Không chứa business logic
2. **Validate input** - Sử dụng express-validator
3. **Call service methods** - Delegate business logic to services
4. **Use response helpers** - Sử dụng các helper functions
5. **Handle errors** - Pass errors to error middleware

### Ví dụ Controller
```javascript
async getFlightDetails(req, res, next) {
  try {
    const { flightId } = req.params;

    if (!flightId || isNaN(parseInt(flightId))) {
      return sendError(res, 'Invalid flight ID');
    }

    const flightDetails = await flightService.getFlightDetails(parseInt(flightId));

    return sendSuccess(res, 'Flight details retrieved successfully', flightDetails);
  } catch (error) {
    next(error);
  }
}
```

## 🔧 Service Standards

### Cấu trúc Service
```javascript
class ExampleService extends BaseService {
  constructor() {
    super(Model);
  }

  async customMethod(params) {
    try {
      // Business logic here
      return result;
    } catch (error) {
      throw error;
    }
  }
}
```

### Quy tắc Service
1. **Extend BaseService** - Sử dụng base service cho CRUD operations
2. **Business logic only** - Không chứa HTTP logic
3. **Throw custom errors** - Sử dụng custom error classes
4. **Log operations** - Log important operations
5. **Return formatted data** - Return data in consistent format

### Ví dụ Service
```javascript
async searchAvailableFlights(searchParams) {
  try {
    const { departure_airport_code, arrival_airport_code, departure_date } = searchParams;

    if (!departure_airport_code || !arrival_airport_code || !departure_date) {
      throw new BadRequestError('Missing required search parameters');
    }

    // Business logic here
    const flights = await this.findFlights(conditions);

    return this.formatFlightResults(flights);
  } catch (error) {
    logger.error('Error searching flights:', error);
    throw error;
  }
}
```

## 🛣️ Route Standards

### Cấu trúc Route
```javascript
const router = express.Router();

// Public routes
router.get('/public', validation, controller.method);

// Protected routes
router.use(protect);
router.get('/protected', controller.method);

// Admin routes
router.use(authorize('admin'));
router.get('/admin', controller.method);
```

### Quy tắc Route
1. **Group by access level** - Public, Protected, Admin
2. **Use validation middleware** - Validate all inputs
3. **Apply appropriate middleware** - Auth, authorization
4. **RESTful naming** - Use standard HTTP verbs
5. **Consistent URL structure** - Use kebab-case

### Ví dụ Route
```javascript
// Validation rules
const searchValidation = [
  query('departure_airport_code')
    .notEmpty()
    .withMessage('Departure airport code is required')
    .isLength({ min: 3, max: 3 })
    .withMessage('Airport code must be 3 characters'),
];

// Route definition
router.get('/search', searchValidation, validate, flightController.searchFlights);
```

## 🗃️ Model Standards

### Cấu trúc Model
```javascript
const Model = sequelize.define('Model', {
  field_name: {
    type: DataTypes.TYPE,
    allowNull: false,
    // other options
  }
}, {
  tableName: 'table_name',
  timestamps: false,
});
```

### Quy tắc Model
1. **Use PascalCase** - Model names in PascalCase
2. **Use snake_case** - Database field names
3. **Define associations** - In models/index.js
4. **Add indexes** - For performance
5. **Use proper data types** - Match database schema

## 🔒 Authentication & Authorization

### Middleware Usage
```javascript
// Protect route (require authentication)
router.use(protect);

// Authorize specific roles
router.use(authorize('admin'));

// Multiple roles
router.use(authorize('admin', 'moderator'));
```

### JWT Token
- **Header**: `Authorization: Bearer <token>`
- **Expiration**: 24 hours
- **Refresh**: Implement refresh token if needed

## 📝 Validation Standards

### Input Validation
```javascript
const validation = [
  body('field_name')
    .notEmpty()
    .withMessage('Field is required')
    .isEmail()
    .withMessage('Invalid email format'),
];
```

### Validation Rules
1. **Validate all inputs** - Use express-validator
2. **Custom error messages** - Provide clear error messages
3. **Sanitize data** - Clean input data
4. **Check data types** - Ensure correct data types
5. **Business rule validation** - In service layer

## 🚨 Error Handling

### Custom Error Classes
```javascript
throw new NotFoundError('Flight not found');
throw new ValidationError('Invalid input', errors);
throw new UnauthorizedError('Access denied');
```

### Error Middleware
- **Global error handler** - Catches all errors
- **Log errors** - Log all errors with context
- **Return consistent format** - Standard error response
- **Hide sensitive info** - In production

## 📊 Logging Standards

### Log Levels
- **error** - Error conditions
- **warn** - Warning conditions
- **info** - Informational messages
- **debug** - Debug-level messages

### Log Format
```javascript
logger.info('Operation completed', {
  userId: user.id,
  operation: 'create_booking'
});
```

## 🧪 Testing Standards

### Test Structure
```javascript
describe('Flight Service', () => {
  describe('searchAvailableFlights', () => {
    it('should return flights for valid search', async () => {
      // Test implementation
    });
  });
});
```

### Test Rules
1. **Unit tests** - Test individual functions
2. **Integration tests** - Test API endpoints
3. **Mock external services** - Don't call real APIs
4. **Test error cases** - Test failure scenarios
5. **Maintain test coverage** - Aim for 80%+ coverage

## 📚 Documentation Standards

### API Documentation
- **Use OpenAPI/Swagger** - Document all endpoints
- **Include examples** - Request/response examples
- **Document errors** - List possible error responses
- **Version APIs** - Use versioning strategy

### Code Documentation
```javascript
/**
 * Search for available flights
 * @param {Object} searchParams - Search parameters
 * @param {string} searchParams.departure_airport_code - Departure airport code
 * @param {string} searchParams.arrival_airport_code - Arrival airport code
 * @param {string} searchParams.departure_date - Departure date (YYYY-MM-DD)
 * @returns {Promise<Object>} Available flights with pagination
 */
async searchAvailableFlights(searchParams) {
  // Implementation
}
```

## 🔄 Git Workflow

### Commit Messages
```
feat: add flight search functionality
fix: resolve booking validation error
docs: update API documentation
style: format code according to standards
refactor: improve error handling
test: add unit tests for flight service
```

### Branch Naming
- `feature/flight-search`
- `bugfix/booking-validation`
- `hotfix/security-patch`

## 📋 Checklist

### Before Committing
- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] No console.log statements
- [ ] Error handling implemented
- [ ] Input validation added
- [ ] Documentation updated
- [ ] No sensitive data exposed

### Before Deployment
- [ ] All tests pass
- [ ] Code review completed
- [ ] Security scan passed
- [ ] Performance tested
- [ ] Documentation updated
- [ ] Environment variables set
- [ ] Database migrations ready
