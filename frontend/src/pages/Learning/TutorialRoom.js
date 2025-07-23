import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, Progress, Alert, Typography, Steps, Space } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined, BulbOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { startTutorial, submitStep, clearFeedback, clearSession } from '../../store/slices/learningSlice';
import GoBoard from '../../components/Game/GoBoard';

const { Title, Paragraph } = Typography;
const { Step } = Steps;

const TutorialRoom = () => {
  const { tutorialId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentSession, currentStep, feedback, loading } = useSelector(state => state.learning);
  const [showHint, setShowHint] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);

  useEffect(() => {
    if (tutorialId) {
      dispatch(startTutorial(tutorialId));
    }

    return () => {
      dispatch(clearSession());
    };
  }, [tutorialId, dispatch]);

  useEffect(() => {
    if (feedback?.type === 'success' && feedback.completed) {
      setTimeout(() => {
        navigate('/learning');
      }, 3000);
    }
  }, [feedback, navigate]);

  const handleStonePlace = async (position) => {
    if (!currentSession || !currentStep) return;

    const action = {
      type: 'move',
      position
    };

    await dispatch(submitStep({
      sessionId: currentSession.sessionId,
      stepId: currentStep.id,
      action
    }));

    setShowHint(false);
    setHintLevel(0);
  };

  const handleShowHint = () => {
    if (!currentStep?.hints) return;
    
    const nextLevel = Math.min(hintLevel + 1, currentStep.hints.length);
    setHintLevel(nextLevel);
    setShowHint(true);
  };

  const handleBack = () => {
    navigate('/learning');
  };

  if (!currentSession || !currentStep) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh' 
      }}>
        <Card>
          <p>加载教程中...</p>
        </Card>
      </div>
    );
  }

  const progressPercent = Math.round((currentSession.currentStep / currentSession.totalSteps) * 100);

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={handleBack}
            >
              返回学习中心
            </Button>
            
            <div style={{ flex: 1, margin: '0 24px' }}>
              <Progress 
                percent={progressPercent} 
                showInfo={false}
                strokeColor="#1890ff"
              />
              <div style={{ textAlign: 'center', marginTop: '8px', color: '#666' }}>
                第 {currentSession.currentStep} 步 / 共 {currentSession.totalSteps} 步
              </div>
            </div>

            <Button 
              icon={<BulbOutlined />}
              onClick={handleShowHint}
              disabled={!currentStep.hints || hintLevel >= currentStep.hints.length}
            >
              提示 ({hintLevel}/{currentStep.hints?.length || 0})
            </Button>
          </div>
        </Col>

        <Col span={24}>
          <Card>
            <Title level={3}>{currentSession.tutorial.title}</Title>
            <Title level={4}>{currentStep.title}</Title>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title="练习棋盘">
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <GoBoard
                size={currentStep.boardSetup?.size || 9}
                gameState={{
                  board: currentStep.boardSetup?.board || Array(currentStep.boardSetup?.size || 9).fill(null).map(() => Array(currentStep.boardSetup?.size || 9).fill(null)),
                  currentPlayer: 'black'
                }}
                onStonePlace={handleStonePlace}
                disabled={loading}
                showCoordinates={true}
                highlightLastMove={false}
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Card title="指导说明">
              <Paragraph>{currentStep.instruction}</Paragraph>
            </Card>

            {showHint && hintLevel > 0 && currentStep.hints && (
              <Card title="提示">
                <Alert
                  message={currentStep.hints[hintLevel - 1]?.text}
                  type="info"
                  showIcon
                  icon={<BulbOutlined />}
                />
              </Card>
            )}

            {feedback && (
              <Card title="反馈">
                {feedback.type === 'success' ? (
                  <Alert
                    message="做得很好！"
                    description={
                      <div>
                        <p>{feedback.message}</p>
                        {feedback.explanation && <p><strong>解释:</strong> {feedback.explanation}</p>}
                        {feedback.completed && (
                          <p style={{ color: '#52c41a', fontWeight: 'bold' }}>
                            🎉 恭喜完成本教程！即将返回学习中心...
                          </p>
                        )}
                      </div>
                    }
                    type="success"
                    showIcon
                  />
                ) : (
                  <Alert
                    message="再试试看"
                    description={
                      <div>
                        <p>{feedback.message}</p>
                        {feedback.explanation && <p><strong>说明:</strong> {feedback.explanation}</p>}
                        {feedback.hint && <p><strong>提示:</strong> {feedback.hint}</p>}
                      </div>
                    }
                    type="warning"
                    showIcon
                    action={
                      <Button 
                        size="small" 
                        onClick={() => dispatch(clearFeedback())}
                      >
                        知道了
                      </Button>
                    }
                  />
                )}
              </Card>
            )}

            <Card title="教程进度">
              <Steps
                direction="vertical"
                size="small"
                current={currentSession.currentStep - 1}
              >
                {Array.from({ length: currentSession.totalSteps }, (_, index) => (
                  <Step
                    key={index}
                    title={`第 ${index + 1} 步`}
                    status={
                      index < currentSession.currentStep - 1 ? 'finish' :
                      index === currentSession.currentStep - 1 ? 'process' : 'wait'
                    }
                  />
                ))}
              </Steps>
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default TutorialRoom;
