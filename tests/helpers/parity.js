import assert from 'node:assert/strict';

import { Map } from '../../js/map.js';
import { Ghost, setGhostAI, resetGhostAICircuitBreaker } from '../../js/entities/ghost.js';
import { Pacman } from '../../js/entities/pacman.js';
import { TILE_SIZE } from '../../js/config.js';

function normalizeValue(value) {
  if (value === undefined) {
    return null;
  }
  return value;
}

export function normalizeInfos(infos) {
  if (!infos || typeof infos !== 'object') {
    return infos;
  }

  return Object.fromEntries(
    Object.entries(infos)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => [key, normalizeValue(value)])
  );
}

export function runAiScenario(bindings, scenario, { requiresBuildInfos = true } = {}) {
  const map = new Map();
  const ghost = { ...scenario.ghost };
  const pacman = { ...scenario.pacman };
  const game = { ...scenario.game };

  const result = {};

  if (requiresBuildInfos && bindings.buildInfos) {
    result.buildInfos = bindings.buildInfos(ghost, pacman, map);
  }

  const infos = {
    ...(result.buildInfos ?? {}),
    state: ghost.state ?? 'patrol',
  };

  result.updateState = bindings.updateState(infos, game);
  result.chooseDirection = bindings.chooseDirection(
    { ...infos, state: result.updateState },
    map
  );

  return result;
}

export function assertAiParity(jsBindings, luaBindings, scenario, options) {
  const jsResult = runAiScenario(jsBindings, scenario, options);
  const luaResult = runAiScenario(luaBindings, scenario, options);

  if (options?.requiresBuildInfos !== false) {
    assert.deepEqual(
      normalizeInfos(luaResult.buildInfos),
      normalizeInfos(jsResult.buildInfos),
      `buildInfos mismatch for scenario "${scenario.name}"`
    );
  }

  assert.equal(
    luaResult.updateState,
    jsResult.updateState,
    `updateState mismatch for scenario "${scenario.name}"`
  );
  assert.equal(
    luaResult.chooseDirection,
    jsResult.chooseDirection,
    `chooseDirection mismatch for scenario "${scenario.name}"`
  );
}

export function simulateGhost(bindings, scenario, { requiresBuildInfos = true } = {}) {
  resetGhostAICircuitBreaker();
  setGhostAI(
    bindings.chooseDirection,
    bindings.updateState,
    requiresBuildInfos ? bindings.buildInfos : null
  );

  const map = new Map();
  const ghost = new Ghost(scenario.ghost.gridX, scenario.ghost.gridY);
  const pacman = new Pacman(scenario.pacman.gridX, scenario.pacman.gridY);
  const game = { scaredTimer: scenario.game?.scaredTimer ?? 0 };

  ghost.direction = scenario.ghost.direction ?? null;
  ghost.state = scenario.ghost.state ?? 'patrol';
  ghost.patrolLockTimer = scenario.ghost.patrolLockTimer ?? 0;
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

  return trace;
}

export function assertSimulationParity(jsBindings, luaBindings, scenario, options) {
  const jsTrace = simulateGhost(jsBindings, scenario, options);
  const luaTrace = simulateGhost(luaBindings, scenario, options);

  assert.equal(
    luaTrace.length,
    jsTrace.length,
    `simulation length mismatch for scenario "${scenario.name}"`
  );

  for (let i = 0; i < jsTrace.length; i += 1) {
    const jsFrame = jsTrace[i];
    const luaFrame = luaTrace[i];

    assert.deepEqual(
      luaFrame,
      jsFrame,
      `simulation frame ${i} mismatch for scenario "${scenario.name}"`
    );
  }
}
