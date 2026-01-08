const authService = require('./authService');
const userService = require('./userService');
const performanceStatisticService = require('./performanceStatisticService');
const communicationService = require('./communicationService');
const reportService = require('./reportService');
const cidCrimeDataService = require('./cidCrimeDataService');
const Communications = require('../models/Communications');
const CommunicationsMessage = require('../models/CommunicationsMessage');
const CommunicationsMessageUser = require('../models/CommunicationsMessageUser');
const CommunicationsAttachments = require('../models/CommunicationsAttachments');
const battalionService = require('./battalionService');
const rangeService = require('./rangeService');
const CommunicationsUser = require('../models/CommunicationsUser');
const User = require('../models/User'); // Add this line
const { sequelize, Sequelize } = require('../models');
const Company = require('../models/Company');
module.exports = {
  authService,
  userService,
  performanceStatisticService,
  communicationService,
  reportService,
  cidCrimeDataService,
  battalionService,
  rangeService, 
  Communications,
  CommunicationsMessage,
  CommunicationsMessageUser,
  CommunicationsUser,  // ✅ Make sure this line exists
  CommunicationsAttachments,
  User,
  sequelize,
  Sequelize,
  Company
};