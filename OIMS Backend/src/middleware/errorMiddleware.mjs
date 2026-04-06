// Centralized error handling middleware


// General error handler
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  // Multer errors may be thrown in upload flows
  if (err && err.name === "MulterError") {
    return res.status(400).json({
      success: false,
      message: "File upload failed",
      error: err.message,
      code: err.code,
    });
  }

  const status = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";

  // Avoid leaking stack traces in production
  const includeStack = process.env.NODE_ENV !== "production";

  res.status(status).json({
    success: false,
    message,
    ...(includeStack ? { stack: err.stack } : {}),
  });
};
