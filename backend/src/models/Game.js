const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  gameType: {
    type: String,
    required: true,
    enum: ['go'],
    default: 'go'
  },
  boardSize: {
    type: Number,
    required: true,
    enum: [9, 13, 19],
    default: 19
  },
  players: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: String,
    color: {
      type: String,
      enum: ['black', 'white'],
      required: true
    },
    rating: Number,
    timeControl: {
      mainTime: Number,
      increment: Number,
      timeRemaining: Number
    }
  }],
  gameState: {
    board: [[String]],
    capturedStones: {
      black: { type: Number, default: 0 },
      white: { type: Number, default: 0 }
    },
    koPosition: {
      x: Number,
      y: Number
    },
    currentPlayer: {
      type: String,
      enum: ['black', 'white'],
      default: 'black'
    },
    moveNumber: { type: Number, default: 0 },
    consecutivePasses: { type: Number, default: 0 }
  },
  moves: [{
    moveNumber: Number,
    player: String,
    position: {
      x: Number,
      y: Number
    },
    capturedStones: Number,
    timeUsed: Number,
    timestamp: { type: Date, default: Date.now }
  }],
  result: {
    winner: {
      type: String,
      enum: ['black', 'white', 'draw']
    },
    method: {
      type: String,
      enum: ['resignation', 'timeout', 'score', 'agreement']
    },
    score: {
      black: Number,
      white: Number
    },
    ratingChanges: {
      type: Map,
      of: Number
    }
  },
  spectators: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    joinedAt: { type: Date, default: Date.now }
  }],
  chat: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
  }],
  settings: {
    timeControl: {
      mainTime: { type: Number, default: 1800 },
      increment: { type: Number, default: 30 }
    },
    isPrivate: { type: Boolean, default: false },
    allowSpectators: { type: Boolean, default: true },
    allowChat: { type: Boolean, default: true }
  },
  status: {
    type: String,
    enum: ['waiting', 'playing', 'finished', 'abandoned'],
    default: 'waiting'
  },
  startedAt: Date,
  finishedAt: Date
}, {
  timestamps: true
});

gameSchema.index({ status: 1 });
gameSchema.index({ gameType: 1 });
gameSchema.index({ boardSize: 1 });
gameSchema.index({ 'players.userId': 1 });
gameSchema.index({ createdAt: -1 });
gameSchema.index({ 
  gameType: 1, 
  status: 1, 
  createdAt: -1 
});
gameSchema.index({ 
  status: 1, 
  gameType: 1, 
  boardSize: 1,
  'settings.isPrivate': 1
});

gameSchema.methods.initializeBoard = function() {
  const size = this.boardSize;
  this.gameState.board = Array(size).fill(null).map(() => Array(size).fill(null));
};

gameSchema.methods.isValidPosition = function(x, y) {
  return x >= 0 && x < this.boardSize && y >= 0 && y < this.boardSize;
};

gameSchema.methods.getStone = function(x, y) {
  if (!this.isValidPosition(x, y)) return null;
  return this.gameState.board[x][y];
};

gameSchema.methods.placeStone = function(x, y, color) {
  if (!this.isValidPosition(x, y)) return false;
  if (this.gameState.board[x][y] !== null) return false;
  
  this.gameState.board[x][y] = color;
  return true;
};

gameSchema.methods.getPlayerByColor = function(color) {
  return this.players.find(p => p.color === color);
};

gameSchema.methods.getOpponentColor = function(color) {
  return color === 'black' ? 'white' : 'black';
};

gameSchema.methods.switchPlayer = function() {
  this.gameState.currentPlayer = this.getOpponentColor(this.gameState.currentPlayer);
};

gameSchema.methods.addMove = function(position, capturedStones = 0, timeUsed = 0) {
  this.moves.push({
    moveNumber: this.gameState.moveNumber + 1,
    player: this.gameState.currentPlayer,
    position,
    capturedStones,
    timeUsed,
    timestamp: new Date()
  });
  
  this.gameState.moveNumber++;
  this.gameState.consecutivePasses = 0;
};

gameSchema.methods.addPass = function(timeUsed = 0) {
  this.moves.push({
    moveNumber: this.gameState.moveNumber + 1,
    player: this.gameState.currentPlayer,
    position: null,
    capturedStones: 0,
    timeUsed,
    timestamp: new Date()
  });
  
  this.gameState.moveNumber++;
  this.gameState.consecutivePasses++;
};

gameSchema.methods.isGameFinished = function() {
  return this.status === 'finished' || this.gameState.consecutivePasses >= 2;
};

module.exports = mongoose.model('Game', gameSchema);
