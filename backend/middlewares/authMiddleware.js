import ErrorHandler from "./errorMiddleware.js";
import asyncErrorsHandler from "./asyncErrorsHandler.js";
import { verifyAccessToken } from "../utils/jwtToken.js";

export const isAuthenticated = asyncErrorsHandler(async(req, res, next) => {
  
    try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(
        new ErrorHandler("Please login to access this resource.", 401)
      );
    }

    const token = authHeader.split(" ")[1];

    const decoded = verifyAccessToken(token);

    req.user = {
      user_id: decoded.user_id,
      role: decoded.role,
    };

    next();

  } catch (error) {
    return next(
      new ErrorHandler("Invalid or expired access token.", 401)
    );
  }
})


export const authorizedRoles = (...roles) => {
  return (req, res, next) => {

    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ErrorHandler("You are not authorized to access this resource.", 403)
      );
    }

    next();
  };
};