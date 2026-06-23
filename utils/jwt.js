import jwt from "jsonwebtoken";
import crypto from "crypto";

/**
 * Generate a secure random secret using crypto
 * @param {number} length - Length of the secret in bytes
 * @returns {string} Hex-encoded secret
 */
export const generateSecret = (length = 64) => {
  return crypto.randomBytes(length).toString("hex");
};

/**
 * Generate access token for a user
 * @param {Object} user - User object containing user_id
 * @returns {string} JWT access token
 */
export const generateAccessToken = (user) => {
  const payload = {
    user_id: user.user_id,
    type: "access",
  };

  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
    algorithm: "HS256",
    issuer: "auth-service",
    audience: "expense-management-app",
  });
};

/**
 * Generate refresh token for a user
 * @param {Object} user - User object containing user_id
 * @returns {string} JWT refresh token
 */
export const generateRefreshToken = (user) => {
  const payload = {
    user_id: user.user_id,
    type: "refresh",
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
    algorithm: "HS256",
    issuer: "auth-service",
    audience: "expense-management-app",
  });
};

/**
 * Verify access token
 * @param {string} token - JWT access token
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
      algorithms: ["HS256"],
      issuer: "auth-service",
      audience: "expense-management-app",
    });

    // Ensure it's an access token
    if (decoded.type !== "access") {
      throw new Error("Invalid token type");
    }

    return decoded;
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      const err = new Error("Access token expired");
      err.name = "TokenExpiredError";
      throw err;
    }
    if (error.name === "JsonWebTokenError") {
      const err = new Error("Invalid access token");
      err.name = "JsonWebTokenError";
      throw err;
    }
    throw error;
  }
};

/**
 * Verify refresh token
 * @param {string} token - JWT refresh token
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
      algorithms: ["HS256"],
      issuer: "auth-service",
      audience: "expense-management-app",
    });

    // Ensure it's a refresh token
    if (decoded.type !== "refresh") {
      throw new Error("Invalid token type");
    }

    return decoded;
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      const err = new Error("Refresh token expired");
      err.name = "TokenExpiredError";
      throw err;
    }
    if (error.name === "JsonWebTokenError") {
      const err = new Error("Invalid refresh token");
      err.name = "JsonWebTokenError";
      throw err;
    }
    throw error;
  }
};

/**
 * Hash a string using SHA-256
 * @param {string} str - String to hash
 * @returns {string} Hashed string
 */
export const hashToken = (str) => {
  return crypto.createHash("sha256").update(str).digest("hex");
};

/**
 * Decode token without verification (for debugging)
 * @param {string} token - JWT token
 * @returns {Object} Decoded payload
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};