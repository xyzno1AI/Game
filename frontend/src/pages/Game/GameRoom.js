import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, message, Modal, Input, List, Typography, Space, Tag } from 'antd';
import { ArrowLeftOutlined, MessageOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { joinGameRoom, leaveGameRoom, sendMove, sendPass, sendResign, sendChatMessage } from '../../store/slices/socketSlice';
import { joinGame, makeMove, passMove, resignGame, getHint, clearGame, clearError, clearHint } from '../../store/slices/gameSlice';
import GoBoard from '../../components/Game/GoBoard';
import GameControls from '../../components/Game/GameControls';
import GameInfo from '../../components/Game/GameInfo';

const { Text } = Typography;
const { TextArea } = Input;

const GameRoom = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentGame, playerColor, role, hint, loading, error } = useSelector(state => state.game);
  const { user } = useSelector(state => state.auth);
  const { connected } = useSelector(state => state.socket);
  
  const [chatVisible, setChatVisible] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [gameResult, setGameResult] = useState(null);

  useEffect(() => {
    if (gameId && connected) {
      dispatch(joinGame(gameId)).then((result) => {
        if (result.type === 'game/joinGame/fulfilled') {
          dispatch(joinGameRoom(gameId));
        }
      });
    }

    return () => {
      if (gameId) {
        dispatch(leaveGameRoom(gameId));
        dispatch(clearGame());
      }
    };
  }, [gameId, connected, dispatch]);

  useEffect(() => {
    if (error) {
      message.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (hint) {
      Modal.info({
        title: '提示',
        content: (
          <div>
            {hint.suggestedMove && (
              <p><strong>建议落子:</strong> ({hint.suggestedMove.x + 1}, {hint.suggestedMove.y + 1})</p>
            )}
            {hint.explanation && (
              <p><strong>解释:</strong> {hint.explanation}</p>
            )}
            {hint.reasoning && (
              <p><strong>原因:</strong> {hint.reasoning}</p>
            )}
          </div>
        ),
        onOk: () => dispatch(clearHint())
      });
    }
  }, [hint, dispatch]);

  useEffect(() => {
    if (currentGame?.status === 'finished' && !gameResult) {
      setGameResult(currentGame.result);
      showGameResult(currentGame.result);
    }
  }, [currentGame, gameResult]);

  const showGameResult = (result) => {
    const getResultText = () => {
      if (result.winner === 'draw') {
        return '平局';
      }
      
      if (role === 'player') {
        const isWinner = result.winner === playerColor;
        return isWinner ? '恭喜获胜！' : '很遗憾败北';
      }
      
      return `${result.winner === 'black' ? '黑棋' : '白棋'}获胜`;
    };

    const getMethodText = () => {
      switch (result.method) {
        case 'resignation': return '认输';
        case 'timeout': return '超时';
        case 'score': return '数子';
        case 'agreement': return '协议';
        default: return '未知';
      }
    };

    Modal.info({
      title: '对局结束',
      content: (
        <div>
          <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
            {getResultText()}
          </p>
          <p>结束方式: {getMethodText()}</p>
          {result.score && (
            <p>
              最终比分: 黑棋 {result.score.black} - 白棋 {result.score.white}
            </p>
          )}
        </div>
      ),
      onOk: () => navigate('/lobby')
    });
  };

  const handleStonePlace = async (position) => {
    if (!currentGame || currentGame.status !== 'playing') return;
    if (role !== 'player' || playerColor !== currentGame.gameState.currentPlayer) return;

    try {
      if (connected) {
        dispatch(sendMove(gameId, { position }));
      } else {
        await dispatch(makeMove({ gameId, position }));
      }
    } catch (error) {
      message.error('落子失败');
    }
  };

  const handlePass = async () => {
    try {
      if (connected) {
        dispatch(sendPass(gameId));
      } else {
        await dispatch(passMove(gameId));
      }
      message.info('停一手');
    } catch (error) {
      message.error('停一手失败');
    }
  };

  const handleResign = async () => {
    try {
      if (connected) {
        dispatch(sendResign(gameId));
      } else {
        await dispatch(resignGame(gameId));
      }
      message.info('已认输');
    } catch (error) {
      message.error('认输失败');
    }
  };

  const handleGetHint = async () => {
    try {
      await dispatch(getHint(gameId));
    } catch (error) {
      message.error('获取提示失败');
    }
  };

  const handleSendChat = () => {
    if (!chatMessage.trim()) return;
    
    if (connected) {
      dispatch(sendChatMessage(gameId, chatMessage));
    }
    setChatMessage('');
  };

  const isPlayerTurn = currentGame?.gameState?.currentPlayer === playerColor;
  const canPlay = role === 'player' && currentGame?.status === 'playing';

  if (!currentGame) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh' 
      }}>
        <Card>
          <p>加载对局中...</p>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/lobby')}
            >
              返回大厅
            </Button>
            
            <Space>
              {!connected && <Tag color="red">连接断开</Tag>}
              {role === 'spectator' && <Tag color="blue">观战模式</Tag>}
              {canPlay && isPlayerTurn && <Tag color="green">轮到你了</Tag>}
              
              {currentGame.settings?.allowChat && (
                <Button 
                  icon={<MessageOutlined />}
                  onClick={() => setChatVisible(!chatVisible)}
                >
                  聊天 {currentGame.chat?.length > 0 && `(${currentGame.chat.length})`}
                </Button>
              )}
            </Space>
          </div>
        </Col>

        <Col xs={24} lg={16}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <GoBoard
                size={currentGame.boardSize}
                gameState={currentGame.gameState}
                onStonePlace={handleStonePlace}
                disabled={!canPlay || !isPlayerTurn || loading}
                showCoordinates={true}
                highlightLastMove={true}
              />
            </div>
            
            {canPlay && (
              <GameControls
                gameState={currentGame.gameState}
                playerColor={playerColor}
                onPass={handlePass}
                onResign={handleResign}
                onHint={handleGetHint}
                disabled={!isPlayerTurn || loading}
                showHint={true}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <GameInfo 
            gameState={currentGame} 
            currentUser={user}
          />
          
          {chatVisible && currentGame.settings?.allowChat && (
            <Card 
              title="聊天" 
              style={{ marginTop: '16px' }}
              bodyStyle={{ padding: 0 }}
            >
              <div className="chat-container">
                <div className="chat-messages">
                  <List
                    dataSource={currentGame.chat || []}
                    locale={{ emptyText: '暂无聊天消息' }}
                    renderItem={(msg) => (
                      <div className="chat-message">
                        <span className="username">{msg.username}:</span>
                        <span style={{ marginLeft: '8px' }}>{msg.message}</span>
                        <span className="timestamp">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  />
                </div>
                
                {canPlay && (
                  <div className="chat-input">
                    <Input.Group compact>
                      <TextArea
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder="输入聊天消息..."
                        autoSize={{ minRows: 1, maxRows: 3 }}
                        onPressEnter={(e) => {
                          if (!e.shiftKey) {
                            e.preventDefault();
                            handleSendChat();
                          }
                        }}
                      />
                      <Button 
                        type="primary" 
                        onClick={handleSendChat}
                        disabled={!chatMessage.trim()}
                      >
                        发送
                      </Button>
                    </Input.Group>
                  </div>
                )}
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default GameRoom;
