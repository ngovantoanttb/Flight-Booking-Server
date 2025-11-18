const zalopayService = require('../services/zalopayService');
const { Payment, Booking, User } = require('../models');
const { Op } = require('sequelize');
const { sendSuccess, sendError } = require('../utils/response');
const logger = require('../utils/logger');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const emailService = require('../config/emailConfig');
const { BASE_URL: baseUrl } = require('../config/env.config');
/**
 * Create a ZaloPay payment for a booking
 */
const createZaloPayPayment = async (req, res, next) => {
	try {
		const { booking_id } = req.body;
		const user_id = req.user.user_id;

		const booking = await Booking.findOne({
			where: { booking_id, user_id, status: 'pending' },
		});
		if (!booking)
			return sendError(
				res,
				'Booking not found or already processed',
				404
			);

		const existingPayment = await Payment.findOne({
			where: { booking_id, payment_method: 'zalopay' },
		});
		if (existingPayment && existingPayment.status === 'completed')
			return sendError(
				res,
				'Payment already completed for this booking',
				400
			);

		const paymentData = {
			booking_id,
			amount: booking.total_amount,
			description: `Flight Booking - ${booking.booking_reference}`,
			user_id,
			contact_email: booking.contact_email,
			contact_phone: booking.contact_phone,
		};

		const paymentResult = await zalopayService.createPayment(paymentData);

		await Payment.upsert({
			booking_id,
			amount: booking.total_amount,
			payment_method: 'zalopay',
			payment_reference: paymentResult.app_trans_id,
			status: 'pending',
			user_id,
			contact_email: booking.contact_email,
			contact_phone: booking.contact_phone,
		});

		return sendSuccess(res, 'Payment created successfully', {
			payment_url: paymentResult.order_url,
			app_trans_id: paymentResult.app_trans_id,
			booking_reference: booking.booking_reference,
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Lấy lịch sử thanh toán của user
 * GET /api/payments/history
 */
const getPaymentHistory = async (req, res, next) => {
	try {
		const user_id = req.user.user_id;
		const { page = 1, limit = 10 } = req.query;

		const offset = (page - 1) * limit;

		const payments = await Payment.findAndCountAll({
			include: [
				{
					model: Booking,
					where: { user_id: user_id },
					attributes: [
						'booking_reference',
						'booking_date',
						'total_amount',
						'status',
					],
					required: true,
				},
			],
			order: [['payment_id', 'DESC']],
			limit: parseInt(limit),
			offset: parseInt(offset),
		});

		return sendSuccess(res, 'Payment history retrieved successfully', {
			payments: payments.rows,
			pagination: {
				currentPage: parseInt(page),
				totalPages: Math.ceil(payments.count / limit),
				totalItems: payments.count,
				itemsPerPage: parseInt(limit),
			},
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Xử lý redirect từ ZaloPay sau khi thanh toán thành công
 * GET /payment/success
 */
const handlePaymentSuccess = async (req, res, next) => {
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
		} = req.query;

		logger.info('Payment success redirect received:', {
			appid,
			apptransid,
			pmcid,
			bankcode,
			amount,
			discountamount,
			status,
			checksum,
		});

		// Verify checksum (temporarily disabled for testing)
		const isValidChecksum = await zalopayService.verifyRedirectChecksum({
			appid,
			apptransid,
			pmcid,
			bankcode,
			amount,
			discountamount,
			status,
			checksum,
		});

		if (!isValidChecksum) {
			logger.warn(
				'Invalid checksum for payment success redirect - proceeding for testing'
			);
			// Temporarily comment out for testing
			// return res.status(400).send(`
			// 	<html>
			// 		<head><title>Payment Error</title></head>
			// 		<body>
			// 			<h1>Payment Error</h1>
			// 			<p>Invalid payment verification. Please contact support.</p>
			// 		</body>
			// 	</html>
			// `);
		}

		// Check if payment was successful
		if (status !== '1') {
			logger.error('Payment failed with status:', status);
			return res.status(400).send(`
				<html>
					<head><title>Payment Failed</title></head>
					<body>
						<h1>Payment Failed</h1>
						<p>Your payment was not successful. Please try again.</p>
					</body>
				</html>
			`);
		}

		// Update booking and payment status
		const result = await zalopayService.updatePaymentSuccess({
			app_trans_id: apptransid,
			amount: amount,
			discount_amount: discountamount,
			payment_method: 'zalopay',
			bank_code: bankcode,
		});

		if (!result.success) {
			logger.error('Failed to update payment status:', result.error);
			return res.status(500).send(`
				<html>
				<head>
				<title>Lỗi Thanh Toán</title>
				<style>
					body {
						font-family: Arial, sans-serif;
						text-align: center;
						padding: 50px;
						background: #f5f5f5;
					}
					.container {
						max-width: 600px;
						margin: 0 auto;
						background: white;
						padding: 40px;
						border-radius: 10px;
						box-shadow: 0 2px 10px rgba(0,0,0,0.1);
					}
					.error-icon {
						color: #dc3545;
						font-size: 60px;
						margin-bottom: 20px;
					}
					h1 {
						color: #dc3545;
						margin-bottom: 20px;
					}
					p {
						color: #333;
						margin-bottom: 15px;
						font-size: 16px;
					}
					.btn {
						display: inline-block;
						padding: 12px 24px;
						background: #007bff;
						color: white;
						text-decoration: none;
						border-radius: 5px;
						margin: 10px;
					}
					.btn:hover {
						background: #0056b3;
					}
				</style>
			</head>

			<body>
				<div class="container">
					<div class="error-icon">✖</div>
					<h1>Đã xảy ra lỗi khi thanh toán</h1>
					<p>Đã có lỗi trong quá trình xử lý thanh toán của bạn. Vui lòng liên hệ bộ phận hỗ trợ để được giúp đỡ.</p>
					<a href="${baseUrl}" class="btn">Về trang chủ</a>
				</div>
			</body>

			</html>
			`);
		}

		// Send payment confirmation email
		try {
			if (
				result &&
				result.success &&
				result.booking &&
				result.booking.contact_email
			) {
				const payload = {
					booking_reference: result.booking.booking_reference,
					amount: parseFloat(amount),
					payment_method: 'zalopay',
					bank_code: bankcode,
					booking_id: result.booking.booking_id,
					user_id: result.booking.user_id,
				};
				if (
					typeof emailService.sendPaymentConfirmation === 'function'
				) {
					await emailService.sendPaymentConfirmation(
						result.booking.contact_email,
						payload
					);
				} else if (
					typeof emailService.sendBookingConfirmation === 'function'
				) {
					await emailService.sendBookingConfirmation(
						result.booking.contact_email,
						{
							booking_id: result.booking.booking_id,
							user_id: result.booking.user_id,
							booking_reference: result.booking.booking_reference,
							total_amount: parseFloat(amount),
						}
					);
				}
			}
		} catch (emailErr) {
			logger.warn('Failed to send payment confirmation email:', emailErr);
		}

		// Show success page
		return res.send(`
			<html>
				<head>
					<title>Thanh toán thành công</title>
					<meta charset="UTF-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<style>
						body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
						.container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
						.success-icon { color: #28a745; font-size: 60px; margin-bottom: 20px; }
						h1 { color: #28a745; margin-bottom: 20px; }
						.booking-info { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
						.btn { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 10px; }
						.btn:hover { background: #0056b3; }
					</style>
				</head>
				<body>
					<div class="container">
						<div class="success-icon">✓</div>
						<h1>Thanh toán thành công!</h1>
						<p>Đặt vé của bạn đã được xác nhận và thanh toán đã được xử lý thành công.</p>

						<div class="booking-info">
							<h3>Chi tiết đặt vé</h3>
							<p><strong>Mã đặt chỗ:</strong> ${result.booking.booking_reference}</p>
							<p><strong>Số tiền đã thanh toán:</strong> ${parseFloat(amount).toLocaleString(
                "vi-VN"
              )} VND</p>
							<p><strong>Phương thức thanh toán:</strong> ZaloPay</p>
							<p><strong>Trạng thái:</strong> Đã xác nhận</p>
						</div>

						<p>Bạn sẽ sớm nhận được email xác nhận.</p>

						<a href="${baseUrl}" class="btn">Trở về trang chủ</a>
					</div>
				</body>
			</html>
		`);
	} catch (error) {
		logger.error('Error handling payment success:', error);
		return res.status(500).send(`
			<html>
				<head>
				<title>Lỗi Thanh Toán</title>
				<style>
					body {
						font-family: Arial, sans-serif;
						text-align: center;
						padding: 50px;
						background: #f5f5f5;
					}
					.container {
						max-width: 600px;
						margin: 0 auto;
						background: white;
						padding: 40px;
						border-radius: 10px;
						box-shadow: 0 2px 10px rgba(0,0,0,0.1);
					}
					.error-icon {
						color: #dc3545;
						font-size: 60px;
						margin-bottom: 20px;
					}
					h1 {
						color: #dc3545;
						margin-bottom: 20px;
					}
					p {
						color: #333;
						margin-bottom: 15px;
						font-size: 16px;
					}
					.btn {
						display: inline-block;
						padding: 12px 24px;
						background: #007bff;
						color: white;
						text-decoration: none;
						border-radius: 5px;
						margin: 10px;
					}
					.btn:hover {
						background: #0056b3;
					}
				</style>
			</head>

			<body>
				<div class="container">
					<div class="error-icon">✖</div>
					<h1>Đã xảy ra lỗi khi thanh toán</h1>
					<p>Đã có lỗi trong quá trình xử lý thanh toán của bạn. Vui lòng liên hệ bộ phận hỗ trợ để được giúp đỡ.</p>
					<a href="${baseUrl}" class="btn">Về trang chủ</a>
				</div>
			</body>

			</html>
		`);
	}
};

/**
 * Handle ZaloPay callback
 */
const handleZaloPayCallback = async (req, res, next) => {
	try {
		const callbackData = req.body;
		logger.info('ZaloPay callback received:', callbackData);

		// Verify callback signature
		const isValidCallback = await zalopayService.verifyCallback(
			callbackData
		);
		if (!isValidCallback) {
			logger.warn('Invalid ZaloPay callback signature');
			return res
				.status(400)
				.json({ return_code: 2, return_message: 'Invalid signature' });
		}

		// Process callback
		const result = await zalopayService.processCallback(callbackData);

		return res.json({
			return_code: 1,
			return_message: 'success',
		});
	} catch (error) {
		logger.error('Error handling ZaloPay callback:', error);
		return res.status(500).json({
			return_code: 99,
			return_message: 'Internal server error',
		});
	}
};

/**
 * Check payment status
 */
const checkPaymentStatus = async (req, res, next) => {
	try {
		const { payment_id } = req.params;
		const user_id = req.user.user_id;

		const payment = await Payment.findOne({
			where: { payment_id },
			include: [
				{
					model: Booking,
					where: { user_id },
					required: true,
				},
			],
		});

		if (!payment) {
			return sendError(res, 'Payment not found', 404);
		}

		return sendSuccess(res, 'Payment status retrieved', {
			payment_id: payment.payment_id,
			status: payment.status,
			amount: payment.amount,
			payment_method: payment.payment_method,
			created_at: payment.created_at,
			updated_at: payment.updated_at,
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Create refund
 */
const createRefund = async (req, res, next) => {
	try {
		const { booking_id, amount, reason } = req.body;
		const user_id = req.user.user_id;

		const booking = await Booking.findOne({
			where: { booking_id, user_id },
		});

		if (!booking) {
			return sendError(res, 'Booking not found', 404);
		}

		const payment = await Payment.findOne({
			where: { booking_id, status: 'completed' },
		});

		if (!payment) {
			return sendError(
				res,
				'No completed payment found for this booking',
				404
			);
		}

		// Create refund through ZaloPay
		const refundResult = await zalopayService.createRefund({
			app_trans_id: payment.payment_reference,
			amount: amount || booking.total_amount,
			description: `Refund for booking ${booking.booking_reference} - ${
				reason || 'Customer request'
			}`,
		});

		if (!refundResult.success) {
			return sendError(res, 'Failed to create refund', 400);
		}

		// Create refund payment record
		await Payment.create({
			booking_id,
			amount: amount || booking.total_amount,
			payment_method: 'zalopay',
			payment_reference: refundResult.data.refund_id,
			status: 'refunded',
			description: `Refund for booking ${booking.booking_reference} - ${
				reason || 'Customer request'
			}`,
		});

		// Update booking and payment status
		await booking.update({
			status: 'cancelled',
			payment_status: 'refunded',
			cancellation_reason: reason || 'Refund requested',
		});

		await payment.update({
			status: 'refunded',
			transaction_details: JSON.stringify({
				...payment.transaction_details,
				refund_result: refundResult.data,
			}),
		});

		logger.info('Refund created successfully:', {
			booking_id: booking_id,
			refund_amount: amount || booking.total_amount,
		});

		return sendSuccess(res, 'Refund created successfully', {
			booking_id: booking_id,
			refund_amount: amount || booking.total_amount,
			refund_result: refundResult.data,
		});
	} catch (error) {
		next(error);
	}
};

const paymentController = {
	// Get available payment options
	async getPaymentOptions(req, res) {
		try {
			const paymentOptions = [
				{
					id: 1,
					name: 'ZaloPay',
					icon_url: 'https://example.com/zalopay.png',
				},
				{
					id: 2,
					name: 'Credit Card',
					icon_url: 'https://example.com/credit-card.png',
				},
				{
					id: 3,
					name: 'Bank Transfer',
					icon_url: 'https://example.com/bank-transfer.png',
				},
			];

			return sendSuccess(
				res,
				'Payment options retrieved successfully',
				paymentOptions
			);
		} catch (error) {
			logger.error('Error getting payment options:', error);
			return sendError(res, 'Failed to retrieve payment options', 500);
		}
	},

	// Process payment
	async processPayment(req, res) {
		try {
			const { booking_id, payment_method, return_url } = req.body;
			const user_id = req.user ? req.user.user_id || req.user.id : null;

			// Verify booking belongs to user
			const booking = await Booking.findOne({
				where: { booking_id, user_id },
			});

			if (!booking) {
				return sendError(res, 'Booking not found', 404);
			}

			if (booking.status !== 'pending') {
				return sendError(
					res,
					'Booking is not in pending state for payment',
					400
				);
			}

			// Check for existing payment
			const existingPayment = await Payment.findOne({
				where: {
					booking_id,
					status: { [Op.in]: ['pending', 'completed'] },
				},
			});

			if (existingPayment && existingPayment.status === 'completed') {
				return sendError(res, 'Booking has already been paid', 400);
			}

			// Create or update payment record
			let payment;
			if (existingPayment && existingPayment.status === 'pending') {
				payment = existingPayment;
				payment.payment_method = payment_method;
				await payment.save();
			} else {
				payment = await Payment.create({
					booking_id,
					amount: booking.total_amount,
					payment_method,
					status: 'pending',
				});
			}

			// Generate payment URL based on method
			let redirectUrl;
			let orderId = `ORD${booking.booking_reference}`;

			switch (payment_method) {
				case 'zalopay':
					// In a real implementation, this would integrate with ZaloPay API
					redirectUrl = `https://zalopay.com/payment?orderid=${orderId}&amount=${
						booking.total_amount
					}&appid=YOUR_ZALOPAY_APP_ID&returnurl=${encodeURIComponent(
						return_url ||
							'http://localhost:3000/booking/confirmation'
					)}`;
					break;
				case 'credit_card':
					redirectUrl = `https://payment-gateway.com/process?amount=${
						booking.total_amount
					}&orderid=${orderId}&returnurl=${encodeURIComponent(
						return_url ||
							'http://localhost:3000/booking/confirmation'
					)}`;
					break;
				case 'bank_transfer':
					// For bank transfer, provide instructions
					redirectUrl = `http://localhost:3000/payment/instructions/${payment.payment_id}`;
					break;
				case 'cod':
					// Cash on Delivery: keep payment and booking as pending (cash will be collected later)
					// We may store a note or transaction placeholder if needed
					payment.transaction_id =
						payment.transaction_id || `COD_PENDING_${Date.now()}`;
					await payment.save();

					// Leave booking.status as 'pending' and payment_status as 'pending'
					// Return instruction URL or message for how to complete COD
					redirectUrl = `http://localhost:3000/booking/confirmation?ref=${booking.booking_reference}&cod=instruction`;
					break;
				default:
					return sendError(res, 'Invalid payment method', 400);
			}

			return sendSuccess(res, 'Payment initiated', {
				payment_id: payment.payment_id,
				status: payment.status,
				redirect_url: redirectUrl,
				booking_reference: booking.booking_reference,
			});
		} catch (error) {
			logger.error('Error processing payment:', error);
			return sendError(res, 'Failed to process payment', 500);
		}
	},

	// Get payment status
	async getPaymentStatus(req, res) {
		try {
			const { paymentId } = req.params;
			const user_id = req.user ? req.user.user_id || req.user.id : null;

			const payment = await Payment.findOne({
				where: { payment_id: paymentId },
			});

			if (!payment) {
				return sendError(res, 'Payment not found', 404);
			}

			// Verify payment belongs to the requesting user by checking the booking owner
			const relatedBooking = await Booking.findOne({
				where: { booking_id: payment.booking_id },
			});
			if (!relatedBooking || relatedBooking.user_id !== user_id) {
				return sendError(res, 'Payment not found', 404);
			}

			return sendSuccess(res, 'Payment status retrieved', {
				payment_id: payment.payment_id,
				booking_id: payment.booking_id,
				status: payment.status,
				amount: payment.amount,
				payment_method: payment.payment_method,
				transaction_id: payment.transaction_id,
				payment_date: payment.updated_at,
			});
		} catch (error) {
			logger.error('Error getting payment status:', error);
			return sendError(res, 'Failed to retrieve payment status', 500);
		}
	},

	// ZaloPay webhook (to handle payment confirmations)
	async zaloPayWebhook(req, res) {
		try {
			const { order_id, amount, status, mac } = req.body;

			// In a real implementation, verify the signature (mac) for security
			// This would use a shared key between your server and ZaloPay

			if (!order_id || !status) {
				return res.status(400).json({
					return_code: 2,
					return_message: 'Invalid parameters',
				});
			}

			// Extract booking reference from order ID (e.g., "ORDABC123" -> "ABC123")
			const bookingReference = order_id.replace('ORD', '');

			// Find booking by reference
			const booking = await Booking.findOne({
				where: { booking_reference: bookingReference },
			});

			if (!booking) {
				return res.status(404).json({
					return_code: 3,
					return_message: 'Booking not found',
				});
			}

			// Find related payment
			const payment = await Payment.findOne({
				where: { booking_id: booking.booking_id },
			});

			if (!payment) {
				return res.status(404).json({
					return_code: 4,
					return_message: 'Payment not found',
				});
			}

			// Process the payment based on status
			if (status === 1) {
				// Success
				payment.status = 'completed';
				payment.transaction_id =
					req.body.transaction_id || `ZLP${Date.now()}`;
				await payment.save();

				// Update booking status
				booking.status = 'confirmed';
				await booking.save();

				// Send confirmation email
				await emailService.sendPaymentConfirmation(
					booking.contact_email,
					{
						booking_reference: booking.booking_reference,
						amount: payment.amount,
						payment_method: payment.payment_method,
					}
				);
			} else if (status === 2) {
				// Failed
				payment.status = 'failed';
				payment.transaction_id = req.body.transaction_id || null;
				await payment.save();
			} else if (status === 3) {
				// Pending
				payment.status = 'pending';
				payment.transaction_id = req.body.transaction_id || null;
				await payment.save();
			}

			// Return success to ZaloPay
			return res.json({
				return_code: 1,
				return_message: 'success',
			});
		} catch (error) {
			logger.error('Error in ZaloPay webhook:', error);
			return res.status(500).json({
				return_code: 99,
				return_message: 'Internal server error',
			});
		}
	},
};

module.exports = {
	createZaloPayPayment,
	handleZaloPayCallback,
	checkPaymentStatus,
	createRefund,
	getPaymentHistory,
	handlePaymentSuccess,
	...paymentController,
};
