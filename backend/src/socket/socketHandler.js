const jwt = require('jsonwebtoken');
const User = require('../models/User');
const GameService = require('../services/GameService');
const AIService = require('../services/AIService');
const { getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');

const gameService = new GameService();
const aiService = new AIService();

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-passwordHash');
    
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user._id.toString();
    socket.username = user.username;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
};

const handleConnection = (io) => {
  return async (socket) => {
    logger.info(`User connected: ${socket.username} (${socket.userId})`);

    try {
      const redis = getRedisClient();
      await redis.sAdd('online_users', socket.userId);
      
      socket.broadcast.emit('user:online', {
        userId: socket.userId,
        username: socket.username
      });
    } catch (error) {
      logger.error('Error updating online users:', error);
    }

    socket.on('game:join', async (data) => {
      try {
        const { gameId } = data;
        const game = await gameService.getGameState(gameId);
        
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        const isPlayer = game.players.some(p => p.userId.toString() === socket.userId);
        const isSpectator = game.spectators.some(s => s.userId.toString() === socket.userId);

        if (!isPlayer && !isSpectator) {
          if (game.players.length < 2) {
            await gameService.joinGame(gameId, socket.userId);
          } else if (game.settings.allowSpectators) {
            await gameService.addSpectator(gameId, socket.userId);
          } else {
            socket.emit('error', { message: 'Cannot join game' });
            return;
          }
        }

        socket.join(gameId);
        socket.currentGame = gameId;

        const updatedGame = await gameService.getGameState(gameId);
        io.to(gameId).emit('game:update', updatedGame);

        if (isPlayer) {
          socket.emit('game:joined', {
            game: updatedGame,
            role: 'player',
            color: updatedGame.players.find(p => p.userId.toString() === socket.userId)?.color
          });
        } else {
          socket.emit('game:joined', {
            game: updatedGame,
            role: 'spectator'
          });
        }

        logger.info(`User ${socket.username} joined game ${gameId}`);
      } catch (error) {
        logger.error('Error joining game:', error);
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('game:move', async (data) => {
      try {
        const { gameId, move } = data;
        
        if (!socket.currentGame || socket.currentGame !== gameId) {
          socket.emit('error', { message: 'Not in game' });
          return;
        }

        const result = await gameService.makeMove(gameId, socket.userId, move.position);
        
        io.to(gameId).emit('game:move', {
          move: result.move,
          player: socket.username,
          gameState: result.game
        });

        if (result.game.isGameFinished()) {
          io.to(gameId).emit('game:end', result.game.result);
        } else {
          await handleAIMove(gameId, result.game, io);
        }

        logger.info(`Move made in game ${gameId}: ${move.position.x},${move.position.y} by ${socket.username}`);
      } catch (error) {
        logger.error('Error making move:', error);
        socket.emit('move:invalid', { error: error.message });
      }
    });

    socket.on('game:pass', async (data) => {
      try {
        const { gameId } = data;
        
        if (!socket.currentGame || socket.currentGame !== gameId) {
          socket.emit('error', { message: 'Not in game' });
          return;
        }

        const game = await gameService.passMove(gameId, socket.userId);
        
        io.to(gameId).emit('game:pass', {
          player: socket.username,
          gameState: game
        });

        if (game.isGameFinished()) {
          io.to(gameId).emit('game:end', game.result);
        } else {
          await handleAIMove(gameId, game, io);
        }

        logger.info(`Pass move in game ${gameId} by ${socket.username}`);
      } catch (error) {
        logger.error('Error passing move:', error);
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('game:resign', async (data) => {
      try {
        const { gameId } = data;
        
        if (!socket.currentGame || socket.currentGame !== gameId) {
          socket.emit('error', { message: 'Not in game' });
          return;
        }

        const game = await gameService.resignGame(gameId, socket.userId);
        
        io.to(gameId).emit('game:resign', {
          player: socket.username,
          result: game.result
        });

        io.to(gameId).emit('game:end', game.result);

        logger.info(`Game ${gameId} ended by resignation: ${socket.username} resigned`);
      } catch (error) {
        logger.error('Error resigning game:', error);
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('chat:message', async (data) => {
      try {
        const { gameId, message } = data;
        
        if (!socket.currentGame || socket.currentGame !== gameId) {
          socket.emit('error', { message: 'Not in game' });
          return;
        }

        const game = await gameService.getGameState(gameId);
        if (!game.settings.allowChat) {
          socket.emit('error', { message: 'Chat not allowed' });
          return;
        }

        const chatMessage = {
          userId: socket.userId,
          username: socket.username,
          message: message.trim(),
          timestamp: new Date()
        };

        game.chat.push(chatMessage);
        await game.save();

        io.to(gameId).emit('chat:message', chatMessage);

        logger.info(`Chat message in game ${gameId} by ${socket.username}: ${message}`);
      } catch (error) {
        logger.error('Error sending chat message:', error);
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('game:leave', async (data) => {
      try {
        const { gameId } = data;
        
        if (socket.currentGame === gameId) {
          socket.leave(gameId);
          socket.currentGame = null;

          await gameService.removeSpectator(gameId, socket.userId);
          
          const updatedGame = await gameService.getGameState(gameId);
          io.to(gameId).emit('game:update', updatedGame);

          socket.emit('game:left', { gameId });
        }
      } catch (error) {
        logger.error('Error leaving game:', error);
      }
    });

    socket.on('disconnect', async () => {
      try {
        const redis = getRedisClient();
        await redis.sRem('online_users', socket.userId);
        
        socket.broadcast.emit('user:offline', {
          userId: socket.userId,
          username: socket.username
        });

        if (socket.currentGame) {
          socket.to(socket.currentGame).emit('player:disconnected', {
            userId: socket.userId,
            username: socket.username
          });

          setTimeout(async () => {
            try {
              const isStillConnected = await redis.sIsMember('online_users', socket.userId);
              if (!isStillConnected && socket.currentGame) {
                const game = await gameService.getGameState(socket.currentGame);
                if (game && game.status === 'playing') {
                  const player = game.players.find(p => p.userId.toString() === socket.userId);
                  if (player) {
                    await gameService.resignGame(socket.currentGame, socket.userId);
                    io.to(socket.currentGame).emit('game:timeout', {
                      player: socket.username,
                      reason: 'disconnection'
                    });
                  }
                }
              }
            } catch (error) {
              logger.error('Error handling disconnection timeout:', error);
            }
          }, 30000);
        }

        logger.info(`User disconnected: ${socket.username} (${socket.userId})`);
      } catch (error) {
        logger.error('Error handling disconnect:', error);
      }
    });
  };
};

const handleAIMove = async (gameId, game, io) => {
  try {
    if (!game.aiDifficulty) return;

    const aiPlayer = game.players.find(p => p.userId === 'ai_bot');
    if (!aiPlayer || aiPlayer.color !== game.gameState.currentPlayer) return;

    io.to(gameId).emit('ai:thinking', { player: aiPlayer.username });

    const aiMove = await aiService.generateMove(
      game.gameState.board,
      game.boardSize,
      game.aiDifficulty
    );

    if (aiMove.isPass) {
      const updatedGame = await gameService.passMove(gameId, 'ai_bot');
      
      io.to(gameId).emit('game:pass', {
        player: aiPlayer.username,
        gameState: updatedGame
      });

      if (updatedGame.isGameFinished()) {
        io.to(gameId).emit('game:end', updatedGame.result);
      }
    } else {
      const result = await gameService.makeMove(gameId, 'ai_bot', aiMove.position);
      
      io.to(gameId).emit('game:move', {
        move: result.move,
        player: aiPlayer.username,
        gameState: result.game,
        aiExplanation: aiMove.explanation
      });

      if (result.game.isGameFinished()) {
        io.to(gameId).emit('game:end', result.game.result);
      }
    }
  } catch (error) {
    logger.error('Error handling AI move:', error);
  }
};

module.exports = (io) => {
  io.use(authenticateSocket);
  io.on('connection', handleConnection(io));
};
