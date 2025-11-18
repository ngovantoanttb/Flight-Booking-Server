/**
 * Controllers for service operations (baggage, meals, flight services)
 */

const { BaggageOption, MealOption, FlightService, TravelClass, Flight, Booking, BookingDetail, Passenger } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');
const logger = require('../utils/logger');

const serviceController = {
  // Get baggage options for a flight
  async getBaggageOptions(req, res) {
    try {
      const { flightId } = req.params;

      // Verify flight exists and get its airline
      const flight = await Flight.findByPk(flightId);
      if (!flight) {
        return sendError(res, 'Flight not found', 404);
      }

      // Query baggage options for that airline
      const baggageOptions = await BaggageOption.findAll({
        where: { airline_id: flight.airline_id },
        order: [['weight_kg', 'ASC']]
      });

      if (!baggageOptions || baggageOptions.length === 0) {
        return sendError(res, 'No baggage options available for this flight', 404);
      }

      // Format the response data
      const formattedOptions = baggageOptions.map(option => ({
        baggage_id: option.baggage_id,
        description: option.description,
        weight_kg: option.weight_kg,
        price: option.price,
        travel_class_code: null
      }));

      return sendSuccess(res, 'Baggage options retrieved successfully', formattedOptions);
    } catch (error) {
      logger.error('Error getting baggage options:', error);
      return sendError(res, 'Failed to retrieve baggage options', 500);
    }
  },
  
  // Get meal options for a flight
  async getMealOptions(req, res) {
    try {
      const { flightId } = req.params;

      // Verify flight exists and get its airline
      const flight = await Flight.findByPk(flightId);
      if (!flight) {
        return sendError(res, 'Flight not found', 404);
      }

      // Query meal options for that airline
      const mealOptions = await MealOption.findAll({
        where: { airline_id: flight.airline_id },
        order: [['meal_name', 'ASC']]
      });

      if (!mealOptions || mealOptions.length === 0) {
        return sendError(res, 'No meal options available for this flight', 404);
      }

      // Format the response data
      const formattedOptions = mealOptions.map(option => ({
        meal_id: option.meal_id,
        name: option.meal_name || option.name,
        description: option.meal_description || option.description,
        price: option.price,
        dietary_type: option.is_vegetarian ? 'vegetarian' : 'regular',
        travel_class_code: null
      }));

      return sendSuccess(res, 'Meal options retrieved successfully', formattedOptions);
    } catch (error) {
      logger.error('Error getting meal options:', error);
      return sendError(res, 'Failed to retrieve meal options', 500);
    }
  },
  
  // Get services available for a flight
  async getFlightServices(req, res) {
    try {
      const { flightId } = req.params;
      
      // First, verify flight exists
      const flight = await Flight.findByPk(flightId);
      if (!flight) {
        return sendError(res, 'Flight not found', 404);
      }
      
      // Get general services
      const services = await FlightService.findAll({
        where: { flight_id: flightId }
      });
      
      // Get travel class-specific services
      const travelClasses = await TravelClass.findAll({
        attributes: ['class_code', 'class_name', 'amenities']
      });
      
      // Format travel class services
      const travelClassServices = {};
      travelClasses.forEach(travelClass => {
        travelClassServices[travelClass.class_code] = 
          travelClass.amenities ? 
            JSON.parse(travelClass.amenities) : 
            [];
      });
      
      // Format the response data
      const formattedServices = services.map(service => ({
        service_id: service.service_id,
        service_name: service.service_name,
        description: service.description,
        price: service.price,
        is_available: service.is_available
      }));
      
      return sendSuccess(res, 'Flight services retrieved successfully', {
        flight_id: parseInt(flightId),
        flight_number: flight.flight_number,
        services: formattedServices,
        travel_class_services: travelClassServices
      });
    } catch (error) {
      logger.error('Error getting flight services:', error);
      return sendError(res, 'Failed to retrieve flight services', 500);
    }
  },
  
  // Add baggage options to a booking
  async addBaggageToBooking(req, res) {
    try {
      const { bookingId } = req.params;
      const { passenger_baggage_options } = req.body;
      const user_id = req.user.id;
      
      // Verify booking belongs to user
      const booking = await Booking.findOne({
        where: { booking_id: bookingId, user_id }
      });
      
      if (!booking) {
        return sendError(res, 'Booking not found', 404);
      }
      
      if (booking.status !== 'pending' && booking.status !== 'confirmed') {
        return sendError(res, 'Cannot add baggage to booking with status: ' + booking.status, 400);
      }
      
      // Get booking details
      const bookingDetails = await BookingDetail.findAll({
        where: { booking_id: bookingId },
        include: [{ model: Passenger }]
      });
      
      // Process each passenger's baggage option
      const updatedDetails = [];
      let additionalCost = 0;
      
      for (const item of passenger_baggage_options) {
        const { passenger_id, baggage_option_id } = item;
        
        // Verify passenger belongs to booking
        const detail = bookingDetails.find(d => d.passenger_id === passenger_id);
        if (!detail) {
          return sendError(res, `Passenger ID ${passenger_id} not found in this booking`, 404);
        }
        
        // Get baggage option price
        const baggageOption = await BaggageOption.findByPk(baggage_option_id);
        if (!baggageOption) {
          return sendError(res, `Baggage option ID ${baggage_option_id} not found`, 404);
        }
        
        // Update booking detail with baggage option
        detail.baggage_option_id = baggage_option_id;
        await detail.save();
        
        // Add to additional cost
        additionalCost += baggageOption.price;
        
        // Add to response list
        updatedDetails.push({
          passenger_name: `${detail.Passenger.first_name} ${detail.Passenger.last_name}`,
          baggage_option: {
            description: baggageOption.description,
            weight_kg: baggageOption.weight_kg,
            price: baggageOption.price
          }
        });
      }
      
      // Update booking total amount
      booking.total_amount += additionalCost;
      await booking.save();
      
      return sendSuccess(res, 'Baggage options added to booking', {
        booking_id: booking.booking_id,
        updated_passengers: updatedDetails,
        additional_cost: additionalCost,
        new_total_amount: booking.total_amount
      });
    } catch (error) {
      logger.error('Error adding baggage to booking:', error);
      return sendError(res, 'Failed to add baggage options', 500);
    }
  },
  
  // Add meal options to a booking
  async addMealsToBooking(req, res) {
    try {
      const { bookingId } = req.params;
      const { passenger_meal_options } = req.body;
      const user_id = req.user.id;
      
      // Verify booking belongs to user
      const booking = await Booking.findOne({
        where: { booking_id: bookingId, user_id }
      });
      
      if (!booking) {
        return sendError(res, 'Booking not found', 404);
      }
      
      if (booking.status !== 'pending' && booking.status !== 'confirmed') {
        return sendError(res, 'Cannot add meals to booking with status: ' + booking.status, 400);
      }
      
      // Get booking details
      const bookingDetails = await BookingDetail.findAll({
        where: { booking_id: bookingId },
        include: [{ model: Passenger }]
      });
      
      // Process each passenger's meal option
      const updatedDetails = [];
      let additionalCost = 0;
      
      for (const item of passenger_meal_options) {
        const { passenger_id, meal_option_id } = item;
        
        // Verify passenger belongs to booking
        const detail = bookingDetails.find(d => d.passenger_id === passenger_id);
        if (!detail) {
          return sendError(res, `Passenger ID ${passenger_id} not found in this booking`, 404);
        }
        
        // Get meal option price
        const mealOption = await MealOption.findByPk(meal_option_id);
        if (!mealOption) {
          return sendError(res, `Meal option ID ${meal_option_id} not found`, 404);
        }
        
        // Update booking detail with meal option
        detail.meal_option_id = meal_option_id;
        await detail.save();
        
        // Add to additional cost
        additionalCost += mealOption.price;
        
        // Add to response list
        updatedDetails.push({
          passenger_name: `${detail.Passenger.first_name} ${detail.Passenger.last_name}`,
          meal_option: {
            name: mealOption.name,
            description: mealOption.description,
            price: mealOption.price,
            dietary_type: mealOption.dietary_type
          }
        });
      }
      
      // Update booking total amount if additional cost is non-zero
      if (additionalCost > 0) {
        booking.total_amount += additionalCost;
        await booking.save();
      }
      
      return sendSuccess(res, 'Meal options added to booking', {
        booking_id: booking.booking_id,
        updated_passengers: updatedDetails,
        additional_cost: additionalCost,
        new_total_amount: booking.total_amount
      });
    } catch (error) {
      logger.error('Error adding meals to booking:', error);
      return sendError(res, 'Failed to add meal options', 500);
    }
  }
};

module.exports = serviceController;