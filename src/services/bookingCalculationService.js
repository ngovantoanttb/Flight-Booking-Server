/**
 * Booking Calculation Service
 * Handles complex booking calculations including fees, discounts, and taxes
 */

const {
	Flight,
	FlightBaggageService,
	FlightMealService,
	BaggageOption,
	MealOption,
	ServicePackage,
	Promotion,
} = require('../models');
const logger = require('../utils/logger');

class BookingCalculationService {
	/**
	 * Calculate total booking amount with all fees
	 * @param {Object} bookingData - Booking data including flight, passengers, services
	 * @returns {Object} Calculated amounts breakdown
	 */
	async calculateBookingAmount(bookingData) {
		try {
			const {
				flight_id,
				passengers,
				selected_baggage_services = [],
				selected_meal_services = [],
				service_package_id,
				discount_code,
				class_type = 'economy',
				itinerary, // optional multi-leg support
			} = bookingData;

			// If itinerary provided, use multi-leg calculator
			if (Array.isArray(itinerary) && itinerary.length > 0) {
				return await this.calculateMultiLegBookingAmount({
					itinerary,
					passengers,
					discount_code,
				});
			}

			// Get flight details
			const flight = await Flight.findByPk(flight_id, {
				include: [
					{
						model: FlightBaggageService,
						as: 'baggage_services',
						where: { is_active: true },
						required: false,
					},
					{
						model: FlightMealService,
						as: 'meal_services',
						where: { is_active: true },
						required: false,
					},
				],
			});

			if (!flight) {
				throw new Error('Flight not found');
			}

			// Calculate base amount (flight tickets) BEFORE applying service package
			logger.debug('Flight pricing info:', {
				flight_id: flight.flight_id,
				economy_price: flight.economy_price,
				business_price: flight.business_price,
				class_type,
			});

			const baseAmount = this.calculateBaseAmount(
				flight,
				passengers,
				class_type
			);

			// Load airline-level options to support IDs coming from airline catalogs
			let airlineBaggageOptions = [];
			let airlineMealOptions = [];
			try {
				airlineBaggageOptions = await BaggageOption.findAll({
					where: { airline_id: flight.airline_id },
					attributes: ['baggage_id', 'price'],
				});
				airlineMealOptions = await MealOption.findAll({
					where: { airline_id: flight.airline_id },
					attributes: ['meal_id', 'price'],
				});
			} catch (e) {
				logger.warn(
					'Failed to load airline-level options for fee calc:',
					e
				);
			}

			// Calculate baggage fees (support both flight-level and airline-level IDs)
			const baggageFees = await this.calculateBaggageFees(
				selected_baggage_services,
				flight.baggage_services,
				airlineBaggageOptions
			);

			// Calculate meal fees (support both flight-level and airline-level IDs)
			const mealFees = await this.calculateMealFees(
				selected_meal_services,
				flight.meal_services,
				airlineMealOptions
			);

			// Calculate service package fees
			// New pricing rule: package multiplier applies to base fare, no separate package fee
			const packageMultiplier = await this.getServicePackageMultiplier(
				service_package_id
			);

			logger.debug('Service package info:', {
				service_package_id,
				packageMultiplier,
				baseAmount,
			});

			// Recalculate base amount to include package multiplier
			const baseAmountWithPackage = this.calculateBaseAmount(
				flight,
				passengers,
				class_type,
				packageMultiplier
			);

			logger.debug('Base amount comparison:', {
				baseAmount,
				baseAmountWithPackage,
				delta: baseAmountWithPackage - baseAmount,
			});

			// Calculate explicit service package fee (delta from base)
			const servicePackageFees = Math.max(
				0,
				baseAmountWithPackage - baseAmount
			);

			// Calculate subtotal (base before package + explicit package fees + extras)
			const subtotal =
				baseAmount + servicePackageFees + baggageFees + mealFees;

			// Calculate discount
			const discount = await this.calculateDiscount(
				discount_code,
				subtotal,
				flight_id
			);

			// No tax per new requirement
			const taxAmount = 0;

			// Calculate final amount
			const finalAmount = subtotal - discount.amount;

			return {
				base_amount: baseAmount,
				baggage_fees: baggageFees,
				meal_fees: mealFees,
				service_package_fees: servicePackageFees,
				subtotal: subtotal,
				discount_amount: discount.amount,
				discount_code: discount.code,
				discount_percentage: discount.percentage,
				tax_amount: taxAmount,
				final_amount: finalAmount,
				selected_baggage_services: selected_baggage_services,
				selected_meal_services: selected_meal_services,
				breakdown: {
					flight_tickets: {
						amount: baseAmount,
						description: `${passengers.length} ${class_type} ticket(s)`,
					},
					baggage: {
						amount: baggageFees,
						services: selected_baggage_services,
					},
					meals: {
						amount: mealFees,
						services: selected_meal_services,
					},
					service_package: {
						amount: servicePackageFees,
						package_id: service_package_id,
					},
					discount: {
						amount: discount.amount,
						code: discount.code,
						percentage: discount.percentage,
					},
					// tax removed
				},
			};
		} catch (error) {
			logger.error('Error calculating booking amount:', error);
			throw error;
		}
	}

	/**
	 * Calculate total for multi-leg (round-trip) bookings
	 */
	async calculateMultiLegBookingAmount({
		itinerary,
		passengers,
		discount_code,
	}) {
		let grandBase = 0;
		let grandBaggage = 0;
		let grandMeals = 0;
		let grandPackageFees = 0;
		const legBreakdowns = [];
		const allSelectedBaggageServices = [];
		const allSelectedMealServices = [];

		for (const leg of itinerary) {
			logger.debug(`Calculating leg ${leg.flight_id}:`, {
				flight_id: leg.flight_id,
				class_type: leg.class_type || 'economy',
				service_package_id: leg.service_package_id,
				baggage_options_count: (leg.baggage_options || []).length,
				meal_options_count: (leg.meal_options || []).length,
			});

			const legCalc = await this.calculateBookingAmount({
				flight_id: leg.flight_id,
				passengers,
				selected_baggage_services: (leg.baggage_options || []).map(
					(b) => ({
						baggage_service_id:
							b.baggage_service_id ||
							b.baggage_id ||
							b.service_id,
						quantity: b.quantity || 1,
					})
				),
				selected_meal_services: (leg.meal_options || []).map((m) => ({
					meal_service_id:
						m.meal_service_id || m.meal_id || m.service_id,
					quantity: m.quantity || 1,
				})),
				service_package_id: leg.service_package_id,
				class_type: leg.class_type || 'economy',
				// Important: DO NOT pass discount here; apply once on grand subtotal
			});

			logger.debug(`Leg ${leg.flight_id} calculation:`, {
				base_amount: legCalc.base_amount,
				baggage_fees: legCalc.baggage_fees,
				meal_fees: legCalc.meal_fees,
				service_package_fees: legCalc.service_package_fees,
			});

			grandBase += legCalc.base_amount;
			grandBaggage += legCalc.baggage_fees;
			grandMeals += legCalc.meal_fees;
			grandPackageFees += legCalc.service_package_fees;

			// Collect services from each leg
			if (legCalc.selected_baggage_services && Array.isArray(legCalc.selected_baggage_services)) {
				allSelectedBaggageServices.push(...legCalc.selected_baggage_services.map(s => ({
					...s,
					flight_id: leg.flight_id, // Add flight_id for multi-leg support
				})));
			}
			if (legCalc.selected_meal_services && Array.isArray(legCalc.selected_meal_services)) {
				allSelectedMealServices.push(...legCalc.selected_meal_services.map(s => ({
					...s,
					flight_id: leg.flight_id, // Add flight_id for multi-leg support
				})));
			}

			legBreakdowns.push({
				flight_tickets: legCalc.breakdown.flight_tickets,
				baggage: legCalc.breakdown.baggage,
				meals: legCalc.breakdown.meals,
				service_package: legCalc.breakdown.service_package,
			});
		}

		const subtotal =
			grandBase + grandBaggage + grandMeals + grandPackageFees;
		const discount = await this.calculateDiscount(discount_code, subtotal);
		const finalAmount = subtotal - discount.amount;

		logger.debug('Multi-leg booking totals:', {
			grandBase,
			grandBaggage,
			grandMeals,
			grandPackageFees,
			subtotal,
			discount_amount: discount.amount,
			final_amount: finalAmount,
		});

		return {
			base_amount: grandBase,
			baggage_fees: grandBaggage,
			meal_fees: grandMeals,
			service_package_fees: grandPackageFees,
			subtotal,
			discount_amount: discount.amount,
			discount_code: discount.code,
			discount_percentage: discount.percentage,
			tax_amount: 0,
			final_amount: finalAmount,
			selected_baggage_services: allSelectedBaggageServices,
			selected_meal_services: allSelectedMealServices,
			breakdown: {
				legs: legBreakdowns,
				discount: {
					amount: discount.amount,
					code: discount.code,
					percentage: discount.percentage,
				},
			},
		};
	}

	/**
	 * Calculate base flight ticket amount
	 */
	calculateBaseAmount(
		flight,
		passengers,
		class_type,
		packageMultiplier = 1.0
	) {
		let total = 0;
		let basePrice = 1000000;
		const INFANT_DEFAULT_PRICE = 400000; // Fixed 400,000 VND for infants (< 2 years old)
		if (class_type === 'business') {
			basePrice =
				flight.business_price && Number(flight.business_price) > 0
					? Number(flight.business_price)
					: 2000000;
		} else {
			basePrice =
				flight.economy_price && Number(flight.economy_price) > 0
					? Number(flight.economy_price)
					: 1000000;
		}

		// Debug logging
		logger.debug('Calculating base amount:', {
			flight_id: flight?.flight_id,
			class_type,
			basePrice,
			packageMultiplier,
			passengersCount: passengers?.length || 0,
		});

		for (const p of passengers) {
			if (p.passenger_type === 'infant') {
				// Infant (< 2 years old): Fixed 400,000 VND
				total += INFANT_DEFAULT_PRICE;
				logger.debug(
					`Infant passenger: +${INFANT_DEFAULT_PRICE} = ${total}`
				);
			} else {
				// Child (2-12 years old) and Adult (>= 12 years old): Full price (service-based pricing)
				const passengerPrice =
					basePrice * parseFloat(packageMultiplier);
				total += passengerPrice;
				logger.debug(
					`${
						p.passenger_type === 'child' ? 'Child' : 'Adult'
					} passenger: ${basePrice} × ${packageMultiplier} = ${passengerPrice}, total = ${total}`
				);
			}
		}

		logger.debug(
			`Final base amount for flight ${flight?.flight_id}: ${total}`
		);
		return total;
	}

	/**
	 * Calculate baggage fees
	 */
	async calculateBaggageFees(
		selectedServices,
		flightServices,
		airlineOptions
	) {
		let totalFees = 0;

		// Debug logging
		logger.debug('Calculating baggage fees:', {
			selectedServicesCount: selectedServices?.length || 0,
			flightServicesCount: Array.isArray(flightServices)
				? flightServices.length
				: 0,
			airlineOptionsCount: Array.isArray(airlineOptions)
				? airlineOptions.length
				: 0,
		});

		for (const selected of selectedServices) {
			// Mapping id các trường phổ biến
			const sid =
				selected.baggage_service_id ||
				selected.service_id ||
				selected.baggage_id ||
				selected.id;
			const quantity = selected.quantity || 1;

			if (!sid) {
				logger.warn(
					'Baggage service ID not found in selected service:',
					selected
				);
				continue;
			}

			// Try match flight-level first
			let price = null;
			const flightSvc = Array.isArray(flightServices)
				? flightServices.find((s) => s.baggage_service_id === sid)
				: null;
			if (flightSvc) {
				price = parseFloat(flightSvc.price);
				logger.debug(
					`Found flight-level baggage service ${sid} with price ${price}`
				);
			} else if (Array.isArray(airlineOptions)) {
				// Fallback to airline-level options (baggage_id)
				const opt = airlineOptions.find((o) => o.baggage_id === sid);
				if (opt) {
					price = parseFloat(opt.price);
					logger.debug(
						`Found airline-level baggage service ${sid} with price ${price}`
					);
				}
			}

			if (!price || isNaN(price) || price <= 0) {
				const availableFlightServices = Array.isArray(flightServices)
					? flightServices.map((s) => ({
							id: s.baggage_service_id,
							price: s.price,
					  }))
					: [];
				const availableAirlineOptions = Array.isArray(airlineOptions)
					? airlineOptions.map((o) => ({
							id: o.baggage_id,
							price: o.price,
					  }))
					: [];
				logger.warn(
					`Baggage service ${sid} not found or has invalid price.`,
					{
						requested_service_id: sid,
						available_flight_services: availableFlightServices,
						available_airline_options: availableAirlineOptions,
					}
				);
			} else {
				totalFees += price * quantity;
				logger.debug(
					`Added baggage fee: ${price} × ${quantity} = ${
						price * quantity
					}`
				);
			}
		}

		logger.debug(`Total baggage fees: ${totalFees}`);
		return totalFees;
	}

	/**
	 * Calculate meal fees
	 */
	async calculateMealFees(selectedServices, flightServices, airlineOptions) {
		let totalFees = 0;

		// Debug logging
		logger.debug('Calculating meal fees:', {
			selectedServicesCount: selectedServices?.length || 0,
			flightServicesCount: Array.isArray(flightServices)
				? flightServices.length
				: 0,
			airlineOptionsCount: Array.isArray(airlineOptions)
				? airlineOptions.length
				: 0,
		});

		for (const selected of selectedServices) {
			const sid =
				selected.meal_service_id ||
				selected.service_id ||
				selected.meal_id ||
				selected.id;
			const quantity = selected.quantity || 1;

			if (!sid) {
				logger.warn(
					'Meal service ID not found in selected service:',
					selected
				);
				continue;
			}

			// Try match flight-level first
			let price = null;
			const flightSvc = Array.isArray(flightServices)
				? flightServices.find((s) => s.meal_service_id === sid)
				: null;
			if (flightSvc) {
				price = parseFloat(flightSvc.price);
				logger.debug(
					`Found flight-level meal service ${sid} with price ${price}`
				);
			} else if (Array.isArray(airlineOptions)) {
				// Fallback to airline-level options (meal_id)
				const opt = airlineOptions.find((o) => o.meal_id === sid);
				if (opt) {
					price = parseFloat(opt.price);
					logger.debug(
						`Found airline-level meal service ${sid} with price ${price}`
					);
				}
			}

			if (!price || isNaN(price) || price <= 0) {
				const availableFlightServices = Array.isArray(flightServices)
					? flightServices.map((s) => ({
							id: s.meal_service_id,
							price: s.price,
					  }))
					: [];
				const availableAirlineOptions = Array.isArray(airlineOptions)
					? airlineOptions.map((o) => ({
							id: o.meal_id,
							price: o.price,
					  }))
					: [];
				logger.warn(
					`Meal service ${sid} not found or has invalid price.`,
					{
						requested_service_id: sid,
						available_flight_services: availableFlightServices,
						available_airline_options: availableAirlineOptions,
					}
				);
			} else {
				totalFees += price * quantity;
				logger.debug(
					`Added meal fee: ${price} × ${quantity} = ${
						price * quantity
					}`
				);
			}
		}

		logger.debug(`Total meal fees: ${totalFees}`);
		return totalFees;
	}

	/**
	 * Calculate service package fees
	 */
	async getServicePackageMultiplier(servicePackageId) {
		if (!servicePackageId) return 1.0;
		const servicePackage = await ServicePackage.findByPk(servicePackageId);
		if (!servicePackage) return 1.0;
		return parseFloat(servicePackage.price_multiplier || 1.0);
	}

	/**
	 * Calculate discount amount
	 */
	async calculateDiscount(discountCode, subtotal, flightId) {
		if (!discountCode) {
			return { amount: 0, code: null, percentage: 0 };
		}

		const promotion = await Promotion.findOne({
			where: {
				promotion_code: discountCode,
				is_active: true,
				start_date: { [require('sequelize').Op.lte]: new Date() },
				end_date: { [require('sequelize').Op.gte]: new Date() },
			},
		});

		if (!promotion) {
			return { amount: 0, code: null, percentage: 0 };
		}

		let discountAmount = 0;

		if (promotion.discount_type === 'percentage') {
			discountAmount =
				subtotal * (parseFloat(promotion.discount_value) / 100);
		} else if (promotion.discount_type === 'fixed') {
			discountAmount = parseFloat(promotion.discount_value);
		}

		// Apply maximum discount limit if set
		if (
			promotion.max_discount_amount &&
			discountAmount > parseFloat(promotion.max_discount_amount)
		) {
			discountAmount = parseFloat(promotion.max_discount_amount);
		}

		return {
			amount: discountAmount,
			code: discountCode,
			percentage:
				promotion.discount_type === 'percentage'
					? parseFloat(promotion.discount_value)
					: 0,
		};
	}

	/**
	 * Calculate tax amount
	 */
	calculateTax(subtotal) {
		return 0;
	}

	/**
	 * Generate payment breakdown for email
	 */
	generatePaymentBreakdown(calculation) {
		const { breakdown } = calculation;

		return {
			flight_tickets: {
				description: breakdown.flight_tickets.description,
				amount: breakdown.flight_tickets.amount,
			},
			baggage:
				breakdown.baggage.amount > 0
					? {
							description: 'Baggage fees',
							amount: breakdown.baggage.amount,
					  }
					: null,
			meals:
				breakdown.meals.amount > 0
					? {
							description: 'Meal services',
							amount: breakdown.meals.amount,
					  }
					: null,
			service_package:
				breakdown.service_package.amount > 0
					? {
							description: 'Service package',
							amount: breakdown.service_package.amount,
					  }
					: null,
			discount:
				breakdown.discount.amount > 0
					? {
							description: `Discount (${breakdown.discount.code})`,
							amount: -breakdown.discount.amount,
					  }
					: null,
			// tax removed
		};
	}
}

module.exports = new BookingCalculationService();
