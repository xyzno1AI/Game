const GoEngine = require('../../services/GoEngine');

describe('GoEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new GoEngine(19);
  });

  describe('Board Initialization', () => {
    test('should create empty board with correct size', () => {
      expect(engine.board).toHaveLength(19);
      expect(engine.board[0]).toHaveLength(19);
      expect(engine.board[18][18]).toBeNull();
    });

    test('should initialize with correct properties', () => {
      expect(engine.size).toBe(19);
      expect(engine.capturedStones).toEqual({ black: 0, white: 0 });
      expect(engine.koPosition).toBeNull();
    });
  });

  describe('Stone Placement', () => {
    test('should place stone on empty intersection', () => {
      const result = engine.placeStone(3, 3, 'black');
      expect(result.success).toBe(true);
      expect(engine.board[3][3]).toBe('black');
    });

    test('should reject placement on occupied intersection', () => {
      engine.placeStone(3, 3, 'black');
      const result = engine.placeStone(3, 3, 'white');
      expect(result.success).toBe(false);
      expect(result.error).toContain('occupied');
    });

    test('should reject placement outside board', () => {
      const result = engine.placeStone(-1, 5, 'black');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid position');
    });
  });

  describe('Capture Logic', () => {
    test('should capture surrounded stones', () => {
      engine.placeStone(1, 0, 'black');
      engine.placeStone(0, 1, 'black');
      engine.placeStone(1, 1, 'black');
      
      engine.placeStone(0, 0, 'white');
      
      const result = engine.placeStone(1, 0, 'black');
      expect(result.capturedStones).toContain({ x: 0, y: 0 });
      expect(engine.board[0][0]).toBeNull();
      expect(engine.capturedStones.white).toBe(1);
    });

    test('should not allow suicide moves', () => {
      engine.placeStone(1, 0, 'white');
      engine.placeStone(0, 1, 'white');
      
      const result = engine.placeStone(0, 0, 'black');
      expect(result.success).toBe(false);
      expect(result.error).toContain('suicide');
    });
  });

  describe('Ko Rule', () => {
    test('should prevent immediate recapture', () => {
      engine.placeStone(1, 0, 'black');
      engine.placeStone(2, 1, 'black');
      engine.placeStone(1, 2, 'black');
      engine.placeStone(0, 1, 'white');
      engine.placeStone(2, 0, 'white');
      engine.placeStone(3, 1, 'white');
      engine.placeStone(2, 2, 'white');
      
      engine.placeStone(1, 1, 'black');
      engine.placeStone(1, 1, 'white');
      
      const koResult = engine.placeStone(1, 1, 'black');
      expect(koResult.success).toBe(false);
      expect(koResult.error).toContain('ko');
    });
  });

  describe('Liberty Counting', () => {
    test('should count liberties correctly', () => {
      engine.placeStone(3, 3, 'black');
      const liberties = engine.getLiberties(3, 3);
      expect(liberties).toBe(4);
    });

    test('should count liberties for group', () => {
      engine.placeStone(3, 3, 'black');
      engine.placeStone(3, 4, 'black');
      const liberties = engine.getLiberties(3, 3);
      expect(liberties).toBe(6);
    });
  });

  describe('Scoring', () => {
    test('should calculate basic territory', () => {
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          if (i === 0 || j === 0 || i === 4 || j === 4) {
            engine.placeStone(i, j, 'black');
          }
        }
      }
      
      const score = engine.calculateScore();
      expect(score.black).toBeGreaterThan(0);
    });
  });
});
