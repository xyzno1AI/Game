import api from './api';

const userAPI = {
  getProfile: () => {
    return api.get('/users/profile');
  },

  updateProfile: (profileData) => {
    return api.put('/users/profile', profileData);
  },

  getGameHistory: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined) {
        searchParams.append(key, params[key]);
      }
    });
    return api.get(`/users/games?${searchParams.toString()}`);
  },

  getStats: (gameType = 'go') => {
    return api.get(`/users/stats?gameType=${gameType}`);
  },

  getLeaderboard: (gameType = 'go', limit = 50) => {
    return api.get(`/users/leaderboard?gameType=${gameType}&limit=${limit}`);
  },
};

export default userAPI;
