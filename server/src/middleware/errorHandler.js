import AppError from '../utils/AppError.js';

const errorHandler = (err, req, res, next) => {
  if (err.name === 'ValidationError') {
    err = new AppError(Object.values(err.errors).map(e => e.message).join(', '), 400);
  } else if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    err = new AppError(`${field} already exists`, 409);
  } else if (err.name === 'CastError') {
    err = new AppError(`Invalid ${err.path}`, 400);
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    err = new AppError('Invalid or expired token', 401);
  }

  const statusCode = err.statusCode || 500;
  if (statusCode === 500) console.error(err);

  res.status(statusCode).json({
    success: false,
    message: err.isOperational ? err.message : 'Something went wrong',
  });
};

export default errorHandler;