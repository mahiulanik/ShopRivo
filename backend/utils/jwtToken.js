import jwt from "jsonwebtoken";
import crypto from "crypto";

export const generateAccessToken = (user_id, role) => {
  return jwt.sign(
    { user_id, role },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
      algorithm: "HS256",
    }
  );
};

export const generateRefreshToken = (user_id) => {
  return jwt.sign(
    // jti keeps every token unique: refresh_sessions.token_hash is UNIQUE,
    // and two logins within the same second would otherwise collide
    { user_id, jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "15d",
      algorithm: "HS256",
    }
  );
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET,
    {
        algorithms: ["HS256"],
        }
    );
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET,
    {
        algorithms: ["HS256"],
        }
    );
};