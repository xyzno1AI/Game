import api from './api';

const learningAPI = {
  getTutorials: () => {
    return api.get('/learning/tutorials');
  },

  startTutorial: (tutorialId) => {
    return api.post(`/learning/tutorials/${tutorialId}/start`);
  },

  submitStep: (sessionId, stepId, action) => {
    return api.post(`/learning/sessions/${sessionId}/step?stepId=${stepId}`, { action: action.type, data: action });
  },

  getProgress: () => {
    return api.get('/learning/progress');
  },

  getSkills: () => {
    return api.get('/learning/skills');
  },
};

export default learningAPI;
