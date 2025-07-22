class GoEngine {
  constructor(boardSize) {
    this.boardSize = boardSize;
    this.board = this.initializeBoard();
    this.capturedStones = { black: 0, white: 0 };
    this.koPosition = null;
    this.moveHistory = [];
  }

  initializeBoard() {
    return Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(null));
  }

  isValidPosition(x, y) {
    return x >= 0 && x < this.boardSize && y >= 0 && y < this.boardSize;
  }

  getStone(x, y) {
    if (!this.isValidPosition(x, y)) return null;
    return this.board[x][y];
  }

  placeStone(x, y, color) {
    if (!this.isValidPosition(x, y)) {
      return { success: false, error: 'Position out of bounds' };
    }

    if (this.board[x][y] !== null) {
      return { success: false, error: 'Position occupied' };
    }

    this.board[x][y] = color;

    const capturedGroups = this.findCapturedGroups(this.getOpponentColor(color));
    
    if (capturedGroups.length === 0 && this.hasNoLiberties(x, y)) {
      this.board[x][y] = null;
      return { success: false, error: 'Suicide move' };
    }

    if (this.isKoViolation(x, y, capturedGroups)) {
      this.board[x][y] = null;
      return { success: false, error: 'Ko violation' };
    }

    this.removeCapturedStones(capturedGroups);
    this.updateKoPosition(x, y, capturedGroups);
    
    const capturedCount = capturedGroups.reduce((sum, group) => sum + group.length, 0);
    this.capturedStones[color] += capturedCount;

    this.moveHistory.push({
      position: { x, y },
      color,
      capturedStones: capturedCount,
      timestamp: new Date()
    });

    return { success: true, capturedStones: capturedCount };
  }

  getOpponentColor(color) {
    return color === 'black' ? 'white' : 'black';
  }

  getNeighbors(x, y) {
    const neighbors = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (this.isValidPosition(nx, ny)) {
        neighbors.push({ x: nx, y: ny });
      }
    }
    
    return neighbors;
  }

  findGroup(x, y) {
    const color = this.getStone(x, y);
    if (!color) return [];

    const group = [];
    const visited = new Set();
    const stack = [{ x, y }];

    while (stack.length > 0) {
      const pos = stack.pop();
      const key = `${pos.x},${pos.y}`;
      
      if (visited.has(key)) continue;
      visited.add(key);

      if (this.getStone(pos.x, pos.y) === color) {
        group.push(pos);
        
        for (const neighbor of this.getNeighbors(pos.x, pos.y)) {
          const neighborKey = `${neighbor.x},${neighbor.y}`;
          if (!visited.has(neighborKey)) {
            stack.push(neighbor);
          }
        }
      }
    }

    return group;
  }

  countLiberties(group) {
    const liberties = new Set();
    
    for (const pos of group) {
      for (const neighbor of this.getNeighbors(pos.x, pos.y)) {
        if (this.getStone(neighbor.x, neighbor.y) === null) {
          liberties.add(`${neighbor.x},${neighbor.y}`);
        }
      }
    }
    
    return liberties.size;
  }

  hasNoLiberties(x, y) {
    const group = this.findGroup(x, y);
    return this.countLiberties(group) === 0;
  }

  findCapturedGroups(color) {
    const capturedGroups = [];
    const visited = new Set();

    for (let x = 0; x < this.boardSize; x++) {
      for (let y = 0; y < this.boardSize; y++) {
        const key = `${x},${y}`;
        if (this.getStone(x, y) === color && !visited.has(key)) {
          const group = this.findGroup(x, y);
          
          for (const pos of group) {
            visited.add(`${pos.x},${pos.y}`);
          }
          
          if (this.countLiberties(group) === 0) {
            capturedGroups.push(group);
          }
        }
      }
    }

    return capturedGroups;
  }

  removeCapturedStones(capturedGroups) {
    for (const group of capturedGroups) {
      for (const pos of group) {
        this.board[pos.x][pos.y] = null;
      }
    }
  }

  isKoViolation(x, y, capturedGroups) {
    if (!this.koPosition) return false;
    if (capturedGroups.length !== 1) return false;
    if (capturedGroups[0].length !== 1) return false;
    
    const capturedPos = capturedGroups[0][0];
    return capturedPos.x === this.koPosition.x && capturedPos.y === this.koPosition.y;
  }

  updateKoPosition(x, y, capturedGroups) {
    if (capturedGroups.length === 1 && capturedGroups[0].length === 1) {
      const group = this.findGroup(x, y);
      if (group.length === 1 && this.countLiberties(group) === 1) {
        this.koPosition = { x, y };
        return;
      }
    }
    this.koPosition = null;
  }

  calculateScore() {
    const territories = this.findTerritories();
    let blackScore = this.capturedStones.black;
    let whiteScore = this.capturedStones.white;

    for (const territory of territories) {
      if (territory.owner === 'black') {
        blackScore += territory.size;
      } else if (territory.owner === 'white') {
        whiteScore += territory.size;
      }
    }

    return { black: blackScore, white: whiteScore };
  }

  findTerritories() {
    const territories = [];
    const visited = new Set();

    for (let x = 0; x < this.boardSize; x++) {
      for (let y = 0; y < this.boardSize; y++) {
        const key = `${x},${y}`;
        if (this.getStone(x, y) === null && !visited.has(key)) {
          const territory = this.findTerritory(x, y, visited);
          if (territory.size > 0) {
            territories.push(territory);
          }
        }
      }
    }

    return territories;
  }

  findTerritory(startX, startY, visited) {
    const territory = [];
    const borderColors = new Set();
    const stack = [{ x: startX, y: startY }];

    while (stack.length > 0) {
      const pos = stack.pop();
      const key = `${pos.x},${pos.y}`;
      
      if (visited.has(key)) continue;
      visited.add(key);

      const stone = this.getStone(pos.x, pos.y);
      if (stone === null) {
        territory.push(pos);
        
        for (const neighbor of this.getNeighbors(pos.x, pos.y)) {
          const neighborKey = `${neighbor.x},${neighbor.y}`;
          if (!visited.has(neighborKey)) {
            stack.push(neighbor);
          }
        }
      } else {
        borderColors.add(stone);
      }
    }

    let owner = null;
    if (borderColors.size === 1) {
      owner = Array.from(borderColors)[0];
    }

    return {
      positions: territory,
      size: territory.length,
      owner
    };
  }

  getBoardState() {
    return {
      board: this.board.map(row => [...row]),
      capturedStones: { ...this.capturedStones },
      koPosition: this.koPosition ? { ...this.koPosition } : null,
      moveHistory: [...this.moveHistory]
    };
  }

  loadBoardState(state) {
    this.board = state.board.map(row => [...row]);
    this.capturedStones = { ...state.capturedStones };
    this.koPosition = state.koPosition ? { ...state.koPosition } : null;
    this.moveHistory = [...state.moveHistory];
  }
}

module.exports = GoEngine;
