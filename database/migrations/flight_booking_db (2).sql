-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Nov 16, 2025 at 01:18 PM
-- Server version: 9.1.0
-- PHP Version: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `flight_booking_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `aircraft`
--

DROP TABLE IF EXISTS `aircraft`;
CREATE TABLE IF NOT EXISTS `aircraft` (
  `aircraft_id` int NOT NULL AUTO_INCREMENT,
  `airline_id` int NOT NULL,
  `model` varchar(100) COLLATE utf8mb3_unicode_ci NOT NULL,
  `total_seats` int NOT NULL,
  `business_seats` int NOT NULL,
  `economy_seats` int NOT NULL,
  `aircraft_type` varchar(50) COLLATE utf8mb3_unicode_ci DEFAULT NULL COMMENT 'Type of aircraft (e.g., Boeing 737, Airbus A320)',
  PRIMARY KEY (`aircraft_id`),
  KEY `airline_id` (`airline_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `aircraft`
--



-- --------------------------------------------------------

--
-- Table structure for table `airlines`
--

DROP TABLE IF EXISTS `airlines`;
CREATE TABLE IF NOT EXISTS `airlines` (
  `airline_id` int NOT NULL AUTO_INCREMENT,
  `airline_code` char(2) COLLATE utf8mb3_unicode_ci NOT NULL,
  `airline_name` varchar(100) COLLATE utf8mb3_unicode_ci NOT NULL,
  `country_id` int NOT NULL,
  `service_config` json DEFAULT NULL COMMENT 'Configuration for Economy/Business Class services',
  `logo_url` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`airline_id`),
  UNIQUE KEY `airline_code` (`airline_code`),
  KEY `country_id` (`country_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `airlines`
--

-- ===========================
-- Bảng airlines (tham chiếu country_id)
-- ===========================
INSERT INTO `airlines` 
(`airline_id`, `airline_code`, `airline_name`, `country_id`, `service_config`, `logo_url`, `is_active`) 
VALUES
(1, 'VN', 'Vietnam Airlines', 1, NULL, 'https://logo.vn', 1),
(2, 'VJ', 'VietJet Air', 1, NULL, 'https://example.com/vj-logo.png', 1),
(3, 'QH', 'Bamboo Airways', 1, NULL, 'https://example.com/qh-logo.png', 1),
(4, 'TG', 'Thai Airways', 2, NULL, 'https://example.com/tg-logo.png', 1),
(5, 'SQ', 'Singapore Airlines', 3, NULL, 'https://example.com/sq-logo.png', 1),
(6, 'MH', 'Malaysia Airlines', 4, NULL, 'https://example.com/mh-logo.png', 1),
(7, 'GA', 'Garuda Indonesia', 5, NULL, 'https://example.com/ga-logo.png', 1),
(8, 'JL', 'Japan Airlines', 6, NULL, 'https://example.com/jl-logo.png', 1),
(9, 'KE', 'Korean Air', 7, NULL, 'https://example.com/ke-logo.png', 1),
(10, 'CA', 'Air China', 8, NULL, 'https://example.com/ca-logo.png', 1),
(11, 'AA', 'American Airlines', 9, NULL, 'https://example.com/aa-logo.png', 1),
(12, 'BA', 'British Airways', 10, NULL, 'https://example.com/ba-logo.png', 1),
(13, 'QF', 'Qantas', 11, NULL, 'https://example.com/qf-logo.png', 1),
(14, 'AF', 'Air France', 12, NULL, 'https://example.com/af-logo.png', 1),
(15, 'LH', 'Lufthansa', 13, NULL, 'https://example.com/lh-logo.png', 1),
(16, 'AZ', 'Alitalia', 14, NULL, 'https://example.com/az-logo.png', 1),
(17, 'IB', 'Iberia', 15, NULL, 'https://example.com/ib-logo.png', 1),
(18, 'AC', 'Air Canada', 16, NULL, 'https://example.com/ac-logo.png', 1),
(19, 'LATAM', 'LATAM Airlines', 17, NULL, 'https://example.com/latam-logo.png', 1),
(20, 'SU', 'Aeroflot', 18, NULL, 'https://example.com/su-logo.png', 1),
(21, 'AI', 'Air India', 19, NULL, 'https://example.com/ai-logo.png', 1),
(22, 'EK', 'Emirates', 20, NULL, 'https://example.com/ek-logo.png', 1),
(23, 'SV', 'Saudia', 21, NULL, 'https://example.com/sv-logo.png', 1),
(24, 'MS', 'EgyptAir', 22, NULL, 'https://example.com/ms-logo.png', 1),
(25, 'TK', 'Turkish Airlines', 23, NULL, 'https://example.com/tk-logo.png', 1),
(26, 'KL', 'KLM', 24, NULL, 'https://example.com/kl-logo.png', 1),
(27, 'LX', 'Swiss International Air Lines', 25, NULL, 'https://example.com/lx-logo.png', 1),
(28, 'SK', 'SAS', 26, NULL, 'https://example.com/sk-logo.png', 1),
(29, 'DY', 'Norwegian Air Shuttle', 27, NULL, 'https://example.com/dy-logo.png', 1),
(30, 'AY', 'Finnair', 29, NULL, 'https://example.com/ay-logo.png', 1),
(31, 'NZ', 'Air New Zealand', 30, NULL, 'https://example.com/nz-logo.png', 1);


-- --------------------------------------------------------

--
-- Table structure for table `airports`
--

DROP TABLE IF EXISTS `airports`;
CREATE TABLE IF NOT EXISTS `airports` (
  `airport_id` int NOT NULL AUTO_INCREMENT,
  `airport_code` char(3) COLLATE utf8mb3_unicode_ci NOT NULL,
  `airport_name` varchar(100) COLLATE utf8mb3_unicode_ci NOT NULL,
  `city` varchar(100) COLLATE utf8mb3_unicode_ci NOT NULL,
  `country_id` int NOT NULL,
  `airport_type` enum('domestic','international') COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT 'domestic',
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  PRIMARY KEY (`airport_id`),
  UNIQUE KEY `airport_code` (`airport_code`),
  KEY `country_id` (`country_id`),
  KEY `airports_airport_code` (`airport_code`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `airports`
--

-- ===========================
-- Bảng airports (Việt Nam + Quốc tế)
-- ===========================
INSERT INTO `airports` 
(`airport_id`, `airport_code`, `airport_name`, `city`, `country_id`, `airport_type`, `latitude`, `longitude`) 
VALUES
-- Sân bay Việt Nam
(1, 'SGN', 'Sân bay Quốc tế Tân Sơn Nhất', 'TP. Hồ Chí Minh', 1, 'quốc tế', 10.8188, 106.6520),
(2, 'HAN', 'Sân bay Quốc tế Nội Bài', 'Hà Nội', 1, 'quốc tế', 21.2212, 105.8072),
(3, 'DAD', 'Sân bay Quốc tế Đà Nẵng', 'Đà Nẵng', 1, 'quốc tế', 16.0556, 108.1997),
(4, 'CXR', 'Sân bay Quốc tế Cam Ranh', 'Khánh Hòa', 1, 'quốc tế', 12.2140, 109.1967),
(5, 'VCA', 'Sân bay Cần Thơ', 'Cần Thơ', 1, 'quốc tế', 10.0391, 105.6675),
(6, 'PQC', 'Sân bay Phú Quốc', 'Kiên Giang', 1, 'quốc tế', 10.2271, 103.9630),
(7, 'UIH', 'Sân bay Tuy Hòa', 'Phú Yên', 1, 'nội địa', 13.0869, 109.3338),
(8, 'VVV', 'Sân bay Chu Lai', 'Quảng Nam', 1, 'nội địa', 15.5566, 108.4603),
(9, 'DLI', 'Sân bay Liên Khương', 'Lâm Đồng', 1, 'nội địa', 11.7510, 108.4286),
(10, 'HUI', 'Sân bay Phú Bài', 'Thừa Thiên Huế', 1, 'nội địa', 16.4017, 107.7010),

-- Sân bay quốc tế
(11, 'BKK', 'Sân bay Suvarnabhumi', 'Bangkok', 2, 'quốc tế', 13.6900, 100.7501),
(12, 'CNX', 'Sân bay Chiang Mai', 'Chiang Mai', 2, 'quốc tế', 18.7668, 98.9631),
(13, 'SIN', 'Sân bay Changi', 'Singapore', 3, 'quốc tế', 1.3644, 103.9915),
(14, 'KUL', 'Sân bay Kuala Lumpur', 'Kuala Lumpur', 4, 'quốc tế', 2.7456, 101.7099),
(15, 'NRT', 'Sân bay Narita', 'Tokyo', 6, 'quốc tế', 35.7720, 140.3928),
(16, 'KIX', 'Sân bay Kansai', 'Osaka', 6, 'quốc tế', 34.4342, 135.2441),
(17, 'ICN', 'Sân bay Incheon', 'Seoul', 7, 'quốc tế', 37.4602, 126.4407),
(18, 'PEK', 'Sân bay Bắc Kinh', 'Beijing', 8, 'quốc tế', 40.0801, 116.5846),
(19, 'JFK', 'Sân bay John F. Kennedy', 'New York', 9, 'quốc tế', 40.6413, -73.7781),
(20, 'LHR', 'Sân bay Heathrow', 'London', 10, 'quốc tế', 51.4700, -0.4543),
(21, 'SYD', 'Sân bay Kingsford Smith', 'Sydney', 11, 'quốc tế', -33.9399, 151.1753),
(22, 'CDG', 'Sân bay Charles de Gaulle', 'Paris', 12, 'quốc tế', 49.0097, 2.5479),
(23, 'FRA', 'Sân bay Frankfurt', 'Frankfurt', 13, 'quốc tế', 50.0379, 8.5622),
(24, 'FCO', 'Sân bay Fiumicino', 'Rome', 14, 'quốc tế', 41.8003, 12.2389),
(25, 'MAD', 'Sân bay Barajas', 'Madrid', 15, 'quốc tế', 40.4983, -3.5676);


-- --------------------------------------------------------

--
-- Table structure for table `baggage_options`
--

DROP TABLE IF EXISTS `baggage_options`;
CREATE TABLE IF NOT EXISTS `baggage_options` (
  `baggage_id` int NOT NULL AUTO_INCREMENT,
  `airline_id` int NOT NULL,
  `weight_kg` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `description` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`baggage_id`),
  KEY `airline_id` (`airline_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `baggage_options`
--



-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
CREATE TABLE IF NOT EXISTS `bookings` (
  `booking_id` int NOT NULL AUTO_INCREMENT,
  `booking_reference` varchar(10) COLLATE utf8mb3_unicode_ci NOT NULL,
  `user_id` int NOT NULL,
  `contact_email` varchar(100) COLLATE utf8mb3_unicode_ci NOT NULL,
  `contact_phone` varchar(20) COLLATE utf8mb3_unicode_ci NOT NULL,
  `citizen_id` varchar(12) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `booking_date` datetime DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `status` enum('pending','confirmed','cancelled','completed','pending_cancellation','cancellation_rejected') COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT 'pending',
  `payment_status` enum('pending','paid','refunded','failed') COLLATE utf8mb3_unicode_ci DEFAULT 'pending',
  `cancellation_reason` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `trip_type` enum('one-way','round-trip','multi-city') COLLATE utf8mb3_unicode_ci DEFAULT NULL COMMENT 'Trip type: one-way, round-trip, or multi-city',
  `updated_at` datetime DEFAULT NULL,
  `base_amount` decimal(10,2) DEFAULT '0.00' COMMENT 'Base flight ticket amount',
  `baggage_fees` decimal(10,2) DEFAULT '0.00' COMMENT 'Total baggage fees',
  `meal_fees` decimal(10,2) DEFAULT '0.00' COMMENT 'Total meal fees',
  `service_package_fees` decimal(10,2) DEFAULT '0.00' COMMENT 'Service package fees',
  `selected_baggage_services` json DEFAULT NULL,
  `selected_meal_services` json DEFAULT NULL,
  `discount_amount` decimal(10,2) DEFAULT '0.00' COMMENT 'Discount amount',
  `discount_code` varchar(50) COLLATE utf8mb3_unicode_ci DEFAULT NULL COMMENT 'Discount code used',
  `discount_percentage` decimal(5,2) DEFAULT NULL COMMENT 'Discount percentage',
  `tax_amount` decimal(10,2) DEFAULT '0.00' COMMENT 'Tax amount',
  `final_amount` decimal(10,2) DEFAULT '0.00' COMMENT 'Final amount after all calculations',
  `cancellation_processed` tinyint(1) NOT NULL DEFAULT '0',
  `cancellation_processed_at` datetime DEFAULT NULL,
  `cancellation_processed_by` int DEFAULT NULL,
  PRIMARY KEY (`booking_id`),
  UNIQUE KEY `booking_reference` (`booking_reference`),
  KEY `bookings_booking_reference` (`booking_reference`),
  KEY `bookings_user_id` (`user_id`),
  KEY `idx_bookings_discount_code` (`discount_code`),
  KEY `idx_bookings_final_amount` (`final_amount`)
) ENGINE=InnoDB AUTO_INCREMENT=106 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `bookings`
--


-- --------------------------------------------------------

--
-- Table structure for table `booking_details`
--

DROP TABLE IF EXISTS `booking_details`;
CREATE TABLE IF NOT EXISTS `booking_details` (
  `booking_detail_id` int NOT NULL AUTO_INCREMENT,
  `booking_id` int NOT NULL,
  `flight_id` int NOT NULL,
  `passenger_id` int NOT NULL,
  `seat_id` int NOT NULL,
  `baggage_option_id` int DEFAULT NULL,
  `meal_option_id` int DEFAULT NULL,
  `ticket_number` varchar(20) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `check_in_status` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`booking_detail_id`),
  UNIQUE KEY `ticket_number` (`ticket_number`),
  KEY `booking_id` (`booking_id`),
  KEY `flight_id` (`flight_id`),
  KEY `passenger_id` (`passenger_id`),
  KEY `seat_id` (`seat_id`),
  KEY `baggage_option_id` (`baggage_option_id`),
  KEY `meal_option_id` (`meal_option_id`)
) ENGINE=InnoDB AUTO_INCREMENT=236 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `booking_details`
--


-- --------------------------------------------------------

--
-- Table structure for table `booking_service_packages`
--

DROP TABLE IF EXISTS `booking_service_packages`;
CREATE TABLE IF NOT EXISTS `booking_service_packages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `booking_id` int NOT NULL,
  `flight_id` int NOT NULL,
  `service_package_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_booking_flight_package` (`booking_id`,`flight_id`,`service_package_id`),
  KEY `flight_id` (`flight_id`),
  KEY `service_package_id` (`service_package_id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stores service packages selected for each flight in a booking';

--
-- Dumping data for table `booking_service_packages`
--


-- --------------------------------------------------------

--
-- Table structure for table `contacts`
--

DROP TABLE IF EXISTS `contacts`;
CREATE TABLE IF NOT EXISTS `contacts` (
  `contact_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `first_name` varchar(50) COLLATE utf8mb3_unicode_ci NOT NULL,
  `middle_name` varchar(50) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `last_name` varchar(50) COLLATE utf8mb3_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb3_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb3_unicode_ci NOT NULL,
  `citizen_id` varchar(12) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `is_primary` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`contact_id`),
  KEY `contacts_user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=85 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `contacts`
--


-- --------------------------------------------------------

--
-- Table structure for table `countries`
--

DROP TABLE IF EXISTS `countries`;
CREATE TABLE IF NOT EXISTS `countries` (
  `country_id` int NOT NULL AUTO_INCREMENT,
  `country_code` char(2) COLLATE utf8mb3_unicode_ci NOT NULL,
  `country_name` varchar(100) COLLATE utf8mb3_unicode_ci NOT NULL,
  PRIMARY KEY (`country_id`),
  UNIQUE KEY `country_code` (`country_code`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `countries`
--
INSERT INTO `countries` (`country_id`, `country_code`, `country_name`) VALUES
(1, 'VN', 'Vietnam'),
(2, 'TH', 'Thailand'),
(3, 'SG', 'Singapore'),
(4, 'MY', 'Malaysia'),
(5, 'ID', 'Indonesia'),
(6, 'JP', 'Japan'),
(7, 'KR', 'South Korea'),
(8, 'CN', 'China'),
(9, 'US', 'United States'),
(10, 'GB', 'United Kingdom'),
(11, 'AU', 'Australia'),
(12, 'FR', 'France'),
(13, 'DE', 'Germany'),
(14, 'IT', 'Italy'),
(15, 'ES', 'Spain'),
(16, 'CA', 'Canada'),
(17, 'BR', 'Brazil'),
(18, 'RU', 'Russia'),
(19, 'IN', 'India'),
(20, 'AE', 'United Arab Emirates'),
(21, 'SA', 'Saudi Arabia'),
(22, 'EG', 'Egypt'),
(23, 'TR', 'Turkey'),
(24, 'NL', 'Netherlands'),
(25, 'CH', 'Switzerland'),
(26, 'SE', 'Sweden'),
(27, 'NO', 'Norway'),
(28, 'DK', 'Denmark'),
(29, 'FI', 'Finland'),
(30, 'NZ', 'New Zealand');


-- --------------------------------------------------------

--
-- Table structure for table `email_notifications`
--

DROP TABLE IF EXISTS `email_notifications`;
CREATE TABLE IF NOT EXISTS `email_notifications` (
  `notification_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `booking_id` int NOT NULL,
  `notification_type` enum('booking_confirmation','cancellation','check_in_reminder','other') COLLATE utf8mb3_unicode_ci NOT NULL,
  `email_subject` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `email_content` text COLLATE utf8mb3_unicode_ci NOT NULL,
  `sent_at` datetime DEFAULT NULL,
  `status` enum('sent','failed','pending') COLLATE utf8mb3_unicode_ci DEFAULT 'pending',
  PRIMARY KEY (`notification_id`),
  KEY `user_id` (`user_id`),
  KEY `booking_id` (`booking_id`)
) ENGINE=InnoDB AUTO_INCREMENT=98 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `email_notifications`
--


-- --------------------------------------------------------

--
-- Table structure for table `flights`
--

DROP TABLE IF EXISTS `flights`;
CREATE TABLE IF NOT EXISTS `flights` (
  `flight_id` int NOT NULL AUTO_INCREMENT,
  `flight_number` varchar(10) COLLATE utf8mb3_unicode_ci NOT NULL,
  `airline_id` int NOT NULL,
  `aircraft_id` int NOT NULL,
  `departure_airport_id` int NOT NULL,
  `arrival_airport_id` int NOT NULL,
  `departure_time` datetime NOT NULL,
  `arrival_time` datetime NOT NULL,
  `status` enum('scheduled','delayed','cancelled','completed') COLLATE utf8mb3_unicode_ci DEFAULT 'scheduled',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `economy_price` decimal(12,2) DEFAULT NULL,
  `business_price` decimal(12,2) DEFAULT NULL,
  `flight_type` enum('domestic','international') COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`flight_id`),
  KEY `airline_id` (`airline_id`),
  KEY `aircraft_id` (`aircraft_id`),
  KEY `departure_airport_id` (`departure_airport_id`),
  KEY `arrival_airport_id` (`arrival_airport_id`),
  KEY `flights_flight_number` (`flight_number`),
  KEY `flights_departure_time` (`departure_time`),
  KEY `flights_arrival_time` (`arrival_time`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `flights`
--


-- --------------------------------------------------------

--
-- Table structure for table `flight_baggage_services`
--

DROP TABLE IF EXISTS `flight_baggage_services`;
CREATE TABLE IF NOT EXISTS `flight_baggage_services` (
  `baggage_service_id` int NOT NULL AUTO_INCREMENT,
  `flight_id` int NOT NULL,
  `weight_kg` decimal(5,2) NOT NULL COMMENT 'Baggage weight in kilograms',
  `price` decimal(10,2) NOT NULL COMMENT 'Price for this baggage service',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT 'Description of baggage service',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`baggage_service_id`),
  KEY `idx_flight_id` (`flight_id`),
  KEY `flight_baggage_services_flight_id` (`flight_id`)
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `flight_baggage_services`
--


-- --------------------------------------------------------

--
-- Table structure for table `flight_meal_services`
--

DROP TABLE IF EXISTS `flight_meal_services`;
CREATE TABLE IF NOT EXISTS `flight_meal_services` (
  `meal_service_id` int NOT NULL AUTO_INCREMENT,
  `flight_id` int NOT NULL,
  `meal_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Name of the meal',
  `meal_description` text COLLATE utf8mb4_unicode_ci COMMENT 'Description of the meal',
  `price` decimal(10,2) NOT NULL COMMENT 'Price for this meal service',
  `is_vegetarian` tinyint(1) DEFAULT '0',
  `is_halal` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`meal_service_id`),
  KEY `idx_flight_id` (`flight_id`),
  KEY `flight_meal_services_flight_id` (`flight_id`)
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `flight_meal_services`
--


-- --------------------------------------------------------

--
-- Table structure for table `flight_recommendations`
--

DROP TABLE IF EXISTS `flight_recommendations`;
CREATE TABLE IF NOT EXISTS `flight_recommendations` (
  `recommendation_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `flight_id` int NOT NULL,
  `recommendation_score` decimal(5,2) NOT NULL,
  `recommendation_reason` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`recommendation_id`),
  KEY `user_id` (`user_id`),
  KEY `flight_id` (`flight_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `flight_seats`
--

DROP TABLE IF EXISTS `flight_seats`;
CREATE TABLE IF NOT EXISTS `flight_seats` (
  `seat_id` int NOT NULL AUTO_INCREMENT,
  `flight_id` int NOT NULL,
  `class_id` int NOT NULL,
  `seat_number` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `is_available` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`seat_id`),
  UNIQUE KEY `flight_seats_flight_id_seat_number` (`flight_id`,`seat_number`),
  KEY `class_id` (`class_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6105 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `flight_seats`

--
-- Table structure for table `flight_services`
--

DROP TABLE IF EXISTS `flight_services`;
CREATE TABLE IF NOT EXISTS `flight_services` (
  `service_id` int NOT NULL AUTO_INCREMENT,
  `flight_id` int NOT NULL,
  `service_type` enum('baggage','meal','other') COLLATE utf8mb3_unicode_ci NOT NULL,
  `service_ref_id` int NOT NULL,
  `is_available` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`service_id`),
  KEY `flight_services_flight_id_service_type` (`flight_id`,`service_type`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `meal_options`
--

DROP TABLE IF EXISTS `meal_options`;
CREATE TABLE IF NOT EXISTS `meal_options` (
  `meal_id` int NOT NULL AUTO_INCREMENT,
  `airline_id` int NOT NULL,
  `meal_name` varchar(100) COLLATE utf8mb3_unicode_ci NOT NULL,
  `meal_description` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `is_vegetarian` tinyint(1) DEFAULT '0',
  `is_halal` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`meal_id`),
  KEY `airline_id` (`airline_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `package_services`
--

DROP TABLE IF EXISTS `package_services`;
CREATE TABLE IF NOT EXISTS `package_services` (
  `id` int NOT NULL AUTO_INCREMENT,
  `airline_id` int NOT NULL,
  `package_id` int NOT NULL,
  `service_id` int NOT NULL,
  `value` decimal(10,2) DEFAULT NULL,
  `unit` varchar(20) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `custom_description` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `airline_id` (`airline_id`),
  KEY `package_id` (`package_id`),
  KEY `service_id` (`service_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `passengers`
--

DROP TABLE IF EXISTS `passengers`;
CREATE TABLE IF NOT EXISTS `passengers` (
  `passenger_id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) COLLATE utf8mb3_unicode_ci NOT NULL,
  `middle_name` varchar(50) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `last_name` varchar(50) COLLATE utf8mb3_unicode_ci NOT NULL,
  `title` enum('Mr','Mrs','Ms','Dr','Prof') COLLATE utf8mb3_unicode_ci DEFAULT 'Mr',
  `citizen_id` varchar(12) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `passenger_type` enum('adult','child','infant') COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT 'adult',
  `date_of_birth` date NOT NULL,
  `nationality` varchar(50) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `passport_number` varchar(50) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `passport_expiry` date DEFAULT NULL,
  `passport_issuing_country` varchar(50) COLLATE utf8mb3_unicode_ci DEFAULT NULL COMMENT 'Country that issued the passport',
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`passenger_id`)
) ENGINE=InnoDB AUTO_INCREMENT=198 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `passengers`
--


-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
CREATE TABLE IF NOT EXISTS `payments` (
  `payment_id` int NOT NULL AUTO_INCREMENT,
  `booking_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` enum('zalopay','credit_card','bank_transfer','cod') COLLATE utf8mb3_unicode_ci NOT NULL,
  `payment_reference` varchar(100) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `payment_date` datetime DEFAULT NULL,
  `status` enum('pending','completed','failed','refunded') COLLATE utf8mb3_unicode_ci DEFAULT 'pending',
  `transaction_details` json DEFAULT NULL,
  PRIMARY KEY (`payment_id`),
  KEY `booking_id` (`booking_id`),
  KEY `payments_payment_reference` (`payment_reference`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `payments`
--


-- --------------------------------------------------------

--
-- Table structure for table `promotions`
--

DROP TABLE IF EXISTS `promotions`;
CREATE TABLE IF NOT EXISTS `promotions` (
  `promotion_id` int NOT NULL AUTO_INCREMENT,
  `promotion_code` varchar(20) COLLATE utf8mb3_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `discount_type` enum('percentage','fixed_amount') COLLATE utf8mb3_unicode_ci NOT NULL,
  `discount_value` decimal(10,2) NOT NULL,
  `min_purchase` decimal(10,2) DEFAULT '0.00',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `usage_limit` int DEFAULT NULL,
  `usage_count` int DEFAULT '0',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`promotion_id`),
  UNIQUE KEY `promotion_code` (`promotion_code`),
  KEY `promotions_promotion_code` (`promotion_code`),
  KEY `promotions_start_date_end_date` (`start_date`,`end_date`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `promotions`
--


-- --------------------------------------------------------

--
-- Table structure for table `promotion_usage`
--

DROP TABLE IF EXISTS `promotion_usage`;
CREATE TABLE IF NOT EXISTS `promotion_usage` (
  `usage_id` int NOT NULL AUTO_INCREMENT,
  `promotion_id` int NOT NULL,
  `booking_id` int NOT NULL,
  `discount_amount` decimal(10,2) NOT NULL,
  `applied_at` datetime DEFAULT NULL,
  PRIMARY KEY (`usage_id`),
  UNIQUE KEY `promotion_usage_promotion_id_booking_id` (`promotion_id`,`booking_id`),
  KEY `booking_id` (`booking_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `token_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `token` varchar(500) COLLATE utf8mb3_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `is_revoked` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`token_id`),
  UNIQUE KEY `token` (`token`),
  KEY `refresh_tokens_user_id` (`user_id`),
  KEY `refresh_tokens_token` (`token`),
  KEY `refresh_tokens_expires_at` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `refresh_tokens`
--

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
CREATE TABLE IF NOT EXISTS `roles` (
  `role_id` int NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) COLLATE utf8mb3_unicode_ci NOT NULL,
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `role_name` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`role_id`, `role_name`) VALUES
(2, 'admin'),
(1, 'user');

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

DROP TABLE IF EXISTS `services`;
CREATE TABLE IF NOT EXISTS `services` (
  `service_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb3_unicode_ci NOT NULL,
  `type` enum('baggage_hand','baggage_check','ticket_change','ticket_refund','insurance','other') COLLATE utf8mb3_unicode_ci NOT NULL,
  `default_description` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `unit` varchar(20) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`service_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `service_packages`
--

DROP TABLE IF EXISTS `service_packages`;
CREATE TABLE IF NOT EXISTS `service_packages` (
  `package_id` int NOT NULL AUTO_INCREMENT,
  `airline_id` int NOT NULL,
  `package_name` varchar(100) COLLATE utf8mb3_unicode_ci NOT NULL,
  `package_code` varchar(20) COLLATE utf8mb3_unicode_ci NOT NULL COMMENT 'e.g., ECONOMY, ECONOMY_PLUS, BUSINESS, BUSINESS_PLUS',
  `class_type` enum('economy','business') COLLATE utf8mb3_unicode_ci NOT NULL,
  `package_type` enum('standard','plus') COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT 'standard',
  `price_multiplier` decimal(3,2) NOT NULL DEFAULT '1.00' COMMENT 'Multiplier for base price (Class=1.00, Plus=1.20)',
  `description` text COLLATE utf8mb3_unicode_ci,
  `services_included` json DEFAULT NULL COMMENT 'JSON array of included services',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`package_id`),
  UNIQUE KEY `service_packages_airline_id_package_code` (`airline_id`,`package_code`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `service_packages`
--


-- --------------------------------------------------------

--
-- Table structure for table `travel_classes`
--

DROP TABLE IF EXISTS `travel_classes`;
CREATE TABLE IF NOT EXISTS `travel_classes` (
  `class_id` int NOT NULL AUTO_INCREMENT,
  `class_name` varchar(50) COLLATE utf8mb3_unicode_ci NOT NULL,
  `class_code` varchar(10) COLLATE utf8mb3_unicode_ci NOT NULL,
  PRIMARY KEY (`class_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `travel_classes`
--

INSERT INTO `travel_classes` (`class_id`, `class_name`, `class_code`) VALUES
(1, 'Business Class', 'BUSINESS'),
(2, 'Economy Class', 'ECONOMY');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) COLLATE utf8mb3_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  `first_name` varchar(50) COLLATE utf8mb3_unicode_ci NOT NULL,
  `middle_name` varchar(50) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `last_name` varchar(50) COLLATE utf8mb3_unicode_ci NOT NULL,
  `title` enum('Mr','Mrs','Ms','Dr','Prof') COLLATE utf8mb3_unicode_ci DEFAULT 'Mr',
  `citizen_id` varchar(12) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `google_id` varchar(100) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `google_id` (`google_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `email`, `password`, `first_name`, `middle_name`, `last_name`, `title`, `citizen_id`, `phone`, `date_of_birth`, `google_id`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'admin@flightbooking.com', '$2a$10$LF5I2ycWr8VezR.nugEOd.NybfvSFrKkXcCou8hWXZ21cCl1NOz/e', 'John', 'Middle', 'Doe', 'Mr', '123456789012', '+84901234567', '1990-01-01', NULL, 1, '2025-10-20 06:08:43', '2025-10-20 06:08:43');


-- --------------------------------------------------------

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
CREATE TABLE IF NOT EXISTS `user_roles` (
  `user_id` int NOT NULL,
  `role_id` int NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  UNIQUE KEY `user_roles_role_id_user_id_unique` (`user_id`,`role_id`),
  KEY `role_id` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Dumping data for table `user_roles`
--

INSERT INTO `user_roles` (`user_id`, `role_id`) VALUES
(1, 2);


-- --------------------------------------------------------

--
-- Table structure for table `user_search_history`
--

DROP TABLE IF EXISTS `user_search_history`;
CREATE TABLE IF NOT EXISTS `user_search_history` (
  `search_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `departure_airport_id` int DEFAULT NULL,
  `arrival_airport_id` int DEFAULT NULL,
  `departure_date` date DEFAULT NULL,
  `return_date` date DEFAULT NULL,
  `passengers` int DEFAULT NULL,
  `travel_class_id` int DEFAULT NULL,
  `search_timestamp` datetime DEFAULT NULL,
  PRIMARY KEY (`search_id`),
  KEY `departure_airport_id` (`departure_airport_id`),
  KEY `arrival_airport_id` (`arrival_airport_id`),
  KEY `travel_class_id` (`travel_class_id`),
  KEY `user_search_history_user_id_search_timestamp` (`user_id`,`search_timestamp`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `aircraft`
--
ALTER TABLE `aircraft`
  ADD CONSTRAINT `aircraft_ibfk_1` FOREIGN KEY (`airline_id`) REFERENCES `airlines` (`airline_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `airlines`
--
ALTER TABLE `airlines`
  ADD CONSTRAINT `airlines_ibfk_1` FOREIGN KEY (`country_id`) REFERENCES `countries` (`country_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `airports`
--
ALTER TABLE `airports`
  ADD CONSTRAINT `airports_ibfk_1` FOREIGN KEY (`country_id`) REFERENCES `countries` (`country_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `baggage_options`
--
ALTER TABLE `baggage_options`
  ADD CONSTRAINT `baggage_options_ibfk_1` FOREIGN KEY (`airline_id`) REFERENCES `airlines` (`airline_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE;

--
-- Constraints for table `booking_details`
--
ALTER TABLE `booking_details`
  ADD CONSTRAINT `booking_details_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `booking_details_ibfk_2` FOREIGN KEY (`flight_id`) REFERENCES `flights` (`flight_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `booking_details_ibfk_3` FOREIGN KEY (`passenger_id`) REFERENCES `passengers` (`passenger_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `booking_details_ibfk_4` FOREIGN KEY (`seat_id`) REFERENCES `flight_seats` (`seat_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `booking_details_ibfk_5` FOREIGN KEY (`baggage_option_id`) REFERENCES `baggage_options` (`baggage_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `booking_details_ibfk_6` FOREIGN KEY (`meal_option_id`) REFERENCES `meal_options` (`meal_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `booking_service_packages`
--
ALTER TABLE `booking_service_packages`
  ADD CONSTRAINT `booking_service_packages_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `booking_service_packages_ibfk_2` FOREIGN KEY (`flight_id`) REFERENCES `flights` (`flight_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `booking_service_packages_ibfk_3` FOREIGN KEY (`service_package_id`) REFERENCES `service_packages` (`package_id`) ON DELETE CASCADE;

--
-- Constraints for table `email_notifications`
--
ALTER TABLE `email_notifications`
  ADD CONSTRAINT `email_notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `email_notifications_ibfk_2` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`) ON UPDATE CASCADE;

--
-- Constraints for table `flights`
--
ALTER TABLE `flights`
  ADD CONSTRAINT `flights_ibfk_1` FOREIGN KEY (`airline_id`) REFERENCES `airlines` (`airline_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `flights_ibfk_2` FOREIGN KEY (`aircraft_id`) REFERENCES `aircraft` (`aircraft_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `flights_ibfk_3` FOREIGN KEY (`departure_airport_id`) REFERENCES `airports` (`airport_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `flights_ibfk_4` FOREIGN KEY (`arrival_airport_id`) REFERENCES `airports` (`airport_id`) ON UPDATE CASCADE;

--
-- Constraints for table `flight_baggage_services`
--
ALTER TABLE `flight_baggage_services`
  ADD CONSTRAINT `flight_baggage_services_ibfk_1` FOREIGN KEY (`flight_id`) REFERENCES `flights` (`flight_id`) ON DELETE CASCADE;

--
-- Constraints for table `flight_meal_services`
--
ALTER TABLE `flight_meal_services`
  ADD CONSTRAINT `flight_meal_services_ibfk_1` FOREIGN KEY (`flight_id`) REFERENCES `flights` (`flight_id`) ON DELETE CASCADE;

--
-- Constraints for table `flight_recommendations`
--
ALTER TABLE `flight_recommendations`
  ADD CONSTRAINT `flight_recommendations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `flight_recommendations_ibfk_2` FOREIGN KEY (`flight_id`) REFERENCES `flights` (`flight_id`) ON UPDATE CASCADE;

--
-- Constraints for table `flight_seats`
--
ALTER TABLE `flight_seats`
  ADD CONSTRAINT `flight_seats_ibfk_1` FOREIGN KEY (`flight_id`) REFERENCES `flights` (`flight_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `flight_seats_ibfk_2` FOREIGN KEY (`class_id`) REFERENCES `travel_classes` (`class_id`) ON UPDATE CASCADE;

--
-- Constraints for table `flight_services`
--
ALTER TABLE `flight_services`
  ADD CONSTRAINT `flight_services_ibfk_1` FOREIGN KEY (`flight_id`) REFERENCES `flights` (`flight_id`) ON UPDATE CASCADE;

--
-- Constraints for table `meal_options`
--
ALTER TABLE `meal_options`
  ADD CONSTRAINT `meal_options_ibfk_1` FOREIGN KEY (`airline_id`) REFERENCES `airlines` (`airline_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`) ON UPDATE CASCADE;

--
-- Constraints for table `promotion_usage`
--
ALTER TABLE `promotion_usage`
  ADD CONSTRAINT `promotion_usage_ibfk_1` FOREIGN KEY (`promotion_id`) REFERENCES `promotions` (`promotion_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `promotion_usage_ibfk_2` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`booking_id`) ON UPDATE CASCADE;

--
-- Constraints for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE;

--
-- Constraints for table `service_packages`
--
ALTER TABLE `service_packages`
  ADD CONSTRAINT `service_packages_ibfk_1` FOREIGN KEY (`airline_id`) REFERENCES `airlines` (`airline_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `user_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `user_search_history`
--
ALTER TABLE `user_search_history`
  ADD CONSTRAINT `user_search_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `user_search_history_ibfk_2` FOREIGN KEY (`departure_airport_id`) REFERENCES `airports` (`airport_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `user_search_history_ibfk_3` FOREIGN KEY (`arrival_airport_id`) REFERENCES `airports` (`airport_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `user_search_history_ibfk_4` FOREIGN KEY (`travel_class_id`) REFERENCES `travel_classes` (`class_id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
