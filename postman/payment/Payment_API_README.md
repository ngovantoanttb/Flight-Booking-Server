# Payment API Postman Collection v2

This collection provides comprehensive testing for the Flight Booking System's Payment APIs, including ZaloPay integration with complete payment flow testing.

## 📁 Files Included

- **`Payment_API_Collection.json`** - Main Postman collection
- **`Payment_API_Environment.json`** - Environment variables
- **`Payment_API_README.md`** - This documentation

## 🚀 Quick Start

### 1. Import Collection
1. Open Postman
2. Click **Import** button
3. Select `Payment_API_Collection.json`
4. Import `Payment_API_Environment.json` as environment

### 2. Set Environment
1. Select "Payment API Environment v2" from environment dropdown
2. Verify all variables are set correctly

### 3. Start Testing
1. Run "Complete Payment Flow Test" folder for end-to-end testing
2. Or test individual endpoints as needed

## 📋 Collection Structure

### 🔐 Authentication
- **Login Test User** - Get JWT token for API access

### 📋 Bookings
- **Get User Bookings** - List all user bookings
- **Get Booking Details** - Get specific booking information
- **Cancel Booking** - Cancel a pending booking

### 💳 Payment History
- **Get Payment History** - View all payment records

### 🏦 ZaloPay Payment
- **Create ZaloPay Payment** - Create payment order
- **Check Payment Status** - Query payment status
- **ZaloPay Callback** - Simulate ZaloPay callback

### ✅ Payment Success Flow
- **Payment Success Redirect** - Test payment success page

### 🔄 Complete Payment Flow Test
Complete end-to-end testing sequence:
1. **Login and Get Token**
2. **Get User Bookings**
3. **Create ZaloPay Payment**
4. **Test Payment Success**
5. **Verify Booking Status**
6. **Check Payment History**

## 🔧 Environment Variables

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `base_url` | API base URL | `http://localhost:3000` |
| `jwt_token` | JWT authentication token | Pre-filled test token |
| `booking_id` | Test booking ID | `2` |
| `app_trans_id` | ZaloPay app transaction ID | `250915_123456` |
| `zp_trans_id` | ZaloPay transaction ID | `ZP123456789` |
| `callback_mac` | Callback MAC signature | `test_mac_signature` |

## 🧪 Testing Scenarios

### Scenario 1: Complete Payment Flow
1. Run the "Complete Payment Flow Test" folder
2. This will test the entire payment process from login to payment completion
3. Verify booking status changes from "pending" to "confirmed"
4. Check payment status changes from "pending" to "completed"

### Scenario 2: Individual API Testing
1. **Authentication**: Login to get fresh JWT token
2. **Bookings**: View available bookings
3. **Payment Creation**: Create ZaloPay payment
4. **Status Check**: Verify payment status
5. **Success Simulation**: Test payment success redirect

### Scenario 3: Error Handling
1. Test with invalid JWT token
2. Test with non-existent booking ID
3. Test with invalid payment data
4. Test callback with invalid MAC signature

## 📊 Expected Responses

### Successful Payment Creation
```json
{
  "success": true,
  "data": {
    "app_trans_id": "250915_123456",
    "order_url": "https://qcgateway.zalopay.vn/openinapp?order=...",
    "zp_trans_id": "ZP123456789",
    "amount": "2500000.00",
    "booking_id": 2
  }
}
```

### Payment Success Page
- HTML page showing payment success
- Booking details with confirmed status
- Links back to payment test interface

### Updated Booking Status
```json
{
  "success": true,
  "data": {
    "booking_id": 2,
    "status": "confirmed",
    "payment_status": "paid",
    "booking_reference": "BK002"
  }
}
```

## 🔍 Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check JWT token is valid and not expired
   - Re-run login request to get fresh token

2. **404 Not Found**
   - Verify booking_id exists in database
   - Check base_url is correct

3. **Payment Creation Fails**
   - Ensure booking status is "pending"
   - Check ZaloPay configuration

4. **Success Page Not Working**
   - Verify payment record exists with correct app_trans_id
   - Check server logs for errors

### Debug Steps

1. **Check Server Status**
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Verify Database**
   - Check bookings table for test data
   - Verify payment records exist

3. **Check Logs**
   - Review server logs for error messages
   - Check ZaloPay API responses

## 🎯 Key Features Tested

- ✅ JWT Authentication
- ✅ Booking Management
- ✅ ZaloPay Payment Creation
- ✅ Payment Status Checking
- ✅ Payment Success Flow
- ✅ Database Updates
- ✅ Error Handling
- ✅ Callback Processing

## 📝 Notes

- **Test Data**: Uses booking ID 2 and user ID 3 for testing
- **ZaloPay Sandbox**: Configured for sandbox environment
- **Checksum Verification**: Temporarily disabled for testing
- **Auto Variables**: Collection auto-generates timestamps and IDs

## 🔄 Updates in v2

- Added complete payment flow testing
- Updated with payment success redirect
- Added booking management endpoints
- Improved error handling tests
- Added automated variable generation
- Updated documentation and examples

## 📞 Support

For issues or questions:
1. Check server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure test data exists in database
4. Review API documentation for expected formats
