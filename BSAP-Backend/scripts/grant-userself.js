// const path = require('path');
// require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// // Some files expect DB_USER/DB_PASS while others use DB_USERNAME/DB_PASSWORD
// process.env.DB_USER = process.env.DB_USER || process.env.DB_USERNAME;
// process.env.DB_PASS = process.env.DB_PASS || process.env.DB_PASSWORD;

// const { RolePermission, Permission, Role, sequelize } = require('../src/models');

// (async () => {
//   try {
//     await sequelize.authenticate();
//   } catch (err) {
//     console.error('DB connection failed:', err.message || err);
//     process.exit(1);
//   }

//   const roleId = 13; // Special Reserved Battalion (as provided)

//   try {
//     const role = await Role.findByPk(roleId);
//     if (!role) {
//       console.error(`Role with id ${roleId} not found`);
//       process.exit(1);
//     }

//     // Try common lookups first
//     let permission = await Permission.findOne({ where: { permissionName: 'UsersSelf' } });
//     if (!permission) permission = await Permission.findOne({ where: { permissionCode: 'AUTH_GET_ME' } });
//     if (!permission) permission = await Permission.findOne({ where: { permissionUrl: '/api/users/self' } });
//     if (!permission) permission = await Permission.findOne({ where: { permissionUrl: 'api/users/self' } });

//     // Fallback: search all permissions for a URL or name containing users/self
//     if (!permission) {
//       const all = await Permission.findAll({ where: {} });
//       permission = all.find(p => (p.permissionUrl || '').includes('/users/self') || (p.permissionName || '').toLowerCase().includes('userself') || (p.permissionCode || '').toLowerCase().includes('get_me'));
//     }

//     if (!permission) {
//       console.error('Could not find a matching Permission for users/self. Aborting.');
//       process.exit(1);
//     }

//     const exists = await RolePermission.findOne({ where: { roleId, permissionId: permission.id } });
//     if (exists) {
//       console.log(`Mapping already exists: role ${roleId} -> permission ${permission.id} (${permission.permissionName})`);
//       process.exit(0);
//     }

//     await RolePermission.create({ roleId, permissionId: permission.id, active: true });
//     console.log(`Granted permission '${permission.permissionName}' (id ${permission.id}) to role id ${roleId}`);
//     process.exit(0);
//   } catch (err) {
//     console.error('Error while granting permission:', err);
//     process.exit(1);
//   }
// })();
