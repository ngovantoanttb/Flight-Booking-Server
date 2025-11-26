const jwt = require('jsonwebtoken');
const config = require('../config/env.config');
const logger = require('../utils/logger');
const { User } = require('../models');

/**
 * WebSocket authentication middleware
 * @param {WebSocket} ws - WebSocket connection
 * @param {http.IncomingMessage} request - HTTP request
 * @param {Function} next - Next function
 */
async function authenticateWebSocket(ws, request, next) {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const token = url.searchParams.get('token');
    
    if (!token) {
      logger.warn('WebSocket authentication failed: No token provided');
      ws.close(1008, 'Authentication required');
      return;
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // Optional: Verify user still exists and is active
    const user = await User.findByPk(decoded.id);
    if (!user) {
      logger.warn(`WebSocket authentication failed: User ${decoded.id} not found`);
      ws.close(1008, 'Invalid user');
      return;
    }
    
    if (user.status !== 'active') {
      logger.warn(`WebSocket authentication failed: User ${decoded.id} is not active`);
      ws.close(1008, 'User account is not active');
      return;
    }
    
    // Attach user info to WebSocket
    ws.userId = decoded.id;
    ws.userRole = decoded.role;
    ws.userEmail = user.email;
    ws.isAuthenticated = true;
    
    logger.info(`WebSocket authenticated successfully for user ${decoded.id}`);
    
    if (next) next();
    
  } catch (error) {
    logger.error('WebSocket authentication error:', error);
    
    if (error.name === 'TokenExpiredError') {
      ws.close(1008, 'Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      ws.close(1008, 'Invalid token');
    } else {
      ws.close(1011, 'Authentication error');
    }
  }
}

/**
 * Rate limiting middleware for WebSocket messages
 * @param {number} maxMessages - Maximum messages per window
 * @param {number} windowMs - Time window in milliseconds
 */
function createRateLimiter(maxMessages = 100, windowMs = 60000) {
  const userMessageCounts = new Map();
  
  return function rateLimitMiddleware(ws, message, next) {
    const userId = ws.userId;
    const now = Date.now();
    
    if (!userMessageCounts.has(userId)) {
      userMessageCounts.set(userId, {
        count: 0,
        windowStart: now
      });
    }
    
    const userStats = userMessageCounts.get(userId);
    
    // Reset window if expired
    if (now - userStats.windowStart > windowMs) {
      userStats.count = 0;
      userStats.windowStart = now;
    }
    
    userStats.count++;
    
    if (userStats.count > maxMessages) {
      logger.warn(`Rate limit exceeded for user ${userId}: ${userStats.count} messages in window`);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Rate limit exceeded. Please slow down.',
        timestamp: new Date().toISOString()
      }));
      return; // Don't call next()
    }
    
    if (next) next();
  };
}

/**
 * Message validation middleware
 * @param {WebSocket} ws - WebSocket connection
 * @param {Object} message - Parsed message
 * @param {Function} next - Next function
 */
function validateMessage(ws, message, next) {
  try {
    // Check if message has required structure
    if (!message || typeof message !== 'object') {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format: must be a JSON object',
        timestamp: new Date().toISOString()
      }));
      return;
    }
    
    // Check if message has type
    if (!message.type || typeof message.type !== 'string') {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format: type is required',
        timestamp: new Date().toISOString()
      }));
      return;
    }
    
    // Validate message size (prevent large payloads)
    const messageSize = JSON.stringify(message).length;
    if (messageSize > 10000) { // 10KB limit
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Message too large',
        timestamp: new Date().toISOString()
      }));
      return;
    }
    
    if (next) next();
    
  } catch (error) {
    logger.error(`Message validation error for user ${ws.userId}:`, error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Message validation failed',
      timestamp: new Date().toISOString()
    }));
  }
}

/**
 * Authorization middleware - check if user has permission for specific actions
 * @param {Array} allowedRoles - Array of roles allowed to perform action
 */
function requireRole(allowedRoles = []) {
  return function roleMiddleware(ws, message, next) {
    if (!ws.userRole) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'User role not found',
        timestamp: new Date().toISOString()
      }));
      return;
    }
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(ws.userRole)) {
      logger.warn(`Access denied for user ${ws.userId} with role ${ws.userRole}. Required roles: ${allowedRoles.join(', ')}`);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Insufficient permissions',
        timestamp: new Date().toISOString()
      }));
      return;
    }
    
    if (next) next();
  };
}

/**
 * Logging middleware for WebSocket messages
 * @param {WebSocket} ws - WebSocket connection
 * @param {Object} message - Parsed message
 * @param {Function} next - Next function
 */
function logMessage(ws, message, next) {
  logger.debug(`WebSocket message from user ${ws.userId}:`, {
    type: message.type,
    userId: ws.userId,
    userRole: ws.userRole,
    timestamp: new Date().toISOString()
  });
  
  if (next) next();
}

/**
 * Error handling middleware
 * @param {WebSocket} ws - WebSocket connection
 * @param {Error} error - Error object
 */
function handleWebSocketError(ws, error) {
  logger.error(`WebSocket error for user ${ws.userId}:`, error);
  
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'An error occurred processing your request',
      timestamp: new Date().toISOString()
    }));
  }
}

/**
 * Compose multiple middleware functions
 * @param {...Function} middlewares - Middleware functions
 */
function compose(...middlewares) {
  return function composedMiddleware(ws, message) {
    let index = 0;
    
    function next() {
      if (index >= middlewares.length) return;
      
      const middleware = middlewares[index++];
      try {
        middleware(ws, message, next);
      } catch (error) {
        handleWebSocketError(ws, error);
      }
    }
    
    next();
  };
}

module.exports = {
  authenticateWebSocket,
  createRateLimiter,
  validateMessage,
  requireRole,
  logMessage,
  handleWebSocketError,
  compose
};
