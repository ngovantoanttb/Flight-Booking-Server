/**
 * E-Ticket PDF Service
 * Handles generating PDF e-tickets
 */

const puppeteer = require('puppeteer');
const logger = require('../utils/logger');

class EticketPdfService {
	/**
	 * Generate PDF e-ticket for a booking
	 * @param {Object} bookingData - Complete booking data with passengers, flight, and service package
	 * @returns {Buffer} PDF file buffer
	 */
	static async generateEticketPdf(bookingData) {
		let browser;
		try {
			browser = await puppeteer.launch({
				headless: 'new',
				args: ['--no-sandbox', '--disable-setuid-sandbox'],
			});
			const page = await browser.newPage();

			// Generate HTML content
			const htmlContent = this.generateHtmlContent(bookingData);

			await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

			// Generate PDF
			const pdfBuffer = await page.pdf({
				format: 'A4',
				printBackground: true,
				margin: {
					top: '20mm',
					right: '15mm',
					bottom: '20mm',
					left: '15mm',
				},
			});

			logger.info('E-ticket PDF generated successfully');

			// Ensure we return a proper Buffer
			if (Buffer.isBuffer(pdfBuffer)) {
				return pdfBuffer;
			} else {
				// Convert to Buffer if it's not already
				return Buffer.from(pdfBuffer);
			}
		} catch (error) {
			logger.error('Error generating e-ticket PDF:', error);
			throw error;
		} finally {
			if (browser) {
				await browser.close();
			}
		}
	}

	/**
	 * Generate HTML content for the e-ticket
	 * @param {Object} bookingData - Booking data with flights array
	 * @returns {string} HTML content
	 */
	static generateHtmlContent(bookingData) {
		const { booking, flights, contact_info, payment } = bookingData;

		// Format date and time
		const formatDateTime = (dateTime) => {
			const date = new Date(dateTime);
			return {
				date: date.toLocaleDateString('vi-VN'),
				time: date.toLocaleTimeString('vi-VN', {
					hour: '2-digit',
					minute: '2-digit',
				}),
			};
		};

		// Format passenger type
		const getPassengerType = (passengerType, dateOfBirth) => {
			if (passengerType) {
				if (passengerType === 'infant') return 'Em bé';
				if (passengerType === 'child') return 'Trẻ em';
				return 'Người lớn';
			}
			// Fallback to age calculation
			if (!dateOfBirth) return 'Người lớn';
			const age =
				new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
			if (age < 2) return 'Em bé';
			if (age < 12) return 'Trẻ em';
			return 'Người lớn';
		};

		// Get title from passenger data
		const getTitle = (passenger) => {
			if (passenger.title) {
				return passenger.title;
			}
			if (passenger.gender === 'female') return 'Bà';
			if (passenger.gender === 'male') return 'Ông';
			return 'Ông'; // Default
		};

		// Get segment type label
		const getSegmentLabel = (segmentType) => {
			if (segmentType === 'outbound') return 'CHUYẾN ĐI';
			if (segmentType === 'return') return 'CHUYẾN VỀ';
			return segmentType ? `CHUYẾN ${segmentType.toUpperCase()}` : 'CHUYẾN BAY';
		};

		// Generate flights HTML
		const flightsHtml = (flights || []).map((flight, flightIndex) => {
			const depDateTime = formatDateTime(flight.departure_time);
			const arrDateTime = formatDateTime(flight.arrival_time);
			const segmentLabel = getSegmentLabel(flight.segment_type);

			// Generate passengers HTML for this flight
			const flightPassengersHtml = (flight.passengers || [])
				.map((passenger, index) => {
					const passengerType = getPassengerType(passenger.passenger_type, passenger.date_of_birth);
					const title = getTitle(passenger);
					const baggageText = passenger.baggage_allowance || 'Không có';

					return `
					<div class="passenger-section">
						<h3>Hành khách ${index + 1}: ${passengerType}</h3>
						<table class="passenger-table">
							<tr class="table-header">
								<td colspan="2">THÔNG TIN HÀNH KHÁCH</td>
							</tr>
							<tr>
								<td>Danh xưng</td>
								<td>${title}</td>
							</tr>
							<tr>
								<td>Họ tên</td>
								<td>${(passenger.first_name || '').toUpperCase()} ${(passenger.last_name || '').toUpperCase()}</td>
							</tr>
							<tr>
								<td>CCCD/Hộ chiếu</td>
								<td>${passenger.passport_number || 'N/A'}</td>
							</tr>
							${passenger.passport_issuing_country ? `
							<tr>
								<td>Quốc gia cấp</td>
								<td>${passenger.passport_issuing_country}</td>
							</tr>
							` : ''}
							${passenger.passport_expiry ? `
							<tr>
								<td>Ngày hết hạn</td>
								<td>${new Date(passenger.passport_expiry).toLocaleDateString('vi-VN')}</td>
							</tr>
							` : ''}
							<tr>
								<td>Ngày sinh</td>
								<td>${passenger.date_of_birth ? new Date(passenger.date_of_birth).toLocaleDateString('vi-VN') : 'N/A'}</td>
							</tr>
							<tr>
								<td>Quốc tịch</td>
								<td>${passenger.nationality || 'Việt Nam'}</td>
							</tr>
							<tr>
								<td>Hạng vé</td>
								<td>${passenger.travel_class?.class_name || passenger.travel_class || 'Economy Class'}</td>
							</tr>
							<tr>
								<td>Hành lý</td>
								<td>${baggageText}</td>
							</tr>

						</table>
					</div>
				`;
				})
				.join('');

			// Generate services (baggage/meals) summary at flight level (not per passenger)
			const servicesSummaryHtml = `
				${flight.baggage_services && flight.baggage_services.length > 0 ? `
				<div class="section">
					<div class="section-title">DỊCH VỤ HÀNH LÝ (THEO CHẶNG)</div>
					<table class="info-table">
						<tr>
							<th>Gói</th>
							<th>Số lượng</th>
							<th>Giá</th>
						</tr>
						${flight.baggage_services
							.map(
								(b) => `
								<tr>
									<td>${b.weight_kg}kg - ${b.description || ''}</td>
									<td>${b.quantity || 1}</td>
									<td>${new Intl.NumberFormat('vi-VN').format(parseFloat(b.price || 0))} VNĐ</td>
								</tr>
							`
							)
							.join('')}
					</table>
				</div>
				` : ''}

				${flight.meal_services && flight.meal_services.length > 0 ? `
				<div class="section">
					<div class="section-title">SUẤT ĂN (THEO CHẶNG)</div>
					<table class="info-table">
						<tr>
							<th>Món ăn</th>
							<th>Số lượng</th>
							<th>Giá</th>
						</tr>
						${flight.meal_services
							.map(
								(m) => `
								<tr>
									<td>${m.meal_name}</td>
									<td>${m.quantity || 1}</td>
									<td>${new Intl.NumberFormat('vi-VN').format(parseFloat(m.price || 0))} VNĐ</td>
								</tr>
							`
							)
							.join('')}
					</table>
				</div>
				` : ''}
			`;

			return `
				<div class="flight-segment">
					<div class="section-title">${segmentLabel} - ${flight.flight_number || 'N/A'}</div>
					<div class="flight-info-grid">
						<div class="flight-info-left">
							<h4>Chuyến bay</h4>
							<div class="flight-details">
								<p><strong>Số chuyến:</strong> ${flight.flight_number || 'N/A'}</p>
								<p><strong>Từ:</strong> ${flight.departure_airport?.airport_name || 'N/A'} (${flight.departure_airport?.city || 'N/A'})</p>
								<p><strong>Đến:</strong> ${flight.arrival_airport?.airport_name || 'N/A'} (${flight.arrival_airport?.city || 'N/A'})</p>
								<p><strong>Ngày giờ khởi hành:</strong> ${depDateTime.date} ${depDateTime.time}</p>
								<p><strong>Ngày giờ đến:</strong> ${arrDateTime.date} ${arrDateTime.time}</p>
							</div>
						</div>
						<div class="flight-info-right">
							<h4>Chi tiết</h4>
							<div class="flight-details">
								<p><strong>Hãng hàng không:</strong> ${flight.airline?.airline_name || 'N/A'}</p>
								<p><strong>Máy bay:</strong> ${flight.aircraft?.model || 'N/A'} (${flight.aircraft?.aircraft_type || 'N/A'})</p>
								${flight.service_packages && flight.service_packages.length > 0 ? `
								<p><strong>Gói dịch vụ:</strong> ${flight.service_packages.map(p => p.package_name).join(', ')}</p>
								` : ''}
							</div>
						</div>
					</div>
					${servicesSummaryHtml}
					${flightPassengersHtml}
				</div>
			`;
		}).join('');

		return `
			<!DOCTYPE html>
			<html lang="vi">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Vé Điện Tử - ${booking.booking_reference}</title>
				<style>
					body {
						font-family: 'Arial', sans-serif;
						margin: 0;
						padding: 15px;
						background-color: white;
						color: #333;
						line-height: 1.3;
						font-size: 12px;
					}

					.header {
						text-align: center;
						font-size: 20px;
						font-weight: bold;
						margin-bottom: 20px;
						color: #000;
						border-bottom: 2px solid #000;
						padding-bottom: 10px;
					}

					.section {
						margin-bottom: 15px;
					}

					.section-title {
						font-size: 14px;
						font-weight: bold;
						background-color: #f0f0f0;
						padding: 8px;
						margin-bottom: 8px;
						border: 1px solid #ccc;
						text-align: center;
					}

					.info-table {
						width: 100%;
						border-collapse: collapse;
						margin-bottom: 15px;
						font-size: 11px;
					}

					.info-table th {
						background-color: #e8e8e8;
						font-weight: bold;
						padding: 6px 8px;
						text-align: left;
						border: 1px solid #999;
						width: 30%;
					}

					.info-table td {
						padding: 6px 8px;
						border: 1px solid #999;
						vertical-align: top;
					}

					.passenger-section {
						margin-bottom: 15px;
						border-top: 2px solid #000;
						padding-top: 10px;
					}

					.passenger-section h3 {
						font-size: 14px;
						font-weight: bold;
						margin-bottom: 8px;
						color: #000;
					}

					.passenger-table {
						width: 100%;
						border-collapse: collapse;
						border: 1px solid #000;
						font-size: 11px;
					}

					.passenger-table .table-header td {
						background-color: #e8e8e8;
						font-weight: bold;
						text-align: center;
						padding: 6px;
						border: 1px solid #000;
					}

					.passenger-table td {
						padding: 4px 6px;
						border: 1px solid #000;
					}

					.passenger-table td:first-child {
						background-color: #f5f5f5;
						font-weight: 500;
						width: 25%;
					}

					.passenger-list-title {
						text-align: center;
						font-size: 16px;
						font-weight: bold;
						margin: 20px 0 15px 0;
						color: #000;
						border-top: 2px solid #000;
						padding-top: 10px;
					}

					.booking-info {
						background-color: #f9f9f9;
						padding: 10px;
						border: 1px solid #ccc;
						margin-bottom: 15px;
					}

					.booking-info h4 {
						margin: 0 0 8px 0;
						color: #000;
						font-size: 14px;
					}

					.booking-info p {
						margin: 3px 0;
						color: #333;
						font-size: 11px;
					}

					.flight-info-grid {
						display: grid;
						grid-template-columns: 1fr 1fr;
						gap: 15px;
						margin-bottom: 15px;
					}

					.flight-info-left, .flight-info-right {
						border: 1px solid #ccc;
						padding: 10px;
					}

					.flight-info-left h4, .flight-info-right h4 {
						margin: 0 0 8px 0;
						font-size: 12px;
						font-weight: bold;
						color: #000;
					}

					.flight-details {
						font-size: 11px;
						line-height: 1.4;
					}

					.flight-details p {
						margin: 2px 0;
					}

					.flight-segment {
						margin-bottom: 30px;
						border-top: 2px solid #000;
						padding-top: 15px;
					}

					.flight-segment:first-child {
						border-top: none;
						padding-top: 0;
					}
				</style>
			</head>
			<body>
				<div class="header">VÉ ĐIỆN TỬ - ${
					flights && flights[0]?.airline?.airline_name || 'Vietnam Airlines'
				}</div>

				<div class="booking-info">
					<h4>Thông tin đặt chỗ</h4>
					<p><strong>Mã đặt chỗ:</strong> ${booking.booking_reference}</p>
					<p><strong>Loại chuyến:</strong> ${
						booking.trip_type === 'round-trip' ? 'Khứ hồi' :
						booking.trip_type === 'multi-city' ? 'Nhiều chặng' : 'Một chiều'
					}</p>
					<p><strong>Ngày đặt:</strong> ${new Date(
						booking.booking_date
					).toLocaleDateString('vi-VN')}</p>
					<p><strong>Tổng tiền:</strong> ${new Intl.NumberFormat('vi-VN').format(
						parseFloat(booking.total_amount || 0)
					)} VNĐ</p>
					${contact_info ? `
					<p><strong>Người liên hệ:</strong> ${contact_info.first_name || ''} ${contact_info.last_name || ''}</p>
					<p><strong>Email:</strong> ${contact_info.email || 'N/A'}</p>
					<p><strong>Điện thoại:</strong> ${contact_info.phone || 'N/A'}</p>
					` : ''}
				</div>

				${flightsHtml}

				${
					payment && payment.payment_id
						? `
				<div class="section">
					<div class="section-title">THÔNG TIN THANH TOÁN</div>
					<table class="info-table">
						<tr>
							<th>Phương thức thanh toán</th>
							<td>${payment.payment_method || 'N/A'}</td>
						</tr>
						<tr>
							<th>Trạng thái thanh toán</th>
							<td>${payment.status || 'N/A'}</td>
						</tr>
						<tr>
							<th>Số tiền</th>
							<td>${new Intl.NumberFormat('vi-VN').format(parseFloat(payment.amount || 0))} VNĐ</td>
						</tr>
						${
							payment.payment_reference
								? `<tr>
									<th>Mã giao dịch</th>
									<td>${payment.payment_reference}</td>
								</tr>`
								: ''
						}
						${
							payment.payment_date
								? `<tr>
									<th>Ngày thanh toán</th>
									<td>${new Date(payment.payment_date).toLocaleString('vi-VN')}</td>
								</tr>`
								: ''
						}
					</table>
				</div>
				`
						: ''
				}
			</body>
			</html>
		`;
	}
}

module.exports = EticketPdfService;
