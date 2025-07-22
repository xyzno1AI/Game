# 系统架构设计文档

## 1. 总体架构

### 1.1 架构概述
采用前后端分离的微服务架构，支持水平扩展和模块化开发。

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端应用      │    │   API网关       │    │   用户服务      │
│   (React)       │◄──►│   (Express)     │◄──►│   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   游戏引擎      │    │   WebSocket     │    │   数据库        │
│   (Canvas)      │◄──►│   服务          │◄──►│   (MongoDB)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 1.2 核心模块

#### 1.2.1 前端架构
- **UI框架**: React 18 + TypeScript
- **状态管理**: Redux Toolkit
- **游戏渲染**: HTML5 Canvas + WebGL
- **实时通信**: Socket.io Client
- **路由管理**: React Router
- **UI组件**: Ant Design / Material-UI

#### 1.2.2 后端架构
- **API服务**: Node.js + Express + TypeScript
- **实时通信**: Socket.io Server
- **认证授权**: JWT + Passport.js
- **数据库**: MongoDB + Mongoose
- **缓存**: Redis
- **消息队列**: Redis Pub/Sub

#### 1.2.3 游戏引擎架构
- **游戏抽象层**: 通用游戏接口
- **围棋引擎**: 专用围棋逻辑实现
- **AI引擎**: 集成开源围棋AI
- **状态管理**: 游戏状态同步机制

## 2. 详细设计

### 2.1 用户管理系统

#### 2.1.1 用户模型
```typescript
interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  profile: UserProfile;
  gameStats: GameStatistics;
  permissions: Permission[];
  createdAt: Date;
  lastLoginAt: Date;
}

interface UserProfile {
  avatar: string;
  level: number;
  experience: number;
  title: string;
  achievements: Achievement[];
}
```

#### 2.1.2 权限系统
- **角色定义**: 游客、注册用户、VIP用户、管理员
- **权限控制**: 基于角色的访问控制(RBAC)
- **功能权限**: 游戏参与、观战、聊天、举报等

### 2.2 围棋游戏系统

#### 2.2.1 棋盘模型
```typescript
interface GoBoard {
  size: 9 | 13 | 19;
  stones: Stone[][];
  capturedStones: {
    black: number;
    white: number;
  };
  koPosition?: Position;
  moveHistory: Move[];
}

interface Stone {
  color: 'black' | 'white' | null;
  position: Position;
}
```

#### 2.2.2 游戏规则引擎
- **落子规则**: 禁手检测、打劫规则
- **死活判断**: 气的计算、提子逻辑
- **计分系统**: 中国规则、日本规则支持
- **游戏结束**: 双方pass、认输、超时判定

### 2.3 AI系统设计

#### 2.3.1 AI引擎集成
- **开源AI**: 集成KataGo或Leela Zero
- **难度调节**: 基于蒙特卡洛树搜索的强度控制
- **学习模式**: 针对新手的引导式AI

#### 2.3.2 AI服务架构
```typescript
interface AIService {
  generateMove(board: GoBoard, difficulty: number): Promise<Move>;
  analyzePosition(board: GoBoard): Promise<PositionAnalysis>;
  suggestMove(board: GoBoard, isLearningMode: boolean): Promise<MoveSuggestion>;
}
```

### 2.4 网络通信系统

#### 2.4.1 WebSocket事件定义
```typescript
// 客户端到服务器
interface ClientEvents {
  'game:join': (gameId: string) => void;
  'game:move': (move: Move) => void;
  'game:resign': () => void;
  'game:pass': () => void;
}

// 服务器到客户端
interface ServerEvents {
  'game:update': (gameState: GameState) => void;
  'game:move': (move: Move, player: string) => void;
  'game:end': (result: GameResult) => void;
  'player:joined': (player: Player) => void;
}
```

#### 2.4.2 断线重连机制
- **心跳检测**: 定期ping/pong保持连接
- **状态恢复**: 重连后恢复游戏状态
- **超时处理**: 断线超时自动认输机制

## 3. 数据库设计

### 3.1 用户数据表
```javascript
// users collection
{
  _id: ObjectId,
  username: String,
  email: String,
  passwordHash: String,
  profile: {
    avatar: String,
    level: Number,
    experience: Number,
    title: String
  },
  gameStats: {
    totalGames: Number,
    wins: Number,
    losses: Number,
    draws: Number,
    rating: Number
  },
  permissions: [String],
  createdAt: Date,
  lastLoginAt: Date
}
```

### 3.2 游戏记录表
```javascript
// games collection
{
  _id: ObjectId,
  gameType: String, // 'go'
  boardSize: Number, // 9, 13, 19
  players: [
    {
      userId: ObjectId,
      color: String, // 'black' | 'white'
      rating: Number
    }
  ],
  moves: [
    {
      player: String,
      position: { x: Number, y: Number },
      timestamp: Date,
      moveNumber: Number
    }
  ],
  result: {
    winner: String,
    method: String, // 'resignation', 'timeout', 'score'
    score: { black: Number, white: Number }
  },
  startTime: Date,
  endTime: Date,
  spectators: [ObjectId]
}
```

## 4. 安全设计

### 4.1 认证安全
- **密码加密**: bcrypt哈希加盐
- **JWT令牌**: 短期访问令牌 + 长期刷新令牌
- **会话管理**: Redis存储会话状态

### 4.2 游戏安全
- **防作弊**: 服务器端验证所有游戏操作
- **反外挂**: 移动时间分析、模式检测
- **数据完整性**: 游戏状态校验和

### 4.3 网络安全
- **HTTPS**: 全站SSL加密
- **CORS**: 跨域请求控制
- **Rate Limiting**: API请求频率限制
- **输入验证**: 所有用户输入严格验证

## 5. 性能优化

### 5.1 前端优化
- **代码分割**: 路由级别的懒加载
- **资源优化**: 图片压缩、CDN加速
- **缓存策略**: 浏览器缓存、Service Worker

### 5.2 后端优化
- **数据库优化**: 索引设计、查询优化
- **缓存策略**: Redis缓存热点数据
- **负载均衡**: 多实例部署、会话粘性

### 5.3 游戏优化
- **状态压缩**: 游戏状态数据压缩传输
- **增量更新**: 只传输变化的游戏数据
- **预测加载**: 预加载可能的游戏状态

## 6. 部署架构

### 6.1 容器化部署
```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
  
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    depends_on:
      - mongodb
      - redis
  
  mongodb:
    image: mongo:5.0
    volumes:
      - mongodb_data:/data/db
  
  redis:
    image: redis:7.0
    volumes:
      - redis_data:/data
```

### 6.2 监控和日志
- **应用监控**: PM2进程管理
- **性能监控**: New Relic / DataDog
- **日志管理**: Winston + ELK Stack
- **错误追踪**: Sentry错误监控

## 7. 扩展性设计

### 7.1 游戏扩展
- **游戏接口**: 标准化游戏引擎接口
- **插件系统**: 新游戏类型插件化开发
- **规则引擎**: 可配置的游戏规则系统

### 7.2 功能扩展
- **社交功能**: 好友系统、聊天室
- **比赛系统**: 锦标赛、排位赛
- **直播功能**: 游戏直播、回放系统
