import { prisma } from "../models/db.js";

/**
 * User Repository
 * Handles all database operations related to users
 */

export const findUserByMobile = (mobile) =>
  prisma.user.findUnique({ where: { mobile } });

export const findUserById = (user_id) =>
  prisma.user.findUnique({ where: { user_id } });

export const findUserByEmail = (email) =>
  prisma.user.findUnique({ where: { email } });

export const createUser = (data) =>
  prisma.user.create({
    data,
  });

export const updateUser = (user_id, data) =>
  prisma.user.update({
    where: { user_id },
    data,
  });

export const deleteUser = (user_id) =>
  prisma.user.delete({
    where: { user_id },
  });

/**
 * Refresh Token Repository
 * Handles all database operations related to refresh tokens
 */

export const saveRefreshToken = (user_id, tokenHash, deviceInfo = {}) =>
  prisma.refresh_token.create({
    data: {
      user_id,
      token_hash: tokenHash,
      device_id: deviceInfo.deviceId || null,
      ip_address: deviceInfo.ipAddress || null,
      user_agent: deviceInfo.userAgent || null,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

export const findRefreshToken = (tokenHash) =>
  prisma.refresh_token.findFirst({
    where: {
      token_hash: tokenHash,
      revoked: false,
      expires_at: { gt: new Date() },
    },
    include: {
      user: true,
    },
  });

export const findRefreshTokenById = (tokenId) =>
  prisma.refresh_token.findUnique({
    where: { token_id: tokenId },
  });

export const deleteRefreshToken = (tokenId) =>
  prisma.refresh_token.delete({
    where: { token_id: tokenId },
  });

export const deleteRefreshTokenByHash = (tokenHash) =>
  prisma.refresh_token.deleteMany({
    where: { token_hash: tokenHash },
  });

export const revokeRefreshToken = (tokenId) =>
  prisma.refresh_token.update({
    where: { token_id: tokenId },
    data: { revoked: true },
  });

export const revokeAllUserRefreshTokens = (user_id) =>
  prisma.refresh_token.updateMany({
    where: {
      user_id,
      revoked: false,
    },
    data: { revoked: true },
  });

export const getUserActiveRefreshTokens = (user_id) =>
  prisma.refresh_token.findMany({
    where: {
      user_id,
      revoked: false,
      expires_at: { gt: new Date() },
    },
    orderBy: { created_at: "desc" },
  });

export const countUserActiveTokens = (user_id) =>
  prisma.refresh_token.count({
    where: {
      user_id,
      revoked: false,
      expires_at: { gt: new Date() },
    },
  });

export const deleteExpiredTokens = () =>
  prisma.refresh_token.deleteMany({
    where: {
      expires_at: { lt: new Date() },
    },
  });

export const deleteUserTokens = (user_id) =>
  prisma.refresh_token.deleteMany({
    where: { user_id },
  });

/**
 * OTP Repository
 * Handles all database operations related to OTPs
 */

export const saveOtp = (mobile, otpHash) =>
  prisma.otp.create({
    data: {
      mobile,
      otp_hash: otpHash,
      expires_at: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    },
  });

export const getLatestOtp = (mobile) =>
  prisma.otp.findFirst({
    where: { mobile, verified: false },
    orderBy: { created_at: "desc" },
  });

export const markOtpVerified = (id) =>
  prisma.otp.update({
    where: { id },
    data: { verified: true },
  });

export const deleteExpiredOtps = () =>
  prisma.otp.deleteMany({
    where: {
      expires_at: { lt: new Date() },
    },
  });