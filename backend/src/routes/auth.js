const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(20).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(50).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required()
});

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

router.post('/register', async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }

    const { username, email, password } = value;

    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      const field = existingUser.username === username ? 'username' : 'email';
      return res.status(400).json({
        success: false,
        error: {
          code: field === 'username' ? 'USERNAME_EXISTS' : 'EMAIL_EXISTS',
          message: `${field} already exists`
        }
      });
    }

    const user = new User({
      username,
      email,
      passwordHash: password,
      permissions: ['user']
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    logger.info(`User registered: ${username}`);

    res.status(201).json({
      success: true,
      data: {
        user: user.toJSON(),
        token,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }

    const { username, password } = value;

    const user = await User.findOne({
      $or: [{ username }, { email: username }]
    });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid username or password'
        }
      });
    }

    user.lastLoginAt = new Date();
    user.lastActiveAt = new Date();
    
    user.loginHistory.push({
      timestamp: new Date(),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    if (user.loginHistory.length > 10) {
      user.loginHistory = user.loginHistory.slice(-10);
    }

    await user.save();

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    logger.info(`User logged in: ${username}`);

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        token,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const refreshToken = authHeader && authHeader.split(' ')[1];

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Refresh token required'
        }
      });
    }

    logger.info(`Attempting to verify refresh token: ${refreshToken.substring(0, 20)}...`);
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    logger.info(`Refresh token verified for user: ${decoded.userId}`);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'User not found'
        }
      });
    }

    const newToken = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    const newRefreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Refresh token expired'
        }
      });
    }
    next(error);
  }
});

router.post('/logout', authenticateToken, async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

router.get('/me', authenticateToken, async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user.toJSON()
    }
  });
});

module.exports = router;
