// NE PAS MODIFIER — code de base de l'atelier

import {
  TILE_SIZE,
  SPEEDS,
  DIRECTIONS,
  GHOST_RETURN_SPEED_FACTOR,
  GHOST_FOLLOW_SPEED_FACTOR,
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

// Le code de l'élève tient dans une seule fonction, `ghost`, appelée chaque
// fois que le fantôme est au centre d'une case : c'est là qu'il choisit. Elle
// lit l'état du jeu dans des globales (me, pacman, map, game), renvoie une
// direction ou nil, et range l'humeur du fantôme dans la globale `state`. Le pont Lua renvoie les deux d'un coup : { direction, state }.
let think = () => ({ direction: null, state: 'patrol' });
let onAiError = null;
let aiDisabled = false;

const VALID_DIRECTIONS = new Set(['left', 'right', 'up', 'down']);
const VALID_STATES = new Set(['patrol', 'follow', 'scared']);

export function setGhostAI(thinkFn) {
  think = thinkFn;
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
    this.direction = this.returnPath.length > 0 ? this.returnPath.shift() : null;
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
      direction: this.direction,
    };
  }

  // Un appel de `ghost` : la réponse devient la direction, et `state` l'humeur.
  // Une réponse absente ou inconnue arrête le fantôme (c'est le « je ne fais
  // rien » du sujet) ; une humeur absente ou inconnue vaut patrol.
  _think(map, pacman, game) {
    const answer = safeCall(
      () => think(this._context(), pacman._context(), map, game),
      'ghost',
      () => ({ direction: null, state: this.state })
    );

    const direction = answer ? answer.direction : null;
    this.direction = VALID_DIRECTIONS.has(direction) ? direction : null;

    const state = answer ? answer.state : null;
    this.state = VALID_STATES.has(state) ? state : 'patrol';
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

    // Au centre d'une case, et seulement là : entre deux cases le fantôme
    // finit son déplacement. Arrêté, il est au centre à chaque image, et le
    // code est donc redemandé à chaque image jusqu'à ce qu'il réponde.
    if (this.isAtCenter()) {
      this._syncGridFromPixel();
      this._think(map, pacman, game);
    }

    // En poursuite seulement : c'est ce qui fait la différence entre un fantôme
    // qui erre et un fantôme qui te court après.
    const speed =
      this.state === 'follow' ? this.speed * GHOST_FOLLOW_SPEED_FACTOR : this.speed;
    this._advance(dt, speed);
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
