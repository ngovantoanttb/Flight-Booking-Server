/**
 * Service Package Pricing Service
 * Implements pricing logic for Economy/Business Class and Plus packages
 * Pricing multipliers: Class = 1.0, Plus = 1.2
 */

const { ServicePackage, Airline } = require('../models');
const logger = require('../utils/logger');

class ServicePackagePricingService {
	/**
	 * Get service packages for an airline
	 * @param {number} airlineId
	 * @returns {Array} Array of service packages
	 */
	static async getServicePackages(airlineId) {
		try {
			const packages = await ServicePackage.findAll({
				where: {
					airline_id: airlineId,
					is_active: true,
				},
				order: [
					['class_type', 'ASC'],
					['package_type', 'ASC'],
				],
			});

			return packages;
		} catch (error) {
			logger.error('Error getting service packages:', error);
			throw error;
		}
	}

	/**
	 * Calculate price with service package multiplier
	 * @param {number} basePrice Base flight price
	 * @param {string} packageCode Package code (ECONOMY, ECONOMY_PLUS, BUSINESS, BUSINESS_PLUS)
	 * @param {number} airlineId Airline ID
	 * @returns {number} Calculated price
	 */
	static async calculatePackagePrice(basePrice, packageCode, airlineId) {
		try {
			const servicePackage = await ServicePackage.findOne({
				where: {
					package_code: packageCode,
					airline_id: airlineId,
					is_active: true,
				},
			});

			if (!servicePackage) {
				logger.warn(
					`Service package not found: ${packageCode} for airline ${airlineId}`
				);
				return basePrice; // Return base price if package not found
			}

			const calculatedPrice =
				basePrice * parseFloat(servicePackage.price_multiplier);
			return Math.round(calculatedPrice);
		} catch (error) {
			logger.error('Error calculating package price:', error);
			return basePrice; // Return base price on error
		}
	}

	/**
	 * Get all available service packages with pricing
	 * @param {number} flightId Flight ID
	 * @param {number} basePrice Base flight price
	 * @returns {Array} Array of packages with calculated prices
	 */
	static async getAvailablePackagesWithPricing(flightId, basePrice) {
		try {
			// Get flight to get airline_id
			const { Flight } = require('../models');
			const flight = await Flight.findByPk(flightId, {
				include: [
					{
						model: Airline,
						attributes: ['airline_id', 'airline_name'],
					},
				],
			});

			if (!flight) {
				throw new Error('Flight not found');
			}

			const packages = await this.getServicePackages(flight.airline_id);

			// Calculate prices for each package
			const packagesWithPricing = await Promise.all(
				packages.map(async (pkg) => {
					const calculatedPrice = await this.calculatePackagePrice(
						basePrice,
						pkg.package_code,
						flight.airline_id
					);

					return {
						package_id: pkg.package_id,
						package_name: pkg.package_name,
						package_code: pkg.package_code,
						class_type: pkg.class_type,
						package_type: pkg.package_type,
						price_multiplier: pkg.price_multiplier,
						calculated_price: calculatedPrice,
						base_price: basePrice,
						price_difference: calculatedPrice - basePrice,
						description: pkg.description,
						services_included: pkg.services_included,
					};
				})
			);

			return packagesWithPricing;
		} catch (error) {
			logger.error('Error getting packages with pricing:', error);
			throw error;
		}
	}

	/**
	 * Create default service packages for an airline
	 * @param {number} airlineId Airline ID
	 * @returns {Array} Created packages
	 */
	static async createDefaultServicePackages(airlineId) {
		try {
			const defaultPackages = [
				{
					airline_id: airlineId,
					package_name: 'Economy Class',
					package_code: 'ECONOMY',
					class_type: 'economy',
					package_type: 'standard',
					price_multiplier: 1.0,
					description: 'Standard economy class service',
					services_included: [
						'Seat selection',
						'Standard meal',
						'Basic baggage allowance',
					],
				},
				{
					airline_id: airlineId,
					package_name: 'Economy Plus',
					package_code: 'ECONOMY_PLUS',
					class_type: 'economy',
					package_type: 'plus',
					price_multiplier: 1.2,
					description: 'Enhanced economy class service',
					services_included: [
						'Priority seat selection',
						'Premium meal',
						'Extra baggage allowance',
						'Priority boarding',
					],
				},
				{
					airline_id: airlineId,
					package_name: 'Business Class',
					package_code: 'BUSINESS',
					class_type: 'business',
					package_type: 'standard',
					price_multiplier: 1.0,
					description: 'Standard business class service',
					services_included: [
						'Business seat',
						'Premium meal',
						'Extra baggage',
						'Priority check-in',
						'Lounge access',
					],
				},
				{
					airline_id: airlineId,
					package_name: 'Business Plus',
					package_code: 'BUSINESS_PLUS',
					class_type: 'business',
					package_type: 'plus',
					price_multiplier: 1.2,
					description: 'Enhanced business class service',
					services_included: [
						'Premium business seat',
						'Gourmet meal',
						'Maximum baggage',
						'Concierge service',
						'Premium lounge access',
					],
				},
			];

			const createdPackages = await ServicePackage.bulkCreate(
				defaultPackages
			);
			logger.info(
				`Created ${createdPackages.length} default service packages for airline ${airlineId}`
			);

			return createdPackages;
		} catch (error) {
			logger.error('Error creating default service packages:', error);
			throw error;
		}
	}

	/**
	 * Update service package pricing
	 * @param {number} packageId Package ID
	 * @param {number} priceMultiplier New price multiplier
	 * @returns {Object} Updated package
	 */
	static async updatePackagePricing(packageId, priceMultiplier) {
		try {
			const package_ = await ServicePackage.findByPk(packageId);
			if (!package_) {
				throw new Error('Service package not found');
			}

			package_.price_multiplier = priceMultiplier;
			await package_.save();

			logger.info(
				`Updated pricing for package ${packageId}: multiplier ${priceMultiplier}`
			);
			return package_;
		} catch (error) {
			logger.error('Error updating package pricing:', error);
			throw error;
		}
	}

	/**
	 * Get package pricing summary
	 * @param {number} airlineId Airline ID
	 * @param {number} basePrice Base price for calculation
	 * @returns {Object} Pricing summary
	 */
	static async getPricingSummary(airlineId, basePrice = 1000000) {
		try {
			const packages = await this.getServicePackages(airlineId);

			const summary = {
				airline_id: airlineId,
				base_price: basePrice,
				packages: [],
			};

			for (const pkg of packages) {
				const calculatedPrice = await this.calculatePackagePrice(
					basePrice,
					pkg.package_code,
					airlineId
				);

				summary.packages.push({
					package_name: pkg.package_name,
					package_code: pkg.package_code,
					class_type: pkg.class_type,
					package_type: pkg.package_type,
					price_multiplier: pkg.price_multiplier,
					calculated_price: calculatedPrice,
					price_difference: calculatedPrice - basePrice,
					percentage_increase:
						((calculatedPrice - basePrice) / basePrice) * 100,
				});
			}

			return summary;
		} catch (error) {
			logger.error('Error getting pricing summary:', error);
			throw error;
		}
	}
}

module.exports = ServicePackagePricingService;
