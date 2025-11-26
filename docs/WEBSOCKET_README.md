# WebSocket Implementation - Flight Booking Server

## 🚀 Overview

WebSocket functionality has been successfully implemented in the Flight Booking Server to provide real-time notifications for flight status updates and booking changes.

## 📁 File Structure

```
src/websocket/
├── websocketServer.js          # Main WebSocket server setup
├── websocketHandlers.js        # Message handlers and event processing
├── websocketMiddleware.js      # Authentication and validation middleware
├── websocketUtils.js          # Utility functions and integration helpers
├── flightNotificationService.js # Flight-specific notification service
├── bookingNotificationService.js # Booking-specific notification service
└── integrationExample.js      # Examples for integrating with existing code
```

## 🔧 Features Implemented

### ✅ Core WebSocket Server
- **Authentication**: JWT-based authentication for WebSocket connections
- **Connection Management**: Automatic cleanup of inactive connections
- **Heartbeat**: Ping/pong mechanism to detect broken connections
- **Error Handling**: Comprehensive error handling and logging

### ✅ Real-time Notifications
- **Flight Updates**: Status changes, delays, gate changes, cancellations
- **Booking Updates**: Payment status, check-in completion, seat assignments
- **Subscription Management**: Users can subscribe/unsubscribe to specific flights/bookings

### ✅ Security & Middleware
- **Rate Limiting**: Prevents message spam
- **Message Validation**: Validates message format and size
- **Role-based Access**: Different permissions for different user roles
- **Request Logging**: Comprehensive logging of WebSocket activities

## 🌐 WebSocket Endpoint

```
ws://localhost:3000/ws?token=YOUR_JWT_TOKEN
```

## 📨 Message Types

### Client → Server Messages
```javascript
// Subscribe to flight updates
{
  "type": "subscribe_flight",
  "data": { "flightId": "123" }
}

// Subscribe to booking updates  
{
  "type": "subscribe_booking",
  "data": { "bookingId": "456" }
}

// Get current flight status
{
  "type": "get_flight_status",
  "data": { "flightId": "123" }
}

// Ping server
{
  "type": "ping",
  "data": {}
}
```

### Server → Client Messages
```javascript
// Flight status update
{
  "type": "flight_update",
  "data": {
    "flightId": "123",
    "updateType": "status",
    "updateData": { "newStatus": "delayed" },
    "flightStatus": { /* full flight info */ },
    "message": "Flight ABC123 status updated to: delayed"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}

// Booking update
{
  "type": "booking_update", 
  "data": {
    "bookingId": "456",
    "updateType": "payment",
    "updateData": { "paymentStatus": "completed" },
    "bookingStatus": { /* full booking info */ },
    "message": "Payment for booking BR789 is completed"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🧪 Testing

### WebSocket Test Page
Access the test interface at: `http://localhost:3000/websocket-test`

Features:
- Connect/disconnect WebSocket
- Subscribe to flight/booking updates
- Send custom messages
- View real-time message log
- Test authentication

### Manual Testing Steps
1. Start the server: `npm run dev`
2. Get a JWT token by logging in via API
3. Open `http://localhost:3000/websocket-test`
4. Paste your JWT token and click "Connect"
5. Test various subscription and message features

## 🔗 Integration with Existing Code

### Flight Service Integration
```javascript
const { flightUpdateHooks } = require('./websocket/websocketUtils');

// In your flight update method
async function updateFlight(flightId, updateData) {
  const flight = await Flight.findByPk(flightId);
  const oldStatus = flight.status;
  
  await flight.update(updateData);
  
  // Add WebSocket notification
  if (updateData.status !== oldStatus) {
    await flightUpdateHooks.afterStatusUpdate(flightId, oldStatus, updateData.status);
  }
}
```

### Booking Service Integration
```javascript
const { bookingUpdateHooks } = require('./websocket/websocketUtils');

// In your booking update method
async function updateBooking(bookingId, updateData) {
  const booking = await Booking.findByPk(bookingId);
  const oldPaymentStatus = booking.payment_status;
  
  await booking.update(updateData);
  
  // Add WebSocket notification
  if (updateData.payment_status !== oldPaymentStatus) {
    await bookingUpdateHooks.afterPaymentUpdate(bookingId, updateData.payment_status);
  }
}
```

## 🛡️ Security Considerations

1. **Authentication**: All WebSocket connections require valid JWT tokens
2. **Rate Limiting**: 100 messages per minute per user (configurable)
3. **Message Validation**: All messages are validated for format and size
4. **Access Control**: Users can only access their own bookings (unless admin)
5. **Connection Cleanup**: Inactive connections are automatically cleaned up

## 📊 Monitoring & Logging

All WebSocket activities are logged using Winston logger:
- Connection attempts and results
- Message sending/receiving
- Subscription management
- Error conditions
- Performance metrics

## 🚀 Deployment Notes

1. **Environment Variables**: Ensure `JWT_SECRET` is properly configured
2. **Load Balancing**: Consider sticky sessions for WebSocket connections
3. **Scaling**: For multiple server instances, consider Redis for pub/sub
4. **Monitoring**: Monitor WebSocket connection counts and message rates

## 📈 Performance Optimizations

1. **Connection Pooling**: Efficient management of active connections
2. **Message Batching**: Group related updates when possible
3. **Selective Broadcasting**: Only send updates to subscribed users
4. **Memory Management**: Automatic cleanup of inactive subscriptions
5. **Heartbeat Optimization**: 30-second ping interval for connection health

## 🔮 Future Enhancements

- [ ] Redis integration for multi-server scaling
- [ ] Message persistence for offline users
- [ ] Push notifications integration
- [ ] WebSocket clustering support
- [ ] Advanced analytics and metrics
- [ ] Custom notification preferences per user

## 🐛 Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check if server is running
   - Verify WebSocket endpoint URL
   - Ensure JWT token is valid

2. **Authentication Failed**
   - Check JWT token expiration
   - Verify JWT_SECRET configuration
   - Ensure user account is active

3. **Messages Not Received**
   - Check subscription status
   - Verify user permissions
   - Check server logs for errors

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in your environment.

## 📞 Support

For issues or questions about the WebSocket implementation, check:
1. Server logs in `logs/` directory
2. WebSocket test page for connection debugging
3. Integration examples in `websocket/integrationExample.js`

---

**Implementation Status**: ✅ Complete
**Test Status**: ✅ Ready for testing
**Documentation**: ✅ Complete
