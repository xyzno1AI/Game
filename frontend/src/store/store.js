import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import gameReducer from './slices/gameSlice';
import socketReducer from './slices/socketSlice';
import learningReducer from './slices/learningSlice';
import lobbyReducer from './slices/lobbySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    game: gameReducer,
    socket: socketReducer,
    learning: learningReducer,
    lobby: lobbyReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['socket/setSocket'],
        ignoredPaths: ['socket.socket'],
      },
    }),
});
