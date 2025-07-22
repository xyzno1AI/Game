import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Line, Circle, Text } from 'react-konva';

const GoBoard = ({ 
  size = 19, 
  gameState, 
  onStonePlace, 
  disabled = false,
  showCoordinates = true,
  highlightLastMove = true 
}) => {
  const stageRef = useRef();
  const [stageSize, setStageSize] = useState({ width: 600, height: 600 });
  const [hoveredPosition, setHoveredPosition] = useState(null);

  const cellSize = Math.min(stageSize.width, stageSize.height) / (size + 1);
  const boardOffset = cellSize;

  useEffect(() => {
    const updateSize = () => {
      const container = stageRef.current?.container();
      if (container) {
        const containerWidth = container.offsetWidth;
        const maxSize = Math.min(containerWidth, 600);
        setStageSize({ width: maxSize, height: maxSize });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const getPositionFromCoords = (x, y) => {
    const boardX = Math.round((x - boardOffset) / cellSize);
    const boardY = Math.round((y - boardOffset) / cellSize);
    
    if (boardX >= 0 && boardX < size && boardY >= 0 && boardY < size) {
      return { x: boardX, y: boardY };
    }
    return null;
  };

  const getCoordsFromPosition = (boardX, boardY) => {
    return {
      x: boardOffset + boardX * cellSize,
      y: boardOffset + boardY * cellSize
    };
  };

  const handleStageClick = (e) => {
    if (disabled) return;

    const pos = e.target.getStage().getPointerPosition();
    const boardPos = getPositionFromCoords(pos.x, pos.y);
    
    if (boardPos && onStonePlace) {
      onStonePlace(boardPos);
    }
  };

  const handleMouseMove = (e) => {
    if (disabled) return;

    const pos = e.target.getStage().getPointerPosition();
    const boardPos = getPositionFromCoords(pos.x, pos.y);
    setHoveredPosition(boardPos);
  };

  const handleMouseLeave = () => {
    setHoveredPosition(null);
  };

  const renderGrid = () => {
    const lines = [];
    
    for (let i = 0; i < size; i++) {
      const coord = boardOffset + i * cellSize;
      
      lines.push(
        <Line
          key={`h-${i}`}
          points={[boardOffset, coord, boardOffset + (size - 1) * cellSize, coord]}
          stroke="#000"
          strokeWidth={1}
        />
      );
      
      lines.push(
        <Line
          key={`v-${i}`}
          points={[coord, boardOffset, coord, boardOffset + (size - 1) * cellSize]}
          stroke="#000"
          strokeWidth={1}
        />
      );
    }

    return lines;
  };

  const renderStarPoints = () => {
    const starPoints = [];
    const getStarPositions = (boardSize) => {
      if (boardSize === 19) {
        return [
          [3, 3], [3, 9], [3, 15],
          [9, 3], [9, 9], [9, 15],
          [15, 3], [15, 9], [15, 15]
        ];
      } else if (boardSize === 13) {
        return [
          [3, 3], [3, 9],
          [6, 6],
          [9, 3], [9, 9]
        ];
      } else if (boardSize === 9) {
        return [
          [2, 2], [2, 6],
          [4, 4],
          [6, 2], [6, 6]
        ];
      }
      return [];
    };

    const positions = getStarPositions(size);
    positions.forEach(([x, y], index) => {
      const coords = getCoordsFromPosition(x, y);
      starPoints.push(
        <Circle
          key={`star-${index}`}
          x={coords.x}
          y={coords.y}
          radius={3}
          fill="#000"
        />
      );
    });

    return starPoints;
  };

  const renderStones = () => {
    const stones = [];
    
    if (!gameState?.board) return stones;

    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const stone = gameState.board[x][y];
        if (stone) {
          const coords = getCoordsFromPosition(x, y);
          const isLastMove = highlightLastMove && 
            gameState.moves?.length > 0 && 
            gameState.moves[gameState.moves.length - 1]?.position?.x === x &&
            gameState.moves[gameState.moves.length - 1]?.position?.y === y;

          stones.push(
            <Circle
              key={`stone-${x}-${y}`}
              x={coords.x}
              y={coords.y}
              radius={cellSize * 0.4}
              fill={stone === 'black' ? '#000' : '#fff'}
              stroke={stone === 'black' ? '#333' : '#000'}
              strokeWidth={isLastMove ? 3 : 1}
            />
          );

          if (isLastMove) {
            stones.push(
              <Circle
                key={`last-move-${x}-${y}`}
                x={coords.x}
                y={coords.y}
                radius={cellSize * 0.15}
                fill={stone === 'black' ? '#fff' : '#000'}
              />
            );
          }
        }
      }
    }

    return stones;
  };

  const renderHoverStone = () => {
    if (!hoveredPosition || disabled) return null;
    
    const { x, y } = hoveredPosition;
    if (gameState?.board?.[x]?.[y]) return null;

    const coords = getCoordsFromPosition(x, y);
    const currentPlayer = gameState?.currentPlayer || 'black';
    
    return (
      <Circle
        x={coords.x}
        y={coords.y}
        radius={cellSize * 0.4}
        fill={currentPlayer === 'black' ? '#000' : '#fff'}
        stroke={currentPlayer === 'black' ? '#333' : '#000'}
        strokeWidth={1}
        opacity={0.5}
      />
    );
  };

  const renderCoordinates = () => {
    if (!showCoordinates) return null;

    const coords = [];
    const letters = 'ABCDEFGHJKLMNOPQRST';
    
    for (let i = 0; i < size; i++) {
      const coord = boardOffset + i * cellSize;
      
      coords.push(
        <Text
          key={`coord-h-${i}`}
          x={coord - 5}
          y={boardOffset - 25}
          text={letters[i]}
          fontSize={12}
          fill="#666"
        />
      );
      
      coords.push(
        <Text
          key={`coord-v-${i}`}
          x={boardOffset - 20}
          y={coord - 6}
          text={String(size - i)}
          fontSize={12}
          fill="#666"
        />
      );
    }

    return coords;
  };

  return (
    <div style={{ 
      background: '#deb887', 
      padding: '20px', 
      borderRadius: '8px',
      display: 'inline-block'
    }}>
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        onClick={handleStageClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <Layer>
          {renderGrid()}
          {renderStarPoints()}
          {renderCoordinates()}
          {renderStones()}
          {renderHoverStone()}
        </Layer>
      </Stage>
    </div>
  );
};

export default GoBoard;
