const { communicationService } = require('../services');
// const { notifyBattalion, notifyUser, broadcast } = require('../../websocket'); // UNUSED 2025-11-12 - WebSocket disabled
// Provide safe no-op fallbacks so controller calls remain functional without sockets.
function notifyBattalion(/* battalionId, event, data */) { /* UNUSED 2025-11-12 - noop */ }
function notifyUser(/* userId, event, data */) { /* UNUSED 2025-11-12 - noop */ }
function broadcast(/* event, data */) { /* UNUSED 2025-11-12 - noop */ }
const logger = require('../utils/logger');
const path = require('path');

/**
 * @route GET /api/communications
 * @desc Get all communications with pagination and filtering
 * @access Private
 */
async function list(req, res) {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      active: req.query.active !== undefined ? req.query.active === 'true' : true,
      search: req.query.search || ''
    };

    // Determine if the current user should see all communications
    // Users with a role name that includes 'admin' will receive all communications.
    const roleName = req.user && req.user.role && req.user.role.roleName ? String(req.user.role.roleName).toLowerCase() : '';
    const isAdmin = roleName.includes('admin');

    // Pass userId so non-admin users only see communications they participate in
    const communications = await communicationService.getAllCommunications(filters, req.user.id, isAdmin);

    res.json({
      status: 'SUCCESS',
      message: 'Communications retrieved successfully',
      data: communications
    });

  } catch (error) {
    logger.error('Error getting communications:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Failed to retrieve communications',
      error: error.message
    });
  }
}

/**
 * @route GET /api/communications/user
 * @desc Get communications for current user
 * @access Private
 */
async function userCommunications(req, res) {
  console.log("communication controller");
  
  try {
    const userId = req.user.id;
    // If battalionId is not present on the JWT payload, fetch fresh from DB to be safe
    let battalionId = req.user.battalionId;
    if (!battalionId) {
      const { User } = require('../models');
      try {
        const freshUser = await User.findByPk(userId, { attributes: ['battalionId'] });
        battalionId = freshUser ? freshUser.battalionId : null;
      } catch (err) {
        console.warn('Failed to fetch user battalion from DB:', err.message);
      }
    }

    console.log(`👤 Getting user-specific communications for user ${userId}, battalion ${battalionId}`);

    const communications = await communicationService.getCommunicationsForUser(userId, battalionId);

    res.json({
      status: 'SUCCESS',
      message: 'User communications retrieved successfully',
      data: communications
    });

  } catch (error) {
    logger.error('Error getting user communications:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Failed to retrieve user communications',
      error: error.message
    });
  }
}

/**
 * @route GET /api/communications/:id
 * @desc Get communication by ID
 * @access Private
 */
async function detail(req, res) {
  try {
    const { id } = req.params;
    const communication = await communicationService.getCommunicationById(
      parseInt(id), 
      req.user && req.user.id,
      req.user && req.user.battalionId
    );

    res.json({
      status: 'SUCCESS',
      message: 'Communication retrieved successfully',
      data: communication
    });

  } catch (error) {
    logger.error('Error getting communication:', error);
    const statusCode = error.message === 'Communication not found' ? 404 : 500;
    res.status(statusCode).json({
      status: 'ERROR',
      message: error.message
    });
  }
}

/**
 * @route POST /api/communications/start
 * @desc Start new communication
 * @access Private
 */

async function start(req, res) {
  try {
    const { name,
      subject,
      message,
      battalionId,
      selectedBattalions,
      document,
      selectedBattalionNames,
      userIds
    } = req.body;
    const createdBy = req.user.id;
    const userName = req.user.firstName + ' ' + req.user.lastName;
console.log('📨 Creating communication with selectedBattalions:', selectedBattalions);
console.log('📨 Creating communication with selectedBattalions:', document);


    if (!subject && !name) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Either subject or name is required'
      });
    }

    const finalSubject = subject || name;
    const finalName = name || subject;

    const battalionIds = (selectedBattalions && selectedBattalions.length > 0) 
      ? selectedBattalions.filter(b => b !== undefined)
      : (battalionId ? [battalionId] : []);

    const data = {
  name: finalName,
  subject: finalSubject,
  message: message,
  battalionId: battalionIds.length > 0 ? battalionIds[0] : null,  // ✅ FIX
  selectedBattalions: battalionIds,                               // ✅ SAVE ALL
  selectedBattalionNames: selectedBattalionNames || [],
  document:document || null,
 
};


     console.log('🔧 Data being sent to service:', data);

    // const result = await communicationService.createCommunication(data, createdBy);
    const communication = await communicationService.createCommunication(data, createdBy);

       battalionIds.forEach(battalionId => {
      try {
        notifyBattalion(battalionId, 'new_communication', {
          communicationId: communication.id,
          subject: communication.subject,
          message: communication.message,
          fromUserName: userName,
          formUserId: createdBy,
          battalionId: battalionIds,
          selectedBattalions: battalionIds, // Include for debugging
          selectedBattalionNames: selectedBattalionNames || [],
           hasDocument: !!documentData,
          documentName: documentData ? documentData.originalName : null,
          timestamp: new Date()
        });
        console.log(`✅ Notified battalion ${battalionId}`);
      } catch (wsError) {
        console.error(`❌ Failed to notify battalion ${battalionId}:`, wsError);
 }
    });
      // Notify individual users
     logger.info(`New communication created by user ${createdBy} for battalions: ${battalionIds.join(', ')}`);

    res.status(201).json({
      status: 'SUCCESS',
      message: 'Communication started successfully',
      data: communication
    });

  } catch (error) {
    logger.error('Error starting communication:', error);
    const statusCode = error.message.includes('already exists') ? 409 : 400;
    res.status(statusCode).json({
      status: 'ERROR',
      message: error.message
 });
  }
}

/** 
 * @route POST /api/communications/:id/reply
 * @desc Reply to communication
 * @access Private
 */
async function reply(req, res) {
  try {
    const { id } = req.params;
    const { message, battalionId } = req.body;
    const createdBy = req.user.id;
    const userName = req.user.firstName + ' ' + req.user.lastName;
    const userBattalionId = req.user.battalionId;
    // DEBUG: log incoming reply details to help diagnose why replies fail
    logger.info(`Reply attempt: user=${createdBy}, communicationId=${id}, battalionId=${battalionId}, message='${(message||'').slice(0,200)}'`);

    if (!message || !message.trim()) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Message content is required'
      });
    }

    // Use provided battalionId or user's battalionId
    const replyBattalionId = battalionId || userBattalionId;

    // Trim the message before validation
    const messageData = {
      message: message.trim(),
      userIds: [createdBy],
      battalionId: replyBattalionId
    };

    const createdMessage = await communicationService.createMessage(parseInt(id), messageData, createdBy);


    notifyBattalion(replyBattalionId, 'new_message', {
      communicationId: parseInt(id),
      message: message,
      fromUser: createdBy,
      fromUserName: userName,
      battalionId: replyBattalionId,
      replyId: createdMessage.id,
      timestamp: new Date()
    });

    // Notify communication creator about new reply
    broadcast('communication_update', {
      communicationId: parseInt(id),
      type: 'NEW_REPLY',
      battalionId: replyBattalionId,
      fromUserName: userName,
      message: `New reply from ${userName}`,
      timestamp: new Date()
    });

    logger.info(`Reply sent to communication ${id} by user ${createdBy} from battalion ${replyBattalionId}`);

    res.status(201).json({
      status: 'SUCCESS',
      message: 'Reply sent successfully',
      data: createdMessage
    });

  } catch (error) {
    logger.error('Error replying to communication:', error);
    const statusCode = error.message === 'Communication not found' ? 404 : 400;
    res.status(statusCode).json({
      status: 'ERROR',
      message: error.message
    });
  }
}

/**
 * @route PUT /api/communications/:id
 * @desc Update communication
 * @access Private
 */
async function update(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updatedBy = req.user.id;

    const communication = await communicationService.updateCommunication(
      parseInt(id), 
      updateData, 
      updatedBy
    );

    res.json({
      status: 'SUCCESS',
      message: 'Communication updated successfully',
      data: communication
    });

  } catch (error) {
    logger.error('Error updating communication:', error);
    const statusCode = error.message === 'Communication not found' ? 404 : 400;
    res.status(statusCode).json({
      status: 'ERROR',
      message: error.message
    });
  }
}

/**
 * @route DELETE /api/communications/:id
 * @desc Delete communication (soft delete)
 * @access Private
 */
async function remove(req, res) {
  try {
    const { id } = req.params;
    const deletedBy = req.user.id;

    const result = await communicationService.deleteCommunication(parseInt(id), deletedBy);

    res.json({
      status: 'SUCCESS',
      message: result.message
    });

  } catch (error) {
    logger.error('Error deleting communication:', error);
    const statusCode = error.message === 'Communication not found' ? 404 : 500;
    res.status(statusCode).json({
      status: 'ERROR',
      message: error.message
    });
  }
}

/**
 * @route GET /api/communications/:id/messages
 * @desc Get messages for a communication
 * @access Private
 */
async function messages(req, res) {
  try {
    const { id } = req.params;
    const communication = await communicationService.getCommunicationById(
      parseInt(id), 
      req.user && req.user.id,
      req.user && req.user.battalionId
    );

    res.json({
      status: 'SUCCESS',
      message: 'Communication messages retrieved successfully',
      data: communication.messages || []
    });

  } catch (error) {
    logger.error('Error getting communication messages:', error);
    const statusCode = error.message === 'Communication not found' ? 404 : 500;
    res.status(statusCode).json({
      status: 'ERROR',
      message: error.message
    });
  }
}

/**
 * @route GET /api/communications/:id/users
 * @desc Get users in a communication
 * @access Private
 */
async function users(req, res) {
  try {
    const { id } = req.params;
    const communication = await communicationService.getCommunicationById(
      parseInt(id), 
      req.user && req.user.id,
      req.user && req.user.battalionId
    );

    res.json({
      status: 'SUCCESS',
      message: 'Communication users retrieved successfully',
      data: communication.communicationUsers || []
    });

  } catch (error) {
    logger.error('Error getting communication users:', error);
    const statusCode = error.message === 'Communication not found' ? 404 : 500;
    res.status(statusCode).json({
      status: 'ERROR',
      message: error.message
    });
  }
}

/**
 * @route POST /api/communications/:id/users
 * @desc Add users to communication
 * @access Private
 */
async function addUsers(req, res) {
  try {
    const { id } = req.params;
    const { userIds } = req.body;
    const addedBy = req.user.id;

    const result = await communicationService.addUsersToCommunnication(
      parseInt(id), 
      userIds, 
      addedBy
    );

    res.json({
      status: 'SUCCESS',
      message: result.message
    });

  } catch (error) {
    logger.error('Error adding users to communication:', error);
    const statusCode = error.message === 'Communication not found' ? 404 : 400;
    res.status(statusCode).json({
      status: 'ERROR',
      message: error.message
    });
  }
}

/**
 * @route DELETE /api/communications/:id/users/:userId
 * @desc Remove user from communication
 * @access Private
 */
async function removeUser(req, res) {
  try {
    const { id, userId } = req.params;
    const removedBy = req.user.id;

    const result = await communicationService.removeUserFromCommunication(
      parseInt(id), 
      parseInt(userId), 
      removedBy
    );

    res.json({
      status: 'SUCCESS',
      message: result.message
    });

  } catch (error) {
    logger.error('Error removing user from communication:', error);
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      status: 'ERROR',
      message: error.message
    });
  }
}

/**
 * @route PUT /api/communications/messages/:messageId/status
 * @desc Update message read status
 * @access Private
 */
async function updateMessageStatus(req, res) {
  try {
    const { messageId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    const userName = req.user.firstName + ' ' + req.user.lastName;

    if (!['READ', 'UNREAD'].includes(status)) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Invalid status. Must be READ or UNREAD'
      });
    }

    const result = await communicationService.updateMessageStatus(
      parseInt(messageId), 
      userId, 
      status
    );

    // NEW: NOTIFY VIA WEB SOCKET
    if (status === 'READ') {
      broadcast('message_status_update', {
        messageId: parseInt(messageId),
        status: 'READ',
        userId: userId,
        userName: userName,
        timestamp: new Date()
      });
    }

    res.json({
      status: 'SUCCESS',
      message: result.message
    });

  } catch (error) {
    logger.error('Error updating message status:', error);
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      status: 'ERROR',
      message: error.message
    });
  }
}

/**
 * @route POST /api/communications/:id/mark-read
 * @desc Mark all messages in communication as read for user
 * @access Private
 */
async function markAllAsRead(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await communicationService.markAllMessagesAsRead(parseInt(id), userId);

    res.json({
      status: 'SUCCESS',
      message: result.message
    });

  } catch (error) {
    logger.error('Error marking messages as read:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Failed to mark messages as read'
    });
  }
}

/**
 * @route GET /api/communications/:id/statistics
 * @desc Get communication statistics
 * @access Private
 */
async function statistics(req, res) {
  try {
    const { id } = req.params;
    const statistics = await communicationService.getCommunicationStatistics(parseInt(id));

    res.json({
      status: 'SUCCESS',
      message: 'Communication statistics retrieved successfully',
      data: statistics
    });

  } catch (error) {
    logger.error('Error getting communication statistics:', error);
    const statusCode = error.message === 'Communication not found' ? 404 : 500;
    res.status(statusCode).json({
      status: 'ERROR',
      message: error.message
    });
  }
}

/**
 * @route GET /api/communications/search/:searchTerm
 * @desc Search communications
 * @access Private
 */
async function search(req, res) {
  try {
    const { searchTerm } = req.params;
    const { userId, battalionId } = req.query;

    const filters = {
      userId: userId ? parseInt(userId) : undefined,
      battalionId: battalionId ? parseInt(battalionId) : undefined
    };

    const communications = await communicationService.searchCommunications(searchTerm, filters);

    res.json({
      status: 'SUCCESS',
      message: 'Search completed successfully',
      data: communications
    });

  } catch (error) {
    logger.error('Error searching communications:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Search failed',
      error: error.message
    });
  }
}

/**
 * @route GET /api/communications/:id/update-status
 * @desc Get update status for communication and user
 * @access Private
 */
async function updateStatus(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const statuses = await communicationService.getUpdateStatusByCommunicationAndUser(
      parseInt(id), 
      userId
    );

    res.json({
      status: 'SUCCESS',
      message: 'Update statuses retrieved successfully',
      data: statuses
    });

  } catch (error) {
    logger.error('Error getting update statuses:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Failed to retrieve update statuses',
      error: error.message
    });
  }
}

/**
 * @route GET /api/communications/:id/battalion-replies
 * @desc Get replies by battalion for a communication
 * @access Private
 */
async function battalionReplies(req, res) {
  try {
    const { id } = req.params;
    const { battalionId } = req.query;

    const replies = await communicationService.getRepliesByBattalion(parseInt(id), parseInt(battalionId));

    res.json({
      status: 'SUCCESS',
      message: 'Battalion replies retrieved successfully',
      data: replies
    });

  } catch (error) {
    logger.error('Error getting battalion replies:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Failed to retrieve battalion replies'
    });
  }
}

/**
 * @route GET /api/communications/:id/status
 * @desc Get communication status with battalion-wise breakdown
 * @access Private
 */
async function communicationStatus(req, res) {
  try {
    const { id } = req.params;

    const status = await communicationService.getCommunicationStatus(parseInt(id));

    res.json({
      status: 'SUCCESS',
      message: 'Communication status retrieved successfully',
      data: status
    });

  } catch (error) {
    logger.error('Error getting communication status:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Failed to retrieve communication status'
    });
  }
}

module.exports = {
  list,
  userCommunications,
  detail,
  start,
  reply,
  update,
  remove,
  messages,
  users,
  addUsers,
  removeUser,
  updateMessageStatus,
  markAllAsRead, // NEW
  statistics,
  search,
  updateStatus,
  battalionReplies, // NEW
  communicationStatus // NEW
};