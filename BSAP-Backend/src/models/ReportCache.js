const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReportCache = sequelize.define('ReportCache', {
  report_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  report_data: {
    type: DataTypes.JSON,
    allowNull: false
  }
}, {
  tableName: 'report_cache',
  timestamps: true
});

module.exports = ReportCache;
