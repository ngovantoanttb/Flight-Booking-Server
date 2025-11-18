/**
 * Passenger Validation Service
 * Implements passenger rules according to requirements:
 * - Adult (>= 12 years old): Service-based pricing (full flight price)
 * - Child (2 to < 12 years old): Service-based pricing (full flight price - same as adult)
 * - Infant (< 2 years old): Fixed 400,000 VND
 * - Constraints: 1 adult max 6 children, 1 adult max 1 infant
 * - Infant ticket: Fixed 400,000 VND
 */

const logger = require('../utils/logger');

class PassengerValidationService {
	/**
	 * Calculate passenger age from date of birth
	 * @param {Date|string} dateOfBirth
	 * @returns {number} Age in years
	 */
	static calculateAge(dateOfBirth) {
		const birthDate = new Date(dateOfBirth);
		const today = new Date();
		let age = today.getFullYear() - birthDate.getFullYear();
		const monthDiff = today.getMonth() - birthDate.getMonth();

		if (
			monthDiff < 0 ||
			(monthDiff === 0 && today.getDate() < birthDate.getDate())
		) {
			age--;
		}

		return age;
	}

	/**
	 * Determine passenger type based on age
	 * @param {Date|string} dateOfBirth
	 * @returns {string} 'adult', 'child', or 'infant'
	 */
	static determinePassengerType(dateOfBirth) {
		const age = this.calculateAge(dateOfBirth);

		if (age >= 12) return 'adult';
		if (age >= 2) return 'child';
		return 'infant';
	}

	/**
	 * Validate passenger rules
	 * @param {Array} passengers Array of passenger objects
	 * @returns {Object} { isValid: boolean, errors: Array, warnings: Array }
	 */
	static validatePassengerRules(passengers) {
		const errors = [];
		const warnings = [];

		if (!passengers || passengers.length === 0) {
			errors.push('At least one passenger is required');
			return { isValid: false, errors, warnings };
		}

		// Count passengers by type
		const passengerCounts = { adult: 0, child: 0, infant: 0 };

		passengers.forEach((passenger, index) => {
			if (!passenger.date_of_birth) {
				errors.push(
					`Passenger ${index + 1}: Date of birth is required`
				);
				return;
			}

			// Use passenger_type from request if provided, otherwise determine from age
			const passengerType =
				passenger.passenger_type ||
				this.determinePassengerType(passenger.date_of_birth);
			passengerCounts[passengerType]++;

			// If passenger_type provided but mismatched with age, treat as error per requirements
			if (
				passenger.passenger_type &&
				passenger.passenger_type !== passengerType
			) {
				errors.push(
					`Passenger ${index + 1}: passenger_type (${
						passenger.passenger_type
					}) does not match age-derived type (${passengerType})`
				);
			}
		});

		// Validate minimum adult requirement
		if (passengerCounts.adult === 0) {
			errors.push('At least one adult passenger is required');
		}

		// Validate child constraint: 1 adult max 6 children
		if (passengerCounts.child > 0 && passengerCounts.adult === 0) {
			errors.push('Children must be accompanied by at least one adult');
		}

		if (passengerCounts.child > passengerCounts.adult * 6) {
			errors.push('Maximum 6 children per adult passenger');
		}

		// Validate infant constraint: 1 adult max 1 infant
		if (passengerCounts.infant > 0 && passengerCounts.adult === 0) {
			errors.push('Infants must be accompanied by at least one adult');
		}

		if (passengerCounts.infant > passengerCounts.adult) {
			errors.push('Maximum 1 infant per adult passenger');
		}

		// Validate total passenger limit
		const totalPassengers =
			passengerCounts.adult +
			passengerCounts.child +
			passengerCounts.infant;
		if (totalPassengers > 9) {
			errors.push('Maximum 9 passengers per booking');
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
			passengerCounts,
		};
	}

	/**
	 * Calculate passenger pricing
	 * @param {Array} passengers Array of passenger objects
	 * @param {number} basePrice Base price for adult ticket
	 * @returns {Array} Array of passenger pricing objects
	 */
	static calculatePassengerPricing(passengers, basePrice) {
		const INFANT_DEFAULT_PRICE = 400000; // Fixed 400,000 VND for infants (< 2 years old)

		return passengers.map((passenger) => {
			const passengerType = this.determinePassengerType(
				passenger.date_of_birth
			);
			let price = basePrice;

			switch (passengerType) {
				case 'adult':
					// Adult (>= 12 years old): Full price (service-based pricing)
					price = basePrice;
					break;
				case 'child':
					// Child (2-12 years old): Full price (service-based pricing) - same as adult
					price = basePrice;
					break;
				case 'infant':
					// Infant (< 2 years old): Fixed 400,000 VND
					price = INFANT_DEFAULT_PRICE;
					break;
			}

			return {
				passenger_id: passenger.passenger_id,
				passenger_type: passengerType,
				price: Math.round(price),
				base_price: basePrice,
			};
		});
	}

	/**
	 * Validate individual passenger data
	 * @param {Object} passenger Passenger object
	 * @returns {Object} { isValid: boolean, errors: Array }
	 */
	static validatePassengerData(passenger) {
		const errors = [];

		// Required fields validation
		if (!passenger.first_name) {
			errors.push('First name is required');
		}

		if (!passenger.last_name) {
			errors.push('Last name is required');
		}

		if (!passenger.date_of_birth) {
			errors.push('Date of birth is required');
		}

		if (!passenger.gender) {
			errors.push('Gender is required');
		}

		if (!passenger.nationality) {
			errors.push('Nationality is required');
		}

		if (!passenger.passenger_type) {
			errors.push('Passenger type is required');
		}

		if (!passenger.title) {
			errors.push('Title is required');
		}

		if (!passenger.passport_number) {
			errors.push('Passport number is required');
		}

		if (!passenger.citizen_id) {
			errors.push('Citizen ID is required');
		}

		// Title validation
		if (
			passenger.title &&
			!['Mr', 'Mrs', 'Ms', 'Dr', 'Prof'].includes(passenger.title)
		) {
			errors.push('Invalid title. Must be Mr, Mrs, Ms, Dr, or Prof');
		}

		// Citizen ID validation
		if (passenger.citizen_id && !/^\d{12}$/.test(passenger.citizen_id)) {
			errors.push('Citizen ID must be exactly 12 digits');
		}

		// Passport validation
		if (
			passenger.passport_number &&
			(passenger.passport_number.length < 6 ||
				passenger.passport_number.length > 20)
		) {
			errors.push('Passport number must be between 6 and 20 characters');
		}

		// Passport expiry validation - must be valid for at least 6 months from booking date
		if (passenger.passport_expiry) {
			const expiryDate = new Date(passenger.passport_expiry);
			if (isNaN(expiryDate.getTime())) {
				errors.push('Invalid passport expiry date format');
			} else {
				const today = new Date();
				const sixMonthsFromNow = new Date();
				sixMonthsFromNow.setMonth(today.getMonth() + 6);

				if (expiryDate <= sixMonthsFromNow) {
					errors.push(
						'Passport must be valid for at least 6 months from booking date'
					);
				}
			}
		}

		// Nationality validation
		if (
			passenger.nationality &&
			(passenger.nationality.length < 2 ||
				passenger.nationality.length > 3)
		) {
			errors.push('Nationality must be 2-3 characters');
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Get passenger type statistics
	 * @param {Array} passengers Array of passenger objects
	 * @returns {Object} Statistics object
	 */
	static getPassengerStatistics(passengers) {
		const stats = {
			total: passengers.length,
			adults: 0,
			children: 0,
			infants: 0,
			adultChildRatio: 0,
			adultInfantRatio: 0,
		};

		passengers.forEach((passenger) => {
			const type = this.determinePassengerType(passenger.date_of_birth);
			stats[type + 's']++;
		});

		if (stats.adults > 0) {
			stats.adultChildRatio = stats.children / stats.adults;
			stats.adultInfantRatio = stats.infants / stats.adults;
		}

		return stats;
	}
}

module.exports = PassengerValidationService;
