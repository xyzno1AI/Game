import React, { useEffect } from 'react';
import { Row, Col, Card, Button, Progress, Typography, List, Tag } from 'antd';
import { PlayCircleOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getTutorials, getProgress } from '../../store/slices/learningSlice';

const { Title, Paragraph } = Typography;

const Learning = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { tutorials, progress, loading } = useSelector(state => state.learning);

  useEffect(() => {
    dispatch(getTutorials());
    dispatch(getProgress());
  }, [dispatch]);

  const getDifficultyColor = (difficulty) => {
    const colors = {
      1: 'green',
      2: 'blue',
      3: 'orange',
      4: 'red',
      5: 'purple'
    };
    return colors[difficulty] || 'default';
  };

  const getDifficultyText = (difficulty) => {
    const texts = {
      1: '入门',
      2: '初级',
      3: '中级',
      4: '高级',
      5: '专家'
    };
    return texts[difficulty] || '未知';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'in_progress':
        return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
      default:
        return <PlayCircleOutlined style={{ color: '#666' }} />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'in_progress':
        return '进行中';
      default:
        return '未开始';
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    return `约 ${minutes} 分钟`;
  };

  const handleStartTutorial = (tutorialId) => {
    navigate(`/tutorial/${tutorialId}`);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Title level={2}>学习中心</Title>
          <Paragraph>
            欢迎来到围棋学习中心！这里有从基础规则到高级技巧的完整教程，
            帮助你逐步掌握围棋的精髓。
          </Paragraph>
        </Col>

        {progress && (
          <Col span={24}>
            <Card title="学习进度">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                      {progress.overallProgress?.currentLevel || 1}
                    </div>
                    <div style={{ color: '#666' }}>当前等级</div>
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                      {progress.overallProgress?.totalTutorialsCompleted || 0}
                    </div>
                    <div style={{ color: '#666' }}>完成教程</div>
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
                      {Math.floor((progress.overallProgress?.totalTimeSpent || 0) / 60)}
                    </div>
                    <div style={{ color: '#666' }}>学习时间(分钟)</div>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        )}

        <Col span={24}>
          <Card title="教程列表" loading={loading}>
            <List
              grid={{ 
                gutter: 16, 
                xs: 1, 
                sm: 1, 
                md: 2, 
                lg: 2, 
                xl: 3 
              }}
              dataSource={tutorials}
              renderItem={(tutorial) => (
                <List.Item>
                  <Card
                    hoverable
                    actions={[
                      <Button 
                        type="primary" 
                        icon={<PlayCircleOutlined />}
                        onClick={() => handleStartTutorial(tutorial.id)}
                        disabled={tutorial.status === 'completed'}
                      >
                        {tutorial.status === 'completed' ? '重新学习' : 
                         tutorial.status === 'in_progress' ? '继续学习' : '开始学习'}
                      </Button>
                    ]}
                  >
                    <Card.Meta
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{tutorial.title}</span>
                          {getStatusIcon(tutorial.status)}
                        </div>
                      }
                      description={
                        <div>
                          <Paragraph ellipsis={{ rows: 2 }}>
                            {tutorial.description}
                          </Paragraph>
                          
                          <div style={{ marginTop: '12px' }}>
                            <Tag color={getDifficultyColor(tutorial.difficulty)}>
                              {getDifficultyText(tutorial.difficulty)}
                            </Tag>
                            <Tag>{formatTime(tutorial.estimatedTime)}</Tag>
                            <Tag color={tutorial.status === 'completed' ? 'success' : 'default'}>
                              {getStatusText(tutorial.status)}
                            </Tag>
                          </div>

                          {tutorial.progress > 0 && (
                            <div style={{ marginTop: '12px' }}>
                              <Progress 
                                percent={Math.round(tutorial.progress * 100)} 
                                size="small"
                                status={tutorial.status === 'completed' ? 'success' : 'active'}
                              />
                            </div>
                          )}
                        </div>
                      }
                    />
                  </Card>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Learning;
