// NE PAS MODIFIER — code de base de l'atelier

import { COLS, ROWS } from './config.js';

const MAP_LAYOUT = [
  '###################',
  '#O...............O#',
  '#.................#',
  '#.....###.........#',
  '#.................#',
  '#.........###.....#',
  '#.................#',
  '#......P..........#',
  '#.................#',
  '#.....###.........#',
  '#........G........#',
  '#.................#',
  '#.................#',
  '#O...............O#',
  '###################',
];

export class Map {
  constructor() {
    this.grid = [];
    this.pacmanStart = { x: 0, y: 0 };
    this.ghostStart = { x: 0, y: 0 };
    this._loadLayout();
  }

  _loadLayout() {
    for (let y = 0; y < ROWS; y++) {
      const row = [];
      for (let x = 0; x < COLS; x++) {
        const char = MAP_LAYOUT[y][x];
        row.push(char);
        if (char === 'P') {
          this.pacmanStart = { x, y };
          row[x] = ' ';
        } else if (char === 'G') {
          this.ghostStart = { x, y };
          row[x] = '.';
        }
      }
      this.grid.push(row);
    }
  }

  isWall(x, y) {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) {
      return true;
    }
    return this.grid[y][x] === '#';
  }

  getTile(x, y) {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) {
      return '#';
    }
    return this.grid[y][x];
  }

  setTile(x, y, char) {
    if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
      this.grid[y][x] = char;
    }
  }

  countRemainingPills() {
    let count = 0;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const tile = this.grid[y][x];
        if (tile === '.' || tile === 'O') {
          count++;
        }
      }
    }
    return count;
  }

  getWalkableNeighbors(x, y) {
    const neighbors = [];
    if (!this.isWall(x, y - 1)) neighbors.push('up');
    if (!this.isWall(x, y + 1)) neighbors.push('down');
    if (!this.isWall(x - 1, y)) neighbors.push('left');
    if (!this.isWall(x + 1, y)) neighbors.push('right');
    return neighbors;
  }
}
