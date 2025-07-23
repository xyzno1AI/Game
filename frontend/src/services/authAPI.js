import api from './api';

const authAPI = {
  login: (username, password) => {
    console.log('AuthAPI login called with:', { username, password: '***' });
    return api.post('/auth/login', { username, password });
  },

  register: (userData) => {
    return api.post('/auth/register', userData);
  },

  logout: () => {
    return api.post('/auth/logout');
  },

  getProfile: () => {
    return api.get('/auth/me');
  },

  refreshToken: (refreshToken) => {
    return api.post('/auth/refresh', {}, {
      headers: { Authorization: `Bearer ${refreshToken}` }
    });
  },
};

export default authAPI;
