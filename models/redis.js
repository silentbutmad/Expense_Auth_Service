import Redis from "ioredis";
import 'dotenv/config'
export const redis = new Redis(process.env.REDIS_URL, {
  tls: {}
});

redis.on("connect", () => {
  console.log("✅ Redis connected (Upstash)");
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err);
});