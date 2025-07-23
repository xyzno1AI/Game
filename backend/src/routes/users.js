const express = require('express');
const Joi = require('joi');
const User = require('../models/User');
const Game = require('../models/Game');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

const updateProfileSchema = Joi.object({
  avatar: Joi.string().uri().optional(),
  displayName: Joi.string().max(50).optional(),
  bio: Joi.string().max(500).optional(),
  country: Joi.string().max(2).optional(),
  timezone: Joi.string().optional()
});

router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      success: true,
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
});

router.put('/profile', authenticateToken, async (req, res, next) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }

    const user = await User.findById(req.user._id);
    
    if (value.avatar) user.profile.avatar = value.avatar;
    if (value.displayName) user.profile.displayName = value.displayName;
    if (value.bio) user.profile.bio = value.bio;
    if (value.country) user.profile.country = value.country;
    if (value.timezone) user.profile.timezone = value.timezone;

    await user.save();

    logger.info(`User profile updated: ${user.username}`);

    res.json({
      success: true,
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/games', authenticateToken, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const gameType = req.query.gameType;
    const skip = (page - 1) * limit;

    const query = {
      'players.userId': req.user._id,
      status: 'finished'
    };

    if (gameType) {
      query.gameType = gameType;
    }

    const games = await Game.find(query)
      .populate('players.userId', 'username profile.level')
      .sort({ finishedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Game.countDocuments(query);

    const gamesWithResults = games.map(game => {
      const userPlayer = game.players.find(p => p.userId._id.toString() === req.user._id.toString());
      const opponent = game.players.find(p => p.userId._id.toString() !== req.user._id.toString());
      
      let userResult = 'draw';
      if (game.result.winner === userPlayer.color) {
        userResult = 'win';
      } else if (game.result.winner !== 'draw') {
        userResult = 'loss';
      }

      return {
        id: game._id,
        gameType: game.gameType,
        boardSize: game.boardSize,
        opponent: opponent ? {
          id: opponent.userId._id,
          username: opponent.userId.username,
          level: opponent.userId.profile.level
        } : null,
        result: {
          userResult,
          winner: game.result.winner,
          method: game.result.method,
          score: game.result.score
        },
        duration: game.finishedAt ? Math.floor((game.finishedAt - game.startedAt) / 1000) : 0,
        startTime: game.startedAt,
        endTime: game.finishedAt,
        ratingChange: game.result.ratingChanges?.get(req.user._id.toString()) || 0
      };
    });

    res.json({
      success: true,
      data: {
        games: gamesWithResults,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/stats', authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const gameType = req.query.gameType || 'go';

    const stats = user.gameStats[gameType] || {
      totalGames: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      rating: 1500,
      ratingHistory: [],
      bestWinStreak: 0,
      currentWinStreak: 0,
      favoriteBoard: 19,
      averageGameTime: 0
    };

    const winRate = stats.totalGames > 0 ? (stats.wins / stats.totalGames * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        stats: {
          ...stats,
          winRate: parseFloat(winRate)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/leaderboard', async (req, res, next) => {
  try {
    const gameType = req.query.gameType || 'go';
    const limit = parseInt(req.query.limit) || 50;

    const users = await User.find({})
      .select(`username profile.level gameStats.${gameType}`)
      .sort({ [`gameStats.${gameType}.rating`]: -1 })
      .limit(limit);

    const leaderboard = users
      .filter(user => user.gameStats[gameType] && user.gameStats[gameType].totalGames > 0)
      .map((user, index) => ({
        rank: index + 1,
        username: user.username,
        level: user.profile.level,
        rating: user.gameStats[gameType].rating,
        totalGames: user.gameStats[gameType].totalGames,
        winRate: user.gameStats[gameType].totalGames > 0 ? 
          (user.gameStats[gameType].wins / user.gameStats[gameType].totalGames * 100).toFixed(1) : 0
      }));

    res.json({
      success: true,
      data: {
        leaderboard
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
