#!/usr/bin/env node

import { prisma } from "../models/db.js";
import { redis } from "../models/redis.js";
import 'dotenv/config';

/**
 * Cleanup expired refresh tokens
 * This script should be run periodically (e.g., daily) via cron job
 */

async function cleanupExpiredTokens() {
  try {
    console.log("🧹 Starting cleanup of expired tokens...\n");

    // 1. Clean up expired refresh tokens from database
    console.log("📊 Cleaning expired refresh tokens from database...");
    const deletedTokens = await prisma.refresh_token.deleteMany({
      where: {
        expires_at: { lt: new Date() },
      },
    });
    console.log(`✅ Deleted ${deletedTokens.count} expired refresh tokens from database\n`);

    // 2. Clean up expired OTPs from database
    console.log("📊 Cleaning expired OTPs from database...");
    const deletedOtps = await prisma.otp.deleteMany({
      where: {
        expires_at: { lt: new Date() },
      },
    });
    console.log(`✅ Deleted ${deletedOtps.count} expired OTPs from database\n`);

    // 3. Clean up Redis keys (optional - Redis has TTL so this is mostly for manual cleanup)
    console.log("📊 Cleaning expired Redis keys...");
    
    // Clean up OTP keys
    const otpKeys = await redis.keys("otp:*");
    const emailOtpKeys = await redis.keys("emailotp:*");
    const allOtpKeys = [...otpKeys, ...emailOtpKeys];
    
    let cleanedRedisKeys = 0;
    for (const key of allOtpKeys) {
      const ttl = await redis.ttl(key);
      if (ttl === -2) { // Key doesn't exist (already expired)
        cleanedRedisKeys++;
      }
    }
    console.log(`✅ Found ${cleanedRedisKeys} expired Redis keys (will auto-delete)\n`);

    // 4. Clean up rate limit keys (optional - they also have TTL)
    const rateLimitKeys = await redis.keys("otp:ip:*");
    const rateLimitKeys2 = await redis.keys("otp:user:*");
    const rateLimitKeys3 = await redis.keys("otp:device:*");
    const allRateLimitKeys = [...rateLimitKeys, ...rateLimitKeys2, ...rateLimitKeys3];
    
    console.log(`📊 Found ${allRateLimitKeys.length} rate limit keys (will auto-delete)\n`);

    // 5. Get statistics
    console.log("📈 Cleanup Statistics:\n");
    
    const totalRefreshTokens = await prisma.refresh_token.count();
    const activeRefreshTokens = await prisma.refresh_token.count({
      where: {
        expires_at: { gt: new Date() },
        revoked: false,
      },
    });
    const revokedTokens = await prisma.refresh_token.count({
      where: {
        revoked: true,
      },
    });

    console.log(`  Total refresh tokens in DB: ${totalRefreshTokens}`);
    console.log(`  Active refresh tokens: ${activeRefreshTokens}`);
    console.log(`  Revoked tokens: ${revokedTokens}`);
    console.log(`  Deleted in this run: ${deletedTokens.count}\n`);

    // 6. Get Redis statistics
    const redisInfo = await redis.info("stats");
    console.log("  Redis stats:", redisInfo.split("\n").slice(0, 5).join("\n  "));

    console.log("\n✅ Cleanup completed successfully!");
    console.log(`⏰ Next cleanup recommended in 24 hours\n`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  }
}

// Run cleanup
cleanupExpiredTokens();