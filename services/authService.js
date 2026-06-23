import * as authRepo from "../repositories/authrepository.js";
import { hashToken } from "../utils/jwt.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { prisma } from "../models/db.js";
import { redis } from "../models/redis.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
import {
  blacklistToken,
  blacklistAllUserTokens,
} from "./tokenBlacklist.js";

// Configuration
const MAX_ACTIVE_SESSIONS = 5; // Maximum concurrent sessions per user
const ACCESS_TOKEN_TTL = 15 * 60; // 15 minutes in seconds

/**
 * Login user and generate tokens
 * @param {Object} params - Login parameters
 * @param {string} params.email - User email
 * @param {string} params.password - User password
 * @param {string} params.deviceId - Device identifier
 * @param {string} params.ipAddress - IP address
 * @param {string} params.userAgent - User agent string
 * @returns {Object} Login result with tokens
 */
export const login = async ({
  email,
  password,
  deviceId,
  ipAddress,
  userAgent,
}) => {
  if (!email || !password) {
    throw { status: 400, message: "Email and password are required" };
  }

  // 1. Find user
  const user = await prisma.User.findUnique({
    where: { email },
  });

  if (!user) {
    throw { status: 401, message: "Invalid email or password" };
  }

  // 2. Compare password
  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    throw { status: 401, message: "Invalid email or password" };
  }

  // 3. Check if user is active
  if (!user.isactive) {
    throw { status: 403, message: "Account is deactivated" };
  }

  // 4. Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // 5. Hash refresh token
  const tokenHash = hashToken(refreshToken);

  // 6. Check and enforce maximum active sessions
  const existingTokens = await prisma.Refresh_token.findMany({
    where: {
      user_id: user.user_id,
      revoked: false,
      expires_at: { gt: new Date() },
    },
    orderBy: { created_at: "asc" },
  });

  // If max sessions reached, remove oldest
  if (existingTokens.length >= MAX_ACTIVE_SESSIONS) {
    const tokensToRemove = existingTokens.slice(
      0,
      existingTokens.length - MAX_ACTIVE_SESSIONS + 1
    );

    await prisma.Refresh_token.deleteMany({
      where: {
        token_id: { in: tokensToRemove.map((t) => t.token_id) },
      },
    });
  }

  // 7. Save new refresh token
  await prisma.Refresh_token.create({
    data: {
      user_id: user.user_id,
      token_hash: tokenHash,
      device_id: deviceId || null,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  // 8. Update last login
  await prisma.User.update({
    where: { user_id: user.user_id },
    data: { last_login: new Date() },
  });

  return {
    message: "Login successful",
    accessToken,
    refreshToken,
    user: {
      user_id: user.user_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      isverified: user.isverified,
    },
  };
};

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @param {string} deviceId - Device identifier
 * @param {string} ipAddress - IP address
 * @param {string} userAgent - User agent string
 * @returns {Object} New tokens
 */
export const refreshToken = async (
  refreshToken,
  deviceId,
  ipAddress,
  userAgent
) => {
  // 1. Verify refresh token
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw { status: 403, message: "Invalid or expired refresh token" };
  }

  // 2. Hash the token
  const tokenHash = hashToken(refreshToken);

  // 3. Find hashed token in database
  const storedToken = await prisma.Refresh_token.findFirst({
    where: {
      token_hash: tokenHash,
      revoked: false,
      expires_at: { gt: new Date() },
    },
    include: {
      user: true,
    },
  });

  if (!storedToken) {
    throw { status: 403, message: "Invalid refresh token" };
  }

  // 4. Check if user is still active
  if (!storedToken.user.isactive) {
    throw { status: 403, message: "Account is deactivated" };
  }

  // 5. Delete old refresh token (rotation)
  await prisma.Refresh_token.delete({
    where: { token_id: storedToken.token_id },
  });

  // 6. Generate new tokens
  const user = storedToken.user;
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  // 7. Hash new refresh token
  const newTokenHash = hashToken(newRefreshToken);

  // 8. Check and enforce maximum active sessions
  const existingTokens = await prisma.Refresh_token.findMany({
    where: {
      user_id: user.user_id,
      revoked: false,
      expires_at: { gt: new Date() },
    },
    orderBy: { created_at: "asc" },
  });

  if (existingTokens.length >= MAX_ACTIVE_SESSIONS) {
    const tokensToRemove = existingTokens.slice(
      0,
      existingTokens.length - MAX_ACTIVE_SESSIONS + 1
    );

    await prisma.Refresh_token.deleteMany({
      where: {
        token_id: { in: tokensToRemove.map((t) => t.token_id) },
      },
    });
  }

  // 9. Store new refresh token
  await prisma.Refresh_token.create({
    data: {
      user_id: user.user_id,
      token_hash: newTokenHash,
      device_id: deviceId || storedToken.device_id,
      ip_address: ipAddress || storedToken.ip_address,
      user_agent: userAgent || storedToken.user_agent,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

/**
 * Logout current device/session
 * @param {string} refreshToken - Refresh token to invalidate
 * @returns {Object} Success message
 */
export const logout = async (refreshToken) => {
  if (!refreshToken) {
    throw { status: 400, message: "Refresh token is required" };
  }

  // Hash the token
  const tokenHash = hashToken(refreshToken);

  // Find and delete the token
  const storedToken = await prisma.Refresh_token.findFirst({
    where: {
      token_hash: tokenHash,
      revoked: false,
    },
  });

  if (!storedToken) {
    throw { status: 400, message: "Invalid refresh token" };
  }

  // Delete the refresh token
  await prisma.Refresh_token.delete({
    where: { token_id: storedToken.token_id },
  });

  return { message: "Logged out successfully" };
};

/**
 * Logout from all devices
 * @param {string} userId - User ID
 * @returns {Object} Success message
 */
export const logoutAllDevices = async (userId) => {
  // 1. Revoke all refresh tokens
  await prisma.Refresh_token.updateMany({
    where: {
      user_id: userId,
      revoked: false,
    },
    data: { revoked: true },
  });

  // 2. Blacklist all access tokens for this user
  await blacklistAllUserTokens(userId, ACCESS_TOKEN_TTL);

  return { message: "Logged out from all devices successfully" };
};

/**
 * Logout current device only
 * @param {string} refreshToken - Refresh token
 * @returns {Object} Success message
 */
export const logoutCurrentDevice = async (refreshToken) => {
  return logout(refreshToken);
};

/**
 * Get all active sessions for a user
 * @param {string} userId - User ID
 * @returns {Array} List of active sessions
 */
export const getActiveSessions = async (userId) => {
  const tokens = await prisma.Refresh_token.findMany({
    where: {
      user_id: userId,
      revoked: false,
      expires_at: { gt: new Date() },
    },
    select: {
      token_id: true,
      device_id: true,
      ip_address: true,
      user_agent: true,
      created_at: true,
      expires_at: true,
    },
    orderBy: { created_at: "desc" },
  });

  return tokens;
};

/**
 * Revoke a specific session
 * @param {string} userId - User ID
 * @param {string} tokenId - Token ID to revoke
 * @returns {Object} Success message
 */
export const revokeSession = async (userId, tokenId) => {
  const token = await prisma.Refresh_token.findFirst({
    where: {
      token_id: tokenId,
      user_id: userId,
      revoked: false,
    },
  });

  if (!token) {
    throw { status: 404, message: "Session not found" };
  }

  await prisma.Refresh_token.delete({
    where: { token_id: tokenId },
  });

  return { message: "Session revoked successfully" };
};

/**
 * Clean up expired tokens (run periodically)
 * @returns {number} Number of deleted tokens
 */
export const cleanupExpiredTokens = async () => {
  const result = await prisma.Refresh_token.deleteMany({
    where: {
      expires_at: { lt: new Date() },
    },
  });

  return result.count;
};

export {
  login as loginUser,
  refreshToken as refreshAccessToken,
  logout as logoutUser,

  
};