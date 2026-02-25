import * as authRepo from "../repositories/authrepository.js";
import { generateOTP } from "../utils/otp.js";
import { hashString } from "../utils/hash.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import jwt from "jsonwebtoken";
import {sendSmsOtp} from "../utils/sms.js"

import { redis } from "../models/redis.js";
import crypto from "crypto";

export const sendOtp = async ({ mobile, ip, deviceId, country }) => {

  // 1️⃣ 30 sec cooldown per mobile
  const cooldownKey = `otp:cooldown:${mobile}`;
  if (await redis.get(cooldownKey)) {
    throw { status: 429, message: "Wait 30 sec before retrying" };
  }

  // 2️⃣ IP rate limit (20 per 5 min)
  const ipKey = `otp:ip:${ip}`;
  const ipCount = await redis.incr(ipKey);
  if (ipCount === 1) await redis.expire(ipKey, 300);
  if (ipCount > 20) {
    throw { status: 429, message: "Too many OTP requests from IP" };
  }

  // 3️⃣ User rate limit (5 per 5 min)
  const userKey = `otp:user:${mobile}`;
  const userCount = await redis.incr(userKey);
  if (userCount === 1) await redis.expire(userKey, 300);
  if (userCount > 5) {
    throw { status: 429, message: "Too many OTP requests for this number" };
  }

  // 4️⃣ Device rate limit (10 per 5 min)
  const deviceKey = `otp:device:${deviceId}`;
  const deviceCount = await redis.incr(deviceKey);
  if (deviceCount === 1) await redis.expire(deviceKey, 300);
  if (deviceCount > 10) {
    throw { status: 429, message: "Device rate limit exceeded" };
  }

  // 5️⃣ Country rate limit (500 per 5 min)
  const countryKey = `otp:country:${country}`;
  const countryCount = await redis.incr(countryKey);
  if (countryCount === 1) await redis.expire(countryKey, 300);
  if (countryCount > 500) {
    throw { status: 429, message: "Country rate limit exceeded" };
  }

  // 6️⃣ Generate OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

  // 7️⃣ Send SMS FIRST (important)
  try {
    await sendSmsOtp(mobile, otp);
  } catch (err) {
    throw { status: 500, message: "Failed to send OTP SMS" };
  }

  // 8️⃣ Store OTP with 5 min expiry
  await redis.set(
    `otp:${mobile}`,
    JSON.stringify({ otpHash, attempts: 0 }),
    "EX",
    300
  );

  // 9️⃣ Set cooldown 30 sec
  await redis.set(cooldownKey, "1", "EX", 30);

  

  return { message: "OTP sent securely" };
};

export const verifyOtp = async ({ mobile, otp }) => {

  const otpKey = `otp:${mobile}`;
  const data = await redis.get(otpKey);

  if (!data) {
    throw { status: 400, message: "OTP expired or not found" };
  }

  const parsed = JSON.parse(data);

  const hashedOtp = crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");

  if (hashedOtp !== parsed.otpHash) {

    parsed.attempts += 1;

    // Max 3 attempts
    if (parsed.attempts >= 3) {
      await redis.del(otpKey);
      throw { status: 403, message: "Max attempts exceeded" };
    }

    await redis.set(otpKey, JSON.stringify(parsed), "KEEPTTL");

    throw { status: 400, message: "Incorrect OTP" };
  }

  // ✅ Success → delete OTP immediately (prevent reuse)
  await redis.del(otpKey);

  return { message: "OTP verified successfully" };
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

export const logout = async (refreshToken) => {

  const user = await prisma.user.findFirst({
    where: { refreshToken },
  });

  if (!user) {
    throw { status: 400, message: "Invalid refresh token" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: null },
  });

  return { message: "Logged out successfully" };
};