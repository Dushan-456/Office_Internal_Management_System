export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = { ...err };
  error.message = err.message;

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue).join(', ');
    error.statusCode = 400;
    error.message = `Duplicate field value entered for ${field}. Please use another value!`;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    error.statusCode = 400;
    error.message = messages.join('. ');
  }

  // Handle Mongoose bad ObjectId (CastError)
  if (err.name === 'CastError') {
    error.statusCode = 400;
    error.message = `Invalid ${err.path}: ${err.value}`;
  }

  // Standard response
  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
