// NE PAS MODIFIER — code de base de l'atelier

export const TILE_SIZE = 24;

export const COLS = 19;
export const ROWS = 15;

export const COLORS = {
  background: '#000000',
  wall: '#2121de',
  pill: '#ffb897',
  superPill: '#ffffff',
  pacman: '#ffff00',
  ghost: '#ff0000',
  ghostPatrol: '#ffb852',
  ghostScared: '#2121ff',
  text: '#ffffff',
  win: '#00ff00',
  death: '#ff4444',
  pause: '#ffcc00',
  error: '#ff6666',
};

export const SPEEDS = {
  pacman: 4,
  ghost: 3,
};

export const SCORE = {
  pill: 10,
  superPill: 50,
};

export const SCARED_DURATION = 8;
export const DEATH_RESTART_DELAY = 3;
export const PATROL_LOCK_DURATION = 1.5;

export const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
