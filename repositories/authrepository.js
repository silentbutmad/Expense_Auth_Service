import { prisma }  from "../models/db.js";

export const findUserByMobile = (mobile) =>
  prisma.user.findUnique({ where: { mobile } });

export const findUserById = (user_id) =>
  prisma.user.findUnique({ where: { user_id } });

export const saveOtp = (mobile, otpHash) =>
  prisma.otp.create({
    data: {
      mobile,
      otp_hash: otpHash,
      expires_at: new Date(Date.now() + 5 * 60 * 1000),
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

export const saveRefreshToken = (user_id, tokenHash) =>
  prisma.refreshToken.create({
    data: {
      user_id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

export const findRefreshToken = (tokenHash) =>
  prisma.refreshToken.findFirst({
    where: { token_hash: tokenHash, revoked: false },
  });

export const deleteRefreshToken = (id) =>
  prisma.refreshToken.delete({ where: { id } });