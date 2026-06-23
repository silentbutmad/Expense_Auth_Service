import * as authService from "../services/authService.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { prisma } from "../models/db.js";

/**
 * Login Controller
 * POST /auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Extract device info from headers
    const deviceId = req.headers["x-device-id"] || "unknown-device";
    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress ||
      req.ip;
    const userAgent = req.headers["user-agent"] || "unknown";

    const result = await authService.login({
      email,
      password,
      deviceId,
      ipAddress,
      userAgent,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

/**
 * Refresh Token Controller
 * POST /auth/refresh
 */
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken, deviceId, ipAddress, userAgent } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
        code: "REFRESH_TOKEN_MISSING",
      });
    }

    // Extract device info from headers if not provided in body
    const device =
      deviceId || req.headers["x-device-id"] || "unknown-device";
    const ip =
      ipAddress ||
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress ||
      req.ip;
    const agent = userAgent || req.headers["user-agent"] || "unknown";

    const result = await authService.refreshAccessToken(
      refreshToken,
      device,
      ip,
      agent
    );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Refresh token error:", error);

    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
      code: error.status === 403 ? "REFRESH_TOKEN_INVALID" : "REFRESH_ERROR",
    });
  }
};

/**
 * Logout Controller
 * POST /auth/logout
 */
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
        code: "REFRESH_TOKEN_MISSING",
      });
    }

    const result = await authService.logoutUser(refreshToken);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Logout error:", error);

    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

/**
 * Logout from all devices
 * POST /auth/logout-all
 */
export const logoutAllDevices = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const result = await authService.logoutAllDevices(userId);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Logout all devices error:", error);

    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

/**
 * Logout current device
 * POST /auth/logout-current
 */
export const logoutCurrentDevice = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
        code: "REFRESH_TOKEN_MISSING",
      });
    }

    const result = await authService.logoutCurrentDevice(refreshToken);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Logout current device error:", error);

    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

/**
 * Get active sessions
 * GET /auth/sessions
 */
export const getActiveSessions = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const sessions = await authService.getActiveSessions(userId);

    return res.status(200).json({
      success: true,
      data: sessions,
      count: sessions.length,
    });
  } catch (error) {
    console.error("Get active sessions error:", error);

    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

/**
 * Revoke specific session
 * DELETE /auth/sessions/:tokenId
 */
export const revokeSession = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { tokenId } = req.params;

    const result = await authService.revokeSession(userId, tokenId);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Revoke session error:", error);

    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

/**
 * Get current user profile
 * GET /auth/me
 */
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const user = await prisma.User.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        email: true,
        first_name: true,
        last_name: true,
        mobile_number: true,
        language: true,
        isverified: true,
        isactive: true,
        last_login: true,
        create_at: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export default {
  login,
  refreshToken,
  logout,
  logoutAllDevices,
  logoutCurrentDevice,
  getActiveSessions,
  revokeSession,
  getCurrentUser,
};