// NE PAS MODIFIER — code de base de l'atelier

import { TILE_SIZE, SPEEDS, SCORE, DIRECTIONS } from '../config.js';

export class Pacman {
  constructor(startX, startY) {
    this.gridX = startX;
    this.gridY = startY;
    this.pixelX = startX * TILE_SIZE;
    this.pixelY = startY * TILE_SIZE;
    this.direction = 'left';
    this.nextDirection = 'left';
    this.facingDirection = 'left';
    this.mouthPhase = 0;
    this.speed = SPEEDS.pacman * TILE_SIZE;
  }

  isAtCenter() {
    const centerX = this.gridX * TILE_SIZE + TILE_SIZE / 2;
    const centerY = this.gridY * TILE_SIZE + TILE_SIZE / 2;
    const cx = this.pixelX + TILE_SIZE / 2;
    const cy = this.pixelY + TILE_SIZE / 2;
    return Math.abs(cx - centerX) < 1 && Math.abs(cy - centerY) < 1;
  }

  _context() {
    return {
      gridX: this.gridX,
      gridY: this.gridY,
    };
  }

  _canGo(map, x, y, direction) {
    if (!direction) return false;
    const d = DIRECTIONS[direction];
    return !map.isWall(x + d.x, y + d.y);
  }

  _syncGridFromPixel() {
    this.gridX = Math.round((this.pixelX + TILE_SIZE / 2 - TILE_SIZE / 2) / TILE_SIZE);
    this.gridY = Math.round((this.pixelY + TILE_SIZE / 2 - TILE_SIZE / 2) / TILE_SIZE);
  }

  update(map, inputDirection, dt) {
    if (inputDirection) {
      this.nextDirection = inputDirection;
      this.facingDirection = inputDirection;
    }

    if (this.isAtCenter()) {
      this._syncGridFromPixel();

      if (this._canGo(map, this.gridX, this.gridY, this.nextDirection)) {
        this.direction = this.nextDirection;
        this.facingDirection = this.direction;
      } else if (!this._canGo(map, this.gridX, this.gridY, this.direction)) {
        this.direction = null;
      }
    }

    if (this.direction) {
      const d = DIRECTIONS[this.direction];
      this.pixelX += d.x * this.speed * dt;
      this.pixelY += d.y * this.speed * dt;

      const targetX = (this.gridX + d.x) * TILE_SIZE;
      const targetY = (this.gridY + d.y) * TILE_SIZE;

      if (d.x > 0 && this.pixelX >= targetX) {
        this.pixelX = targetX;
        this.gridX += d.x;
      } else if (d.x < 0 && this.pixelX <= targetX) {
        this.pixelX = targetX;
        this.gridX += d.x;
      } else if (d.y > 0 && this.pixelY >= targetY) {
        this.pixelY = targetY;
        this.gridY += d.y;
      } else if (d.y < 0 && this.pixelY <= targetY) {
        this.pixelY = targetY;
        this.gridY += d.y;
      }
    }

    if (this.direction) {
      this.mouthPhase += dt * 12;
    } else {
      this.mouthPhase = 0;
    }

    return this._eatPill(map);
  }

  _eatPill(map) {
    const tile = map.getTile(this.gridX, this.gridY);
    if (tile === '.') {
      map.setTile(this.gridX, this.gridY, ' ');
      return { points: SCORE.pill, scared: false };
    }
    if (tile === 'O') {
      map.setTile(this.gridX, this.gridY, ' ');
      return { points: SCORE.superPill, scared: true };
    }
    return null;
  }
}
