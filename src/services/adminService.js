/**
 * Admin Service
 * Handles all admin-related business logic
 *
 * @format
 */

const BaseService = require("./baseService");
const {
  User,
  Role,
  Country,
  Airport,
  Airline,
  Aircraft,
  Passenger,
  Booking,
  BookingDetail,
  Promotion,
  Payment,
  BaggageOption,
  MealOption,
  Flight,
  FlightSeat,
  TravelClass,
  ServicePackage,
  sequelize,
} = require("../models");
const { NotFoundError, BadRequestError } = require("../utils/errors");
const { Op } = require("sequelize");
const logger = require("../utils/logger");

class AdminService {
  async getAirlineDetails(airlineId) {
    const { Airline, ServicePackage } = require("../models");
    // Get airline as a raw object
    const airline = await Airline.findByPk(airlineId, { raw: true });
    if (!airline) throw new Error("Airline not found");

    // Fetch existing packages
    let packages = await ServicePackage.findAll({
      where: { airline_id: airlineId },
      attributes: [
        "package_id",
        "package_name",
        "package_code",
        "description",
        "class_type",
        "package_type",
        "price_multiplier",
        "is_active",
        "services_included",
      ],
      order: [
        ["class_type", "ASC"],
        ["package_type", "ASC"],
      ],
      raw: true,
    });

    // If no packages exist, create defaults then refetch
    if (!packages || packages.length === 0) {
      try {
        await this.createDefaultServicePackagesForAirline(airlineId);
        packages = await ServicePackage.findAll({
          where: { airline_id: airlineId },
          attributes: [
            "package_id",
            "package_name",
            "package_code",
            "description",
            "class_type",
            "package_type",
            "price_multiplier",
            "is_active",
            "services_included",
          ],
          order: [
            ["class_type", "ASC"],
            ["package_type", "ASC"],
          ],
          raw: true,
        });
      } catch (e) {
        // log but still return airline info
        require("../utils/logger").warn(
          "Failed to auto-create default service packages:",
          e
        );
      }
    }

    // Merge airline fields and service_packages into a flat object (not nested under .airline)
    return { ...airline, service_packages: packages };
  }
  constructor() {
    // Initialize services for each entity
    this.airlineService = new BaseService(Airline);
    this.airportService = new BaseService(Airport);
    this.countryService = new BaseService(Country);
    this.aircraftService = new BaseService(Aircraft);
    this.passengerService = new BaseService(Passenger);
    this.bookingService = new BaseService(Booking);
    this.promotionService = new BaseService(Promotion);
    this.userService = new BaseService(User);
    this.travelClassService = new BaseService(TravelClass);
    this.baggageOptionService = new BaseService(BaggageOption);
    this.mealOptionService = new BaseService(MealOption);
    this.flightService = new BaseService(Flight);
    this.servicePackageService = new BaseService(ServicePackage);
  }

  // Airlines Management
  async getAirlines(filters = {}, page = 1, limit = 10) {
    try {
      const whereClause = this.buildAirlineWhereClause(filters);
      const options = {
        where: whereClause,
        order: [["airline_name", "ASC"]],
        include: [
          {
            model: Country,
            attributes: ["country_id", "country_name", "country_code"],
          },
        ],
        attributes: {
          include: [[sequelize.col("Country.country_name"), "country_name"]],
        },
      };

      return await this.airlineService.findAll(options, page, limit);
    } catch (error) {
      logger.error("Error getting airlines:", error);
      throw error;
    }
  }

  async getAirline(id) {
    try {
      return await this.airlineService.findById(id);
    } catch (error) {
      logger.error("Error getting airline:", error);
      throw error;
    }
  }

  async createAirline(airlineData) {
    try {
      // Check if airline code already exists
      const existingAirline = await Airline.findOne({
        where: { airline_code: airlineData.airline_code },
      });

      if (existingAirline) {
        throw new BadRequestError("Airline code already exists");
      }

      // Extract service packages from airline data
      const { service_packages, ...airlineInfo } = airlineData;

      // Create the airline
      const newAirline = await this.airlineService.create(airlineInfo);

      // Create service packages if provided
      if (service_packages && service_packages.length > 0) {
        await this.createServicePackagesForAirline(
          newAirline.airline_id,
          service_packages
        );
      } else {
        // Create default service packages
        await this.createDefaultServicePackagesForAirline(
          newAirline.airline_id
        );
      }

      // Return airline with service packages
      const airlineWithPackages = await Airline.findByPk(
        newAirline.airline_id,
        {
          include: [
            {
              model: ServicePackage,
              as: "ServicePackages",
              attributes: [
                "package_id",
                "package_name",
                "package_code",
                "class_type",
                "package_type",
                "price_multiplier",
                "description",
                "services_included",
              ],
            },
          ],
        }
      );

      return airlineWithPackages;
    } catch (error) {
      logger.error("Error creating airline:", error);
      throw error;
    }
  }

  async createServicePackagesForAirline(airlineId, servicePackages) {
    try {
      const packagesToCreate = servicePackages.map((pkg) => ({
        airline_id: airlineId,
        package_name: pkg.package_name,
        package_code: pkg.package_code,
        class_type: pkg.class_type,
        package_type: pkg.package_type,
        price_multiplier: pkg.price_multiplier || 1.0,
        description: pkg.description,
        services_included: pkg.benefits
          ? JSON.stringify(pkg.benefits)
          : pkg.services_included || null,
        carry_on_baggage: pkg.carry_on_baggage || 7,
        checked_baggage: pkg.checked_baggage || 20,
        refund_percentage: pkg.refund_percentage || 0,
        travel_insurance: pkg.travel_insurance || false,
        priority_boarding: pkg.priority_boarding || false,
        lounge_access: pkg.lounge_access || false,
        meal_service: pkg.meal_service || false,
        is_active: pkg.is_active !== undefined ? pkg.is_active : true,
      }));

      await ServicePackage.bulkCreate(packagesToCreate);
      logger.info(
        `Created ${packagesToCreate.length} service packages for airline ${airlineId}`
      );
    } catch (error) {
      logger.error("Error creating service packages for airline:", error);
      throw error;
    }
  }

  /**
   * Update service packages for an airline.
   * Accepts array of package objects. Upserts existing by package_id or package_code,
   * creates new ones, and removes packages not present in the payload.
   */
  async updateServicePackagesForAirline(airlineId, servicePackages) {
    const t = await sequelize.transaction();
    try {
      // Load existing packages
      const existing = await ServicePackage.findAll({
        where: { airline_id: airlineId },
        raw: false,
        transaction: t,
      });

      const incomingIds = [];
      const incomingCodes = [];

      for (const pkg of servicePackages) {
        if (pkg.package_id) incomingIds.push(pkg.package_id);
        if (pkg.package_code) incomingCodes.push(pkg.package_code);
        // upsert by package_id if present, otherwise try package_code
        let found = null;
        if (pkg.package_id) {
          found = await ServicePackage.findOne({
            where: {
              package_id: pkg.package_id,
              airline_id: airlineId,
            },
            transaction: t,
          });
        }
        if (!found && pkg.package_code) {
          found = await ServicePackage.findOne({
            where: {
              package_code: pkg.package_code,
              airline_id: airlineId,
            },
            transaction: t,
          });
        }

        const data = {
          airline_id: airlineId,
          package_name: pkg.package_name,
          package_code: pkg.package_code,
          class_type: pkg.class_type,
          package_type: pkg.package_type,
          price_multiplier: pkg.price_multiplier || 1.0,
          description: pkg.description || null,
          services_included: pkg.services_included || null,
          is_active: pkg.is_active !== undefined ? pkg.is_active : true,
          carry_on_baggage: pkg.carry_on_baggage || 7,
          checked_baggage: pkg.checked_baggage || 20,
          refund_percentage: pkg.refund_percentage || 0,
          travel_insurance: pkg.travel_insurance || false,
          priority_boarding: pkg.priority_boarding || false,
          lounge_access: pkg.lounge_access || false,
          meal_service: pkg.meal_service || false,
        };

        if (found) {
          await found.update(data, { transaction: t });
        } else {
          await ServicePackage.create(data, { transaction: t });
        }
      }

      // Delete packages that are not present in incoming payload (by id or code)
      for (const e of existing) {
        const keepById = e.package_id && incomingIds.includes(e.package_id);
        const keepByCode =
          e.package_code && incomingCodes.includes(e.package_code);
        if (!keepById && !keepByCode) {
          // remove
          await e.destroy({ transaction: t });
        }
      }

      await t.commit();
      return true;
    } catch (error) {
      await t.rollback();
      logger.error("Error updating service packages for airline:", error);
      throw error;
    }
  }

  async createDefaultServicePackagesForAirline(airlineId) {
    try {
      const defaultPackages = [
        {
          airline_id: airlineId,
          package_name: "Economy Standard",
          package_code: "ECONOMY",
          class_type: "economy",
          package_type: "standard",
          price_multiplier: 1.0,
          description: "Standard economy class service",
          services_included: "Basic seat, carry-on baggage",
          carry_on_baggage: 7,
          checked_baggage: 20,
          refund_percentage: 0,
          travel_insurance: false,
          priority_boarding: false,
          lounge_access: false,
          meal_service: false,
          is_active: true,
        },
        {
          airline_id: airlineId,
          package_name: "Economy Plus",
          package_code: "ECONOMY_PLUS",
          class_type: "economy",
          package_type: "plus",
          price_multiplier: 1.2,
          description: "Enhanced economy class service",
          services_included: "Extra legroom, priority boarding, meal service",
          carry_on_baggage: 7,
          checked_baggage: 25,
          refund_percentage: 50,
          travel_insurance: true,
          priority_boarding: true,
          lounge_access: false,
          meal_service: true,
          is_active: true,
        },
        {
          airline_id: airlineId,
          package_name: "Business Standard",
          package_code: "BUSINESS",
          class_type: "business",
          package_type: "standard",
          price_multiplier: 1.0,
          description: "Standard business class service",
          services_included: "Premium seat, lounge access, meal service",
          carry_on_baggage: 7,
          checked_baggage: 32,
          refund_percentage: 75,
          travel_insurance: true,
          priority_boarding: true,
          lounge_access: true,
          meal_service: true,
          is_active: true,
        },
        {
          airline_id: airlineId,
          package_name: "Business Plus",
          package_code: "BUSINESS_PLUS",
          class_type: "business",
          package_type: "plus",
          price_multiplier: 1.2,
          description: "Premium business class service",
          services_included: "All business services plus premium amenities",
          carry_on_baggage: 7,
          checked_baggage: 40,
          refund_percentage: 90,
          travel_insurance: true,
          priority_boarding: true,
          lounge_access: true,
          meal_service: true,
          is_active: true,
        },
      ];

      await ServicePackage.bulkCreate(defaultPackages);
      logger.info(
        `Created 4 default service packages for airline ${airlineId}`
      );
    } catch (error) {
      logger.error(
        "Error creating default service packages for airline:",
        error
      );
      throw error;
    }
  }

  async updateAirline(id, updateData) {
    try {
      // Check if airline code already exists (excluding current record)
      if (updateData.airline_code) {
        const existingAirline = await Airline.findOne({
          where: {
            airline_code: updateData.airline_code,
            airline_id: { [Op.ne]: id },
          },
        });

        if (existingAirline) {
          throw new BadRequestError("Airline code already exists");
        }
      }

      return await this.airlineService.updateById(id, updateData);
    } catch (error) {
      logger.error("Error updating airline:", error);
      throw error;
    }
  }

  async deleteAirline(id) {
    try {
      // Check if airline has associated aircraft
      const aircraftCount = await Aircraft.count({
        where: { airline_id: id },
      });
      if (aircraftCount > 0) {
        throw new BadRequestError(
          "Cannot delete airline with associated aircraft"
        );
      }

      // Check if airline has associated flights
      const flightCount = await Flight.count({
        where: { airline_id: id },
      });
      if (flightCount > 0) {
        throw new BadRequestError(
          "Cannot delete airline with associated flights"
        );
      }

      return await this.airlineService.deleteById(id);
    } catch (error) {
      logger.error("Error deleting airline:", error);
      throw error;
    }
  }

  // Airports Management
  async getAirports(filters = {}, page = 1, limit = 10) {
    try {
      const whereClause = this.buildAirportWhereClause(filters);
      const options = {
        where: whereClause,
        include: [
          {
            model: Country,
            attributes: ["country_id", "country_name", "country_code"],
          },
        ],
        order: [["airport_name", "ASC"]],
      };

      return await this.airportService.findAll(options, page, limit);
    } catch (error) {
      logger.error("Error getting airports:", error);
      throw error;
    }
  }

  async getAirport(id) {
    try {
      const options = {
        include: [
          {
            model: Country,
            attributes: ["country_id", "country_name", "country_code"],
          },
        ],
      };

      return await this.airportService.findById(id, options);
    } catch (error) {
      logger.error("Error getting airport:", error);
      throw error;
    }
  }

  async createAirport(airportData) {
    try {
      // Check if airport code already exists
      const existingAirport = await Airport.findOne({
        where: { airport_code: airportData.airport_code },
      });

      if (existingAirport) {
        throw new BadRequestError("Airport code already exists");
      }

      // Verify country exists
      const country = await Country.findByPk(airportData.country_id);
      if (!country) {
        throw new BadRequestError("Country not found");
      }

      return await this.airportService.create(airportData);
    } catch (error) {
      logger.error("Error creating airport:", error);
      throw error;
    }
  }

  async updateAirport(id, updateData) {
    try {
      // Check if airport code already exists (excluding current record)
      if (updateData.airport_code) {
        const existingAirport = await Airport.findOne({
          where: {
            airport_code: updateData.airport_code,
            airport_id: { [Op.ne]: id },
          },
        });

        if (existingAirport) {
          throw new BadRequestError("Airport code already exists");
        }
      }

      // Verify country exists if provided
      if (updateData.country_id) {
        const country = await Country.findByPk(updateData.country_id);
        if (!country) {
          throw new BadRequestError("Country not found");
        }
      }

      return await this.airportService.updateById(id, updateData);
    } catch (error) {
      logger.error("Error updating airport:", error);
      throw error;
    }
  }

  async deleteAirport(id) {
    try {
      // Check if airport has associated flights
      const departureFlights = await Flight.count({
        where: { departure_airport_id: id },
      });
      const arrivalFlights = await Flight.count({
        where: { arrival_airport_id: id },
      });

      if (departureFlights > 0 || arrivalFlights > 0) {
        throw new BadRequestError(
          "Cannot delete airport with associated flights"
        );
      }

      return await this.airportService.deleteById(id);
    } catch (error) {
      logger.error("Error deleting airport:", error);
      throw error;
    }
  }

  // Countries Management
  async getCountries(filters = {}, page = 1, limit = 10) {
    try {
      const whereClause = this.buildCountryWhereClause(filters);
      const options = {
        where: whereClause,
        order: [["country_name", "ASC"]],
      };

      return await this.countryService.findAll(options, page, limit);
    } catch (error) {
      logger.error("Error getting countries:", error);
      throw error;
    }
  }

  async getCountry(id) {
    try {
      return await this.countryService.findById(id);
    } catch (error) {
      logger.error("Error getting country:", error);
      throw error;
    }
  }

  async createCountry(countryData) {
    try {
      // Check if country code already exists
      const existingCountry = await Country.findOne({
        where: { country_code: countryData.country_code },
      });

      if (existingCountry) {
        throw new BadRequestError("Country code already exists");
      }

      return await this.countryService.create(countryData);
    } catch (error) {
      logger.error("Error creating country:", error);
      throw error;
    }
  }

  async updateCountry(id, updateData) {
    try {
      // Check if country code already exists (excluding current record)
      if (updateData.country_code) {
        const existingCountry = await Country.findOne({
          where: {
            country_code: updateData.country_code,
            country_id: { [Op.ne]: id },
          },
        });

        if (existingCountry) {
          throw new BadRequestError("Country code already exists");
        }
      }

      return await this.countryService.updateById(id, updateData);
    } catch (error) {
      logger.error("Error updating country:", error);
      throw error;
    }
  }

  async deleteCountry(id) {
    try {
      // Check if country has associated airports
      const airportCount = await Airport.count({
        where: { country_id: id },
      });
      if (airportCount > 0) {
        throw new BadRequestError(
          "Cannot delete country with associated airports"
        );
      }

      return await this.countryService.deleteById(id);
    } catch (error) {
      logger.error("Error deleting country:", error);
      throw error;
    }
  }

  // Aircraft Management
  async getAircraft(filters = {}, page = 1, limit = 10) {
    try {
      const whereClause = this.buildAircraftWhereClause(filters);
      const options = {
        where: whereClause,
        include: [
          {
            model: Airline,
            attributes: ["airline_id", "airline_name", "airline_code"],
          },
        ],
        order: [["model", "ASC"]],
      };

      return await this.aircraftService.findAll(options, page, limit);
    } catch (error) {
      logger.error("Error getting aircraft:", error);
      throw error;
    }
  }

  async getAircraftById(id) {
    try {
      const options = {
        include: [
          {
            model: Airline,
            attributes: ["airline_id", "airline_name", "airline_code"],
          },
        ],
      };

      return await this.aircraftService.findById(id, options);
    } catch (error) {
      logger.error("Error getting aircraft:", error);
      throw error;
    }
  }

  async createAircraft(aircraftData) {
    try {
      // Verify airline exists
      const airline = await Airline.findByPk(aircraftData.airline_id);
      if (!airline) {
        throw new BadRequestError("Airline not found");
      }

      // Validate seat counts
      if (
        aircraftData.business_seats + aircraftData.economy_seats !==
        aircraftData.total_seats
      ) {
        throw new BadRequestError(
          "Total seats must equal business seats + economy seats"
        );
      }

      return await this.aircraftService.create(aircraftData);
    } catch (error) {
      logger.error("Error creating aircraft:", error);
      throw error;
    }
  }

  async updateAircraft(id, updateData) {
    try {
      // Verify airline exists if provided
      if (updateData.airline_id) {
        const airline = await Airline.findByPk(updateData.airline_id);
        if (!airline) {
          throw new BadRequestError("Airline not found");
        }
      }

      // Validate seat counts if provided
      if (
        updateData.business_seats &&
        updateData.economy_seats &&
        updateData.total_seats
      ) {
        if (
          updateData.business_seats + updateData.economy_seats !==
          updateData.total_seats
        ) {
          throw new BadRequestError(
            "Total seats must equal business seats + economy seats"
          );
        }
      }

      return await this.aircraftService.updateById(id, updateData);
    } catch (error) {
      logger.error("Error updating aircraft:", error);
      throw error;
    }
  }

  async deleteAircraft(id) {
    try {
      // Check if aircraft has associated flights
      const flightCount = await Flight.count({
        where: { aircraft_id: id },
      });
      if (flightCount > 0) {
        throw new BadRequestError(
          "Cannot delete aircraft with associated flights"
        );
      }

      return await this.aircraftService.deleteById(id);
    } catch (error) {
      logger.error("Error deleting aircraft:", error);
      throw error;
    }
  }

  // Passengers Management
  async getPassengers(filters = {}, page = 1, limit = 10) {
    try {
      const whereClause = this.buildPassengerWhereClause(filters);
      const options = {
        where: whereClause,
        order: [
          ["last_name", "ASC"],
          ["first_name", "ASC"],
        ],
      };

      return await this.passengerService.findAll(options, page, limit);
    } catch (error) {
      logger.error("Error getting passengers:", error);
      throw error;
    }
  }

  async getPassenger(id) {
    try {
      return await this.passengerService.findById(id);
    } catch (error) {
      logger.error("Error getting passenger:", error);
      throw error;
    }
  }

  async createPassenger(passengerData) {
    try {
      return await this.passengerService.create(passengerData);
    } catch (error) {
      logger.error("Error creating passenger:", error);
      throw error;
    }
  }

  async updatePassenger(id, updateData) {
    try {
      return await this.passengerService.updateById(id, updateData);
    } catch (error) {
      logger.error("Error updating passenger:", error);
      throw error;
    }
  }

  async deletePassenger(id) {
    try {
      // Check if passenger has associated bookings
      const bookingCount = await BookingDetail.count({
        where: { passenger_id: id },
      });
      if (bookingCount > 0) {
        throw new BadRequestError(
          "Cannot delete passenger with associated bookings"
        );
      }

      return await this.passengerService.deleteById(id);
    } catch (error) {
      logger.error("Error deleting passenger:", error);
      throw error;
    }
  }

  // Promotions Management
  async getPromotions(filters = {}, page = 1, limit = 10) {
    try {
      const whereClause = this.buildPromotionWhereClause(filters);
      const options = {
        where: whereClause,
        order: [["start_date", "DESC"]],
      };

      return await this.promotionService.findAll(options, page, limit);
    } catch (error) {
      logger.error("Error getting promotions:", error);
      throw error;
    }
  }

  async getPromotion(id) {
    try {
      return await this.promotionService.findById(id);
    } catch (error) {
      logger.error("Error getting promotion:", error);
      throw error;
    }
  }

  async createPromotion(promotionData) {
    try {
      // Check if promotion code already exists
      const existingPromotion = await Promotion.findOne({
        where: { promotion_code: promotionData.promotion_code },
      });

      if (existingPromotion) {
        throw new BadRequestError("Promotion code already exists");
      }

      // Validate date range
      if (
        new Date(promotionData.start_date) >= new Date(promotionData.end_date)
      ) {
        throw new BadRequestError("End date must be after start date");
      }

      return await this.promotionService.create(promotionData);
    } catch (error) {
      logger.error("Error creating promotion:", error);
      throw error;
    }
  }

  async updatePromotion(id, updateData) {
    try {
      // Check if promotion code already exists (excluding current record)
      if (updateData.promotion_code) {
        const existingPromotion = await Promotion.findOne({
          where: {
            promotion_code: updateData.promotion_code,
            promotion_id: { [Op.ne]: id },
          },
        });

        if (existingPromotion) {
          throw new BadRequestError("Promotion code already exists");
        }
      }

      // Validate date range if both dates are provided
      if (updateData.start_date && updateData.end_date) {
        if (new Date(updateData.start_date) >= new Date(updateData.end_date)) {
          throw new BadRequestError("End date must be after start date");
        }
      }

      return await this.promotionService.updateById(id, updateData);
    } catch (error) {
      logger.error("Error updating promotion:", error);
      throw error;
    }
  }

  async deletePromotion(id) {
    try {
      // Check if promotion has been used
      const usageCount = await Promotion.count({
        where: { promotion_id: id },
      });
      if (usageCount > 0) {
        throw new BadRequestError("Cannot delete promotion that has been used");
      }

      return await this.promotionService.deleteById(id);
    } catch (error) {
      logger.error("Error deleting promotion:", error);
      throw error;
    }
  }

  // Bookings Management
  async getBookings(filters = {}, page = 1, limit = 10) {
    try {
      const whereClause = this.buildBookingWhereClause(filters);
      const options = {
        where: whereClause,
        include: [
          {
            model: User,
            attributes: ["user_id", "email", "first_name", "last_name"],
          },
          {
            model: BookingDetail,
            include: [
              {
                model: Flight,
                include: [
                  {
                    model: Airline,
                    attributes: ["airline_name", "airline_code"],
                  },
                  {
                    model: Airport,
                    as: "DepartureAirport",
                    attributes: ["airport_code", "airport_name", "city"],
                  },
                  {
                    model: Airport,
                    as: "ArrivalAirport",
                    attributes: ["airport_code", "airport_name", "city"],
                  },
                ],
              },
              {
                model: Passenger,
                attributes: [
                  "passenger_id",
                  "title",
                  "first_name",
                  "middle_name",
                  "last_name",
                  "citizen_id",
                  "passport_number",
                  "passport_issuing_country",
                  "passport_expiry",
                  "nationality",
                  "date_of_birth",
                  "passenger_type",
                ],
              },
              {
                model: FlightSeat,
                attributes: ["seat_id", "seat_number", "price"],
                include: [
                  {
                    model: TravelClass,
                    attributes: ["class_name", "class_code"],
                  },
                ],
              },
              {
                model: require("../models").FlightBaggageService,
                as: "BaggageService",
                attributes: [
                  "baggage_service_id",
                  "weight_kg",
                  "price",
                  "description",
                ],
                required: false,
              },
              {
                model: require("../models").FlightMealService,
                as: "MealService",
                attributes: [
                  "meal_service_id",
                  "meal_name",
                  "meal_description",
                  "price",
                ],
                required: false,
              },
            ],
          },
        ],
        order: [["booking_date", "DESC"]],
      };

      const result = await this.bookingService.findAll(options, page, limit);

      // Enhance bookings with ticket type counts
      const enhancedBookings = result.data.map((booking) => {
        const ticketTypeCounts = {};

        booking.BookingDetails.forEach((detail) => {
          const classCode =
            detail.FlightSeat?.TravelClass?.class_code || "unknown";
          if (!ticketTypeCounts[classCode]) {
            ticketTypeCounts[classCode] = {
              class_name:
                detail.FlightSeat?.TravelClass?.class_name || "Unknown",
              class_code: classCode,
              count: 0,
            };
          }
          ticketTypeCounts[classCode].count++;
        });

        return {
          ...booking.toJSON(),
          selected_baggage_services: booking.selected_baggage_services || [],
          selected_meal_services: booking.selected_meal_services || [],
          ticket_type_counts: Object.values(ticketTypeCounts),
        };
      });

      return {
        ...result,
        data: enhancedBookings,
      };
    } catch (error) {
      logger.error("Error getting bookings:", error);
      throw error;
    }
  }

  async getBooking(id) {
    try {
      const options = {
        include: [
          {
            model: User,
            attributes: ["user_id", "email", "first_name", "last_name"],
          },
          {
            model: BookingDetail,
            include: [
              {
                model: Flight,
                include: [
                  {
                    model: Airline,
                    attributes: ["airline_name", "airline_code"],
                  },
                  {
                    model: Airport,
                    as: "DepartureAirport",
                    attributes: ["airport_code", "airport_name", "city"],
                  },
                  {
                    model: Airport,
                    as: "ArrivalAirport",
                    attributes: ["airport_code", "airport_name", "city"],
                  },
                ],
              },
              {
                model: Passenger,
                attributes: [
                  "passenger_id",
                  "title",
                  "first_name",
                  "middle_name",
                  "last_name",
                  "citizen_id",
                  "passport_number",
                  "passport_issuing_country",
                  "passport_expiry",
                  "nationality",
                  "date_of_birth",
                  "passenger_type",
                ],
              },
            ],
          },
          {
            model: Payment,
            attributes: [
              "payment_id",
              "amount",
              "payment_method",
              "payment_reference",
              "payment_date",
              "status",
            ],
          },
        ],
      };

      // Build enriched booking response (include selected service packages, baggage and meal selections)
      const booking = await this.bookingService.findById(id, options);

      // Prepare arrays to attach
      const servicePackages = [];
      const baggageServices = [];
      const mealServices = [];

      // Derive unique flights from BookingDetails
      const details = booking.BookingDetails || [];
      const flightMap = new Map();
      details.forEach((detail) => {
        if (detail.Flight && !flightMap.has(detail.flight_id)) {
          flightMap.set(detail.flight_id, detail.Flight);
        }
      });
      const flights = Array.from(flightMap.values());

      const {
        BookingServicePackage,
        ServicePackage,
        FlightBaggageService,
        FlightMealService,
      } = require("../models");

      // Service packages selected for booking
      if (BookingServicePackage && ServicePackage && flights.length > 0) {
        for (const flightItem of flights) {
          const selectedPackages = await BookingServicePackage.findAll({
            where: {
              booking_id: booking.booking_id,
              flight_id: flightItem.flight_id,
            },
            include: [{ model: ServicePackage, required: true }],
          });

          if (selectedPackages.length > 0) {
            servicePackages.push({
              flight_id: flightItem.flight_id,
              flight_number: flightItem.flight_number,
              packages: selectedPackages.map((bsp) => {
                const pkg = bsp.ServicePackage;
                return {
                  package_id: pkg.package_id,
                  package_name: pkg.package_name,
                  package_code: pkg.package_code,
                  class_type: pkg.class_type,
                  package_type: pkg.package_type,
                  price_multiplier: pkg.price_multiplier,
                  description: pkg.description,
                  services_included: pkg.services_included,
                };
              }),
            });
          }
        }
      }

      // Baggage services
      if (FlightBaggageService && flights.length > 0) {
        try {
          const selectedBaggageServices = booking.selected_baggage_services
            ? JSON.parse(booking.selected_baggage_services)
            : [];

          for (const flightItem of flights) {
            const flightBaggage = await FlightBaggageService.findAll({
              where: { flight_id: flightItem.flight_id },
            });
            const matched = [];
            for (const selectedItem of selectedBaggageServices) {
              const serviceId =
                selectedItem.service_id || selectedItem.baggage_service_id;
              const matchingService = flightBaggage.find(
                (bs) => bs.baggage_service_id === serviceId
              );
              if (matchingService) {
                matched.push({
                  baggage_service_id: matchingService.baggage_service_id,
                  weight_kg: matchingService.weight_kg,
                  price: matchingService.price,
                  description: matchingService.description,
                  quantity: selectedItem.quantity || 1,
                });
              }
            }
            if (matched.length > 0) {
              baggageServices.push({
                flight_id: flightItem.flight_id,
                flight_number: flightItem.flight_number,
                services: matched,
              });
            }
          }
        } catch (err) {
          // ignore parse errors
          logger.warn(
            "Error parsing booking.selected_baggage_services:",
            err && err.message
          );
        }
      }

      // Meal services
      if (FlightMealService && flights.length > 0) {
        try {
          const selectedMealServices = booking.selected_meal_services
            ? JSON.parse(booking.selected_meal_services)
            : [];

          for (const flightItem of flights) {
            const flightMeals = await FlightMealService.findAll({
              where: { flight_id: flightItem.flight_id },
            });
            const matched = [];
            for (const selectedItem of selectedMealServices) {
              const serviceId =
                selectedItem.service_id || selectedItem.meal_service_id;
              const matchingService = flightMeals.find(
                (ms) => ms.meal_service_id === serviceId
              );
              if (matchingService) {
                matched.push({
                  meal_service_id: matchingService.meal_service_id,
                  meal_name: matchingService.meal_name,
                  meal_description: matchingService.meal_description,
                  price: matchingService.price,
                  is_vegetarian: matchingService.is_vegetarian,
                  is_halal: matchingService.is_halal,
                  quantity: selectedItem.quantity || 1,
                });
              }
            }
            if (matched.length > 0) {
              mealServices.push({
                flight_id: flightItem.flight_id,
                flight_number: flightItem.flight_number,
                services: matched,
              });
            }
          }
        } catch (err) {
          logger.warn(
            "Error parsing booking.selected_meal_services:",
            err && err.message
          );
        }
      }

      // Return enriched booking object (plain JSON)
      const bt = booking.toJSON();
      bt.service_packages = servicePackages;
      bt.baggage_services = baggageServices;
      bt.meal_services = mealServices;

      // Add contact_info similar to bookingController
      let contactInfo = null;
      const { Contact } = require("../models");

      if (Contact) {
        try {
          const contact = await Contact.findOne({
            where: { user_id: booking.user_id, is_primary: true },
            order: [["created_at", "DESC"]],
          });
          if (contact) {
            contactInfo = {
              first_name: contact.first_name,
              last_name: contact.last_name,
              email: contact.email,
              phone: contact.phone,
            };
          }
        } catch (err) {
          logger.warn("Error fetching contact info:", err);
        }
      }

      // Fallback to booking contact fields if no Contact record found
      if (!contactInfo) {
        contactInfo = {
          first_name: null,
          last_name: null,
          email: booking.contact_email,
          phone: booking.contact_phone,
        };
      }

      bt.contact_info = contactInfo;

      return bt;
    } catch (error) {
      logger.error("Error getting booking:", error);
      throw error;
    }
  }

  async updateBookingStatus(id, updateData) {
    try {
      return await this.bookingService.updateById(id, updateData);
    } catch (error) {
      logger.error("Error updating booking status:", error);
      throw error;
    }
  }

  async deleteBooking(id) {
    try {
      return await this.bookingService.deleteById(id);
    } catch (error) {
      logger.error("Error deleting booking:", error);
      throw error;
    }
  }

  // Users Management
  async getUsers(filters = {}, page = 1, limit = 10) {
    try {
      const whereClause = this.buildUserWhereClause(filters);
      const options = {
        where: whereClause,
        attributes: [
          "user_id",
          "email",
          "first_name",
          "last_name",
          "phone",
          "is_active",
          "created_at",
        ],
        include: [
          {
            model: Role,
            attributes: ["role_name"],
            through: { attributes: [] },
          },
        ],
        order: [["created_at", "DESC"]],
      };

      return await this.userService.findAll(options, page, limit);
    } catch (error) {
      logger.error("Error getting users:", error);
      throw error;
    }
  }

  async getUser(id) {
    try {
      const options = {
        attributes: [
          "user_id",
          "email",
          "first_name",
          "last_name",
          "phone",
          "date_of_birth",
          "is_active",
          "created_at",
        ],
        include: [
          {
            model: Role,
            attributes: ["role_name"],
            through: { attributes: [] },
          },
        ],
      };

      return await this.userService.findById(id, options);
    } catch (error) {
      logger.error("Error getting user:", error);
      throw error;
    }
  }

  async updateUser(id, updateData) {
    try {
      // Remove password from update data if present
      delete updateData.password;

      return await this.userService.updateById(id, updateData);
    } catch (error) {
      logger.error("Error updating user:", error);
      throw error;
    }
  }

  async updateUserStatus(id, is_active) {
    try {
      return await this.userService.updateById(id, { is_active });
    } catch (error) {
      logger.error("Error updating user status:", error);
      throw error;
    }
  }

  // Statistics and Reports
  async getOverviewStats() {
    try {
      const [
        totalUsers,
        totalBookings,
        totalRevenue,
        totalFlights,
        activePromotions,
      ] = await Promise.all([
        User.count(),
        Booking.count(),
        Booking.sum("total_amount", {
          where: { payment_status: "paid" },
        }),
        Flight.count(),
        Promotion.count({ where: { is_active: true } }),
      ]);

      return {
        total_users: totalUsers,
        total_bookings: totalBookings,
        total_revenue: totalRevenue || 0,
        total_flights: totalFlights,
        active_promotions: activePromotions,
      };
    } catch (error) {
      logger.error("Error getting overview stats:", error);
      throw error;
    }
  }

  async getRevenueStats(period = "month") {
    try {
      const now = new Date();
      let startDate;

      switch (period) {
        case "day":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const revenue = await Booking.sum("total_amount", {
        where: {
          payment_status: "paid",
          booking_date: {
            [Op.gte]: startDate,
          },
        },
      });

      const previousPeriodStart = new Date(
        startDate.getTime() - (now.getTime() - startDate.getTime())
      );
      const previousRevenue = await Booking.sum("total_amount", {
        where: {
          payment_status: "paid",
          booking_date: {
            [Op.gte]: previousPeriodStart,
            [Op.lt]: startDate,
          },
        },
      });

      const growthRate =
        previousRevenue > 0
          ? ((revenue - previousRevenue) / previousRevenue) * 100
          : 0;

      return {
        period,
        current_revenue: revenue || 0,
        previous_revenue: previousRevenue || 0,
        growth_rate: Math.round(growthRate * 100) / 100,
      };
    } catch (error) {
      logger.error("Error getting revenue stats:", error);
      throw error;
    }
  }

  async getBookingStats(period = "month") {
    try {
      const now = new Date();
      let startDate;

      switch (period) {
        case "day":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const [totalBookings, confirmedBookings, cancelledBookings] =
        await Promise.all([
          Booking.count({
            where: {
              booking_date: { [Op.gte]: startDate },
            },
          }),
          Booking.count({
            where: {
              status: "confirmed",
              booking_date: { [Op.gte]: startDate },
            },
          }),
          Booking.count({
            where: {
              status: "cancelled",
              booking_date: { [Op.gte]: startDate },
            },
          }),
        ]);

      return {
        period,
        total_bookings: totalBookings,
        confirmed_bookings: confirmedBookings,
        cancelled_bookings: cancelledBookings,
        confirmation_rate:
          totalBookings > 0
            ? Math.round((confirmedBookings / totalBookings) * 100)
            : 0,
      };
    } catch (error) {
      logger.error("Error getting booking stats:", error);
      throw error;
    }
  }

  async getAirlineStats() {
    try {
      const airlineStats = await Booking.findAll({
        attributes: [
          [
            sequelize.fn("COUNT", sequelize.col("Booking.booking_id")),
            "booking_count",
          ],
          [
            sequelize.fn("SUM", sequelize.col("Booking.total_amount")),
            "total_revenue",
          ],
        ],
        include: [
          {
            model: BookingDetail,
            attributes: [],
            include: [
              {
                model: Flight,
                attributes: [],
                include: [
                  {
                    model: Airline,
                    attributes: ["airline_name", "airline_code"],
                  },
                ],
              },
            ],
          },
        ],
        where: {
          payment_status: "paid",
        },
        group: [
          "BookingDetails.Flight.Airline.airline_id",
          "BookingDetails.Flight.Airline.airline_name",
          "BookingDetails.Flight.Airline.airline_code",
        ],
        order: [
          [sequelize.fn("COUNT", sequelize.col("Booking.booking_id")), "DESC"],
        ],
      });

      return airlineStats;
    } catch (error) {
      logger.error("Error getting airline stats:", error);
      throw error;
    }
  }

  async getPassengerStats(period = "month") {
    try {
      const now = new Date();
      let startDate;

      switch (period) {
        case "day":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const totalPassengers = await BookingDetail.count({
        include: [
          {
            model: Booking,
            where: {
              booking_date: { [Op.gte]: startDate },
            },
            attributes: [],
          },
        ],
      });

      return {
        period,
        total_passengers: totalPassengers,
      };
    } catch (error) {
      logger.error("Error getting passenger stats:", error);
      throw error;
    }
  }

  async getBaggageStats() {
    try {
      const baggageStats = await BookingDetail.findAll({
        attributes: [
          [
            sequelize.fn(
              "COUNT",
              sequelize.col("BookingDetail.booking_detail_id")
            ),
            "usage_count",
          ],
          [
            sequelize.fn("SUM", sequelize.col("BaggageOption.price")),
            "total_revenue",
          ],
        ],
        include: [
          {
            model: BaggageOption,
            attributes: ["weight_kg", "description"],
          },
        ],
        where: {
          baggage_option_id: { [Op.ne]: null },
        },
        group: [
          "BaggageOption.baggage_id",
          "BaggageOption.weight_kg",
          "BaggageOption.description",
        ],
        order: [
          [
            sequelize.fn(
              "COUNT",
              sequelize.col("BookingDetail.booking_detail_id")
            ),
            "DESC",
          ],
        ],
      });

      return baggageStats;
    } catch (error) {
      logger.error("Error getting baggage stats:", error);
      throw error;
    }
  }

  // Dashboard APIs
  async getWeeklyRevenueStats() {
    try {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      // Previous week
      const startOfPreviousWeek = new Date(startOfWeek);
      startOfPreviousWeek.setDate(startOfWeek.getDate() - 7);
      const endOfPreviousWeek = new Date(startOfPreviousWeek);
      endOfPreviousWeek.setDate(startOfPreviousWeek.getDate() + 6);
      endOfPreviousWeek.setHours(23, 59, 59, 999);

      const [currentWeekStats, previousWeekStats] = await Promise.all([
        Booking.findAll({
          attributes: [
            [
              sequelize.fn("COUNT", sequelize.col("booking_id")),
              "total_bookings",
            ],
            [
              sequelize.fn("SUM", sequelize.col("total_amount")),
              "total_revenue",
            ],
          ],
          where: {
            payment_status: "paid",
            booking_date: {
              [Op.between]: [startOfWeek, endOfWeek],
            },
          },
          raw: true,
        }),
        Booking.findAll({
          attributes: [
            [
              sequelize.fn("COUNT", sequelize.col("booking_id")),
              "total_bookings",
            ],
            [
              sequelize.fn("SUM", sequelize.col("total_amount")),
              "total_revenue",
            ],
          ],
          where: {
            payment_status: "paid",
            booking_date: {
              [Op.between]: [startOfPreviousWeek, endOfPreviousWeek],
            },
          },
          raw: true,
        }),
      ]);

      const currentRevenue = parseFloat(
        currentWeekStats[0]?.total_revenue || 0
      );
      const previousRevenue = parseFloat(
        previousWeekStats[0]?.total_revenue || 0
      );
      const currentBookings = parseInt(
        currentWeekStats[0]?.total_bookings || 0
      );

      const percentageChange =
        previousRevenue > 0
          ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
          : 0;

      return {
        period: "week",
        total_revenue: currentRevenue,
        total_bookings: currentBookings,
        percentage_change: Math.round(percentageChange * 100) / 100,
        previous_revenue: previousRevenue,
        week_start: startOfWeek,
        week_end: endOfWeek,
      };
    } catch (error) {
      logger.error("Error getting weekly revenue stats:", error);
      throw error;
    }
  }

  async getMonthlyRevenueStats() {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );

      const monthlyStats = await Booking.findAll({
        attributes: [
          [
            sequelize.fn("COUNT", sequelize.col("booking_id")),
            "total_bookings",
          ],
          [sequelize.fn("SUM", sequelize.col("total_amount")), "total_revenue"],
        ],
        where: {
          payment_status: "paid",
          booking_date: {
            [Op.between]: [startOfMonth, endOfMonth],
          },
        },
        raw: true,
      });

      return {
        period: "month",
        total_revenue: parseFloat(monthlyStats[0]?.total_revenue || 0),
        total_bookings: parseInt(monthlyStats[0]?.total_bookings || 0),
        month_start: startOfMonth,
        month_end: endOfMonth,
      };
    } catch (error) {
      logger.error("Error getting monthly revenue stats:", error);
      throw error;
    }
  }

  async getTodayBookingStats() {
    try {
      const today = new Date();
      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const endOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        23,
        59,
        59,
        999
      );

      const [bookingStats, passengerStats] = await Promise.all([
        Booking.count({
          where: {
            booking_date: {
              [Op.between]: [startOfDay, endOfDay],
            },
          },
        }),
        BookingDetail.count({
          include: [
            {
              model: Booking,
              where: {
                booking_date: {
                  [Op.between]: [startOfDay, endOfDay],
                },
              },
              attributes: [],
            },
          ],
        }),
      ]);

      return {
        date: today,
        total_bookings: bookingStats,
        total_tickets_sold: passengerStats,
      };
    } catch (error) {
      logger.error("Error getting today booking stats:", error);
      throw error;
    }
  }

  async getUserStatistics() {
    try {
      const [totalUsers, totalPassengers] = await Promise.all([
        User.count(),
        Passenger.count(),
      ]);

      const passengerRatio =
        totalUsers > 0 ? (totalPassengers / totalUsers) * 100 : 0;

      return {
        total_users: totalUsers,
        total_passengers: totalPassengers,
        passenger_ratio: Math.round(passengerRatio * 100) / 100,
      };
    } catch (error) {
      logger.error("Error getting user statistics:", error);
      throw error;
    }
  }

  async getAirlineMarketShare(period = "month") {
    try {
      const now = new Date();
      let startDate = new Date(now);

      switch (period) {
        case "7days":
          startDate.setDate(now.getDate() - 7);
          break;

        case "14days":
          startDate.setDate(now.getDate() - 14);
          break;

        case "month": // 1 month before
          startDate.setMonth(now.getMonth() - 1);
          break;

        case "3months":
          startDate.setMonth(now.getMonth() - 3);
          break;

        case "6months":
          startDate.setMonth(now.getMonth() - 6);
          break;

        case "12months":
          startDate.setMonth(now.getMonth() - 12);
          break;

        default:
          startDate.setMonth(now.getMonth() - 1);
      }

      const airlineStats = await BookingDetail.findAll({
        attributes: [
          [
            sequelize.fn(
              "COUNT",
              sequelize.col("BookingDetail.booking_detail_id")
            ),
            "ticket_count",
          ],
          [sequelize.col("Flight.Airline.airline_id"), "airline_id"],
          [sequelize.col("Flight.Airline.airline_name"), "airline_name"],
          [sequelize.col("Flight.Airline.airline_code"), "airline_code"],
        ],
        include: [
          {
            model: Booking,
            where: {
              payment_status: "paid",
              booking_date: {
                [Op.gte]: startDate,
              },
            },
            attributes: [],
          },
          {
            model: Flight,
            attributes: [],
            include: [
              {
                model: Airline,
                attributes: ["airline_id", "airline_name", "airline_code"],
              },
            ],
          },
        ],
        group: [
          "Flight.Airline.airline_id",
          "Flight.Airline.airline_name",
          "Flight.Airline.airline_code",
        ],
        order: [
          [
            sequelize.fn(
              "COUNT",
              sequelize.col("BookingDetail.booking_detail_id")
            ),
            "DESC",
          ],
        ],
        raw: true,
      });

      // Calculate total tickets and percentages
      const totalTickets = airlineStats.reduce(
        (sum, stat) => sum + parseInt(stat.ticket_count),
        0
      );

      const marketShareData = airlineStats.map((stat) => {
        const ticketCount = parseInt(stat.ticket_count);
        const percentage =
          totalTickets > 0 ? (ticketCount / totalTickets) * 100 : 0;

        return {
          airline_id: stat.airline_id,
          airline_code: stat.airline_code,
          airline_name: stat.airline_name,
          ticket_count: ticketCount,
          market_share_percentage: Math.round(percentage * 100) / 100,
        };
      });

      return {
        period,
        period_start: startDate,
        period_end: now,
        total_tickets: totalTickets,
        airlines: marketShareData,
      };
    } catch (error) {
      logger.error("Error getting airline market share:", error);
      throw error;
    }
  }

  async getRevenueTrend(month, year) {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      // Get daily revenue data
      const dailyRevenue = await Booking.findAll({
        attributes: [
          [sequelize.fn("DATE", sequelize.col("booking_date")), "date"],
          [sequelize.fn("COUNT", sequelize.col("booking_id")), "orders_count"],
          [sequelize.fn("SUM", sequelize.col("total_amount")), "revenue"],
        ],
        where: {
          payment_status: "paid",
          booking_date: {
            [Op.between]: [startDate, endDate],
          },
        },
        group: [sequelize.fn("DATE", sequelize.col("booking_date"))],
        order: [[sequelize.fn("DATE", sequelize.col("booking_date")), "ASC"]],
        raw: true,
      });

      // Calculate totals
      const totalOrders = dailyRevenue.reduce(
        (sum, day) => sum + parseInt(day.orders_count),
        0
      );
      const totalRevenue = dailyRevenue.reduce(
        (sum, day) => sum + parseFloat(day.revenue || 0),
        0
      );

      // Format daily data
      const formattedDailyRevenue = dailyRevenue.map((day) => ({
        date: day.date,
        orders_count: parseInt(day.orders_count),
        revenue: parseFloat(day.revenue || 0),
      }));

      return {
        month,
        year,
        month_start: startDate,
        month_end: endDate,
        total_orders: totalOrders,
        total_revenue: totalRevenue,
        daily_revenue: formattedDailyRevenue,
      };
    } catch (error) {
      logger.error("Error getting revenue trend:", error);
      throw error;
    }
  }

  async getBookingStatistics(period = "month") {
    try {
      const now = new Date();
      let startDate = new Date(now);

      switch (period) {
        case "7days":
          startDate.setDate(now.getDate() - 7);
          break;

        case "14days":
          startDate.setDate(now.getDate() - 14);
          break;

        case "month": // 1 month before
          startDate.setMonth(now.getMonth() - 1);
          break;

        case "3months":
          startDate.setMonth(now.getMonth() - 3);
          break;

        case "6months":
          startDate.setMonth(now.getMonth() - 6);
          break;

        case "12months":
          startDate.setMonth(now.getMonth() - 12);
          break;

        default:
          startDate.setMonth(now.getMonth() - 1);
      }


      // Get daily booking statistics
      const dailyStats = await Booking.findAll({
        attributes: [
          [sequelize.fn("DATE", sequelize.col("booking_date")), "date"],
          [
            sequelize.fn("COUNT", sequelize.col("booking_id")),
            "bookings_count",
          ],
        ],
        where: {
          booking_date: {
            [Op.gte]: startDate,
          },
        },
        group: [sequelize.fn("DATE", sequelize.col("booking_date"))],
        order: [[sequelize.fn("DATE", sequelize.col("booking_date")), "ASC"]],
        raw: true,
      });

      // Get daily passenger statistics
      const dailyPassengers = await BookingDetail.findAll({
        attributes: [
          [sequelize.fn("DATE", sequelize.col("Booking.booking_date")), "date"],
          [
            sequelize.fn(
              "COUNT",
              sequelize.col("BookingDetail.booking_detail_id")
            ),
            "passengers_count",
          ],
        ],
        include: [
          {
            model: Booking,
            where: {
              booking_date: {
                [Op.gte]: startDate,
              },
            },
            attributes: [],
          },
        ],
        group: [sequelize.fn("DATE", sequelize.col("Booking.booking_date"))],
        order: [
          [sequelize.fn("DATE", sequelize.col("Booking.booking_date")), "ASC"],
        ],
        raw: true,
      });

      // Merge daily stats
      const dailyStatsMap = new Map();
      dailyStats.forEach((stat) => {
        dailyStatsMap.set(stat.date, {
          date: stat.date,
          bookings_count: parseInt(stat.bookings_count),
          passengers_count: 0,
        });
      });

      dailyPassengers.forEach((stat) => {
        if (dailyStatsMap.has(stat.date)) {
          dailyStatsMap.get(stat.date).passengers_count = parseInt(
            stat.passengers_count
          );
        } else {
          dailyStatsMap.set(stat.date, {
            date: stat.date,
            bookings_count: 0,
            passengers_count: parseInt(stat.passengers_count),
          });
        }
      });

      const formattedDailyStats = Array.from(dailyStatsMap.values()).sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

      // Calculate totals
      const totalBookings = formattedDailyStats.reduce(
        (sum, day) => sum + day.bookings_count,
        0
      );
      const totalPassengers = formattedDailyStats.reduce(
        (sum, day) => sum + day.passengers_count,
        0
      );

      return {
        period,
        period_start: startDate,
        period_end: now,
        total_bookings: totalBookings,
        total_passengers: totalPassengers,
        daily_stats: formattedDailyStats,
      };
    } catch (error) {
      logger.error("Error getting booking statistics:", error);
      throw error;
    }
  }

  async getBaggageServiceStatistics(period = "month") {
    try {
      const now = new Date();
      let startDate = new Date(now);

      switch (period) {
        case "7days":
          startDate.setDate(now.getDate() - 7);
          break;

        case "14days":
          startDate.setDate(now.getDate() - 14);
          break;

        case "month": // 1 month before
          startDate.setMonth(now.getMonth() - 1);
          break;

        case "3months":
          startDate.setMonth(now.getMonth() - 3);
          break;

        case "6months":
          startDate.setMonth(now.getMonth() - 6);
          break;

        case "12months":
          startDate.setMonth(now.getMonth() - 12);
          break;

        default:
          startDate.setMonth(now.getMonth() - 1);
      }


      // Get baggage service statistics
      const baggageStats = await BookingDetail.findAll({
        attributes: [
          [
            sequelize.fn(
              "COUNT",
              sequelize.col("BookingDetail.booking_detail_id")
            ),
            "usage_count",
          ],
          [
            sequelize.fn("SUM", sequelize.col("BaggageOption.price")),
            "total_revenue",
          ],
        ],
        include: [
          {
            model: Booking,
            where: {
              payment_status: "paid",
              booking_date: {
                [Op.gte]: startDate,
              },
            },
            attributes: [],
          },
          {
            model: BaggageOption,
            attributes: ["baggage_id", "weight_kg", "description", "price"],
          },
        ],
        where: {
          baggage_option_id: { [Op.ne]: null },
        },
        group: [
          "BaggageOption.baggage_id",
          "BaggageOption.weight_kg",
          "BaggageOption.description",
          "BaggageOption.price",
        ],
        order: [
          [
            sequelize.fn(
              "COUNT",
              sequelize.col("BookingDetail.booking_detail_id")
            ),
            "DESC",
          ],
        ],
      });

      // Calculate totals
      const totalOrders = baggageStats.reduce(
        (sum, stat) => sum + parseInt(stat.dataValues.usage_count),
        0
      );
      const totalRevenue = baggageStats.reduce(
        (sum, stat) => sum + parseFloat(stat.dataValues.total_revenue || 0),
        0
      );

      // Format baggage data
      const formattedBaggageStats = baggageStats.map((stat) => ({
        baggage_id: stat.BaggageOption.baggage_id,
        weight_kg: stat.BaggageOption.weight_kg,
        description: stat.BaggageOption.description,
        unit_price: parseFloat(stat.BaggageOption.price),
        usage_count: parseInt(stat.dataValues.usage_count),
        total_revenue: parseFloat(stat.dataValues.total_revenue || 0),
      }));

      return {
        period,
        period_start: startDate,
        period_end: now,
        total_orders: totalOrders,
        total_revenue: totalRevenue,
        baggage_services: formattedBaggageStats,
      };
    } catch (error) {
      logger.error("Error getting baggage service statistics:", error);
      throw error;
    }
  }

  // Helper methods for building WHERE clauses
  buildAirlineWhereClause(filters) {
    const whereClause = {};

    if (filters.search) {
      whereClause[Op.or] = [
        { airline_name: { [Op.like]: `%${filters.search}%` } },
        { airline_code: { [Op.like]: `%${filters.search}%` } },
      ];
    }

    if (filters.airline_code) {
      whereClause.airline_code = {
        [Op.like]: `%${filters.airline_code}%`,
      };
    }

    if (filters.airline_name) {
      whereClause.airline_name = {
        [Op.like]: `%${filters.airline_name}%`,
      };
    }

    if (filters.country_id) {
      whereClause.country_id = filters.country_id;
    }

    if (filters.is_active !== undefined) {
      whereClause.is_active = filters.is_active;
    }

    return whereClause;
  }

  buildAirportWhereClause(filters) {
    const whereClause = {};

    if (filters.search) {
      whereClause[Op.or] = [
        { airport_name: { [Op.like]: `%${filters.search}%` } },
        { airport_code: { [Op.like]: `%${filters.search}%` } },
        { city: { [Op.like]: `%${filters.search}%` } },
      ];
    }

    if (filters.airport_code) {
      whereClause.airport_code = {
        [Op.like]: `%${filters.airport_code}%`,
      };
    }

    if (filters.airport_name) {
      whereClause.airport_name = {
        [Op.like]: `%${filters.airport_name}%`,
      };
    }

    if (filters.city) {
      whereClause.city = { [Op.like]: `%${filters.city}%` };
    }

    if (filters.airport_type) {
      whereClause.airport_type = filters.airport_type;
    }

    if (filters.country_id) {
      whereClause.country_id = filters.country_id;
    }

    return whereClause;
  }

  buildCountryWhereClause(filters) {
    const whereClause = {};

    if (filters.search) {
      whereClause[Op.or] = [
        { country_name: { [Op.like]: `%${filters.search}%` } },
        { country_code: { [Op.like]: `%${filters.search}%` } },
      ];
    }

    return whereClause;
  }

  buildAircraftWhereClause(filters) {
    const whereClause = {};

    if (filters.search) {
      whereClause[Op.or] = [
        { model: { [Op.like]: `%${filters.search}%` } },
        { aircraft_type: { [Op.like]: `%${filters.search}%` } },
      ];
    }

    if (filters.aircraft_id) {
      whereClause.aircraft_id = filters.aircraft_id;
    }

    if (filters.model) {
      whereClause.model = { [Op.like]: `%${filters.model}%` };
    }

    if (filters.airline_id) {
      whereClause.airline_id = filters.airline_id;
    }

    if (filters.aircraft_type) {
      whereClause.aircraft_type = {
        [Op.like]: `%${filters.aircraft_type}%`,
      };
    }

    return whereClause;
  }

  buildPassengerWhereClause(filters) {
    const whereClause = {};
    const orConditions = [];

    if (filters.search) {
      orConditions.push(
        { first_name: { [Op.like]: `%${filters.search}%` } },
        { last_name: { [Op.like]: `%${filters.search}%` } },
        { passport_number: { [Op.like]: `%${filters.search}%` } },
        { citizen_id: { [Op.like]: `%${filters.search}%` } }
      );
    }

    if (filters.passenger_id) {
      whereClause.passenger_id = filters.passenger_id;
    }

    if (filters.first_name) {
      whereClause.first_name = { [Op.like]: `%${filters.first_name}%` };
    }

    if (filters.last_name) {
      whereClause.last_name = { [Op.like]: `%${filters.last_name}%` };
    }

    if (filters.title) {
      whereClause.title = filters.title;
    }

    if (filters.passport_number) {
      orConditions.push(
        {
          passport_number: {
            [Op.like]: `%${filters.passport_number}%`,
          },
        },
        { citizen_id: { [Op.like]: `%${filters.passport_number}%` } }
      );
    }

    if (filters.citizen_id) {
      orConditions.push(
        { citizen_id: { [Op.like]: `%${filters.citizen_id}%` } },
        { passport_number: { [Op.like]: `%${filters.citizen_id}%` } }
      );
    }

    if (filters.date_of_birth) {
      whereClause.date_of_birth = filters.date_of_birth;
    }

    if (filters.nationality) {
      whereClause.nationality = { [Op.like]: `%${filters.nationality}%` };
    }

    if (filters.passenger_type) {
      whereClause.passenger_type = filters.passenger_type;
    }

    if (orConditions.length > 0) {
      whereClause[Op.or] = orConditions;
    }

    return whereClause;
  }

  buildPromotionWhereClause(filters) {
    const whereClause = {};

    if (filters.search) {
      whereClause[Op.or] = [
        { promotion_code: { [Op.like]: `%${filters.search}%` } },
        { description: { [Op.like]: `%${filters.search}%` } },
      ];
    }

    if (filters.promotion_code) {
      whereClause.promotion_code = {
        [Op.like]: `%${filters.promotion_code}%`,
      };
    }

    if (filters.description) {
      whereClause.description = { [Op.like]: `%${filters.description}%` };
    }

    if (filters.discount_type) {
      whereClause.discount_type = filters.discount_type;
    }

    if (filters.is_active !== undefined) {
      whereClause.is_active = filters.is_active;
    }

    return whereClause;
  }

  buildBookingWhereClause(filters) {
    const whereClause = {};

    if (filters.search) {
      whereClause[Op.or] = [
        { booking_reference: { [Op.like]: `%${filters.search}%` } },
        { contact_email: { [Op.like]: `%${filters.search}%` } },
      ];
    }

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.payment_status) {
      whereClause.payment_status = filters.payment_status;
    }

    if (filters.date_from || filters.date_to) {
      whereClause.booking_date = {};
      if (filters.date_from) {
        whereClause.booking_date[Op.gte] = new Date(filters.date_from);
      }
      if (filters.date_to) {
        whereClause.booking_date[Op.lte] = new Date(filters.date_to);
      }
    }

    return whereClause;
  }

  buildUserWhereClause(filters) {
    const whereClause = {};

    if (filters.search) {
      whereClause[Op.or] = [
        { email: { [Op.like]: `%${filters.search}%` } },
        { first_name: { [Op.like]: `%${filters.search}%` } },
        { last_name: { [Op.like]: `%${filters.search}%` } },
      ];
    }

    if (filters.is_active !== undefined) {
      whereClause.is_active = filters.is_active;
    }

    return whereClause;
  }

  // Travel Classes Management
  async getTravelClasses(filters = {}, page = 1, limit = 10) {
    try {
      const whereClause = this.buildTravelClassWhereClause(filters);
      const options = {
        where: whereClause,
        order: [["class_name", "ASC"]],
      };

      return await this.travelClassService.findAll(options, page, limit);
    } catch (error) {
      logger.error("Error getting travel classes:", error);
      throw error;
    }
  }

  async getTravelClass(id) {
    try {
      return await this.travelClassService.findById(id);
    } catch (error) {
      logger.error("Error getting travel class:", error);
      throw error;
    }
  }

  async createTravelClass(travelClassData) {
    try {
      // Check if class code already exists
      const existingTravelClass = await TravelClass.findOne({
        where: { class_code: travelClassData.class_code },
      });

      if (existingTravelClass) {
        throw new BadRequestError("Travel class code already exists");
      }

      return await this.travelClassService.create(travelClassData);
    } catch (error) {
      logger.error("Error creating travel class:", error);
      throw error;
    }
  }

  async updateTravelClass(id, updateData) {
    try {
      // Check if class code already exists (excluding current record)
      if (updateData.class_code) {
        const existingTravelClass = await TravelClass.findOne({
          where: {
            class_code: updateData.class_code,
            class_id: { [Op.ne]: id },
          },
        });

        if (existingTravelClass) {
          throw new BadRequestError("Travel class code already exists");
        }
      }

      return await this.travelClassService.updateById(id, updateData);
    } catch (error) {
      logger.error("Error updating travel class:", error);
      throw error;
    }
  }

  async deleteTravelClass(id) {
    try {
      // Check if travel class has associated flight seats
      const flightSeatCount = await FlightSeat.count({
        where: { class_id: id },
      });
      if (flightSeatCount > 0) {
        throw new BadRequestError(
          "Cannot delete travel class with associated flight seats"
        );
      }

      return await this.travelClassService.deleteById(id);
    } catch (error) {
      logger.error("Error deleting travel class:", error);
      throw error;
    }
  }

  // Baggage Options Management
  async getBaggageOptions(filters = {}, page = 1, limit = 10) {
    try {
      const whereClause = this.buildBaggageOptionWhereClause(filters);
      const options = {
        where: whereClause,
        include: [
          {
            model: Airline,
            attributes: ["airline_id", "airline_name", "airline_code"],
          },
        ],
        order: [["weight_kg", "ASC"]],
      };

      return await this.baggageOptionService.findAll(options, page, limit);
    } catch (error) {
      logger.error("Error getting baggage options:", error);
      throw error;
    }
  }

  async getBaggageOption(id) {
    try {
      const options = {
        include: [
          {
            model: Airline,
            attributes: ["airline_id", "airline_name", "airline_code"],
          },
        ],
      };

      return await this.baggageOptionService.findById(id, options);
    } catch (error) {
      logger.error("Error getting baggage option:", error);
      throw error;
    }
  }

  async createBaggageOption(baggageOptionData) {
    try {
      // Verify airline exists
      const airline = await Airline.findByPk(baggageOptionData.airline_id);
      if (!airline) {
        throw new BadRequestError("Airline not found");
      }

      return await this.baggageOptionService.create(baggageOptionData);
    } catch (error) {
      logger.error("Error creating baggage option:", error);
      throw error;
    }
  }

  async updateBaggageOption(id, updateData) {
    try {
      // Verify airline exists if provided
      if (updateData.airline_id) {
        const airline = await Airline.findByPk(updateData.airline_id);
        if (!airline) {
          throw new BadRequestError("Airline not found");
        }
      }

      return await this.baggageOptionService.updateById(id, updateData);
    } catch (error) {
      logger.error("Error updating baggage option:", error);
      throw error;
    }
  }

  async deleteBaggageOption(id) {
    try {
      // Check if baggage option has been used in bookings
      const bookingDetailCount = await BookingDetail.count({
        where: { baggage_option_id: id },
      });
      if (bookingDetailCount > 0) {
        throw new BadRequestError(
          "Cannot delete baggage option that has been used in bookings"
        );
      }

      return await this.baggageOptionService.deleteById(id);
    } catch (error) {
      logger.error("Error deleting baggage option:", error);
      throw error;
    }
  }

  // Meal Options Management
  async getMealOptions(filters = {}, page = 1, limit = 10) {
    try {
      const whereClause = this.buildMealOptionWhereClause(filters);
      const options = {
        where: whereClause,
        include: [
          {
            model: Airline,
            attributes: ["airline_id", "airline_name", "airline_code"],
          },
        ],
        order: [["meal_name", "ASC"]],
      };

      return await this.mealOptionService.findAll(options, page, limit);
    } catch (error) {
      logger.error("Error getting meal options:", error);
      throw error;
    }
  }

  async getMealOption(id) {
    try {
      const options = {
        include: [
          {
            model: Airline,
            attributes: ["airline_id", "airline_name", "airline_code"],
          },
        ],
      };

      return await this.mealOptionService.findById(id, options);
    } catch (error) {
      logger.error("Error getting meal option:", error);
      throw error;
    }
  }

  async createMealOption(mealOptionData) {
    try {
      // Verify airline exists
      const airline = await Airline.findByPk(mealOptionData.airline_id);
      if (!airline) {
        throw new BadRequestError("Airline not found");
      }

      return await this.mealOptionService.create(mealOptionData);
    } catch (error) {
      logger.error("Error creating meal option:", error);
      throw error;
    }
  }

  async updateMealOption(id, updateData) {
    try {
      // Verify airline exists if provided
      if (updateData.airline_id) {
        const airline = await Airline.findByPk(updateData.airline_id);
        if (!airline) {
          throw new BadRequestError("Airline not found");
        }
      }

      return await this.mealOptionService.updateById(id, updateData);
    } catch (error) {
      logger.error("Error updating meal option:", error);
      throw error;
    }
  }

  async deleteMealOption(id) {
    try {
      // Check if meal option has been used in bookings
      const bookingDetailCount = await BookingDetail.count({
        where: { meal_option_id: id },
      });
      if (bookingDetailCount > 0) {
        throw new BadRequestError(
          "Cannot delete meal option that has been used in bookings"
        );
      }

      return await this.mealOptionService.deleteById(id);
    } catch (error) {
      logger.error("Error deleting meal option:", error);
      throw error;
    }
  }

  // Helper methods for building WHERE clauses
  buildTravelClassWhereClause(filters) {
    const whereClause = {};

    if (filters.search) {
      whereClause[Op.or] = [
        { class_name: { [Op.like]: `%${filters.search}%` } },
        { class_code: { [Op.like]: `%${filters.search}%` } },
      ];
    }

    return whereClause;
  }

  buildBaggageOptionWhereClause(filters) {
    const whereClause = {};

    if (filters.search) {
      whereClause.description = { [Op.like]: `%${filters.search}%` };
    }

    if (filters.airline_id) {
      whereClause.airline_id = filters.airline_id;
    }

    return whereClause;
  }

  buildMealOptionWhereClause(filters) {
    const whereClause = {};

    if (filters.search) {
      whereClause[Op.or] = [
        { meal_name: { [Op.like]: `%${filters.search}%` } },
        { meal_description: { [Op.like]: `%${filters.search}%` } },
      ];
    }

    if (filters.airline_id) {
      whereClause.airline_id = filters.airline_id;
    }

    if (filters.is_vegetarian !== undefined) {
      whereClause.is_vegetarian = filters.is_vegetarian;
    }

    if (filters.is_halal !== undefined) {
      whereClause.is_halal = filters.is_halal;
    }

    return whereClause;
  }

  // Flight Management
  async getFlights(filters = {}, page = 1, limit = 10) {
    try {
      const whereClause = this.buildFlightWhereClause(filters);

      // flight_type filter is applied directly via `whereClause.flight_type`

      const options = {
        where: whereClause,
        include: [
          {
            model: Airline,
            attributes: ["airline_id", "airline_name", "airline_code"],
          },
          {
            model: Aircraft,
            attributes: [
              "aircraft_id",
              "model",
              "aircraft_type",
              "business_seats",
              "economy_seats",
            ],
          },
          {
            model: Airport,
            as: "DepartureAirport",
            attributes: [
              "airport_id",
              "airport_code",
              "airport_name",
              "city",
              "country_id",
            ],
            include: [
              {
                model: Country,
                attributes: ["country_id", "country_name", "country_code"],
              },
            ],
          },
          {
            model: Airport,
            as: "ArrivalAirport",
            attributes: [
              "airport_id",
              "airport_code",
              "airport_name",
              "city",
              "country_id",
            ],
            include: [
              {
                model: Country,
                attributes: ["country_id", "country_name", "country_code"],
              },
            ],
          },
          {
            model: require("../models").FlightBaggageService,
            as: "baggage_services",
            attributes: [
              "baggage_service_id",
              "weight_kg",
              "price",
              "description",
              "is_active",
            ],
            where: { is_active: true },
            required: false,
          },
          {
            model: require("../models").FlightMealService,
            as: "meal_services",
            attributes: [
              "meal_service_id",
              "meal_name",
              "meal_description",
              "price",
              "is_vegetarian",
              "is_halal",
              "is_active",
            ],
            where: { is_active: true },
            required: false,
          },
        ],
        order: [["departure_time", "DESC"]],
      };

      let result = await this.flightService.findAll(options, page, limit);

      // flight_type filtering is handled directly in the SQL `whereClause`

      // Enhance flights with seat availability
      const enhancedFlights = await Promise.all(
        result.data.map(async (flight) => {
          // Get seat availability
          const totalSeats = await FlightSeat.count({
            where: { flight_id: flight.flight_id },
          });

          const availableSeats = await FlightSeat.count({
            where: {
              flight_id: flight.flight_id,
              is_available: true,
            },
          });

          // Get BUS and ECO seat counts
          const busSeatsAvailable = await FlightSeat.count({
            where: {
              flight_id: flight.flight_id,
              is_available: true,
            },
            include: [
              {
                model: TravelClass,
                where: { class_code: "BUSINESS" },
              },
            ],
          });

          const busSeatsTotal = await FlightSeat.count({
            where: { flight_id: flight.flight_id },
            include: [
              {
                model: TravelClass,
                where: { class_code: "BUSINESS" },
              },
            ],
          });

          const ecoSeatsAvailable = await FlightSeat.count({
            where: {
              flight_id: flight.flight_id,
              is_available: true,
            },
            include: [
              {
                model: TravelClass,
                where: { class_code: "ECONOMY" },
              },
            ],
          });

          const ecoSeatsTotal = await FlightSeat.count({
            where: { flight_id: flight.flight_id },
            include: [
              {
                model: TravelClass,
                where: { class_code: "ECONOMY" },
              },
            ],
          });

          // Get prices
          const busPrice = await FlightSeat.findOne({
            where: {
              flight_id: flight.flight_id,
              is_available: true,
            },
            include: [
              {
                model: TravelClass,
                where: { class_code: "BUSINESS" },
              },
            ],
            order: [["price", "ASC"]],
            limit: 1,
          });

          const ecoPrice = await FlightSeat.findOne({
            where: {
              flight_id: flight.flight_id,
              is_available: true,
            },
            include: [
              {
                model: TravelClass,
                where: { class_code: "ECONOMY" },
              },
            ],
            order: [["price", "ASC"]],
            limit: 1,
          });

          // Determine flight type display (Vietnamese) for UI, but take
          // the definitive `flight_type` from the persisted record.
          const depCountryId = flight.DepartureAirport?.country_id;
          const arrCountryId = flight.ArrivalAirport?.country_id;
          const isDomestic =
            depCountryId && arrCountryId && depCountryId === arrCountryId;
          const flightTypeDisplay = isDomestic ? "Nội địa" : "Quốc tế";

          const persistedFlightType = flight.flight_type;

          return {
            ...flight.toJSON(),
            aircraft_type_display: flightTypeDisplay,
            // Use persisted value from `flights.flight_type`
            flight_type: persistedFlightType,
            bus_seats_available: busSeatsAvailable,
            bus_seats_total: busSeatsTotal,
            eco_seats_available: ecoSeatsAvailable,
            eco_seats_total: ecoSeatsTotal,
            bus_price: busPrice?.price || 0,
            eco_price: ecoPrice?.price || 0,
            is_active:
              flight.status === "scheduled" || flight.status === "delayed",
          };
        })
      );

      return {
        ...result,
        data: enhancedFlights,
      };
    } catch (error) {
      logger.error("Error getting flights:", error);
      throw error;
    }
  }

  buildFlightWhereClause(filters) {
    const whereClause = {};
    const normalize = (s) =>
      String(s)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

    if (filters.flight_number) {
      whereClause.flight_number = {
        [Op.like]: `%${filters.flight_number}%`,
      };
    }

    if (filters.airline_id) {
      whereClause.airline_id = filters.airline_id;
    }

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.departure_airport_id) {
      whereClause.departure_airport_id = filters.departure_airport_id;
    }

    if (filters.arrival_airport_id) {
      whereClause.arrival_airport_id = filters.arrival_airport_id;
    }

    // Handle departure time range
    if (filters.departure_time_from || filters.departure_time_to) {
      whereClause.departure_time = {};
      if (filters.departure_time_from) {
        whereClause.departure_time[Op.gte] = new Date(
          filters.departure_time_from
        );
      }
      if (filters.departure_time_to) {
        whereClause.departure_time[Op.lte] = new Date(
          filters.departure_time_to
        );
      }
    }

    // Handle arrival time range
    if (filters.arrival_time_from || filters.arrival_time_to) {
      whereClause.arrival_time = {};
      if (filters.arrival_time_from) {
        whereClause.arrival_time[Op.gte] = new Date(filters.arrival_time_from);
      }
      if (filters.arrival_time_to) {
        whereClause.arrival_time[Op.lte] = new Date(filters.arrival_time_to);
      }
    }

    // Normalize and apply flight_type filter directly to SQL (persisted column)
    if (filters.flight_type) {
      const ft = normalize(filters.flight_type || "");
      if (
        ft.includes("quoc") ||
        ft.includes("quocte") ||
        ft.includes("international") ||
        ft.startsWith("int")
      ) {
        whereClause.flight_type = "international";
      } else if (
        ft.includes("noi") ||
        ft.includes("noi dia") ||
        ft.includes("nội") ||
        ft.includes("domestic") ||
        ft.startsWith("dom")
      ) {
        whereClause.flight_type = "domestic";
      } else {
        // pass-through unknown — may result in no matches
        whereClause.flight_type = ft;
      }
    }

    return whereClause;
  }

  async createFlight(flightData) {
    try {
      // Validate that airline exists
      const airline = await Airline.findByPk(flightData.airline_id);
      if (!airline) {
        throw new BadRequestError("Airline not found");
      }

      // Validate that aircraft exists
      const aircraft = await Aircraft.findByPk(flightData.aircraft_id);
      if (!aircraft) {
        throw new BadRequestError("Aircraft not found");
      }

      // Validate that airports exist
      const departureAirport = await Airport.findByPk(
        flightData.departure_airport_id
      );
      if (!departureAirport) {
        throw new BadRequestError("Departure airport not found");
      }

      const arrivalAirport = await Airport.findByPk(
        flightData.arrival_airport_id
      );
      if (!arrivalAirport) {
        throw new BadRequestError("Arrival airport not found");
      }

      // Validate departure and arrival airports are different
      if (flightData.departure_airport_id === flightData.arrival_airport_id) {
        throw new BadRequestError(
          "Departure and arrival airports must be different"
        );
      }

      // Validate arrival time is after departure time
      if (
        new Date(flightData.arrival_time) <= new Date(flightData.departure_time)
      ) {
        throw new BadRequestError("Arrival time must be after departure time");
      }

      // Check if flight number already exists for this airline
      const existingFlight = await Flight.findOne({
        where: {
          flight_number: flightData.flight_number,
          airline_id: flightData.airline_id,
        },
      });

      if (existingFlight) {
        throw new BadRequestError(
          "Flight number already exists for this airline"
        );
      }

      // Normalize and persist flight_type if provided (accepts 'domestic'|'international' or Vietnamese variants)
      if (flightData.flight_type) {
        const normalize = (s) =>
          String(s)
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();

        const ft = normalize(flightData.flight_type);
        if (
          ft.includes("quoc") ||
          ft.includes("quocte") ||
          ft.includes("international") ||
          ft.startsWith("int")
        ) {
          flightData.flight_type = "international";
        } else if (
          ft.includes("noi") ||
          ft.includes("noi dia") ||
          ft.includes("nội") ||
          ft.includes("domestic") ||
          ft.startsWith("dom")
        ) {
          flightData.flight_type = "domestic";
        } else {
          // leave as-is if unknown; DB will accept only allowed enums and may error
        }
      } else {
        // If no flight_type provided, default to 'domestic'
        flightData.flight_type = "domestic";
      }

      // Create the flight with normalized flight_type
      let flight = await this.flightService.create(flightData);

      // Ensure flight seats are created to exactly match the Aircraft
      // configuration. Force a rebuild so any preexisting/truncated
      // seats are replaced with the correct set.
      await this.syncFlightSeats(flight.flight_id, { force: true });

      // Create flight services if provided
      if (
        flightData.baggage_services &&
        flightData.baggage_services.length > 0
      ) {
        await this.createFlightBaggageServices(
          flight.flight_id,
          flightData.baggage_services
        );
      }

      if (flightData.meal_services && flightData.meal_services.length > 0) {
        await this.createFlightMealServices(
          flight.flight_id,
          flightData.meal_services
        );
      }

      return flight;
    } catch (error) {
      logger.error("Error creating flight:", error);
      throw error;
    }
  }

  async createFlightBaggageServices(flightId, baggageServices) {
    try {
      const { FlightBaggageService } = require("../models");

      const servicesData = baggageServices.map((service) => ({
        flight_id: flightId,
        weight_kg: service.weight_kg,
        price: service.price,
        description: service.description || null,
        is_active: service.is_active !== undefined ? service.is_active : true,
      }));

      await FlightBaggageService.bulkCreate(servicesData);
      logger.info(
        `Created ${servicesData.length} baggage services for flight ${flightId}`
      );
    } catch (error) {
      logger.error("Error creating flight baggage services:", error);
      throw error;
    }
  }

  async createFlightMealServices(flightId, mealServices) {
    try {
      const { FlightMealService } = require("../models");

      const servicesData = mealServices.map((service) => ({
        flight_id: flightId,
        meal_name: service.meal_name,
        meal_description: service.meal_description || null,
        price: service.price,
        is_vegetarian: service.is_vegetarian || false,
        is_halal: service.is_halal || false,
        is_active: service.is_active !== undefined ? service.is_active : true,
      }));

      await FlightMealService.bulkCreate(servicesData);
      logger.info(
        `Created ${servicesData.length} meal services for flight ${flightId}`
      );
    } catch (error) {
      logger.error("Error creating flight meal services:", error);
      throw error;
    }
  }

  // Flight Baggage Services CRUD
  async getFlightBaggageServices(flightId) {
    try {
      const { FlightBaggageService } = require("../models");

      const baggageServices = await FlightBaggageService.findAll({
        where: { flight_id: flightId },
        order: [["weight_kg", "ASC"]],
      });

      return baggageServices;
    } catch (error) {
      logger.error("Error getting flight baggage services:", error);
      throw error;
    }
  }

  async createFlightBaggageService(flightId, baggageServiceData) {
    try {
      const { FlightBaggageService } = require("../models");

      // Validate flight exists
      const flight = await Flight.findByPk(flightId);
      if (!flight) {
        throw new BadRequestError("Flight not found");
      }

      const serviceData = {
        flight_id: flightId,
        weight_kg: baggageServiceData.weight_kg,
        price: baggageServiceData.price,
        description: baggageServiceData.description || null,
        is_active:
          baggageServiceData.is_active !== undefined
            ? baggageServiceData.is_active
            : true,
      };

      const baggageService = await FlightBaggageService.create(serviceData);
      return baggageService;
    } catch (error) {
      logger.error("Error creating flight baggage service:", error);
      throw error;
    }
  }

  async updateFlightBaggageService(flightId, serviceId, updateData) {
    try {
      const { FlightBaggageService } = require("../models");

      const baggageService = await FlightBaggageService.findOne({
        where: {
          baggage_service_id: serviceId,
          flight_id: flightId,
        },
      });

      if (!baggageService) {
        throw new BadRequestError("Flight baggage service not found");
      }

      await baggageService.update(updateData);
      return baggageService;
    } catch (error) {
      logger.error("Error updating flight baggage service:", error);
      throw error;
    }
  }

  /**
   * Ensure flight seats match its aircraft configuration.
   * If force=true, existing seats will be deleted and regenerated.
   */
  async syncFlightSeats(flightId, options = { force: false }) {
    try {
      const { force } = options;
      const flight = await Flight.findByPk(flightId);
      if (!flight) throw new BadRequestError("Flight not found");

      const aircraft = await Aircraft.findByPk(flight.aircraft_id);
      if (!aircraft) throw new BadRequestError("Aircraft not found");

      const businessClass = await TravelClass.findOne({
        where: { class_code: "BUSINESS" },
      });
      const economyClass = await TravelClass.findOne({
        where: { class_code: "ECONOMY" },
      });
      if (!businessClass || !economyClass) {
        throw new Error("Travel classes BUSINESS and ECONOMY must exist");
      }

      let businessCount = parseInt(aircraft.business_seats || 0, 10);
      let economyCount = parseInt(aircraft.economy_seats || 0, 10);
      const totalSeatsDeclared = parseInt(aircraft.total_seats || 0, 10);
      if (businessCount + economyCount !== totalSeatsDeclared) {
        const adjustedEconomy = Math.max(0, totalSeatsDeclared - businessCount);
        logger.warn(
          `Aircraft seat counts (business=${businessCount}, economy=${economyCount}) do not sum to total_seats=${totalSeatsDeclared}. Adjusting economy to ${adjustedEconomy}.`
        );
        economyCount = adjustedEconomy;
      }

      if (force) {
        // remove existing seats then regenerate
        await FlightSeat.destroy({ where: { flight_id: flightId } });
      }

      // Fetch existing seat numbers
      const existing = await FlightSeat.findAll({
        where: { flight_id: flightId },
        attributes: ["seat_number"],
        raw: true,
      });
      const existingNumbers = new Set(existing.map((r) => r.seat_number));

      // Build list of missing seats
      const missing = [];
      for (let i = 1; i <= businessCount; i++) {
        const sn = `BUS${i.toString().padStart(2, "0")}`;
        if (!existingNumbers.has(sn)) {
          missing.push({
            flight_id: flightId,
            class_id: businessClass.class_id,
            seat_number: sn,
            price: 0,
            is_available: true,
          });
        }
      }

      for (let i = 1; i <= economyCount; i++) {
        const sn = `ECO${i.toString().padStart(2, "0")}`;
        if (!existingNumbers.has(sn)) {
          missing.push({
            flight_id: flightId,
            class_id: economyClass.class_id,
            seat_number: sn,
            price: 0,
            is_available: true,
          });
        }
      }

      if (missing.length > 0) {
        await FlightSeat.bulkCreate(missing, {
          ignoreDuplicates: true,
        });
        logger.info(
          `Added ${missing.length} missing seats for flight ${flightId}`
        );
      } else {
        logger.info(`No missing seats for flight ${flightId}`);
      }

      return true;
    } catch (error) {
      logger.error("Error syncing flight seats:", error);
      throw error;
    }
  }

  async deleteFlightBaggageService(flightId, serviceId) {
    try {
      const { FlightBaggageService } = require("../models");

      const baggageService = await FlightBaggageService.findOne({
        where: {
          baggage_service_id: serviceId,
          flight_id: flightId,
        },
      });

      if (!baggageService) {
        throw new BadRequestError("Flight baggage service not found");
      }

      await baggageService.destroy();
    } catch (error) {
      logger.error("Error deleting flight baggage service:", error);
      throw error;
    }
  }

  // Flight Meal Services CRUD
  async getFlightMealServices(flightId) {
    try {
      const { FlightMealService } = require("../models");

      const mealServices = await FlightMealService.findAll({
        where: { flight_id: flightId },
        order: [["meal_name", "ASC"]],
      });

      return mealServices;
    } catch (error) {
      logger.error("Error getting flight meal services:", error);
      throw error;
    }
  }

  async createFlightMealService(flightId, mealServiceData) {
    try {
      const { FlightMealService } = require("../models");

      // Validate flight exists
      const flight = await Flight.findByPk(flightId);
      if (!flight) {
        throw new BadRequestError("Flight not found");
      }

      const serviceData = {
        flight_id: flightId,
        meal_name: mealServiceData.meal_name,
        meal_description: mealServiceData.meal_description || null,
        price: mealServiceData.price,
        is_vegetarian: mealServiceData.is_vegetarian || false,
        is_halal: mealServiceData.is_halal || false,
        is_active:
          mealServiceData.is_active !== undefined
            ? mealServiceData.is_active
            : true,
      };

      const mealService = await FlightMealService.create(serviceData);
      return mealService;
    } catch (error) {
      logger.error("Error creating flight meal service:", error);
      throw error;
    }
  }

  async updateFlightMealService(flightId, serviceId, updateData) {
    try {
      const { FlightMealService } = require("../models");

      const mealService = await FlightMealService.findOne({
        where: {
          meal_service_id: serviceId,
          flight_id: flightId,
        },
      });

      if (!mealService) {
        throw new BadRequestError("Flight meal service not found");
      }

      await mealService.update(updateData);
      return mealService;
    } catch (error) {
      logger.error("Error updating flight meal service:", error);
      throw error;
    }
  }

  async deleteFlightMealService(flightId, serviceId) {
    try {
      const { FlightMealService } = require("../models");

      const mealService = await FlightMealService.findOne({
        where: {
          meal_service_id: serviceId,
          flight_id: flightId,
        },
      });

      if (!mealService) {
        throw new BadRequestError("Flight meal service not found");
      }

      await mealService.destroy();
    } catch (error) {
      logger.error("Error deleting flight meal service:", error);
      throw error;
    }
  }

  async generateFlightSeats(flightId, aircraft) {
    try {
      // Check if seats already exist for this flight
      const existingSeats = await FlightSeat.count({
        where: { flight_id: flightId },
      });

      if (existingSeats > 0) {
        logger.info(
          `Seats already exist for flight ${flightId}, attempting to sync missing seats`
        );
        // If seats partially exist, ensure missing seats are created
        await this.syncFlightSeats(flightId, { force: false });
        return;
      }

      const seats = [];

      // Ensure seat counts sum to aircraft.total_seats. If they don't,
      // adjust economy seats to match total (prefer keeping business count).
      let businessCount = parseInt(aircraft.business_seats || 0, 10);
      let economyCount = parseInt(aircraft.economy_seats || 0, 10);
      const totalSeatsDeclared = parseInt(aircraft.total_seats || 0, 10);
      if (businessCount + economyCount !== totalSeatsDeclared) {
        // Prefer businessCount, adjust economy to match totalSeatsDeclared.
        const adjustedEconomy = Math.max(0, totalSeatsDeclared - businessCount);
        logger.warn(
          `Aircraft seat counts (business=${businessCount}, economy=${economyCount}) do not sum to total_seats=${totalSeatsDeclared}. Adjusting economy to ${adjustedEconomy}.`
        );
        economyCount = adjustedEconomy;
      }

      // Get travel classes
      const businessClass = await TravelClass.findOne({
        where: { class_code: "BUSINESS" },
      });
      const economyClass = await TravelClass.findOne({
        where: { class_code: "ECONOMY" },
      });

      if (!businessClass || !economyClass) {
        throw new Error("Travel classes BUSINESS and ECONOMY must exist");
      }

      // Generate business class seats
      for (let i = 1; i <= businessCount; i++) {
        seats.push({
          flight_id: flightId,
          class_id: businessClass.class_id,
          seat_number: `BUS${i.toString().padStart(3, "0")}`,
          price: 0, // Will be set later
          is_available: true,
        });
      }

      // Generate economy class seats
      for (let i = 1; i <= economyCount; i++) {
        seats.push({
          flight_id: flightId,
          class_id: economyClass.class_id,
          seat_number: `ECO${i.toString().padStart(3, "0")}`,
          price: 0, // Will be set later
          is_available: true,
        });
      }

      // Bulk insert seats with ignoreDuplicates option
      await FlightSeat.bulkCreate(seats, {
        ignoreDuplicates: true,
        updateOnDuplicate: ["price", "is_available"],
      });

      logger.info(`Generated ${seats.length} seats for flight ${flightId}`);
    } catch (error) {
      logger.error("Error generating flight seats:", error);
      throw error;
    }
  }

  async updateFlight(flightId, updateData) {
    try {
      // Check if flight exists
      const existingFlight = await Flight.findByPk(flightId);
      if (!existingFlight) {
        throw new NotFoundError("Flight not found");
      }

      // Prevent editing closed flights (departure passed or no available seats)
      // Admins may bypass this check by sending `force_edit: true` in the body.
      const now = new Date();
      const availableSeatCount = await FlightSeat.count({
        where: { flight_id: flightId, is_available: true },
      });
      const isPast = new Date(existingFlight.departure_time) < now;
      const isFull = availableSeatCount === 0;
      if (!updateData.force_edit && (isPast || isFull)) {
        throw new BadRequestError(
          "Flight is closed (past departure or fully booked) and cannot be edited"
        );
      }

      // Validate airline if provided
      if (updateData.airline_id) {
        const airline = await Airline.findByPk(updateData.airline_id);
        if (!airline) {
          throw new BadRequestError("Airline not found");
        }
      }

      // Validate aircraft if provided
      if (updateData.aircraft_id) {
        const aircraft = await Aircraft.findByPk(updateData.aircraft_id);
        if (!aircraft) {
          throw new BadRequestError("Aircraft not found");
        }
      }

      // Validate airports if provided
      if (updateData.departure_airport_id) {
        const departureAirport = await Airport.findByPk(
          updateData.departure_airport_id
        );
        if (!departureAirport) {
          throw new BadRequestError("Departure airport not found");
        }
      }

      if (updateData.arrival_airport_id) {
        const arrivalAirport = await Airport.findByPk(
          updateData.arrival_airport_id
        );
        if (!arrivalAirport) {
          throw new BadRequestError("Arrival airport not found");
        }
      }

      // Validate departure and arrival airports are different
      const departureId =
        updateData.departure_airport_id || existingFlight.departure_airport_id;
      const arrivalId =
        updateData.arrival_airport_id || existingFlight.arrival_airport_id;

      if (departureId === arrivalId) {
        throw new BadRequestError(
          "Departure and arrival airports must be different"
        );
      }

      // Validate arrival time is after departure time
      const departureTime =
        updateData.departure_time || existingFlight.departure_time;
      const arrivalTime =
        updateData.arrival_time || existingFlight.arrival_time;

      if (new Date(arrivalTime) <= new Date(departureTime)) {
        throw new BadRequestError("Arrival time must be after departure time");
      }

      // Check if flight number already exists for this airline (if changing)
      if (
        updateData.flight_number &&
        updateData.flight_number !== existingFlight.flight_number
      ) {
        const duplicateFlight = await Flight.findOne({
          where: {
            flight_number: updateData.flight_number,
            airline_id: updateData.airline_id || existingFlight.airline_id,
            flight_id: { [Op.ne]: flightId }, // Exclude current flight
          },
        });

        if (duplicateFlight) {
          throw new BadRequestError(
            "Flight number already exists for this airline"
          );
        }
      }

      // Update the flight
      // allow 'active' alias to map to existing enum value 'scheduled'
      if (updateData.status === "active") updateData.status = "scheduled";

      const updatedFlight = await this.flightService.updateById(
        flightId,
        updateData
      );

      // If caller provided baggage_services or meal_services arrays, synchronize them
      // with the DB: create new entries, update those with IDs, and delete omitted ones.
      const {
        sequelize,
        FlightBaggageService,
        FlightMealService,
      } = require("../models");

      await sequelize.transaction(async (trx) => {
        // Baggage services sync
        if (Array.isArray(updateData.baggage_services)) {
          const requested = updateData.baggage_services;
          // fetch existing
          const existing = await FlightBaggageService.findAll({
            where: { flight_id: flightId },
            transaction: trx,
          });
          const existingById = new Map(
            existing.map((r) => [r.baggage_service_id, r])
          );

          // Track ids seen
          const seenIds = new Set();

          for (const item of requested) {
            if (item.baggage_service_id) {
              // update existing
              const rec = existingById.get(item.baggage_service_id);
              if (rec) {
                await rec.update(
                  {
                    weight_kg: item.weight_kg,
                    price: item.price,
                    description: item.description || null,
                    is_active:
                      item.is_active !== undefined
                        ? item.is_active
                        : rec.is_active,
                  },
                  { transaction: trx }
                );
                seenIds.add(item.baggage_service_id);
              } else {
                // requested id doesn't exist -> create fallback
                await FlightBaggageService.create(
                  {
                    flight_id: flightId,
                    weight_kg: item.weight_kg,
                    price: item.price,
                    description: item.description || null,
                    is_active:
                      item.is_active !== undefined ? item.is_active : true,
                  },
                  { transaction: trx }
                );
              }
            } else {
              // create new
              await FlightBaggageService.create(
                {
                  flight_id: flightId,
                  weight_kg: item.weight_kg,
                  price: item.price,
                  description: item.description || null,
                  is_active:
                    item.is_active !== undefined ? item.is_active : true,
                },
                { transaction: trx }
              );
            }
          }
        }

        // Meal services sync (same pattern)
        if (Array.isArray(updateData.meal_services)) {
          const requested = updateData.meal_services;
          const existing = await FlightMealService.findAll({
            where: { flight_id: flightId },
            transaction: trx,
          });
          const existingById = new Map(
            existing.map((r) => [r.meal_service_id, r])
          );
          const seenIds = new Set();

          for (const item of requested) {
            if (item.meal_service_id) {
              const rec = existingById.get(item.meal_service_id);
              if (rec) {
                await rec.update(
                  {
                    meal_name: item.meal_name,
                    meal_description: item.meal_description || null,
                    price: item.price,
                    is_vegetarian: item.is_vegetarian || false,
                    is_halal: item.is_halal || false,
                    is_active:
                      item.is_active !== undefined
                        ? item.is_active
                        : rec.is_active,
                  },
                  { transaction: trx }
                );
                seenIds.add(item.meal_service_id);
              } else {
                await FlightMealService.create(
                  {
                    flight_id: flightId,
                    meal_name: item.meal_name,
                    meal_description: item.meal_description || null,
                    price: item.price,
                    is_vegetarian: item.is_vegetarian || false,
                    is_halal: item.is_halal || false,
                    is_active:
                      item.is_active !== undefined ? item.is_active : true,
                  },
                  { transaction: trx }
                );
              }
            } else {
              await FlightMealService.create(
                {
                  flight_id: flightId,
                  meal_name: item.meal_name,
                  meal_description: item.meal_description || null,
                  price: item.price,
                  is_vegetarian: item.is_vegetarian || false,
                  is_halal: item.is_halal || false,
                  is_active:
                    item.is_active !== undefined ? item.is_active : true,
                },
                { transaction: trx }
              );
            }
          }
        }
      });

      return updatedFlight;
    } catch (error) {
      logger.error("Error updating flight:", error);
      throw error;
    }
  }

  async deleteFlight(flightId) {
    try {
      // Check if flight exists
      const flight = await Flight.findByPk(flightId);
      if (!flight) {
        throw new NotFoundError("Flight not found");
      }

      // Check if flight has any bookings
      const bookingCount = await BookingDetail.count({
        where: { flight_id: flightId },
      });

      if (bookingCount > 0) {
        throw new BadRequestError(
          "Cannot delete flight that has bookings. Please cancel bookings first."
        );
      }

      // Delete flight seats first
      await FlightSeat.destroy({
        where: { flight_id: flightId },
      });

      // Delete the flight
      await this.flightService.deleteById(flightId);

      logger.info(`Flight ${flightId} deleted successfully`);
      return { message: "Flight deleted successfully" };
    } catch (error) {
      logger.error("Error deleting flight:", error);
      throw error;
    }
  }

  // Service Package Management
  async getServicePackages(filters = {}, page = 1, limit = 10) {
    try {
      const whereClause = this.buildServicePackageWhereClause(filters);
      const options = {
        where: whereClause,
        include: [
          {
            model: Airline,
            attributes: ["airline_id", "airline_name", "airline_code"],
          },
        ],
        order: [
          ["airline_id", "ASC"],
          ["class_type", "ASC"],
          ["package_type", "ASC"],
        ],
      };

      const result = await this.servicePackageService.findAll(
        options,
        page,
        limit
      );
      return result;
    } catch (error) {
      logger.error("Error getting service packages:", error);
      throw error;
    }
  }

  buildServicePackageWhereClause(filters) {
    const whereClause = {};

    if (filters.airline_id) {
      whereClause.airline_id = filters.airline_id;
    }
    if (filters.class_type) {
      whereClause.class_type = filters.class_type;
    }
    if (filters.package_type) {
      whereClause.package_type = filters.package_type;
    }
    if (filters.is_active !== undefined) {
      whereClause.is_active = filters.is_active;
    }

    return whereClause;
  }
}

module.exports = new AdminService();
