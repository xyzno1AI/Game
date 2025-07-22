# 测试计划文档

## 1. 测试概述

### 1.1 测试目标
- 验证围棋游戏平台的功能完整性和正确性
- 确保用户管理系统的安全性和可靠性
- 验证实时多人游戏的稳定性
- 确保AI系统的智能性和响应性
- 验证学习模式的教学效果

### 1.2 测试范围
- 用户注册、登录、权限管理
- 围棋游戏规则引擎
- 多人实时对战功能
- AI对战系统
- 学习模式和教程系统
- 网络断线重连机制
- 性能和安全测试

### 1.3 测试策略
- 单元测试：覆盖率目标 >80%
- 集成测试：验证模块间交互
- 端到端测试：完整用户流程
- 性能测试：并发用户支持
- 安全测试：数据保护和权限控制

## 2. 测试环境

### 2.1 测试环境配置
```yaml
开发环境:
  - Node.js 18+
  - MongoDB 5.0+
  - Redis 7.0+
  - React 18+

测试环境:
  - Docker容器化部署
  - 模拟网络延迟和断线
  - 负载测试工具
```

### 2.2 测试数据
- 测试用户账户
- 模拟游戏数据
- AI训练数据
- 教程测试场景

## 3. 单元测试计划

### 3.1 后端单元测试

#### 3.1.1 用户管理模块
```javascript
// 测试用例示例
describe('User Authentication', () => {
  test('用户注册成功', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };
    const result = await authService.register(userData);
    expect(result.success).toBe(true);
    expect(result.user.username).toBe('testuser');
  });

  test('重复用户名注册失败', async () => {
    // 测试重复注册逻辑
  });

  test('密码加密存储', async () => {
    // 验证密码不以明文存储
  });
});
```

#### 3.1.2 围棋引擎测试
```javascript
describe('Go Game Engine', () => {
  test('合法落子', () => {
    const engine = new GoEngine(19);
    const result = engine.placeStone(3, 3, 'black');
    expect(result.success).toBe(true);
  });

  test('禁手检测', () => {
    // 测试自杀手、打劫等禁手
  });

  test('吃子逻辑', () => {
    // 测试提子功能
  });

  test('死活判断', () => {
    // 测试棋子生死判断
  });
});
```

#### 3.1.3 AI系统测试
```javascript
describe('AI Service', () => {
  test('AI落子生成', async () => {
    const board = createTestBoard();
    const move = await aiService.generateMove(board, 19, 5);
    expect(move.position).toBeDefined();
    expect(move.position.x).toBeGreaterThanOrEqual(0);
    expect(move.position.y).toBeGreaterThanOrEqual(0);
  });

  test('难度等级差异', async () => {
    // 测试不同难度AI的表现差异
  });
});
```

### 3.2 前端单元测试

#### 3.2.1 组件测试
```javascript
describe('GoBoard Component', () => {
  test('棋盘渲染正确', () => {
    render(<GoBoard size={19} />);
    expect(screen.getByRole('canvas')).toBeInTheDocument();
  });

  test('落子交互', () => {
    const onStonePlace = jest.fn();
    render(<GoBoard onStonePlace={onStonePlace} />);
    // 模拟点击事件
  });
});
```

#### 3.2.2 状态管理测试
```javascript
describe('Game Slice', () => {
  test('创建游戏状态更新', () => {
    const initialState = { currentGame: null };
    const action = createGame.fulfilled(mockGame);
    const newState = gameSlice(initialState, action);
    expect(newState.currentGame).toEqual(mockGame);
  });
});
```

## 4. 集成测试计划

### 4.1 API集成测试
```javascript
describe('Game API Integration', () => {
  test('完整游戏流程', async () => {
    // 1. 创建游戏
    const game = await request(app)
      .post('/api/games')
      .send(gameData)
      .expect(201);

    // 2. 加入游戏
    await request(app)
      .post(`/api/games/${game.body.data.game._id}/join`)
      .expect(200);

    // 3. 进行对局
    await request(app)
      .post(`/api/games/${game.body.data.game._id}/move`)
      .send({ position: { x: 3, y: 3 } })
      .expect(200);
  });
});
```

### 4.2 WebSocket集成测试
```javascript
describe('Real-time Game Communication', () => {
  test('多用户实时同步', (done) => {
    const client1 = io('http://localhost:8000');
    const client2 = io('http://localhost:8000');
    
    client1.emit('game:join', { gameId: testGameId });
    client2.on('game:update', (data) => {
      expect(data.players.length).toBe(2);
      done();
    });
  });
});
```

## 5. 端到端测试计划

### 5.1 用户流程测试
```javascript
describe('Complete User Journey', () => {
  test('新用户完整体验', async () => {
    // 1. 注册账户
    await page.goto('/register');
    await page.fill('[name="username"]', 'newuser');
    await page.fill('[name="email"]', 'new@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 2. 进入大厅
    await expect(page).toHaveURL('/dashboard');

    // 3. 创建游戏
    await page.click('text=游戏大厅');
    await page.click('text=创建对局');
    await page.selectOption('[name="boardSize"]', '19');
    await page.click('text=创建对局');

    // 4. 等待对手
    await expect(page.locator('text=等待对手')).toBeVisible();
  });
});
```

### 5.2 游戏功能测试
```javascript
describe('Game Functionality E2E', () => {
  test('完整对局流程', async () => {
    // 测试从开始到结束的完整对局
  });

  test('观战功能', async () => {
    // 测试观战者功能
  });

  test('聊天功能', async () => {
    // 测试游戏内聊天
  });
});
```

## 6. 性能测试计划

### 6.1 负载测试
```javascript
// 使用Artillery进行负载测试
config:
  target: 'http://localhost:8000'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 100

scenarios:
  - name: "游戏创建和加入"
    flow:
      - post:
          url: "/api/auth/login"
          json:
            username: "testuser"
            password: "password"
      - post:
          url: "/api/games"
          json:
            boardSize: 19
```

### 6.2 并发测试
- 同时在线用户数：1000+
- 并发游戏数：100+
- WebSocket连接数：1000+
- 响应时间：<100ms

## 7. 安全测试计划

### 7.1 认证安全测试
```javascript
describe('Security Tests', () => {
  test('SQL注入防护', async () => {
    const maliciousInput = "'; DROP TABLE users; --";
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: maliciousInput, password: 'test' });
    expect(response.status).toBe(401);
  });

  test('XSS防护', async () => {
    const xssPayload = '<script>alert("xss")</script>';
    // 测试XSS防护
  });

  test('CSRF防护', async () => {
    // 测试CSRF令牌验证
  });
});
```

### 7.2 权限测试
```javascript
describe('Authorization Tests', () => {
  test('未授权访问拒绝', async () => {
    const response = await request(app)
      .get('/api/users/profile')
      .expect(401);
  });

  test('权限等级验证', async () => {
    // 测试不同权限等级的访问控制
  });
});
```

## 8. 学习模式测试

### 8.1 教程功能测试
```javascript
describe('Learning Mode', () => {
  test('教程步骤验证', async () => {
    const session = await learningService.startTutorial('basic-rules');
    expect(session.currentStep).toBeDefined();
    expect(session.step.instruction).toBeTruthy();
  });

  test('进度跟踪', async () => {
    // 测试学习进度记录
  });

  test('提示系统', async () => {
    // 测试提示功能
  });
});
```

## 9. 网络测试计划

### 9.1 断线重连测试
```javascript
describe('Network Resilience', () => {
  test('断线重连恢复', async () => {
    // 模拟网络断开
    await simulateNetworkDisconnection();
    
    // 等待重连
    await waitForReconnection();
    
    // 验证游戏状态恢复
    expect(gameState).toEqual(expectedState);
  });

  test('超时处理', async () => {
    // 测试超时自动认输
  });
});
```

## 10. 测试自动化

### 10.1 CI/CD集成
```yaml
# GitHub Actions配置
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend && npm install
          cd ../frontend && npm install
      
      - name: Run backend tests
        run: cd backend && npm test
      
      - name: Run frontend tests
        run: cd frontend && npm test
      
      - name: E2E tests
        run: npm run test:e2e
```

### 10.2 测试报告
- 覆盖率报告
- 性能测试报告
- 安全扫描报告
- 测试执行报告

## 11. 测试数据管理

### 11.1 测试数据准备
```javascript
// 测试数据工厂
class TestDataFactory {
  static createUser(overrides = {}) {
    return {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      ...overrides
    };
  }

  static createGame(overrides = {}) {
    return {
      boardSize: 19,
      gameType: 'go',
      ...overrides
    };
  }
}
```

### 11.2 数据清理
```javascript
// 测试后清理
afterEach(async () => {
  await User.deleteMany({ username: /^test/ });
  await Game.deleteMany({ 'players.username': /^test/ });
});
```

## 12. 测试执行计划

### 12.1 测试阶段
1. **开发阶段**：单元测试持续执行
2. **集成阶段**：API和组件集成测试
3. **系统测试**：完整功能验证
4. **验收测试**：用户场景验证
5. **发布前**：性能和安全测试

### 12.2 测试时间表
- 单元测试：每次代码提交
- 集成测试：每日构建
- 端到端测试：每周执行
- 性能测试：里程碑节点
- 安全测试：发布前执行

## 13. 缺陷管理

### 13.1 缺陷分类
- **严重**：系统崩溃、数据丢失
- **高**：核心功能无法使用
- **中**：功能异常但有替代方案
- **低**：界面问题、优化建议

### 13.2 缺陷跟踪
- 使用GitHub Issues跟踪
- 标签分类管理
- 优先级排序
- 修复验证流程

## 14. 测试工具

### 14.1 测试框架
- **后端**：Jest, Supertest
- **前端**：Jest, React Testing Library
- **E2E**：Playwright
- **性能**：Artillery, K6
- **安全**：OWASP ZAP

### 14.2 测试环境工具
- Docker容器化
- MongoDB Memory Server
- Redis Mock
- WebSocket测试工具

## 15. 验收标准

### 15.1 功能验收
- [ ] 用户注册登录正常
- [ ] 围棋规则正确实现
- [ ] 多人对战稳定运行
- [ ] AI对战智能响应
- [ ] 学习模式教学有效
- [ ] 断线重连机制可靠

### 15.2 性能验收
- [ ] 响应时间 <100ms
- [ ] 支持1000+并发用户
- [ ] 内存使用合理
- [ ] CPU使用率 <80%

### 15.3 安全验收
- [ ] 通过安全扫描
- [ ] 权限控制有效
- [ ] 数据加密传输
- [ ] 防止常见攻击

这个测试计划确保了围棋游戏平台的质量和可靠性，涵盖了从单元测试到系统测试的完整测试体系。
