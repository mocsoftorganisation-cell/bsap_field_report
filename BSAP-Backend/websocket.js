// ==================== src/websocket.js ====================
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('./src/utils/logger'); // adjust path if needed
// const { io, server } = require('./src/websocket');

// let io; // will hold the socket.io instance
let io; // will hold the socket.io instance

/**
 * Initialize WebSocket Server
 * @param {Server} server - HTTP server instance
 */
function initWebSocket(server) {
  io = socketIO(server, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:4200',
        'http://localhost:5000',
        'http://localhost:5050',
        'http://164.52.217.93:4000'
      ],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // WebSocket authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.query?.token;
    if (!token) return next(new Error('Authentication error'));

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, decoded) => {
      if (err) return next(new Error('Authentication error'));
      socket.userId = decoded.id;
      socket.battalionId = decoded.battalionId;
      socket.userName = decoded.firstName + ' ' + decoded.lastName;
      next();
    });
  });

  // WebSocket connection handler
  io.on('connection', (socket) => {
    console.log(`✅ User ${socket.userId} (${socket.userName}) connected`);
    logger.info(`WebSocket: User ${socket.userId} connected`);

    // Join rooms
    socket.join(`battalion_${socket.battalionId}`);
    socket.join(`user_${socket.userId}`);

    // Typing / message events
    socket.on('new_message', (data) => handleNewMessage(socket, data));
    socket.on('message_read', (data) => handleMessageRead(socket, data));
    socket.on('typing_start', (data) => handleTypingStart(socket, data));
    socket.on('typing_stop', (data) => handleTypingStop(socket, data));

    socket.on('disconnect', () => {
      console.log(`❌ User ${socket.userId} disconnected`);
      logger.info(`WebSocket: User ${socket.userId} disconnected`);
    });
  });

  console.log('🔌 WebSocket server initialized');
  return io;
}

// ==================== Helper Functions ====================

function handleNewMessage(socket, data) {
  const { communicationId, message, battalionId } = data;

  socket.to(`battalion_${battalionId}`).emit('new_message', {
    communicationId,
    message,
    fromUser: socket.userId,
    fromUserName: socket.userName,
    battalionId: socket.battalionId,
    timestamp: new Date()
  });
}

function handleMessageRead(socket, data) {
  const { communicationId, messageId } = data;
  socket.broadcast.emit('message_status_update', {
    communicationId,
    messageId,
    status: 'READ',
    userId: socket.userId,
    userName: socket.userName,
    timestamp: new Date()
  });
}

function handleTypingStart(socket, data) {
  const { battalionId } = data;
  socket.to(`battalion_${battalionId}`).emit('typing_start', {
    userId: socket.userId,
    userName: socket.userName
  });
}

function handleTypingStop(socket, data) {
  const { battalionId } = data;
  socket.to(`battalion_${battalionId}`).emit('typing_stop', {
    userId: socket.userId,
    userName: socket.userName
  });
}

// ==================== Emit Utility Functions ====================

function notifyBattalion(battalionId, event, data) {
  console.log("notifyBattalion", battalionId, event, data);
  if (io) io.to(`battalion_${battalionId}`).emit(event, data);
}

function notifyUser(userId, event, data) {
  if (io) io.to(`user_${userId}`).emit(event, data);
}

function broadcast(event, data) {
  if (io) io.emit(event, data);
}

// ==================== Exports ====================
// NOTE: The real WebSocket implementation is preserved above for reference,
// but we are exporting no-op stubs so the application can be run with sockets
// disabled without changing callers across the codebase.
// UNUSED 2025-11-12 - WebSocket disabled and replaced with safe no-op exports.
module.exports = {
  initWebSocket: (server) => {
    console.log('[UNUSED 2025-11-12] initWebSocket called but WebSockets are disabled.');
    return null;
  },
  notifyBattalion: (battalionId, event, data) => {
    console.log('[UNUSED 2025-11-12] notifyBattalion called but WebSockets are disabled.', battalionId, event);
    // noop
  },
  notifyUser: (userId, event, data) => {
    console.log('[UNUSED 2025-11-12] notifyUser called but WebSockets are disabled.', userId, event);
    // noop
  },
  broadcast: (event, data) => {
    console.log('[UNUSED 2025-11-12] broadcast called but WebSockets are disabled.', event);
    // noop
  }
};