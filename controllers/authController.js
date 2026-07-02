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

/**
 * Get authenticated user profile
 * GET /auth/profile
 */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const user = await prisma.User.findUnique({
      where: { user_id: userId },
      select: {
        first_name: true,
        last_name: true,
        email: true,
        mobile_number: true,
        language: true,
        isverified: true,
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
      data: {
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        mobile_number: user.mobile_number,
        language: user.language,
        isverified: user.isverified,
        last_login: user.last_login,
        created_at: user.create_at,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

/**
 * Update authenticated user profile
 * PUT /auth/updateprofile
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { first_name, last_name, email, mobile_number, language } = req.body;

    // Reject non-editable fields
    const nonEditableFields = ['user_id', 'password_hash', 'salt', 'isverified', 'isactive', 'failed_attempts', 'last_login', 'created_at', 'updated_at'];
    const providedNonEditable = nonEditableFields.filter(f => req.body[f] !== undefined);
    if (providedNonEditable.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot update non-editable fields: ${providedNonEditable.join(', ')}`,
        code: "NON_EDITABLE_FIELDS",
      });
    }

    // Check user exists
    const existingUser = await prisma.User.findUnique({
      where: { user_id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check email uniqueness if changed
    if (email !== undefined && email !== existingUser.email) {
      const emailTaken = await prisma.User.findUnique({
        where: { email },
      });
      if (emailTaken) {
        return res.status(409).json({
          success: false,
          message: "Email is already in use",
          code: "EMAIL_EXISTS",
        });
      }
    }

    // Check mobile uniqueness if changed
    if (mobile_number !== undefined && mobile_number !== existingUser.mobile_number) {
      const mobileTaken = await prisma.User.findUnique({
        where: { mobile_number },
      });
      if (mobileTaken) {
        return res.status(409).json({
          success: false,
          message: "Mobile number is already in use",
          code: "MOBILE_EXISTS",
        });
      }
    }

    // Build update data (only provided fields)
    const updateData = {};
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (email !== undefined) updateData.email = email;
    if (mobile_number !== undefined) updateData.mobile_number = mobile_number;
    if (language !== undefined) updateData.language = language;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No editable fields provided",
        code: "NO_FIELDS_TO_UPDATE",
      });
    }

    await prisma.User.update({
      where: { user_id: userId },
      data: updateData,
    });

    // Fetch updated user
    const updatedUser = await prisma.User.findUnique({
      where: { user_id: userId },
      select: {
        first_name: true,
        last_name: true,
        email: true,
        mobile_number: true,
        language: true,
        isverified: true,
        last_login: true,
        create_at: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        email: updatedUser.email,
        mobile_number: updatedUser.mobile_number,
        language: updatedUser.language,
        isverified: updatedUser.isverified,
        last_login: updatedUser.last_login,
        created_at: updatedUser.create_at,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);

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
  getProfile,
  updateProfile,
};