<!-- @format -->

# AI Chat API Testing with Postman

## Overview

This Postman collection provides comprehensive testing for the AI Chat functionality using Google Gemini AI. The collection includes various scenarios for testing chat interactions, travel recommendations, and error handling.

## Setup Instructions

### 1. Import Collection and Environment

1. Open Postman
2. Click **Import** button
3. Import the following files:
   - `AI_Chat_Collection.json`
   - `AI_Chat_Environment.json`

### 2. Configure Environment

1. Select the "AI Chat Environment" from the environment dropdown
2. Verify the following variables are set:
   - `base_url`: `http://localhost:3000` (or your server URL)
   - `user_email`: Your test user email
   - `user_password`: Your test user password
   - `gemini_api_key`: Your Gemini API key

### 3. Start the Server

Make sure your flight booking server is running:

```bash
node src/server.js
```

## Collection Structure

### 1. Authentication

- **Login**: Authenticates user and stores JWT token automatically

### 2. AI Chat

- **Test AI Connection**: Verifies Gemini AI connectivity
- **Basic Chat**: Simple chat interaction with AI
- **Travel Recommendations**: Get AI-powered travel suggestions
- **Flight Search Assistance**: AI help with flight search
- **Travel Advice**: Get advice on specific travel topics

### 3. Advanced Chat Scenarios

- **Multi-turn Conversation**: Contextual chat with conversation history
- **Business Travel Planning**: Specialized business travel assistance
- **Family Travel with Kids**: Family-friendly travel recommendations

### 4. Error Handling

- **Invalid Message (Empty)**: Tests empty message validation
- **Invalid Message (Too Long)**: Tests message length validation
- **Unauthorized Request**: Tests authentication requirements

## API Endpoints

### Base URL

```
{{base_url}}/api/ai
```

### Available Endpoints

#### 1. Test Connection

```
GET /test-connection
```

Tests Gemini AI connectivity without sending a message.

#### 2. Basic Chat

```
POST /chat
```

**Body:**

```json
{
  "message": "Your message here",
  "context": {
    "additional_context": "value"
  }
}
```

#### 3. Travel Recommendations

```
POST /travel-recommendations
```

**Body:**

```json
{
  "budget": "medium",
  "duration": "7 days",
  "interests": ["culture", "food", "nature"],
  "season": "spring",
  "group_size": 2
}
```

#### 4. Flight Search Assistance

```
POST /flight-search-assistance
```

**Body:**

```json
{
  "departure_airport": "SGN",
  "arrival_airport": "NRT",
  "departure_date": "2024-12-01",
  "return_date": "2024-12-08",
  "passengers": 2,
  "class": "economy"
}
```

#### 5. Travel Advice

```
POST /travel-advice
```

**Body:**

```json
{
  "topic": "What should I pack for a winter trip to Europe?"
}
```

## Response Format

All successful responses follow this format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "ai_response": "AI generated response",
    "timestamp": "2024-09-20T12:00:00.000Z",
    "model": "gemini-pro",
    "context_used": true
  },
  "timestamp": "2024-09-20T12:00:00.000Z"
}
```

## Testing Scenarios

### 1. Basic Functionality

1. Run **Login** to authenticate
2. Run **Test AI Connection** to verify Gemini connectivity
3. Run **Basic Chat** to test simple interaction

### 2. Travel Planning

1. Run **Travel Recommendations** with different preferences
2. Run **Flight Search Assistance** with various search parameters
3. Run **Travel Advice** with different topics

### 3. Advanced Features

1. Run **Multi-turn Conversation** to test context retention
2. Run **Business Travel Planning** for specialized assistance
3. Run **Family Travel with Kids** for family-specific recommendations

### 4. Error Handling

1. Run **Invalid Message (Empty)** to test validation
2. Run **Invalid Message (Too Long)** to test length limits
3. Run **Unauthorized Request** to test authentication

## Test Automation

The collection includes automated tests for:

- Response status codes
- Response format validation
- Response time limits
- Data type validation
- Error message clarity

## Troubleshooting

### Common Issues

#### 1. Authentication Errors

- Ensure the server is running
- Check if the user credentials are correct
- Verify the JWT token is being stored properly

#### 2. AI Connection Errors

- Verify the Gemini API key is correct
- Check if the API key has proper permissions
- Ensure internet connectivity

#### 3. Response Time Issues

- Gemini AI responses may take 2-5 seconds
- Check server logs for any errors
- Verify database connectivity

### Debug Information

- Check the **Console** tab in Postman for detailed logs
- Review server logs in `logs/combined.log`
- Use the **Test Results** tab to see detailed test outcomes

## Environment Variables

| Variable         | Description          | Example                                   |
| ---------------- | -------------------- | ----------------------------------------- |
| `base_url`       | Server base URL      | `http://localhost:3000`                   |
| `user_email`     | Test user email      | `contactworks.dev@gmail.com`              |
| `user_password`  | Test user password   | `contactworks.dev@gmail.com`              |
| `auth_token`     | JWT token (auto-set) | `eyJhbGciOiJIUzI1NiIs...`                 |
| `user_id`        | User ID (auto-set)   | `2`                                       |
| `gemini_api_key` | Gemini API key       | `AIzaSyAi0Mi5xdB02coXXRd6rsKjhzS9AqZVLD0` |

## Best Practices

1. **Always run Login first** to get a valid token
2. **Test connection** before running chat scenarios
3. **Use realistic data** in your test requests
4. **Check response times** - AI responses may be slower
5. **Review error messages** for debugging
6. **Clean up test data** if needed

## Support

For issues or questions:

1. Check server logs for detailed error information
2. Verify all environment variables are set correctly
3. Ensure the server is running and accessible
4. Check Gemini API key validity and quotas
