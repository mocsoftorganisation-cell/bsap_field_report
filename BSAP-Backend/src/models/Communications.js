const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Communications = sequelize.define('Communications', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  battalionId: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'battalion_id'
  },
  selectedBattalions: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'selected_battalions'
  },
  selectedBattalionNames: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'selected_battalion_names'
  },
  userIds: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'user_ids'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    field: 'created_by',
    allowNull: true
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    field: 'updated_by',
    allowNull: true
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'communications',
  timestamps: true,
  createdAt: 'created_date',
  updatedAt: 'updated_date'
});

module.exports = Communications;
