export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = { ...err };
  error.message = err.message;

  // Handle Prisma generic errors (simplified for this scope)
  if (err.code === 'P2002') {
    const target = err.meta?.target || 'field';
    error.statusCode = 400;
    error.message = `Duplicate field value entered for ${target}. Please use another value!`;
  }

  // Handle express-validator errors logic if tossed down, though usually handled inline.
  // Standard response
  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
