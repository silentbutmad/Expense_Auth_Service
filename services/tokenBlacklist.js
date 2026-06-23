import { redis } from "../models/redis.js";

/**
 * Token Blacklist Service using Redis
 * Handles access token revocation and blacklisting
 */

/**
 * Add token to blacklist
 * @param {string} token - JWT token to blacklist
 * @param {number} expiresIn - Time in seconds until token expires
 */
export const blacklistToken = async (token, expiresIn) => {
  const tokenHash = Buffer.from(token).toString("base64url");
  const key = `blacklist:${tokenHash}`;

  // Store in Redis with TTL matching token expiry
  await redis.set(key, "revoked", "EX", expiresIn);

  return true;
};

/**
 * Check if token is blacklisted
 * @param {string} token - JWT token to check
 * @returns {boolean} True if token is blacklisted
 */
export const isTokenBlacklisted = async (token) => {
  const tokenHash = Buffer.from(token).toString("base64url");
  const key = `blacklist:${tokenHash}`;

  const result = await redis.get(key);
  return result === "revoked";
};

/**
 * Remove token from blacklist
 * @param {string} token - JWT token to remove from blacklist
 */
export const removeFromBlacklist = async (token) => {
  const tokenHash = Buffer.from(token).toString("base64url");
  const key = `blacklist:${tokenHash}`;

  await redis.del(key);

  return true;
};

/**
 * Blacklist all tokens for a user (used on password change, logout all devices)
 * @param {string} userId - User ID
 * @param {number} ttl - Time to live in seconds (default: 15 minutes for access tokens)
 */
export const blacklistAllUserTokens = async (userId, ttl = 900) => {
  const key = `user:blacklist:${userId}`;

  // Store timestamp when all tokens were invalidated
  await redis.set(key, Date.now().toString(), "EX", ttl);

  return true;
};

/**
 * Check if all tokens for a user are blacklisted
 * @param {string} userId - User ID
 * @param {number} tokenIssuedAt - Timestamp when token was issued
 * @returns {boolean} True if all tokens are blacklisted
 */
export const isUserTokenBlacklisted = async (userId, tokenIssuedAt) => {
  const key = `user:blacklist:${userId}`;

  const blacklistTimestamp = await redis.get(key);

  if (!blacklistTimestamp) {
    return false;
  }

  // If token was issued before blacklist timestamp, it's invalid
  return parseInt(tokenIssuedAt) < parseInt(blacklistTimestamp);
};

/**
 * Clear user blacklist (rarely needed, mainly for testing)
 * @param {string} userId - User ID
 */
export const clearUserBlacklist = async (userId) => {
  const key = `user:blacklist:${userId}`;

  await redis.del(key);

  return true;
};

/**
 * Get blacklist statistics
 * @returns {Object} Statistics about blacklisted tokens
 */
export const getBlacklistStats = async () => {
  const keys = await redis.keys("blacklist:*");
  const userKeys = await redis.keys("user:blacklist:*");

  return {
    tokenBlacklistCount: keys.length,
    userBlacklistCount: userKeys.length,
  };
};

export default {
  blacklistToken,
  isTokenBlacklisted,
  removeFromBlacklist,
  blacklistAllUserTokens,
  isUserTokenBlacklisted,
  clearUserBlacklist,
  getBlacklistStats,
};