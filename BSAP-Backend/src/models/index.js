require('dotenv').config();
const { Sequelize } = require('sequelize');

// ✅ Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false,
  }
);

// Models
const User = require('./User');
const Role = require('./Role');
const State = require('./State');
const District = require('./District');
const Range = require('./Range');
const Battalion = require('./Battalion');
const Menu = require('./Menu');
const SubMenu = require('./SubMenu');
const Permission = require('./Permission');
const RolePermission = require('./RolePermission');
const RoleMenu = require('./RoleMenu');
const RoleSubMenu = require('./RoleSubMenu');
const RoleTopic = require('./RoleTopic');//////////////////////////////
const RoleQuestion = require('./RoleQuestion');////////////////////////////// 
const Module = require('./Module');
const Topic = require('./Topic');
const SubTopic = require('./SubTopic');
const Question = require('./Question');
const PerformanceStatistic = require('./PerformanceStatistic');
const Communications = require('./Communications');//////////////////////////////////
const CIDCrimeCategory = require('./CIDCrimeCategory');
const CIDCrimeData = require('./CIDCrimeData');
const CommunicationsUser = require('./CommunicationsUser');
const CommunicationsMessage = require('./CommunicationsMessage');
const CommunicationsMessageUser = require('./CommunicationsMessageUser');
const CommunicationsAttachments = require('./CommunicationsAttachments');
const ReportCache = require('./ReportCache');
const Company = require('./Company');

// ===================
// Associations
// ===================

// -------------------
// Communications
// -------------------
Communications.hasMany(CommunicationsUser, { foreignKey: 'communicationId', as: 'communicationUsers' });
Communications.hasMany(CommunicationsMessage, { foreignKey: 'communicationId', as: 'messages' });
Communications.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

CommunicationsUser.belongsTo(Communications, { foreignKey: 'communicationId', as: 'communication' });
CommunicationsUser.belongsTo(User, { foreignKey: 'userId', as: 'user' });

CommunicationsMessage.belongsTo(Communications, { foreignKey: 'communicationId', as: 'communication' });
CommunicationsMessage.belongsTo(User, { foreignKey: 'createdBy', as: 'user' });
CommunicationsMessage.hasMany(CommunicationsMessageUser, { foreignKey: 'communicationMessageId', as: 'messageUsers' });
CommunicationsMessage.hasMany(CommunicationsAttachments, { foreignKey: 'communications_message_id', as: 'attachments' });
CommunicationsAttachments.belongsTo(CommunicationsMessage, { foreignKey: 'communications_message_id', as: 'message' });
// CommunicationsMessage.hasMany(CommunicationsAttachments, {
//   foreignKey: 'communicationsMessageId',
//   as: 'attachments'
// });

// CommunicationsAttachments.belongsTo(CommunicationsMessage, {
//   foreignKey: 'communicationsMessageId',
//   as: 'message'
// });


// User <-> Communications
User.hasMany(Communications, { foreignKey: 'createdBy', as: 'createdCommunications' });
User.hasMany(CommunicationsMessage, { foreignKey: 'createdBy', as: 'createdMessages' });
User.hasMany(CommunicationsUser, { foreignKey: 'userId', as: 'communicationParticipations' });


// -------------------
// User associations
// -------------------
User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
User.belongsTo(State, { foreignKey: 'stateId', as: 'state' });
User.belongsTo(Range, { foreignKey: 'rangeId', as: 'range' });
// User.belongsTo(District, { foreignKey: 'districtId', as: 'district' });
User.belongsTo(Battalion, { foreignKey: 'battalionId', as: 'battalion' });

// -------------------
// Role associations
// -------------------
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'roleId', otherKey: 'permissionId', as: 'permissions' });
Role.belongsToMany(Menu, { through: RoleMenu, foreignKey: 'roleId', otherKey: 'menuId', as: 'menus' });
Role.belongsToMany(SubMenu, { through: RoleSubMenu, foreignKey: 'roleId', otherKey: 'subMenuId', as: 'subMenus' });

// -------------------
// Permission
// -------------------
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permissionId', otherKey: 'roleId', as: 'roles' });
RolePermission.belongsTo(Permission, { foreignKey: 'permissionId', as: 'permission' });
RolePermission.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });

// -------------------
// Menu & SubMenu
// -------------------
Menu.belongsToMany(Role, { through: RoleMenu, foreignKey: 'menuId', otherKey: 'roleId', as: 'roles' });
Menu.hasMany(SubMenu, { foreignKey: 'menuId', as: 'subMenus' });

SubMenu.belongsTo(Menu, { foreignKey: 'menuId', as: 'menu' });
SubMenu.hasMany(Module, { foreignKey: 'subMenuId', as: 'modules' });
SubMenu.hasMany(Topic, { foreignKey: 'subMenuId', as: 'topics' });
SubMenu.belongsToMany(Role, { through: RoleSubMenu, foreignKey: 'subMenuId', otherKey: 'roleId', as: 'roles' });

RoleSubMenu.belongsTo(SubMenu, { foreignKey: 'subMenuId', as: 'subMenu' });
RoleSubMenu.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });

// -------------------
// State & Range
// -------------------
State.hasMany(Range, { foreignKey: 'stateId', as: 'ranges' });
State.hasMany(User, { foreignKey: 'stateId', as: 'users' });
Range.belongsTo(State, { foreignKey: 'stateId', as: 'state' });
Range.hasMany(User, { foreignKey: 'rangeId', as: 'users' });
// Range.hasMany(District, { foreignKey: 'rangeId', as: 'districts' });

// -------------------
// Battalion & District
// -------------------
Battalion.belongsTo(Range, { foreignKey: 'rangeId', as: 'range' });
Battalion.belongsTo(District, { foreignKey: 'districtId', as: 'district' });
Range.hasMany(Battalion, { foreignKey: 'rangeId', as: 'battalions' });
District.hasMany(Battalion, { foreignKey: 'districtId', as: 'battalions' });

// -------------------
// PerformanceStatistic
// -------------------
PerformanceStatistic.belongsTo(User, { foreignKey: 'userId', as: 'user' });
PerformanceStatistic.belongsTo(Battalion, { foreignKey: 'battalion_id', as: 'battalion' });
PerformanceStatistic.belongsTo(State, { foreignKey: 'stateId', as: 'state' });
PerformanceStatistic.belongsTo(Range, { foreignKey: 'rangeId', as: 'range' });
PerformanceStatistic.belongsTo(Module, { foreignKey: 'moduleId', as: 'module' });
PerformanceStatistic.belongsTo(Topic, { foreignKey: 'topicId', as: 'topic' });
PerformanceStatistic.belongsTo(SubTopic, { foreignKey: 'subTopicId', as: 'subTopic' });
PerformanceStatistic.belongsTo(Question, { foreignKey: 'questionId', as: 'question' });
PerformanceStatistic.belongsTo(User, { foreignKey: 'createdBy', as: 'CreatedByUser' });
PerformanceStatistic.belongsTo(User, { foreignKey: 'updatedBy', as: 'UpdatedByUser' });

Battalion.hasMany(PerformanceStatistic, { foreignKey: 'battalionId', as: 'performanceStatistics' });

// -------------------
// Module -> Topic
// -------------------
Module.belongsTo(SubMenu, { foreignKey: 'subMenuId', as: 'subMenu' });
Module.hasMany(Topic, { foreignKey: 'moduleId', as: 'topics' });

// -------------------
// Topic -> SubTopic & Question
// -------------------
Topic.belongsTo(Module, { foreignKey: 'moduleId', as: 'module' });
Topic.belongsTo(SubMenu, { foreignKey: 'subMenuId', as: 'subMenu' });
Topic.hasMany(SubTopic, { foreignKey: 'topicId', as: 'subTopics' });
Topic.hasMany(Question, { foreignKey: 'topicId', as: 'questions' });

SubTopic.belongsTo(Topic, { foreignKey: 'topicId', as: 'topic' });
SubTopic.hasMany(Question, { foreignKey: 'subTopicId', as: 'questions' });

Question.belongsTo(Topic, { foreignKey: 'topicId', as: 'topic' });
Question.belongsTo(SubTopic, { foreignKey: 'subTopicId', as: 'subTopic' });



// -------------------
// CID Crime Data
// -------------------
CIDCrimeData.belongsTo(CIDCrimeCategory, { foreignKey: 'cidCrimeCategoryId', as: 'crimeCategory' });
CIDCrimeCategory.hasMany(CIDCrimeData, { foreignKey: 'cidCrimeCategoryId', as: 'crimeData' });

// ===================
// Export
// ===================
module.exports = {
  User,
  Role,
  State,
  District,
  Range,
  Battalion,
  Menu,
  SubMenu,
  Permission,
  RolePermission,
  RoleMenu,
  RoleSubMenu,
  RoleTopic,
  RoleQuestion,
  Module,
  Topic,
  SubTopic,
  Question,
  PerformanceStatistic,
  Communications,
  CommunicationsMessage,
  CommunicationsMessageUser,
  CommunicationsUser,
  CommunicationsAttachments,
  CIDCrimeCategory,
  CIDCrimeData,
  sequelize,
  Sequelize,
  ReportCache
};
