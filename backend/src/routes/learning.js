const express = require('express');
const Joi = require('joi');
const LearningService = require('../services/LearningService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const learningService = new LearningService();

const stepActionSchema = Joi.object({
  action: Joi.string().valid('move', 'identify', 'click').required(),
  data: Joi.object({
    position: Joi.object({
      x: Joi.number().required(),
      y: Joi.number().required()
    }).optional(),
    correct: Joi.boolean().optional()
  }).optional()
});

router.get('/tutorials', authenticateToken, async (req, res, next) => {
  try {
    const tutorials = await learningService.getTutorialsList(req.user._id);

    res.json({
      success: true,
      data: {
        tutorials
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/tutorials/:tutorialId/start', authenticateToken, async (req, res, next) => {
  try {
    const session = await learningService.startTutorial(req.user._id, req.params.tutorialId);

    res.json({
      success: true,
      data: {
        session
      }
    });
  } catch (error) {
    if (error.message === 'Tutorial not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TUTORIAL_NOT_FOUND',
          message: 'Tutorial not found'
        }
      });
    }
    next(error);
  }
});

router.post('/sessions/:sessionId/step', authenticateToken, async (req, res, next) => {
  try {
    const { error, value } = stepActionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }

    const sessionParts = req.params.sessionId.split('_');
    if (sessionParts.length < 3 || sessionParts[0] !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INVALID_SESSION',
          message: 'Invalid session'
        }
      });
    }

    const tutorialId = sessionParts[1];
    const stepId = req.query.stepId;

    if (!stepId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_STEP_ID',
          message: 'Step ID required'
        }
      });
    }

    const result = await learningService.processStepAction(
      req.user._id,
      tutorialId,
      stepId,
      {
        type: value.action,
        ...value.data
      }
    );

    if (result.correct) {
      res.json({
        success: true,
        data: {
          feedback: result
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: {
          code: 'INCORRECT_MOVE',
          message: result.message,
          data: {
            hint: result.hint,
            suggestedAction: result.suggestedAction,
            explanation: result.explanation
          }
        }
      });
    }
  } catch (error) {
    next(error);
  }
});

router.get('/progress', authenticateToken, async (req, res, next) => {
  try {
    const progress = await learningService.getUserProgress(req.user._id);
    const skills = await learningService.getSkillProgress(req.user._id);

    res.json({
      success: true,
      data: {
        progress: {
          tutorials: progress.tutorials,
          overallProgress: progress.overallProgress,
          skills
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/skills', authenticateToken, async (req, res, next) => {
  try {
    const skills = await learningService.getSkillProgress(req.user._id);

    res.json({
      success: true,
      data: {
        skills
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
