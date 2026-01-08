const UserService = require('../services/userService');
const AuthService = require('../services/authService');

/* ================= SEARCH USERS ================= */
async function search(req, res) {
  try {
    const { page = 1, limit = 10, status, search, sortBy, sortOrder, roleId, stateId } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      search: search || '',
      status,
      roleId: roleId ? parseInt(roleId) : undefined,
      stateId: stateId ? parseInt(stateId) : undefined,
      sortBy: sortBy || 'firstName',
      sortOrder: sortOrder || 'ASC'
    };

    const result = await UserService.getAllUsers(options);

    res.json({
      status: 'SUCCESS',
      data: result.users,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
}

/* ================= GET SELF ================= */
async function detail(req, res) {
  try {
    const user = await UserService.getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'User not found'
      });
    }

    res.json({
      status: 'SUCCESS',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
}

/* ================= CREATE USER ================= */
async function create(req, res) {
  try {
    const user = await UserService.createUser(req.body);

    res.status(201).json({
      status: 'SUCCESS',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
}

/* ================= UPDATE USER ================= */
async function update(req, res) {
  try {
    const user = await UserService.updateUser(req.params.id, req.body);

    if (!user) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'User not found'
      });
    }

    res.json({
      status: 'SUCCESS',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
}

/* ================= DELETE USER ================= */
async function remove(req, res) {
  try {
    const deleted = await UserService.deleteUser(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'User not found'
    });
    }

    res.json({
      status: 'SUCCESS',
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
}

/* ================= ACTIVE USERS ================= */
async function active(req, res) {
  try {
    const users = await UserService.getActiveUsers();

    res.json({
      status: 'SUCCESS',
      data: users
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
}

/* ================= TOGGLE STATUS ================= */
async function toggleStatus(req, res) {
  try {
    const user = await UserService.toggleUserStatus(req.params.id, req.body.active);

    if (!user) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'User not found'
      });
    }

    res.json({
      status: 'SUCCESS',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
}

/* ================= VERIFY USER ================= */
async function verify(req, res) {
  try {
    const user = await UserService.verifyUser(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'User not found'
      });
    }

    res.json({
      status: 'SUCCESS',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
}

/* ================= CHANGE PASSWORD (ADMIN) ================= */
async function changePassword(req, res) {
  try {
    await UserService.updatePassword(req.params.id, req.body.newPassword);

    res.json({
      status: 'SUCCESS',
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
}

/* ================= UPDATE OWN PROFILE ================= */
/**
 * PUT /api/users/profile
 * JWT REQUIRED
 * Updates user's own profile including contact number
 */
async function updateMyProfile(req, res) {
  try {
    const userId = req.user.id;
    const { firstName, lastName, email, contactNo } = req.body;

    console.log('🔵 Profile update request received:', {
      userId,
      firstName,
      lastName,
      email,
      contactNo,
      requestBody: req.body
    });

    // Validate required fields
    if (!firstName || !email) {
      return res.status(400).json({
        success: false,
        message: 'First name and email are required'
      });
    }

    const updatedUser = await AuthService.updateProfile(userId, {
      firstName,
      lastName,
      email,
      contactNo
    });

    console.log('✅ Profile updated successfully:', {
      userId,
      newContactNo: updatedUser.contactNo
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

module.exports = {
  search,
  detail,
  create,
  update,
  remove,
  active,
  toggleStatus,
  verify,
  changePassword,
  updateMyProfile
};