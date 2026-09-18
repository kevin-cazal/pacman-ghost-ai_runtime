import { Map } from '../../js/map.js';
import { Ghost, setGhostAI, resetGhostAICircuitBreaker } from '../../js/entities/ghost.js';
import { Pacman } from '../../js/entities/pacman.js';
import { TILE_SIZE } from '../../js/config.js';

// Un appel de `ghost` hors du jeu : même contrat que dans Ghost._think.
export function think(bindings, { me, pacman, game = { scaredTimer: 0 } }) {
  const map = new Map();
  const ghostCtx = { gridX: me.X, gridY: me.Y, direction: me.direction ?? null };
  const pacmanCtx = { gridX: pacman.X, gridY: pacman.Y };
  return bindings.think(ghostCtx, pacmanCtx, map, game);
}

// Fait tourner le vrai Ghost, pas à pas, et renvoie sa trace case par case.
export function simulateGhost(bindings, scenario) {
  resetGhostAICircuitBreaker();
  setGhostAI((ghostCtx, pacmanCtx, map, game) => bindings.think(ghostCtx, pacmanCtx, map, game));

  const map = new Map();
  const ghost = new Ghost(scenario.me.X, scenario.me.Y);
  const pacman = new Pacman(scenario.pacman.X, scenario.pacman.Y);
  const game = { scaredTimer: scenario.game?.scaredTimer ?? 0 };

  ghost.pixelX = ghost.gridX * TILE_SIZE;
  ghost.pixelY = ghost.gridY * TILE_SIZE;

  const steps = scenario.steps ?? 120;
  const dt = scenario.dt ?? 1 / 60;
  const trace = [];

  for (let step = 0; step < steps; step += 1) {
    ghost.update(map, pacman, game, dt);
    trace.push({
      step,
      gridX: ghost.gridX,
      gridY: ghost.gridY,
      direction: ghost.direction,
      state: ghost.state,
    });
  }

  return { ghost, trace };
}
