# API接口规格说明书

## 1. 认证相关API

### 1.1 用户注册
```
POST /api/auth/register
Content-Type: application/json

Request Body:
{
  "username": "string (3-20字符)",
  "email": "string (有效邮箱格式)",
  "password": "string (8-50字符)",
  "confirmPassword": "string"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "username": "string",
      "email": "string",
      "profile": {
        "level": 1,
        "experience": 0,
        "title": "新手"
      }
    },
    "token": "string (JWT token)"
  }
}

Error Response:
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "用户名已存在",
    "details": {}
  }
}
```

### 1.2 用户登录
```
POST /api/auth/login
Content-Type: application/json

Request Body:
{
  "username": "string",
  "password": "string"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "username": "string",
      "email": "string",
      "profile": UserProfile,
      "gameStats": GameStatistics
    },
    "token": "string",
    "refreshToken": "string"
  }
}
```

### 1.3 刷新令牌
```
POST /api/auth/refresh
Authorization: Bearer <refresh_token>

Response:
{
  "success": true,
  "data": {
    "token": "string",
    "refreshToken": "string"
  }
}
```

## 2. 用户管理API

### 2.1 获取用户信息
```
GET /api/users/profile
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "username": "string",
      "email": "string",
      "profile": {
        "avatar": "string",
        "level": "number",
        "experience": "number",
        "title": "string",
        "achievements": Achievement[]
      },
      "gameStats": {
        "totalGames": "number",
        "wins": "number",
        "losses": "number",
        "draws": "number",
        "rating": "number",
        "winRate": "number"
      }
    }
  }
}
```

### 2.2 更新用户资料
```
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "avatar": "string (optional)",
  "displayName": "string (optional)"
}

Response:
{
  "success": true,
  "data": {
    "user": UserProfile
  }
}
```

### 2.3 获取用户游戏历史
```
GET /api/users/games?page=1&limit=10&gameType=go
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "games": [
      {
        "id": "string",
        "gameType": "go",
        "boardSize": 19,
        "opponent": {
          "id": "string",
          "username": "string"
        },
        "result": {
          "winner": "black|white|draw",
          "method": "resignation|timeout|score",
          "score": { "black": 150, "white": 145 }
        },
        "duration": 1800,
        "startTime": "2024-01-01T10:00:00Z",
        "endTime": "2024-01-01T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

## 3. 游戏管理API

### 3.1 创建游戏
```
POST /api/games
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "gameType": "go",
  "boardSize": 9 | 13 | 19,
  "timeControl": {
    "mainTime": 1800,
    "increment": 30
  },
  "isPrivate": false,
  "allowSpectators": true
}

Response:
{
  "success": true,
  "data": {
    "game": {
      "id": "string",
      "gameType": "go",
      "boardSize": 19,
      "creator": {
        "id": "string",
        "username": "string"
      },
      "status": "waiting",
      "settings": GameSettings
    }
  }
}
```

### 3.2 加入游戏
```
POST /api/games/{gameId}/join
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "game": GameState,
    "playerColor": "black|white",
    "role": "player|spectator"
  }
}
```

### 3.3 获取游戏状态
```
GET /api/games/{gameId}
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "game": {
      "id": "string",
      "gameType": "go",
      "boardSize": 19,
      "status": "waiting|playing|finished",
      "players": [
        {
          "id": "string",
          "username": "string",
          "color": "black|white",
          "timeRemaining": 1500
        }
      ],
      "board": {
        "size": 19,
        "stones": Stone[][],
        "capturedStones": { "black": 5, "white": 3 },
        "koPosition": Position | null
      },
      "moveHistory": Move[],
      "currentPlayer": "black|white",
      "spectators": User[]
    }
  }
}
```

### 3.4 下棋
```
POST /api/games/{gameId}/move
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "position": {
    "x": 10,
    "y": 10
  }
}

Response:
{
  "success": true,
  "data": {
    "move": {
      "position": { "x": 10, "y": 10 },
      "color": "black",
      "capturedStones": 2,
      "moveNumber": 45
    },
    "gameState": GameState
  }
}

Error Response:
{
  "success": false,
  "error": {
    "code": "INVALID_MOVE",
    "message": "该位置已有棋子",
    "details": {
      "position": { "x": 10, "y": 10 }
    }
  }
}
```

### 3.5 认输
```
POST /api/games/{gameId}/resign
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "result": {
      "winner": "white",
      "method": "resignation",
      "resignedPlayer": "black"
    }
  }
}
```

### 3.6 停一手
```
POST /api/games/{gameId}/pass
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "gameState": GameState,
    "consecutivePasses": 1
  }
}
```

## 4. AI对战API

### 4.1 创建AI游戏
```
POST /api/games/ai
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "boardSize": 9 | 13 | 19,
  "aiDifficulty": 1-10,
  "playerColor": "black|white"
}

Response:
{
  "success": true,
  "data": {
    "game": {
      "id": "string",
      "gameType": "go",
      "boardSize": 19,
      "players": [
        {
          "id": "user_id",
          "username": "player_name",
          "color": "black"
        },
        {
          "id": "ai_bot",
          "username": "AI Bot",
          "color": "white",
          "difficulty": 5
        }
      ],
      "status": "playing"
    }
  }
}
```

### 4.2 获取AI提示
```
POST /api/games/{gameId}/hint
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "hint": {
      "suggestedMove": {
        "position": { "x": 15, "y": 10 },
        "reasoning": "这步棋可以保护你的角部领地"
      },
      "alternatives": [
        {
          "position": { "x": 12, "y": 8 },
          "reasoning": "攻击对方的弱棋"
        }
      ]
    }
  }
}
```

## 5. 学习模式API

### 5.1 获取教程列表
```
GET /api/learning/tutorials
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "tutorials": [
      {
        "id": "basic-rules",
        "title": "围棋基本规则",
        "description": "学习围棋的基本规则和目标",
        "difficulty": 1,
        "estimatedTime": 600,
        "completed": false,
        "progress": 0.3
      }
    ]
  }
}
```

### 5.2 开始教程
```
POST /api/learning/tutorials/{tutorialId}/start
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "session": {
      "id": "string",
      "tutorialId": "string",
      "currentStep": 1,
      "totalSteps": 10,
      "step": {
        "id": "string",
        "title": "第一步：了解棋盘",
        "instruction": "围棋棋盘有19条横线和19条竖线",
        "boardSetup": BoardSetup,
        "expectedAction": "click|move|pass"
      }
    }
  }
}
```

### 5.3 提交教程步骤
```
POST /api/learning/sessions/{sessionId}/step
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "action": "move",
  "data": {
    "position": { "x": 10, "y": 10 }
  }
}

Response:
{
  "success": true,
  "data": {
    "feedback": {
      "correct": true,
      "message": "很好！你成功完成了这一步",
      "explanation": "这个位置确实是最佳选择",
      "nextStep": TutorialStep | null
    },
    "progress": {
      "currentStep": 2,
      "totalSteps": 10,
      "completionRate": 0.2
    }
  }
}

Error Response:
{
  "success": false,
  "error": {
    "code": "INCORRECT_MOVE",
    "message": "这不是最佳位置",
    "data": {
      "hint": "试试看棋盘的角落",
      "suggestedMove": { "x": 3, "y": 3 }
    }
  }
}
```

## 6. 游戏大厅API

### 6.1 获取游戏列表
```
GET /api/lobby/games?status=waiting&gameType=go&boardSize=19
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "games": [
      {
        "id": "string",
        "gameType": "go",
        "boardSize": 19,
        "creator": {
          "username": "player1",
          "rating": 1500
        },
        "timeControl": {
          "mainTime": 1800,
          "increment": 30
        },
        "status": "waiting",
        "spectatorCount": 0
      }
    ]
  }
}
```

### 6.2 获取在线用户
```
GET /api/lobby/users
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "string",
        "username": "string",
        "status": "online|playing|away",
        "currentGame": "string | null",
        "rating": 1500
      }
    ],
    "totalOnline": 42
  }
}
```

## 7. WebSocket事件

### 7.1 客户端发送事件
```typescript
// 加入游戏
socket.emit('game:join', { gameId: 'string' });

// 下棋
socket.emit('game:move', { 
  gameId: 'string', 
  move: { position: { x: 10, y: 10 } } 
});

// 停一手
socket.emit('game:pass', { gameId: 'string' });

// 认输
socket.emit('game:resign', { gameId: 'string' });

// 发送聊天消息
socket.emit('chat:message', { 
  gameId: 'string', 
  message: 'string' 
});
```

### 7.2 服务器发送事件
```typescript
// 游戏状态更新
socket.on('game:update', (data: GameState) => {});

// 新的移动
socket.on('game:move', (data: { 
  move: Move, 
  player: string, 
  gameState: GameState 
}) => {});

// 游戏结束
socket.on('game:end', (data: GameResult) => {});

// 玩家加入/离开
socket.on('player:joined', (data: { player: User }) => {});
socket.on('player:left', (data: { playerId: string }) => {});

// 聊天消息
socket.on('chat:message', (data: { 
  user: string, 
  message: string, 
  timestamp: string 
}) => {});

// 错误处理
socket.on('error', (data: { message: string, code?: string }) => {});
```

## 8. 错误代码

### 8.1 认证错误
- `AUTH_REQUIRED`: 需要认证
- `INVALID_TOKEN`: 无效的令牌
- `TOKEN_EXPIRED`: 令牌已过期
- `INSUFFICIENT_PERMISSIONS`: 权限不足

### 8.2 验证错误
- `VALIDATION_ERROR`: 输入验证失败
- `USERNAME_EXISTS`: 用户名已存在
- `EMAIL_EXISTS`: 邮箱已存在
- `INVALID_CREDENTIALS`: 无效的登录凭据

### 8.3 游戏错误
- `GAME_NOT_FOUND`: 游戏不存在
- `GAME_FULL`: 游戏已满
- `INVALID_MOVE`: 无效的移动
- `NOT_YOUR_TURN`: 不是你的回合
- `GAME_FINISHED`: 游戏已结束

### 8.4 系统错误
- `INTERNAL_ERROR`: 内部服务器错误
- `SERVICE_UNAVAILABLE`: 服务不可用
- `RATE_LIMIT_EXCEEDED`: 请求频率超限
