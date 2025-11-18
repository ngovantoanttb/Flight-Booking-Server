/**
 * Real Email Service using Nodemailer
 * This service sends actual emails using the Nodemailer library
 *
 * @format
 */

const nodemailer = require("nodemailer");
const logger = require("../utils/logger");
const { EmailNotification } = require("../models");

// Get email config from environment
const config = require("../config/env.config");

// Create a transporter based on configuration
const createTransporter = async () => {
  // Log the email configuration being used
  logger.info("Email configuration:", {
    host: config.EMAIL_HOST,
    port: config.EMAIL_PORT,
    user: config.EMAIL_USER,
    from: config.EMAIL_FROM,
  });

  // Check if we have proper email configuration
  if (config.EMAIL_HOST && config.EMAIL_USER && config.EMAIL_PASS) {
    // Use actual SMTP settings from environment
    logger.info("Using real SMTP configuration");
    const transporter = nodemailer.createTransport({
      host: config.EMAIL_HOST,
      port: config.EMAIL_PORT || 587,
      secure: config.EMAIL_PORT === 465,
      auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASS,
      },
    });

    // Return the configured transporter
    return { transporter, useEthereal: false };
  } else {
    // Fallback to Ethereal for development if no config
    logger.info("Using Ethereal test account for email");
    const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    return { transporter, testAccount, useEthereal: true };
  }
};

// Helper function to generate payment breakdown table in HTML
const generatePaymentBreakdownHTML = (bookingData) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  let html = `
		<div style="margin: 20px 0;">
			<h3 style="color: #333; margin-bottom: 15px;">Chi tiết thanh toán</h3>
			<table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd; font-family: Arial, sans-serif;">
				<thead>
					<tr style="background-color: #f8f9fa;">
						<th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">Mô tả</th>
						<th style="border: 1px solid #ddd; padding: 12px; text-align: center; font-weight: bold;">Số lượng</th>
						<th style="border: 1px solid #ddd; padding: 12px; text-align: right; font-weight: bold;">Thành tiền</th>
					</tr>
				</thead>
				<tbody>`;

  // Base flight tickets
  if (bookingData.base_amount > 0) {
    const passengerCount = Array.isArray(bookingData.passengers)
      ? bookingData.passengers.length
      : bookingData.passenger_count || 1;
    html += `
			<tr>
				<td style="border: 1px solid #ddd; padding: 12px;">Vé máy bay hạng Economy/Business</td>
				<td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${passengerCount}</td>
				<td style="border: 1px solid #ddd; padding: 12px; text-align: right; font-weight: bold;">${formatCurrency(
          bookingData.base_amount
        )}</td>
			</tr>`;
  }

  // Baggage fees
  if (bookingData.baggage_fees > 0) {
    html += `
			<tr>
				<td style="border: 1px solid #ddd; padding: 12px;">Phí hành lý</td>
				<td style="border: 1px solid #ddd; padding: 12px; text-align: center;">-</td>
				<td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${formatCurrency(
          bookingData.baggage_fees
        )}</td>
			</tr>`;
  }

  // Meal fees
  if (bookingData.meal_fees > 0) {
    html += `
			<tr>
				<td style="border: 1px solid #ddd; padding: 12px;">Dịch vụ đồ ăn</td>
				<td style="border: 1px solid #ddd; padding: 12px; text-align: center;">-</td>
				<td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${formatCurrency(
          bookingData.meal_fees
        )}</td>
			</tr>`;
  }

  // Service package fees
  if (bookingData.service_package_fees > 0) {
    html += `
			<tr>
				<td style="border: 1px solid #ddd; padding: 12px;">Gói dịch vụ</td>
				<td style="border: 1px solid #ddd; padding: 12px; text-align: center;">-</td>
				<td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${formatCurrency(
          bookingData.service_package_fees
        )}</td>
			</tr>`;
  }

  // Subtotal
  const subtotal =
    (bookingData.base_amount || 0) +
    (bookingData.baggage_fees || 0) +
    (bookingData.meal_fees || 0) +
    (bookingData.service_package_fees || 0);

  html += `
		<tr style="background-color: #f8f9fa;">
			<td style="border: 1px solid #ddd; padding: 12px; font-weight: bold;">Tổng tiền</td>
			<td style="border: 1px solid #ddd; padding: 12px; text-align: center;"></td>
			<td style="border: 1px solid #ddd; padding: 12px; text-align: right; font-weight: bold;">${formatCurrency(
        subtotal
      )}</td>
		</tr>`;

  // Discount
  if (bookingData.discount_amount > 0) {
    html += `
			<tr>
				<td style="border: 1px solid #ddd; padding: 12px;">Giảm giá (${
          bookingData.discount_code || ""
        })</td>
				<td style="border: 1px solid #ddd; padding: 12px; text-align: center;"></td>
				<td style="border: 1px solid #ddd; padding: 12px; text-align: right; color: #28a745; font-weight: bold;">-${formatCurrency(
          bookingData.discount_amount
        )}</td>
			</tr>`;
  }

  // Tax
  if (bookingData.tax_amount > 0) {
    html += `
			<tr>
				<td style="border: 1px solid #ddd; padding: 12px;">Thuế (10%)</td>
				<td style="border: 1px solid #ddd; padding: 12px; text-align: center;"></td>
				<td style="border: 1px solid #ddd; padding: 12px; text-align: right;">${formatCurrency(
          bookingData.tax_amount
        )}</td>
			</tr>`;
  }

  // Final total
  html += `
		<tr style="background-color: #007bff; color: white;">
			<td style="border: 1px solid #ddd; padding: 12px; font-weight: bold; font-size: 16px;">TỔNG THANH TOÁN</td>
			<td style="border: 1px solid #ddd; padding: 12px; text-align: center;"></td>
			<td style="border: 1px solid #ddd; padding: 12px; text-align: right; font-weight: bold; font-size: 16px;">${formatCurrency(
        bookingData.final_amount || bookingData.total_amount
      )}</td>
		</tr>`;

  html += `
				</tbody>
			</table>
		</div>`;

  return html;
};

const realEmailService = {
  /**
   * Send booking confirmation email
   * @param {string} email - Recipient email address
   * @param {Object} bookingData - Booking information
   * @returns {Promise<boolean>} - Success status
   */
  sendBookingConfirmation: async (email, bookingData) => {
    try {
      const transporterData = await createTransporter();
      const { transporter, useEthereal, testAccount } = transporterData;

      // Email content with detailed payment breakdown
      const subject = `Booking Confirmation - ${bookingData.booking_reference}`;

      // Generate payment breakdown table in HTML
      const paymentBreakdownHTML = generatePaymentBreakdownHTML(bookingData);

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Booking Confirmation</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    background-color: #007bff;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 8px 8px 0 0;
                }
                .content {
                    background-color: #f8f9fa;
                    padding: 20px;
                    border-radius: 0 0 8px 8px;
                }
                .booking-details {
                    background-color: white;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 15px 0;
                    border-left: 4px solid #007bff;
                }
                .footer {
                    text-align: center;
                    margin-top: 20px;
                    color: #666;
                    font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Booking Confirmation</h1>
                <p>Your flight booking has been confirmed!</p>
            </div>

            <div class="content">
                <p>Dear customer,</p>

                <p>Your booking with reference <strong>${
                  bookingData.booking_reference
                }</strong> has been confirmed.</p>

                <div class="booking-details">
                    <h3>Booking Details</h3>
                    <p><strong>Booking Reference:</strong> ${
                      bookingData.booking_reference
                    }</p>
                    <p><strong>Trip Type:</strong> ${
                      bookingData.trip_type || "N/A"
                    }</p>
                    ${
                      bookingData.flights && bookingData.flights.length > 0
                        ? bookingData.flights
                            .map(
                              (flight, index) => `
                        <div style="margin-top: 15px; padding: 10px; background-color: #f0f0f0; border-radius: 5px;">
                            <h4>${
                              bookingData.flights.length > 1
                                ? `Flight ${index + 1} (${
                                    index === 0 ? "Outbound" : "Return"
                                  })`
                                : "Flight"
                            }</h4>
                            <p><strong>Flight Number:</strong> ${
                              flight.flight_number || "N/A"
                            }</p>
                            <p><strong>Airline:</strong> ${
                              flight.airline?.airline_name || "N/A"
                            }</p>
                            <p><strong>Route:</strong> ${
                              flight.departure_airport?.airport_code || "N/A"
                            } → ${
                                flight.arrival_airport?.airport_code || "N/A"
                              }</p>
                            <p><strong>Departure:</strong> ${
                              flight.departure_time
                                ? new Date(
                                    flight.departure_time
                                  ).toLocaleString("vi-VN")
                                : "N/A"
                            } (${
                                flight.departure_airport?.airport_name || ""
                              } ${flight.departure_airport?.city || ""})</p>
                            <p><strong>Arrival:</strong> ${
                              flight.arrival_time
                                ? new Date(flight.arrival_time).toLocaleString(
                                    "vi-VN"
                                  )
                                : "N/A"
                            } (${flight.arrival_airport?.airport_name || ""} ${
                                flight.arrival_airport?.city || ""
                              })</p>
                        </div>
                    `
                            )
                            .join("")
                        : bookingData.flight
                        ? `
                        <p><strong>Flight Number:</strong> ${
                          bookingData.flight.flight_number || "N/A"
                        }</p>
                        <p><strong>Airline:</strong> ${
                          bookingData.flight.airline?.airline_name || "N/A"
                        }</p>
                        <p><strong>Route:</strong> ${
                          bookingData.flight.departure_airport?.airport_code ||
                          "N/A"
                        } → ${
                            bookingData.flight.arrival_airport?.airport_code ||
                            "N/A"
                          }</p>
                        <p><strong>Departure:</strong> ${
                          bookingData.flight.departure_time
                            ? new Date(
                                bookingData.flight.departure_time
                              ).toLocaleString("vi-VN")
                            : "N/A"
                        } (${
                            bookingData.flight.departure_airport
                              ?.airport_name || ""
                          } ${
                            bookingData.flight.departure_airport?.city || ""
                          })</p>
                        <p><strong>Arrival:</strong> ${
                          bookingData.flight.arrival_time
                            ? new Date(
                                bookingData.flight.arrival_time
                              ).toLocaleString("vi-VN")
                            : "N/A"
                        } (${
                            bookingData.flight.arrival_airport?.airport_name ||
                            ""
                          } ${
                            bookingData.flight.arrival_airport?.city || ""
                          })</p>
                    `
                        : `
                        <p><strong>Flight:</strong> N/A</p>
                        <p><strong>Airline:</strong> N/A</p>
                        <p><strong>Route:</strong> N/A → N/A</p>
                        <p><strong>Departure:</strong> N/A</p>
                        <p><strong>Arrival:</strong> N/A</p>
                    `
                    }
                </div>

                ${paymentBreakdownHTML}

                ${
                  bookingData.passengers && bookingData.passengers.length > 0
                    ? `
                <div class="booking-details" style="margin-top: 20px;">
                    <h3>Passenger Information</h3>
                    ${bookingData.passengers
                      .map(
                        (passenger, index) => `
                        <div style="margin-top: 15px; padding: 10px; background-color: #f0f0f0; border-radius: 5px;">
                            <h4>Passenger ${index + 1}: ${
                          passenger.title || ""
                        } ${passenger.first_name || ""} ${
                          passenger.last_name || ""
                        }</h4>
                            <p><strong>Passenger Type:</strong> ${
                              passenger.passenger_type || "N/A"
                            }</p>
                            <p><strong>Passport Number:</strong> ${
                              passenger.passport_number || "N/A"
                            }</p>
                            <p><strong>Passport Issuing Country:</strong> ${
                              passenger.passport_issuing_country || "N/A"
                            }</p>
                            <p><strong>Passport Expiry Date:</strong> ${
                              passenger.passport_expiry
                                ? new Date(
                                    passenger.passport_expiry
                                  ).toLocaleDateString("vi-VN")
                                : "N/A"
                            }</p>
                            ${
                              passenger.passport_expiry
                                ? (() => {
                                    const expiryDate = new Date(
                                      passenger.passport_expiry
                                    );
                                    const today = new Date();
                                    const sixMonthsFromNow = new Date();
                                    sixMonthsFromNow.setMonth(
                                      today.getMonth() + 6
                                    );
                                    const isValid =
                                      expiryDate > sixMonthsFromNow;
                                    return `<p><strong>Passport Validity:</strong> <span style="color: ${
                                      isValid ? "green" : "red"
                                    };">${
                                      isValid
                                        ? "Valid (more than 6 months remaining)"
                                        : "Expiring soon (less than 6 months remaining)"
                                    }</span></p>`;
                                  })()
                                : ""
                            }
                        </div>
                    `
                      )
                      .join("")}
                </div>
                `
                    : ""
                }

                <p>Thank you for choosing our service.</p>

                <div class="footer">
                    <p>Best regards,<br>Flight Booking Team</p>
                </div>
            </div>
        </body>
        </html>`;

      const textContent = `
        Dear customer,

        Your booking with reference ${
          bookingData.booking_reference
        } has been confirmed.

        Booking Details:
        - Booking Reference: ${bookingData.booking_reference}
        - Trip Type: ${bookingData.trip_type || "N/A"}
        ${
          bookingData.flights && bookingData.flights.length > 0
            ? bookingData.flights
                .map(
                  (flight, index) => `
        ${
          bookingData.flights.length > 1
            ? `Flight ${index + 1} (${index === 0 ? "Outbound" : "Return"})`
            : "Flight"
        }:
        - Flight Number: ${flight.flight_number || "N/A"}
        - Airline: ${flight.airline?.airline_name || "N/A"}
        - Route: ${flight.departure_airport?.airport_code || "N/A"} → ${
                    flight.arrival_airport?.airport_code || "N/A"
                  }
        - Departure: ${
          flight.departure_time
            ? new Date(flight.departure_time).toLocaleString("vi-VN")
            : "N/A"
        } (${flight.departure_airport?.airport_name || ""} ${
                    flight.departure_airport?.city || ""
                  })
        - Arrival: ${
          flight.arrival_time
            ? new Date(flight.arrival_time).toLocaleString("vi-VN")
            : "N/A"
        } (${flight.arrival_airport?.airport_name || ""} ${
                    flight.arrival_airport?.city || ""
                  })
        `
                )
                .join("")
            : bookingData.flight
            ? `
        - Flight Number: ${bookingData.flight.flight_number || "N/A"}
        - Airline: ${bookingData.flight.airline?.airline_name || "N/A"}
        - Route: ${
          bookingData.flight.departure_airport?.airport_code || "N/A"
        } → ${bookingData.flight.arrival_airport?.airport_code || "N/A"}
        - Departure: ${
          bookingData.flight.departure_time
            ? new Date(bookingData.flight.departure_time).toLocaleString(
                "vi-VN"
              )
            : "N/A"
        } (${bookingData.flight.departure_airport?.airport_name || ""} ${
                bookingData.flight.departure_airport?.city || ""
              })
        - Arrival: ${
          bookingData.flight.arrival_time
            ? new Date(bookingData.flight.arrival_time).toLocaleString("vi-VN")
            : "N/A"
        } (${bookingData.flight.arrival_airport?.airport_name || ""} ${
                bookingData.flight.arrival_airport?.city || ""
              })
        `
            : `
        - Flight: N/A
        - Airline: N/A
        - Route: N/A → N/A
        - Departure: N/A
        - Arrival: N/A
        `
        }

        Payment Breakdown:
        ${paymentBreakdownHTML
          .replace(/<[^>]*>/g, "")
          .replace(/\s+/g, " ")
          .trim()}

        ${
          bookingData.passengers && bookingData.passengers.length > 0
            ? `
        Passenger Information:
        ${bookingData.passengers
          .map(
            (passenger, index) => `
        Passenger ${index + 1}: ${passenger.title || ""} ${
              passenger.first_name || ""
            } ${passenger.last_name || ""}
        - Passenger Type: ${passenger.passenger_type || "N/A"}
        - Passport Number: ${passenger.passport_number || "N/A"}
        - Passport Issuing Country: ${
          passenger.passport_issuing_country || "N/A"
        }
        - Passport Expiry Date: ${
          passenger.passport_expiry
            ? new Date(passenger.passport_expiry).toLocaleDateString("vi-VN")
            : "N/A"
        }
        ${
          passenger.passport_expiry
            ? (() => {
                const expiryDate = new Date(passenger.passport_expiry);
                const today = new Date();
                const sixMonthsFromNow = new Date();
                sixMonthsFromNow.setMonth(today.getMonth() + 6);
                const isValid = expiryDate > sixMonthsFromNow;
                return `- Passport Validity: ${
                  isValid
                    ? "Valid (more than 6 months remaining)"
                    : "Expiring soon (less than 6 months remaining)"
                }`;
              })()
            : ""
        }
        `
          )
          .join("")}
        `
            : ""
        }

        Thank you for choosing our service.

        Best regards,
        Flight Booking Team
      `;

      // Send the email
      const info = await transporter.sendMail({
        from:
          config.EMAIL_FROM || '"Flight Booking" <booking@flightbooking.com>',
        to: email,
        subject,
        html: htmlContent,
        text: textContent,
      });

      // Log success
      logger.info(`Email sent: ${info.messageId}`);

      // If using Ethereal, log the preview URL
      if (useEthereal && info.messageId) {
        logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }

      // Record email notification in database
      try {
        await EmailNotification.create({
          user_id: bookingData.user_id || 0,
          booking_id: bookingData.booking_id,
          notification_type: "booking_confirmation",
          email_subject: subject,
          email_content: htmlContent,
          status: "sent",
        });
      } catch (dbError) {
        logger.error("Error recording email notification:", dbError);
      }

      return true;
    } catch (error) {
      logger.error("Error sending booking confirmation email:", error);
      return false;
    }
  },

  /**
   * Send payment confirmation email
   * @param {string} email - Recipient email address
   * @param {Object} paymentData - Payment information
   * @returns {Promise<boolean>} - Success status
   */
  sendPaymentConfirmation: async (email, paymentData) => {
    try {
      const transporterData = await createTransporter();
      const { transporter, useEthereal } = transporterData;

      const subject = `Payment Confirmation - ${paymentData.booking_reference}`;

      const formatCurrency = (amount) => {
        return new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(amount || 0);
      };

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Payment Confirmation</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    background-color: #28a745;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 8px 8px 0 0;
                }
                .content {
                    background-color: #f8f9fa;
                    padding: 20px;
                    border-radius: 0 0 8px 8px;
                }
                .payment-details {
                    background-color: white;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 15px 0;
                    border-left: 4px solid #28a745;
                }
                .success-icon {
                    font-size: 48px;
                    text-align: center;
                    color: #28a745;
                    margin: 20px 0;
                }
                .amount-highlight {
                    font-size: 24px;
                    font-weight: bold;
                    color: #28a745;
                    text-align: center;
                    margin: 15px 0;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid #e0e0e0;
                }
                .info-row:last-child {
                    border-bottom: none;
                }
                .info-label {
                    font-weight: bold;
                    color: #666;
                }
                .info-value {
                    color: #333;
                }
                .footer {
                    text-align: center;
                    margin-top: 20px;
                    color: #666;
                    font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Payment Confirmation</h1>
                <p>Your payment has been successfully processed!</p>
            </div>

            <div class="content">
                <p>Dear customer,</p>

                <p>Your payment for booking <strong>${
                  paymentData.booking_reference
                }</strong> was successful.</p>

                <div class="success-icon">✓</div>

                <div class="payment-details">
                    <h3 style="color: #28a745; margin-top: 0;">Payment Details</h3>
                    <div class="amount-highlight">
                        ${formatCurrency(paymentData.amount || 0)}
                    </div>
                    <div class="info-row">
                        <span class="info-label">Booking Reference:</span>
                        <span class="info-value">${
                          paymentData.booking_reference
                        }</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Payment Method:</span>
                        <span class="info-value">${
                          paymentData.payment_method || "ZaloPay"
                        }</span>
                    </div>
                    ${
                      paymentData.bank_code
                        ? `
                    <div class="info-row">
                        <span class="info-label">Bank:</span>
                        <span class="info-value">${paymentData.bank_code}</span>
                    </div>
                    `
                        : ""
                    }
                    ${
                      paymentData.transaction_id
                        ? `
                    <div class="info-row">
                        <span class="info-label">Transaction ID:</span>
                        <span class="info-value">${paymentData.transaction_id}</span>
                    </div>
                    `
                        : ""
                    }
                    <div class="info-row">
                        <span class="info-label">Payment Date:</span>
                        <span class="info-value">${new Date().toLocaleString(
                          "vi-VN"
                        )}</span>
                    </div>
                </div>

                <p style="background-color: #d4edda; color: #155724; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                    <strong>✓ Payment Status:</strong> Completed Successfully
                </p>

                <p>Your booking is now confirmed. You will receive your e-ticket shortly.</p>

                <p>Thank you for choosing our service.</p>

                <div class="footer">
                    <p>Best regards,<br>Flight Booking Team</p>
                </div>
            </div>
        </body>
        </html>`;

      const textContent = `
        Dear customer,

        Your payment for booking ${
          paymentData.booking_reference
        } was successful.

        Payment Details:
        - Booking Reference: ${paymentData.booking_reference}
        - Amount: ${formatCurrency(paymentData.amount || 0)}
        - Payment Method: ${paymentData.payment_method || "ZaloPay"}
        ${paymentData.bank_code ? `- Bank: ${paymentData.bank_code}` : ""}
        ${
          paymentData.transaction_id
            ? `- Transaction ID: ${paymentData.transaction_id}`
            : ""
        }
        - Payment Date: ${new Date().toLocaleString("vi-VN")}

        Payment Status: Completed Successfully

        Your booking is now confirmed. You will receive your e-ticket shortly.

        Thank you for choosing our service.

        Best regards,
        Flight Booking Team
      `;

      const info = await transporter.sendMail({
        from:
          config.EMAIL_FROM || '"Flight Booking" <booking@flightbooking.com>',
        to: email,
        subject,
        text: textContent,
        html: htmlContent,
      });

      logger.info(`Email sent: ${info.messageId}`);
      if (useEthereal && info.messageId) {
        logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }

      try {
        await EmailNotification.create({
          user_id: paymentData.user_id || 0,
          booking_id: paymentData.booking_id || null,
          notification_type: "payment_confirmation",
          email_subject: subject,
          email_content: htmlContent,
          status: "sent",
        });
      } catch (dbError) {
        logger.error("Error recording payment confirmation email:", dbError);
      }

      return true;
    } catch (error) {
      logger.error("Error sending payment confirmation email:", error);
      return false;
    }
  },

  /**
   * Send cancellation request email
   * @param {string} email - Recipient email address
   * @param {Object} cancellationData - Cancellation information
   * @returns {Promise<boolean>} - Success status
   */
  sendCancellationRequest: async (email, cancellationData) => {
    try {
      const transporterData = await createTransporter();
      const { transporter, useEthereal, testAccount } = transporterData;

      // Email content
      const subject = `Booking Cancellation Request - ${cancellationData.booking_reference}`;

      const formatCurrency = (amount) => {
        if (!amount || amount === "To be calculated") {
          return "Đang được tính toán";
        }
        return new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(amount || 0);
      };

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Booking Cancellation Request</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    background-color: #ff9800;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 8px 8px 0 0;
                }
                .content {
                    background-color: #f8f9fa;
                    padding: 20px;
                    border-radius: 0 0 8px 8px;
                }
                .request-details {
                    background-color: white;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 15px 0;
                    border-left: 4px solid #ff9800;
                }
                .info-icon {
                    font-size: 48px;
                    text-align: center;
                    color: #ff9800;
                    margin: 20px 0;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid #e0e0e0;
                }
                .info-row:last-child {
                    border-bottom: none;
                }
                .info-label {
                    font-weight: bold;
                    color: #666;
                }
                .info-value {
                    color: #333;
                }
                .amount-highlight {
                    font-size: 20px;
                    font-weight: bold;
                    color: #ff9800;
                }
                .refund-box {
                    background-color: #fff3cd;
                    color: #856404;
                    padding: 15px;
                    border-radius: 5px;
                    border-left: 4px solid #ffc107;
                    margin: 15px 0;
                }
                .status-box {
                    background-color: #d1ecf1;
                    color: #0c5460;
                    padding: 15px;
                    border-radius: 5px;
                    border-left: 4px solid #17a2b8;
                    margin: 15px 0;
                }
                .footer {
                    text-align: center;
                    margin-top: 20px;
                    color: #666;
                    font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Booking Cancellation Request</h1>
                <p>Your cancellation request has been submitted</p>
            </div>

            <div class="content">
                <p>Dear customer,</p>

                <p>Your request to cancel booking <strong>${
                  cancellationData.booking_reference
                }</strong> has been submitted successfully.</p>

                <div class="info-icon">ℹ</div>

                <div class="request-details">
                    <h3 style="color: #ff9800; margin-top: 0;">Cancellation Request Details</h3>
                    <div class="info-row">
                        <span class="info-label">Booking Reference:</span>
                        <span class="info-value">${
                          cancellationData.booking_reference
                        }</span>
                    </div>
                    ${
                      cancellationData.reason
                        ? `
                    <div class="info-row">
                        <span class="info-label">Cancellation Reason:</span>
                        <span class="info-value">${cancellationData.reason}</span>
                    </div>
                    `
                        : ""
                    }
                    ${
                      cancellationData.refund_amount_estimate
                        ? `
                    <div class="info-row">
                        <span class="info-label">Estimated Refund:</span>
                        <span class="info-value amount-highlight">${formatCurrency(
                          cancellationData.refund_amount_estimate
                        )}</span>
                    </div>
                    `
                        : `
                    <div class="info-row">
                        <span class="info-label">Estimated Refund:</span>
                        <span class="info-value">Đang được tính toán</span>
                    </div>
                    `
                    }
                    <div class="info-row">
                        <span class="info-label">Request Date:</span>
                        <span class="info-value">${new Date().toLocaleString(
                          "vi-VN"
                        )}</span>
                    </div>
                </div>

                ${
                  cancellationData.refund_amount_estimate
                    ? `
                <div class="refund-box">
                    <strong>💰 Refund Information:</strong>
                    <p style="margin: 10px 0 0 0;">
                        Your estimated refund amount is <strong>${formatCurrency(
                          cancellationData.refund_amount_estimate
                        )}</strong>.
                        ${
                          cancellationData.refund_method
                            ? `Refund will be processed via ${cancellationData.refund_method}.`
                            : "Refund will be processed to your original payment method."
                        }
                    </p>
                </div>
                `
                    : ""
                }

                <div class="status-box">
                    <strong>📋 Request Status:</strong>
                    <p style="margin: 10px 0 0 0;">
                        Your cancellation request is being processed. We will review your request and notify you of the outcome shortly.
                    </p>
                </div>

                <p>We will process your request and notify you of the outcome shortly.</p>

                <p>If you have any questions or concerns, please contact our customer support team.</p>

                <div class="footer">
                    <p>Best regards,<br>Flight Booking Team</p>
                </div>
            </div>
        </body>
        </html>`;

      const textContent = `
        Dear customer,

        Your request to cancel booking ${
          cancellationData.booking_reference
        } has been submitted successfully.

        Cancellation Request Details:
        - Booking Reference: ${cancellationData.booking_reference}
        ${
          cancellationData.reason
            ? `- Cancellation Reason: ${cancellationData.reason}`
            : ""
        }
        - Estimated Refund: ${formatCurrency(
          cancellationData.refund_amount_estimate || "To be calculated"
        )}
        - Request Date: ${new Date().toLocaleString("vi-VN")}

        ${
          cancellationData.refund_amount_estimate
            ? `Refund Information:\nYour estimated refund amount is ${formatCurrency(
                cancellationData.refund_amount_estimate
              )}. ${
                cancellationData.refund_method
                  ? `Refund will be processed via ${cancellationData.refund_method}.`
                  : "Refund will be processed to your original payment method."
              }\n\n`
            : ""
        }Request Status:
        Your cancellation request is being processed. We will review your request and notify you of the outcome shortly.

        We will process your request and notify you of the outcome shortly.

        If you have any questions or concerns, please contact our customer support team.

        Best regards,
        Flight Booking Team
      `;

      // Send the email
      const info = await transporter.sendMail({
        from:
          config.EMAIL_FROM || '"Flight Booking" <booking@flightbooking.com>',
        to: email,
        subject,
        text: textContent,
        html: htmlContent,
      });

      // Log success
      logger.info(`Email sent: ${info.messageId}`);

      // If using Ethereal, log the preview URL
      if (useEthereal && info.messageId) {
        logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }

      // Record email notification in database
      try {
        await EmailNotification.create({
          user_id: cancellationData.user_id || 0,
          booking_id: cancellationData.booking_id,
          notification_type: "cancellation",
          email_subject: subject,
          email_content: htmlContent,
          status: "sent",
        });
      } catch (dbError) {
        logger.error(
          "Error recording cancellation request email notification:",
          dbError
        );
      }

      return true;
    } catch (error) {
      logger.error("Error sending cancellation request email:", error);
      return false;
    }
  },

  /**
   * Send cancellation notification email
   * @param {string} email - Recipient email address
   * @param {Object} cancellationData - Cancellation information
   * @returns {Promise<boolean>} - Success status
   */
  sendCancellationNotification: async (email, cancellationData) => {
    try {
      const transporterData = await createTransporter();
      const { transporter, useEthereal, testAccount } = transporterData;

      // Email content
      const subject = `Booking Cancellation - ${cancellationData.booking_reference}`;

      const formatCurrency = (amount) => {
        return new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(amount || 0);
      };

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Booking Cancellation</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    background-color: #dc3545;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 8px 8px 0 0;
                }
                .content {
                    background-color: #f8f9fa;
                    padding: 20px;
                    border-radius: 0 0 8px 8px;
                }
                .cancellation-details {
                    background-color: white;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 15px 0;
                    border-left: 4px solid #dc3545;
                }
                .warning-icon {
                    font-size: 48px;
                    text-align: center;
                    color: #dc3545;
                    margin: 20px 0;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid #e0e0e0;
                }
                .info-row:last-child {
                    border-bottom: none;
                }
                .info-label {
                    font-weight: bold;
                    color: #666;
                }
                .info-value {
                    color: #333;
                }
                .amount-highlight {
                    font-size: 20px;
                    font-weight: bold;
                    color: #dc3545;
                }
                .refund-box {
                    background-color: #fff3cd;
                    color: #856404;
                    padding: 15px;
                    border-radius: 5px;
                    border-left: 4px solid #ffc107;
                    margin: 15px 0;
                }
                .footer {
                    text-align: center;
                    margin-top: 20px;
                    color: #666;
                    font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Booking Cancellation</h1>
                <p>Your booking has been cancelled</p>
            </div>

            <div class="content">
                <p>Dear customer,</p>

                <p>We regret to inform you that your booking with reference <strong>${
                  cancellationData.booking_reference
                }</strong> has been cancelled.</p>

                <div class="warning-icon">⚠</div>

                <div class="cancellation-details">
                    <h3 style="color: #dc3545; margin-top: 0;">Cancellation Details</h3>
                    <div class="info-row">
                        <span class="info-label">Booking Reference:</span>
                        <span class="info-value">${
                          cancellationData.booking_reference
                        }</span>
                    </div>
                    ${
                      cancellationData.reason
                        ? `
                    <div class="info-row">
                        <span class="info-label">Cancellation Reason:</span>
                        <span class="info-value">${cancellationData.reason}</span>
                    </div>
                    `
                        : ""
                    }
                    ${
                      cancellationData.refund_amount_estimate
                        ? `
                    <div class="info-row">
                        <span class="info-label">Estimated Refund:</span>
                        <span class="info-value amount-highlight">${formatCurrency(
                          cancellationData.refund_amount_estimate
                        )}</span>
                    </div>
                    `
                        : ""
                    }
                    <div class="info-row">
                        <span class="info-label">Cancellation Date:</span>
                        <span class="info-value">${new Date().toLocaleString(
                          "vi-VN"
                        )}</span>
                    </div>
                </div>

                ${
                  cancellationData.refund_amount_estimate
                    ? `
                <div class="refund-box">
                    <strong>💰 Refund Information:</strong>
                    <p style="margin: 10px 0 0 0;">
                        Your estimated refund amount is <strong>${formatCurrency(
                          cancellationData.refund_amount_estimate
                        )}</strong>.
                        ${
                          cancellationData.refund_method
                            ? `Refund will be processed via ${cancellationData.refund_method}.`
                            : "Refund will be processed to your original payment method."
                        }
                    </p>
                </div>
                `
                    : ""
                }

                <p>If you have any questions or concerns, please contact our customer support team.</p>

                <p>We apologize for any inconvenience this may cause.</p>

                <div class="footer">
                    <p>Best regards,<br>Flight Booking Team</p>
                </div>
            </div>
        </body>
        </html>`;

      const textContent = `
        Dear customer,

        We regret to inform you that your booking with reference ${
          cancellationData.booking_reference
        } has been cancelled.

        Cancellation Details:
        - Booking Reference: ${cancellationData.booking_reference}
        ${
          cancellationData.reason
            ? `- Cancellation Reason: ${cancellationData.reason}`
            : ""
        }
        ${
          cancellationData.refund_amount_estimate
            ? `- Estimated Refund: ${formatCurrency(
                cancellationData.refund_amount_estimate
              )}`
            : ""
        }
        - Cancellation Date: ${new Date().toLocaleString("vi-VN")}

        ${
          cancellationData.refund_amount_estimate
            ? `Refund Information:\nYour estimated refund amount is ${formatCurrency(
                cancellationData.refund_amount_estimate
              )}. ${
                cancellationData.refund_method
                  ? `Refund will be processed via ${cancellationData.refund_method}.`
                  : "Refund will be processed to your original payment method."
              }\n\n`
            : ""
        }If you have any questions or concerns, please contact our customer support team.

        We apologize for any inconvenience this may cause.

        Best regards,
        Flight Booking Team
      `;

      // Send the email
      const info = await transporter.sendMail({
        from:
          config.EMAIL_FROM || '"Flight Booking" <booking@flightbooking.com>',
        to: email,
        subject,
        text: textContent,
        html: htmlContent,
      });

      // Log success
      logger.info(`Email sent: ${info.messageId}`);

      // If using Ethereal, log the preview URL
      if (useEthereal && info.messageId) {
        logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }

      // Record email notification in database
      try {
        await EmailNotification.create({
          user_id: cancellationData.user_id || 0,
          booking_id: cancellationData.booking_id,
          notification_type: "cancellation",
          email_subject: subject,
          email_content: htmlContent,
          status: "sent",
        });
      } catch (dbError) {
        logger.error(
          "Error recording cancellation email notification:",
          dbError
        );
      }

      return true;
    } catch (error) {
      logger.error("Error sending cancellation email:", error);
      return false;
    }
  },

  /**
   * Send cancellation rejection email
   * @param {string} email - Recipient email address
   * @param {Object} rejectionData - Rejection information
   * @returns {Promise<boolean>} - Success status
   */
  sendCancellationRejection: async (email, rejectionData) => {
    try {
      const transporterData = await createTransporter();
      const { transporter, useEthereal, testAccount } = transporterData;

      // Email subject
      const subject = `Cancellation Request Rejected - ${rejectionData.booking_reference}`;

      // Prepare human-friendly reason
      const reason =
        rejectionData.reason ||
        "Your cancellation request was denied by administration. Please contact customer support for more information.";

      // HTML content (styled) for rejection
      const htmlContent = `
				<!DOCTYPE html>
				<html>
				<head>
					<meta charset="UTF-8">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<title>Cancellation Request Rejected</title>
					<style>
						body { font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
						.header { background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
						.content { background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
						.details { background: white; padding: 15px; border-left: 4px solid #dc3545; border-radius: 4px; margin-top: 15px; }
						.footer { text-align: center; margin-top: 20px; color: #666; font-size: 13px; }
					</style>
				</head>
				<body>
					<div class="header">
						<h1>Cancellation Request Rejected</h1>
					</div>

					<div class="content">
						<p>Dear customer,</p>
						<p>We regret to inform you that your request to cancel booking <strong>${
              rejectionData.booking_reference
            }</strong> has been rejected by our administration team.</p>

						<div class="details">
							<p><strong>Booking Reference:</strong> ${rejectionData.booking_reference}</p>
							<p><strong>Reason:</strong> ${reason}</p>
							<p><strong>Decision Date:</strong> ${new Date().toLocaleString("vi-VN")}</p>
						</div>

						<p>If you believe this decision is incorrect or need further assistance, please contact our customer support.</p>
						<p>Best regards,<br/>Flight Booking Team</p>
						<div class="footer">
                    		<p>Best regards,<br>Flight Booking Team</p>
                		</div>
					</div>
				</body>
				</html>
			`;

      // Plain-text fallback
      const textContent = `
			Dear customer,

			Your request to cancel booking ${rejectionData.booking_reference} has been rejected by our administration team.

			Reason: ${reason}

			If you believe this decision is incorrect or need further assistance, please contact our customer support at support@flightbooking.com.

			Best regards,
			Flight Booking Team
			`;

      // Send the email with HTML and text
      const info = await transporter.sendMail({
        from:
          config.EMAIL_FROM || '"Flight Booking" <booking@flightbooking.com>',
        to: email,
        subject,
        text: textContent,
        html: htmlContent,
      });

      // Log success
      logger.info(`Email sent: ${info.messageId}`);

      // If using Ethereal, log the preview URL
      if (useEthereal && info.messageId) {
        logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }

      // Record email notification in database (store HTML content)
      try {
        await EmailNotification.create({
          user_id: rejectionData.user_id || 0,
          booking_id: rejectionData.booking_id,
          notification_type: "other",
          email_subject: subject,
          email_content: htmlContent,
          status: "sent",
        });
      } catch (dbError) {
        logger.error(
          "Error recording cancellation rejection email notification:",
          dbError
        );
      }

      return true;
    } catch (error) {
      logger.error("Error sending cancellation rejection email:", error);
      return false;
    }
  },
};

module.exports = realEmailService;
