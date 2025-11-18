const { sequelize } = require('../config/database');

// Import all models
const User = require('./User');
const Role = require('./Role');
const UserRole = require('./UserRole');
const Country = require('./Country');
const Airport = require('./Airport');
const Airline = require('./Airline');
const Aircraft = require('./Aircraft');
const TravelClass = require('./TravelClass');
const Flight = require('./Flight');
const FlightSeat = require('./FlightSeat');
const BaggageOption = require('./BaggageOption');
const MealOption = require('./MealOption');
const FlightService = require('./FlightService');
const Passenger = require('./Passenger');
const Booking = require('./Booking');
const BookingDetail = require('./BookingDetail');
const Payment = require('./Payment');
const Promotion = require('./Promotion');
const PromotionUsage = require('./PromotionUsage');
const EmailNotification = require('./EmailNotification');
const UserSearchHistory = require('./UserSearchHistory');
const FlightRecommendation = require('./FlightRecommendation');
const RefreshToken = require('./RefreshToken');
const Contact = require('./Contact');
const ServicePackage = require('./ServicePackage');
const FlightBaggageService = require('./FlightBaggageService');
const FlightMealService = require('./FlightMealService');
const BookingServicePackage = require('./BookingServicePackage');

// Define associations
// User-Role associations (already defined in UserRole.js)
User.belongsToMany(Role, { through: UserRole, foreignKey: 'user_id' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'role_id' });

// Country-Airport associations
Country.hasMany(Airport, { foreignKey: 'country_id' });
Airport.belongsTo(Country, { foreignKey: 'country_id' });

// Airline-Aircraft associations
Airline.hasMany(Aircraft, { foreignKey: 'airline_id' });
Aircraft.belongsTo(Airline, { foreignKey: 'airline_id' });

// Airline-BaggageOption associations
Airline.hasMany(BaggageOption, { foreignKey: 'airline_id' });
BaggageOption.belongsTo(Airline, { foreignKey: 'airline_id' });

// Airline-MealOption associations
Airline.hasMany(MealOption, { foreignKey: 'airline_id' });
MealOption.belongsTo(Airline, { foreignKey: 'airline_id' });

// Flight associations
Flight.belongsTo(Airline, { foreignKey: 'airline_id' });
Flight.belongsTo(Aircraft, { foreignKey: 'aircraft_id' });
Flight.belongsTo(Airport, {
	as: 'DepartureAirport',
	foreignKey: 'departure_airport_id',
});
Flight.belongsTo(Airport, {
	as: 'ArrivalAirport',
	foreignKey: 'arrival_airport_id',
});

// FlightSeat associations
FlightSeat.belongsTo(Flight, { foreignKey: 'flight_id' });
FlightSeat.belongsTo(TravelClass, { foreignKey: 'class_id' });
Flight.hasMany(FlightSeat, { foreignKey: 'flight_id' });
TravelClass.hasMany(FlightSeat, { foreignKey: 'class_id' });

// FlightService associations
FlightService.belongsTo(Flight, { foreignKey: 'flight_id' });
Flight.hasMany(FlightService, { foreignKey: 'flight_id' });

// Booking associations
Booking.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Booking, { foreignKey: 'user_id' });

// BookingDetail associations
BookingDetail.belongsTo(Booking, { foreignKey: 'booking_id' });
BookingDetail.belongsTo(Flight, { foreignKey: 'flight_id' });
BookingDetail.belongsTo(Passenger, { foreignKey: 'passenger_id' });
BookingDetail.belongsTo(FlightSeat, { foreignKey: 'seat_id' });
BookingDetail.belongsTo(BaggageOption, { foreignKey: 'baggage_option_id' });
BookingDetail.belongsTo(MealOption, { foreignKey: 'meal_option_id' });

Booking.hasMany(BookingDetail, { foreignKey: 'booking_id' });
Flight.hasMany(BookingDetail, { foreignKey: 'flight_id' });
Passenger.hasMany(BookingDetail, { foreignKey: 'passenger_id' });
FlightSeat.hasMany(BookingDetail, { foreignKey: 'seat_id' });
BaggageOption.hasMany(BookingDetail, { foreignKey: 'baggage_option_id' });
MealOption.hasMany(BookingDetail, { foreignKey: 'meal_option_id' });

// Payment associations
Payment.belongsTo(Booking, { foreignKey: 'booking_id' });
Booking.hasMany(Payment, { foreignKey: 'booking_id' });

// Promotion associations
Promotion.hasMany(PromotionUsage, { foreignKey: 'promotion_id' });
PromotionUsage.belongsTo(Promotion, { foreignKey: 'promotion_id' });
PromotionUsage.belongsTo(Booking, { foreignKey: 'booking_id' });
Booking.hasMany(PromotionUsage, { foreignKey: 'booking_id' });

// EmailNotification associations
EmailNotification.belongsTo(User, { foreignKey: 'user_id' });
EmailNotification.belongsTo(Booking, { foreignKey: 'booking_id' });
User.hasMany(EmailNotification, { foreignKey: 'user_id' });
Booking.hasMany(EmailNotification, { foreignKey: 'booking_id' });

// UserSearchHistory associations
UserSearchHistory.belongsTo(User, { foreignKey: 'user_id' });
UserSearchHistory.belongsTo(Airport, {
	as: 'DepartureAirport',
	foreignKey: 'departure_airport_id',
});
UserSearchHistory.belongsTo(Airport, {
	as: 'ArrivalAirport',
	foreignKey: 'arrival_airport_id',
});
UserSearchHistory.belongsTo(TravelClass, { foreignKey: 'travel_class_id' });

User.hasMany(UserSearchHistory, { foreignKey: 'user_id' });
Airport.hasMany(UserSearchHistory, {
	as: 'DepartureSearches',
	foreignKey: 'departure_airport_id',
});
Airport.hasMany(UserSearchHistory, {
	as: 'ArrivalSearches',
	foreignKey: 'arrival_airport_id',
});
TravelClass.hasMany(UserSearchHistory, { foreignKey: 'travel_class_id' });

// FlightRecommendation associations
FlightRecommendation.belongsTo(User, { foreignKey: 'user_id' });
FlightRecommendation.belongsTo(Flight, { foreignKey: 'flight_id' });
User.hasMany(FlightRecommendation, { foreignKey: 'user_id' });
Flight.hasMany(FlightRecommendation, { foreignKey: 'flight_id' });

// RefreshToken associations
RefreshToken.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(RefreshToken, { foreignKey: 'user_id' });

// Country-Airline associations
Country.hasMany(Airline, { foreignKey: 'country_id' });
Airline.belongsTo(Country, { foreignKey: 'country_id' });

// Airline-ServicePackage associations
Airline.hasMany(ServicePackage, { foreignKey: 'airline_id' });
ServicePackage.belongsTo(Airline, { foreignKey: 'airline_id' });

// BookingServicePackage associations
BookingServicePackage.belongsTo(Booking, { foreignKey: 'booking_id' });
BookingServicePackage.belongsTo(Flight, { foreignKey: 'flight_id' });
BookingServicePackage.belongsTo(ServicePackage, { foreignKey: 'service_package_id' });
Booking.hasMany(BookingServicePackage, { foreignKey: 'booking_id' });
Flight.hasMany(BookingServicePackage, { foreignKey: 'flight_id' });
ServicePackage.hasMany(BookingServicePackage, { foreignKey: 'service_package_id' });

// Flight services associations
FlightBaggageService.belongsTo(Flight, { foreignKey: 'flight_id' });
Flight.hasMany(FlightBaggageService, { foreignKey: 'flight_id' });

FlightMealService.belongsTo(Flight, { foreignKey: 'flight_id' });
Flight.hasMany(FlightMealService, { foreignKey: 'flight_id' });

// BookingDetail - Service associations
BookingDetail.belongsTo(FlightBaggageService, {
	foreignKey: 'baggage_option_id',
	targetKey: 'baggage_service_id',
	as: 'BaggageService',
});
BookingDetail.belongsTo(FlightMealService, {
	foreignKey: 'meal_option_id',
	targetKey: 'meal_service_id',
	as: 'MealService',
});

const models = {
	User,
	Role,
	UserRole,
	Country,
	Airport,
	Airline,
	Aircraft,
	TravelClass,
	Flight,
	FlightSeat,
	BaggageOption,
	MealOption,
	FlightService,
	Passenger,
	Booking,
	BookingDetail,
	Payment,
	Promotion,
	PromotionUsage,
	EmailNotification,
	UserSearchHistory,
	FlightRecommendation,
	RefreshToken,
	Contact,
	ServicePackage,
	FlightBaggageService,
	FlightMealService,
	BookingServicePackage,
};

// Export models and sequelize instance
module.exports = {
	...models,
	sequelize,
};
