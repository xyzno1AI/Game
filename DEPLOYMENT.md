# 围棋游戏平台部署指南

本文档提供了在不同操作系统上部署围棋游戏平台的详细说明。

## 📋 系统要求

- **Node.js**: 18.0.0 或更高版本
- **MongoDB**: 4.4 或更高版本
- **Redis**: 6.0 或更高版本
- **内存**: 最少 4GB RAM
- **存储**: 最少 2GB 可用空间

---

## 🪟 Windows 环境部署

### 1. 安装 Node.js

**方法一：官方安装包**
1. 访问 [Node.js官网](https://nodejs.org/)
2. 下载 Windows Installer (.msi) - 推荐 LTS 版本
3. 运行安装程序，按默认设置安装
4. 验证安装：
```cmd
node --version
npm --version
```

**方法二：使用 Chocolatey**
```powershell
# 以管理员身份运行 PowerShell
choco install nodejs
```

### 2. 安装 MongoDB

**方法一：官方安装包**
1. 访问 [MongoDB官网](https://www.mongodb.com/try/download/community)
2. 选择 Windows 版本下载 .msi 文件
3. 运行安装程序：
   - 选择 "Complete" 安装类型
   - 勾选 "Install MongoDB as a Service"
   - 勾选 "Install MongoDB Compass"（可选的图形界面工具）

**方法二：使用 Chocolatey**
```powershell
choco install mongodb
```

**启动 MongoDB 服务：**
```cmd
# 启动服务
net start MongoDB

# 验证安装
mongo --version
```

### 3. 安装 Redis

**使用 Windows Subsystem for Linux (WSL) - 推荐**
```bash
# 在 WSL 中安装 Redis
sudo apt update
sudo apt install redis-server

# 启动 Redis
sudo service redis-server start
```

**或使用 Redis for Windows (非官方)**
1. 下载 [Redis for Windows](https://github.com/microsoftarchive/redis/releases)
2. 解压到目标目录
3. 运行 `redis-server.exe`

### 4. 部署应用

```cmd
# 克隆项目
git clone https://github.com/xyzno1AI/Game.git
cd Game

# 安装依赖
npm run install:all

# 配置环境变量
copy backend\.env.example backend\.env
# 编辑 backend\.env 文件，配置数据库连接

# 启动应用
npm run dev
```

### 5. Windows 防火墙配置

```cmd
# 允许端口 3000 (前端) 和 8000 (后端)
netsh advfirewall firewall add rule name="Go Game Frontend" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="Go Game Backend" dir=in action=allow protocol=TCP localport=8000
```

---

## 🐧 Linux 环境部署

### 1. 安装 Node.js

**Ubuntu/Debian:**
```bash
# 使用 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

**CentOS/RHEL/Fedora:**
```bash
# 使用 NodeSource 仓库
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs npm

# 或使用 yum (较老版本)
sudo yum install -y nodejs npm
```

**使用 NVM (推荐):**
```bash
# 安装 NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# 安装最新 LTS Node.js
nvm install --lts
nvm use --lts
```

### 2. 安装 MongoDB

**Ubuntu/Debian:**
```bash
# 导入公钥
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# 添加仓库
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# 安装 MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# 启动服务
sudo systemctl start mongod
sudo systemctl enable mongod

# 验证安装
mongod --version
```

**CentOS/RHEL:**
```bash
# 创建仓库文件
sudo tee /etc/yum.repos.d/mongodb-org-6.0.repo << EOF
[mongodb-org-6.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/8/mongodb-org/6.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-6.0.asc
EOF

# 安装 MongoDB
sudo dnf install -y mongodb-org

# 启动服务
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 3. 安装 Redis

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install -y redis-server

# 启动服务
sudo systemctl start redis-server
sudo systemctl enable redis-server

# 验证安装
redis-cli ping
```

**CentOS/RHEL:**
```bash
sudo dnf install -y redis

# 启动服务
sudo systemctl start redis
sudo systemctl enable redis
```

### 4. 部署应用

```bash
# 克隆项目
git clone https://github.com/xyzno1AI/Game.git
cd Game

# 安装依赖
npm run install:all

# 配置环境变量
cp backend/.env.example backend/.env
# 编辑配置文件
nano backend/.env

# 启动应用
npm run dev
```

### 5. 配置防火墙 (UFW)

```bash
# 允许必要端口
sudo ufw allow 3000/tcp
sudo ufw allow 8000/tcp
sudo ufw enable
```

### 6. 生产环境配置

**使用 PM2 进程管理器:**
```bash
# 安装 PM2
npm install -g pm2

# 创建 PM2 配置文件
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'go-game-backend',
      script: 'backend/src/app.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 8000
      }
    }
  ]
};
EOF

# 启动应用
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**使用 Nginx 反向代理:**
```bash
# 安装 Nginx
sudo apt install -y nginx

# 创建配置文件
sudo tee /etc/nginx/sites-available/go-game << EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# 启用站点
sudo ln -s /etc/nginx/sites-available/go-game /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🍎 macOS 环境部署

### 1. 安装 Homebrew (如果未安装)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. 安装 Node.js

**方法一：使用 Homebrew**
```bash
brew install node

# 验证安装
node --version
npm --version
```

**方法二：使用 NVM**
```bash
# 安装 NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.zshrc

# 安装最新 LTS Node.js
nvm install --lts
nvm use --lts
```

### 3. 安装 MongoDB

**使用 Homebrew:**
```bash
# 添加 MongoDB tap
brew tap mongodb/brew

# 安装 MongoDB Community Edition
brew install mongodb-community

# 启动服务
brew services start mongodb/brew/mongodb-community

# 验证安装
mongod --version
```

**手动启动 MongoDB:**
```bash
# 创建数据目录
sudo mkdir -p /usr/local/var/mongodb
sudo chown $(whoami) /usr/local/var/mongodb

# 启动 MongoDB
mongod --dbpath /usr/local/var/mongodb
```

### 4. 安装 Redis

```bash
# 使用 Homebrew 安装
brew install redis

# 启动服务
brew services start redis

# 验证安装
redis-cli ping
```

### 5. 部署应用

```bash
# 克隆项目
git clone https://github.com/xyzno1AI/Game.git
cd Game

# 安装依赖
npm run install:all

# 配置环境变量
cp backend/.env.example backend/.env
# 编辑配置文件
nano backend/.env

# 启动应用
npm run dev
```

### 6. macOS 防火墙配置

```bash
# 通过系统偏好设置 > 安全性与隐私 > 防火墙
# 或使用命令行 (需要管理员权限)
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/node
```

---

## 🔧 通用配置

### 环境变量配置 (.env)

```env
# 数据库配置
MONGODB_URI=mongodb://localhost:27017/go_game
REDIS_URL=redis://localhost:6379

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# 服务器配置
PORT=8000
NODE_ENV=development

# 前端配置
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_SOCKET_URL=http://localhost:8000
```

### 数据库初始化

```bash
# 连接到 MongoDB
mongo

# 创建数据库和用户
use go_game
db.createUser({
  user: "gameuser",
  pwd: "gamepassword",
  roles: [{ role: "readWrite", db: "go_game" }]
})
```

---

## 🚀 启动应用

### 开发环境

```bash
# 同时启动前后端
npm run dev

# 或分别启动
npm run dev:backend    # 后端服务 (端口 8000)
npm run dev:frontend   # 前端服务 (端口 3000)
```

### 生产环境

```bash
# 构建前端
npm run build:frontend

# 启动生产服务器
npm run start:production
```

---

## 🔍 故障排除

### 常见问题

**1. MongoDB 连接失败**
```bash
# 检查 MongoDB 服务状态
sudo systemctl status mongod  # Linux
brew services list | grep mongodb  # macOS

# 检查端口占用
netstat -an | grep 27017
```

**2. Redis 连接失败**
```bash
# 检查 Redis 服务状态
sudo systemctl status redis  # Linux
brew services list | grep redis  # macOS

# 测试连接
redis-cli ping
```

**3. 端口冲突**
```bash
# 查看端口占用
netstat -tulpn | grep :3000  # Linux
lsof -i :3000  # macOS

# 终止占用进程
kill -9 <PID>
```

**4. 权限问题**
```bash
# 修复 npm 权限 (Linux/macOS)
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

### 日志查看

```bash
# 查看应用日志
npm run logs

# 查看 MongoDB 日志
sudo tail -f /var/log/mongodb/mongod.log  # Linux
tail -f /usr/local/var/log/mongodb/mongo.log  # macOS

# 查看 Redis 日志
sudo tail -f /var/log/redis/redis-server.log  # Linux
tail -f /usr/local/var/log/redis.log  # macOS
```

---

## 📞 技术支持

如果在部署过程中遇到问题，请：

1. 检查系统要求是否满足
2. 确认所有服务正常运行
3. 查看应用日志获取错误信息
4. 参考故障排除部分
5. 提交 Issue 到项目仓库

---

## 📝 更新日志

- **v1.0.0** - 初始部署指南
- 支持 Windows、Linux、macOS 三大平台
- 包含开发和生产环境配置
- 提供完整的故障排除指南
