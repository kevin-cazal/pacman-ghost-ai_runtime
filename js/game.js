// NE PAS MODIFIER — code de base de l'atelier

import { Map } from './map.js';
import { Input } from './input.js';
import { Renderer } from './renderer.js';
import { Pacman } from './entities/pacman.js';
import { Ghost, resetGhostAICircuitBreaker } from './entities/ghost.js';
import { SCARED_DURATION, DEATH_RESTART_DELAY, TILE_SIZE } from './config.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.map = null;
    this.input = new Input();
    this.renderer = new Renderer(canvas);
    this.pacman = null;
    this.ghost = null;
    this.score = 0;
    this.scaredTimer = 0;
    this.won = false;
    this.dead = false;
    this.restartTimer = 0;
    this.paused = false;
    this.started = false;
    this.lastTime = 0;
    this.runtimeError = null;
    this.onRuntimeError = null;
    this.reset();
  }

  reset() {
    this.map = new Map();
    this.pacman = new Pacman(this.map.pacmanStart.x, this.map.pacmanStart.y);
    this.ghost = new Ghost(this.map.ghostStart.x, this.map.ghostStart.y);
    this.score = 0;
    this.scaredTimer = 0;
    this.won = false;
    this.dead = false;
    this.restartTimer = 0;
    this.paused = false;
    this.runtimeError = null;
  }

  clearRuntimeError() {
    this.runtimeError = null;
  }

  handleRuntimeError(err, context) {
    if (this.runtimeError) {
      return;
    }

    this.runtimeError = {
      message: err && err.message ? err.message : String(err),
      context: context || 'ton code',
    };
    this.paused = true;

    if (this.onRuntimeError) {
      this.onRuntimeError(this.runtimeError);
    }
  }

  begin() {
    this.started = true;
    this.paused = false;
    this.lastTime = performance.now();
    resetGhostAICircuitBreaker();
    this._startPacmanMovement();
    this._syncGhostForMovement();
  }

  _startPacmanMovement() {
    const defaultDir = 'left';

    if (this.pacman.direction) {
      return;
    }

    this.pacman.nextDirection = defaultDir;
    this.pacman.facingDirection = defaultDir;

    if (!this.pacman.isAtCenter()) {
      this.pacman.direction = defaultDir;
      return;
    }

    if (this.pacman._canGo(this.map, this.pacman.gridX, this.pacman.gridY, defaultDir)) {
      this.pacman.direction = defaultDir;
    }
  }

  _syncGhostForMovement() {
    this.ghost._syncGridFromPixel();
    this.ghost.pixelX = this.ghost.gridX * TILE_SIZE;
    this.ghost.pixelY = this.ghost.gridY * TILE_SIZE;
    this.ghost.direction = null;
  }

  stop() {
    this.started = false;
    this.paused = false;
    this.dead = false;
    this.won = false;
    this.restartTimer = 0;
    this.scaredTimer = 0;
    this.runtimeError = null;

    if (this.pacman) {
      this.pacman.direction = null;
      this.pacman.nextDirection = null;
    }
    if (this.ghost) {
      this.ghost.direction = null;
    }
  }

  placePacman(gridX, gridY) {
    if (this.map.isWall(gridX, gridY)) {
      return false;
    }
    this.pacman.gridX = gridX;
    this.pacman.gridY = gridY;
    this.pacman.pixelX = gridX * TILE_SIZE;
    this.pacman.pixelY = gridY * TILE_SIZE;
    this.pacman.direction = null;
    this.pacman.nextDirection = null;
    return true;
  }

  placeGhost(gridX, gridY) {
    if (this.map.isWall(gridX, gridY)) {
      return false;
    }
    this.ghost.gridX = gridX;
    this.ghost.gridY = gridY;
    this.ghost.pixelX = gridX * TILE_SIZE;
    this.ghost.pixelY = gridY * TILE_SIZE;
    this.ghost.direction = null;
    return true;
  }

  canPlaceEntities() {
    return !this.started || this.paused;
  }

  start() {
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this._loop(t));
  }

  _loop(timestamp) {
    const dt = this.paused
      ? 0
      : Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    if (!this.paused && this.started) {
      if (this.dead || this.won) {
        this.restartTimer -= dt;
        if (this.restartTimer <= 0) {
          this.reset();
        }
      } else {
        this._update(dt);
      }
    }

    this._render();
    requestAnimationFrame((t) => this._loop(t));
  }

  _update(dt) {
    if (this.scaredTimer > 0) {
      this.scaredTimer -= dt;
      if (this.scaredTimer < 0) {
        this.scaredTimer = 0;
      }
    }

    const direction = this.input.getDirection();
    const eatResult = this.pacman.update(this.map, direction, dt);

    if (eatResult) {
      this.score += eatResult.points;
      if (eatResult.scared) {
        this.scaredTimer = SCARED_DURATION;
      }
    }

    this.ghost.update(this.map, this.pacman, this, dt);

    if (this._checkGhostCollision()) {
      this._onDeath();
      return;
    }

    if (this.map.countRemainingPills() === 0) {
      this._onWin();
    }
  }

  _checkGhostCollision() {
    if (this.ghost.state === 'scared') {
      return false;
    }

    if (this.pacman.gridX === this.ghost.gridX && this.pacman.gridY === this.ghost.gridY) {
      return true;
    }

    const pacmanCx = this.pacman.pixelX + TILE_SIZE / 2;
    const pacmanCy = this.pacman.pixelY + TILE_SIZE / 2;
    const ghostCx = this.ghost.pixelX + TILE_SIZE / 2;
    const ghostCy = this.ghost.pixelY + TILE_SIZE / 2;
    const dx = pacmanCx - ghostCx;
    const dy = pacmanCy - ghostCy;
    return Math.sqrt(dx * dx + dy * dy) < TILE_SIZE * 0.75;
  }

  _onDeath() {
    this.dead = true;
    this.restartTimer = DEATH_RESTART_DELAY;
  }

  _onWin() {
    this.won = true;
    this.restartTimer = DEATH_RESTART_DELAY;
  }

  _render() {
    this.renderer.clear();
    this.renderer.drawMap(this.map);

    if (!this.dead) {
      this.renderer.drawPacman(this.pacman);
    }

    this.renderer.drawGhost(this.ghost);

    let message = null;
    let messageColor = null;
    if (this.won) {
      const seconds = Math.ceil(this.restartTimer);
      message = `Gagné ! Redémarrage dans ${seconds}s…`;
      messageColor = 'win';
    } else if (this.dead) {
      const seconds = Math.ceil(this.restartTimer);
      message = `Perdu ! Redémarrage dans ${seconds}s…`;
      messageColor = 'death';
    } else if (this.runtimeError) {
      message = `Erreur (${this.runtimeError.context}) — clique Arrêter, corrige, puis Démarrer`;
      messageColor = 'error';
    }

    this.renderer.drawHUD(
      this.score,
      this.map.countRemainingPills(),
      message,
      messageColor
    );
  }
}
