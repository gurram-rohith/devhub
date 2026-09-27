// controllers/auth.js
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import generateToken from '../utils/generateToken.js';

const sendAuth = (res, statusCode, user) =>
  res.status(statusCode).json({
    success: true,
    token: generateToken(user._id),
    user: { id: user._id, name: user.name, email: user.email },
  });

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.findOne({ email })) throw new AppError('Email already registered', 409);
  const user = await User.create({ name, email, password });
  sendAuth(res, 201, user);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    throw new AppError('Invalid email or password', 401); // same message for both cases
  }
  sendAuth(res, 200, user);
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});