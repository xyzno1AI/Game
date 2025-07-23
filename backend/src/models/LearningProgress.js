const mongoose = require('mongoose');

const learningProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  tutorials: [{
    tutorialId: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started'
    },
    progress: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    },
    currentStep: {
      type: Number,
      default: 0
    },
    totalSteps: {
      type: Number,
      default: 0
    },
    startedAt: Date,
    completedAt: Date,
    timeSpent: {
      type: Number,
      default: 0
    },
    attempts: {
      type: Number,
      default: 0
    }
  }],
  skills: {
    type: Map,
    of: {
      level: { type: Number, default: 1 },
      experience: { type: Number, default: 0 },
      lastPracticed: Date
    }
  },
  overallProgress: {
    totalTutorialsCompleted: { type: Number, default: 0 },
    totalTimeSpent: { type: Number, default: 0 },
    currentLevel: { type: Number, default: 1 },
    nextLevelRequirement: { type: Number, default: 500 }
  }
}, {
  timestamps: true
});

learningProgressSchema.index({ userId: 1 }, { unique: true });
learningProgressSchema.index({ 'tutorials.tutorialId': 1 });
learningProgressSchema.index({ 'tutorials.status': 1 });

learningProgressSchema.methods.getTutorialProgress = function(tutorialId) {
  return this.tutorials.find(t => t.tutorialId === tutorialId);
};

learningProgressSchema.methods.updateTutorialProgress = function(tutorialId, updates) {
  const tutorial = this.tutorials.find(t => t.tutorialId === tutorialId);
  if (tutorial) {
    Object.assign(tutorial, updates);
  } else {
    this.tutorials.push({ tutorialId, ...updates });
  }
};

learningProgressSchema.methods.completeTutorial = function(tutorialId) {
  const tutorial = this.getTutorialProgress(tutorialId);
  if (tutorial) {
    tutorial.status = 'completed';
    tutorial.progress = 1;
    tutorial.completedAt = new Date();
    this.overallProgress.totalTutorialsCompleted++;
  }
};

learningProgressSchema.methods.updateSkill = function(skillId, experienceGained) {
  const skill = this.skills.get(skillId) || { level: 1, experience: 0 };
  skill.experience += experienceGained;
  skill.lastPracticed = new Date();
  
  const newLevel = Math.floor(skill.experience / 100) + 1;
  if (newLevel > skill.level) {
    skill.level = newLevel;
  }
  
  this.skills.set(skillId, skill);
};

module.exports = mongoose.model('LearningProgress', learningProgressSchema);
