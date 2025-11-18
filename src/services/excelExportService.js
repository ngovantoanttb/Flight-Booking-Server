/**
 * Excel Export Service
 * Handles exporting data to Excel files
 */

const XLSX = require('xlsx');
const logger = require('../utils/logger');

class ExcelExportService {
	/**
	 * Export airline market share data to Excel
	 * @param {Object} data - Market share data
	 * @param {string} period - Time period
	 * @returns {Buffer} Excel file buffer
	 */
	static exportAirlineMarketShare(data, period) {
		try {
			// Create workbook
			const workbook = XLSX.utils.book_new();

			// Prepare data for Excel
			const excelData = [
				['BÁO CÁO THỊ PHẦN HÃNG HÀNG KHÔNG'],
				[`Thời gian: ${this.formatPeriod(period)}`],
				[`Thời gian xuất: ${new Date().toLocaleString('vi-VN')}`],
				['Người xuất: admin'],
				[], // Empty row
				['Mã hãng', 'Tên hãng', 'Số lượng đặt chỗ', 'Thị phần (%)'],
			];

			// Add airline data
			data.airlines.forEach((airline) => {
				excelData.push([
					airline.airline_code,
					airline.airline_name,
					airline.ticket_count,
					`${airline.market_share_percentage}%`,
				]);
			});

			// Add total row
			excelData.push(['Tổng cộng', '', data.total_tickets, '100%']);

			// Create worksheet
			const worksheet = XLSX.utils.aoa_to_sheet(excelData);

			// Set column widths
			const columnWidths = [
				{ wch: 12 }, // Mã hãng
				{ wch: 30 }, // Tên hãng
				{ wch: 18 }, // Số lượng đặt chỗ
				{ wch: 15 }, // Thị phần
			];
			worksheet['!cols'] = columnWidths;

			// Add worksheet to workbook
			XLSX.utils.book_append_sheet(
				workbook,
				worksheet,
				'Thị phần hãng hàng không'
			);

			// Generate Excel buffer
			const excelBuffer = XLSX.write(workbook, {
				type: 'buffer',
				bookType: 'xlsx',
			});

			logger.info(
				`Excel export completed for airline market share (${period})`
			);
			return excelBuffer;
		} catch (error) {
			logger.error(
				'Error exporting airline market share to Excel:',
				error
			);
			throw error;
		}
	}

	/**
	 * Export revenue trend data to Excel
	 * @param {Object} data - Revenue trend data
	 * @param {string} month - Month
	 * @param {string} year - Year
	 * @returns {Buffer} Excel file buffer
	 */
	static exportRevenueTrend(data, month, year) {
		try {
			// Create workbook
			const workbook = XLSX.utils.book_new();

			// Prepare data for Excel
			const excelData = [
				[`BÁO CÁO DOANH THU THÁNG ${month} NĂM ${year}`],
				[`Thời gian xuất: ${new Date().toLocaleString('vi-VN')}`],
				['Người xuất: admin'],
				[], // Empty row
				['Ngày', 'Số đơn hàng', 'Doanh thu (VNĐ)'],
			];

			// Add daily data
			data.daily_revenue.forEach((day) => {
				excelData.push([
					day.date,
					day.orders_count,
					this.formatCurrency(day.revenue),
				]);
			});

			// Add total row
			excelData.push([
				'Tổng cộng',
				data.total_orders,
				this.formatCurrency(data.total_revenue),
			]);

			// Create worksheet
			const worksheet = XLSX.utils.aoa_to_sheet(excelData);

			// Set column widths
			const columnWidths = [
				{ wch: 15 }, // Ngày
				{ wch: 15 }, // Số đơn hàng
				{ wch: 20 }, // Doanh thu
			];
			worksheet['!cols'] = columnWidths;

			// Add worksheet to workbook
			XLSX.utils.book_append_sheet(
				workbook,
				worksheet,
				'Doanh thu tháng'
			);

			// Generate Excel buffer
			const excelBuffer = XLSX.write(workbook, {
				type: 'buffer',
				bookType: 'xlsx',
			});

			logger.info(
				`Excel export completed for revenue trend (${month}/${year})`
			);
			return excelBuffer;
		} catch (error) {
			logger.error('Error exporting revenue trend to Excel:', error);
			throw error;
		}
	}

	/**
	 * Export booking statistics to Excel
	 * @param {Object} data - Booking statistics data
	 * @param {string} period - Time period
	 * @returns {Buffer} Excel file buffer
	 */
	static exportBookingStats(data, period) {
		try {
			// Create workbook
			const workbook = XLSX.utils.book_new();

			// Prepare data for Excel
			const excelData = [
				[`BÁO CÁO ĐẶT CHỖ ${this.formatPeriod(period)}`],
				[`Thời gian xuất: ${new Date().toLocaleString('vi-VN')}`],
				['Người xuất: admin'],
				[], // Empty row
				['Ngày', 'Số lượng đặt chỗ', 'Tổng số hành khách'],
			];

			// Add daily data
			data.daily_stats.forEach((day) => {
				excelData.push([
					day.date,
					day.bookings_count,
					day.passengers_count,
				]);
			});

			// Add total row
			excelData.push([
				'Tổng cộng',
				data.total_bookings,
				data.total_passengers,
			]);

			// Create worksheet
			const worksheet = XLSX.utils.aoa_to_sheet(excelData);

			// Set column widths
			const columnWidths = [
				{ wch: 15 }, // Ngày
				{ wch: 18 }, // Số lượng đặt chỗ
				{ wch: 20 }, // Tổng số hành khách
			];
			worksheet['!cols'] = columnWidths;

			// Add worksheet to workbook
			XLSX.utils.book_append_sheet(
				workbook,
				worksheet,
				'Thống kê đặt chỗ'
			);

			// Generate Excel buffer
			const excelBuffer = XLSX.write(workbook, {
				type: 'buffer',
				bookType: 'xlsx',
			});

			logger.info(`Excel export completed for booking stats (${period})`);
			return excelBuffer;
		} catch (error) {
			logger.error('Error exporting booking stats to Excel:', error);
			throw error;
		}
	}

	/**
	 * Export baggage service statistics to Excel
	 * @param {Object} data - Baggage service statistics data
	 * @param {string} period - Time period
	 * @returns {Buffer} Excel file buffer
	 */
	static exportBaggageServiceStats(data, period) {
		try {
			// Create workbook
			const workbook = XLSX.utils.book_new();

			// Prepare data for Excel
			const excelData = [
				[`BÁO CÁO DỊCH VỤ HÀNH LÝ ${this.formatPeriod(period)}`],
				[`Thời gian xuất: ${new Date().toLocaleString('vi-VN')}`],
				['Người xuất: admin'],
				[], // Empty row
				[
					'Mã dịch vụ',
					'Trọng lượng (kg)',
					'Mô tả',
					'Đơn giá (VNĐ)',
					'Số lượng sử dụng',
					'Tổng doanh thu (VNĐ)',
				],
			];

			// Add baggage service data
			data.baggage_services.forEach((service) => {
				excelData.push([
					service.baggage_id,
					service.weight_kg,
					service.description,
					this.formatCurrency(service.unit_price),
					service.usage_count,
					this.formatCurrency(service.total_revenue),
				]);
			});

			// Add total row
			excelData.push([
				'Tổng cộng',
				'',
				'',
				'',
				data.total_orders,
				this.formatCurrency(data.total_revenue),
			]);

			// Create worksheet
			const worksheet = XLSX.utils.aoa_to_sheet(excelData);

			// Set column widths
			const columnWidths = [
				{ wch: 12 }, // Mã dịch vụ
				{ wch: 15 }, // Trọng lượng
				{ wch: 30 }, // Mô tả
				{ wch: 18 }, // Đơn giá
				{ wch: 18 }, // Số lượng sử dụng
				{ wch: 20 }, // Tổng doanh thu
			];
			worksheet['!cols'] = columnWidths;

			// Add worksheet to workbook
			XLSX.utils.book_append_sheet(
				workbook,
				worksheet,
				'Dịch vụ hành lý'
			);

			// Generate Excel buffer
			const excelBuffer = XLSX.write(workbook, {
				type: 'buffer',
				bookType: 'xlsx',
			});

			logger.info(
				`Excel export completed for baggage service stats (${period})`
			);
			return excelBuffer;
		} catch (error) {
			logger.error(
				'Error exporting baggage service stats to Excel:',
				error
			);
			throw error;
		}
	}

	/**
	 * Format period for display
	 * @param {string} period - Period code
	 * @returns {string} Formatted period
	 */
	static formatPeriod(period) {
		const periodMap = {
			'7days': '7 ngày',
			'14days': '14 ngày',
			month: '1 tháng',
			'3months': '3 tháng',
			'6months': '6 tháng',
			'12months': '12 tháng',
		};
		return periodMap[period] || period;
	}

	/**
	 * Format currency for display
	 * @param {number} amount - Amount to format
	 * @returns {string} Formatted currency
	 */
	static formatCurrency(amount) {
		return new Intl.NumberFormat('vi-VN').format(amount);
	}
}

module.exports = ExcelExportService;
