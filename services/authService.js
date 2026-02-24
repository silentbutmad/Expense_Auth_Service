import * as authRepo from "../repositories/auth.repository.js";
import { generateOTP } from "../utils/otp.js";
import { hashString } from "../utils/hash.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import jwt from "jsonwebtoken";

export const sendOtp = async (mobile) => {
  const user = await authRepo.findUserByMobile(mobile);
  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  const otp = generateOTP();
  const otpHash = hashString(otp);

  await authRepo.saveOtp(mobile, otpHash);

  console.log("OTP:", otp); // Replace with SMS provider

  return { message: "OTP sent successfully" };
};

export const verifyOtp = async (mobile, otp) => {
  const otpRecord = await authRepo.getLatestOtp(mobile);
  if (!otpRecord) {
    throw { status: 400, message: "Invalid OTP" };
  }

  if (otpRecord.expires_at < new Date()) {
    throw { status: 400, message: "OTP expired" };
  }

  const hashedOtp = hashString(otp);

  if (hashedOtp !== otpRecord.otp_hash) {
    throw { status: 400, message: "Incorrect OTP" };
  }

  await authRepo.markOtpVerified(otpRecord.id);

  const user = await authRepo.findUserByMobile(mobile);

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  const tokenHash = hashString(refreshToken);

  await authRepo.saveRefreshToken(user.user_id, tokenHash);

  return { accessToken, refreshToken };
};

export const refreshToken = async (refreshToken) => {
  let decoded;

  try {
    decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );
  } catch {
    throw { status: 403, message: "Invalid or expired token" };
  }

  const tokenHash = hashString(refreshToken);

  const storedToken = await authRepo.findRefreshToken(tokenHash);

  if (!storedToken) {
    throw { status: 403, message: "Invalid refresh token" };
  }

  await authRepo.deleteRefreshToken(storedToken.id);

  const user = await authRepo.findUserById(decoded.user_id);

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  const newHash = hashString(newRefreshToken);

  await authRepo.saveRefreshToken(user.user_id, newHash);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};