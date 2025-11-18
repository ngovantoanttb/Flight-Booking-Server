const axios = require('axios');
const CryptoJS = require('crypto-js');
const moment = require('moment');
const qs = require('qs');
const config = require('../config/zalopay.config');
const logger = require('../utils/logger');
const { BadRequestError, PaymentError } = require('../utils/errors');
const { Payment, Booking } = require('../models');

class ZaloPayService {
	/**
	 * Tạo đơn hàng thanh toán ZaloPay
	 * @param {Object} paymentData - Thông tin thanh toán
	 * @param {string} paymentData.booking_id - ID booking
	 * @param {number} paymentData.amount - Số tiền (VND)
	 * @param {string} paymentData.description - Mô tả đơn hàng
	 * @param {string} paymentData.user_id - ID người dùng
	 * @param {string} paymentData.contact_email - Email liên hệ
	 * @param {string} paymentData.contact_phone - Số điện thoại
	 * @returns {Promise<Object>} Kết quả tạo đơn hàng
	 */
	async createPayment(paymentData) {
		try {
			const { booking_id, amount, description, user_id } = paymentData;

			console.log(paymentData);

			// Validate input
			if (!booking_id || !amount || !description || !user_id) {
				throw new BadRequestError('Missing required payment data');
			}

			// Generate unique transaction ID
			const transID = Math.floor(Math.random() * 1000000);
			const app_trans_id = `${moment().format('YYMMDD')}_${transID}`;

			// Prepare embed data
			const embed_data = {
				redirecturl: config.redirect_url,
				booking_id: booking_id,
				user_id: user_id,
			};

			// Prepare items (flight booking details)
			const items = [
				{
					item_id: booking_id,
					item_name: description,
					item_price: amount,
					item_quantity: 1,
				},
			];

			// Create order object
			const order = {
				app_id: config.app_id,
				app_trans_id: app_trans_id,
				app_user: user_id.toString(),
				item: JSON.stringify(items),
				embed_data: JSON.stringify(embed_data),
				amount: parseFloat(amount),
				callback_url: config.callback_url,
				description: description,
				bank_code: '', // Empty for all banks
				app_time: Date.now(),
			};

			// Generate MAC signature
			const data = [
				config.app_id,
				order.app_trans_id,
				order.app_user,
				order.amount,
				order.app_time,
				order.embed_data,
				order.item,
			].join('|');

			order.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

			logger.info('Creating ZaloPay payment order:', {
				app_trans_id: order.app_trans_id,
				amount: order.amount,
				booking_id: booking_id,
			});

			// Call ZaloPay API - Send as form data
			const response = await axios.post(config.endpoints.create, order, {
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				timeout: 30000,
			});

			console.log('ZaloPay API Response:', response.data);

			// Handle real ZaloPay response format
			const zalopayResponse = response.data;

			// Check if response has the correct format
			if (zalopayResponse.return_code === 1) {
				// Real ZaloPay success response
				return {
					app_trans_id: app_trans_id,
					message: zalopayResponse.return_message,
					order_url: zalopayResponse.order_url,
					zp_trans_id: zalopayResponse.zp_trans_token,
					amount: amount,
					booking_id: booking_id,
				};
			} else {
				// ZaloPay error response
				throw new PaymentError(
					`ZaloPay create payment failed: ${
						zalopayResponse.return_message ||
						zalopayResponse.returnmessage ||
						'Unknown error'
					}`
				);
			}
		} catch (error) {
			logger.error('ZaloPay create payment error:', error);
			throw error;
		}
	}

	/**
	 * Xử lý callback từ ZaloPay
	 * @param {Object} callbackData - Dữ liệu callback
	 * @returns {Promise<Object>} Kết quả xử lý callback
	 */
	async handleCallback(callbackData) {
		try {
			const { data: dataStr, mac: reqMac } = callbackData;

			// Verify MAC signature
			const mac = CryptoJS.HmacSHA256(dataStr, config.key2).toString();

			if (reqMac !== mac) {
				logger.warn('ZaloPay callback MAC verification failed');
				return {
					return_code: -1,
					return_message: 'mac not equal',
				};
			}

			// Parse callback data
			const dataJson = JSON.parse(dataStr);
			const { app_trans_id, zp_trans_id, amount, status } = dataJson;

			logger.info('ZaloPay callback received:', {
				app_trans_id,
				zp_trans_id,
				amount,
				status,
			});

			// Update payment status in database
			// This will be handled by the controller
			return {
				return_code: 1,
				return_message: 'success',
				callback_data: dataJson,
			};
		} catch (error) {
			logger.error('ZaloPay callback processing error:', error);
			return {
				return_code: 0,
				return_message: error.message,
			};
		}
	}

	/**
	 * Kiểm tra trạng thái đơn hàng
	 * @param {string} app_trans_id - ID giao dịch
	 * @returns {Promise<Object>} Trạng thái đơn hàng
	 */
	async queryPaymentStatus(app_trans_id) {
		try {
			if (!app_trans_id) {
				throw new BadRequestError('app_trans_id is required');
			}

			const postData = {
				app_id: config.app_id,
				app_trans_id: app_trans_id,
			};

			// Generate MAC signature
			const data = `${postData.app_id}|${postData.app_trans_id}|${config.key1}`;
			postData.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

			logger.info('Querying ZaloPay payment status:', { app_trans_id });

			// Call ZaloPay query API
			const response = await axios.post(
				config.endpoints.query,
				qs.stringify(postData),
				{
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
					timeout: 30000,
				}
			);

			return {
				success: true,
				data: response.data,
			};
		} catch (error) {
			logger.error('ZaloPay query payment status error:', error);
			throw error;
		}
	}

	/**
	 * Tạo hoàn tiền
	 * @param {Object} refundData - Thông tin hoàn tiền
	 * @returns {Promise<Object>} Kết quả hoàn tiền
	 */
	async createRefund(refundData) {
		try {
			const { zp_trans_id, amount, description } = refundData;

			if (!zp_trans_id || !amount) {
				throw new BadRequestError('Missing required refund data');
			}

			const refundData_obj = {
				app_id: config.app_id,
				zp_trans_id: zp_trans_id,
				amount: amount,
				description: description || 'Refund for flight booking',
				timestamp: Date.now(),
			};

			// Generate MAC signature
			const data = [
				config.app_id,
				refundData_obj.zp_trans_id,
				refundData_obj.amount,
				refundData_obj.description,
				refundData_obj.timestamp,
			].join('|');

			refundData_obj.mac = CryptoJS.HmacSHA256(
				data,
				config.key1
			).toString();

			logger.info('Creating ZaloPay refund:', {
				zp_trans_id,
				amount,
			});

			// Call ZaloPay refund API
			const response = await axios.post(
				config.endpoints.refund,
				qs.stringify(refundData_obj),
				{
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
					timeout: 30000,
				}
			);

			return {
				success: true,
				data: response.data,
			};
		} catch (error) {
			logger.error('ZaloPay create refund error:', error);
			throw error;
		}
	}

	/**
	 * Verify MAC signature
	 * @param {string} data - Data to verify
	 * @param {string} mac - MAC signature
	 * @param {string} key - Secret key
	 * @returns {boolean} Verification result
	 */
	verifyMac(data, mac, key) {
		const expectedMac = CryptoJS.HmacSHA256(data, key).toString();
		return expectedMac === mac;
	}

	/**
	 * Verify redirect checksum from ZaloPay
	 * @param {Object} params - Redirect parameters
	 * @returns {boolean} Verification result
	 */
	async verifyRedirectChecksum(params) {
		try {
			const {
				appid,
				apptransid,
				pmcid,
				bankcode,
				amount,
				discountamount,
				status,
				checksum,
			} = params;

			// Create checksum data string
			const checksumData = `${appid}|${apptransid}|${pmcid}|${bankcode}|${amount}|${discountamount}|${status}`;

			// Generate expected checksum using key2
			const expectedChecksum = CryptoJS.HmacSHA256(
				checksumData,
				config.key2
			).toString();

			logger.info('Verifying redirect checksum:', {
				checksumData,
				receivedChecksum: checksum,
				expectedChecksum,
				isValid: expectedChecksum === checksum,
				key2: config.key2.substring(0, 10) + '...',
			});

			return expectedChecksum === checksum;
		} catch (error) {
			logger.error('Error verifying redirect checksum:', error);
			return false;
		}
	}

	/**
	 * Update payment and booking status after successful payment
	 * @param {Object} paymentData - Payment data
	 * @returns {Object} Update result
	 */
	async updatePaymentSuccess(paymentData) {
		try {
			const {
				app_trans_id,
				amount,
				discount_amount,
				payment_method,
				bank_code,
			} = paymentData;

			logger.info('Updating payment success:', { app_trans_id, amount });

			// Find payment record by app_trans_id
			const payment = await Payment.findOne({
				where: { payment_reference: app_trans_id },
				include: [{ model: Booking }],
			});

			if (!payment) {
				logger.error(
					'Payment not found for app_trans_id:',
					app_trans_id
				);
				return { success: false, error: 'Payment not found' };
			}

			// Update payment status
			await payment.update({
				status: 'completed',
				payment_date: new Date(),
				transaction_details: {
					...payment.transaction_details,
					bank_code: bank_code,
					discount_amount: discount_amount,
					completed_at: new Date().toISOString(),
				},
			});

			// Update booking status
			const booking = payment.Booking;
			await booking.update({
				status: 'confirmed',
				payment_status: 'paid',
			});

			logger.info('Payment and booking updated successfully:', {
				payment_id: payment.payment_id,
				booking_id: booking.booking_id,
				booking_reference: booking.booking_reference,
			});

			return {
				success: true,
				payment: payment,
				booking: booking,
			};
		} catch (error) {
			logger.error('Error updating payment success:', error);
			return { success: false, error: error.message };
		}
	}
}

module.exports = new ZaloPayService();
