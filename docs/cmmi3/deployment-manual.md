# 部署运维手册

## 1. 部署概述

### 1.1 系统架构
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

### 1.2 部署环境要求
- **操作系统**：Ubuntu 20.04+ / CentOS 8+
- **Node.js**：18.0+
- **MongoDB**：5.0+
- **Redis**：7.0+
- **内存**：最低4GB，推荐8GB+
- **存储**：最低20GB，推荐50GB+
- **网络**：稳定的互联网连接

## 2. 环境准备

### 2.1 系统依赖安装

#### Ubuntu/Debian
```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 安装基础工具
sudo apt install -y curl wget git build-essential

# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# 安装Redis
sudo apt install -y redis-server

# 安装PM2
sudo npm install -g pm2
```

### 2.2 防火墙配置
```bash
# Ubuntu UFW
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 3000/tcp    # Frontend (开发环境)
sudo ufw allow 8000/tcp    # Backend API
sudo ufw enable
```

## 3. 数据库配置

### 3.1 MongoDB配置
```bash
# 启动MongoDB服务
sudo systemctl start mongod
sudo systemctl enable mongod

# 创建数据库用户
mongo
```

```javascript
// MongoDB shell命令
use gamedb
db.createUser({
  user: "gameuser",
  pwd: "secure_password_here",
  roles: [
    { role: "readWrite", db: "gamedb" }
  ]
})
```

### 3.2 Redis配置
```bash
# 配置Redis
sudo nano /etc/redis/redis.conf
```

```conf
# /etc/redis/redis.conf
bind 127.0.0.1
port 6379
requirepass your_redis_password_here
maxmemory 256mb
maxmemory-policy allkeys-lru
```

## 4. 应用部署

### 4.1 代码部署
```bash
# 创建应用目录
sudo mkdir -p /opt/game-platform
sudo chown $USER:$USER /opt/game-platform
cd /opt/game-platform

# 克隆代码
git clone https://github.com/xyzno1AI/Game.git .

# 安装后端依赖
cd backend
npm install --production

# 安装前端依赖并构建
cd ../frontend
npm install
npm run build
```

### 4.2 环境变量配置
```bash
# 创建后端环境变量文件
cd /opt/game-platform/backend
cp .env.example .env
nano .env
```

```env
# /opt/game-platform/backend/.env
NODE_ENV=production
PORT=8000

MONGODB_URI=mongodb://gameuser:secure_password_here@localhost:27017/gamedb
REDIS_URL=redis://:your_redis_password_here@localhost:6379

JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here_also_long_and_random
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

BCRYPT_ROUNDS=12
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=info
```

## 5. Web服务器配置

### 5.1 Nginx配置
```bash
# 安装Nginx
sudo apt install -y nginx

# 创建站点配置
sudo nano /etc/nginx/sites-available/game-platform
```

```nginx
# /etc/nginx/sites-available/game-platform
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # 前端静态文件
    location / {
        root /opt/game-platform/frontend/build;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
    
    # API代理
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket代理
    location /socket.io/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## 6. 监控和维护

### 6.1 PM2配置
```bash
# 创建PM2配置文件
cd /opt/game-platform
nano ecosystem.config.js
```

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'game-platform-backend',
      script: './backend/src/app.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 8000
      }
    }
  ]
};
```

### 6.2 备份策略
```bash
# 创建备份脚本
nano /opt/game-platform/scripts/backup.sh
```

```bash
#!/bin/bash
# 数据库备份脚本
BACKUP_DIR="/opt/backups/game-platform"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
mongodump --uri="mongodb://gameuser:password@localhost:27017/gamedb" --out="$BACKUP_DIR/mongodb_$DATE"
tar -czf "$BACKUP_DIR/mongodb_$DATE.tar.gz" -C "$BACKUP_DIR" "mongodb_$DATE"
rm -rf "$BACKUP_DIR/mongodb_$DATE"

# 清理旧备份（保留7天）
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

## 7. 安全配置

### 7.1 系统安全
```bash
# 配置防火墙
sudo ufw enable

# 安装fail2ban
sudo apt install -y fail2ban

# 配置SSH安全
sudo nano /etc/ssh/sshd_config
```

### 7.2 应用安全
- JWT密钥定期轮换
- 数据库连接加密
- API访问频率限制
- 输入验证和过滤

## 8. 故障排除

### 8.1 常见问题
```bash
# 检查服务状态
systemctl status mongod
systemctl status redis-server
pm2 status

# 查看日志
pm2 logs
tail -f /var/log/mongodb/mongod.log
```

### 8.2 性能优化
- 数据库索引优化
- Redis缓存策略
- 静态资源CDN
- 负载均衡配置

这个部署手册提供了完整的生产环境部署指南，确保围棋游戏平台能够稳定可靠地运行。
