// NE PAS MODIFIER — code de base de l'atelier

import {
  TILE_SIZE,
  SPEEDS,
  DIRECTIONS,
  PATROL_LOCK_DURATION,
  GHOST_RETURN_SPEED_FACTOR,
} from '../config.js';

// Parcours en largeur sur la grille : le plus court chemin d'une case à l'autre,
// en ne passant que par des cases libres. Sert au retour du fantôme mangé, qui
// traverse la carte tout seul au lieu d'être téléporté.
function findPath(map, fromX, fromY, toX, toY) {
  if (fromX === toX && fromY === toY) {
    return [];
  }

  const key = (x, y) => `${x},${y}`;
  const cameFrom = new Map([[key(fromX, fromY), null]]);
  const queue = [[fromX, fromY]];

  while (queue.length > 0) {
    const [x, y] = queue.shift();

    for (const dir of map.getWalkableNeighbors(x, y)) {
      const d = DIRECTIONS[dir];
      const nx = x + d.x;
      const ny = y + d.y;
      if (cameFrom.has(key(nx, ny))) {
        continue;
      }
      cameFrom.set(key(nx, ny), { x, y, dir });

      if (nx === toX && ny === toY) {
        const path = [];
        let cx = nx;
        let cy = ny;
        let step = cameFrom.get(key(cx, cy));
        while (step) {
          path.unshift(step.dir);
          cx = step.x;
          cy = step.y;
          step = cameFrom.get(key(cx, cy));
        }
        return path;
      }

      queue.push([nx, ny]);
    }
  }

  return null;
}

let chooseDirection = () => null;
let updateState = () => 'patrol';
let buildInfosFn = null;
let onAiError = null;
let aiDisabled = false;

const VALID_DIRECTIONS = new Set(['left', 'right', 'up', 'down']);
const VALID_STATES = new Set(['patrol', 'follow', 'scared']);

export function setGhostAI(chooseFn, updateFn, buildInfos = null) {
  chooseDirection = chooseFn;
  updateState = updateFn;
  buildInfosFn = buildInfos;
  aiDisabled = false;
}

export function setGhostAIErrorHandler(handler) {
  onAiError = handler;
}

export function resetGhostAICircuitBreaker() {
  aiDisabled = false;
}

function reportAiError(err, context) {
  if (onAiError) {
    onAiError(err, context);
  }
}

function safeCall(fn, context, fallback) {
  if (aiDisabled) {
    return fallback();
  }

  try {
    return fn();
  } catch (err) {
    aiDisabled = true;
    reportAiError(err, context);
    return fallback();
  }
}

export class Ghost {
  constructor(startX, startY) {
    this.gridX = startX;
    this.gridY = startY;
    this.pixelX = startX * TILE_SIZE;
    this.pixelY = startY * TILE_SIZE;
    this.direction = null;
    this.state = 'patrol';
    this.patrolLockTimer = 0;
    this.speed = SPEEDS.ghost * TILE_SIZE;
    // Retour après s'être fait manger : le fantôme rentre par ses propres
    // moyens, sans passer par le code de l'élève, et ne peut ni tuer ni être
    // mangé pendant le trajet.
    this.returning = false;
    this.returnPath = [];
  }

  startReturn(map, targetX, targetY) {
    this._syncGridFromPixel();
    // On recale sur le centre de la case : le chemin se suit case par case, et
    // le fantôme peut avoir été touché entre deux.
    this.pixelX = this.gridX * TILE_SIZE;
    this.pixelY = this.gridY * TILE_SIZE;

    this.returnPath = findPath(map, this.gridX, this.gridY, targetX, targetY) || [];
    this.returning = true;
    this.patrolLockTimer = 0;
    this.direction = this.returnPath.length > 0 ? this.returnPath.shift() : null;
  }

  isAtCenter() {
    const centerX = this.gridX * TILE_SIZE + TILE_SIZE / 2;
    const centerY = this.gridY * TILE_SIZE + TILE_SIZE / 2;
    const cx = this.pixelX + TILE_SIZE / 2;
    const cy = this.pixelY + TILE_SIZE / 2;
    return Math.abs(cx - centerX) < 1 && Math.abs(cy - centerY) < 1;
  }

  getInfos(map, pacman) {
    if (buildInfosFn) {
      return safeCall(
        () => buildInfosFn(this._context(), pacman._context(), map),
        'buildInfos',
        () => this._defaultInfos(map, pacman)
      );
    }

    return this._defaultInfos(map, pacman);
  }

  _context() {
    return {
      gridX: this.gridX,
      gridY: this.gridY,
      direction: this.direction,
      state: this.state,
      patrolLockTimer: this.patrolLockTimer,
    };
  }

  _defaultInfos(map, pacman) {
    return {
      canGoUp: !map.isWall(this.gridX, this.gridY - 1),
      canGoDown: !map.isWall(this.gridX, this.gridY + 1),
      canGoLeft: !map.isWall(this.gridX - 1, this.gridY),
      canGoRight: !map.isWall(this.gridX + 1, this.gridY),
      distanceX: pacman.gridX - this.gridX,
      distanceY: pacman.gridY - this.gridY,
      totalDistance: Math.abs(pacman.gridX - this.gridX) + Math.abs(pacman.gridY - this.gridY),
      currentDirection: this.direction,
      patrolLockTimer: this.patrolLockTimer,
      state: this.state,
    };
  }

  _syncGridFromPixel() {
    this.gridX = Math.round((this.pixelX + TILE_SIZE / 2 - TILE_SIZE / 2) / TILE_SIZE);
    this.gridY = Math.round((this.pixelY + TILE_SIZE / 2 - TILE_SIZE / 2) / TILE_SIZE);
  }

  update(map, pacman, game, dt) {
    // Pendant le retour, le code de l'élève n'est pas consulté : le fantôme
    // suit son chemin, puis rend la main telle qu'il l'avait prise.
    if (this.returning) {
      this._updateReturn(dt);
      return;
    }

    if (this.isAtCenter()) {
      this._syncGridFromPixel();

      const prevDirection = this.direction;
      const lockExpired = this.patrolLockTimer <= 0;

      const infos = this.getInfos(map, pacman);
      this.state = safeCall(
        () => {
          const nextState = updateState(infos, game);
          return VALID_STATES.has(nextState) ? nextState : 'patrol';
        },
        'updateState',
        () => 'patrol'
      );
      infos.state = this.state;

      if (this.state !== 'patrol') {
        this.patrolLockTimer = 0;
      }

      const newDirection = safeCall(
        () => chooseDirection(infos, map),
        'chooseDirection',
        () => null
      );

      if (newDirection === undefined) {
        // no return → keep current direction (pedagogical: forgotten return null)
      } else if (newDirection === null || !VALID_DIRECTIONS.has(newDirection)) {
        this.direction = null;
      } else {
        this.direction = newDirection;
        if (this.state === 'patrol' && (prevDirection !== newDirection || lockExpired)) {
          this.patrolLockTimer = PATROL_LOCK_DURATION;
        }
      }
    }

    if (this.state === 'patrol' && this.patrolLockTimer > 0) {
      this.patrolLockTimer = Math.max(0, this.patrolLockTimer - dt);
    }

    this._advance(dt, this.speed);
  }

  _updateReturn(dt) {
    if (this.isAtCenter()) {
      this._syncGridFromPixel();

      if (this.returnPath.length === 0) {
        this.returning = false;
        this.direction = null;
        return;
      }
      this.direction = this.returnPath.shift();
    }

    this._advance(dt, this.speed * GHOST_RETURN_SPEED_FACTOR);
  }

  _advance(dt, speed) {
    if (!this.direction) {
      return;
    }

    const d = DIRECTIONS[this.direction];
    this.pixelX += d.x * speed * dt;
    this.pixelY += d.y * speed * dt;

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
}
