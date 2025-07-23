import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import learningAPI from '../../services/learningAPI';

export const getTutorials = createAsyncThunk(
  'learning/getTutorials',
  async (_, { rejectWithValue }) => {
    try {
      const response = await learningAPI.getTutorials();
      return response.data.tutorials;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to load tutorials');
    }
  }
);

export const startTutorial = createAsyncThunk(
  'learning/startTutorial',
  async (tutorialId, { rejectWithValue }) => {
    try {
      const response = await learningAPI.startTutorial(tutorialId);
      return response.data.session;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to start tutorial');
    }
  }
);

export const submitStep = createAsyncThunk(
  'learning/submitStep',
  async ({ sessionId, stepId, action }, { rejectWithValue }) => {
    try {
      const response = await learningAPI.submitStep(sessionId, stepId, action);
      return response.data.feedback;
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData?.error?.code === 'INCORRECT_MOVE') {
        return rejectWithValue({
          type: 'incorrect',
          message: errorData.error.message,
          hint: errorData.error.data?.hint,
          explanation: errorData.error.data?.explanation,
          suggestedAction: errorData.error.data?.suggestedAction,
        });
      }
      return rejectWithValue(errorData?.error?.message || 'Failed to submit step');
    }
  }
);

export const getProgress = createAsyncThunk(
  'learning/getProgress',
  async (_, { rejectWithValue }) => {
    try {
      const response = await learningAPI.getProgress();
      return response.data.progress;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to load progress');
    }
  }
);

const learningSlice = createSlice({
  name: 'learning',
  initialState: {
    tutorials: [],
    currentSession: null,
    currentStep: null,
    feedback: null,
    progress: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearFeedback: (state) => {
      state.feedback = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setCurrentStep: (state, action) => {
      state.currentStep = action.payload;
    },
    clearSession: (state) => {
      state.currentSession = null;
      state.currentStep = null;
      state.feedback = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getTutorials.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTutorials.fulfilled, (state, action) => {
        state.loading = false;
        state.tutorials = action.payload;
        state.error = null;
      })
      .addCase(getTutorials.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(startTutorial.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startTutorial.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSession = action.payload;
        state.currentStep = action.payload.step;
        state.feedback = null;
        state.error = null;
      })
      .addCase(startTutorial.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(submitStep.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.feedback = null;
      })
      .addCase(submitStep.fulfilled, (state, action) => {
        state.loading = false;
        state.feedback = {
          type: 'success',
          ...action.payload,
        };
        
        if (action.payload.nextStep) {
          state.currentStep = action.payload.nextStep;
        } else if (action.payload.completed) {
          state.currentSession = null;
          state.currentStep = null;
        }
        
        state.error = null;
      })
      .addCase(submitStep.rejected, (state, action) => {
        state.loading = false;
        
        if (action.payload?.type === 'incorrect') {
          state.feedback = {
            type: 'error',
            ...action.payload,
          };
        } else {
          state.error = action.payload;
        }
      })
      .addCase(getProgress.fulfilled, (state, action) => {
        state.progress = action.payload;
      });
  },
});

export const { clearFeedback, clearError, setCurrentStep, clearSession } = learningSlice.actions;
export default learningSlice.reducer;
