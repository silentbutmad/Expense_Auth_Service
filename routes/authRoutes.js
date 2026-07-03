import express from 'express';
import {
  login,
  refreshToken,
  logout,
  logoutAllDevices,
  logoutCurrentDevice,
  getActiveSessions,
  revokeSession,
  getProfile,
  updateProfile,
} from '../controllers/authController.js';
import {
  sendEmailOtpController,
  verifyEmailOtpController,
  forgotPassword,
  resetPassword,
  changePassword,
  startRegister,
  verifyRegister,
} from '../controllers/userController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// Registration
router.post('/start-register', startRegister);
router.post('/verify-register', verifyRegister);

// Authentication
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

// OTP Routes

router.post('/verify-otp', verifyEmailOtpController);
router.post('/email-otp', sendEmailOtpController);

// Password Management
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// User profile
router.get('/profile', authenticate, getProfile);
router.put('/updateprofile', authenticate, updateProfile);

// Session management
router.post('/logout-all', authenticate, logoutAllDevices);
router.post('/logout-current', authenticate, logoutCurrentDevice);
router.get('/sessions', authenticate, getActiveSessions);
router.delete('/sessions/:tokenId', authenticate, revokeSession);

// Change password (requires authentication)
router.post('/change-password', authenticate, changePassword);

export default router;