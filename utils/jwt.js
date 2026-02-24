import jwt from "jsonwebtoken";

export const generateAccessToken = (user) =>
  jwt.sign(
    { user_id: user.user_id },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );

export const generateRefreshToken = (user) =>
  jwt.sign(
    { user_id: user.user_id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );