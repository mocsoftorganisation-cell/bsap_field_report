const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CommunicationsUser = sequelize.define('CommunicationsUser', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true, 
    primaryKey: true
   },

  communicationId: { 
    type: DataTypes.INTEGER,
    allowNull: false 
    },

  userId: { 
    type: DataTypes.INTEGER,
    allowNull: false
   },
   
}, {
  tableName: 'communications_users',
  timestamps: false
});

module.exports = CommunicationsUser;