// models/CommunicationsMessageUser.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // ✅ Import sequelize

const CommunicationsMessageUser = sequelize.define('CommunicationsMessageUser', {
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },
  communicationsMessageId: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    field: 'communicationMessageId'
  },
  userId: { 
    type: DataTypes.INTEGER, 
    allowNull: false
  },
  updateStatus: {
    type: DataTypes.STRING,
    allowNull: true
  },
  active: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: true 
  },
  createdBy: { 
    type: DataTypes.INTEGER, 
    allowNull: false
  }
}, {
  tableName: 'communications_message_users',
  timestamps: true
});

module.exports = CommunicationsMessageUser;