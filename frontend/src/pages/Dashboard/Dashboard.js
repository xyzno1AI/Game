import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Button, List, Avatar, Tag, Typography } from 'antd';
import { PlayCircleOutlined, TrophyOutlined, BookOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import userAPI from '../../services/userAPI';
import gameAPI from '../../services/gameAPI';

const { Title } = Typography;

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const [stats, setStats] = useState(null);
  const [recentGames, setRecentGames] = useState([]);
  const [activeGames, setActiveGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, gamesRes, activeRes] = await Promise.all([
        userAPI.getStats(),
        userAPI.getGameHistory({ limit: 5 }),
        gameAPI.getActiveGames({ limit: 10 })
      ]);

      setStats(statsRes.data.stats);
      setRecentGames(gamesRes.data.games);
      setActiveGames(activeRes.data.games);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: '快速对局',
      description: '立即开始一局围棋',
      icon: <PlayCircleOutlined style={{ fontSize: '24px', color: '#1890ff' }} />,
      action: () => navigate('/lobby')
    },
    {
      title: '学习围棋',
      description: '从基础开始学习',
      icon: <BookOutlined style={{ fontSize: '24px', color: '#52c41a' }} />,
      action: () => navigate('/learning')
    },
    {
      title: '查看排行榜',
      description: '看看高手们的表现',
      icon: <TrophyOutlined style={{ fontSize: '24px', color: '#faad14' }} />,
      action: () => navigate('/leaderboard')
    }
  ];

  const formatGameResult = (game) => {
    const resultText = {
      win: '胜利',
      loss: '失败',
      draw: '平局'
    };
    
    const resultColor = {
      win: 'success',
      loss: 'error',
      draw: 'default'
    };

    return (
      <Tag color={resultColor[game.result.userResult]}>
        {resultText[game.result.userResult]}
      </Tag>
    );
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>
        欢迎回来，{user?.username}！
      </Title>

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="当前等级"
              value={user?.profile?.level || 1}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="当前积分"
              value={stats?.rating || 1500}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总对局数"
              value={stats?.totalGames || 0}
              prefix={<PlayCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="胜率"
              value={stats?.winRate || 0}
              suffix="%"
              precision={1}
              valueStyle={{ color: stats?.winRate >= 50 ? '#52c41a' : '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col xs={24} lg={8}>
          <Card title="快速操作" style={{ height: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {quickActions.map((action, index) => (
                <Card
                  key={index}
                  size="small"
                  hoverable
                  onClick={action.action}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {action.icon}
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{action.title}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {action.description}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card 
            title="最近对局" 
            style={{ height: '100%' }}
            extra={
              <Button type="link" onClick={() => navigate('/profile')}>
                查看更多
              </Button>
            }
          >
            <List
              dataSource={recentGames}
              loading={loading}
              locale={{ emptyText: '暂无对局记录' }}
              renderItem={(game) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>vs {game.opponent?.username || 'AI'}</span>
                        {formatGameResult(game)}
                      </div>
                    }
                    description={
                      <div>
                        <div>{game.boardSize}×{game.boardSize} 棋盘</div>
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          {new Date(game.endTime).toLocaleDateString()}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card 
            title="活跃对局" 
            style={{ height: '100%' }}
            extra={
              <Button type="link" onClick={() => navigate('/lobby')}>
                进入大厅
              </Button>
            }
          >
            <List
              dataSource={activeGames}
              loading={loading}
              locale={{ emptyText: '暂无活跃对局' }}
              renderItem={(game) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<PlayCircleOutlined />} />}
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{game.boardSize}×{game.boardSize}</span>
                        <Tag color="blue">等待中</Tag>
                      </div>
                    }
                    description={
                      <div>
                        <div>创建者: {game.players[0]?.username}</div>
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          {new Date(game.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
