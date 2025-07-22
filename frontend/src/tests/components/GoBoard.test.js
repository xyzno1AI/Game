import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GoBoard from '../../components/Game/GoBoard';

describe('GoBoard Component', () => {
  const mockGameState = {
    board: Array(19).fill(null).map(() => Array(19).fill(null)),
    currentPlayer: 'black'
  };

  test('renders board correctly', () => {
    render(<GoBoard size={19} gameState={mockGameState} />);
    
    const canvas = screen.getByRole('img');
    expect(canvas).toBeInTheDocument();
  });

  test('calls onStonePlace when clicked', () => {
    const mockOnStonePlace = jest.fn();
    
    render(
      <GoBoard 
        size={19} 
        gameState={mockGameState} 
        onStonePlace={mockOnStonePlace}
      />
    );

    const canvas = screen.getByRole('img');
    fireEvent.click(canvas, { clientX: 100, clientY: 100 });

    expect(mockOnStonePlace).toHaveBeenCalled();
  });

  test('does not call onStonePlace when disabled', () => {
    const mockOnStonePlace = jest.fn();
    
    render(
      <GoBoard 
        size={19} 
        gameState={mockGameState} 
        onStonePlace={mockOnStonePlace}
        disabled={true}
      />
    );

    const canvas = screen.getByRole('img');
    fireEvent.click(canvas, { clientX: 100, clientY: 100 });

    expect(mockOnStonePlace).not.toHaveBeenCalled();
  });

  test('displays stones correctly', () => {
    const gameStateWithStones = {
      ...mockGameState,
      board: mockGameState.board.map((row, x) => 
        row.map((cell, y) => {
          if (x === 3 && y === 3) return 'black';
          if (x === 3 && y === 4) return 'white';
          return null;
        })
      )
    };

    render(<GoBoard size={19} gameState={gameStateWithStones} />);
    
    expect(screen.getByRole('img')).toBeInTheDocument();
  });
});
