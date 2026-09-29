const env = require('../config/env');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  let statusCode = err.statusCode || 500;

  // Log error during development
  if (!env.isProduction && process.env.NODE_ENV !== 'test') {
    console.error(`[Error] ${err.name}: ${err.message}`);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    error.message = `Resource not found or invalid identifier format: ${err.value}`;
  }

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error.message = `A record with that ${field} already exists.`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors).map((val) => val.message);
    error.message = messages.join('. ');
  }

  // JSON parse error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    error.message = 'Malformed JSON payload in request.';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    error.message = 'Invalid authentication token.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    error.message = 'Authentication token has expired. Please log in again.';
  }

  res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(env.nodeEnv === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
