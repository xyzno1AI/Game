const express = require('express');
const Joi = require('joi');
const GameService = require('../services/GameService');
const AIService = require('../services/AIService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const gameService = new GameService();
const aiService = new AIService();

const createGameSchema = Joi.object({
  gameType: Joi.string().valid('go').default('go'),
  boardSize: Joi.number().valid(9, 13, 19).default(19),
  timeControl: Joi.object({
    mainTime: Joi.number().min(60).max(7200).default(1800),
    increment: Joi.number().min(0).max(300).default(30)
  }).optional(),
  isPrivate: Joi.boolean().default(false),
  allowSpectators: Joi.boolean().default(true),
  allowChat: Joi.boolean().default(true)
});

const createAIGameSchema = Joi.object({
  boardSize: Joi.number().valid(9, 13, 19).default(19),
  aiDifficulty: Joi.number().min(1).max(10).default(5),
  playerColor: Joi.string().valid('black', 'white').default('black')
});

const moveSchema = Joi.object({
  position: Joi.object({
    x: Joi.number().min(0).required(),
    y: Joi.number().min(0).required()
  }).required()
});

router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { error, value } = createGameSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }

    const game = await gameService.createGame(req.user._id, value);

    res.status(201).json({
      success: true,
      data: {
        game
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/ai', authenticateToken, async (req, res, next) => {
  try {
    const { error, value } = createAIGameSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }

    const gameData = {
      gameType: 'go',
      boardSize: value.boardSize,
      timeControl: { mainTime: 1800, increment: 30 },
      isPrivate: true,
      allowSpectators: false
    };

    const game = await gameService.createGame(req.user._id, gameData);

    game.players[0].color = value.playerColor;
    game.players.push({
      userId: 'ai_bot',
      username: `AI Bot (Level ${value.aiDifficulty})`,
      color: value.playerColor === 'black' ? 'white' : 'black',
      rating: 1500 + (value.aiDifficulty - 5) * 100,
      timeControl: {
        mainTime: 1800,
        increment: 30,
        timeRemaining: 1800
      }
    });

    game.status = 'playing';
    game.startedAt = new Date();
    game.aiDifficulty = value.aiDifficulty;
    
    await game.save();

    res.status(201).json({
      success: true,
      data: {
        game
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:gameId/join', authenticateToken, async (req, res, next) => {
  try {
    const game = await gameService.joinGame(req.params.gameId, req.user._id);

    res.json({
      success: true,
      data: {
        game,
        playerColor: game.players.find(p => p.userId.toString() === req.user._id.toString())?.color,
        role: 'player'
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:gameId/spectate', authenticateToken, async (req, res, next) => {
  try {
    const game = await gameService.addSpectator(req.params.gameId, req.user._id);

    res.json({
      success: true,
      data: {
        game,
        role: 'spectator'
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:gameId', authenticateToken, async (req, res, next) => {
  try {
    const game = await gameService.getGameState(req.params.gameId);

    res.json({
      success: true,
      data: {
        game
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:gameId/move', authenticateToken, async (req, res, next) => {
  try {
    const { error, value } = moveSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }

    const result = await gameService.makeMove(req.params.gameId, req.user._id, value.position);

    res.json({
      success: true,
      data: {
        move: result.move,
        gameState: result.game
      }
    });
  } catch (error) {
    if (error.message.includes('Invalid') || error.message.includes('Not your turn') || error.message.includes('occupied')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MOVE',
          message: error.message,
          details: { position: req.body.position }
        }
      });
    }
    next(error);
  }
});

router.post('/:gameId/pass', authenticateToken, async (req, res, next) => {
  try {
    const game = await gameService.passMove(req.params.gameId, req.user._id);

    res.json({
      success: true,
      data: {
        gameState: game,
        consecutivePasses: game.gameState.consecutivePasses
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:gameId/resign', authenticateToken, async (req, res, next) => {
  try {
    const game = await gameService.resignGame(req.params.gameId, req.user._id);

    res.json({
      success: true,
      data: {
        result: {
          winner: game.result.winner,
          method: game.result.method,
          resignedPlayer: game.players.find(p => p.userId.toString() === req.user._id.toString())?.color
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:gameId/hint', authenticateToken, async (req, res, next) => {
  try {
    const game = await gameService.getGameState(req.params.gameId);
    
    if (!game) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'GAME_NOT_FOUND',
          message: 'Game not found'
        }
      });
    }

    const hint = await aiService.suggestMove(game.gameState.board, game.boardSize, true);

    res.json({
      success: true,
      data: {
        hint
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const filters = {
      gameType: req.query.gameType,
      boardSize: req.query.boardSize ? parseInt(req.query.boardSize) : undefined,
      isPrivate: req.query.isPrivate === 'true' ? true : req.query.isPrivate === 'false' ? false : undefined
    };

    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

    const games = await gameService.getActiveGames(filters);

    res.json({
      success: true,
      data: {
        games
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
