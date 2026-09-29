class ErrorHandler extends Error {
  constructor(message, statusCode, errors = null) {
    super(message);

    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export const errorMiddleware = (err, req, res, next) => {
  let error = err;

  // PostgreSQL Unique Constraint Error
  if (err.code === "23505") {
    error = new ErrorHandler("Duplicate field value entered", 409);
  }

  // PostgreSQL Foreign Key Constraint Error
  if (err.code === "23503") {
    error = new ErrorHandler("Related resource not found", 400);
  }

  // Invalid JWT
  if (err.name === "JsonWebTokenError") {
    error = new ErrorHandler("Invalid token", 401);
  }

  // Expired JWT
  if (err.name === "TokenExpiredError") {
    error = new ErrorHandler("Token expired", 401);
  }

  const statusCode = error.statusCode || 500;

  // Only log unexpected server errors
  if (statusCode >= 500) {
    console.error(error);
  }

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode >= 500
        ? "Internal Server Error"
        : error.message || "Something went wrong",

    ...(error.errors && { errors: error.errors }),
  });
};


export default ErrorHandler;