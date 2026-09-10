// NE PAS MODIFIER — code de base de l'atelier

export const TILE_SIZE = 24;

export const COLS = 19;
export const ROWS = 15;

// Le repère de dessin, en « pixels de jeu ». Tout le rendu et le glisser-déposer
// raisonnent dans ces unités, quelle que soit la taille réelle du canvas.
export const GAME_WIDTH = COLS * TILE_SIZE;
export const GAME_HEIGHT = ROWS * TILE_SIZE;

// Le canvas est agrandi par le CSS pour remplir le panneau. Si sa mémoire reste
// à GAME_WIDTH, le navigateur étire une image de 456 px : d'où les escaliers sur
// les ronds et le flou sur le texte. On la dimensionne donc en pixels écran, en
// bornant le facteur pour ne pas allouer une image démesurée sur un grand moniteur.
export const MAX_RENDER_SCALE = 4;

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
export const PATROL_DIRECTION_DURATION = 1.5;

// Le fantôme mangé rentre plus vite qu'il ne se déplace normalement : la carte
// fait vingt-huit cases de bout en bout, et le trajet ne doit pas mettre
// l'élève en attente.
export const GHOST_RETURN_SPEED_FACTOR = 2.5;

// En poursuite, le fantôme accélère : à sa vitesse d'errance la chasse ne se
// sent pas. 3,3 cases par seconde contre 3 en errance, et 4 pour Pac-Man.
//
// Le rapport est un réglage de ressenti, pas un résultat mesuré : un banc
// automatique ne le départage pas, parce que la patrouille aléatoire pèse plus
// lourd que la vitesse sur l'issue d'une poursuite. Il se règle en jouant.
// 1,17 a été essayé et rendu : le fantôme ne lâchait plus.
export const GHOST_FOLLOW_SPEED_FACTOR = 1.10;

export const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
