import { verifyAccessToken } from "../utils/jwt.js";
import { isTokenBlacklisted, isUserTokenBlacklisted } from "../services/tokenBlacklist.js";

/**
 * Authentication Middleware
 * Verifies access token from Authorization header and sets req.user
 *
 * Usage:
 *   router.get('/protected', authenticate, controller)
 *
 * Access in controller:
 *   req.user.user_id
 */

export const authenticate = async (req, res, next) => {
  try {
    // 1. Get Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization header missing",
        code: "AUTH_HEADER_MISSING",
      });
    }

    // 2. Check Bearer format
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format. Expected: Bearer <token>",
        code: "AUTH_FORMAT_INVALID",
      });
    }

    // 3. Extract token
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token missing",
        code: "TOKEN_MISSING",
      });
    }

    // 4. Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Access token expired",
          code: "TOKEN_EXPIRED",
        });
      }

      return res.status(401).json({
        success: false,
        message: "Invalid access token",
        code: "TOKEN_INVALID",
      });
    }

    // 5. Check if token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: "Token has been revoked",
        code: "TOKEN_REVOKED",
      });
    }

    // 6. Check if all user tokens are blacklisted (e.g., after password change)
    const tokenIssuedAt = decoded.iat || Math.floor(Date.now() / 1000);
    const isUserBlacklisted = await isUserTokenBlacklisted(
      decoded.user_id,
      tokenIssuedAt
    );
    if (isUserBlacklisted) {
      return res.status(401).json({
        success: false,
        message: "All sessions have been invalidated. Please login again.",
        code: "ALL_SESSIONS_INVALIDATED",
      });
    }

    // 7. Set user on request object
    req.user = {
      user_id: decoded.user_id,
      iat: decoded.iat,
      exp: decoded.exp,
    };

    // 8. Add request metadata for logging/auditing
    req.authContext = {
      userId: decoded.user_id,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers["user-agent"],
      deviceId: req.headers["x-device-id"],
    };

    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Authentication error",
      code: "AUTH_ERROR",
    });
  }
};

/**
 * Optional Authentication Middleware
 * Similar to authenticate but doesn't fail if token is missing
 * Useful for endpoints that work with or without authentication
 */
export const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No token provided, continue without user
      return next();
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return next();
    }

    // Try to verify token
    try {
      const decoded = verifyAccessToken(token);

      // Check blacklist
      const isBlacklisted = await isTokenBlacklisted(token);
      if (!isBlacklisted) {
        const tokenIssuedAt = decoded.iat || Math.floor(Date.now() / 1000);
        const isUserBlacklisted = await isUserTokenBlacklisted(
          decoded.user_id,
          tokenIssuedAt
        );

        if (!isUserBlacklisted) {
          req.user = {
            user_id: decoded.user_id,
            iat: decoded.iat,
            exp: decoded.exp,
          };

          req.authContext = {
            userId: decoded.user_id,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"],
            deviceId: req.headers["x-device-id"],
          };
        }
      }
    } catch (error) {
      // Token invalid, continue without user
    }

    next();
  } catch (error) {
    console.error("Optional authentication middleware error:", error);
    next();
  }
};

/**
 * Admin-only middleware (use after authenticate)
 * Checks if user has admin role
 */
export const requireAdmin = (req, res, next) => {
  // This would need to be implemented based on your user roles system
  // For now, just pass through - implement based on your needs
  next();
};

export default {
  authenticate,
  optionalAuthenticate,
  requireAdmin,
};