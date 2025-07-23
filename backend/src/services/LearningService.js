const LearningProgress = require('../models/LearningProgress');
const User = require('../models/User');
const logger = require('../utils/logger');

class LearningService {
  constructor() {
    this.tutorials = this.initializeTutorials();
  }

  initializeTutorials() {
    return {
      'basic-rules': {
        id: 'basic-rules',
        title: '围棋基本规则',
        description: '学习围棋的基本规则和目标',
        difficulty: 1,
        estimatedTime: 600,
        steps: [
          {
            id: 'board-introduction',
            title: '认识棋盘',
            instruction: '围棋棋盘有19条横线和19条竖线，形成361个交叉点',
            boardSetup: { size: 19, stones: [] },
            expectedAction: 'click',
            targetPosition: { x: 9, y: 9 },
            hints: [
              { level: 1, text: '点击棋盘中央的天元位置' },
              { level: 2, text: '天元是棋盘的中心点' },
              { level: 3, text: '点击坐标(9,9)的位置' }
            ]
          },
          {
            id: 'stone-placement',
            title: '落子规则',
            instruction: '黑棋先行，双方轮流在交叉点上放置棋子',
            boardSetup: { size: 9, stones: [] },
            expectedAction: 'place',
            targetPosition: { x: 4, y: 4 },
            hints: [
              { level: 1, text: '在空的交叉点上放置黑子' },
              { level: 2, text: '试试点击中央附近的位置' },
              { level: 3, text: '点击(4,4)位置放置第一个黑子' }
            ]
          }
        ]
      },
      'capturing': {
        id: 'capturing',
        title: '吃子技巧',
        description: '学习如何吃掉对方的棋子',
        difficulty: 2,
        estimatedTime: 900,
        steps: [
          {
            id: 'single-capture',
            title: '吃掉单个棋子',
            instruction: '当对方棋子没有气时，就可以被吃掉',
            boardSetup: {
              size: 9,
              stones: [
                { position: { x: 4, y: 4 }, color: 'white' },
                { position: { x: 3, y: 4 }, color: 'black' },
                { position: { x: 4, y: 3 }, color: 'black' },
                { position: { x: 4, y: 5 }, color: 'black' }
              ]
            },
            expectedAction: 'place',
            targetPosition: { x: 5, y: 4 },
            hints: [
              { level: 1, text: '找找白棋的最后一口气在哪里' },
              { level: 2, text: '白棋的右边是空的' },
              { level: 3, text: '在(5,4)位置下黑棋吃掉白子' }
            ]
          }
        ]
      },
      'life-and-death': {
        id: 'life-and-death',
        title: '死活基础',
        description: '学习棋子的生存和死亡',
        difficulty: 3,
        estimatedTime: 1200,
        steps: [
          {
            id: 'two-eyes',
            title: '双眼活棋',
            instruction: '有两个眼的棋子是活的，不会被吃掉',
            boardSetup: {
              size: 9,
              stones: [
                { position: { x: 2, y: 2 }, color: 'black' },
                { position: { x: 2, y: 3 }, color: 'black' },
                { position: { x: 2, y: 4 }, color: 'black' },
                { position: { x: 2, y: 5 }, color: 'black' },
                { position: { x: 3, y: 2 }, color: 'black' },
                { position: { x: 3, y: 5 }, color: 'black' },
                { position: { x: 4, y: 2 }, color: 'black' },
                { position: { x: 4, y: 5 }, color: 'black' },
                { position: { x: 5, y: 2 }, color: 'black' },
                { position: { x: 5, y: 3 }, color: 'black' },
                { position: { x: 5, y: 4 }, color: 'black' },
                { position: { x: 5, y: 5 }, color: 'black' }
              ]
            },
            expectedAction: 'identify',
            hints: [
              { level: 1, text: '观察黑棋围成的形状' },
              { level: 2, text: '数一数有几个眼' },
              { level: 3, text: '这个形状有两个眼，是活棋' }
            ]
          }
        ]
      }
    };
  }

  async getUserProgress(userId) {
    try {
      let progress = await LearningProgress.findOne({ userId });
      
      if (!progress) {
        progress = new LearningProgress({
          userId,
          tutorials: [],
          skills: new Map(),
          overallProgress: {
            totalTutorialsCompleted: 0,
            totalTimeSpent: 0,
            currentLevel: 1,
            nextLevelRequirement: 500
          }
        });
        await progress.save();
      }

      return progress;
    } catch (error) {
      logger.error('Error getting user progress:', error);
      throw error;
    }
  }

  async getTutorialsList(userId) {
    try {
      const progress = await this.getUserProgress(userId);
      
      const tutorialsList = Object.values(this.tutorials).map(tutorial => {
        const userProgress = progress.getTutorialProgress(tutorial.id);
        
        return {
          id: tutorial.id,
          title: tutorial.title,
          description: tutorial.description,
          difficulty: tutorial.difficulty,
          estimatedTime: tutorial.estimatedTime,
          completed: userProgress?.status === 'completed',
          progress: userProgress?.progress || 0,
          status: userProgress?.status || 'not_started'
        };
      });

      return tutorialsList;
    } catch (error) {
      logger.error('Error getting tutorials list:', error);
      throw error;
    }
  }

  async startTutorial(userId, tutorialId) {
    try {
      const tutorial = this.tutorials[tutorialId];
      if (!tutorial) {
        throw new Error('Tutorial not found');
      }

      const progress = await this.getUserProgress(userId);
      
      const tutorialProgress = progress.getTutorialProgress(tutorialId);
      if (!tutorialProgress) {
        progress.updateTutorialProgress(tutorialId, {
          status: 'in_progress',
          progress: 0,
          currentStep: 0,
          totalSteps: tutorial.steps.length,
          startedAt: new Date(),
          timeSpent: 0,
          attempts: 1
        });
      } else {
        tutorialProgress.status = 'in_progress';
        tutorialProgress.attempts++;
      }

      await progress.save();

      const currentStep = tutorial.steps[0];
      
      return {
        sessionId: `${userId}_${tutorialId}_${Date.now()}`,
        tutorial: {
          id: tutorial.id,
          title: tutorial.title,
          description: tutorial.description
        },
        currentStep: 1,
        totalSteps: tutorial.steps.length,
        step: {
          id: currentStep.id,
          title: currentStep.title,
          instruction: currentStep.instruction,
          boardSetup: currentStep.boardSetup,
          expectedAction: currentStep.expectedAction,
          hints: currentStep.hints
        }
      };
    } catch (error) {
      logger.error('Error starting tutorial:', error);
      throw error;
    }
  }

  async processStepAction(userId, tutorialId, stepId, action) {
    try {
      const tutorial = this.tutorials[tutorialId];
      if (!tutorial) {
        throw new Error('Tutorial not found');
      }

      const step = tutorial.steps.find(s => s.id === stepId);
      if (!step) {
        throw new Error('Step not found');
      }

      const progress = await this.getUserProgress(userId);
      const tutorialProgress = progress.getTutorialProgress(tutorialId);
      
      if (!tutorialProgress) {
        throw new Error('Tutorial not started');
      }

      const isCorrect = this.evaluateStepAction(step, action);
      
      if (isCorrect) {
        tutorialProgress.currentStep++;
        tutorialProgress.progress = tutorialProgress.currentStep / tutorial.steps.length;
        
        const nextStep = tutorial.steps[tutorialProgress.currentStep];
        
        if (!nextStep) {
          progress.completeTutorial(tutorialId);
          await this.awardExperience(userId, 100);
        }

        await progress.save();

        return {
          correct: true,
          message: '很好！你成功完成了这一步',
          explanation: this.getSuccessExplanation(step, action),
          nextStep: nextStep ? {
            id: nextStep.id,
            title: nextStep.title,
            instruction: nextStep.instruction,
            boardSetup: nextStep.boardSetup,
            expectedAction: nextStep.expectedAction,
            hints: nextStep.hints
          } : null,
          completed: !nextStep,
          progress: {
            currentStep: tutorialProgress.currentStep,
            totalSteps: tutorial.steps.length,
            completionRate: tutorialProgress.progress
          }
        };
      } else {
        return {
          correct: false,
          message: '这不是最佳选择，再试试看',
          explanation: this.getErrorExplanation(step, action),
          hint: this.getNextHint(step, tutorialProgress.attempts),
          suggestedAction: this.getSuggestedAction(step)
        };
      }
    } catch (error) {
      logger.error('Error processing step action:', error);
      throw error;
    }
  }

  evaluateStepAction(step, action) {
    switch (step.expectedAction) {
      case 'click':
      case 'place':
        if (action.type === 'move' && action.position) {
          return action.position.x === step.targetPosition.x && 
                 action.position.y === step.targetPosition.y;
        }
        return false;
      
      case 'identify':
        return action.type === 'identify' && action.correct === true;
      
      default:
        return false;
    }
  }

  getSuccessExplanation(step, _action) {
    switch (step.id) {
      case 'board-introduction':
        return '天元是棋盘的中心，在对局中有重要的战略意义';
      case 'stone-placement':
        return '很好！你已经学会了如何在棋盘上落子';
      case 'single-capture':
        return '完美！你成功吃掉了对方的棋子，这是围棋的基本技巧';
      case 'two-eyes':
        return '正确！有两个眼的棋子是活的，这是围棋中的重要概念';
      default:
        return '做得很好！';
    }
  }

  getErrorExplanation(step, _action) {
    switch (step.id) {
      case 'board-introduction':
        return '天元位置在棋盘的正中央，坐标是(9,9)';
      case 'stone-placement':
        return '请在空的交叉点上放置棋子';
      case 'single-capture':
        return '要吃掉对方棋子，需要占据它的最后一口气';
      case 'two-eyes':
        return '仔细观察棋子围成的形状，数一数有几个空点';
      default:
        return '请按照指示完成操作';
    }
  }

  getNextHint(step, attempts) {
    const hintLevel = Math.min(attempts, step.hints.length);
    return step.hints[hintLevel - 1]?.text || '请仔细阅读指示';
  }

  getSuggestedAction(step) {
    switch (step.expectedAction) {
      case 'click':
      case 'place':
        return {
          type: 'move',
          position: step.targetPosition
        };
      case 'identify':
        return {
          type: 'identify',
          correct: true
        };
      default:
        return null;
    }
  }

  async awardExperience(userId, amount) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      user.profile.experience += amount;
      user.profile.level = user.calculateLevel();

      await user.save();

      logger.info(`Awarded ${amount} experience to user ${userId}`);
    } catch (error) {
      logger.error('Error awarding experience:', error);
    }
  }

  async updateSkillProgress(userId, skillId, experienceGained) {
    try {
      const progress = await this.getUserProgress(userId);
      progress.updateSkill(skillId, experienceGained);
      await progress.save();

      logger.info(`Updated skill ${skillId} for user ${userId}`);
    } catch (error) {
      logger.error('Error updating skill progress:', error);
    }
  }

  async getSkillProgress(userId) {
    try {
      const progress = await this.getUserProgress(userId);
      
      const skills = {};
      for (const [skillId, skillData] of progress.skills) {
        skills[skillId] = {
          level: skillData.level,
          experience: skillData.experience,
          lastPracticed: skillData.lastPracticed,
          nextLevelRequirement: skillData.level * 100
        };
      }

      return skills;
    } catch (error) {
      logger.error('Error getting skill progress:', error);
      throw error;
    }
  }
}

module.exports = LearningService;
