import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Button, List, Avatar, Tag, Modal, Form, Select, Switch, Typography, Space, Spin } from 'antd';
import { PlayCircleOutlined, UserOutlined, EyeOutlined, RobotOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getActiveGames } from '../../store/slices/lobbySlice';
import { createGame } from '../../store/slices/gameSlice';
import gameAPI from '../../services/gameAPI';

const { Title } = Typography;
const { Option } = Select;

const GameLobby = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { activeGames, onlineUsers, loading } = useSelector(state => state.lobby);
  const { user } = useSelector(state => state.auth);
  
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [aiForm] = Form.useForm();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadActiveGames();
    const interval = setInterval(loadActiveGames, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadActiveGames = async () => {
    setRefreshing(true);
    await dispatch(getActiveGames());
    setRefreshing(false);
  };

  const handleCreateGame = async (values) => {
    try {
      const result = await dispatch(createGame(values));
      if (result.type === 'game/createGame/fulfilled') {
        setCreateModalVisible(false);
        form.resetFields();
        navigate(`/game/${result.payload._id}`);
      }
    } catch (error) {
      console.error('Failed to create game:', error);
    }
  };

  const handleCreateAIGame = async (values) => {
    try {
      const response = await gameAPI.createAIGame(values);
      setAiModalVisible(false);
      aiForm.resetFields();
      navigate(`/game/${response.data.game._id}`);
    } catch (error) {
      console.error('Failed to create AI game:', error);
    }
  };

  const handleJoinGame = async (gameId) => {
    navigate(`/game/${gameId}`);
  };

  const formatTimeControl = (timeControl) => {
    const mainMinutes = Math.floor(timeControl.mainTime / 60);
    return `${mainMinutes}分钟 + ${timeControl.increment}秒`;
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <Title level={2}>游戏大厅</Title>
            <Space>
              <Button 
                type="primary" 
                icon={<PlayCircleOutlined />}
                onClick={() => setCreateModalVisible(true)}
              >
                创建对局
              </Button>
              <Button 
                icon={<RobotOutlined />}
                onClick={() => setAiModalVisible(true)}
              >
                人机对战
              </Button>
              <Button onClick={loadActiveGames} loading={refreshing}>
                刷新
              </Button>
            </Space>
          </div>
        </Col>

        <Col xs={24} lg={18}>
          <Card title="活跃对局" loading={loading}>
            <List
              dataSource={activeGames}
              locale={{ emptyText: '暂无活跃对局，创建一个新对局吧！' }}
              renderItem={(game) => (
                <List.Item
                  actions={[
                    <Button 
                      type="primary" 
                      onClick={() => handleJoinGame(game._id)}
                      disabled={game.players.length >= 2}
                    >
                      {game.players.length >= 2 ? '观战' : '加入'}
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<PlayCircleOutlined />} />}
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{game.boardSize}×{game.boardSize} 围棋</span>
                        <div>
                          <Tag color="blue">{formatTimeControl(game.settings.timeControl)}</Tag>
                          {game.settings.isPrivate && <Tag color="orange">私人</Tag>}
                          {game.settings.allowSpectators && <Tag color="green">允许观战</Tag>}
                        </div>
                      </div>
                    }
                    description={
                      <div>
                        <div>
                          <strong>创建者:</strong> {game.players[0]?.username} 
                          (等级 {game.players[0]?.userId?.profile?.level || 1})
                        </div>
                        <div style={{ marginTop: '4px' }}>
                          <strong>玩家:</strong> {game.players.length}/2
                          {game.spectators?.length > 0 && (
                            <span style={{ marginLeft: '16px' }}>
                              <EyeOutlined /> 观战者: {game.spectators.length}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                          创建时间: {new Date(game.createdAt).toLocaleString()}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={6}>
          <Card title={`在线用户 (${onlineUsers.length})`}>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {onlineUsers.map((user, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '8px 0',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <Avatar size="small" icon={<UserOutlined />} />
                  <span style={{ marginLeft: '8px' }}>{user.username}</span>
                </div>
              ))}
              {onlineUsers.length === 0 && (
                <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                  暂无在线用户
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        title="创建新对局"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateGame}
          initialValues={{
            gameType: 'go',
            boardSize: 19,
            timeControl: { mainTime: 1800, increment: 30 },
            isPrivate: false,
            allowSpectators: true,
            allowChat: true
          }}
        >
          <Form.Item
            name="boardSize"
            label="棋盘大小"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value={9}>9×9 (初学者)</Option>
              <Option value={13}>13×13 (中级)</Option>
              <Option value={19}>19×19 (标准)</Option>
            </Select>
          </Form.Item>

          <Form.Item label="时间控制">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name={['timeControl', 'mainTime']}
                  label="基础时间(秒)"
                  rules={[{ required: true }]}
                >
                  <Select>
                    <Option value={600}>10分钟</Option>
                    <Option value={1200}>20分钟</Option>
                    <Option value={1800}>30分钟</Option>
                    <Option value={3600}>60分钟</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name={['timeControl', 'increment']}
                  label="读秒(秒)"
                  rules={[{ required: true }]}
                >
                  <Select>
                    <Option value={0}>无读秒</Option>
                    <Option value={10}>10秒</Option>
                    <Option value={30}>30秒</Option>
                    <Option value={60}>60秒</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>

          <Form.Item name="isPrivate" valuePropName="checked">
            <Switch checkedChildren="私人对局" unCheckedChildren="公开对局" />
          </Form.Item>

          <Form.Item name="allowSpectators" valuePropName="checked">
            <Switch checkedChildren="允许观战" unCheckedChildren="禁止观战" />
          </Form.Item>

          <Form.Item name="allowChat" valuePropName="checked">
            <Switch checkedChildren="允许聊天" unCheckedChildren="禁止聊天" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                创建对局
              </Button>
              <Button onClick={() => setCreateModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="人机对战"
        open={aiModalVisible}
        onCancel={() => setAiModalVisible(false)}
        footer={null}
      >
        <Form
          form={aiForm}
          layout="vertical"
          onFinish={handleCreateAIGame}
          initialValues={{
            boardSize: 19,
            aiDifficulty: 5,
            playerColor: 'black'
          }}
        >
          <Form.Item
            name="boardSize"
            label="棋盘大小"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value={9}>9×9 (初学者)</Option>
              <Option value={13}>13×13 (中级)</Option>
              <Option value={19}>19×19 (标准)</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="aiDifficulty"
            label="AI难度"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value={1}>1级 - 入门</Option>
              <Option value={2}>2级 - 初学</Option>
              <Option value={3}>3级 - 初级</Option>
              <Option value={4}>4级 - 中下</Option>
              <Option value={5}>5级 - 中等</Option>
              <Option value={6}>6级 - 中上</Option>
              <Option value={7}>7级 - 高级</Option>
              <Option value={8}>8级 - 专家</Option>
              <Option value={9}>9级 - 大师</Option>
              <Option value={10}>10级 - 顶级</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="playerColor"
            label="执子颜色"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="black">执黑先行</Option>
              <Option value="white">执白后行</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                开始对战
              </Button>
              <Button onClick={() => setAiModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GameLobby;
