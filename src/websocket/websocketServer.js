const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const config = require('../config/env.config');
const logger = require('../utils/logger');
const { 
  handleConnection, 
  handleMessage, 
  handleDisconnection,
  broadcastToUser,
  broadcastToAll 
} = require('./websocketHandlers');

// Store active connections
const connections = new Map();

/**
 * Setup WebSocket server
 * @param {http.Server} server - HTTP server instance
 * @returns {WebSocket.Server} WebSocket server instance
 */
function setupWebSocketServer(server) {
  const wss = new WebSocket.Server({ 
    server,
    path: '/ws',
    verifyClient: (info) => {
      // Optional: Add IP filtering or other verification logic here
      return true;
    }
  });

  wss.on('connection', (ws, request) => {
    logger.info('New WebSocket connection attempt');
    
    // Handle authentication
    const url = new URL(request.url, `http://${request.headers.host}`);
    const token = url.searchParams.get('token');
    
    if (!token) {
      logger.warn('WebSocket connection rejected: No token provided');
      ws.close(1008, 'Authentication required');
      return;
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, config.JWT_SECRET);
      ws.userId = decoded.id;
      ws.userRole = decoded.role;
      ws.isAlive = true;
      
      // Store connection
      connections.set(ws.userId, ws);
      
      logger.info(`WebSocket authenticated for user ${ws.userId} with role ${ws.userRole}`);
      
      // Handle connection
      handleConnection(ws, decoded);
      
      // Handle messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          handleMessage(ws, message);
        } catch (error) {
          logger.error('Invalid WebSocket message format:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });
      
      // Handle pong responses for heartbeat
      ws.on('pong', () => {
        ws.isAlive = true;
      });
      
      // Handle disconnection
      ws.on('close', (code, reason) => {
        handleDisconnection(ws, code, reason);
        connections.delete(ws.userId);
        logger.info(`WebSocket disconnected for user ${ws.userId}: ${code} ${reason}`);
      });
      
      // Handle errors
      ws.on('error', (error) => {
        logger.error(`WebSocket error for user ${ws.userId}:`, error);
        connections.delete(ws.userId);
      });
      
    } catch (error) {
      logger.error('WebSocket authentication failed:', error);
      ws.close(1008, 'Invalid token');
    }
  });

  // Heartbeat mechanism to detect broken connections
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        logger.info(`Terminating inactive WebSocket connection for user ${ws.userId}`);
        connections.delete(ws.userId);
        return ws.terminate();
      }
      
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000); // Check every 30 seconds

  wss.on('close', () => {
    clearInterval(heartbeat);
  });

  // Add utility methods to wss
  wss.broadcastToUser = (userId, message) => broadcastToUser(connections, userId, message);
  wss.broadcastToAll = (message) => broadcastToAll(connections, message);
  wss.getConnections = () => connections;

  logger.info('WebSocket server setup completed');
  return wss;
}

module.exports = {
  setupWebSocketServer,
  connections
};
