import React, { useEffect, useState } from 'react';
import { Card, Table, Avatar, Tag, Select, Typography, Row, Col, Statistic } from 'antd';
import { TrophyOutlined, UserOutlined, CrownOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import userAPI from '../../services/userAPI';

const { Title } = Typography;
const { Option } = Select;

const Leaderboard = () => {
  const { user } = useSelector(state => state.auth);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gameType, setGameType] = useState('go');
  const [userRank, setUserRank] = useState(null);

  useEffect(() => {
    loadLeaderboard();
  }, [gameType]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getLeaderboard(gameType, 100);
      setLeaderboard(response.data.leaderboard);
      
      const currentUserRank = response.data.leaderboard.findIndex(
        player => player.username === user?.username
      );
      setUserRank(currentUserRank >= 0 ? currentUserRank + 1 : null);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <CrownOutlined style={{ color: '#ffd700' }} />;
    if (rank === 2) return <CrownOutlined style={{ color: '#c0c0c0' }} />;
    if (rank === 3) return <CrownOutlined style={{ color: '#cd7f32' }} />;
    return <TrophyOutlined style={{ color: '#666' }} />;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return '#ffd700';
    if (rank === 2) return '#c0c0c0';
    if (rank === 3) return '#cd7f32';
    return '#666';
  };

  const columns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (rank) => (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: getRankColor(rank),
          fontWeight: rank <= 3 ? 'bold' : 'normal'
        }}>
          {getRankIcon(rank)}
          <span style={{ marginLeft: '8px' }}>{rank}</span>
        </div>
      ),
    },
    {
      title: '玩家',
      dataIndex: 'username',
      key: 'username',
      render: (username, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            size="small" 
            icon={<UserOutlined />} 
            style={{ marginRight: '8px' }}
          />
          <div>
            <div style={{ 
              fontWeight: username === user?.username ? 'bold' : 'normal',
              color: username === user?.username ? '#1890ff' : 'inherit'
            }}>
              {username}
              {username === user?.username && (
                <Tag color="blue" size="small" style={{ marginLeft: '8px' }}>
                  我
                </Tag>
              )}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              等级 {record.level}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '积分',
      dataIndex: 'rating',
      key: 'rating',
      width: 100,
      sorter: (a, b) => b.rating - a.rating,
      render: (rating) => (
        <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
          {rating}
        </span>
      ),
    },
    {
      title: '对局数',
      dataIndex: 'totalGames',
      key: 'totalGames',
      width: 100,
      sorter: (a, b) => b.totalGames - a.totalGames,
    },
    {
      title: '胜率',
      dataIndex: 'winRate',
      key: 'winRate',
      width: 100,
      sorter: (a, b) => parseFloat(b.winRate) - parseFloat(a.winRate),
      render: (winRate) => (
        <span style={{ 
          color: parseFloat(winRate) >= 50 ? '#52c41a' : '#f5222d',
          fontWeight: 'bold'
        }}>
          {winRate}%
        </span>
      ),
    },
  ];

  const topThree = leaderboard.slice(0, 3);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={2}>排行榜</Title>
            <Select
              value={gameType}
              onChange={setGameType}
              style={{ width: 120 }}
            >
              <Option value="go">围棋</Option>
            </Select>
          </div>
        </Col>

        {userRank && (
          <Col span={24}>
            <Card>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="我的排名"
                    value={userRank}
                    prefix={<TrophyOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="我的积分"
                    value={user?.gameStats?.go?.rating || 1500}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="总玩家数"
                    value={leaderboard.length}
                    valueStyle={{ color: '#666' }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        )}

        {topThree.length > 0 && (
          <Col span={24}>
            <Card title="前三名">
              <Row gutter={16} justify="center">
                {topThree.map((player, index) => (
                  <Col key={player.username} xs={24} sm={8}>
                    <Card
                      size="small"
                      style={{
                        textAlign: 'center',
                        background: index === 0 ? '#fff7e6' : 
                                   index === 1 ? '#f6f6f6' : '#fff2e8',
                        border: `2px solid ${getRankColor(index + 1)}`
                      }}
                    >
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                        {getRankIcon(index + 1)}
                      </div>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                        {player.username}
                      </div>
                      <div style={{ color: '#666', marginBottom: '8px' }}>
                        等级 {player.level}
                      </div>
                      <div style={{ 
                        fontSize: '20px', 
                        fontWeight: 'bold', 
                        color: '#52c41a' 
                      }}>
                        {player.rating}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {player.totalGames} 局 | {player.winRate}% 胜率
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        )}

        <Col span={24}>
          <Card title="完整排行榜">
            <Table
              columns={columns}
              dataSource={leaderboard}
              loading={loading}
              rowKey="username"
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 名玩家`,
              }}
              rowClassName={(record) => 
                record.username === user?.username ? 'current-user-row' : ''
              }
            />
          </Card>
        </Col>
      </Row>

      <style jsx>{`
        .current-user-row {
          background-color: #e6f7ff !important;
        }
        .current-user-row:hover {
          background-color: #bae7ff !important;
        }
      `}</style>
    </div>
  );
};

export default Leaderboard;
