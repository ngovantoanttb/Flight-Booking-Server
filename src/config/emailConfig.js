/**
 * Email service configuration
 * This module handles the selection of the appropriate email service based on environment
 */

const realEmailService = require('../services/realEmailService');

// Always use the real email service.
// It will fallback to Ethereal automatically if SMTP credentials are missing,
// so developers still get preview URLs during development.
module.exports = realEmailService;
