import React from 'react';
import { Card, Row, Col, Avatar, Progress, Tag } from 'antd';
import { UserOutlined } from '@ant-design/icons';

const GameInfo = ({ gameState, currentUser }) => {
  if (!gameState) return null;

  const { players, gameState: state, spectators } = gameState;
  const blackPlayer = players.find(p => p.color === 'black');
  const whitePlayer = players.find(p => p.color === 'white');

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const PlayerCard = ({ player, isCurrentPlayer }) => (
    <Card 
      size="small" 
      className={`player-info ${isCurrentPlayer ? 'current' : ''}`}
      style={{ 
        border: isCurrentPlayer ? '2px solid #1890ff' : '1px solid #d9d9d9',
        backgroundColor: isCurrentPlayer ? '#e6f7ff' : '#fff'
      }}
    >
      <Row align="middle" justify="space-between">
        <Col>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div 
              className={`stone-indicator ${player.color}`}
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: player.color === 'black' ? '#000' : '#fff',
                border: '2px solid #666'
              }}
            />
            <div>
              <div style={{ fontWeight: 'bold' }}>{player.username}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                等级 {player.userId?.profile?.level || 1} | 
                积分 {player.rating || 1500}
              </div>
            </div>
          </div>
        </Col>
        <Col>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
              {formatTime(player.timeControl?.timeRemaining || 0)}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              剩余时间
            </div>
          </div>
        </Col>
      </Row>
    </Card>
  );

  return (
    <div className="game-info">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="对局信息" size="small">
            <Row gutter={16}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                    {gameState.boardSize}×{gameState.boardSize}
                  </div>
                  <div style={{ color: '#666' }}>棋盘大小</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                    {state?.moveNumber || 0}
                  </div>
                  <div style={{ color: '#666' }}>手数</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Tag color={gameState.status === 'playing' ? 'green' : 'default'}>
                    {gameState.status === 'playing' ? '进行中' : 
                     gameState.status === 'waiting' ? '等待中' : '已结束'}
                  </Tag>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col span={24}>
          <div style={{ marginBottom: '8px' }}>
            <PlayerCard 
              player={blackPlayer} 
              isCurrentPlayer={state?.currentPlayer === 'black'} 
            />
          </div>
          <div>
            <PlayerCard 
              player={whitePlayer} 
              isCurrentPlayer={state?.currentPlayer === 'white'} 
            />
          </div>
        </Col>

        <Col span={24}>
          <Card title="提子统计" size="small">
            <div className="captured-stones">
              <Row gutter={16}>
                <Col span={12}>
                  <div className="stone-count">
                    <div className="stone-indicator black" />
                    <span>黑棋提子: {state?.capturedStones?.black || 0}</span>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="stone-count">
                    <div className="stone-indicator white" />
                    <span>白棋提子: {state?.capturedStones?.white || 0}</span>
                  </div>
                </Col>
              </Row>
            </div>
          </Card>
        </Col>

        {spectators && spectators.length > 0 && (
          <Col span={24}>
            <Card title={`观战者 (${spectators.length})`} size="small">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {spectators.map((spectator, index) => (
                  <Tag key={index} icon={<UserOutlined />}>
                    {spectator.username}
                  </Tag>
                ))}
              </div>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default GameInfo;
