const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
    match: /^[a-zA-Z0-9_]+$/
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  passwordHash: {
    type: String,
    required: true,
    minlength: 6
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  profile: {
    avatar: {
      type: String,
      default: ''
    },
    displayName: {
      type: String,
      default: ''
    },
    level: {
      type: Number,
      default: 1
    },
    experience: {
      type: Number,
      default: 0
    },
    title: {
      type: String,
      default: '新手'
    },
    bio: {
      type: String,
      default: '',
      maxlength: 500
    },
    country: {
      type: String,
      default: ''
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  gameStats: {
    go: {
      totalGames: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      draws: { type: Number, default: 0 },
      rating: { type: Number, default: 1500 },
      ratingHistory: [{
        date: Date,
        rating: Number
      }],
      bestWinStreak: { type: Number, default: 0 },
      currentWinStreak: { type: Number, default: 0 },
      favoriteBoard: { type: Number, default: 19 },
      averageGameTime: { type: Number, default: 0 }
    }
  },
  achievements: [{
    id: String,
    unlockedAt: Date,
    title: String,
    description: String
  }],
  permissions: [{
    type: String,
    enum: ['user', 'verified', 'vip', 'admin'],
    default: 'user'
  }],
  preferences: {
    language: { type: String, default: 'zh-CN' },
    theme: { type: String, default: 'light' },
    soundEnabled: { type: Boolean, default: true },
    notifications: {
      gameInvites: { type: Boolean, default: true },
      gameUpdates: { type: Boolean, default: true },
      achievements: { type: Boolean, default: true }
    }
  },
  loginHistory: [{
    timestamp: Date,
    ip: String,
    userAgent: String
  }],
  lastLoginAt: Date,
  lastActiveAt: Date
}, {
  timestamps: true
});

userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ 'profile.level': -1 });
userSchema.index({ 'gameStats.go.rating': -1 });
userSchema.index({ lastActiveAt: -1 });

userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  
  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.calculateLevel = function() {
  const experience = this.profile.experience;
  return Math.floor(Math.sqrt(experience / 100)) + 1;
};

userSchema.methods.getWinRate = function() {
  const stats = this.gameStats.go;
  if (stats.totalGames === 0) return 0;
  return (stats.wins / stats.totalGames * 100).toFixed(1);
};

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.passwordHash;
  delete user.loginHistory;
  return user;
};

module.exports = mongoose.model('User', userSchema);
