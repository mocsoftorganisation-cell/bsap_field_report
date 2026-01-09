const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, Role, Permission, RolePermission } = require('../models');
const { comparePassword, hashPassword } = require('../utils/helpers');
const otpUtility = require('../utils/otpUtility');
const smsUtil = require('../utils/smsUtil');
const logger = require('../utils/logger');
const { log } = require('winston');

class AuthService {
  /* ================= LOGIN ================= */
  async doLogin(loginData) {
    
    
    const { email, password } = loginData;
    if (!email || !password) throw new Error('Email and password are required');

    const user = await User.findOne({
      where: { email, active: 1 },
      include: [{ model: Role, as: 'role', where: { active: true } }]
    });

    console.log('User found during login:', user ? user.get({ plain: true }) : null);
    if (!user) throw new Error('Incorrect username or password!');
    const isValid = await comparePassword(password, user.password);
    if (!isValid) throw new Error('Incorrect username or password!');
    if (!user.verified) throw new Error('Account not verified');

    const token = jwt.sign(
      { id: user.id, email: user.email, roleId: user.roleId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    await user.update({
      token,
      tokenValidity: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    const permissions = await this._getPermissions(user.roleId);

    return {
      success: true,
      message: 'Login successful',
      user: this._formatUser(user, permissions),
      token
    };
  }

  /* ================= GET PROFILE ================= */
  async getProfile(userId) {
    const user = await User.findOne({
      where: { id: userId, active: true },
      include: [{ model: Role, as: 'role' }]
    });
    if (!user) throw new Error('User not found');

    const permissions = await this._getPermissions(user.roleId);
    return this._formatUser(user, permissions);
  }

  /* ================= UPDATE PROFILE ================= */
  async updateProfile(userId, data) {
    const { firstName, lastName, email, contactNo } = data;

    console.log('=== UPDATE PROFILE START ===');
    console.log('User ID:', userId);
    console.log('Received data:', data);

    // Validate required fields
    if (!firstName || !firstName.trim()) {
      throw new Error('First name is required');
    }

    if (!email || !email.trim()) {
      throw new Error('Email is required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new Error('Please provide a valid email address');
    }

    // Find user with role
    const user = await User.findOne({
      where: { id: userId, active: true },
      include: [{ model: Role, as: 'role' }]
    });
    
    if (!user) throw new Error('User not found');

    console.log('Found user:', {
      id: user.id,
      email: user.email,
      contactNo: user.contactNo,
      mobileNo: user.mobileNo
    });

    // Check for duplicate email (excluding current user)
    if (email.trim() !== user.email) {
      const emailExists = await User.findOne({
        where: { 
          email: email.trim(), 
          id: { [Op.ne]: userId } 
        }
      });
      
      if (emailExists) {
        throw new Error('Email already in use by another account');
      }
    }

    // Prepare update data
    const updateData = {
      firstName: firstName.trim(),
      lastName: lastName?.trim() || '',
      email: email.trim(),
      updated_date: new Date()
    };

    // Handle contact number update
    if (contactNo !== undefined && contactNo !== null) {
      const cleanContactNo = contactNo.toString().trim().replace(/\D/g, '');
      
      // Validate contact number if provided
      if (cleanContactNo) {
        if (!/^\d{10}$/.test(cleanContactNo)) {
          throw new Error('Contact number must be exactly 10 digits');
        }
        
        // Check if contact number already exists
        if (cleanContactNo !== user.contactNo) {
          const contactExists = await User.findOne({
            where: { 
              contactNo: cleanContactNo, 
              id: { [Op.ne]: userId } 
            }
          });
          
          if (contactExists) {
            throw new Error('Contact number already in use by another account');
          }
        }
      }
      
      updateData.contactNo = cleanContactNo || null;
    }

    console.log('Update data to save:', updateData);

    // Update the user
    await user.update(updateData);
    
    console.log('After user.update() - before reload:');
    console.log('User instance contactNo:', user.contactNo);
    console.log('User instance mobileNo:', user.mobileNo);
    
    // CRITICAL: Reload the user from database with includes
    await user.reload({
      include: [{ model: Role, as: 'role' }]
    });
    
    console.log('After user.reload():');
    console.log('User instance contactNo:', user.contactNo);
    console.log('User instance mobileNo:', user.mobileNo);
    
    // Get plain object to see actual data
    const userPlain = user.get({ plain: true });
    console.log('Plain user object:', userPlain);
    console.log('All fields in plain object:', Object.keys(userPlain));
    
    const permissions = await this._getPermissions(user.roleId);

    logger.info(`Profile updated for user ${user.id}`, {
      userId: user.id,
      updatedFields: Object.keys(updateData),
      newContactNo: user.contactNo
    });

    // Format and return
    const formattedUser = this._formatUser(user, permissions);
    console.log('Formatted user to return:', formattedUser);
    console.log('=== UPDATE PROFILE END ===');
    
    return formattedUser;
  }

  /* ================= CHANGE PASSWORD ================= */
async changePassword(changeData) {
  const { userId, currentPassword, newPassword } = changeData;
  
  console.log('Change password for user:', userId);
  
  if (!currentPassword || !newPassword) {
    throw new Error('Both current and new passwords are required');
  }

  if (newPassword.length < 5) {
    throw new Error('New password must be at least 5 characters long');
  }

  // Validate password strength
  const hasLetter = /[A-Za-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  
  if (!hasLetter || !hasNumber) {
    throw new Error('Password must contain at least one letter and one number');
  }

  const user = await User.findByPk(userId);
  if (!user) throw new Error('User not found');

  const isValid = await comparePassword(currentPassword, user.password);
  if (!isValid) {
    // Use 400 error message, not 401
    throw new Error('Current password is incorrect');
  }

  await user.update({ 
    password: await hashPassword(newPassword),
    updated_date: new Date()
  });

  logger.info(`Password changed for user ${user.id}`);

  return { success: true, message: 'Password changed successfully' };
}
  /* ================= REFRESH TOKEN ================= */
  async refreshToken(token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) throw new Error('User not found');

    const newToken = jwt.sign(
      { id: user.id, email: user.email, roleId: user.roleId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    await user.update({ token: newToken });

    return { success: true, token: newToken };
  }

  /* ================= HELPERS ================= */
  async _getPermissions(roleId) {
    const rolePermissions = await RolePermission.findAll({
      where: { roleId, active: true },
      include: [{ model: Permission, as: 'permission' }]
    });
    return rolePermissions.map(rp => rp.permission?.permissionCode).filter(Boolean);
  }

  _formatUser(user, permissions) {
    // Get plain object to ensure we have all fields
    const userPlain = user.get ? user.get({ plain: true }) : user;
    
    console.log('=== FORMAT USER ===');
    console.log('User type:', typeof user);
    console.log('Has get method?', !!user.get);
    console.log('Plain object keys:', Object.keys(userPlain));
    console.log('contactNo in plain object?', 'contactNo' in userPlain);
    console.log('contactNo value:', userPlain.contactNo);
    console.log('mobileNo value:', userPlain.mobileNo);
    console.log('=== END FORMAT ===');
    
    // Return formatted user
    const formatted = {
      id: userPlain.id,
      firstName: userPlain.firstName,
      lastName: userPlain.lastName,
      email: userPlain.email,
      mobileNo: userPlain.mobileNo || '',
      contactNo: userPlain.contactNo || '', // Always include, even if empty
      role: userPlain.role,
      permissions,
      created_date: userPlain.created_date,
      updated_date: userPlain.updated_date,
      joining_date: userPlain.joining_date
    };
    
    return formatted;
  }
}

module.exports = new AuthService();