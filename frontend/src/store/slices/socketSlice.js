import { createSlice } from '@reduxjs/toolkit';
import { io } from 'socket.io-client';
import { updateGameState, addMove, setGameResult } from './gameSlice';
import { updateOnlineUsers } from './lobbySlice';

const socketSlice = createSlice({
  name: 'socket',
  initialState: {
    socket: null,
    connected: false,
    error: null,
  },
  reducers: {
    setSocket: (state, action) => {
      state.socket = action.payload;
    },
    setConnected: (state, action) => {
      state.connected = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { setSocket, setConnected, setError, clearError } = socketSlice.actions;

export const connectSocket = (token) => (dispatch) => {
  const socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:8000', {
    auth: { token },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    dispatch(setConnected(true));
    dispatch(clearError());
  });

  socket.on('disconnect', () => {
    dispatch(setConnected(false));
  });

  socket.on('error', (error) => {
    dispatch(setError(error.message));
  });

  socket.on('game:update', (gameState) => {
    dispatch(updateGameState(gameState));
  });

  socket.on('game:move', (data) => {
    dispatch(addMove(data.move));
    dispatch(updateGameState(data.gameState));
  });

  socket.on('game:pass', (data) => {
    dispatch(updateGameState(data.gameState));
  });

  socket.on('game:end', (result) => {
    dispatch(setGameResult(result));
  });

  socket.on('game:resign', (data) => {
    dispatch(setGameResult(data.result));
  });

  socket.on('user:online', (user) => {
    dispatch(updateOnlineUsers({ type: 'add', user }));
  });

  socket.on('user:offline', (user) => {
    dispatch(updateOnlineUsers({ type: 'remove', user }));
  });

  dispatch(setSocket(socket));
};

export const disconnectSocket = () => (dispatch, getState) => {
  const { socket } = getState().socket;
  if (socket) {
    socket.disconnect();
    dispatch(setSocket(null));
    dispatch(setConnected(false));
  }
};

export const joinGameRoom = (gameId) => (dispatch, getState) => {
  const { socket } = getState().socket;
  if (socket) {
    socket.emit('game:join', { gameId });
  }
};

export const leaveGameRoom = (gameId) => (dispatch, getState) => {
  const { socket } = getState().socket;
  if (socket) {
    socket.emit('game:leave', { gameId });
  }
};

export const sendMove = (gameId, move) => (dispatch, getState) => {
  const { socket } = getState().socket;
  if (socket) {
    socket.emit('game:move', { gameId, move });
  }
};

export const sendPass = (gameId) => (dispatch, getState) => {
  const { socket } = getState().socket;
  if (socket) {
    socket.emit('game:pass', { gameId });
  }
};

export const sendResign = (gameId) => (dispatch, getState) => {
  const { socket } = getState().socket;
  if (socket) {
    socket.emit('game:resign', { gameId });
  }
};

export const sendChatMessage = (gameId, message) => (dispatch, getState) => {
  const { socket } = getState().socket;
  if (socket) {
    socket.emit('chat:message', { gameId, message });
  }
};

export default socketSlice.reducer;
