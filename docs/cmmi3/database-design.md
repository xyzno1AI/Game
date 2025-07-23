# 数据库设计文档

## 1. 数据库概述

### 1.1 技术选型
- **主数据库**: MongoDB 5.0+
- **缓存数据库**: Redis 7.0+
- **连接池**: Mongoose (MongoDB ODM)
- **索引策略**: 复合索引优化查询性能

### 1.2 数据库架构
```
┌─────────────────┐    ┌─────────────────┐
│   应用服务器    │    │   Redis缓存     │
│                 │◄──►│   - 会话存储    │
│                 │    │   - 游戏状态    │
└─────────────────┘    │   - 排行榜      │
         │              └─────────────────┘
         ▼
┌─────────────────┐
│   MongoDB       │
│   - 用户数据    │
│   - 游戏记录    │
│   - 系统配置    │
└─────────────────┘
```

## 2. 集合设计

### 2.1 用户集合 (users)
```javascript
{
  _id: ObjectId("..."),
  username: "player123",
  email: "player@example.com",
  passwordHash: "$2b$12$...",
  emailVerified: true,
  
  profile: {
    avatar: "https://cdn.example.com/avatars/123.jpg",
    displayName: "围棋高手",
    level: 15,
    experience: 12500,
    title: "业余三段",
    bio: "热爱围棋的程序员",
    country: "CN",
    timezone: "Asia/Shanghai"
  },
  
  gameStats: {
    go: {
      totalGames: 150,
      wins: 85,
      losses: 60,
      draws: 5,
      rating: 1650,
      ratingHistory: [
        { date: ISODate("2024-01-01"), rating: 1500 },
        { date: ISODate("2024-01-15"), rating: 1550 }
      ],
      bestWinStreak: 8,
      currentWinStreak: 3,
      favoriteBoard: 19,
      averageGameTime: 1800
    }
  },
  
  achievements: [
    {
      id: "first_win",
      unlockedAt: ISODate("2024-01-01"),
      title: "首胜",
      description: "赢得第一场游戏"
    }
  ],
  
  permissions: ["user", "verified"],
  preferences: {
    language: "zh-CN",
    theme: "dark",
    soundEnabled: true,
    notifications: {
      gameInvites: true,
      gameUpdates: true,
      achievements: true
    }
  },
  
  loginHistory: [
    {
      timestamp: ISODate("2024-01-01T10:00:00Z"),
      ip: "192.168.1.1",
      userAgent: "Mozilla/5.0..."
    }
  ],
  
  createdAt: ISODate("2024-01-01"),
  lastLoginAt: ISODate("2024-01-15"),
  lastActiveAt: ISODate("2024-01-15T14:30:00Z")
}
```

### 2.2 游戏记录集合 (games)
```javascript
{
  _id: ObjectId("..."),
  gameType: "go",
  boardSize: 19,
  
  players: [
    {
      userId: ObjectId("..."),
      username: "player1",
      color: "black",
      rating: 1650,
      timeControl: {
        mainTime: 1800,
        increment: 30,
        timeRemaining: 1200
      }
    },
    {
      userId: ObjectId("..."),
      username: "player2", 
      color: "white",
      rating: 1580,
      timeControl: {
        mainTime: 1800,
        increment: 30,
        timeRemaining: 1350
      }
    }
  ],
  
  gameState: {
    board: [
      [null, null, "black", ...],
      [null, "white", null, ...],
      ...
    ],
    capturedStones: {
      black: 5,
      white: 3
    },
    koPosition: { x: 10, y: 10 },
    currentPlayer: "white",
    moveNumber: 45,
    consecutivePasses: 0
  },
  
  moves: [
    {
      moveNumber: 1,
      player: "black",
      position: { x: 15, y: 15 },
      capturedStones: 0,
      timeUsed: 30,
      timestamp: ISODate("2024-01-01T10:05:00Z")
    },
    {
      moveNumber: 2,
      player: "white", 
      position: { x: 3, y: 3 },
      capturedStones: 0,
      timeUsed: 45,
      timestamp: ISODate("2024-01-01T10:05:45Z")
    }
  ],
  
  result: {
    winner: "black",
    method: "resignation",
    score: {
      black: 0,
      white: 0
    },
    ratingChanges: {
      "player1": +15,
      "player2": -15
    }
  },
  
  spectators: [
    {
      userId: ObjectId("..."),
      username: "spectator1",
      joinedAt: ISODate("2024-01-01T10:10:00Z")
    }
  ],
  
  chat: [
    {
      userId: ObjectId("..."),
      username: "player1",
      message: "Good game!",
      timestamp: ISODate("2024-01-01T10:30:00Z")
    }
  ],
  
  settings: {
    timeControl: {
      mainTime: 1800,
      increment: 30
    },
    isPrivate: false,
    allowSpectators: true,
    allowChat: true
  },
  
  status: "finished",
  createdAt: ISODate("2024-01-01T10:00:00Z"),
  startedAt: ISODate("2024-01-01T10:05:00Z"),
  finishedAt: ISODate("2024-01-01T10:30:00Z")
}
```

### 2.3 学习进度集合 (learning_progress)
```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  
  tutorials: [
    {
      tutorialId: "basic-rules",
      status: "completed",
      progress: 1.0,
      currentStep: 10,
      totalSteps: 10,
      startedAt: ISODate("2024-01-01"),
      completedAt: ISODate("2024-01-02"),
      timeSpent: 3600,
      attempts: 1
    },
    {
      tutorialId: "capturing",
      status: "in_progress", 
      progress: 0.6,
      currentStep: 6,
      totalSteps: 10,
      startedAt: ISODate("2024-01-03"),
      timeSpent: 1800,
      attempts: 2
    }
  ],
  
  skills: {
    "basic_capturing": {
      level: 3,
      experience: 150,
      lastPracticed: ISODate("2024-01-05")
    },
    "life_and_death": {
      level: 1,
      experience: 25,
      lastPracticed: ISODate("2024-01-04")
    }
  },
  
  overallProgress: {
    totalTutorialsCompleted: 1,
    totalTimeSpent: 5400,
    currentLevel: 2,
    nextLevelRequirement: 500
  },
  
  createdAt: ISODate("2024-01-01"),
  updatedAt: ISODate("2024-01-05")
}
```

### 2.4 AI配置集合 (ai_configs)
```javascript
{
  _id: ObjectId("..."),
  name: "Beginner Bot",
  difficulty: 3,
  
  settings: {
    searchDepth: 3,
    evaluationWeights: {
      territory: 1.0,
      captures: 0.8,
      influence: 0.6,
      shape: 0.4
    },
    randomness: 0.2,
    thinkingTime: 2000
  },
  
  personality: {
    playStyle: "defensive",
    preferredOpenings: ["star_point", "corner"],
    weaknesses: ["fighting", "ko_battles"]
  },
  
  learningMode: {
    providesHints: true,
    explainsMoves: true,
    adjustsDifficulty: true
  },
  
  statistics: {
    gamesPlayed: 1250,
    winRate: 0.65,
    averageGameLength: 180
  },
  
  createdAt: ISODate("2024-01-01"),
  updatedAt: ISODate("2024-01-15")
}
```

### 2.5 系统配置集合 (system_configs)
```javascript
{
  _id: ObjectId("..."),
  key: "game_settings",
  
  value: {
    go: {
      defaultBoardSize: 19,
      allowedBoardSizes: [9, 13, 19],
      defaultTimeControl: {
        mainTime: 1800,
        increment: 30
      },
      maxSpectators: 50,
      ratingSystem: {
        initialRating: 1500,
        kFactor: 32,
        minRating: 100,
        maxRating: 3000
      }
    },
    
    matchmaking: {
      ratingRange: 200,
      maxWaitTime: 300,
      preferSimilarLevel: true
    },
    
    learning: {
      hintsEnabled: true,
      maxHintsPerGame: 3,
      difficultyProgression: "adaptive"
    }
  },
  
  version: "1.0.0",
  createdAt: ISODate("2024-01-01"),
  updatedAt: ISODate("2024-01-15")
}
```

## 3. 索引设计

### 3.1 用户集合索引
```javascript
// 唯一索引
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });

// 查询优化索引
db.users.createIndex({ "profile.level": -1 });
db.users.createIndex({ "gameStats.go.rating": -1 });
db.users.createIndex({ "lastActiveAt": -1 });
db.users.createIndex({ "createdAt": -1 });

// 复合索引
db.users.createIndex({ 
  "gameStats.go.rating": -1, 
  "lastActiveAt": -1 
});
```

### 3.2 游戏记录集合索引
```javascript
// 基础查询索引
db.games.createIndex({ "status": 1 });
db.games.createIndex({ "gameType": 1 });
db.games.createIndex({ "boardSize": 1 });
db.games.createIndex({ "createdAt": -1 });

// 玩家相关索引
db.games.createIndex({ "players.userId": 1 });
db.games.createIndex({ "spectators.userId": 1 });

// 复合索引
db.games.createIndex({ 
  "gameType": 1, 
  "status": 1, 
  "createdAt": -1 
});

db.games.createIndex({ 
  "players.userId": 1, 
  "status": 1, 
  "createdAt": -1 
});

// 游戏大厅查询优化
db.games.createIndex({ 
  "status": 1, 
  "gameType": 1, 
  "boardSize": 1,
  "settings.isPrivate": 1
});
```

### 3.3 学习进度集合索引
```javascript
db.learning_progress.createIndex({ "userId": 1 }, { unique: true });
db.learning_progress.createIndex({ "tutorials.tutorialId": 1 });
db.learning_progress.createIndex({ "tutorials.status": 1 });
db.learning_progress.createIndex({ "updatedAt": -1 });
```

## 4. Redis缓存设计

### 4.1 会话存储
```
Key: session:{sessionId}
Value: {
  userId: "...",
  username: "...",
  permissions: [...],
  loginTime: "...",
  lastActivity: "..."
}
TTL: 24小时
```

### 4.2 游戏状态缓存
```
Key: game:{gameId}
Value: {
  gameState: {...},
  players: [...],
  spectators: [...],
  lastUpdate: "..."
}
TTL: 2小时（活跃游戏）
```

### 4.3 在线用户列表
```
Key: online_users
Type: Set
Members: userId1, userId2, ...
TTL: 无（定期清理离线用户）
```

### 4.4 排行榜缓存
```
Key: leaderboard:go:rating
Type: Sorted Set
Score: rating
Member: userId
TTL: 1小时
```

### 4.5 匹配队列
```
Key: matchmaking:{gameType}:{boardSize}
Type: List
Value: {
  userId: "...",
  rating: 1650,
  preferences: {...},
  joinTime: "..."
}
TTL: 10分钟
```

## 5. 数据一致性策略

### 5.1 事务处理
```javascript
// 游戏结束时的评级更新
const session = await mongoose.startSession();
session.startTransaction();

try {
  // 更新游戏结果
  await Game.findByIdAndUpdate(gameId, { result }, { session });
  
  // 更新玩家统计
  await User.updateMany(
    { _id: { $in: playerIds } },
    { $inc: { "gameStats.go.totalGames": 1 } },
    { session }
  );
  
  // 更新评级
  for (const player of players) {
    await User.findByIdAndUpdate(
      player.userId,
      { 
        $inc: { "gameStats.go.rating": player.ratingChange },
        $push: { 
          "gameStats.go.ratingHistory": {
            date: new Date(),
            rating: player.newRating
          }
        }
      },
      { session }
    );
  }
  
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

### 5.2 缓存同步策略
```javascript
class CacheManager {
  async updateGameState(gameId, gameState) {
    // 更新数据库
    await Game.findByIdAndUpdate(gameId, { gameState });
    
    // 更新缓存
    await redis.setex(
      `game:${gameId}`, 
      7200, 
      JSON.stringify(gameState)
    );
    
    // 通知其他服务器实例
    await redis.publish('game_update', {
      gameId,
      gameState
    });
  }
  
  async invalidateUserCache(userId) {
    await redis.del(`user:${userId}`);
    await redis.srem('online_users', userId);
  }
}
```

## 6. 数据备份策略

### 6.1 MongoDB备份
```bash
# 每日全量备份
mongodump --host localhost:27017 --db gamedb --out /backup/$(date +%Y%m%d)

# 增量备份（使用oplog）
mongodump --host localhost:27017 --oplog --out /backup/incremental/$(date +%Y%m%d_%H%M)
```

### 6.2 Redis备份
```bash
# RDB快照备份
redis-cli BGSAVE
cp /var/lib/redis/dump.rdb /backup/redis/$(date +%Y%m%d).rdb

# AOF备份
cp /var/lib/redis/appendonly.aof /backup/redis/$(date +%Y%m%d).aof
```

## 7. 性能优化

### 7.1 查询优化
- 使用复合索引优化常见查询
- 避免全表扫描，使用索引覆盖查询
- 合理使用聚合管道，减少数据传输
- 实现查询结果分页，避免大结果集

### 7.2 缓存策略
- 热点数据Redis缓存
- 查询结果缓存
- 会话数据缓存
- 静态配置缓存

### 7.3 连接池优化
```javascript
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/gamedb', {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
  bufferMaxEntries: 0
});
```

## 8. 监控指标

### 8.1 数据库监控
- 连接数使用率
- 查询响应时间
- 索引使用效率
- 磁盘空间使用
- 内存使用情况

### 8.2 缓存监控
- 缓存命中率
- 内存使用率
- 键过期统计
- 连接数监控

### 8.3 业务监控
- 用户注册/登录频率
- 游戏创建/完成频率
- 平均游戏时长
- 用户活跃度统计
