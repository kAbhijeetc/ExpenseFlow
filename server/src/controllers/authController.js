import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Category, DEFAULT_CATEGORIES } from '../models/Category.js';

const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'fallback_development_secret_key_32_characters_minimum';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ userId }, secret, { expiresIn });
};

const sendAuthResponse = (res, statusCode, user, message = 'Success') => {
  const token = generateToken(user._id);

  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return res.status(statusCode).json({
    success: true,
    message,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      currency: user.currency,
      monthlyIncomeTarget: user.monthlyIncomeTarget,
      theme: user.theme,
      createdAt: user.createdAt,
    },
  });
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, currency, monthlyIncomeTarget } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists',
      });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name,
      email,
      passwordHash,
      currency: currency || 'INR',
      monthlyIncomeTarget: monthlyIncomeTarget || 0,
      theme: 'light',
    });

    // Seed default categories for new user
    const defaultCategoriesToInsert = DEFAULT_CATEGORIES.map((cat) => ({
      ...cat,
      userId: user._id,
    }));
    await Category.insertMany(defaultCategoriesToInsert);

    return sendAuthResponse(res, 201, user, 'User registered successfully');
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    return sendAuthResponse(res, 200, user, 'Logged in successfully');
  } catch (error) {
    next(error);
  }
};

export const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  });
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

export const getMe = (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};
