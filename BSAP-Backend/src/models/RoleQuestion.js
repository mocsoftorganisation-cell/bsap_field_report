const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RoleQuestion = sequelize.define('RoleQuestion', {

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
    questionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'question_id',
      references: {
        model: 'question',
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
    modelName: 'RoleQuestion',
    tableName: 'role_questions',
    timestamps: true,
    underscored: true,
   
    indexes: [
      {
        unique: true,
        fields: ['role_id', 'question_id'],
        name: 'unique_role_question'
      }
    ],
    

  });

module.exports = RoleQuestion;