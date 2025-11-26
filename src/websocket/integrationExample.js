/**
 * Integration examples showing how to integrate WebSocket notifications
 * with existing Flight Booking services
 */

const { 
  flightUpdateHooks, 
  bookingUpdateHooks,
  notifyFlightStatusChange,
  notifyBookingStatusChange 
} = require('./websocketUtils');

/**
 * Example: Integration with Flight Service
 * Add these hooks to your existing flight service methods
 */

// Example: In your flight service update method
async function updateFlightExample(flightId, updateData) {
  try {
    // Your existing flight update logic
    const flight = await Flight.findByPk(flightId);
    if (!flight) {
      throw new Error('Flight not found');
    }
    
    const oldStatus = flight.status;
    const oldDepartureTime = flight.departure_time;
    const oldGate = flight.departure_gate;
    
    // Update flight
    await flight.update(updateData);
    
    // WebSocket notifications
    if (updateData.status && updateData.status !== oldStatus) {
      await flightUpdateHooks.afterStatusUpdate(flightId, oldStatus, updateData.status);
    }
    
    if (updateData.departure_time && updateData.departure_time !== oldDepartureTime) {
      await flightUpdateHooks.afterTimeUpdate(flightId, 'departure', oldDepartureTime, updateData.departure_time);
    }
    
    if (updateData.departure_gate && updateData.departure_gate !== oldGate) {
      await flightUpdateHooks.afterLocationUpdate(flightId, 'gate', oldGate, updateData.departure_gate);
    }
    
    return flight;
  } catch (error) {
    console.error('Error updating flight:', error);
    throw error;
  }
}

/**
 * Example: Integration with Booking Service
 * Add these hooks to your existing booking service methods
 */

// Example: In your booking service update method
async function updateBookingExample(bookingId, updateData, userId) {
  try {
    // Your existing booking update logic
    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    const oldStatus = booking.status;
    const oldPaymentStatus = booking.payment_status;
    
    // Update booking
    await booking.update(updateData);
    
    // WebSocket notifications
    if (updateData.status && updateData.status !== oldStatus) {
      await bookingUpdateHooks.afterStatusUpdate(bookingId, oldStatus, updateData.status);
    }
    
    if (updateData.payment_status && updateData.payment_status !== oldPaymentStatus) {
      await bookingUpdateHooks.afterPaymentUpdate(bookingId, updateData.payment_status, {
        amount: booking.total_amount,
        method: updateData.payment_method
      });
    }
    
    return booking;
  } catch (error) {
    console.error('Error updating booking:', error);
    throw error;
  }
}

/**
 * Example: Integration with Payment Controller
 * Add WebSocket notification after successful payment
 */
async function handlePaymentSuccessExample(bookingId, paymentData) {
  try {
    // Your existing payment success logic
    const booking = await Booking.findByPk(bookingId);
    await booking.update({
      payment_status: 'completed',
      payment_method: paymentData.method,
      payment_date: new Date()
    });
    
    // WebSocket notification
    await bookingUpdateHooks.afterPaymentUpdate(bookingId, 'completed', {
      amount: paymentData.amount,
      method: paymentData.method,
      transactionId: paymentData.transactionId
    });
    
    // Also generate e-ticket after successful payment
    const eTicketUrl = await generateETicket(bookingId);
    await bookingUpdateHooks.afterETicketGeneration(bookingId, eTicketUrl);
    
  } catch (error) {
    console.error('Error handling payment success:', error);
    throw error;
  }
}

/**
 * Example: Integration with Check-in Service
 */
async function handleCheckInExample(bookingId, seatSelections) {
  try {
    // Your existing check-in logic
    const booking = await Booking.findByPk(bookingId, {
      include: [{ model: Passenger, as: 'passengers' }]
    });
    
    // Update passenger seats
    const seatNumbers = [];
    for (let i = 0; i < booking.passengers.length; i++) {
      const passenger = booking.passengers[i];
      const seatNumber = seatSelections[i];
      
      await passenger.update({ seat_number: seatNumber });
      seatNumbers.push(seatNumber);
    }
    
    // Update booking check-in status
    await booking.update({
      check_in_status: 'completed',
      check_in_time: new Date()
    });
    
    // Generate boarding pass
    const boardingPassUrl = await generateBoardingPass(bookingId);
    
    // WebSocket notification
    await bookingUpdateHooks.afterCheckIn(bookingId, seatNumbers, boardingPassUrl);
    
  } catch (error) {
    console.error('Error handling check-in:', error);
    throw error;
  }
}

/**
 * Example: Scheduled notifications
 * You can set up cron jobs or scheduled tasks to send reminders
 */
async function sendDepartureReminders() {
  try {
    // Find bookings with flights departing in the next 24 hours
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 24);
    
    const upcomingBookings = await Booking.findAll({
      include: [{
        model: Flight,
        as: 'flight',
        where: {
          departure_time: {
            [Op.between]: [new Date(), tomorrow]
          }
        }
      }],
      where: {
        status: 'confirmed'
      }
    });
    
    for (const booking of upcomingBookings) {
      const hoursUntilDeparture = Math.round(
        (new Date(booking.flight.departure_time) - new Date()) / (1000 * 60 * 60)
      );
      
      if (hoursUntilDeparture === 24 || hoursUntilDeparture === 2) {
        await bookingUpdateHooks.afterStatusUpdate(
          booking.id,
          booking.status,
          booking.status,
          {
            reminderType: 'departure',
            hoursUntilDeparture
          }
        );
      }
    }
  } catch (error) {
    console.error('Error sending departure reminders:', error);
  }
}

/**
 * Example: Admin notifications for flight delays
 */
async function notifyFlightDelayExample(flightId, delayMinutes, reason) {
  try {
    // Update flight status
    const flight = await Flight.findByPk(flightId);
    const newDepartureTime = new Date(flight.departure_time);
    newDepartureTime.setMinutes(newDepartureTime.getMinutes() + delayMinutes);
    
    await flight.update({
      departure_time: newDepartureTime,
      status: 'delayed'
    });
    
    // Notify all subscribers about the delay
    await flightUpdateHooks.afterStatusUpdate(flightId, 'scheduled', 'delayed', {
      delayMinutes,
      reason,
      newDepartureTime
    });
    
    // Also notify all bookings for this flight
    const bookings = await Booking.findAll({
      where: { flight_id: flightId }
    });
    
    for (const booking of bookings) {
      await bookingUpdateHooks.afterStatusUpdate(
        booking.id,
        booking.status,
        booking.status,
        {
          flightDelayMinutes: delayMinutes,
          flightDelayReason: reason
        }
      );
    }
    
  } catch (error) {
    console.error('Error notifying flight delay:', error);
  }
}

/**
 * Example middleware to add WebSocket notifications to existing routes
 */
function addWebSocketNotifications(req, res, next) {
  // Store original res.json method
  const originalJson = res.json;
  
  // Override res.json to add WebSocket notifications
  res.json = function(data) {
    // Call original method first
    originalJson.call(this, data);
    
    // Add WebSocket notifications based on the response
    if (data.success && req.method === 'PUT') {
      const { path } = req.route;
      
      if (path.includes('/flights/:id')) {
        // Flight update
        const flightId = req.params.id;
        notifyFlightStatusChange(flightId, 'unknown', 'updated', req.body);
      } else if (path.includes('/bookings/:id')) {
        // Booking update
        const bookingId = req.params.id;
        notifyBookingStatusChange(bookingId, 'unknown', 'updated', req.body);
      }
    }
  };
  
  next();
}

module.exports = {
  updateFlightExample,
  updateBookingExample,
  handlePaymentSuccessExample,
  handleCheckInExample,
  sendDepartureReminders,
  notifyFlightDelayExample,
  addWebSocketNotifications
};
