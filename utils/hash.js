import crypto from "crypto";

export const hashString = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");