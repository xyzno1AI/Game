import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import gameAPI from '../../services/gameAPI';

export const createGame = createAsyncThunk(
  'game/createGame',
  async (gameData, { rejectWithValue }) => {
    try {
      const response = await gameAPI.createGame(gameData);
      return response.data.game;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to create game');
    }
  }
);

export const joinGame = createAsyncThunk(
  'game/joinGame',
  async (gameId, { rejectWithValue }) => {
    try {
      const response = await gameAPI.joinGame(gameId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to join game');
    }
  }
);

export const makeMove = createAsyncThunk(
  'game/makeMove',
  async ({ gameId, position }, { rejectWithValue }) => {
    try {
      const response = await gameAPI.makeMove(gameId, position);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Invalid move');
    }
  }
);

export const passMove = createAsyncThunk(
  'game/passMove',
  async (gameId, { rejectWithValue }) => {
    try {
      const response = await gameAPI.passMove(gameId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to pass');
    }
  }
);

export const resignGame = createAsyncThunk(
  'game/resignGame',
  async (gameId, { rejectWithValue }) => {
    try {
      const response = await gameAPI.resignGame(gameId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to resign');
    }
  }
);

export const getHint = createAsyncThunk(
  'game/getHint',
  async (gameId, { rejectWithValue }) => {
    try {
      const response = await gameAPI.getHint(gameId);
      return response.data.hint;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to get hint');
    }
  }
);

const gameSlice = createSlice({
  name: 'game',
  initialState: {
    currentGame: null,
    playerColor: null,
    role: null,
    moves: [],
    hint: null,
    loading: false,
    error: null,
    gameHistory: [],
  },
  reducers: {
    setCurrentGame: (state, action) => {
      state.currentGame = action.payload;
    },
    updateGameState: (state, action) => {
      if (state.currentGame && state.currentGame._id === action.payload._id) {
        state.currentGame = action.payload;
      }
    },
    addMove: (state, action) => {
      state.moves.push(action.payload);
      if (state.currentGame) {
        state.currentGame.moves = state.moves;
      }
    },
    clearGame: (state) => {
      state.currentGame = null;
      state.playerColor = null;
      state.role = null;
      state.moves = [];
      state.hint = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearHint: (state) => {
      state.hint = null;
    },
    setGameResult: (state, action) => {
      if (state.currentGame) {
        state.currentGame.result = action.payload;
        state.currentGame.status = 'finished';
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createGame.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createGame.fulfilled, (state, action) => {
        state.loading = false;
        state.currentGame = action.payload;
        state.error = null;
      })
      .addCase(createGame.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(joinGame.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(joinGame.fulfilled, (state, action) => {
        state.loading = false;
        state.currentGame = action.payload.game;
        state.playerColor = action.payload.playerColor;
        state.role = action.payload.role;
        state.moves = action.payload.game.moves || [];
        state.error = null;
      })
      .addCase(joinGame.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(makeMove.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(makeMove.fulfilled, (state, action) => {
        state.loading = false;
        state.currentGame = action.payload.gameState;
        state.moves = action.payload.gameState.moves || [];
        state.error = null;
      })
      .addCase(makeMove.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(passMove.fulfilled, (state, action) => {
        state.currentGame = action.payload.gameState;
        state.moves = action.payload.gameState.moves || [];
      })
      .addCase(resignGame.fulfilled, (state, action) => {
        if (state.currentGame) {
          state.currentGame.result = action.payload.result;
          state.currentGame.status = 'finished';
        }
      })
      .addCase(getHint.fulfilled, (state, action) => {
        state.hint = action.payload;
      })
      .addCase(getHint.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const {
  setCurrentGame,
  updateGameState,
  addMove,
  clearGame,
  clearError,
  clearHint,
  setGameResult,
} = gameSlice.actions;

export default gameSlice.reducer;
