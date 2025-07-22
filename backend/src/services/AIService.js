const GoEngine = require('./GoEngine');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.difficulties = {
      1: { depth: 1, randomness: 0.8, thinkTime: 500 },
      2: { depth: 1, randomness: 0.6, thinkTime: 800 },
      3: { depth: 2, randomness: 0.4, thinkTime: 1200 },
      4: { depth: 2, randomness: 0.3, thinkTime: 1500 },
      5: { depth: 3, randomness: 0.2, thinkTime: 2000 },
      6: { depth: 3, randomness: 0.15, thinkTime: 2500 },
      7: { depth: 4, randomness: 0.1, thinkTime: 3000 },
      8: { depth: 4, randomness: 0.05, thinkTime: 3500 },
      9: { depth: 5, randomness: 0.02, thinkTime: 4000 },
      10: { depth: 5, randomness: 0, thinkTime: 5000 }
    };
  }

  async generateMove(board, boardSize, difficulty = 5, _isLearningMode = false) {
    try {
      const config = this.difficulties[difficulty] || this.difficulties[5];
      
      await this.simulateThinking(config.thinkTime);

      const goEngine = new GoEngine(boardSize);
      goEngine.loadBoardState({ 
        board, 
        capturedStones: { black: 0, white: 0 }, 
        koPosition: null, 
        moveHistory: [] 
      });

      const legalMoves = this.generateLegalMoves(goEngine);
      
      if (legalMoves.length === 0) {
        return { position: null, isPass: true };
      }

      let bestMove;
      if (difficulty <= 2) {
        bestMove = this.selectRandomMove(legalMoves, config.randomness);
      } else if (difficulty <= 4) {
        bestMove = this.selectGreedyMove(goEngine, legalMoves, config.randomness);
      } else {
        bestMove = this.selectMinimaxMove(goEngine, legalMoves, config.depth, config.randomness);
      }

      const explanation = _isLearningMode ? this.generateMoveExplanation(goEngine, bestMove) : null;

      return {
        position: bestMove,
        isPass: false,
        explanation,
        difficulty
      };
    } catch (error) {
      logger.error('Error generating AI move:', error);
      throw error;
    }
  }

  async suggestMove(board, boardSize, _isLearningMode = true) {
    try {
      const goEngine = new GoEngine(boardSize);
      goEngine.loadBoardState({ 
        board, 
        capturedStones: { black: 0, white: 0 }, 
        koPosition: null, 
        moveHistory: [] 
      });

      const legalMoves = this.generateLegalMoves(goEngine);
      const bestMoves = this.evaluateTopMoves(goEngine, legalMoves, 3);

      return {
        suggestedMove: bestMoves[0],
        alternatives: bestMoves.slice(1),
        explanation: this.generateMoveExplanation(goEngine, bestMoves[0]),
        reasoning: this.generateMoveReasoning(goEngine, bestMoves[0])
      };
    } catch (error) {
      logger.error('Error suggesting move:', error);
      throw error;
    }
  }

  generateLegalMoves(goEngine) {
    const moves = [];
    const boardSize = goEngine.boardSize;

    for (let x = 0; x < boardSize; x++) {
      for (let y = 0; y < boardSize; y++) {
        if (goEngine.getStone(x, y) === null) {
          const testEngine = new GoEngine(boardSize);
          testEngine.loadBoardState(goEngine.getBoardState());
          
          const result = testEngine.placeStone(x, y, 'black');
          if (result.success) {
            moves.push({ x, y });
          }
        }
      }
    }

    return moves;
  }

  selectRandomMove(moves, randomness = 1.0) {
    if (Math.random() < randomness) {
      return moves[Math.floor(Math.random() * moves.length)];
    }
    return moves[0];
  }

  selectGreedyMove(goEngine, moves, randomness = 0.2) {
    const evaluatedMoves = moves.map(move => ({
      position: move,
      score: this.evaluateMove(goEngine, move)
    }));

    evaluatedMoves.sort((a, b) => b.score - a.score);

    if (Math.random() < randomness && evaluatedMoves.length > 1) {
      const topMoves = evaluatedMoves.slice(0, Math.min(3, evaluatedMoves.length));
      return topMoves[Math.floor(Math.random() * topMoves.length)].position;
    }

    return evaluatedMoves[0].position;
  }

  selectMinimaxMove(goEngine, moves, depth, randomness = 0.1) {
    const evaluatedMoves = moves.map(move => ({
      position: move,
      score: this.minimax(goEngine, move, depth, true, -Infinity, Infinity)
    }));

    evaluatedMoves.sort((a, b) => b.score - a.score);

    if (Math.random() < randomness && evaluatedMoves.length > 1) {
      const topMoves = evaluatedMoves.slice(0, Math.min(2, evaluatedMoves.length));
      return topMoves[Math.floor(Math.random() * topMoves.length)].position;
    }

    return evaluatedMoves[0].position;
  }

  minimax(goEngine, move, depth, isMaximizing, alpha, beta) {
    if (depth === 0) {
      return this.evaluatePosition(goEngine);
    }

    const testEngine = new GoEngine(goEngine.boardSize);
    testEngine.loadBoardState(goEngine.getBoardState());
    
    const color = isMaximizing ? 'black' : 'white';
    const result = testEngine.placeStone(move.x, move.y, color);
    
    if (!result.success) {
      return isMaximizing ? -1000 : 1000;
    }

    const nextMoves = this.generateLegalMoves(testEngine).slice(0, 10);

    if (isMaximizing) {
      let maxScore = -Infinity;
      for (const nextMove of nextMoves) {
        const score = this.minimax(testEngine, nextMove, depth - 1, false, alpha, beta);
        maxScore = Math.max(maxScore, score);
        alpha = Math.max(alpha, score);
        if (beta <= alpha) break;
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (const nextMove of nextMoves) {
        const score = this.minimax(testEngine, nextMove, depth - 1, true, alpha, beta);
        minScore = Math.min(minScore, score);
        beta = Math.min(beta, score);
        if (beta <= alpha) break;
      }
      return minScore;
    }
  }

  evaluateMove(goEngine, move) {
    const testEngine = new GoEngine(goEngine.boardSize);
    testEngine.loadBoardState(goEngine.getBoardState());
    
    const result = testEngine.placeStone(move.x, move.y, 'black');
    if (!result.success) return -1000;

    let score = 0;
    
    score += result.capturedStones * 10;
    
    score += this.evaluatePosition(testEngine);
    
    if (this.isCornerMove(move, goEngine.boardSize)) score += 5;
    if (this.isEdgeMove(move, goEngine.boardSize)) score += 2;
    if (this.isCenterMove(move, goEngine.boardSize)) score += 3;

    return score;
  }

  evaluatePosition(goEngine) {
    let score = 0;
    const boardSize = goEngine.boardSize;

    for (let x = 0; x < boardSize; x++) {
      for (let y = 0; y < boardSize; y++) {
        const stone = goEngine.getStone(x, y);
        if (stone === 'black') {
          score += 1;
          score += this.evaluateStoneInfluence(goEngine, x, y);
        } else if (stone === 'white') {
          score -= 1;
          score -= this.evaluateStoneInfluence(goEngine, x, y);
        }
      }
    }

    return score;
  }

  evaluateStoneInfluence(goEngine, x, y) {
    const group = goEngine.findGroup(x, y);
    const liberties = goEngine.countLiberties(group);
    
    let influence = 0;
    if (liberties >= 3) influence += 2;
    else if (liberties === 2) influence += 1;
    else if (liberties === 1) influence -= 5;

    if (this.isCornerMove({ x, y }, goEngine.boardSize)) influence += 3;
    if (this.isEdgeMove({ x, y }, goEngine.boardSize)) influence += 1;

    return influence;
  }

  evaluateTopMoves(goEngine, moves, count = 3) {
    const evaluatedMoves = moves.map(move => ({
      position: move,
      score: this.evaluateMove(goEngine, move)
    }));

    evaluatedMoves.sort((a, b) => b.score - a.score);
    return evaluatedMoves.slice(0, count).map(m => m.position);
  }

  isCornerMove(move, boardSize) {
    const corners = [
      { x: 0, y: 0 }, { x: 0, y: boardSize - 1 },
      { x: boardSize - 1, y: 0 }, { x: boardSize - 1, y: boardSize - 1 }
    ];
    return corners.some(corner => 
      Math.abs(move.x - corner.x) <= 2 && Math.abs(move.y - corner.y) <= 2
    );
  }

  isEdgeMove(move, boardSize) {
    return move.x === 0 || move.x === boardSize - 1 || 
           move.y === 0 || move.y === boardSize - 1;
  }

  isCenterMove(move, boardSize) {
    const center = Math.floor(boardSize / 2);
    return Math.abs(move.x - center) <= 2 && Math.abs(move.y - center) <= 2;
  }

  generateMoveExplanation(goEngine, move) {
    if (!move) return "建议停一手，没有好的落子点。";

    const explanations = [];

    if (this.isCornerMove(move, goEngine.boardSize)) {
      explanations.push("占据角部是围棋的基本策略");
    }

    const testEngine = new GoEngine(goEngine.boardSize);
    testEngine.loadBoardState(goEngine.getBoardState());
    const result = testEngine.placeStone(move.x, move.y, 'black');
    
    if (result.capturedStones > 0) {
      explanations.push(`这步棋可以吃掉对方${result.capturedStones}个子`);
    }

    if (this.isCenterMove(move, goEngine.boardSize)) {
      explanations.push("控制中央有利于全局发展");
    }

    return explanations.length > 0 ? explanations.join("，") : "这是一步不错的棋";
  }

  generateMoveReasoning(goEngine, move) {
    if (!move) return "当前局面没有明显的好点，停一手等待对方行棋。";

    const reasons = [];

    if (this.isCornerMove(move, goEngine.boardSize)) {
      reasons.push("角部容易做活，是序盘的重点");
    }

    const testEngine = new GoEngine(goEngine.boardSize);
    testEngine.loadBoardState(goEngine.getBoardState());
    const result = testEngine.placeStone(move.x, move.y, 'black');
    
    if (result.capturedStones > 0) {
      reasons.push("可以通过吃子获得实地优势");
    }

    const group = testEngine.findGroup(move.x, move.y);
    const liberties = testEngine.countLiberties(group);
    
    if (liberties >= 3) {
      reasons.push("这个位置比较安全，有足够的气");
    }

    return reasons.length > 0 ? reasons.join("，") + "。" : "这是基于当前局面的最佳选择。";
  }

  async simulateThinking(thinkTime) {
    const actualTime = Math.random() * thinkTime * 0.5 + thinkTime * 0.5;
    return new Promise(resolve => setTimeout(resolve, actualTime));
  }
}

module.exports = AIService;
