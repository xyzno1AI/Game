const Game = require('../models/Game');
const User = require('../models/User');
const GoEngine = require('./GoEngine');
const { getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');

class GameService {
  constructor() {
    this.activeGames = new Map();
  }

  async createGame(creatorId, gameData) {
    try {
      const creator = await User.findById(creatorId);
      if (!creator) {
        throw new Error('Creator not found');
      }

      const game = new Game({
        gameType: gameData.gameType || 'go',
        boardSize: gameData.boardSize || 19,
        players: [{
          userId: creatorId,
          username: creator.username,
          color: 'black',
          rating: creator.gameStats.go.rating,
          timeControl: {
            mainTime: gameData.timeControl?.mainTime || 1800,
            increment: gameData.timeControl?.increment || 30,
            timeRemaining: gameData.timeControl?.mainTime || 1800
          }
        }],
        settings: {
          timeControl: gameData.timeControl || { mainTime: 1800, increment: 30 },
          isPrivate: gameData.isPrivate || false,
          allowSpectators: gameData.allowSpectators !== false,
          allowChat: gameData.allowChat !== false
        }
      });

      game.initializeBoard();
      await game.save();

      const goEngine = new GoEngine(game.boardSize);
      this.activeGames.set(game._id.toString(), goEngine);

      await this.cacheGameState(game._id.toString(), game);

      logger.info(`Game created: ${game._id} by ${creator.username}`);
      return game;
    } catch (error) {
      logger.error('Error creating game:', error);
      throw error;
    }
  }

  async joinGame(gameId, userId) {
    try {
      const game = await Game.findById(gameId);
      if (!game) {
        throw new Error('Game not found');
      }

      if (game.status !== 'waiting') {
        throw new Error('Game is not accepting players');
      }

      if (game.players.length >= 2) {
        throw new Error('Game is full');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (game.players.some(p => p.userId.toString() === userId)) {
        throw new Error('User already in game');
      }

      game.players.push({
        userId,
        username: user.username,
        color: 'white',
        rating: user.gameStats.go.rating,
        timeControl: {
          mainTime: game.settings.timeControl.mainTime,
          increment: game.settings.timeControl.increment,
          timeRemaining: game.settings.timeControl.mainTime
        }
      });

      game.status = 'playing';
      game.startedAt = new Date();
      await game.save();

      await this.cacheGameState(gameId, game);

      logger.info(`User ${user.username} joined game ${gameId}`);
      return game;
    } catch (error) {
      logger.error('Error joining game:', error);
      throw error;
    }
  }

  async makeMove(gameId, userId, position) {
    try {
      const game = await Game.findById(gameId);
      if (!game) {
        throw new Error('Game not found');
      }

      if (game.status !== 'playing') {
        throw new Error('Game is not active');
      }

      const player = game.players.find(p => p.userId.toString() === userId);
      if (!player) {
        throw new Error('Player not in game');
      }

      if (player.color !== game.gameState.currentPlayer) {
        throw new Error('Not your turn');
      }

      const goEngine = this.activeGames.get(gameId);
      if (!goEngine) {
        throw new Error('Game engine not found');
      }

      const result = goEngine.placeStone(position.x, position.y, player.color);
      if (!result.success) {
        throw new Error(result.error);
      }

      game.addMove(position, result.capturedStones);
      game.gameState.board = goEngine.board;
      game.gameState.capturedStones = goEngine.capturedStones;
      game.gameState.koPosition = goEngine.koPosition;
      game.switchPlayer();

      await game.save();
      await this.cacheGameState(gameId, game);

      logger.info(`Move made in game ${gameId}: ${position.x},${position.y} by ${player.username}`);
      return { game, move: game.moves[game.moves.length - 1] };
    } catch (error) {
      logger.error('Error making move:', error);
      throw error;
    }
  }

  async passMove(gameId, userId) {
    try {
      const game = await Game.findById(gameId);
      if (!game) {
        throw new Error('Game not found');
      }

      if (game.status !== 'playing') {
        throw new Error('Game is not active');
      }

      const player = game.players.find(p => p.userId.toString() === userId);
      if (!player) {
        throw new Error('Player not in game');
      }

      if (player.color !== game.gameState.currentPlayer) {
        throw new Error('Not your turn');
      }

      game.addPass();
      game.switchPlayer();

      if (game.gameState.consecutivePasses >= 2) {
        await this.endGameByScore(game);
      }

      await game.save();
      await this.cacheGameState(gameId, game);

      logger.info(`Pass move in game ${gameId} by ${player.username}`);
      return game;
    } catch (error) {
      logger.error('Error passing move:', error);
      throw error;
    }
  }

  async resignGame(gameId, userId) {
    try {
      const game = await Game.findById(gameId);
      if (!game) {
        throw new Error('Game not found');
      }

      if (game.status !== 'playing') {
        throw new Error('Game is not active');
      }

      const player = game.players.find(p => p.userId.toString() === userId);
      if (!player) {
        throw new Error('Player not in game');
      }

      const winner = game.getOpponentColor(player.color);
      
      game.result = {
        winner,
        method: 'resignation'
      };
      
      game.status = 'finished';
      game.finishedAt = new Date();

      await this.updatePlayerStats(game);
      await game.save();
      await this.cacheGameState(gameId, game);

      this.activeGames.delete(gameId);

      logger.info(`Game ${gameId} ended by resignation: ${player.username} resigned`);
      return game;
    } catch (error) {
      logger.error('Error resigning game:', error);
      throw error;
    }
  }

  async endGameByScore(game) {
    const goEngine = this.activeGames.get(game._id.toString());
    if (!goEngine) {
      throw new Error('Game engine not found');
    }

    const score = goEngine.calculateScore();
    
    let winner;
    if (score.black > score.white) {
      winner = 'black';
    } else if (score.white > score.black) {
      winner = 'white';
    } else {
      winner = 'draw';
    }

    game.result = {
      winner,
      method: 'score',
      score
    };

    game.status = 'finished';
    game.finishedAt = new Date();

    await this.updatePlayerStats(game);
    this.activeGames.delete(game._id.toString());
  }

  async updatePlayerStats(game) {
    const ratingChanges = this.calculateRatingChanges(game);
    
    for (const player of game.players) {
      const user = await User.findById(player.userId);
      if (!user) continue;

      const stats = user.gameStats.go;
      stats.totalGames++;

      if (game.result.winner === player.color) {
        stats.wins++;
        stats.currentWinStreak++;
        stats.bestWinStreak = Math.max(stats.bestWinStreak, stats.currentWinStreak);
      } else if (game.result.winner === 'draw') {
        stats.draws++;
        stats.currentWinStreak = 0;
      } else {
        stats.losses++;
        stats.currentWinStreak = 0;
      }

      const ratingChange = ratingChanges[player.userId.toString()] || 0;
      stats.rating += ratingChange;
      stats.rating = Math.max(100, Math.min(3000, stats.rating));

      stats.ratingHistory.push({
        date: new Date(),
        rating: stats.rating
      });

      const gameDuration = (game.finishedAt - game.startedAt) / 1000;
      stats.averageGameTime = (stats.averageGameTime * (stats.totalGames - 1) + gameDuration) / stats.totalGames;

      await user.save();
    }

    game.result.ratingChanges = ratingChanges;
  }

  calculateRatingChanges(game) {
    const changes = {};
    
    if (game.players.length !== 2) return changes;

    const [player1, player2] = game.players;
    const rating1 = player1.rating;
    const rating2 = player2.rating;

    const expected1 = 1 / (1 + Math.pow(10, (rating2 - rating1) / 400));
    const expected2 = 1 - expected1;

    let actual1, actual2;
    if (game.result.winner === player1.color) {
      actual1 = 1;
      actual2 = 0;
    } else if (game.result.winner === player2.color) {
      actual1 = 0;
      actual2 = 1;
    } else {
      actual1 = 0.5;
      actual2 = 0.5;
    }

    const kFactor = 32;
    const change1 = Math.round(kFactor * (actual1 - expected1));
    const change2 = Math.round(kFactor * (actual2 - expected2));

    changes[player1.userId.toString()] = change1;
    changes[player2.userId.toString()] = change2;

    return changes;
  }

  async addSpectator(gameId, userId) {
    try {
      const game = await Game.findById(gameId);
      if (!game) {
        throw new Error('Game not found');
      }

      if (!game.settings.allowSpectators) {
        throw new Error('Spectators not allowed');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (game.spectators.some(s => s.userId.toString() === userId)) {
        throw new Error('User already spectating');
      }

      if (game.players.some(p => p.userId.toString() === userId)) {
        throw new Error('Player cannot spectate own game');
      }

      game.spectators.push({
        userId,
        username: user.username,
        joinedAt: new Date()
      });

      await game.save();
      await this.cacheGameState(gameId, game);

      logger.info(`User ${user.username} joined as spectator in game ${gameId}`);
      return game;
    } catch (error) {
      logger.error('Error adding spectator:', error);
      throw error;
    }
  }

  async removeSpectator(gameId, userId) {
    try {
      const game = await Game.findById(gameId);
      if (!game) {
        throw new Error('Game not found');
      }

      game.spectators = game.spectators.filter(s => s.userId.toString() !== userId);
      await game.save();
      await this.cacheGameState(gameId, game);

      return game;
    } catch (error) {
      logger.error('Error removing spectator:', error);
      throw error;
    }
  }

  async getGameState(gameId) {
    try {
      const cached = await this.getCachedGameState(gameId);
      if (cached) return cached;

      const game = await Game.findById(gameId)
        .populate('players.userId', 'username profile.level gameStats.go.rating')
        .populate('spectators.userId', 'username');

      if (!game) {
        throw new Error('Game not found');
      }

      await this.cacheGameState(gameId, game);
      return game;
    } catch (error) {
      logger.error('Error getting game state:', error);
      throw error;
    }
  }

  async getActiveGames(filters = {}) {
    try {
      const query = { status: 'waiting' };
      
      if (filters.gameType) query.gameType = filters.gameType;
      if (filters.boardSize) query.boardSize = filters.boardSize;
      if (filters.isPrivate !== undefined) query['settings.isPrivate'] = filters.isPrivate;

      const games = await Game.find(query)
        .populate('players.userId', 'username profile.level gameStats.go.rating')
        .sort({ createdAt: -1 })
        .limit(50);

      return games;
    } catch (error) {
      logger.error('Error getting active games:', error);
      throw error;
    }
  }

  async cacheGameState(gameId, game) {
    try {
      const redis = getRedisClient();
      await redis.setEx(`game:${gameId}`, 7200, JSON.stringify(game));
    } catch (error) {
      logger.error('Error caching game state:', error);
    }
  }

  async getCachedGameState(gameId) {
    try {
      const redis = getRedisClient();
      const cached = await redis.get(`game:${gameId}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Error getting cached game state:', error);
      return null;
    }
  }
}

module.exports = GameService;
