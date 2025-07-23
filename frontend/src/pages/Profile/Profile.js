import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Form, Input, Button, Avatar, Statistic, List, Tag, Tabs, Progress } from 'antd';
import { UserOutlined, EditOutlined, TrophyOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser } from '../../store/slices/authSlice';
import userAPI from '../../services/userAPI';

const { TabPane } = Tabs;
const { TextArea } = Input;

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const [statsRes, historyRes] = await Promise.all([
        userAPI.getStats(),
        userAPI.getGameHistory({ limit: 20 })
      ]);
      
      setStats(statsRes.data.stats);
      setGameHistory(historyRes.data.games);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const handleUpdateProfile = async (values) => {
    try {
      setLoading(true);
      const response = await userAPI.updateProfile(values);
      dispatch(updateUser(response.data.user));
      form.resetFields();
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const calculateLevelProgress = () => {
    const currentExp = user?.profile?.experience || 0;
    const currentLevel = user?.profile?.level || 1;
    const expForCurrentLevel = (currentLevel - 1) * (currentLevel - 1) * 100;
    const expForNextLevel = currentLevel * currentLevel * 100;
    const progressExp = currentExp - expForCurrentLevel;
    const neededExp = expForNextLevel - expForCurrentLevel;
    
    return {
      current: progressExp,
      total: neededExp,
      percent: Math.round((progressExp / neededExp) * 100)
    };
  };

  const levelProgress = calculateLevelProgress();

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Avatar 
                size={120} 
                icon={<UserOutlined />}
                src={user?.profile?.avatar}
                style={{ marginBottom: '16px' }}
              />
              <h2>{user?.username}</h2>
              <p style={{ color: '#666' }}>{user?.profile?.displayName || '暂无昵称'}</p>
              
              <div style={{ margin: '16px 0' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                  等级 {user?.profile?.level || 1}
                </div>
                <Progress 
                  percent={levelProgress.percent}
                  showInfo={false}
                  strokeColor="#1890ff"
                  style={{ margin: '8px 0' }}
                />
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {levelProgress.current} / {levelProgress.total} 经验值
                </div>
              </div>
            </div>

            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="当前积分"
                  value={stats?.rating || 1500}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="总对局"
                  value={stats?.totalGames || 0}
                  prefix={<PlayCircleOutlined />}
                />
              </Col>
            </Row>
          </Card>

          <Card title="统计信息" style={{ marginTop: '16px' }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="胜利场次"
                  value={stats?.wins || 0}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="失败场次"
                  value={stats?.losses || 0}
                  valueStyle={{ color: '#f5222d' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="胜率"
                  value={stats?.winRate || 0}
                  suffix="%"
                  precision={1}
                  valueStyle={{ color: stats?.winRate >= 50 ? '#52c41a' : '#f5222d' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="连胜记录"
                  value={stats?.bestWinStreak || 0}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Tabs defaultActiveKey="profile">
            <TabPane tab="个人信息" key="profile">
              <Card title="编辑个人信息">
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleUpdateProfile}
                  initialValues={{
                    displayName: user?.profile?.displayName || '',
                    bio: user?.profile?.bio || '',
                    country: user?.profile?.country || '',
                    timezone: user?.profile?.timezone || 'UTC'
                  }}
                >
                  <Form.Item
                    name="displayName"
                    label="显示名称"
                  >
                    <Input placeholder="输入显示名称" />
                  </Form.Item>

                  <Form.Item
                    name="bio"
                    label="个人简介"
                  >
                    <TextArea 
                      rows={4} 
                      placeholder="介绍一下自己..." 
                      maxLength={500}
                      showCount
                    />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="country"
                        label="国家/地区"
                      >
                        <Input placeholder="如: CN" maxLength={2} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="timezone"
                        label="时区"
                      >
                        <Input placeholder="如: Asia/Shanghai" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      loading={loading}
                      icon={<EditOutlined />}
                    >
                      更新信息
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </TabPane>

            <TabPane tab="对局历史" key="history">
              <Card title="最近对局">
                <List
                  dataSource={gameHistory}
                  loading={historyLoading}
                  locale={{ emptyText: '暂无对局记录' }}
                  renderItem={(game) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar icon={<PlayCircleOutlined />} />}
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>vs {game.opponent?.username || 'AI'}</span>
                            <div>
                              {formatGameResult(game)}
                              {game.ratingChange !== 0 && (
                                <Tag color={game.ratingChange > 0 ? 'green' : 'red'}>
                                  {game.ratingChange > 0 ? '+' : ''}{game.ratingChange}
                                </Tag>
                              )}
                            </div>
                          </div>
                        }
                        description={
                          <div>
                            <div>
                              {game.boardSize}×{game.boardSize} 棋盘 | 
                              用时: {Math.floor(game.duration / 60)}分{game.duration % 60}秒
                            </div>
                            <div style={{ fontSize: '12px', color: '#999' }}>
                              {new Date(game.endTime).toLocaleString()}
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </TabPane>
          </Tabs>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;
