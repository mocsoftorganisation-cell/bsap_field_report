const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RoleTopic = sequelize.define('RoleTopic', {
 
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'role_id',
      references: {
        model: 'roles',
        key: 'id'
      }
    },
    topicId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'topic_id',
      references: {
        model: 'topic',
        key: 'id'
      }
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
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
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'RoleTopic',
    tableName: 'role_topics',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['role_id', 'topic_id'],
        name: 'unique_role_topic'
      }
    ]
  });

  // Add association method
RoleTopic.associate = function(models) {
  // Associate with Topic
  RoleTopic.belongsTo(models.Topic, {
    foreignKey: 'topicId',
    targetKey: 'id',
    as: 'topic'
  });
  // Associate with Role
  RoleTopic.belongsTo(models.Role, {
    foreignKey: 'roleId',
    targetKey: 'id',
    as: 'role'
  });
};

module.exports = RoleTopic;