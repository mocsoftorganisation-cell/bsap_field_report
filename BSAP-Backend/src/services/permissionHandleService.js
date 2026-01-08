const { RoleMenu, RoleSubMenu, RolePermission, RoleTopic, RoleQuestion} = require('../models');
const sequelize = require('../config/database');

// Get all models
const models = require('../models');

// // Explicitly get RoleTopic and RoleQuestion
// let RoleTopic = models.RoleTopic;
// let RoleQuestion = models.RoleQuestion;


class PermissionHandleService {
  
  // Get all permissions for a role
  static async getRolePermissions(roleId) {
    try {
      // Get menu permissions
      const menus = await RoleMenu.findAll({
        where: { roleId, active: true },
        attributes: ['menuId']
      });

      // Get sub-menu permissions
      const subMenus = await RoleSubMenu.findAll({
        where: { roleId, active: true },
        attributes: ['subMenuId']
      });

      // Get role permissions
      const rolePermissions = await RolePermission.findAll({
        where: { roleId, active: true },
        attributes: ['permissionId']
      });

  // Get topic permissions - SAME PATTERN AS RoleMenu
    const topics = await RoleTopic.findAll({
      where: { roleId, active: true },
      attributes: ['topicId']
    });
  
      // Get question permissions (if RoleQuestion exists)
   // Get question permissions - SAME PATTERN AS RoleMenu
    const questions = await RoleQuestion.findAll({
      where: { roleId, active: true },
      attributes: ['questionId']
    });



      return {
        menu: menus.map(item => item.menuId),
        SubMenu: subMenus.map(item => item.subMenuId),
         Topic: topics.map(item => item.topicId),  // Same as menu
      Question: questions.map(item => item.questionId),  // Same as menu
        RolePermission: rolePermissions.map(item => item.permissionId)
      };
    } catch (error) {
      console.error('Error in getRolePermissions:', error);
      throw error;
    }
  }

  // Set permissions for a role (delete existing and insert new)
  static async setRolePermissions(roleId, permissions) {
    const transaction = await sequelize.transaction();

    try {
      const { menu = [], SubMenu = [], Topic = [], Question = [], RolePermission: rolePermissions = [] } = permissions;

      // Delete existing permissions for this role
      const deletePromises = [
        RoleMenu.destroy({ where: { roleId }, transaction }),
        RoleSubMenu.destroy({ where: { roleId }, transaction }),
        RolePermission.destroy({ where: { roleId }, transaction })
      ];

      // Only delete RoleTopic if the model exists
      if (RoleTopic && typeof RoleTopic.destroy === 'function') {
        deletePromises.push(RoleTopic.destroy({ where: { roleId }, transaction }));
      }

      // Only delete RoleQuestion if the model exists
      if (RoleQuestion && typeof RoleQuestion.destroy === 'function') {
        deletePromises.push(RoleQuestion.destroy({ where: { roleId }, transaction }));
      }

      await Promise.all(deletePromises);

      // Prepare data for bulk insert
      const menuData = menu.map(menuId => ({
        roleId,
        menuId,
        active: true
      }));

      const subMenuData = SubMenu.map(subMenuId => ({
        roleId,
        subMenuId,
        active: true
      }));

      // Validate topic IDs exist to avoid foreign key constraint failures
      let topicData = [];
      if (Topic && Topic.length > 0 && RoleTopic && typeof RoleTopic.bulkCreate === 'function') {
        try {
          const topicIds = Topic.map(id => Number(id)).filter(id => !Number.isNaN(id));
          const existingTopics = await models.Topic.findAll({ where: { id: topicIds }, attributes: ['id'] });
          const existingIds = existingTopics.map(t => t.id);
          const invalidIds = topicIds.filter(id => !existingIds.includes(id));
          if (invalidIds.length > 0) {
            console.warn(`PermissionHandleService: ignoring invalid topic IDs for role ${roleId}:`, invalidIds);
          }

          topicData = existingIds.map(topicId => ({
            roleId,
            topicId,
            active: true
          }));
        } catch (err) {
          console.error('Error validating topics before insert:', err);
          // fallback: build topicData cautiously to avoid inserting invalid refs
          topicData = Topic.map(topicId => ({ roleId, topicId, active: true }));
        }
      }

      const questionData = Question.map(questionId => ({
        roleId,
        questionId,
        active: true
      }));

      const rolePermissionData = rolePermissions.map(permissionId => ({
        roleId,
        permissionId,
        active: true
      }));

      // Insert new permissions
      const insertPromises = [];
      
      if (menuData.length > 0) {
        insertPromises.push(RoleMenu.bulkCreate(menuData, { transaction }));
      }
      
      if (subMenuData.length > 0) {
        insertPromises.push(RoleSubMenu.bulkCreate(subMenuData, { transaction }));
      }
      
      if (topicData.length > 0 && RoleTopic && typeof RoleTopic.bulkCreate === 'function') {
        insertPromises.push(RoleTopic.bulkCreate(topicData, { transaction }));
      }
      
      if (questionData.length > 0 && RoleQuestion && typeof RoleQuestion.bulkCreate === 'function') {
        insertPromises.push(RoleQuestion.bulkCreate(questionData, { transaction }));
      }
      
      if (rolePermissionData.length > 0) {
        insertPromises.push(RolePermission.bulkCreate(rolePermissionData, { transaction }));
      }

      await Promise.all(insertPromises);

      await transaction.commit();

      // Return the updated permissions
      return await this.getRolePermissions(roleId);
    } catch (error) {
      await transaction.rollback();
      console.error('Error in setRolePermissions:', error);
      throw error;
    }
  }

  // Get permissions with details (including related data)
  static async getRolePermissionsWithDetails(roleId) {
    try {
      // Get menu permissions with menu details
      const menus = await RoleMenu.findAll({
        where: { roleId, active: true },
        include: [{
          association: 'menu',
          attributes: ['id', 'menuName', 'menuUrl']
        }]
      });

      // Get sub-menu permissions with sub-menu details
      const subMenus = await RoleSubMenu.findAll({
        where: { roleId, active: true },
        include: [{
          association: 'subMenu',
          attributes: ['id', 'menuName', 'menuUrl']
        }]
      });

       // Get topic permissions with topic details (NEW)
      const topics = await RoleTopic.findAll({
        where: { roleId, active: true },
        include: [{
          association: 'topic',
          attributes: ['id', 'topicName', 'description']
        }]
      });

      // Get question permissions with question details (NEW)
      const questions = await RoleQuestion.findAll({
        where: { roleId, active: true },
        include: [{
          association: 'question',
          attributes: ['id', 'questionType', 'description']
        }]
      });

      // Get role permissions with permission details
      const rolePermissions = await RolePermission.findAll({
        where: { roleId, active: true },
        include: [{
          association: 'permission',
          attributes: ['id', 'permissionName', 'description']
        }]
      });

      return {
        menus: menus.map(item => ({
          id: item.menuId,
          ...item.menu?.toJSON()
        })),
        subMenus: subMenus.map(item => ({
          id: item.subMenuId,
          ...item.subMenu?.toJSON()
        })),

         topics: topics.map(item => ({ // NEW
          id: item.topicId,
          ...item.topic?.toJSON()
        })),
        questions: questions.map(item => ({ // NEW
          id: item.questionId,
          ...item.question?.toJSON()
        })),
        permissions: rolePermissions.map(item => ({
          id: item.permissionId,
          ...item.permission?.toJSON()
        }))
      };
    } catch (error) {
      console.error('Error in getRolePermissionsWithDetails:', error);
      throw error;
    }
  }
   // NEW: Check if role has topic access
  static async hasTopicAccess(roleId, topicId) {
    try {
      const topicAccess = await RoleTopic.findOne({
        where: { roleId, topicId, active: true }
      });
      
      return !!topicAccess;
    } catch (error) {
      console.error('Error in hasTopicAccess:', error);
      throw error;
    }
  }

 // NEW: Check if role has question access
  static async hasQuestionAccess(roleId, questionId) {
    try {
      const questionAccess = await RoleQuestion.findOne({
        where: { roleId, questionId, active: true }
      });
      
      return !!questionAccess;
    } catch (error) {
      console.error('Error in hasQuestionAccess:', error);
      throw error;
    }
  }

  // Check if role has specific permission
  static async hasPermission(roleId, permissionId) {
    try {
      const permission = await RolePermission.findOne({
        where: { roleId, permissionId, active: true }
      });
      
      return !!permission;
    } catch (error) {
      console.error('Error in hasPermission:', error);
      throw error;
    }
  }

  // Check if role has menu access
  static async hasMenuAccess(roleId, menuId) {
    try {
      const menuAccess = await RoleMenu.findOne({
        where: { roleId, menuId, active: true }
      });
      
      return !!menuAccess;
    } catch (error) {
      console.error('Error in hasMenuAccess:', error);
      throw error;
    }
  }

  // Check if role has sub-menu access
  static async hasSubMenuAccess(roleId, subMenuId) {
    try {
      const subMenuAccess = await RoleSubMenu.findOne({
        where: { roleId, subMenuId, active: true }
      });
      
      return !!subMenuAccess;
    } catch (error) {
      console.error('Error in hasSubMenuAccess:', error);
      throw error;
    }
  }
}

module.exports = PermissionHandleService;