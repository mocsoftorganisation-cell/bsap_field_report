const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CommunicationsAttachments = sequelize.define('CommunicationsAttachments', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  communicationsMessageId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'communications_message_id'
  },
  filename: {
    type: DataTypes.STRING(1000),
    allowNull: false,
    field: 'filename'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    field: 'created_by'
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    field: 'updated_by'
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'active'
  }
}, {
  tableName: 'communications_attachments',
  timestamps: true,
  createdAt: 'created_date',
  updatedAt: 'updated_date'
});

module.exports = CommunicationsAttachments;
