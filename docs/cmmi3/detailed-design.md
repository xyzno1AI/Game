# 详细设计文档

## 1. 用户管理模块详细设计

### 1.1 用户注册流程
```typescript
class UserRegistrationService {
  async registerUser(userData: UserRegistrationData): Promise<User> {
    // 1. 验证输入数据
    this.validateRegistrationData(userData);
    
    // 2. 检查用户名和邮箱唯一性
    await this.checkUserUniqueness(userData.username, userData.email);
    
    // 3. 加密密码
    const passwordHash = await bcrypt.hash(userData.password, 12);
    
    // 4. 创建用户记录
    const user = await this.createUser({
      ...userData,
      passwordHash,
      profile: this.createDefaultProfile(),
      gameStats: this.createDefaultStats(),
      permissions: ['user']
    });
    
    // 5. 发送验证邮件
    await this.sendVerificationEmail(user);
    
    return user;
  }
}
```

### 1.2 用户等级系统设计
```typescript
interface LevelSystem {
  levels: Level[];
  calculateLevel(experience: number): number;
  getRequiredExperience(level: number): number;
  awardExperience(userId: string, amount: number): Promise<void>;
}

interface Level {
  level: number;
  title: string;
  requiredExperience: number;
  permissions: string[];
  benefits: Benefit[];
}
```

## 2. 围棋游戏引擎详细设计

### 2.1 棋盘状态管理
```typescript
class GoBoard {
  private board: Stone[][];
  private size: 9 | 13 | 19;
  private moveHistory: Move[];
  private capturedStones: { black: number; white: number };
  private koPosition?: Position;

  constructor(size: 9 | 13 | 19) {
    this.size = size;
    this.board = this.initializeBoard();
    this.moveHistory = [];
    this.capturedStones = { black: 0, white: 0 };
  }

  placeStone(position: Position, color: StoneColor): MoveResult {
    // 1. 验证位置合法性
    if (!this.isValidPosition(position)) {
      return { success: false, error: 'Invalid position' };
    }

    // 2. 检查位置是否为空
    if (this.board[position.x][position.y] !== null) {
      return { success: false, error: 'Position occupied' };
    }

    // 3. 临时放置棋子
    this.board[position.x][position.y] = { color, position };

    // 4. 检查并移除被吃的对方棋子
    const capturedGroups = this.findCapturedGroups(this.getOpponentColor(color));
    
    // 5. 检查自杀规则
    if (capturedGroups.length === 0 && this.hasNoLiberties(position)) {
      this.board[position.x][position.y] = null;
      return { success: false, error: 'Suicide move' };
    }

    // 6. 检查打劫规则
    if (this.isKoViolation(position, capturedGroups)) {
      this.board[position.x][position.y] = null;
      return { success: false, error: 'Ko violation' };
    }

    // 7. 确认移动并更新状态
    this.removeCapturedStones(capturedGroups);
    this.updateKoPosition(position, capturedGroups);
    this.addToHistory({ position, color, capturedStones: capturedGroups.length });

    return { success: true, capturedStones: capturedGroups.length };
  }
}
```

### 2.2 死活判断算法
```typescript
class LifeAndDeathAnalyzer {
  analyzeGroup(board: GoBoard, position: Position): GroupStatus {
    const group = this.findGroup(board, position);
    const liberties = this.countLiberties(board, group);
    
    if (liberties === 0) {
      return GroupStatus.DEAD;
    }
    
    if (liberties === 1) {
      return this.analyzeAtari(board, group);
    }
    
    return this.analyzeComplexLife(board, group);
  }

  private analyzeAtari(board: GoBoard, group: Position[]): GroupStatus {
    const liberty = this.findLiberties(board, group)[0];
    
    // 检查是否可以逃脱
    if (this.canEscape(board, group, liberty)) {
      return GroupStatus.ALIVE;
    }
    
    // 检查是否可以反吃
    if (this.canCapture(board, group, liberty)) {
      return GroupStatus.ALIVE;
    }
    
    return GroupStatus.DEAD;
  }
}
```

## 3. AI系统详细设计

### 3.1 AI决策引擎
```typescript
class GoAI {
  private difficulty: number;
  private evaluator: PositionEvaluator;

  async generateMove(board: GoBoard): Promise<Move> {
    const legalMoves = this.generateLegalMoves(board);
    
    if (this.difficulty <= 3) {
      return this.selectRandomMove(legalMoves);
    }
    
    if (this.difficulty <= 6) {
      return this.selectGreedyMove(board, legalMoves);
    }
    
    return this.selectMinimaxMove(board, legalMoves);
  }

  private selectMinimaxMove(board: GoBoard, moves: Position[]): Move {
    let bestMove = moves[0];
    let bestScore = -Infinity;
    
    for (const move of moves) {
      const score = this.minimax(board, move, this.getSearchDepth(), true);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return { position: bestMove, color: board.getCurrentPlayer() };
  }

  private minimax(board: GoBoard, move: Position, depth: number, isMaximizing: boolean): number {
    if (depth === 0 || board.isGameOver()) {
      return this.evaluator.evaluate(board);
    }

    const tempBoard = board.clone();
    tempBoard.placeStone(move, board.getCurrentPlayer());

    if (isMaximizing) {
      let maxScore = -Infinity;
      for (const nextMove of this.generateLegalMoves(tempBoard)) {
        const score = this.minimax(tempBoard, nextMove, depth - 1, false);
        maxScore = Math.max(maxScore, score);
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (const nextMove of this.generateLegalMoves(tempBoard)) {
        const score = this.minimax(tempBoard, nextMove, depth - 1, true);
        minScore = Math.min(minScore, score);
      }
      return minScore;
    }
  }
}
```

### 3.2 位置评估器
```typescript
class PositionEvaluator {
  evaluate(board: GoBoard): number {
    let score = 0;
    
    // 1. 领地评估
    score += this.evaluateTerritory(board) * 1.0;
    
    // 2. 棋子数量
    score += this.evaluateStoneCount(board) * 0.5;
    
    // 3. 影响力评估
    score += this.evaluateInfluence(board) * 0.3;
    
    // 4. 形状评估
    score += this.evaluateShape(board) * 0.2;
    
    return score;
  }

  private evaluateTerritory(board: GoBoard): number {
    const territories = this.findTerritories(board);
    let score = 0;
    
    for (const territory of territories) {
      if (territory.owner === 'black') {
        score += territory.size;
      } else if (territory.owner === 'white') {
        score -= territory.size;
      }
    }
    
    return score;
  }
}
```

## 4. 学习模式详细设计

### 4.1 教学系统架构
```typescript
class LearningModeManager {
  private tutorials: Tutorial[];
  private progressTracker: ProgressTracker;

  async startTutorial(userId: string, tutorialId: string): Promise<TutorialSession> {
    const tutorial = this.tutorials.find(t => t.id === tutorialId);
    const userProgress = await this.progressTracker.getUserProgress(userId);
    
    return new TutorialSession({
      tutorial,
      userId,
      currentStep: userProgress.getLastCompletedStep(tutorialId) + 1,
      hints: tutorial.getHintsForStep(userProgress.level)
    });
  }

  async processUserMove(sessionId: string, move: Move): Promise<TutorialFeedback> {
    const session = await this.getSession(sessionId);
    const currentStep = session.getCurrentStep();
    
    const feedback = currentStep.evaluateMove(move);
    
    if (feedback.isCorrect) {
      await this.advanceToNextStep(session);
      return {
        message: feedback.successMessage,
        nextStep: session.getCurrentStep(),
        showHint: false
      };
    } else {
      return {
        message: feedback.errorMessage,
        explanation: feedback.explanation,
        showHint: true,
        suggestedMove: currentStep.getSuggestedMove()
      };
    }
  }
}
```

### 4.2 教学内容设计
```typescript
interface Tutorial {
  id: string;
  title: string;
  description: string;
  difficulty: number;
  steps: TutorialStep[];
  prerequisites: string[];
}

interface TutorialStep {
  id: string;
  title: string;
  instruction: string;
  boardSetup: BoardSetup;
  expectedMoves: Move[];
  hints: Hint[];
  
  evaluateMove(move: Move): MoveEvaluation;
  getSuggestedMove(): Move;
}

class BasicCaptureTutorial implements Tutorial {
  id = 'basic-capture';
  title = '基础吃子';
  description = '学习如何吃掉对方的棋子';
  
  steps = [
    {
      id: 'capture-single-stone',
      title: '吃掉单个棋子',
      instruction: '白棋只有一口气了，请下黑棋吃掉它',
      boardSetup: {
        size: 9,
        stones: [
          { position: { x: 4, y: 4 }, color: 'white' },
          { position: { x: 3, y: 4 }, color: 'black' },
          { position: { x: 4, y: 3 }, color: 'black' },
          { position: { x: 4, y: 5 }, color: 'black' }
        ]
      },
      expectedMoves: [{ position: { x: 5, y: 4 }, color: 'black' }],
      hints: [
        { level: 1, text: '找找白棋的最后一口气在哪里' },
        { level: 2, text: '白棋的右边是空的' },
        { level: 3, text: '在(5,4)位置下黑棋' }
      ]
    }
  ];
}
```

## 5. 网络通信详细设计

### 5.1 Socket.io事件处理
```typescript
class GameSocketHandler {
  constructor(private io: Server) {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      socket.on('game:join', this.handleJoinGame.bind(this, socket));
      socket.on('game:move', this.handleMove.bind(this, socket));
      socket.on('game:pass', this.handlePass.bind(this, socket));
      socket.on('game:resign', this.handleResign.bind(this, socket));
      socket.on('disconnect', this.handleDisconnect.bind(this, socket));
    });
  }

  private async handleJoinGame(socket: Socket, gameId: string): Promise<void> {
    try {
      const game = await this.gameService.getGame(gameId);
      const user = await this.getUserFromSocket(socket);
      
      // 验证用户权限
      if (!this.canJoinGame(user, game)) {
        socket.emit('error', { message: 'Cannot join game' });
        return;
      }

      // 加入游戏房间
      socket.join(gameId);
      
      // 更新游戏状态
      if (game.needsPlayer()) {
        await this.gameService.addPlayer(gameId, user);
      } else {
        await this.gameService.addSpectator(gameId, user);
      }

      // 广播更新
      this.io.to(gameId).emit('game:update', game.getState());
      
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  private async handleMove(socket: Socket, moveData: MoveData): Promise<void> {
    try {
      const game = await this.gameService.getGame(moveData.gameId);
      const user = await this.getUserFromSocket(socket);
      
      // 验证移动合法性
      const moveResult = await this.gameService.makeMove(
        moveData.gameId, 
        user.id, 
        moveData.move
      );

      if (!moveResult.success) {
        socket.emit('move:invalid', { error: moveResult.error });
        return;
      }

      // 广播移动到所有玩家
      this.io.to(moveData.gameId).emit('game:move', {
        move: moveData.move,
        player: user.username,
        gameState: game.getState()
      });

      // 检查游戏是否结束
      if (game.isFinished()) {
        this.io.to(moveData.gameId).emit('game:end', game.getResult());
      }

    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }
}
```

### 5.2 断线重连机制
```typescript
class ReconnectionManager {
  private reconnectionTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private gameStates: Map<string, GameState> = new Map();

  handleDisconnection(socket: Socket): void {
    const userId = this.getUserId(socket);
    const gameId = this.getActiveGameId(userId);
    
    if (gameId) {
      // 保存游戏状态
      this.saveGameState(gameId);
      
      // 设置重连超时
      const timeout = setTimeout(() => {
        this.handleReconnectionTimeout(userId, gameId);
      }, 30000); // 30秒超时
      
      this.reconnectionTimeouts.set(userId, timeout);
      
      // 通知其他玩家
      socket.to(gameId).emit('player:disconnected', { userId });
    }
  }

  handleReconnection(socket: Socket, userId: string): void {
    // 清除超时
    const timeout = this.reconnectionTimeouts.get(userId);
    if (timeout) {
      clearTimeout(timeout);
      this.reconnectionTimeouts.delete(userId);
    }

    // 恢复游戏状态
    const gameId = this.getActiveGameId(userId);
    if (gameId) {
      socket.join(gameId);
      
      const gameState = this.gameStates.get(gameId);
      socket.emit('game:restore', gameState);
      
      // 通知其他玩家
      socket.to(gameId).emit('player:reconnected', { userId });
    }
  }

  private handleReconnectionTimeout(userId: string, gameId: string): void {
    // 玩家超时未重连，自动认输
    this.gameService.forfeitGame(gameId, userId);
    
    // 通知其他玩家
    this.io.to(gameId).emit('game:forfeit', { userId });
    
    // 清理状态
    this.gameStates.delete(gameId);
  }
}
```
