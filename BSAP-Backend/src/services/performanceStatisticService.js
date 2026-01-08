const { PerformanceStatistic, User, Question, Module, Topic, SubTopic, State, Range, District, Battalion,RoleTopic, RoleQuestion , Role} = require('../models');
const logger = require('../utils/logger');
const { Op, Sequelize } = require('sequelize');
// const { MSG_INDIA_CONFIG } = require('../config/msgIndia.config');
const sequelize = require('../config/database');
const MSG_INDIA_CONFIG = require('../config/msgIndia.config'); 
const axios = require('axios');
class PerformanceStatisticService {
  /**
   * 
   * 
   * Get all performance statistics by user ID
   * @param {number} userId - User ID
   * @returns {Array} Performance statistics
   */
  async getByUserId(userId) {
    const statistics = await PerformanceStatistic.findAll({
      where: { userId },
      include: [
        { model: Question, as: 'question' },
        { model: Module, as: 'module' },
        { model: Topic, as: 'topic' },
        { model: SubTopic, as: 'subTopic' }
      ],
      order: [['monthYear', 'DESC']]
    });

    return statistics;
  }

  /**
   * Get count by user ID and date
   * @param {number} userId - User ID
   * @param {string} date - Date string (YYYY-MM format)
   * @returns {number} Count
   */
  async getCountByUserIdAndDate(userId, date) {
    const count = await PerformanceStatistic.count({
      where: {
        userId,
        monthYear: { [Op.like]: `%${date}%` }
      }
    });

    return count;
  }

  /**
   * Get statistics by user ID and month
   * @param {number} userId - User ID
   * @param {string} date - Date string (YYYY-MM format)
   * @returns {Array} Performance statistics
   */
  async getByUserIdAndMonth(userId, date) {
    const statistics = await PerformanceStatistic.findAll({
      where: {
        userId,
        monthYear: { [Op.like]: `%${date}%` },
        active: true
      },
      include: [
        { model: Question, as: 'question' },
        { model: Module, as: 'module' },
        { model: Topic, as: 'topic' },
        { model: SubTopic, as: 'subTopic' }
      ],
      order: [['monthYear', 'DESC']]
    });

    return statistics;
  }

  /**
   * Get success count by user ID and date
   * @param {number} userId - User ID
   * @param {string} date - Date string (YYYY-MM format)
   * @returns {number} Success count
   */
  async getSuccessCountByUserIdAndDate(userId, date) {
    const count = await PerformanceStatistic.count({
      where: {
        userId,
        monthYear: { [Op.like]: `%${date}%` },
        active: true,
        status: 'SUCCESS'
      }
    });

    return count;
  }

  /**
   * Get in-progress count by user ID and date
   * @param {number} userId - User ID
   * @param {string} date - Date string (YYYY-MM format)
   * @returns {number} In-progress count
   */
  async getInProgressCountByUserIdAndDate(userId, date) {
    const count = await PerformanceStatistic.count({
      where: {
        userId,
        monthYear: { [Op.like]: `%${date}%` },
        active: true,
        status: 'INPROGRESS'
      }
    });

    return count;
  }

  /**
   * Get aggregated data by user IDs and question IDs
   * @param {Array} userIds - Array of user IDs
   * @param {Array} questionIds - Array of question IDs
   * @returns {Array} Aggregated data
   */
  async getByUserIdsAndQuestionIds(userIds, questionIds) {
    const results = await PerformanceStatistic.findAll({
      attributes: [
        'questionId',
        'monthYear',
        [Sequelize.fn('SUM', Sequelize.col('value')), 'totalValue']
      ],
      where: {
        userId: { [Op.in]: userIds },
        questionId: { [Op.in]: questionIds }
      },
      group: ['questionId', 'monthYear'],
      order: [['questionId', 'ASC'], ['monthYear', 'ASC']],
      raw: true
    });

    return results;
  }

  /**
   * Get aggregated data by district ID and question IDs
   * @param {number|Array} districtId - District ID or array of district IDs
   * @param {Array} questionIds - Array of question IDs
   * @param {Array} months - Optional array of months to filter
   * @returns {Array} Aggregated data
   */
  async getByDistrictIdAndQuestionIds(districtId, questionIds, months = null) {
    const whereCondition = {
      status: 'SUCCESS',
      questionId: { [Op.in]: questionIds }
    };

    if (Array.isArray(districtId)) {
      whereCondition.districtId = { [Op.in]: districtId };
    } else {
      whereCondition.districtId = districtId;
    }

    if (months && months.length > 0) {
      whereCondition.monthYear = { [Op.in]: months };
    }

    const results = await PerformanceStatistic.findAll({
      attributes: [
        'moduleId',
        'questionId',
        'monthYear',
        [Sequelize.fn('SUM', Sequelize.col('value')), 'totalValue']
      ],
      where: whereCondition,
      group: ['moduleId', 'monthYear'],
      order: [['questionId', 'ASC'], ['monthYear', 'ASC']],
      raw: true
    });

    return results;
  }

  /**
   * Get aggregated data by range ID and question IDs
   * @param {number|Array} rangeId - Range ID or array of range IDs
   * @param {Array} questionIds - Array of question IDs
   * @param {Array} months - Optional array of months to filter
   * @returns {Array} Aggregated data
   */
  async getByRangeIdAndQuestionIds(rangeId, questionIds, months = null) {
    const whereCondition = {
      status: 'SUCCESS',
      questionId: { [Op.in]: questionIds }
    };

    if (Array.isArray(rangeId)) {
      whereCondition.rangeId = { [Op.in]: rangeId };
    } else {
      whereCondition.rangeId = rangeId;
    }

    if (months && months.length > 0) {
      whereCondition.monthYear = { [Op.in]: months };
    }

    const results = await PerformanceStatistic.findAll({
      attributes: [
        'districtId',
        'questionId',
        'monthYear',
        [Sequelize.fn('SUM', Sequelize.col('value')), 'totalValue']
      ],
      where: whereCondition,
      group: ['districtId', 'monthYear'],
      order: [['districtId', 'DESC'], ['questionId', 'ASC'], ['monthYear', 'ASC']],
      raw: true
    });

    return results;
  }

  /**
   * Get aggregated data by state ID and question IDs
   * @param {number} stateId - State ID
   * @param {Array} questionIds - Array of question IDs
   * @param {Array} months - Optional array of months to filter
   * @returns {Array} Aggregated data
   */
  async getByStateIdAndQuestionIds(stateId, questionIds, months = null) {
    const whereCondition = {
      status: 'SUCCESS',
      questionId: { [Op.in]: questionIds }
    };

    if (stateId) {
      whereCondition.stateId = stateId;
    }

    if (months && months.length > 0) {
      whereCondition.monthYear = { [Op.in]: months };
    }

    const results = await PerformanceStatistic.findAll({
      attributes: [
        'rangeId',
        'questionId',
        'monthYear',
        [Sequelize.fn('SUM', Sequelize.col('value')), 'totalValue']
      ],
      where: whereCondition,
      group: ['rangeId', 'monthYear'],
      order: [['questionId', 'ASC'], ['monthYear', 'ASC']],
      raw: true
    });

    return results;
  }

  /**
   * Get aggregated data by module ID and question IDs
   * @param {number|Array} moduleId - Module ID or array of module IDs
   * @param {Array} questionIds - Array of question IDs
   * @param {Array} months - Optional array of months to filter
   * @returns {Array} Aggregated data
   */
  async getByModuleIdAndQuestionIds(moduleId, questionIds, months = null) {
    const whereCondition = {
      status: 'SUCCESS',
      questionId: { [Op.in]: questionIds }
    };

    if (Array.isArray(moduleId)) {
      whereCondition.moduleId = { [Op.in]: moduleId };
    } else {
      whereCondition.moduleId = moduleId;
    }

    if (months && months.length > 0) {
      whereCondition.monthYear = { [Op.in]: months };
    }

    const results = await PerformanceStatistic.findAll({
      attributes: [
        'topicId',
        'questionId',
        'monthYear',
        [Sequelize.fn('SUM', Sequelize.col('value')), 'totalValue']
      ],
      where: whereCondition,
      group: ['topicId', 'monthYear'],
      order: [['questionId', 'ASC'], ['monthYear', 'ASC']],
      raw: true
    });

    return results;
  }

  /**
   * Get aggregated data by topic ID and question IDs
   * @param {number|Array} topicId - Topic ID or array of topic IDs
   * @param {Array} questionIds - Array of question IDs
   * @param {Array} months - Optional array of months to filter
   * @returns {Array} Aggregated data
   */
  async getByTopicIdAndQuestionIds(topicId, questionIds, months = null) {
    const whereCondition = {
      status: 'SUCCESS',
      questionId: { [Op.in]: questionIds }
    };

    if (Array.isArray(topicId)) {
      whereCondition.topicId = { [Op.in]: topicId };
    } else {
      whereCondition.topicId = topicId;
    }

    if (months && months.length > 0) {
      whereCondition.monthYear = { [Op.in]: months };
    }

    const results = await PerformanceStatistic.findAll({
      attributes: [
        'subTopicId',
        'questionId',
        'monthYear',
        [Sequelize.fn('SUM', Sequelize.col('value')), 'totalValue']
      ],
      where: whereCondition,
      group: ['subTopicId', 'monthYear', 'questionId'],
      order: [['questionId', 'ASC'], ['monthYear', 'ASC']],
      raw: true
    });

    return results;
  }

  /**
   * Get aggregated data by sub-topic ID and question IDs
   * @param {number|Array} subTopicId - Sub-topic ID or array of sub-topic IDs
   * @param {Array} questionIds - Array of question IDs
   * @param {Array} months - Optional array of months to filter
   * @returns {Array} Aggregated data
   */
  async getBySubTopicIdAndQuestionIds(subTopicId, questionIds, months = null) {
    const whereCondition = {
      status: 'SUCCESS',
      questionId: { [Op.in]: questionIds }
    };

    if (Array.isArray(subTopicId)) {
      whereCondition.subTopicId = { [Op.in]: subTopicId };
    } else {
      whereCondition.subTopicId = subTopicId;
    }

    if (months && months.length > 0) {
      whereCondition.monthYear = { [Op.in]: months };
    }

    const results = await PerformanceStatistic.findAll({
      attributes: [
        'subTopicId',
        'questionId',
        'monthYear',
        [Sequelize.fn('SUM', Sequelize.col('value')), 'totalValue']
      ],
      where: whereCondition,
      group: ['monthYear', 'questionId'],
      order: [['questionId', 'ASC'], ['monthYear', 'ASC']],
      raw: true
    });

    return results;
  }

  /**
   * Get all unique month-year labels
   * @returns {Array} Array of month-year labels
   */
  async getAllLabels() {
    const results = await PerformanceStatistic.findAll({
      attributes: ['monthYear'],
      group: ['monthYear'],
      order: [['monthYear', 'ASC']],
      raw: true
    });

    return results.map(r => r.monthYear);
  }

  /**
   * Get labels by various filters
   * @param {Object} filters - Filter conditions
   * @returns {Array} Array of month-year labels
   */
  async getLabelsByFilters(filters) {
    const { districtId, rangeId, stateId, moduleId, topicId, subTopicId, questionIds } = filters;
    
    const whereCondition = {
      status: 'SUCCESS',
      questionId: { [Op.in]: questionIds }
    };

    if (districtId) {
      if (Array.isArray(districtId)) {
        whereCondition.districtId = { [Op.in]: districtId };
      } else {
        whereCondition.districtId = districtId;
      }
    }

    if (rangeId) {
      if (Array.isArray(rangeId)) {
        whereCondition.rangeId = { [Op.in]: rangeId };
      } else {
        whereCondition.rangeId = rangeId;
      }
    }

    if (stateId) whereCondition.stateId = stateId;
    if (moduleId) whereCondition.moduleId = moduleId;
    if (topicId) whereCondition.topicId = topicId;
    if (subTopicId) whereCondition.subTopicId = subTopicId;

    const results = await PerformanceStatistic.findAll({
      attributes: ['monthYear'],
      where: whereCondition,
      group: ['monthYear'],
      order: [['monthYear', 'ASC']],
      raw: true
    });

    return results.map(r => r.monthYear);
  }

  /**
   * Get values for report generation
   * @param {Object} filters - Filter conditions
   * @returns {Array} Report data
   */
  async getValuesForReport(filters) {
    const { type, id, questionId, subTopicId, userIds } = filters;
    
    let whereCondition = {
      status: 'SUCCESS',
      questionId
    };

    let groupBy = ['monthYear'];
    let attributes = ['monthYear', [Sequelize.fn('SUM', Sequelize.col('value')), 'totalValue']];

    switch (type) {
      case 'state':
        whereCondition.stateId = id;
        break;
      case 'range':
        whereCondition.rangeId = id;
        break;
      case 'district':
        whereCondition.districtId = id;
        break;
      case 'user':
        if (Array.isArray(id)) {
          whereCondition.userId = { [Op.in]: id };
          attributes = ['userId', 'monthYear', 'value'];
          groupBy = ['userId', 'monthYear'];
        } else {
          whereCondition.userId = id;
        }
        break;
      case 'multiUser':
        whereCondition.userId = { [Op.in]: userIds || id };
        attributes = ['userId', 'monthYear', 'value'];
        groupBy = ['userId', 'monthYear'];
        break;
    }

    if (subTopicId) {
      whereCondition.subTopicId = subTopicId;
    }

    const results = await PerformanceStatistic.findAll({
      attributes,
      where: whereCondition,
      group: groupBy,
      order: [['monthYear', 'ASC']],
      include: type === 'user' || type === 'multiUser' ? [
        { 
          model: User, 
          as: 'user',
          include: [{ model:Battalion, as: 'battalion' }]
        }
      ] : [],
      raw: type !== 'user' && type !== 'multiUser'
    });

    return results;
  }

  /**
   * Create new performance statistic
   * @param {Object} data - Performance statistic data
   * @returns {Object} Created performance statistic
   */
  async create(data) {
    const { 
      userId, 
      questionId, 
      moduleId, 
      topicId, 
      subTopicId, 
      stateId, 
      rangeId, 
      districtId, 
      value, 
      monthYear,
      status = 'INPROGRESS'
    } = data;

    // Validation
    if (!userId || !questionId || !moduleId || !value || !monthYear) {
      throw new Error('User ID, question ID, module ID, value, and month-year are required');
    }

    const statistic = await PerformanceStatistic.create({
      userId,
      questionId,
      moduleId,
      topicId,
      subTopicId,
      stateId,
      rangeId,
      districtId,
      value,
      monthYear,
      status,
      createdBy: userId,
      updatedBy: userId,
      active: true
    });

    logger.info(`Performance statistic created for user ${userId}, question ${questionId}, month ${monthYear}`);
    return statistic;
  }

  /**
   * Update performance statistic
   * @param {number} id - Performance statistic ID
   * @param {Object} updateData - Update data
   * @returns {Object} Updated performance statistic
   */
  async update(id, updateData) {
    const statistic = await PerformanceStatistic.findByPk(id);
    if (!statistic) {
      throw new Error('Performance statistic not found');
    }

    await statistic.update(updateData);

    logger.info(`Performance statistic ${id} updated`);
    return statistic;
  }

  /**
   * Delete performance statistic (soft delete)
   * @param {number} id - Performance statistic ID
   * @returns {Object} Response
   */
  async delete(id) {
    const statistic = await PerformanceStatistic.findByPk(id);
    if (!statistic) {
      throw new Error('Performance statistic not found');
    }

    await statistic.update({ active: false });

    logger.info(`Performance statistic ${id} deleted`);
    return {
      success: true,
      message: 'Performance statistic deleted successfully'
    };
  }

  /**
   * Bulk create performance statistics
   * @param {Array} dataArray - Array of performance statistic data
   * @returns {Array} Created performance statistics
   */
  async bulkCreate(dataArray) {
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      throw new Error('Data array is required');
    }

    const statistics = await PerformanceStatistic.bulkCreate(dataArray, {
      validate: true,
      returning: true
    });

    logger.info(`${statistics.length} performance statistics created in bulk`);
    return statistics;
  }

  /**
   * Get performance statistics with pagination
   * @param {Object} filters - Filter and pagination options
   * @returns {Object} Paginated performance statistics
   */
  async getWithPagination(filters = {}) {
    const { 
      page = 1, 
      limit = 20, 
      userId, 
      questionId, 
      moduleId, 
      topicId, 
      subTopicId, 
      stateId, 
      rangeId, 
      districtId, 
      status, 
      monthYear 
    } = filters;

    const offset = (page - 1) * limit;
    const whereCondition = { active: true };

    if (userId) whereCondition.userId = userId;
    if (questionId) whereCondition.questionId = questionId;
    if (moduleId) whereCondition.moduleId = moduleId;
    if (topicId) whereCondition.topicId = topicId;
    if (subTopicId) whereCondition.subTopicId = subTopicId;
    if (stateId) whereCondition.stateId = stateId;
    if (rangeId) whereCondition.rangeId = rangeId;
    if (districtId) whereCondition.districtId = districtId;
    if (status) whereCondition.status = status;
    if (monthYear) whereCondition.monthYear = { [Op.like]: `%${monthYear}%` };

    const { count, rows } = await PerformanceStatistic.findAndCountAll({
      where: whereCondition,
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Question, as: 'question' },
        { model: Module, as: 'module' },
        { model: Topic, as: 'topic' },
        { model: SubTopic, as: 'subTopic' },
        { model: State, as: 'state' },
        { model: Range, as: 'range' },
        { model:Battalion, as: 'battalion' }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    return {
      data: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
      hasNext: page < Math.ceil(count / limit),
      hasPrev: page > 1
    };
  }

  /**
   * Get performance form data similar to Java controller
   * @param {Object} params - Module and topic parameters
   * @returns {Object} Form data with modules, topics, and questions
   */
//  async getPerformanceForm({ modulePathId, topicPathId, userId }) {
//     try {
//       console.log(`Performance form request - Module: ${modulePathId}, Topic: ${topicPathId}, User: ${userId}`);
      
//       // const startTime = process.hrtime.bigint();
//       logger.info(`Function Started AT: ${new Date().toISOString()}`);

//       // Date calculations
//       const now = new Date();
//       const currentMonth = now.getMonth();
//       const currentYear = now.getFullYear();
      
//       // Calculate previous month (current - 2 months as per Java logic)
//       const prevMonth = new Date(now);
//       prevMonth.setMonth(currentMonth - 2);
//       const prevMonthYear = prevMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
      
//       // Calculate current month year (current month - 1)
//       const currentMonthDate = new Date(now);
//       currentMonthDate.setMonth(now.getMonth() - 1);
//       const currentMonthYear = currentMonthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();

//       // Get user details
//       const user = await User.findByPk(userId, {
//         include: [{ model: Battalion, as: 'battalion' }]
//       });

//       if (!user) {
//         throw new Error('User not found');
//       }

//         // Get user's role ID (assuming user has roleId field)
//       const userRoleId = user.roleId;


//       console.log("userRole", userRoleId);
      
      
//       if (!userRoleId) {
//         throw new Error('User role not found');
//       }

//        // Get all topics that are allowed for this user's role
//       const allowedRoleTopics = await RoleTopic.findAll({
//         where: { 
//           roleId: userRoleId,
//           active: true 
//         },
//         attributes: ['topicId'],
//         raw: true
//       }
//     );

// console.log("allowed topic", allowedRoleTopics);


//   const allowedTopicIds = allowedRoleTopics.map(rt => rt.topicId);

//   console.log("allowed topic id", allowedTopicIds);

//   // Get all questions that are allowed for this user's role
//     const allowedRoleQuestions = await RoleQuestion.findAll({
//       where: { 
//         roleId: userRoleId,
//         active: true 
//       },
//       attributes: ['questionId'],
//       raw: true
//     });
//     console.log("allowed questions", allowedRoleQuestions);

//     const allowedQuestionIds = allowedRoleQuestions.map(rq => rq.questionId);
      
//       // If no topics are allowed for this role, return empty
//       if (allowedTopicIds.length === 0) {
//         return {
//           modules: [],
//           userDistrict: user.battalion?.battalionName || 'Unknown District',
//           monthYear: currentMonthYear,
//           isSuccess: false,
//           nextModule: false,
//           prevModule: false,
//           nextTopic: false,
//           prevTopic: false
//         };
//       }

//       // Get module by priority
//       const modules = await Module.findAll({
//         where: { 
//           active: true,
//           priority: modulePathId + 1
//         },
//         order: [['priority', 'ASC']]
//       });

//       if (!modules.length) {
//         throw new Error(`Module not found with priority: ${modulePathId + 1}`);
//       }

//       const currentModule = modules[0];

//       // Check navigation
//       const [nextModules, prevModules] = await Promise.all([
//         Module.findAll({ where: { active: true, priority: modulePathId + 2 } }),
//         Module.findAll({ where: { active: true, priority: modulePathId } })
//       ]);

//       const moduleData = [];

//       for (const module of modules) {
//         // Check module completion
//         const moduleCompletionCount = await PerformanceStatistic.count({
//           where: {
//             moduleId: module.id,
//             userId,
//             monthYear: { [Op.like]: `%${currentMonthYear}%` },
//             status: 'SUCCESS'
//           }
//         });

//         // Get topics
//         const allTopics = await Topic.findAll({
//           where: { 
//             moduleId: module.id,
//             active: true,
//              id: { [Op.in]: allowedTopicIds } // Filter by allowed topics
//           },
//           order: [['priority', 'ASC']]
//         });

//         if (!allTopics.length) {
//           continue;
//         }

//         // const currentTopic = allTopics[topicPathId - 1];
//          let currentTopicIndex = topicPathId - 1;
//          if (currentTopicIndex < 0 || currentTopicIndex >= allTopics.length) {
//           // Default to first topic if invalid
//           currentTopicIndex = 0;
//         }
 
//          const currentTopic = allTopics[currentTopicIndex];
//         // Check topic navigation
//         const hasNextTopic = topicPathId < allTopics.length;
//         const hasPrevTopic = topicPathId > 1;

//         // Process topic based on form type
//         let topicData;
//         switch (currentTopic.formType) {
//           case 'NORMAL':
//             topicData = await this.processNormalForm(currentTopic, userId, currentMonthYear, prevMonthYear, currentYear, allowedQuestionIds);
//             break;
//           case 'ST/Q':
//             topicData = await this.processSTQForm(currentTopic, userId, currentMonthYear, prevMonthYear, currentYear, allowedQuestionIds);
//             break;
//           case 'Q/ST':
//             topicData = await this.processQSTForm(currentTopic, userId, currentMonthYear, prevMonthYear, currentYear, allowedQuestionIds);
//             break;
//           default:
//             topicData = await this.processNormalForm(currentTopic, userId, currentMonthYear, prevMonthYear, currentYear, allowedQuestionIds);
//         }

//         // Add navigation info
//         topicData.nextTopic = hasNextTopic;
//         topicData.prevTopic = hasPrevTopic;
//         topicData.isAllowed = true; // All topics in this list are allowed


//         moduleData.push({
//           id: module.id,
//           moduleName: module.moduleName,
//           priority: module.priority,
//           isDisabled: moduleCompletionCount > 0,
//           topicDTOs: [topicData]
//         });
//       }

//       // Check success status
//       const isSuccess = await this.checkSuccessStatus(user, currentMonthYear);

//    console.log("performance data send to sontroller from service");

//       return {
//         modules: moduleData,
//         userDistrict: user.battalion?.battalionName || 'Unknown District',
//         monthYear: currentMonthYear,
//         isSuccess,
//         nextModule: nextModules.length > 0,
//         prevModule: prevModules.length > 0,
//         nextTopic: moduleData[0]?.topicDTOs[0]?.nextTopic || false,
//         prevTopic: moduleData[0]?.topicDTOs[0]?.prevTopic || false
//       };

//     } catch (error) {
//       logger.error('getting performance form data:', error);
//       throw error;
//     }
//     console.log("performance data send to sontroller from service");
    
//   }

// async getPerformanceForm({ modulePathId, topicPathId, userId }) {
//   try {
//     console.log(`Performance form request - Module: ${modulePathId}, Topic: ${topicPathId}, User: ${userId}`);
    
//     // ... existing date calculations code ...
  
//       // const startTime = process.hrtime.bigint();
//       logger.info(`Function Started AT: ${new Date().toISOString()}`);

//       // Date calculations
//       const now = new Date();
//       const currentMonth = now.getMonth();
//       const currentYear = now.getFullYear();
      
//       // Calculate previous month (current - 2 months as per Java logic)
//       const prevMonth = new Date(now);
//       prevMonth.setMonth(currentMonth - 2);
//       const prevMonthYear = prevMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
      
//       // Calculate current month year (current month - 1)
//       const currentMonthDate = new Date(now);
//       currentMonthDate.setMonth(now.getMonth() - 1);
//       const currentMonthYear = currentMonthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();

//     // Get user details
//     const user = await User.findByPk(userId, {
//       include: [{ model: Battalion, as: 'battalion' }]
//     });

//     if (!user) {
//       throw new Error('User not found');
//     }

//     const userRoleId = user.roleId;
    
//     if (!userRoleId) {
//       throw new Error('User role not found');
//     }

//     // // Get allowed topics and questions
//     // const allowedRoleTopics = await RoleTopic.findAll({
//     //   where: { 
//     //     roleId: userRoleId,
//     //     active: true 
//     //   },
//     //   attributes: ['topicId'],
//     //   raw: true
//     // });
//     // Get all allowed topics for this module
// const allowedRoleTopics = await Topic.findAll({
//   where: { 
//     // moduleId: currentModule.id,
//     roleId: userRoleId,
//     active: true,
//     // id: { [Op.in]: allowedTopicIds }

//   },
//   order: [['priority', 'ASC']]
// });

// // ========== ADD DEBUGGING HERE ==========
// console.log("=== DEBUGGING TOPICS ===");
// // console.log("Allowed topic IDs for role:", allowedTopicIds);
// // console.log("Module ID:", currentModule.id);
// console.log("Number of topics found:", allTopics.length);

// // List all found topics with their IDs and priorities
// const topicList = allTopics.map((t, index) => ({
//   index: index,
//   id: t.id,
//   name: t.topicName,
//   priority: t.priority,
//   formType: t.formType
// }));
// console.log("Topics found (sorted by priority):", JSON.stringify(topicList, null, 2));

// // Check if topic 122 is in the list
// const topic122 = allTopics.find(t => t.id === 122);
// console.log("Topic 122 found?", !!topic122);
// if (topic122) {
//   const topic122Index = allTopics.findIndex(t => t.id === 122);
//   console.log("Topic 122 index in array:", topic122Index);
//   console.log("Topic 122 details:", {
//     id: topic122.id,
//     name: topic122.topicName,
//     priority: topic122.priority,
//     priorityType: typeof topic122.priority
//   });
// }

// // Check what topic we'll get for requested index
// const requestedIndex = parseInt(topicPathId) - 1;
// console.log("Requested topic index (frontend sent topic=" + topicPathId + "):", requestedIndex);
// if (requestedIndex >= 0 && requestedIndex < allTopics.length) {
//   const requestedTopic = allTopics[requestedIndex];
//   console.log("Topic at requested index:", {
//     id: requestedTopic.id,
//     name: requestedTopic.topicName,
//     priority: requestedTopic.priority
//   });
// } else {
//   console.log("Requested index out of bounds!");
// }
// console.log("=== END DEBUGGING ===");
// // ========== END DEBUGGING ==========

//     const allowedTopicIds = allowedRoleTopics.map(rt => rt.topicId);

//     const allowedRoleQuestions = await RoleQuestion.findAll({
//       where: { 
//         roleId: userRoleId,
//         active: true 
//       },
//       attributes: ['questionId'],
//       raw: true
//     });

//     const allowedQuestionIds = allowedRoleQuestions.map(rq => rq.questionId);
    
//     if (allowedTopicIds.length === 0) {
//       return {
//         modules: [],
//         userDistrict: user.battalion?.battalionName || 'Unknown District',
//         monthYear: currentMonthYear,
//         isSuccess: false,
//         nextModule: false,
//         prevModule: false,
//         nextTopic: false,
//         prevTopic: false
//       };
//     }

//     // Get module by priority (modulePathId is 0-based index from frontend)
//     const modules = await Module.findAll({
//       where: { 
//         active: true,
//         priority: modulePathId + 1  // Convert 0-based to 1-based
//       },
//       order: [['priority', 'ASC']]
//     });

//     if (!modules.length) {
//       throw new Error(`Module not found with priority: ${modulePathId + 1}`);
//     }

//     const currentModule = modules[0];

//     // Check navigation for modules
//     const [nextModules, prevModules] = await Promise.all([
//       Module.findAll({ where: { active: true, priority: modulePathId + 2 } }),
//       Module.findAll({ where: { active: true, priority: modulePathId } })
//     ]);

//     // Check module completion
//     const moduleCompletionCount = await PerformanceStatistic.count({
//       where: {
//         moduleId: currentModule.id,
//         userId,
//         monthYear: { [Op.like]: `%${currentMonthYear}%` },
//         status: 'SUCCESS'
//       }
//     });

//     // Get all allowed topics for this module
//     const allTopics = await Topic.findAll({
//       where: { 
//         moduleId: currentModule.id,
//         active: true,
//         id: { [Op.in]: allowedTopicIds }
//       },
//       order: [['priority', 'ASC']]
//     });

//     if (!allTopics.length) {
//       return {
//         modules: [],
//         userDistrict: user.battalion?.battalionName || 'Unknown District',
//         monthYear: currentMonthYear,
//         isSuccess: false,
//         nextModule: nextModules.length > 0,
//         prevModule: prevModules.length > 0,
//         nextTopic: false,
//         prevTopic: false
//       };
//     }

//     // IMPORTANT: topicPathId is 1-based INDEX from frontend
//     // Convert to 0-based index for array access
//     let currentTopicIndex = parseInt(topicPathId) - 1;
    
//     // Validate and adjust index
//     if (currentTopicIndex < 0) {
//       currentTopicIndex = 0;
//     } else if (currentTopicIndex >= allTopics.length) {
//       currentTopicIndex = allTopics.length - 1;
//     }

//     const currentTopic = allTopics[currentTopicIndex];
    
//     // Check topic navigation
//     const hasNextTopic = currentTopicIndex < allTopics.length - 1;
//     const hasPrevTopic = currentTopicIndex > 0;

//     // Process topic based on form type
//     let topicData;
//     switch (currentTopic.formType) {
//       case 'NORMAL':
//         topicData = await this.processNormalForm(currentTopic, userId, currentMonthYear, prevMonthYear, currentYear, allowedQuestionIds);
//         break;
//       case 'ST/Q':
//         topicData = await this.processSTQForm(currentTopic, userId, currentMonthYear, prevMonthYear, currentYear, allowedQuestionIds);
//         break;
//       case 'Q/ST':
//         topicData = await this.processQSTForm(currentTopic, userId, currentMonthYear, prevMonthYear, currentYear, allowedQuestionIds);
//         break;
//       default:
//         topicData = await this.processNormalForm(currentTopic, userId, currentMonthYear, prevMonthYear, currentYear, allowedQuestionIds);
//     }

//     // Add navigation info to topic
//     topicData.nextTopic = hasNextTopic;
//     topicData.prevTopic = hasPrevTopic;
//     topicData.isAllowed = true;

//     const moduleData = [{
//       id: currentModule.id,
//       moduleName: currentModule.moduleName,
//       priority: currentModule.priority,
//       isDisabled: moduleCompletionCount > 0,
//       topicDTOs: [topicData]
//     }];

//     // Check success status
//     const isSuccess = await this.checkSuccessStatus(user, currentMonthYear);

//     return {
//       modules: moduleData,
//       userDistrict: user.battalion?.battalionName || 'Unknown District',
//       monthYear: currentMonthYear,
//       isSuccess,
//       nextModule: nextModules.length > 0,
//       prevModule: prevModules.length > 0,
//       nextTopic: hasNextTopic,
//       prevTopic: hasPrevTopic
//     };

//   } catch (error) {
//     logger.error('Error getting performance form data:', error);
//     throw error;
//   }
// }

// async getPerformanceForm({ modulePathId, topicPathId, userId }) {
//   try {
//     logger.info(`Function Started AT: ${new Date().toISOString()}`);

//     /* -------------------- DATE LOGIC -------------------- */
//     const now = new Date();

//     const prevMonth = new Date(now);
//     prevMonth.setMonth(now.getMonth() - 2);
//     const prevMonthYear = prevMonth
//       .toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
//       .toUpperCase();

//     const currentMonthDate = new Date(now);
//     currentMonthDate.setMonth(now.getMonth() - 1);
//     const currentMonthYear = currentMonthDate
//       .toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
//       .toUpperCase();

//     /* -------------------- USER -------------------- */
//     const user = await User.findByPk(userId, {
//       include: [{ model: Battalion, as: 'battalion' }]
//     });

//     if (!user || !user.roleId) {
//       throw new Error('User or role not found');
//     }

//     const userRoleId = user.roleId;

//     /* -------------------- ROLE → TOPICS -------------------- */
//     const roleTopics = await RoleTopic.findAll({
//       where: { roleId: userRoleId, active: true },
//       attributes: ['topicId'],
//       raw: true
//     });

//     const allowedTopicIds = roleTopics.map(rt => rt.topicId);

//     if (!allowedTopicIds.length) {
//       return this.emptyResponse(user, currentMonthYear);
//     }

//     /* -------------------- ROLE → QUESTIONS -------------------- */
//     const roleQuestions = await RoleQuestion.findAll({
//       where: { roleId: userRoleId, active: true },
//       attributes: ['questionId'],
//       raw: true
//     });

//     const allowedQuestionIds = roleQuestions.map(rq => rq.questionId);

//     /* -------------------- MODULE -------------------- */
//     const currentModule = await Module.findOne({
//       where: {
//         active: true,
//         priority: modulePathId + 1
//       }
//     });

//     if (!currentModule) {
//       throw new Error('Module not found');
//     }

//     /* -------------------- ALL TOPICS (FOR NAVIGATION) -------------------- */
//     const allTopics = await Topic.findAll({
//       where: {
//         moduleId: currentModule.id,
//         active: true,
//         id: { [Op.in]: allowedTopicIds }
//       },
//       order: [['priority', 'ASC']]
//     });

//     if (!allTopics.length) {
//       return this.emptyResponse(user, currentMonthYear);
//     }

//     /* -------------------- CURRENT TOPIC (SAFE SELECTION) -------------------- */
//     let currentTopicIndex = 1;
//     const topicParam = Number(topicPathId);

//     // 1️⃣ Try priority-based match
//     if (!isNaN(topicParam)) {
//       const priorityIndex = allTopics.findIndex(
//         t => t.priority === topicParam
//       );
//       if (priorityIndex !== -1) {
//         currentTopicIndex = priorityIndex;
//       }
//     }

//     // 2️⃣ Fallback → index-based (legacy frontend)
//     if (
//       isNaN(topicParam) === false &&
//       currentTopicIndex === 1 &&
//       allTopics[0].priority !== topicParam
//     ) {
//       const index = topicParam ;
//       if (index >= 0 && index < allTopics.length) {
//         currentTopicIndex = index;
//       }
//     }

//     // 3️⃣ Final safety fallback
//     if (currentTopicIndex < 0 || currentTopicIndex >= allTopics.length) {
//       currentTopicIndex = 0;
//     }

//     const currentTopic = allTopics[currentTopicIndex];

//     const hasNextTopic = currentTopicIndex < allTopics.length - 1;
//     const hasPrevTopic = currentTopicIndex > 0;

//     /* -------------------- PROCESS FORM -------------------- */
//     let topicData;

//     switch (currentTopic.formType) {
//       case 'ST/Q':
//         topicData = await this.processSTQForm(
//           currentTopic,
//           userId,
//           currentMonthYear,
//           prevMonthYear,
//           now.getFullYear(),
//           allowedQuestionIds
//         );
//         break;

//       case 'Q/ST':
//         topicData = await this.processQSTForm(
//           currentTopic,
//           userId,
//           currentMonthYear,
//           prevMonthYear,
//           now.getFullYear(),
//           allowedQuestionIds
//         );
//         break;

//       default:
//         topicData = await this.processNormalForm(
//           currentTopic,
//           userId,
//           currentMonthYear,
//           prevMonthYear,
//           now.getFullYear(),
//           allowedQuestionIds
//         );
//     }

//     topicData.nextTopic = hasNextTopic;
//     topicData.prevTopic = hasPrevTopic;
//     topicData.isAllowed = true;

//     /* -------------------- MODULE COMPLETION -------------------- */
//     const moduleCompleted = await PerformanceStatistic.count({
//       where: {
//         moduleId: currentModule.id,
//         userId,
//         status: 'SUCCESS',
//         monthYear: { [Op.like]: `%${currentMonthYear}%` }
//       }
//     });

//     /* -------------------- FINAL RESPONSE -------------------- */
//     return {
//       modules: [{
//         id: currentModule.id,
//         moduleName: currentModule.moduleName,
//         priority: currentModule.priority,
//         isDisabled: moduleCompleted > 0,
//         topicDTOs: [topicData]
//       }],
//       userDistrict: user.battalion?.battalionName || 'Unknown District',
//       monthYear: currentMonthYear,
//       isSuccess: await this.checkSuccessStatus(user, currentMonthYear),
//       nextModule: await Module.count({
//         where: { active: true, priority: currentModule.priority + 1 }
//       }) > 0,
//       prevModule: currentModule.priority > 1,
//       nextTopic: hasNextTopic,
//       prevTopic: hasPrevTopic
//     };

//   } catch (error) {
//     logger.error('Error getting performance form data:', error);
//     throw error;
//   }
// }

// async getPerformanceForm({ modulePathId, topicPathId, userId }) {
//   try {
//     logger.info(`Function Started AT: ${new Date().toISOString()}`);

//     /* -------------------- DATE LOGIC -------------------- */
//     const now = new Date();

//     const prevMonth = new Date(now);
//     prevMonth.setMonth(now.getMonth() - 2);
//     const prevMonthYear = prevMonth
//       .toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
//       .toUpperCase();

//     const currentMonthDate = new Date(now);
//     currentMonthDate.setMonth(now.getMonth() - 1);
//     const currentMonthYear = currentMonthDate
//       .toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
//       .toUpperCase();

//     /* -------------------- USER -------------------- */
//     const user = await User.findByPk(userId, {
//       include: [{ model: Battalion, as: 'battalion' }]
//     });

//     if (!user || !user.roleId) {
//       throw new Error('User or role not found');
//     }

//     const userRoleId = user.roleId;

//     /* -------------------- ROLE → TOPICS -------------------- */
//     const roleTopics = await RoleTopic.findAll({
//       where: { roleId: userRoleId, active: true },
//       attributes: ['topicId'],
//       raw: true
//     });

//     const allowedTopicIds = roleTopics.map(rt => rt.topicId);

//     if (!allowedTopicIds.length) {
//       return this.emptyResponse(user, currentMonthYear);
//     }

//     /* -------------------- ROLE → QUESTIONS -------------------- */
//     const roleQuestions = await RoleQuestion.findAll({
//       where: { roleId: userRoleId, active: true },
//       attributes: ['questionId'],
//       raw: true
//     });

//     const allowedQuestionIds = roleQuestions.map(rq => rq.questionId);

//     /* -------------------- MODULE -------------------- */
//     const currentModule = await Module.findOne({
//       where: {
//         active: true,
//         priority: modulePathId + 1
//       }
//     });

//     if (!currentModule) {
//       throw new Error('Module not found');
//     }

//     /* -------------------- ALL TOPICS -------------------- */
//     const allTopics = await Topic.findAll({
//       where: {
//         moduleId: currentModule.id,
//         active: true,
//         id: { [Op.in]: allowedTopicIds }
//       },
//       order: [['priority', 'ASC']]
//     });

//     if (!allTopics.length) {
//       return this.emptyResponse(user, currentMonthYear);
//     }

//     /* -------------------- CURRENT TOPIC (FIXED) -------------------- */
//     const topicPriority = Number(topicPathId);

//     if (isNaN(topicPriority)) {
//       throw new Error('Invalid topic parameter');
//     }

//     const currentTopicIndex = allTopics.findIndex(
//       t => t.priority === topicPriority
//     );

//     if (currentTopicIndex === -1) {
//       throw new Error(`Topic with priority ${topicPriority} not found`);
//     }

//     const currentTopic = allTopics[currentTopicIndex];

//     const hasNextTopic = currentTopicIndex < allTopics.length - 1;
//     const hasPrevTopic = currentTopicIndex > 0;

//     /* -------------------- PROCESS FORM -------------------- */
//     let topicData;

//     switch (currentTopic.formType) {
//       case 'ST/Q':
//         topicData = await this.processSTQForm(
//           currentTopic,
//           userId,
//           currentMonthYear,
//           prevMonthYear,
//           now.getFullYear(),
//           allowedQuestionIds
//         );
//         break;

//       case 'Q/ST':
//         topicData = await this.processQSTForm(
//           currentTopic,
//           userId,
//           currentMonthYear,
//           prevMonthYear,
//           now.getFullYear(),
//           allowedQuestionIds
//         );
//         break;

//       default:
//         topicData = await this.processNormalForm(
//           currentTopic,
//           userId,
//           currentMonthYear,
//           prevMonthYear,
//           now.getFullYear(),
//           allowedQuestionIds
//         );
//     }

//     topicData.nextTopic = hasNextTopic;
//     topicData.prevTopic = hasPrevTopic;
//     topicData.isAllowed = true;

//     /* -------------------- MODULE COMPLETION -------------------- */
//     const moduleCompleted = await PerformanceStatistic.count({
//       where: {
//         moduleId: currentModule.id,
//         userId,
//         status: 'SUCCESS',
//         monthYear: { [Op.like]: `%${currentMonthYear}%` }
//       }
//     });

//     /* -------------------- FINAL RESPONSE -------------------- */
//     return {
//       modules: [
//         {
//           id: currentModule.id,
//           moduleName: currentModule.moduleName,
//           priority: currentModule.priority,
//           isDisabled: moduleCompleted > 0,
//           topicDTOs: [topicData]
//         }
//       ],
//       userDistrict: user.battalion?.battalionName || 'Unknown District',
//       monthYear: currentMonthYear,
//       isSuccess: await this.checkSuccessStatus(user, currentMonthYear),
//       nextModule:
//         (await Module.count({
//           where: { active: true, priority: currentModule.priority + 1 }
//         })) > 0,
//       prevModule: currentModule.priority > 1,
//       nextTopic: hasNextTopic,
//       prevTopic: hasPrevTopic
//     };
//   } catch (error) {
//     logger.error('Error getting performance form data:', error);
//     throw error;
//   }
// }


async getPerformanceForm({ modulePathId, topicId, topicPathId, userId }) {
  try {
    logger.info(`Function Started AT: ${new Date().toISOString()}`);
    logger.info(`Received params - modulePathId: ${modulePathId}, topicId: ${topicId}, topicPathId: ${topicPathId}, userId: ${userId}`);

    /* -------------------- DATE LOGIC -------------------- */
    const now = new Date();

    const prevMonth = new Date(now);
    prevMonth.setMonth(now.getMonth() - 2);
    const prevMonthYear = prevMonth
      .toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      .toUpperCase();

    const currentMonthDate = new Date(now);
    currentMonthDate.setMonth(now.getMonth() - 1);
    const currentMonthYear = currentMonthDate
      .toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      .toUpperCase();

    /* -------------------- USER -------------------- */
    const user = await User.findByPk(userId, {
      include: [{ model: Battalion, as: 'battalion' }]
    });

    if (!user || !user.roleId) {
      throw new Error('User or role not found');
    }

    const userRoleId = user.roleId;

    /* -------------------- ROLE → TOPICS -------------------- */
    const roleTopics = await RoleTopic.findAll({
      where: { roleId: userRoleId, active: true },
      attributes: ['topicId'],
      raw: true
    });

    const allowedTopicIds = roleTopics.map(rt => rt.topicId);

    if (!allowedTopicIds.length) {
      return this.emptyResponse(user, currentMonthYear);
    }

    /* -------------------- ROLE → QUESTIONS -------------------- */
    const roleQuestions = await RoleQuestion.findAll({
      where: { roleId: userRoleId, active: true },
      attributes: ['questionId'],
      raw: true
    });

    const allowedQuestionIds = roleQuestions.map(rq => rq.questionId);

    /* -------------------- MODULE -------------------- */
    // const currentModule = await Module.findOne({
    //   where: {
    //     active: true,
    //     priority: modulePathId + 1
    //   }
    // });

    // if (!currentModule) {
    //   throw new Error('Module not found');
    // }

    /* -------------------- MODULE -------------------- */
/* -------------------- MODULE (FIXED) -------------------- */
let currentModule;

// Check if modulePathId is 0 (legacy priority-based) or an actual module ID
if (modulePathId === 0) {
  // Legacy mode: Find by priority (priority = 1)
  currentModule = await Module.findOne({
    where: {
      active: true,
      priority: 1  // First module
    }
  });
} else {
  // Modern mode: Find by actual module ID
  currentModule = await Module.findOne({
    where: {
      active: true,
      id: modulePathId  // Find by actual ID
    }
  });
}

if (!currentModule) {
  throw new Error('Module not found');
}

logger.info(`Current module: ID=${currentModule.id}, Name=${currentModule.moduleName}, Priority=${currentModule.priority}`);

    /* -------------------- ALL TOPICS (FOR NAVIGATION) -------------------- */
   
   
    const allTopics = await Topic.findAll({
      where: {
        moduleId: currentModule.id,
        active: true,
        id: { [Op.in]: allowedTopicIds }
      },
      order: [['priority', 'ASC']]
    });

    if (!allTopics.length) {
      return this.emptyResponse(user, currentMonthYear);
    }

    // Log available topics for debugging
    logger.info(`Available topics for module ${currentModule.id}:`);
    allTopics.forEach((topic, index) => {
      logger.info(`  [${index + 1}] ID: ${topic.id}, Priority: ${topic.priority}, Name: ${topic.topicName}`);
    });

    /* -------------------- CURRENT TOPIC SELECTION (ID-BASED) -------------------- */
   
   console.log('=== DEBUG: Topic Selection ===');
    console.log('All topics:', allTopics.map(t => ({ id: t.id, priority: t.priority, name: t.topicName })));
    console.log('Looking for topic with ID:', topicId);
    console.log('Looking for topic with topicPathId:', topicPathId);
   
    let currentTopic = null;
    let currentTopicIndex = 0;

    // 1️⃣ PRIORITY: Use topicId if provided (new frontend)
    if (topicId) {
      logger.info(`Looking for topic by ID: ${topicId}`);
      currentTopic = allTopics.find(t => t.id === Number(topicId));
      
      // if (currentTopic) {
      //   currentTopicIndex = allTopics.findIndex(t => t.id === Number(topicId));
      //   logger.info(`Found topic by ID: ${currentTopic.id} - "${currentTopic.topicName}" at index ${currentTopicIndex}`);
      // } else {
      //   logger.warn(`Topic ID ${topicId} not found in allowed topics, falling back...`);
      // }

 if (topicId && !isNaN(topicId)) {
      currentTopic = allTopics.find(t => t.id === Number(topicId));
      if (currentTopic) {
        currentTopicIndex = allTopics.findIndex(t => t.id === Number(topicId));
        console.log(`✅ Found by topicId ${topicId}: ${currentTopic.id} - "${currentTopic.topicName}"`);
      } else {
        console.log(`❌ Topic ID ${topicId} not found in accessible topics`);
      }
    }

    }

    // 2️⃣ LEGACY SUPPORT: Use topicPathId (old frontend)
    // if (!currentTopic && topicPathId) {
    //   const topicParam = Number(topicPathId);
    //   logger.info(`Falling back to legacy param: topicPathId=${topicParam}`);
      
    //   // Try to find by priority first
    //   currentTopic = allTopics.find(t => t.priority === topicParam);
    //   if (currentTopic) {
    //     currentTopicIndex = allTopics.findIndex(t => t.id === topicParam);
    //     logger.info(`Found by id ${topicParam}: ${currentTopic.id}`);
    //   }
    //   // If not found by priority, use as index
    //   else if (!isNaN(topicParam)) {
    //     const index = topicParam - 1;
    //     if (index >= 0 && index < allTopics.length) {
    //       currentTopic = allTopics[index];
    //       currentTopicIndex = index;
    //       logger.info(`Found by index ${index}: ${currentTopic.id}`);
    //     }
    //   }
    // }
if (!currentTopic && topicPathId && !isNaN(topicPathId)) {
      currentTopic = allTopics.find(t => t.id === Number(topicPathId));
      if (currentTopic) {
        currentTopicIndex = allTopics.findIndex(t => t.id === Number(topicPathId));
        console.log(`✅ Found by topicPathId ${topicPathId}: ${currentTopic.id} - "${currentTopic.topicName}"`);
      } else {
        console.log(`❌ TopicPathId ${topicPathId} not found in accessible topics`);
      }
    }

    // 3️⃣ FINAL FALLBACK: First topic
    if (!currentTopic) {
      currentTopic = allTopics[0];
      currentTopicIndex = 0;
      logger.info(`Using first topic as fallback: ${currentTopic.id} "${currentTopic.topicName}"`);
    }

    const hasNextTopic = currentTopicIndex < allTopics.length - 1;
    const hasPrevTopic = currentTopicIndex > 0;

    // Log final selection
    logger.info(`Selected topic: ID=${currentTopic.id}, Priority=${currentTopic.priority}, Name="${currentTopic.topicName}", Index=${currentTopicIndex}`);
 console.log(`Selected topic: ID=${currentTopic.id}, Name="${currentTopic.topicName}", Index=${currentTopicIndex}`);
    console.log('=== DEBUG END ===');

    /* -------------------- PROCESS FORM -------------------- */
    let topicData;

    switch (currentTopic.formType) {
      case 'ST/Q':
        topicData = await this.processSTQForm(
          currentTopic,
          userId,
          currentMonthYear,
          prevMonthYear,
          now.getFullYear(),
          allowedQuestionIds
        );
        break;

      case 'Q/ST':
        topicData = await this.processQSTForm(
          currentTopic,
          userId,
          currentMonthYear,
          prevMonthYear,
          now.getFullYear(),
          allowedQuestionIds
        );
        break;

      default:
        topicData = await this.processNormalForm(
          currentTopic,
          userId,
          currentMonthYear,
          prevMonthYear,
          now.getFullYear(),
          allowedQuestionIds
        );
    }

    topicData.nextTopic = hasNextTopic;
    topicData.prevTopic = hasPrevTopic;
    topicData.isAllowed = true;

    /* -------------------- MODULE COMPLETION -------------------- */
    const moduleCompleted = await PerformanceStatistic.count({
      where: {
        moduleId: currentModule.id,
        userId,
        status: 'SUCCESS',
        monthYear: { [Op.like]: `%${currentMonthYear}%` }
      }
    });

    /* -------------------- FINAL RESPONSE -------------------- */
    return {
      modules: [{
        id: currentModule.id,
        moduleName: currentModule.moduleName,
        priority: currentModule.priority,
        isDisabled: moduleCompleted > 0,
        topicDTOs: [topicData]
      }],
      userDistrict: user.battalion?.battalionName || 'Unknown District',
      monthYear: currentMonthYear,
      isSuccess: await this.checkSuccessStatus(user, currentMonthYear),
      nextModule: await Module.count({
        where: { active: true, priority: currentModule.priority + 1 }
      }) > 0,
      prevModule: currentModule.priority > 1,
      nextTopic: hasNextTopic,
      prevTopic: hasPrevTopic,
      // Return current topic info for frontend navigation
      currentTopic: {
        id: currentTopic.id,
        priority: currentTopic.priority,
        name: currentTopic.topicName
      },
      // Return all topics for frontend to build navigation
      allTopics: allTopics.map(topic => ({
        id: topic.id,
        priority: topic.priority,
        name: topic.topicName
      }))
    };

  } catch (error) {
    logger.error('Error getting performance form data:', error);
    throw error;
  }
}
  async processNormalForm(topic, userId, currentMonthYear, prevMonthYear, currentYear,allowedQuestionIds) {
    const questions = await Question.findAll({
      where: { topicId: topic.id, active: true, id: { [Op.in]: allowedQuestionIds } },
      order: [['priority', 'ASC']]
    });


     // If no allowed questions for this topic, return empty topic
  if (!questions.length) {
    return {
      id: topic.id,
      topicName: topic.topicName,
      topicSubName: topic.subName,
      formType: topic.formType,
      moduleId: topic.moduleId,
      isShowPrevious: topic.isShowPrevious !== false,
      isShowCummulative: topic.isShowCummulative !== false,
      questionDTOs: [],
      questions: [],
      subTopics: [],
      totalCurrentCount: 0,
      hasNoQuestions: true // Flag to indicate no questions are allowed
    };
  }


    const questionIds = questions.map(q => q.id);
    
    // Generate financial year months
    const months = this.generateFinancialYearMonths(topic, currentYear);

    // Bulk queries for performance
    const [prevData, finYearData, currentData] = await Promise.all([
      this.getBulkPreviousData(prevMonthYear, questionIds, userId),
      this.getBulkFinYearData(months, questionIds, userId),
      this.getBulkCurrentData(currentMonthYear, questionIds, userId)
    ]);

    const processedQuestions = [];
    let totalCurrentCount = 0;
    let lastMonthEndValue = null;
    let oldSubTopicID = 0;
    let tId = 1;

    for (const question of questions) {
      const questionDTO = this.createQuestionDTO(question);

      // Handle subtopic grouping
      if (question.subTopicId && question.subTopicId !== oldSubTopicID) {
        oldSubTopicID = question.subTopicId;
        tId = 1;
      }
      questionDTO.tId = tId++;

      // Find data for this question
      const prevValue = prevData.find(d => d.questionId === question.id)?.value;
      const finYearValue = finYearData.find(d => d.questionId === question.id)?.value;
      const currentValue = currentData.find(d => d.questionId === question.id)?.value;
      const status = currentData.find(d => d.questionId === question.id)?.status;

      // Set previous count
      if (prevValue && this.shouldShowPrevious(question, topic)) {
        questionDTO.previousCount = prevValue;
        
        if (this.shouldIncludeInTotal(question, prevValue)) {
          totalCurrentCount += this.parseNumericValue(prevValue);
        }
      }

      // Set financial year count
      if (finYearValue && this.shouldShowCummulative(question)) {
        questionDTO.finYearCount = finYearValue;
        
        // Check for end of month values
        if (this.isEndOfMonthQuestion(question.question)) {
          lastMonthEndValue = prevValue;
        }
      }

      // Apply default value logic
      const processedCurrentValue = await this.applyDefaultValue(
        question, 
        prevValue, 
        currentValue, 
        userId, 
        prevMonthYear,
        lastMonthEndValue
      );

      questionDTO.currentCount = processedCurrentValue;

      // Calculate totals
      if (this.shouldIncludeInTotal(question, processedCurrentValue)) {
        totalCurrentCount += this.parseNumericValue(processedCurrentValue);
      }

      // Set disabled status
      questionDTO.isDisabled = status === 'SUCCESS' || this.hasFormula(question);
       questionDTO.isAllowed = true; // All questions in this list are allowed

      // Get subtopic info if exists
      if (question.subTopicId) {
        const subTopic = await SubTopic.findByPk(question.subTopicId);
        if (subTopic) {
          questionDTO.subTopicName = subTopic.subTopicName;
        }
      }

      processedQuestions.push(questionDTO);
    }

    // Get subtopics
     // Get subtopics (only those that have allowed questions)
    const subTopicIds = questions.map(q => q.subTopicId).filter(id => id);
    const subTopics = await SubTopic.findAll({
      where: { topicId: topic.id, active: true,id: { [Op.in]: subTopicIds } },
      order: [['priority', 'ASC']]
    });

    return {
      id: topic.id,
      topicName: topic.topicName,
      topicSubName: topic.subName,
      formType: topic.formType,
      moduleId: topic.moduleId,
      isShowPrevious: topic.isShowPrevious !== false,
      isShowCummulative: topic.isShowCummulative !== false,
      questionDTOs: processedQuestions,
      questions: processedQuestions,
      subTopics: subTopics.map(st => ({
        id: st.id,
        subTopicName: st.subTopicName,
        isDisabled: false
      })),
      totalCurrentCount
    };
  }

  async processSTQForm(topic, userId, currentMonthYear, prevMonthYear, currentYear,allowedQuestionIds) {
    const [questions, subTopics] = await Promise.all([
      Question.findAll({
        where: { topicId: topic.id, active: true,  id: { [Op.in]: allowedQuestionIds } },
        order: [['priority', 'ASC']]
      }),
      SubTopic.findAll({
        where: { topicId: topic.id, active: true },
        order: [['priority', 'ASC']]
      })
    ]);



    // If no allowed questions for this topic, return empty topic
  if (!questions.length) {
    return {
      id: topic.id,
      topicName: topic.topicName,
      topicSubName: topic.subName,
      formType: topic.formType,
      moduleId: topic.moduleId,
      isShowPrevious: topic.isShowPrevious !== false,
      isShowCummulative: topic.isShowCummulative !== false,
      questions: [],
      subTopics: subTopics.map(st => ({
        id: st.id,
        subTopicName: st.subTopicName,
        isDisabled: true // Disable all subtopics when no questions
      })),
      hasNoQuestions: true
  };
  }



    const questionIds = questions.map(q => q.id);
    const subTopicIds = subTopics.map(st => st.id);

    // Bulk queries for subtopic combinations
    const [currentCountData, valueData, finYearData] = await Promise.all([
      this.getCurrentCountAllByUser(currentMonthYear, questionIds, userId, subTopicIds),
      this.getCountByPreviousMonthSub(prevMonthYear, questionIds, userId, subTopicIds),
      this.getFinYearCountAllByUser(currentYear, questionIds, userId, subTopicIds)
    ]);

    const processedQuestions = [];
    const processedSubTopics = subTopics.map(st => ({
      id: st.id,
      subTopicName: st.subTopicName,
      isDisabled: false
    }));

    let tId = 1;

    for (const question of questions) {
      const questionDTO = this.createQuestionDTO(question);
      questionDTO.tId = tId++;
      questionDTO.isAllowed = true; // All questions in this list are allowed

      const currentCountList = [];
      const valueList = [];
      const finYearList = [];

      for (const subTopic of subTopics) {
        // Find data for this question-subtopic combination
        const currentCount = currentCountData.find(
          d => d.questionId === question.id && d.subTopicId === subTopic.id
        )?.value;

        const prevValue = valueData.find(
          d => d.questionId === question.id && d.subTopicId === subTopic.id
        )?.value;

        const finYearValue = finYearData.find(
          d => d.questionId === question.id && d.subTopicId === subTopic.id
        )?.value;

        const status = currentCountData.find(
          d => d.questionId === question.id && d.subTopicId === subTopic.id
        )?.status;

        // Apply default value logic
        const processedValue = await this.applyDefaultValueForSubTopic(
          question,
          subTopic,
          prevValue,
          currentCount,
          userId,
          prevMonthYear
        );

        currentCountList.push(processedValue || '0');
        valueList.push(prevValue || '0');
        finYearList.push(finYearValue || '0');

        // Check if this combination is disabled
        if (status === 'SUCCESS' || this.hasFormulaForCombination(question, subTopic)) {
          questionDTO.isDisabled = true;
        }
      }

      questionDTO.currentCountList = currentCountList;
      questionDTO.valueList = valueList;
      questionDTO.finYearList = finYearList;

      processedQuestions.push(questionDTO);
    }

    return {
      id: topic.id,
      topicName: topic.topicName,
      topicSubName: topic.subName,
      formType: topic.formType,
      moduleId: topic.moduleId,
      isShowPrevious: topic.isShowPrevious !== false,
      isShowCummulative: topic.isShowCummulative !== false,
      questions: processedQuestions,
      subTopics: processedSubTopics
    };
  }

  async processQSTForm(topic, userId, currentMonthYear, prevMonthYear, currentYear, allowedQuestionIds) {
    // Similar to ST/Q but with different processing logic for new entries
    const result = await this.processSTQForm(topic, userId, currentMonthYear, prevMonthYear, currentYear, allowedQuestionIds);


     // If no questions, return the empty result
  if (result.hasNoQuestions) {
    return result;
  }

    // Add new entry detection for Q/ST form
    for (const question of result.questions) {
      for (let i = 0; i < result.subTopics.length; i++) {
        const subTopic = result.subTopics[i];
        
        // Check if this is a new entry
        const preCount = await PerformanceStatistic.count({
          where: {
            questionId: question.id,
            userId,
            subTopicId: subTopic.id,
            monthYear: { [Op.not]: currentMonthYear }
          }
        });

        question.isNewList = question.isNewList || [];
        question.isNewList[i] = preCount === 0;
      }
    }

    return result;
  }

  // Apply default value logic
  async applyDefaultValue(question, prevValue, currentValue, userId, prevMonthYear, lastMonthEndValue) {
    switch (question.defaultVal) {
      case 'PREVIOUS':
        return prevValue || '0';

      case 'QUESTION':
        if (currentValue) return currentValue;
        
        const questValue = await this.getReferencedQuestionValue(
          question.defaultQue,
          userId,
          prevMonthYear,
          question.subTopicId
        );
        return questValue || '0';

      case 'PS':
        return await this.getUserPSCount(userId);

      case 'SUB':
        return await this.getUserSubCount(userId);

      case 'CIRCLE':
        return await this.getUserCircleCount(userId);

      case 'PSOP':
        return await this.getUserPSOPCount(userId);

      case 'NONE':
        return currentValue || '0';

      default:
        // Handle "beginning of month" logic
        if (this.isBeginningOfMonthQuestion(question.question) && lastMonthEndValue) {
          return lastMonthEndValue;
        }
        return '0';
    }
  }

  async applyDefaultValueForSubTopic(question, subTopic, prevValue, currentValue, userId, prevMonthYear) {
    switch (question.defaultVal) {
      case 'PREVIOUS':
        return prevValue || '0';

      case 'QUESTION':
        if (currentValue) return currentValue;
        
        const questValue = await this.getReferencedQuestionValueSub(
          question.defaultQue,
          userId,
          prevMonthYear,
          subTopic.id
        );
        return questValue || '0';

      case 'NONE':
        return currentValue || '0';

      default:
        return '0';
    }
  }

  // Bulk data retrieval methods
  async getBulkPreviousData(prevMonthYear, questionIds, userId) {
    const results = await PerformanceStatistic.findAll({
      where: {
        monthYear: { [Op.like]: `%${prevMonthYear}%` },
        questionId: { [Op.in]: questionIds },
        userId
      },
      attributes: ['questionId', 'value']
    });

    return results.map(r => ({
      questionId: r.questionId,
      value: r.value
    }));
  }

  async getBulkCurrentData(currentMonthYear, questionIds, userId) {
    const results = await PerformanceStatistic.findAll({
      where: {
        monthYear: { [Op.like]: `%${currentMonthYear}%` },
        questionId: { [Op.in]: questionIds },
        userId
      },
      attributes: ['questionId', 'value', 'status']
    });

    return results.map(r => ({
      questionId: r.questionId,
      value: r.value,
      status: r.status
    }));
  }

  async getBulkFinYearData(months, questionIds, userId) {
    const results = await PerformanceStatistic.findAll({
      where: {
        monthYear: { [Op.in]: months },
        questionId: { [Op.in]: questionIds },
        userId
      },
      attributes: ['questionId', 'value']
    });

    return results.map(r => ({
      questionId: r.questionId,
      value: r.value
    }));
  }

  async getCurrentCountAllByUser(currentMonthYear, questionIds, userId, subTopicIds) {
    const results = await PerformanceStatistic.findAll({
      where: {
        monthYear: { [Op.like]: `%${currentMonthYear}%` },
        questionId: { [Op.in]: questionIds },
        userId,
        subTopicId: { [Op.in]: subTopicIds }
      },
      attributes: ['questionId', 'subTopicId', 'value', 'status']
    });

    return results.map(r => ({
      questionId: r.questionId,
      subTopicId: r.subTopicId,
      value: r.value,
      status: r.status
    }));
  }

  async getCountByPreviousMonthSub(prevMonthYear, questionIds, userId, subTopicIds) {
    const results = await PerformanceStatistic.findAll({
      where: {
        monthYear: { [Op.like]: `%${prevMonthYear}%` },
        questionId: { [Op.in]: questionIds },
        userId,
        subTopicId: { [Op.in]: subTopicIds }
      },
      attributes: ['questionId', 'subTopicId', 'value']
    });

    return results.map(r => ({
      questionId: r.questionId,
      subTopicId: r.subTopicId,
      value: r.value
    }));
  }

  async getFinYearCountAllByUser(currentYear, questionIds, userId, subTopicIds) {
    const months = this.generateFinancialYearMonths(null, currentYear);
    
    const results = await PerformanceStatistic.findAll({
      where: {
        monthYear: { [Op.in]: months },
        questionId: { [Op.in]: questionIds },
        userId,
        subTopicId: { [Op.in]: subTopicIds }
      },
      attributes: ['questionId', 'subTopicId', 'value']
    });

    return results.map(r => ({
      questionId: r.questionId,
      subTopicId: r.subTopicId,
      value: r.value
    }));
  }

  // User count methods
  async getUserPSCount(userId) {
    const user = await User.findByPk(userId, {
      attributes: ['psCount'] // Assuming ps count field exists
    });
    return user?.psCount?.toString() || '0';
  }

  async getUserSubCount(userId) {
    const user = await User.findByPk(userId, {
      attributes: ['subCount'] // Assuming sub count field exists  
    });
    return user?.subCount?.toString() || '0';
  }

  async getUserCircleCount(userId) {
    const user = await User.findByPk(userId, {
      attributes: ['circleCount'] // Assuming circle count field exists
    });
    return user?.circleCount?.toString() || '0';
  }

  async getUserPSOPCount(userId) {
    const user = await User.findByPk(userId, {
      attributes: ['psopCount'] // Assuming psop count field exists
    });
    return user?.psopCount?.toString() || '0';
  }

  async getReferencedQuestionValue(questionId, userId, monthYear, subTopicId = null) {
    const where = {
      questionId,
      userId,
      monthYear: { [Op.like]: `%${monthYear}%` }
    };

    if (subTopicId) {
      where.subTopicId = subTopicId;
    }

    const result = await PerformanceStatistic.findOne({
      where,
      attributes: ['value']
    });

    return result?.value || '0';
  }

  async getReferencedQuestionValueSub(questionId, userId, monthYear, subTopicId) {
    return this.getReferencedQuestionValue(questionId, userId, monthYear, subTopicId);
  }

  // Success status check
  async checkSuccessStatus(user, currentMonthYear) {
    const totalModules = await Module.count({ where: { active: true } });
    
    const inProgressCount = await PerformanceStatistic.count({
      where: {
        // Assuming district-based logic, adjust based on your user model
        userId: user.id,
        monthYear: { [Op.like]: `%${currentMonthYear}%` },
        status: 'INPROGRESS'
      }
    });

    const successCount = await PerformanceStatistic.count({
      where: {
        userId: user.id,
        monthYear: { [Op.like]: `%${currentMonthYear}%` },
        status: 'SUCCESS'
      }
    });

    const totalQuestions = await Question.count({ where: { active: true } });

    if (inProgressCount === 0 && successCount >= totalQuestions) {
      // Check if all modules are completed
      const completedModules = await PerformanceStatistic.findAll({
        where: {
          userId: user.id,
          monthYear: { [Op.like]: `%${currentMonthYear}%` },
          status: 'SUCCESS'
        },
        attributes: ['moduleId'],
        group: ['moduleId']
      });

      return completedModules.length === totalModules;
    }

    return false;
  }

  // Helper methods
  createQuestionDTO(question) {
    return {
      id: question.id,
      question: question.question,
      type: question.type,
      topicId: question.topicId,
      subTopicId: question.subTopicId,
      defaultVal: question.defaultVal,
      defaultQue: question.defaultQue,
      defaultSub: question.defaultSub,
      formula: question.formula,
      defaultTo: question.defaultTo,
      defaultFormula: question.defaultFormula,
      priority: question.priority,
      isDisabled: false,
      currentCount: '0',
      previousCount: null,
      finYearCount: null
    };
  }

  generateFinancialYearMonths(topic, currentYear) {
    const months = [];
    
    if (topic && topic.startMonth !== undefined && topic.endMonth !== undefined) {
      // Calculate the number of months between start and end
      let startMonth = topic.startMonth;
      let endMonth = topic.endMonth;
      
      // Handle year crossing (e.g., start month 1 (Feb), end month 12 (Jan next year))
      let monthsToGenerate = 12; // Default to 12 months
      
      if (endMonth >= startMonth) {
        monthsToGenerate = endMonth - startMonth + 1;
      } else {
        monthsToGenerate = 12 - startMonth + endMonth + 1;
      }
      
      // Limit to maximum 24 months for safety
      monthsToGenerate = Math.min(monthsToGenerate, 24);
      
      const cal = new Date();
      cal.setDate(1);
      cal.setMonth(startMonth);
      cal.setFullYear(currentYear);
      
      for (let i = 0; i < monthsToGenerate; i++) {
        const monthYear = cal.toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric' 
        }).toUpperCase();
        months.push(monthYear);
        
        // Move to next month
        cal.setMonth(cal.getMonth() + 1);
      }
    } else {
      // Default financial year: April to March
      const currentMonth = new Date().getMonth();
      const startYear = currentMonth >= 3 ? currentYear : currentYear - 1; // April = month 3
      
      for (let i = 0; i < 12; i++) {
        const month = new Date(startYear, 3 + i, 1); // Start from April
        const monthYear = month.toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric' 
        }).toUpperCase();
        months.push(monthYear);
      }
    }
    
    return months;
  }

  shouldIncludeInTotal(question, value) {
    return (
      question.type !== 'Text' &&
      question.type !== 'Date' &&
      value !== 'Yes' &&
      value !== 'No' &&
      !value?.includes('/') &&
      value &&
      value.length > 0 &&
      !value.includes('NaN')
    );
  }

  shouldShowPrevious(question, topic) {
    if (!topic.isShowPrevious) return false;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    
    if (topic.isStartJan && currentMonth - 1 !== topic.startMonth) {
      return true;
    } else if (!topic.isStartJan) {
      return true;
    }
    
    return false;
  }

  shouldShowCummulative(question) {
    return question.type !== 'Text' && question.type !== 'Date';
  }

  parseNumericValue(value) {
    if (!value || value === 'Yes' || value === 'No' || value.includes('/')) {
      return 0;
    }
    
    const numValue = parseFloat(value);
    return isNaN(numValue) ? 0 : numValue;
  }

  hasFormula(question) {
    return question.formula || 
           question.defaultFormula || 
           (question.defaultVal !== 'NONE' && question.defaultTo);
  }

  hasFormulaForCombination(question, subTopic) {
    return (
      question.formula?.includes(`=${question.id}_${subTopic.id}`) ||
      (question.defaultVal !== 'NONE' && 
       question.defaultTo === `${question.id}_${subTopic.id}`) ||
      question.defaultFormula?.includes(`=${question.id}_${subTopic.id}`)
    );
  }

  isEndOfMonthQuestion(questionText) {
    return (
      questionText.includes('end of the month') ||
      questionText.includes('end month') ||
      questionText.includes('end of month') ||
      questionText.includes('ending of the month')
    );
  }

  isBeginningOfMonthQuestion(questionText) {
    return (
      questionText.includes('beginning of the month') ||
      questionText.includes('beginning month') ||
      questionText.includes('beginning of month') ||
      questionText.includes('beginning month')
    );
  }


  /**
   * Get previous month data for questions
   */
  async getPreviousMonthData(prevMonthYear, questionIds, userId) {
    const data = await PerformanceStatistic.findAll({
      attributes: ['questionId', 'value', 'status'],
      where: {
        monthYear: { [Op.like]: `%${prevMonthYear}%` },
        questionId: { [Op.in]: questionIds },
        userId,
        active: true
      },
      raw: true
    });

    return data.reduce((acc, item) => {
      acc[item.questionId] = {
        value: item.value,
        status: item.status
      };
      return acc;
    }, {});
  }

  /**
   * Get current month data for questions
   */
  async getCurrentMonthData(currentMonthYear, questionIds, userId) {
    const data = await PerformanceStatistic.findAll({
      attributes: ['questionId', 'value', 'status'],
      where: {
        monthYear: { [Op.like]: `%${currentMonthYear}%` },
        questionId: { [Op.in]: questionIds },
        userId,
        active: true
      },
      raw: true
    });

    return data.reduce((acc, item) => {
      acc[item.questionId] = {
        value: item.value,
        status: item.status
      };
      return acc;
    }, {});
  }



// async getNextTopic(moduleId, topicId, userId) {
//   try {
//     console.log(`getNextTopic called: moduleId=${moduleId}, topicId=${topicId}, userId=${userId}`);
    
//     // Convert moduleId to number
//     const moduleIdNum = parseInt(moduleId);
//     const topicIdNum = parseInt(topicId);
    
//     let currentModule;
    
//     // Determine if moduleId is a priority index or module ID
//     if (moduleIdNum === 0) {
//       // Priority index mode: Find first module
//       currentModule = await Module.findOne({
//         where: { active: true },
//         order: [['priority', 'ASC']]
//       });
//     } else if (moduleIdNum < 10) {
//       // Likely a priority number (1, 2, 3, ...)
//       currentModule = await Module.findOne({
//         where: { 
//           active: true,
//           priority: moduleIdNum
//         }
//       });
//     } else {
//       // Likely a module ID (18, 19, ...)
//       currentModule = await Module.findByPk(moduleIdNum, {
//         where: { active: true }
//       });
//     }
    
//     if (!currentModule) {
//       console.log(`Module not found for moduleId=${moduleId}`);
//       return {
//         moduleId: null,
//         topicId: null,
//         isSameModule: false,
//         hasNext: false,
//         message: "Module not found"
//       };
//     }

//     console.log(`Current module: ID=${currentModule.id}, Name=${currentModule.moduleName}, Priority=${currentModule.priority}`);

//     // Get user
//     const user = await User.findByPk(userId);
//     if (!user || !user.roleId) {
//       throw new Error('User or role not found');
//     }
    
//     const userRoleId = user.roleId;

//     // Get role-allowed topics
//     const roleTopics = await RoleTopic.findAll({
//       where: { 
//         roleId: userRoleId,
//         active: true
//       }
//     });

//     const allowedTopicIds = roleTopics.map(rt => rt.topicId);
//     console.log(`Allowed topic IDs for role ${userRoleId}:`, allowedTopicIds);


    
//     const moduleIdNum = parseInt(moduleId);

//     if (moduleIdNum === 0) {
//       // Legacy mode: Find first module by priority
//       currentModule = await Module.findOne({
//         where: { active: true },
//         order: [['priority', 'ASC']]
//       });
//     } else {
//       // Try to find by ID first
//       currentModule = await Module.findByPk(moduleIdNum, {
//         where: { active: true }
//       });
// // If not found by ID, try to find by priority
//       if (!currentModule) {
//         currentModule = await Module.findOne({
//           where: { 
//             active: true,
//             priority: moduleIdNum 
//           }
//         });
//       }
//     }

//      if (!currentModule) {
//       return {
//         moduleId: null,
//         topicId: null,
//         isSameModule: false,
//         hasNext: false,
//         message: "Module not found"
//       };
//     }

//     console.log(`Current module: ID=${currentModule.id}, Name=${currentModule.moduleName}, Priority=${currentModule.priority}`);



//     // Get all accessible topics for current module
//     const allModuleTopics = await Topic.findAll({
//       where: { 
//         moduleId: currentModule.id,
//         active: true,
//         id: { [Op.in]: allowedTopicIds }
//       },
//       order: [['priority', 'ASC']]
//     });

//     if (!allModuleTopics.length) {
//       console.log('No accessible topics found for this module');
//       return {
//         moduleId: currentModule.id,
//         topicId: null,
//         isSameModule: false,
//         hasNext: false,
//         message: "No accessible topics in this module"
//       };
//     }

//     console.log(`Found ${allModuleTopics.length} accessible topics in module ${currentModule.id}`);

//     // Find current topic position
//     const currentTopic = allModuleTopics.find(t => t.id === topicIdNum);
    
//     if (!currentTopic) {
//       // Current topic not in accessible list, return first accessible topic
//       const firstTopic = allModuleTopics[0];
//       console.log(`Topic ${topicId} not in accessible list, returning first topic: ${firstTopic.id}`);
//       return {
//         moduleId: currentModule.id,
//         topicId: firstTopic.id,
//         isSameModule: true,
//         hasNext: allModuleTopics.length > 1,
//         message: "Returning first accessible topic"
//       };
//     }

//     const currentIndex = allModuleTopics.findIndex(t => t.id === topicIdNum);
    
//     // Check if there's a next accessible topic in same module
//     if (currentIndex < allModuleTopics.length - 1) {
//       const nextTopic = allModuleTopics[currentIndex + 1];
//       console.log(`Next topic in same module: ${nextTopic.id}`);
//       return {
//         moduleId: currentModule.id,
//         topicId: nextTopic.id,
//         isSameModule: true,
//         hasNext: currentIndex < allModuleTopics.length - 2, // Check if there's another after this
//         message: "Next topic found"
//       };
//     }

//     // No next topic in current module, find next module
//     console.log('No next topic in current module, looking for next module...');
//     const nextModuleInfo = await this.findNextAccessibleModule(currentModule.priority, userRoleId);
    
//     if (nextModuleInfo) {
//       return {
//         ...nextModuleInfo,
//         hasNext: true,
//         message: "Next topic in next module"
//       };
//     }

//     // No next topic at all
//     console.log('No next topic available');
//     return {
//       moduleId: currentModule.id,
//       topicId: null,
//       isSameModule: false,
//       hasNext: false,
//       message: "No next topic available"
//     };

//   } catch (error) {
//     console.error('Error in getNextTopic:', error);
//     throw error;
//   }
// }

async getNextTopic(moduleId, topicId, userId) {
  try {
    console.log(`getNextTopic called: moduleId=${moduleId}, topicId=${topicId}, userId=${userId}`);
    
    // Get user
    const user = await User.findByPk(userId);
    if (!user || !user.roleId) {
      throw new Error('User or role not found');
    }
    
    const userRoleId = user.roleId;

    // Get role-allowed topics
    const roleTopics = await RoleTopic.findAll({
      where: { 
        roleId: userRoleId,
        active: true
      }
    });

    const allowedTopicIds = roleTopics.map(rt => rt.topicId);

    // Get current module
    let currentModule;
    const moduleIdNum = parseInt(moduleId);
    
    if (moduleIdNum === 0) {
      // Legacy mode: Find first module by priority
      currentModule = await Module.findOne({
        where: { active: true },
        order: [['priority', 'ASC']]
      });
    } else {
      // Try to find by ID first
      currentModule = await Module.findByPk(moduleIdNum, {
        where: { active: true }
      });
      
      // If not found by ID, try to find by priority
      if (!currentModule) {
        currentModule = await Module.findOne({
          where: { 
            active: true,
            priority: moduleIdNum 
          }
        });
      }
    }

    if (!currentModule) {
      return {
        moduleId: null,
        topicId: null,
        isSameModule: false,
        hasNext: false,
        message: "Module not found"
      };
    }

    console.log(`Current module: ID=${currentModule.id}, Name=${currentModule.moduleName}, Priority=${currentModule.priority}`);

    // Get all accessible topics for current module
    const allModuleTopics = await Topic.findAll({
      where: { 
        moduleId: currentModule.id,
        active: true,
        id: { [Op.in]: allowedTopicIds }
      },
      order: [['priority', 'ASC']]
    });

    if (!allModuleTopics.length) {
      console.log('No accessible topics found for this module');
      // Try to find next module
      return await this.findFirstTopicInNextModule(currentModule.priority, userRoleId);
    }

    console.log(`Found ${allModuleTopics.length} accessible topics in module ${currentModule.id}`);

    // Find current topic position
    const currentTopic = allModuleTopics.find(t => t.id === parseInt(topicId));
    
    if (!currentTopic) {
      // Current topic not in accessible list, return first accessible topic
      const firstTopic = allModuleTopics[0];
      console.log(`Topic ${topicId} not in accessible list, returning first topic: ${firstTopic.id}`);
      return {
        moduleId: currentModule.id,
        topicId: firstTopic.id,
        isSameModule: true,
        hasNext: allModuleTopics.length > 1,
        message: "Returning first accessible topic"
      };
    }

    const currentIndex = allModuleTopics.findIndex(t => t.id === parseInt(topicId));
    
    // Check if there's a next accessible topic in same module
    if (currentIndex < allModuleTopics.length - 1) {
      const nextTopic = allModuleTopics[currentIndex + 1];
      console.log(`Next topic in same module: ${nextTopic.id}`);
      return {
        moduleId: currentModule.id,
        topicId: nextTopic.id,
        isSameModule: nextTopic.moduleId === moduleId,
        hasNext: currentIndex < allModuleTopics.length - 2,
        message: "Next topic found"
      };
    }

    // No next topic in current module, find next module
    console.log('No next topic in current module, looking for next module...');
    return await this.findFirstTopicInNextModule(currentModule.priority, userRoleId);

  } catch (error) {
    console.error('Error in getNextTopic:', error);
    throw error;
  }
}


async findFirstTopicInNextModule(currentModulePriority, userRoleId) {
  try {
    console.log(`Finding first topic in next module after priority ${currentModulePriority}`);
    
    // Get all modules sorted by priority
    const allModules = await Module.findAll({
      where: { active: true },
      order: [['priority', 'ASC']]
    });

    // Find current module index
    const currentIndex = allModules.findIndex(m => m.priority === currentModulePriority);
    
    if (currentIndex === -1 || currentIndex === allModules.length - 1) {
      console.log('No next module available');
      return {
        moduleId: null,
        topicId: null,
        isSameModule: false,
        hasNext: false,
        message: "No next module available"
      };
    }

    // Get role-allowed topics for the user
    const roleTopics = await RoleTopic.findAll({
      where: { 
        roleId: userRoleId,
        active: true
      }
    });

    const allowedTopicIds = roleTopics.map(rt => rt.topicId);

    // Look for the next module that has accessible topics
    for (let i = currentIndex + 1; i < allModules.length; i++) {
      const nextModule = allModules[i];
      console.log(`Checking next module: ID=${nextModule.id}, Name=${nextModule.moduleName}, Priority=${nextModule.priority}`);

      // Get accessible topics for this module
      const accessibleTopics = await Topic.findAll({
        where: { 
          moduleId: nextModule.id,
          active: true,
          id: { [Op.in]: allowedTopicIds }
        },
        order: [['priority', 'ASC']],
        limit: 1  // Only need the first topic
      });

      if (accessibleTopics.length > 0) {
        const firstTopic = accessibleTopics[0];
        console.log(`Found first accessible topic in next module: ${firstTopic.id} - "${firstTopic.topicName}"`);
        
        return {
          moduleId: nextModule.id,
          topicId: firstTopic.id,
          isSameModule: false,
          hasNext: true,
          message: "First topic in next module"
        };
      } else {
        console.log(`Module ${nextModule.id} has no accessible topics, skipping to next module`);
      }
    }

    console.log('No accessible topics found in any next module');
    return {
      moduleId: null,
      topicId: null,
      isSameModule: false,
      hasNext: false,
      message: "No accessible topics in next modules"
    };

  } catch (error) {
    console.error('Error finding first topic in next module:', error);
    throw error;
  }
}



// async getPreviousTopic(moduleId, topicId, userId) {
//   try {
//     // 1. Get user and their role
//     const user = await User.findByPk(userId, {
//       include: [{ model: Role, as: 'role' }]
//     });
    
//     if (!user || !user.roleId) {
//       throw new Error('User or role not found');
//     }
    
//     const userRoleId = user.roleId;
//     console.log(`User roleId: ${userRoleId}`);

//     // 2. Get current module
//     // const currentModule = await Module.findByPk(moduleId, {
//     //   where: { active: true }
//     // });

//     let currentModule;
    
//     if (moduleId == 0) {
//       // Legacy mode: Find by priority (priority = 1)
//       currentModule = await Module.findOne({
//         where: { 
//           active: true,
//           priority: 1 
//         }
//       });
//     } else {
//       // Modern mode: Find by actual module ID
//       currentModule = await Module.findByPk(moduleId, {
//         where: { active: true }
//       });
//     }

//     if (!currentModule) {
//       throw new Error(`Module ${moduleId} not found`);
//     }

//      console.log(`Current module: ID=${currentModule.id}, Name=${currentModule.moduleName}, Priority=${currentModule.priority}`);


//       // 3. Get role-allowed topics
//     const roleTopics = await RoleTopic.findAll({
//       where: { 
//         roleId: userRoleId,
//         active: true
//       }
//     });

//     const allowedTopicIds = roleTopics.map(rt => rt.topicId);
//     console.log(`Allowed topic IDs for role ${userRoleId}:`, allowedTopicIds);



//     // 3. Get ALL topics for current module
//     const allModuleTopics = await Topic.findAll({
//       where: { 
//         moduleId: currentModule.id,
//         active: true,
//          id: { [Op.in]: allowedTopicIds }
//       },
//       order: [['priority', 'ASC']]
//     });
// if (!allModuleTopics.length) {
//       console.log('No accessible topics found for this module');
//       return null;
//     }

//     console.log(`Found ${allModuleTopics.length} accessible topics in module ${currentModule.id}`);



//     const currentTopic = allModuleTopics.find(t => t.id === parseInt(topicId));
    
//     if (!currentTopic) {
//       // Current topic not in accessible list, return last accessible topic
//       const lastTopic = allModuleTopics[allModuleTopics.length - 1];
//       console.log(`Topic ${topicId} not in accessible list, returning last topic: ${lastTopic.id}`);
//       return {
//         moduleId: currentModule.id,
//         topicId: lastTopic.id,
//         isSameModule: true
//       };
//     }

//      const currentIndex = allModuleTopics.findIndex(t => t.id === parseInt(topicId));
    
//     // 6. Check if there's a previous accessible topic in same module
//     if (currentIndex > 0) {
//       const prevTopic = allModuleTopics[currentIndex - 1];
//       console.log(`Previous topic in same module: ${prevTopic.id}`);
//       return {
//         moduleId: currentModule.id,
//         topicId: prevTopic.id,
//         isSameModule: true
//       };
//     }

//     // 7. No previous topic in current module, find previous module
//     console.log('No previous topic in current module, looking for previous module...');
//     return await this.findPreviousAccessibleModule(currentModule.priority, userRoleId);

//   } catch (error) {
//     console.error('Error in getPreviousTopic:', error);
//     throw error;
//   }
// }


async getPreviousTopic(moduleId, topicId, userId) {
  try {
    console.log(`getPreviousTopic called: moduleId=${moduleId}, topicId=${topicId}, userId=${userId}`);
    
    // 1. Get user and their role
    const user = await User.findByPk(userId, {
      include: [{ model: Role, as: 'role' }]
    });
    
    if (!user || !user.roleId) {
      throw new Error('User or role not found');
    }
    
    const userRoleId = user.roleId;
    console.log(`User roleId: ${userRoleId}`);

    // 2. Get current module
    let currentModule;
    const moduleIdNum = parseInt(moduleId);
    
    if (moduleIdNum === 0) {
      // Legacy mode: Find by priority (priority = 1)
      currentModule = await Module.findOne({
        where: { 
          active: true,
          priority: 1 
        }
      });
    } else {
      // Modern mode: Find by actual module ID
      currentModule = await Module.findByPk(moduleIdNum, {
        where: { active: true }
      });
      
      // If not found by ID, try to find by priority
      if (!currentModule) {
        currentModule = await Module.findOne({
          where: { 
            active: true,
            priority: moduleIdNum 
          }
        });
      }
    }

    if (!currentModule) {
      return {
        moduleId: null,
        topicId: null,
        isSameModule: false,
        hasPrevious: false,
        message: "Module not found"
      };
    }

    console.log(`Current module: ID=${currentModule.id}, Name=${currentModule.moduleName}, Priority=${currentModule.priority}`);

    // 3. Get role-allowed topics
    const roleTopics = await RoleTopic.findAll({
      where: { 
        roleId: userRoleId,
        active: true
      }
    });

    const allowedTopicIds = roleTopics.map(rt => rt.topicId);
    console.log(`Allowed topic IDs for role ${userRoleId}:`, allowedTopicIds);

    // 4. Get ALL topics for current module
    const allModuleTopics = await Topic.findAll({
      where: { 
        moduleId: currentModule.id,
        active: true,
        id: { [Op.in]: allowedTopicIds }
      },
      order: [['priority', 'ASC']]
    });

    if (!allModuleTopics.length) {
      console.log('No accessible topics found for this module');
      // Try to find previous module
      return await this.findLastTopicInPreviousModule(currentModule.priority, userRoleId);
    }

    console.log(`Found ${allModuleTopics.length} accessible topics in module ${currentModule.id}`);

    // 5. Find current topic position
    const currentTopic = allModuleTopics.find(t => t.id === parseInt(topicId));
    
    if (!currentTopic) {
      // Current topic not in accessible list, return last accessible topic
      const lastTopic = allModuleTopics[allModuleTopics.length - 1];
      console.log(`Topic ${topicId} not in accessible list, returning last topic: ${lastTopic.id}`);
      return {
        moduleId: currentModule.id,
        topicId: lastTopic.id,
        isSameModule: true,
        hasPrevious: allModuleTopics.length > 1,
        message: "Returning last accessible topic"
      };
    }

    const currentIndex = allModuleTopics.findIndex(t => t.id === parseInt(topicId));
    
    // 6. Check if there's a previous accessible topic in same module
    if (currentIndex > 0) {
      const prevTopic = allModuleTopics[currentIndex - 1];
      console.log(`Previous topic in same module: ${prevTopic.id}`);
      return {
        moduleId: currentModule.id,
        topicId: prevTopic.id,
        isSameModule: true,
        hasPrevious: currentIndex > 1, // Check if there's another before this
        message: "Previous topic found"
      };
    }

    // 7. No previous topic in current module, find previous module
    console.log('No previous topic in current module, looking for previous module...');
    return await this.findLastTopicInPreviousModule(currentModule.priority, userRoleId);

  } catch (error) {
    console.error('Error in getPreviousTopic:', error);
    throw error;
  }
}

// Helper: Find last topic in previous module
async findLastTopicInPreviousModule(currentModulePriority, userRoleId) {
  try {
    console.log(`Finding last topic in previous module before priority ${currentModulePriority}`);
    
    // Get all modules sorted by priority
    const allModules = await Module.findAll({
      where: { active: true },
      order: [['priority', 'ASC']]
    });

    // Find current module index
    const currentIndex = allModules.findIndex(m => m.priority === currentModulePriority);
    
    if (currentIndex <= 0) {
      console.log('No previous module available');
      return {
        moduleId: null,
        topicId: null,
        isSameModule: false,
        hasPrevious: false,
        message: "No previous module available"
      };
    }

    // Get role-allowed topics for the user
    const roleTopics = await RoleTopic.findAll({
      where: { 
        roleId: userRoleId,
        active: true
      }
    });

    const allowedTopicIds = roleTopics.map(rt => rt.topicId);

    // Look for the previous module that has accessible topics
    for (let i = currentIndex - 1; i >= 0; i--) {
      const prevModule = allModules[i];
      console.log(`Checking previous module: ID=${prevModule.id}, Name=${prevModule.moduleName}, Priority=${prevModule.priority}`);

      // Get all accessible topics for this module
      const accessibleTopics = await Topic.findAll({
        where: { 
          moduleId: prevModule.id,
          active: true,
          id: { [Op.in]: allowedTopicIds }
        },
        order: [['priority', 'ASC']]
      });

      if (accessibleTopics.length > 0) {
        // Get the last topic in this module
        const lastTopic = accessibleTopics[accessibleTopics.length - 1];
        console.log(`Found last accessible topic in previous module: ${lastTopic.id} - "${lastTopic.topicName}"`);
        
        return {
          moduleId: prevModule.id,
          topicId: lastTopic.id,
          isSameModule: false,
          hasPrevious: accessibleTopics.length > 1,
          message: "Last topic in previous module"
        };
      } else {
        console.log(`Module ${prevModule.id} has no accessible topics, checking previous module...`);
      }
    }

    console.log('No accessible topics found in any previous module');
    return {
      moduleId: null,
      topicId: null,
      isSameModule: false,
      hasPrevious: false,
      message: "No accessible topics in previous modules"
    };

  } catch (error) {
    console.error('Error finding last topic in previous module:', error);
    throw error;
  }
}

async findLastTopicInPreviousModule(currentModulePriority, userRoleId) {
  try {
    console.log(`Finding last topic in previous module before priority ${currentModulePriority}`);
    
    // Get all modules sorted by priority
    const allModules = await Module.findAll({
      where: { active: true },
      order: [['priority', 'ASC']]
    });

    // Find current module index
    const currentIndex = allModules.findIndex(m => m.priority === currentModulePriority);
    
    if (currentIndex <= 0) {
      console.log('No previous module available');
      return null;
    }

    // Get role-allowed topics for the user
    const roleTopics = await RoleTopic.findAll({
      where: { 
        roleId: userRoleId,
        active: true
      }
    });

    const allowedTopicIds = roleTopics.map(rt => rt.topicId);

    // Look for the previous module that has accessible topics
    for (let i = currentIndex - 1; i >= 0; i--) {
      const prevModule = allModules[i];
      console.log(`Checking previous module: ID=${prevModule.id}, Name=${prevModule.moduleName}, Priority=${prevModule.priority}`);

      // Get accessible topics for this module
      const accessibleTopics = await Topic.findAll({
        where: { 
          moduleId: prevModule.id,
          active: true,
          id: { [Op.in]: allowedTopicIds }
        },
        order: [['priority', 'DESC']],  // Get the last topic
        limit: 1
      });

      if (accessibleTopics.length > 0) {
        const lastTopic = accessibleTopics[0];
        console.log(`Found last accessible topic in previous module: ${lastTopic.id} - "${lastTopic.topicName}"`);
        
        return {
          moduleId: prevModule.id,
          topicId: lastTopic.id,
          isSameModule: false,
          message: "Last topic in previous module"
        };
      } else {
        console.log(`Module ${prevModule.id} has no accessible topics, skipping to previous module`);
      }
    }

    console.log('No accessible topics found in any previous module');
    return null;

  } catch (error) {
    console.error('Error finding last topic in previous module:', error);
    throw error;
  }
}
    // 4. Get role-allowed topics for this module
    // const roleTopics = await RoleTopic.findAll({
    //   where: { 
    //     roleId: userRoleId,
    //     active: true
    //   },
    //   include: [{
    //     model: Topic,
    //     where: { moduleId: currentModule.id, active: true }
    //   }]
    // });

    // const allowedTopicIds = roleTopics.map(rt => rt.topicId);

    // 5. Filter topics that user has access to
    // const accessibleTopics = allModuleTopics.filter(topic => 
    //   allowedTopicIds.includes(topic.id)
    // );

    // 6. Find current topic position in accessible topics
    // const currentIndex = accessibleTopics.findIndex(t => t.id === topicId);
    
    // if (currentIndex === -1) {
    //   // Current topic not accessible, find last accessible topic in this module
    //   if (accessibleTopics.length > 0) {
    //     const lastTopic = accessibleTopics[accessibleTopics.length - 1];
    //     return {
    //       moduleId: currentModule.id,
    //       topicId: lastTopic.id,
    //       isSameModule: true
    //     };
    //   } else {
    //     // No accessible topics in this module, find previous module
    //     return await this.findPreviousAccessibleModule(currentModule.id, userRoleId);
    //   }
    // }

    // // 7. Check if there's a previous accessible topic in same module
    // if (currentIndex > 0) {
    //   const prevTopic = accessibleTopics[currentIndex - 1];
    //   return {
    //     moduleId: currentModule.id,
    //     topicId: prevTopic.id,
    //     isSameModule: true
    //   };
    // }

//     // 8. No previous topic in current module, find previous module
//     return await this.findPreviousAccessibleModule(currentModule.id, userRoleId);

//   } catch (error) {
//     logger.error('Error getting previous topic:', error);
//     throw error;
//   }
// }

// Helper: Find next accessible module
async findNextAccessibleModule(currentModuleId, userRoleId) {
  // 1. Get all modules sorted by priority
  const allModules = await Module.findAll({
    where: { active: true },
    order: [['priority', 'ASC']]
  });

  // 2. Find current module position
  const currentIndex = allModules.findIndex(m => m.id === currentModuleId);
  
  if (currentIndex === -1 || currentIndex === allModules.length - 1) {
    return null; // No next module or current module not found
  }

  // 3. Look for next module that has accessible topics for this role
  for (let i = currentIndex + 1; i < allModules.length; i++) {
    const nextModule = allModules[i];
    
    // Check if this role has access to any topics in this module
    const roleTopics = await RoleTopic.findAll({
      where: { 
        roleId: userRoleId,
        active: true
      },
      include: [{
        model: Topic,
        where: { 
          moduleId: nextModule.id,
          active: true
        }
      }]
    });

    if (roleTopics.length > 0) {
      // Get the first accessible topic in this module (by priority)
      const accessibleTopics = await Topic.findAll({
        where: { 
          moduleId: nextModule.id,
          active: true,
          id: { [Op.in]: roleTopics.map(rt => rt.topicId) }
        },
        order: [['priority', 'ASC']],
        limit: 1
      });

      if (accessibleTopics.length > 0) {
        return {
          moduleId: nextModule.id,
          topicId: accessibleTopics[0].id,
          isSameModule: false
        };
      }
    }
  }

  return null; // No accessible next module found
}

// Helper: Find previous accessible module
async findPreviousAccessibleModule(currentModuleId, userRoleId) {
  // 1. Get all modules sorted by priority
  const allModules = await Module.findAll({
    where: { active: true },
    order: [['priority', 'ASC']]
  });

  // 2. Find current module position
  const currentIndex = allModules.findIndex(m => m.id === currentModuleId);
  
  if (currentIndex <= 0) {
    return null; // No previous module
  }

  // 3. Look for previous module that has accessible topics for this role
  for (let i = currentIndex - 1; i >= 0; i--) {
    const prevModule = allModules[i];
    
    // Check if this role has access to any topics in this module
    const roleTopics = await RoleTopic.findAll({
      where: { 
        roleId: userRoleId,
        active: true
      },
      include: [{
        model: Topic,
        where: { 
          moduleId: prevModule.id,
          active: true
        }
      }]
    });

    if (roleTopics.length > 0) {
      // Get the last accessible topic in this module (by priority)
      const accessibleTopics = await Topic.findAll({
        where: { 
          moduleId: prevModule.id,
          active: true,
          id: { [Op.in]: roleTopics.map(rt => rt.topicId) }
        },
        order: [['priority', 'DESC']], // Get last topic
        limit: 1
      });

      if (accessibleTopics.length > 0) {
        return {
          moduleId: prevModule.id,
          topicId: accessibleTopics[0].id,
          isSameModule: false
        };
      }
    }
  }

  return null; // No accessible previous module found
}

// Get navigation info (for UI display)
// async getNavigationInfo(moduleId, topicId, userId) {
//   try {
//     const [nextInfo, prevInfo, user] = await Promise.all([
//       this.getNextTopic(moduleId, topicId, userId),
//       this.getPreviousTopic(moduleId, topicId, userId),
//       User.findByPk(userId, { include: [{ model: Role, as: 'role' }] })
//     ]);

//     // Get current position info
//     const currentModule = await Module.findByPk(moduleId);
//     const currentTopic = await Topic.findByPk(topicId);
    
//     // Get accessible topics count for current module
//     const roleTopics = await RoleTopic.findAll({
//       where: { 
//         roleId: user.roleId,
//         active: true
//       },
//       include: [{
//         model: Topic,
//         where: { moduleId: moduleId, active: true }
//       }]
//     });

//     const accessibleTopics = roleTopics.map(rt => rt.Topic);
//     const sortedTopics = accessibleTopics.sort((a, b) => a.priority - b.priority);
//     const currentIndex = sortedTopics.findIndex(t => t.id === topicId);
    
//     return {
//       next: nextInfo,
//       prev: prevInfo,
//       currentPosition: {
//         moduleName: currentModule?.moduleName || 'Unknown',
//         topicName: currentTopic?.topicName || 'Unknown',
//         position: currentIndex !== -1 ? `${currentIndex + 1} of ${sortedTopics.length}` : 'Unknown',
//         modulePriority: currentModule?.priority || 0,
//         topicPriority: currentTopic?.priority || 0
//       },
//       hasNext: !!nextInfo,
//       hasPrevious: !!prevInfo
//     };

//   } catch (error) {
//     logger.error('Error getting navigation info:', error);
//     throw error;
//   }
// }


async getNavigationInfo(moduleId, topicId, userId) {
  try {
    console.log(`getNavigationInfo called: moduleId=${moduleId}, topicId=${topicId}, userId=${userId}`);
    
    // Get next and previous topic info
    const [nextInfo, prevInfo] = await Promise.all([
      this.getNextTopic(moduleId, topicId, userId),
      this.getPreviousTopic(moduleId, topicId, userId)
    ]);

    // Get current module info - FIXED LOGIC
    let currentModule;
    
    // Convert moduleId to number for comparison
    const moduleIdNum = parseInt(moduleId);
    
    if (moduleIdNum === 0) {
      // Legacy mode: Find first module by priority
      currentModule = await Module.findOne({
        where: { active: true },
        order: [['priority', 'ASC']]
      });
    } else {
      // Check if it's a module ID or priority
      // Try to find by ID first
      currentModule = await Module.findByPk(moduleIdNum, {
        where: { active: true }
      });
      
      // If not found by ID, try to find by priority
      if (!currentModule) {
        currentModule = await Module.findOne({
          where: { 
            active: true,
            priority: moduleIdNum 
          }
        });
      }
    }

    // Get current topic
    const currentTopic = await Topic.findByPk(topicId);
    
    if (!currentModule || !currentTopic) {
      return {
        next: nextInfo,
        prev: prevInfo,
        currentPosition: {
          moduleName: 'Unknown',
          topicName: 'Unknown',
          position: 'Unknown',
          modulePriority: 0,
          topicPriority: 0
        },
        hasNext: !!nextInfo,
        hasPrevious: !!prevInfo
      };
    }

    console.log(`Current module: ID=${currentModule.id}, Name=${currentModule.moduleName}, Priority=${currentModule.priority}`);

    // Get user's role
    const user = await User.findByPk(userId);
    if (!user || !user.roleId) {
      throw new Error('User or role not found');
    }
    
    // SIMPLE APPROACH WITHOUT EAGER LOADING
    // Get allowed topic IDs from RoleTopic - NO INCLUDE CLAUSE
    const roleTopics = await RoleTopic.findAll({
      where: { 
        roleId: user.roleId,
        active: true
      },
      attributes: ['topicId'], // Just get the topic IDs
      raw: true // Get plain objects, not model instances
    });

    const allowedTopicIds = roleTopics.map(rt => rt.topicId);
    console.log(`Allowed topic IDs for role ${user.roleId}:`, allowedTopicIds);
    
    // Get accessible topics for current module
    const accessibleTopics = await Topic.findAll({
      where: { 
        moduleId: currentModule.id,
        active: true,
        id: { [Op.in]: allowedTopicIds }
      },
      order: [['priority', 'ASC']]
    });

    console.log(`Found ${accessibleTopics.length} accessible topics in module ${currentModule.id}`);

    const sortedTopics = accessibleTopics.sort((a, b) => a.priority - b.priority);
    const currentIndex = sortedTopics.findIndex(t => t.id === parseInt(topicId));
    
    console.log(`Navigation info: currentIndex=${currentIndex}, totalTopics=${sortedTopics.length}`);
    
    return {
      next: nextInfo,
      prev: prevInfo,
      currentPosition: {
        moduleName: currentModule.moduleName || 'Unknown',
        topicName: currentTopic.topicName || 'Unknown',
        position: currentIndex !== -1 ? `${currentIndex + 1} of ${sortedTopics.length}` : 'Unknown',
        modulePriority: currentModule.priority || 0,
        topicPriority: currentTopic.priority || 0
      },
      hasNext: !!nextInfo,
      hasPrevious: !!prevInfo
    };

  } catch (error) {
    console.error('Error getting navigation info:', error);
    throw error;
  }
}


  /**
   * Get financial year data for questions
   */
  async getFinancialYearData(currentYear, questionIds, userId) {
    // Create financial year months array (April to March)
    const months = [];
    const startYear = currentYear - 1;
    
    // Add Apr-Dec of previous year
    for (let month = 3; month < 12; month++) {
      const date = new Date(startYear, month);
      months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase());
    }
    
    // Add Jan-Mar of current year
    for (let month = 0; month < 3; month++) {
      const date = new Date(currentYear, month);
      months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase());
    }

    const data = await PerformanceStatistic.findAll({
      attributes: [
        'questionId',
        [Sequelize.fn('SUM', Sequelize.col('value')), 'totalValue']
      ],
      where: {
        monthYear: { [Op.in]: months },
        questionId: { [Op.in]: questionIds },
        userId,
        active: true,
        status: 'SUCCESS'
      },
      group: ['questionId'],
      raw: true
    });

    return data.reduce((acc, item) => {
      acc[item.questionId] = item.totalValue;
      return acc;
    }, {});
  }

  /**
   * Process questions with data population
   */
  async processQuestions(questions, prevData, currentData, finYearData, topic, userId, currentMonthYear) {
    const processedQuestions = [];
    let id = 1;
    let tId = 1;
    let oldSubTopicId = 0;

    for (const question of questions) {
      // Handle subtopic grouping
      if (question.subTopicId && question.subTopicId !== oldSubTopicId) {
        oldSubTopicId = question.subTopicId;
        tId = 1;
        id++;
      }

      const prevValue = prevData[question.id]?.value || null;
      const currentValue = currentData[question.id]?.value || null;
      const currentStatus = currentData[question.id]?.status || null;
      const finYearValue = finYearData[question.id] || null;

      // Calculate current count based on default value logic
      let calculatedCurrentCount = '0';
      
      if (question.defaultVal === 'PREVIOUS' && prevValue) {
        calculatedCurrentCount = prevValue;
      } else if (question.defaultVal === 'QUESTION' && question.defaultQue) {
        const refValue = prevData[question.defaultQue]?.value || '0';
        calculatedCurrentCount = refValue;
      } else if (currentValue) {
        calculatedCurrentCount = currentValue;
      } else if (question.defaultVal === 'PS') {
        // Get police station count for user
        calculatedCurrentCount = await this.getPSCountForUser(userId);
      } else if (question.defaultVal === 'SUB') {
        // Get subdivision count for user
        calculatedCurrentCount = await this.getSubCountForUser(userId);
      } else if (question.defaultVal === 'CIRCLE') {
        // Get circle count for user
        calculatedCurrentCount = await this.getCircleCountForUser(userId);
      }

      // Get subtopic name if exists
      let subtopicName = null;
      if (question.subTopicId) {
        const subTopic = await SubTopic.findByPk(question.subTopicId);
        subtopicName = subTopic?.subTopicName || null;
      }

      // Determine if field should be disabled
      const isDisabled = currentStatus === 'SUCCESS' || question.defaultVal !== 'NONE';

      processedQuestions.push({
        id: question.id,
        tId: tId++,
        question: question.question,
        type: question.type,
        topicId: question.topicId,
        subTopicId: question.subTopicId,
        subtopicName,
        moduleId: topic.moduleId,
        formula: question.formula,
        defaultVal: question.defaultVal,
        previousCount: prevValue,
        currentCount: calculatedCurrentCount,
        finYearCount: finYearValue,
        isDisabled,
        isPrevious: !!prevValue,
        isCumulative: !!finYearValue,
        checkID: this.generateCheckID(question.question, id)
      });
    }

    return processedQuestions;
  }

  /**
   * Generate check ID based on question content for formula calculations
   */
  generateCheckID(questionText, id) {
    const text = questionText.toLowerCase();
    
    if (text.includes('beginning of the month') || text.includes('beginning month')) {
      return `${id}1`;
    } else if (text.includes('reported during the month')) {
      return `${id}2`;
    } else if (text.includes('disposed during the month') || text.includes('disposed')) {
      return `${id}3`;
    } else if (text.includes('end of the month') || text.includes('end month')) {
      return `${id}4`;
    }
    
    return null;
  }

  /**
   * Get PS count for user (placeholder - implement based on your user model)
   */
  async getPSCountForUser(userId) {
    // Implement based on your user model structure
    return '0';
  }

  /**
   * Get subdivision count for user (placeholder - implement based on your user model)
   */
  async getSubCountForUser(userId) {
    // Implement based on your user model structure
    return '0';
  }

  /**
   * Get circle count for user (placeholder - implement based on your user model)
   */
  async getCircleCountForUser(userId) {
    // Implement based on your user model structure
    return '0';
  }

  /**
   * Save performance statistics
   * @param {Object} data - Statistics data
   * @returns {Object} Save result
   */
  async saveStatistics({ performanceStatistics, userId }) {
    try {
      const now = new Date();
      // Set to current month - 1
      now.setMonth(now.getMonth() - 1);
      const currentMonthYear = now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();

      // Get user details for battalion info
      const user = await User.findByPk(userId, {
        include: [{ model: Battalion, as: 'battalion' }]
      });
      console.log(`User details:`, user );
      console.log(`Saving statistics for user ${userId} in battalion ${user.battalion || 'Unknown Battalion'}`);
      const statisticsToSave = performanceStatistics.map(stat => ({
        userId,
        questionId: stat.questionId,
        moduleId: stat.moduleId,
        topicId: stat.topicId,
        subTopicId: stat.subTopicId || null,
  value:this.extractFilename(stat.value),
  companyId: stat.companyId || null,
        status: stat.status || 'INPROGRESS',
        monthYear: currentMonthYear,
        battalionId: user.battalionId || null,
        rangeId: user.rangeId || null,
        stateId: user.stateId || null,
        createdBy: userId,
        updatedBy: userId,
        active: true
      }));

      // Use upsert logic to handle existing records
      const results = [];
      for (const stat of statisticsToSave) {
        const existing = await PerformanceStatistic.findOne({
          where: {
            userId: stat.userId,
            questionId: stat.questionId,
            monthYear: stat.monthYear,
            subTopicId: stat.subTopicId,
            companyId: stat.companyId,
          }
        });

        if (existing) {
          await existing.update({
            ...stat,
            updatedBy: userId
          });
          results.push(existing);
        } else {
          const newStat = await PerformanceStatistic.create(stat);
          results.push(newStat);
        }
      }

      logger.info(`Saved ${results.length} performance statistics for user ${userId}`);
      return {
        success: true,
        count: results.length,
        data: results
      };

    } catch (error) {
      logger.error('Error saving performance statistics:', error);
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


  /**
   * Send OTP for verification (placeholder - implement based on your OTP service)
   * @param {number} userId - User ID
   * @returns {Object} OTP result
   */

async sendOTP(userId) {
  try {
    console.log('Attempting to send OTP for userId:', userId);
    
    // Use raw query with your existing sequelize instance
    const [user] = await sequelize.query(
      'SELECT id, mobile_no, contact_no, first_name, last_name, email FROM user WHERE id = :userId',
      {
        replacements: { userId },
        type: sequelize.QueryTypes.SELECT
      }
    );
    
   
    if (!user) {
      throw new Error('User not found');
    }

    // Check both mobile_no and contact_no fields
    let mobileNumber = user.mobile_no || user.contact_no;
    
    if (!mobileNumber) {
      // Debug: Check what other fields might contain mobile number
      const [allFields] = await sequelize.query(
        'SELECT * FROM user WHERE id = :userId',
        {
          replacements: { userId },
          type: sequelize.QueryTypes.SELECT
        }
      );
       
      // Look for any field with a 10-digit number
      for (const [key, value] of Object.entries(allFields)) {
        if (value && typeof value === 'string' && value.replace(/\D/g, '').length >= 10) {
          mobileNumber = value;
          console.log(`Found mobile in field "${key}":`, mobileNumber);
          break;
        }
      }
      
      if (!mobileNumber) {
        throw new Error('Mobile number is not registered. Please update your profile with a valid mobile number.');
      }
    }
    
    // Convert to string and trim
    mobileNumber = mobileNumber.toString().trim();
  
    
    if (mobileNumber.length < 10) {
      throw new Error('Valid mobile number (10 digits) is required to send OTP');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Generated OTP:', otp);
    

    await sequelize.query(
  'UPDATE user SET otp = :otp, otp_validity = DATE_ADD(NOW(), INTERVAL 10 MINUTE), updated_date = NOW() WHERE id = :userId',
  {
    replacements: { 
      otp, 
      userId 
    }
  }
);
    
    console.log('OTP stored in database');
    
    // Clean mobile number (remove any spaces, dashes, etc.)
    const cleanMobileNo = mobileNumber.replace(/\D/g, '');

    
    if (cleanMobileNo.length < 10) {
      throw new Error('Invalid mobile number format');
    }
    
    // Ensure it's in 91XXXXXXXXXX format
    let formattedMobileNo;
    if (cleanMobileNo.length === 10) {
      formattedMobileNo = `91${cleanMobileNo}`; // Add country code
    } else if (cleanMobileNo.length === 12 && cleanMobileNo.startsWith('91')) {
      formattedMobileNo = cleanMobileNo; // Already has country code
    } else if (cleanMobileNo.length === 11 && cleanMobileNo.startsWith('0')) {
      formattedMobileNo = `91${cleanMobileNo.substring(1)}`; // Remove leading 0 and add 91
    } else {
      formattedMobileNo = cleanMobileNo; // Use as is
    }
   
    
    // Prepare message body with OTP
    const messageBody = `Your OTP for verification is ${otp}. This OTP is valid for 10 minutes.`;
    const encodedMessage = encodeURIComponent(messageBody);
    
   // Get values from config
    const username = MSG_INDIA_CONFIG.USERNAME;
    const sendername = MSG_INDIA_CONFIG.SENDER_NAME;
    const smstype = MSG_INDIA_CONFIG.SMS_TYPE;
    const apikey = MSG_INDIA_CONFIG.API_KEY;
    const peid = MSG_INDIA_CONFIG.PEID;
    const templateid = MSG_INDIA_CONFIG.TEMPLATE_ID;
     const message = encodedMessage;
     const numbers = formattedMobileNo;

  
      // Build the API URL using the variables
    const apiUrl = `http://sms.messageindia.in/v2/sendSMS?username=${username}&message=${message}&sendername=${sendername}&smstype=${smstype}&numbers=${numbers}&apikey=${apikey}&peid=${peid}&templateid=${templateid}`;
     console.log('Sending SMS via MsgIndia API...');
 
    
    // Send SMS via MsgIndia API
    const response = await axios.get(apiUrl);
    
    console.log('MsgIndia API Response:', response.data);
  

    if (Array.isArray(response.data) && response.data.length > 0) {
      const result = response.data[0];
      
      if (result.status === 'success' || result.msgid) {
   
        
        return {
          success: true,
          message: 'OTP sent successfully to your registered mobile number',
          otp: process.env.NODE_ENV === 'development' ? otp : undefined,
          msgId: result.msgid,
          cost: result.cost
 };
      } else {
        
        throw new Error(`Failed to send SMS: ${result.msg || 'Unknown error'}`);
      }
    } else {
     
      throw new Error('Invalid response from SMS service');
    }
    

} catch (error) {
    
    // Handle specific errors
    if (error.response) {
      throw new Error(`SMS service error: ${error.response.status}`);
    } else if (error.request) {
      throw new Error('SMS service is not responding. Please try again later.');
    } else {
      throw new Error(`Failed to send OTP: ${error.message}`);
    }
  }
}

  /**
   * Verify OTP and finalize submission
   * @param {Object} data - OTP verification data
   * @returns {Object} Verification result
   */

async verifyOTP({ userId, otp }) {
  try {
    
    
    if (!otp || otp.length !== 6) {
      throw new Error('Valid 6-digit OTP is required');
    }
    
    const cleanOTP = otp.toString().trim();
    
    // Check if we're in development mode
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    let user;
    
    if (isDevelopment) {
      
      // Just check OTP match, ignore expiry for development
      [user] = await sequelize.query(
        'SELECT id, otp, otp_validity FROM user WHERE id = :userId AND otp = :otp',
        {
          replacements: { userId, otp: cleanOTP },
          type: sequelize.QueryTypes.SELECT
        }
      );
    } else {
      // Production: Check both OTP and expiry
      [user] = await sequelize.query(
        'SELECT id, otp, otp_validity FROM user WHERE id = :userId AND otp = :otp AND otp_validity > NOW()',
        {
          replacements: { userId, otp: cleanOTP },
          type: sequelize.QueryTypes.SELECT
        }
      );
    }
    
    if (!user) {
      // Get details to see what's wrong
      const [details] = await sequelize.query(
        'SELECT otp, otp_validity, NOW() as current_db_time FROM user WHERE id = :userId',
        {
          replacements: { userId },
          type: sequelize.QueryTypes.SELECT
        }
      );
      
  
      if (!details?.otp) {
        throw new Error('No OTP found for user. Please request a new OTP.');
      } else if (details?.otp !== cleanOTP) {
        throw new Error(`Invalid OTP, Please try again.`);
      } else {
        throw new Error('OTP has expired. Please request a new OTP.');
      }
    }
    
    // Clear OTP after verification
    await sequelize.query(
      'UPDATE user SET otp = NULL, otp_validity = NULL, updated_date = NOW() WHERE id = :userId',
      {
        replacements: { userId }
      }
    );
    
    console.log('✅ OTP verified successfully');
    

    
    return {
      success: true,
      message: 'OTP verified successfully'
    };
    
  } catch (error) {
    console.error('Invalid OTP');
    throw error;
  }
}

  /**
   * Get performance statistics summary
   * @param {Object} filters - Filter options
   * @returns {Object} Performance statistics summary
   */
  async getSummary(filters = {}) {
    const { userId, stateId, rangeId, districtId, monthYear } = filters;
    
    const whereCondition = { active: true };
    if (userId) whereCondition.userId = userId;
    if (stateId) whereCondition.stateId = stateId;
    if (rangeId) whereCondition.rangeId = rangeId;
    if (districtId) whereCondition.districtId = districtId;
    if (monthYear) whereCondition.monthYear = { [Op.like]: `%${monthYear}%` };

    const totalCount = await PerformanceStatistic.count({ where: whereCondition });
    const successCount = await PerformanceStatistic.count({ 
      where: { ...whereCondition, status: 'SUCCESS' } 
    });
    const inProgressCount = await PerformanceStatistic.count({ 
      where: { ...whereCondition, status: 'INPROGRESS' } 
    });
    const totalValue = await PerformanceStatistic.sum('value', { where: whereCondition });

    return {
      totalCount,
      successCount,
      inProgressCount,
      totalValue: totalValue || 0,
      successRate: totalCount > 0 ? (successCount / totalCount * 100).toFixed(2) : 0
    };
  }
}

module.exports = new PerformanceStatisticService();