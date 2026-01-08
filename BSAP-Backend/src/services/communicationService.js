// services/communicationService.js
const { 
  Communications, 
  CommunicationsMessage, 
  CommunicationsMessageUser, 
  CommunicationsUser,
  CommunicationsAttachments,
  User 
} = require('../models');
const logger = require('../utils/logger');
const { Op, Sequelize } = require('sequelize');
const sequelize = require('../config/database');

// Cache for whether the communications_message_users table has an updateStatus-like column
let _messageUserHasUpdateStatus;
async function messageUserHasUpdateStatus() {
  if (typeof _messageUserHasUpdateStatus !== 'undefined') return _messageUserHasUpdateStatus;
  try {
    const desc = await sequelize.getQueryInterface().describeTable('communications_message_users');
    const cols = Object.keys(desc).map(c => c.toLowerCase());
    // common possibilities
    _messageUserHasUpdateStatus = cols.includes('updatestatus') || cols.includes('update_status');
  } catch (err) {
    // If describeTable fails, assume false to be safe
    _messageUserHasUpdateStatus = false;
  }
  return _messageUserHasUpdateStatus;
}

// Helper: get actual column name for updateStatus if present (preserve casing as DB has it)
async function getUpdateStatusColumnName() {
  try {
    const desc = await sequelize.getQueryInterface().describeTable('communications_message_users');
    const keys = Object.keys(desc);
    const found = keys.find(k => k.toLowerCase() === 'updatestatus' || k.toLowerCase() === 'update_status');
    return found || null;
  } catch (err) {
    return null;
  }
}

class CommunicationService {
  async getAllCommunications(filters = {}) {
    try {
      const { active = true, page, limit } = filters;
      const whereCondition = { active };
      const options = {
        where: whereCondition,
        order: [[sequelize.col('created_date'), 'DESC']]
      };

      if (page && limit) {
        options.offset = (page - 1) * limit;
        options.limit = limit;
      }

      return await Communications.findAll(options);
    } catch (error) {
      logger.error('Error getting communications:', error);
      throw error;
    }
  }

//  async createCommunication(data, createdBy) {
//   try {
//     const { name, subject, message, selectedBattalions = [], selectedBattalionNames = [] } = data;

//     if (selectedBattalions.length === 0)
//       throw new Error('At least one battalion must be selected');

//     // 1. Collect all active users from selected battalions
//     const targetUserIds = new Set();
//     for (const battalionId of selectedBattalions) {
//       const users = await User.findAll({
//         where: { battalionId, active: true },
//         attributes: ['id']
//       });
//       users.forEach(u => targetUserIds.add(u.id));
//     }

//     // 2. Include the creator
//     targetUserIds.add(createdBy);

//     // 3. Create the communication
//     const communication = await Communications.create({
//       name,
//       subject,
//       message,
//       battalionId: selectedBattalions[0], // primary battalion for reference
//       selectedBattalions,
//       selectedBattalionNames,
//       userIds: createdBy, // **all participants**
//       createdBy,
//       updatedBy: createdBy,
//       active: true
//     });

//     // 4. Link all users to communication
//     const participants = Array.from(targetUserIds).map(userId => ({
//       communicationId: communication.id,
//       userId
//     }));
//     await CommunicationsUser.bulkCreate(participants);

//     // 5. Create initial message
//     const initialMessage = await CommunicationsMessage.create({
//       communicationId: communication.id,
//       message: message || '',
//       active: true,
//       createdBy
//     });

//     // 6. Link message to all users
//     const messageUsers = Array.from(targetUserIds).map(userId => ({
//       communicationsMessageId: initialMessage.id,
//       userId,
//       active: true,
//       createdBy
//     }));
//     await CommunicationsMessageUser.bulkCreate(messageUsers);

//     return communication;

//   } catch (error) {
//     console.error('❌ Error in createCommunication:', error);
//     throw error;
//   }
// }

  // GET all communications visible to a user
 

  async createCommunication(data, createdBy) {
      const transaction = await Communications.sequelize.transaction();
      console.log("data document",data.document);
      
  try {
    const { name, subject, message, selectedBattalions = [], selectedBattalionNames = [] } = data;

    if (selectedBattalions.length === 0)
      throw new Error('At least one battalion must be selected');

    const targetUserIds = new Set();
    for (const battalionId of selectedBattalions) {
      const users = await User.findAll({
        where: { battalionId, active: true },
        attributes: ['id'],
        transaction  // pass transaction
      });
      users.forEach(u => targetUserIds.add(u.id));
    }

    targetUserIds.add(createdBy);

    const communication = await Communications.create({
      name,
      subject,
      message,
      battalionId: selectedBattalions[0],
      selectedBattalions,
      selectedBattalionNames,
      userIds: createdBy,
      createdBy,
      updatedBy: createdBy,
      active: true
    }, { transaction } );

    const participants = Array.from(targetUserIds).map(userId => ({
      communicationId: communication.id,
      userId
    }));
    await CommunicationsUser.bulkCreate(participants, { transaction } );

    const initialMessage = await CommunicationsMessage.create({
      communicationId: communication.id,
      message: message || '',
      active: true,
      createdBy
    }, { transaction } );

    const messageUsers = Array.from(targetUserIds).map(userId => ({
      communicationsMessageId: initialMessage.id,
      userId,
      active: true,
      createdBy
    }));
    await CommunicationsMessageUser.bulkCreate(messageUsers, { transaction } );

    // 🔥 SAVE DOCUMENT URL IN ATTACHMENT TABLE
    if (data.document) {
      await CommunicationsAttachments.create({
        communicationsMessageId: initialMessage.id,
        filename: this.extractFilename(data.document),
        createdBy,
        updatedBy: createdBy,
        active: true
      }, { transaction } );
    }
    await transaction.commit();

    return communication;

  } catch (error) {
    console.error('❌ Error in createCommunication:', error);
    throw error;
  }
}

 extractFilename(value) {
  try {
    if (typeof value === 'string' && value.includes('/uploads/performanceDocs/')) {
      return value.split('/uploads/performanceDocs/')[1]; // extract filename only
    }
    return value; // integer or normal text stays same
  } catch (e) {
    return value;
  }
}

// async createCommunication(data, createdBy) {
//   try {
//     const { name, subject, message, selectedBattalions = [], selectedBattalionNames = [], document } = data;

//     if (selectedBattalions.length === 0)
//       throw new Error('At least one battalion must be selected');

//     const targetUserIds = new Set();
//     for (const battalionId of selectedBattalions) {
//       const users = await User.findAll({
//         where: { battalionId, active: true },
//         attributes: ['id']
//       });
//       users.forEach(u => targetUserIds.add(u.id));
//     }

//     targetUserIds.add(createdBy);

//     const communication = await Communications.create({
//       name,
//       subject,
//       message,
//       battalionId: selectedBattalions[0],
//       selectedBattalions,
//       selectedBattalionNames,
//       userIds: createdBy,
//       createdBy,
//       updatedBy: createdBy,
//       active: true
//     });

//     const participants = Array.from(targetUserIds).map(userId => ({
//       communicationId: communication.id,
//       userId
//     }));
//     await CommunicationsUser.bulkCreate(participants);

//     const initialMessage = await CommunicationsMessage.create({
//       communicationId: communication.id,
//       message: message || '',
//       active: true,
//       createdBy
//     });

//     console.log('Initial message created:', initialMessage.toJSON()); // Log the message

//     const messageUsers = Array.from(targetUserIds).map(userId => ({
//       communicationsMessageId: initialMessage.id,
//       userId,
//       active: true,
//       createdBy
//     }));
//     await CommunicationsMessageUser.bulkCreate(messageUsers);

//     // 🔥 SAVE DOCUMENT URL IN ATTACHMENT TABLE
//     if (document) {
//       // Verify the message was created by fetching it again
//       const verifyMessage = await CommunicationsMessage.findByPk(initialMessage.id);
//       if (!verifyMessage) {
//         throw new Error(`CommunicationsMessage with ID ${initialMessage.id} was not created properly`);
//       }

//       await CommunicationsAttachments.create({
//         communicationsMessageId: initialMessage.id,
//         filename: document,
//         createdBy,
//         updatedBy: createdBy,
//         active: true
//       });
//     }

//     return communication;

//   } catch (error) {
//     console.error('❌ Error in createCommunication:', error);
//     throw error;
//   }
// }



  async getCommunicationsForUser(userId, battalionId) {
  try {
    const { Role } = require('../models');
    
    // First, get the user's info including role
    const user = await User.findByPk(userId, { 
      attributes: ['battalionId', 'roleId'],
      include: [{ model: Role, as: 'role', attributes: ['roleName'] }]
    });

    if (!user) throw new Error('User not found');

    // Determine if user is admin
    const roleNameLower = (user.role?.roleName || '').toLowerCase();
    const isAdmin = roleNameLower.includes('admin');

    let userBattalionId = battalionId || user?.battalionId;
    
    console.log(`👤 User ${userId} - Role: ${user.role?.roleName}, IsAdmin: ${isAdmin}, Battalion: ${userBattalionId}`);

    let whereCondition;

    if (isAdmin) {
      // ✅ ADMIN: Can see ALL communications
      console.log('👑 Admin user - showing all communications');
      whereCondition = {}; // No battalion filter for admins
    } else {
      // ✅ BATTALION USER: Can only see communications for their battalion
      console.log(`🏢 Battalion user - showing only communications for battalion ${userBattalionId}`);
      whereCondition = { // Only apply this condition if not admin
        [Op.or]: [
          // User's battalion is in selectedBattalions
          sequelize.where(
            sequelize.fn('JSON_CONTAINS', sequelize.col('selected_battalions'), JSON.stringify(userBattalionId)),
            Op.eq,
            1
          ),
          // Or user is the creator of the communication
          { createdBy: userId }
        ]
      };
    }

    const communications = await Communications.findAll({
      where: whereCondition,
      include: [
        {
          model: CommunicationsUser,
          as: 'communicationUsers',
          where: isAdmin ? undefined : { userId }, // Only filter by userId if not admin
          required: isAdmin ? false : true // Admins get LEFT JOIN, others get INNER JOIN
        },
        {
          model: CommunicationsMessage,
          as: 'messages',
          required: false,
          include: [
            { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] },
            {
          model: CommunicationsAttachments,
          as: 'attachments',
          required: false
        }
          ]
        },
         
      ],
      order: [['created_date', 'DESC']]
    });

    return communications.map(comm => {
      const plain = comm.get({ plain: true });
      plain.messageCount = plain.messages ? plain.messages.length : 0;
      return plain;
    });
  } catch (error) {
    console.error('❌ Error in getCommunicationsForUser:', error);
    throw error;
  }
}


  // GET communication detail by ID, enforce participant access AND battalion access (unless admin)
  async getCommunicationDetail(communicationId, userId, battalionId) {
    try {
      const { Role } = require('../models');
      
      // Get user's info including role
      const user = await User.findByPk(userId, { 
        attributes: ['battalionId', 'roleId'],
        include: [{ model: Role, as: 'role', attributes: ['roleName'] }]
      });

      if (!user) throw new Error('User not found');

      // Determine if user is admin
      const roleNameLower = (user.role?.roleName || '').toLowerCase();
      const isAdmin = roleNameLower.includes('admin');

      let userBattalionId = battalionId || user?.battalionId;

      const communication = await Communications.findOne({
        where: { id: communicationId, active: true },
        include: [
          {
            model: CommunicationsUser,
            as: 'communicationUsers',
            required: true
          },
          {
            model: CommunicationsMessage,
            as: 'messages',
            required: false,
            include: [
              { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] }
            ]
          }
        ]
      });

      if (!communication) return null;

      // If admin, bypass all further authorization checks
      if (isAdmin) {
        console.log(`👑 Admin user ${userId} accessing communication ${communicationId}`);
        // No further checks needed for admin
      } else {
        // For non-admin users, perform battalion and participant checks
        const selectedBattalions = communication.selectedBattalions || [];
        const isBattalionAuthorized = selectedBattalions.includes(userBattalionId) || communication.createdBy === userId;
        
        if (!isBattalionAuthorized) {
          throw new Error('You are not authorized to view this communication (battalion mismatch)');
        }
        const isParticipant = communication.communicationUsers.some(u => u.userId === userId);
        if (!isParticipant && communication.createdBy !== userId) {
          throw new Error('You are not authorized to view this communication');
        }
      }

      const plain = communication.get({ plain: true });
      plain.messageCount = plain.messages ? plain.messages.length : 0;
      return plain;

    } catch (error) {
      console.error('❌ Error in getCommunicationDetail:', error);
      throw error;
    }
  }

async createReply(communicationId, messageData, createdBy) {
    try {
      const { message } = messageData;

      if (!message) {
        throw new Error('Message content is required');
      }

      // Ensure the communication exists first
      const originalComm = await Communications.findOne({
        where: { id: communicationId },
        attributes: ['createdBy']
      });

      if (!originalComm) {
        throw new Error('Communication not found');
      }

      // Verify user membership; if the sender is not a participant, add them so
      // they can reply and will see their own replies when they login.
      let userAccess = await CommunicationsUser.findOne({
        where: {
          communicationId,
          userId: createdBy
        }
      });

      if (!userAccess) {
        try {
          await CommunicationsUser.create({ communicationId, userId: createdBy });
          logger.info(`Added user ${createdBy} as participant to communication ${communicationId} to allow reply`);
        } catch (createErr) {
          // If creation fails for some reason, log and continue — we'll still attempt to allow the reply
          logger.error('Failed to add user to communication participants:', createErr);
        }
      }

      // Get all participants for this communication (do not filter by non-existent columns)
      const participants = await CommunicationsUser.findAll({
        where: { communicationId },
        attributes: ['userId']
      });

      // Create a set of all participants (including the original sender and current replier)
      const participantIds = new Set([
        originalComm.createdBy,  // Original sender
        createdBy,              // Current replier
        ...participants.map(p => p.userId)
      ]);

      // Create reply message
      const newMessage = await CommunicationsMessage.create({
        communicationId,
        message,
        active: true,
        createdBy
      });

      // Link message to all participants including original sender
      const includeUpdateStatus = await messageUserHasUpdateStatus();
      const messageUsers = Array.from(participantIds).map(userId => {
        const obj = {
          communicationsMessageId: newMessage.id,
          userId,
          active: true,
          createdBy
        };
        if (includeUpdateStatus) obj.updateStatus = userId === createdBy ? 'READ' : 'UNREAD';
        return obj;
      });

      await CommunicationsMessageUser.bulkCreate(messageUsers);

      // Get full message data. If the DB has an update-status column, fetch messageUsers using a raw query
      const messageResult = await CommunicationsMessage.findOne({
        where: { id: newMessage.id },
        attributes: [
          'id',
          'message',
          'communicationId',
          'createdBy'
        ],
        include: [
          {
            model: User,
            as: 'user', // Include the user who created the message
            attributes: ['id', 'firstName', 'lastName']
          }
        ]
      });

      const plainMsg = messageResult ? messageResult.get({ plain: true }) : null;
      const includeUpdateStatusForSelect = await messageUserHasUpdateStatus();
      if (plainMsg) {
        if (includeUpdateStatusForSelect) {
          const updateCol = await getUpdateStatusColumnName();
          const attrs = CommunicationsMessageUser.rawAttributes;
          const commMsgField = (attrs.communicationsMessageId && attrs.communicationsMessageId.field) || 'communicationsMessageId';
          // Build safe raw select to fetch messageUsers with the actual DB column name for update status
          const selectCols = [`\`${(attrs.userId && attrs.userId.field) || 'userId'}\` as userId`];
          if (updateCol) selectCols.push(`\`${updateCol}\` as updateStatus`);
          const sql = `SELECT ${selectCols.join(', ')} FROM communications_message_users WHERE \`${commMsgField}\` = :msgId`;
          const rows = await sequelize.query(sql, { replacements: { msgId: newMessage.id }, type: Sequelize.QueryTypes.SELECT });
          // Attach messageUsers to the plain message object
          plainMsg.messageUsers = rows.map(r => ({ userId: r.userId, updateStatus: r.updateStatus }));
        } else {
          // Fallback: include only userId entries
          const rows = await CommunicationsMessageUser.findAll({ where: { communicationsMessageId: newMessage.id }, attributes: ['userId'] });
          plainMsg.messageUsers = rows.map(r => ({ userId: r.userId }));
        }
      }

      return {
        status: 'SUCCESS',
        message: 'Reply sent successfully',
        data: plainMsg
      };

    } catch (error) {
      logger.error('Error creating reply:', error);
      throw error;
    }
  }

  async createMessage(communicationId, messageData, createdBy) {
    // Backwards-compatible wrapper: controller expects createMessage
    try {
      const resp = await this.createReply(communicationId, messageData, createdBy);
      return resp.data; // return the raw message object
    } catch (err) {
      logger.error('Error in createMessage wrapper:', err);
      throw err;
    }
  }

  async getCommunicationThread(communicationId, userId) {
    try {
      // Verify user access
      // CommunicationsUser model doesn't include 'active' column; check membership by IDs
      const userAccess = await CommunicationsUser.findOne({
        where: {
          communicationId,
          userId
        }
      });

      if (!userAccess) {
        throw new Error('Communication not found or user does not have access');
      }

      // Determine if the DB supports updateStatus on communications_message_users
      const includeUpdateStatusForThread = await messageUserHasUpdateStatus();

      const includeClause = {
        model: CommunicationsMessageUser,
        where: {
          userId,
          active: true
        },
        attributes: includeUpdateStatusForThread ? ['userId', 'updateStatus'] : ['userId']
      };

      const messages = await CommunicationsMessage.findAll({
        where: {
          communicationId,
          active: true
        },
        attributes: [
          'id',
          'message',
          'createdBy',
          [sequelize.fn('DATE_FORMAT', sequelize.col('created_date'), '%Y-%m-%dT%H:%i:%s.000Z'), 'createdAt']
        ],
        include: [includeClause],
        order: [['created_date', 'ASC']]
      });

      // Mark all messages as read if supported
      if (includeUpdateStatusForThread && messages.length > 0) {
        const updateCol = await getUpdateStatusColumnName();
        const attrs = CommunicationsMessageUser.rawAttributes;
        const commMsgField = (attrs.communicationsMessageId && attrs.communicationsMessageId.field) || 'communicationsMessageId';
        const userIdField = (attrs.userId && attrs.userId.field) || 'userId';
        if (updateCol) {
          // Use raw query to avoid Sequelize attribute/field mismatch
          const ids = messages.map(m => m.id);
          const sql = `UPDATE communications_message_users SET \`${updateCol}\` = 'READ', updatedAt = :now WHERE \`${commMsgField}\` IN (:ids) AND \`${userIdField}\` = :userId AND \`${updateCol}\` = 'UNREAD'`;
          await sequelize.query(sql, { replacements: { now: new Date(), ids, userId } });
        } else {
          // Fallback to model update if we can't detect exact column name
          await CommunicationsMessageUser.update(
            { updateStatus: 'READ' },
            {
              where: {
                communicationsMessageId: messages.map(m => m.id),
                userId,
                updateStatus: 'UNREAD'
              }
            }
          );
        }
      }

      return {
        status: 'SUCCESS',
        message: 'Thread retrieved successfully',
        data: messages
      };

    } catch (error) {
      logger.error('Error fetching thread:', error);
      throw error;
    }
  }

  async getUnreadCount(userId) {
    try {
      if (!(await messageUserHasUpdateStatus())) {
        return { status: 'SUCCESS', data: { unreadCount: 0 } }; // Not supported in this schema
      }

      const updateCol = await getUpdateStatusColumnName();
      const attrs = CommunicationsMessageUser.rawAttributes;
      const userIdField = (attrs.userId && attrs.userId.field) || 'userId';
      const activeField = (attrs.active && attrs.active.field) || 'active';
      if (updateCol) {
        const sql = `SELECT COUNT(*) as cnt FROM communications_message_users WHERE \`${userIdField}\` = :userId AND \`${updateCol}\` = 'UNREAD' AND \`${activeField}\` = 1`;
        const rows = await sequelize.query(sql, { replacements: { userId }, type: Sequelize.QueryTypes.SELECT });
        const count = rows && rows[0] && (rows[0].cnt || rows[0].CNT || rows[0]['COUNT(*)']) ? (rows[0].cnt || rows[0].CNT || rows[0]['COUNT(*)']) : 0;
        return { status: 'SUCCESS', data: { unreadCount: Number(count) } };
      }

      const count = await CommunicationsMessageUser.count({
        where: {
          userId,
          updateStatus: 'UNREAD',
          active: true
        }
      });

      return {
        status: 'SUCCESS',
        data: { unreadCount: count }
      };
    } catch (error) {
      logger.error('Error getting unread count:', error);
      throw error;
    }
  }

  // Alias for getCommunicationDetail - get communication by ID with authorization checks
  async getCommunicationById(communicationId, userId, battalionId) {
    return this.getCommunicationDetail(communicationId, userId, battalionId);
  }
}

module.exports = new CommunicationService();