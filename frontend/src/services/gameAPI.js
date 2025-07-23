import api from './api';

const gameAPI = {
  createGame: (gameData) => {
    return api.post('/games', gameData);
  },

  createAIGame: (gameData) => {
    return api.post('/games/ai', gameData);
  },

  joinGame: (gameId) => {
    return api.post(`/games/${gameId}/join`);
  },

  spectateGame: (gameId) => {
    return api.post(`/games/${gameId}/spectate`);
  },

  getGame: (gameId) => {
    return api.get(`/games/${gameId}`);
  },

  makeMove: (gameId, position) => {
    return api.post(`/games/${gameId}/move`, { position });
  },

  passMove: (gameId) => {
    return api.post(`/games/${gameId}/pass`);
  },

  resignGame: (gameId) => {
    return api.post(`/games/${gameId}/resign`);
  },

  getHint: (gameId) => {
    return api.post(`/games/${gameId}/hint`);
  },

  getActiveGames: (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined) {
        params.append(key, filters[key]);
      }
    });
    return api.get(`/games?${params.toString()}`);
  },
};

export default gameAPI;
