import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import gameAPI from '../../services/gameAPI';

export const getActiveGames = createAsyncThunk(
  'lobby/getActiveGames',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await gameAPI.getActiveGames(filters);
      return response.data.games;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to load games');
    }
  }
);

const lobbySlice = createSlice({
  name: 'lobby',
  initialState: {
    activeGames: [],
    onlineUsers: [],
    loading: false,
    error: null,
  },
  reducers: {
    updateOnlineUsers: (state, action) => {
      const { type, user } = action.payload;
      if (type === 'add') {
        if (!state.onlineUsers.find(u => u.userId === user.userId)) {
          state.onlineUsers.push(user);
        }
      } else if (type === 'remove') {
        state.onlineUsers = state.onlineUsers.filter(u => u.userId !== user.userId);
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getActiveGames.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getActiveGames.fulfilled, (state, action) => {
        state.loading = false;
        state.activeGames = action.payload;
        state.error = null;
      })
      .addCase(getActiveGames.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { updateOnlineUsers, clearError } = lobbySlice.actions;
export default lobbySlice.reducer;
