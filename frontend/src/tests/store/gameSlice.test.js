import gameReducer, { 
  createGame, 
  joinGame, 
  makeMove,
  setCurrentGame,
  clearGame 
} from '../../store/slices/gameSlice';

describe('gameSlice', () => {
  const initialState = {
    currentGame: null,
    playerColor: null,
    role: null,
    moves: [],
    hint: null,
    loading: false,
    error: null,
    gameHistory: [],
  };

  test('should return initial state', () => {
    expect(gameReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  test('should handle setCurrentGame', () => {
    const mockGame = {
      _id: 'game123',
      boardSize: 19,
      status: 'waiting'
    };

    const actual = gameReducer(initialState, setCurrentGame(mockGame));
    expect(actual.currentGame).toEqual(mockGame);
  });

  test('should handle clearGame', () => {
    const stateWithGame = {
      ...initialState,
      currentGame: { _id: 'game123' },
      playerColor: 'black',
      role: 'player'
    };

    const actual = gameReducer(stateWithGame, clearGame());
    expect(actual.currentGame).toBeNull();
    expect(actual.playerColor).toBeNull();
    expect(actual.role).toBeNull();
  });

  test('should handle createGame.pending', () => {
    const actual = gameReducer(initialState, createGame.pending());
    expect(actual.loading).toBe(true);
    expect(actual.error).toBeNull();
  });

  test('should handle createGame.fulfilled', () => {
    const mockGame = { _id: 'game123', boardSize: 19 };
    const actual = gameReducer(initialState, createGame.fulfilled(mockGame));
    
    expect(actual.loading).toBe(false);
    expect(actual.currentGame).toEqual(mockGame);
    expect(actual.error).toBeNull();
  });

  test('should handle createGame.rejected', () => {
    const errorMessage = 'Failed to create game';
    const actual = gameReducer(initialState, createGame.rejected(null, '', '', errorMessage));
    
    expect(actual.loading).toBe(false);
    expect(actual.error).toBe(errorMessage);
  });
});
