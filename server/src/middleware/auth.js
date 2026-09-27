// middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) throw new AppError('Not authenticated', 401);

  const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  if (!user) throw new AppError('User no longer exists', 401);

  req.user = user;
  next();
});