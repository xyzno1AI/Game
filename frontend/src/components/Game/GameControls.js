import React from 'react';
import { Button, Space, Popconfirm } from 'antd';
import { PlayCircleOutlined, StopOutlined, BulbOutlined } from '@ant-design/icons';

const GameControls = ({
  gameState,
  playerColor,
  onPass,
  onResign,
  onHint,
  disabled = false,
  showHint = true
}) => {
  const isPlayerTurn = gameState?.currentPlayer === playerColor;
  const canAct = !disabled && isPlayerTurn && gameState?.status === 'playing';

  return (
    <div className="game-controls">
      <Space size="middle">
        <Button
          type="default"
          icon={<PlayCircleOutlined />}
          onClick={onPass}
          disabled={!canAct}
          size="large"
        >
          停一手
        </Button>

        <Popconfirm
          title="确定要认输吗？"
          description="认输后游戏将立即结束"
          onConfirm={onResign}
          okText="确定"
          cancelText="取消"
          disabled={!canAct}
        >
          <Button
            type="default"
            danger
            icon={<StopOutlined />}
            disabled={!canAct}
            size="large"
          >
            认输
          </Button>
        </Popconfirm>

        {showHint && (
          <Button
            type="default"
            icon={<BulbOutlined />}
            onClick={onHint}
            disabled={!canAct}
            size="large"
          >
            提示
          </Button>
        )}
      </Space>
    </div>
  );
};

export default GameControls;
