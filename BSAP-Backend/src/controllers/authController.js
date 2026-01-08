const { authService } = require('../services');
const logger = require('../utils/logger');

/* ======================== LOGIN ======================== */
async function login(req, res) {
  try {
    const result = await authService.doLogin(req.body);

    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.cookie('userId', result.user.id, { maxAge: 24 * 60 * 60 * 1000 });

    res.json({
      status: 'SUCCESS',
      message: 'Login successful',
      data: {
        user: result.user,
        token: result.token,
        isFirstLogin: result.user.isFirst
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    const statusCode = /invalid|incorrect/i.test(error.message) ? 401 : 400;
    res.status(statusCode).json({ status: 'ERROR', message: error.message });
  }
}

/* ======================== SIGNUP ======================== */
async function signup(req, res) {
  try {
    const result = await authService.doSignUp(req.body);
    res.status(201).json({
      status: 'SUCCESS',
      message: 'User registered successfully. Please verify with OTP sent to your mobile.',
      data: {
        userId: result.userId,
        email: result.email,
        otpSent: result.otpSent
      }
    });
  } catch (error) {
    logger.error('Signup error:', error);
    const statusCode = /already exists/i.test(error.message) ? 409 : 400;
    res.status(statusCode).json({ status: 'ERROR', message: error.message });
  }
}

/* ======================== LOGOUT ======================== */
async function logout(req, res) {
  try {
    res.clearCookie('token');
    res.clearCookie('userId');
    res.json({ status: 'SUCCESS', message: 'Logout successful' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ status: 'ERROR', message: 'Logout failed', error: error.message });
  }
}

/* ======================== FORGOT PASSWORD ======================== */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ status: 'ERROR', message: 'Email is required' });

    const result = await authService.doForgotPassword(email);
    res.json({
      status: 'SUCCESS',
      message: 'Password reset OTP sent to your registered mobile number.',
      data: { otpSent: result.otpSent, email: result.email }
    });
  } catch (error) {
    logger.error('Forgot password error:', error);
    const statusCode = /not found/i.test(error.message) ? 404 : 500;
    res.status(statusCode).json({ status: 'ERROR', message: error.message });
  }
}

/* ======================== VERIFY OTP ======================== */
async function verifyOtp(req, res) {
  try {
    await authService.verifyOTP(req.body);
    res.json({ status: 'SUCCESS', message: 'OTP verified successfully', data: { verified: true } });
  } catch (error) {
    logger.error('OTP verification error:', error);
    res.status(400).json({ status: 'ERROR', message: error.message });
  }
}

/* ======================== RESET PASSWORD ======================== */
async function resetPassword(req, res) {
  try {
    await authService.resetPassword(req.body);
    res.json({ status: 'SUCCESS', message: 'Password reset successfully', data: { passwordReset: true } });
  } catch (error) {
    logger.error('Password reset error:', error);
    res.status(400).json({ status: 'ERROR', message: error.message });
  }
}

/* ======================== CHANGE PASSWORD ======================== */
/* ======================== CHANGE PASSWORD ======================== */
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    console.log('Password change request for user:', userId);
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        status: 'ERROR', 
        message: 'Current password and new password are required' 
      });
    }
    
    try {
      await authService.changePassword({ userId, currentPassword, newPassword });
      
      res.json({ 
        status: 'SUCCESS', 
        message: 'Password changed successfully', 
        data: { passwordChanged: true } 
      });
      
    } catch (error) {
      console.error('Password change service error:', error);
      
      // Don't send 401 for wrong password - use 400 instead
      if (error.message.toLowerCase().includes('current password') || 
          error.message.toLowerCase().includes('incorrect')) {
        return res.status(400).json({ 
          status: 'ERROR', 
          message: error.message 
        });
      }
      
      // For other errors
      const statusCode = error.message.includes('required') ? 400 : 500;
      res.status(statusCode).json({ 
        status: 'ERROR', 
        message: error.message 
      });
    }
    
  } catch (error) {
    console.error('Change password controller error:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Internal server error' 
    });
  }
}

/* ======================== REFRESH TOKEN ======================== */
async function refreshToken(req, res) {
  try {
    const authHeader = req.header('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '').trim() : null;
    if (!token) return res.status(400).json({ status: 'ERROR', message: 'Authorization token is required' });

    const result = await authService.refreshToken(token);
    res.cookie('token', result.token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 });
    res.json({ status: 'SUCCESS', message: 'Token refreshed successfully', data: { token: result.token } });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({ status: 'ERROR', message: 'Token refresh failed', error: error.message });
  }
}

/* ======================== ME (PROFILE) ======================== */
async function me(req, res) {
  try {
    const user = await authService.getProfile(req.user.id); // <-- call service
    res.json({ status: 'SUCCESS', message: 'Profile retrieved successfully', data: user });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(404).json({ status: 'ERROR', message: error.message });
  }
}

/* ======================== UPDATE PROFILE ======================== */
async function updateProfile(req, res) {
  try {
    const updatedUser = await authService.updateProfile(req.user.id, req.body);
    res.json({ status: 'SUCCESS', message: 'Profile updated successfully', data: updatedUser });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(400).json({ status: 'ERROR', message: error.message });
  }
}

/* ======================== VERIFY EMAIL ======================== */
async function verifyEmail(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ status: 'ERROR', message: 'Email and OTP are required' });
    await authService.verifyOTP({ email, otp });
    res.json({ status: 'SUCCESS', message: 'Email verified successfully', data: { verified: true } });
  } catch (error) {
    logger.error('Email verification error:', error);
    res.status(400).json({ status: 'ERROR', message: error.message });
  }
}

module.exports = {
  login,
  signup,
  logout,
  forgotPassword,
  verifyOtp,
  resetPassword,
  changePassword,
  refreshToken,
  me,
  updateProfile, // <-- new
  verifyEmail
};