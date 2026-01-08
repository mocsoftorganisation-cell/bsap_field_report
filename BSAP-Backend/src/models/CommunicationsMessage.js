const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // ✅ Import sequelize

const CommunicationsMessage = sequelize.define('CommunicationsMessage', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  communicationId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'message'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'active'
  }
}, {
  tableName: 'communications_messages',
  timestamps: true
});

// ADD THIS ASSOCIATION
CommunicationsMessage.associate = (models) => {
  CommunicationsMessage.belongsTo(models.User, {
    foreignKey: 'createdBy',
    as: 'user'
  });
};

module.exports = CommunicationsMessage;