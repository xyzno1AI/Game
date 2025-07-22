# 围棋游戏平台 (Go Game Platform)

一个支持多用户的围棋游戏平台，包含用户管理、实时对战、AI对手和学习模式等功能。

## 功能特性

### 🎮 游戏功能
- **围棋对战**：支持9×9、13×13、19×19三种棋盘规格
- **多种游戏模式**：
  - 人人对战（支持观战）
  - 人机对战（10个难度等级）
  - 学习模式（新手教程）
- **实时对战**：基于WebSocket的实时通信
- **断线重连**：网络中断后自动恢复游戏状态

### 👥 用户系统
- **用户管理**：注册、登录、权限控制
- **等级系统**：基于经验值的用户等级
- **积分排名**：ELO积分系统和排行榜
- **行为分析**：游戏统计和历史记录

### 🤖 AI系统
- **智能对手**：10个难度等级的AI
- **提示系统**：为初学者提供落子建议
- **棋局分析**：AI解释和推理

### 📚 学习模式
- **互动教程**：从基础规则到高级技巧
- **渐进式学习**：循序渐进的课程设计
- **实时反馈**：即时的指导和纠错
- **进度跟踪**：学习成就和里程碑

## 技术架构

### 后端技术栈
- **运行环境**：Node.js 18+
- **Web框架**：Express.js
- **数据库**：MongoDB + Redis
- **实时通信**：Socket.io
- **身份认证**：JWT
- **开发语言**：JavaScript/TypeScript

### 前端技术栈
- **框架**：React 18+
- **状态管理**：Redux Toolkit
- **UI组件**：Ant Design
- **图形渲染**：Konva.js (Canvas)
- **实时通信**：Socket.io Client

### 系统架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端应用      │    │   后端API       │    │   数据库        │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (MongoDB)     │
│   Port: 3000    │    │   Port: 8000    │    │   Port: 27017   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   缓存服务      │
                       │   (Redis)       │
                       │   Port: 6379    │
                       └─────────────────┘
```

## 快速开始

### 环境要求
- Node.js 18.0+
- MongoDB 5.0+
- Redis 7.0+
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/xyzno1AI/Game.git
cd Game
```

2. **安装依赖**
```bash
npm run install:all
```

3. **配置环境变量**
```bash
# 复制后端环境变量模板
cp backend/.env.example backend/.env

# 编辑环境变量
nano backend/.env
```

4. **启动数据库服务**
```bash
# 启动MongoDB
sudo systemctl start mongod

# 启动Redis
sudo systemctl start redis-server
```

5. **启动应用**
```bash
# 开发模式 - 同时启动前后端
npm run dev:backend &
npm run dev:frontend

# 或者分别启动
npm run dev:backend    # 后端开发服务器
npm run dev:frontend   # 前端开发服务器
```

6. **访问应用**
- 前端：http://localhost:3000
- 后端API：http://localhost:8000

### 生产部署
```bash
# 构建前端
npm run build

# 启动生产服务器
npm start
```

## 项目结构

```
Game/
├── backend/                 # 后端代码
│   ├── src/
│   │   ├── app.js          # 应用入口
│   │   ├── config/         # 配置文件
│   │   ├── middleware/     # 中间件
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # 路由定义
│   │   ├── services/       # 业务逻辑
│   │   ├── socket/         # WebSocket处理
│   │   └── utils/          # 工具函数
│   ├── tests/              # 测试文件
│   └── package.json
├── frontend/               # 前端代码
│   ├── public/
│   ├── src/
│   │   ├── components/     # React组件
│   │   ├── pages/          # 页面组件
│   │   ├── services/       # API服务
│   │   ├── store/          # Redux状态管理
│   │   └── tests/          # 测试文件
│   └── package.json
├── docs/                   # 项目文档
│   ├── architecture.md     # 架构设计
│   ├── requirements.md     # 需求文档
│   └── cmmi3/             # CMMI3文档
└── README.md
```

## API文档

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/me` - 获取当前用户信息

### 游戏接口
- `POST /api/games` - 创建游戏
- `POST /api/games/ai` - 创建AI对战
- `GET /api/games` - 获取活跃游戏列表
- `POST /api/games/:id/join` - 加入游戏
- `POST /api/games/:id/move` - 落子
- `POST /api/games/:id/pass` - 停一手
- `POST /api/games/:id/resign` - 认输

### 学习接口
- `GET /api/learning/tutorials` - 获取教程列表
- `POST /api/learning/tutorials/:id/start` - 开始教程
- `GET /api/learning/progress` - 获取学习进度

### 用户接口
- `GET /api/users/profile` - 获取用户资料
- `PUT /api/users/profile` - 更新用户资料
- `GET /api/users/stats` - 获取用户统计
- `GET /api/users/leaderboard` - 获取排行榜

## 游戏规则

### 围棋基本规则
1. **目标**：通过围地和吃子获得更多目数
2. **落子**：黑棋先行，双方轮流在交叉点落子
3. **吃子**：无气的棋子被提掉
4. **禁手**：不能自杀，不能打劫
5. **结束**：双方连续停一手后数子

### 计分方式
- **中国规则**：数子法，黑棋贴3又3/4子
- **支持棋盘**：9×9、13×13、19×19

## 开发指南

### 代码规范
- 使用ESLint进行代码检查
- 遵循Airbnb JavaScript规范
- 组件命名使用PascalCase
- 文件命名使用camelCase

### 测试
```bash
# 运行所有测试
npm test

# 运行后端测试
npm run test:backend

# 运行前端测试
npm run test:frontend

# 代码检查
npm run lint
```

### 提交规范
```bash
# 功能开发
git commit -m "feat: 添加用户注册功能"

# 问题修复
git commit -m "fix: 修复围棋规则判断错误"

# 文档更新
git commit -m "docs: 更新API文档"
```

## 部署指南

### Docker部署
```bash
# 构建镜像
docker build -t game-platform .

# 运行容器
docker-compose up -d
```

### 传统部署
详见 [部署文档](docs/cmmi3/deployment-manual.md)

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系方式

- 项目链接：https://github.com/xyzno1AI/Game
- 问题反馈：https://github.com/xyzno1AI/Game/issues

## 致谢

- [Go/Weiqi规则参考](https://www.britgo.org/intro/intro2.html)
- [React](https://reactjs.org/)
- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/)
- [Socket.io](https://socket.io/)
