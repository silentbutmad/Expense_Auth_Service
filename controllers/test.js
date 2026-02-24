import { redis } from "../models/redis.js";

async function test() {
  await redis.set("test:key", "hello", "EX", 10);

  const value = await redis.get("test:key");

  console.log("Value from Redis:", value);
}

test();