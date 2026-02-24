import crypto from "crypto";

export const generateOTP = () =>
  crypto.randomInt(100000, 999999).toString();