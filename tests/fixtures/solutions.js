export const FIXTURES = {
  template: {
    js: `export function buildInfos(ghost, pacman, map) {
  return {};
}

export function chooseDirection(infos, map) {
  return null;
}

export function updateState(infos, game) {
  return 'patrol';
}
`,
    lua: `function buildInfos(ghost, pacman, map)
  return {}
end

function chooseDirection(infos, map)
  return nil
end

function updateState(infos, game)
  return 'patrol'
end
`,
  },

  canGoLeft: {
    js: `export function buildInfos(ghost, pacman, map) {
  return {
    canGoLeft: !map.isWall(ghost.gridX - 1, ghost.gridY),
  };
}

export function chooseDirection(infos, map) {
  if (infos.canGoLeft) {
    return 'left';
  }
  return null;
}

export function updateState(infos, game) {
  return 'patrol';
}
`,
    lua: `function buildInfos(ghost, pacman, map)
  return {
    canGoLeft = not map.isWall(ghost.gridX - 1, ghost.gridY),
  }
end

function chooseDirection(infos, map)
  if infos.canGoLeft then
    return 'left'
  end
  return nil
end

function updateState(infos, game)
  return 'patrol'
end
`,
  },

  chaseOptimized: {
    js: `function tryHorizontal(infos) {
  if (infos.canGoLeft && infos.distanceX < 0) return 'left';
  if (infos.canGoRight && infos.distanceX > 0) return 'right';
  return null;
}

function tryVertical(infos) {
  if (infos.canGoUp && infos.distanceY < 0) return 'up';
  if (infos.canGoDown && infos.distanceY > 0) return 'down';
  return null;
}

export function buildInfos(ghost, pacman, map) {
  return {
    canGoUp: !map.isWall(ghost.gridX, ghost.gridY - 1),
    canGoDown: !map.isWall(ghost.gridX, ghost.gridY + 1),
    canGoLeft: !map.isWall(ghost.gridX - 1, ghost.gridY),
    canGoRight: !map.isWall(ghost.gridX + 1, ghost.gridY),
    distanceX: pacman.gridX - ghost.gridX,
    distanceY: pacman.gridY - ghost.gridY,
  };
}

export function chooseDirection(infos, map) {
  if (Math.abs(infos.distanceX) > Math.abs(infos.distanceY)) {
    return tryHorizontal(infos) || tryVertical(infos);
  }
  return tryVertical(infos) || tryHorizontal(infos);
}

export function updateState(infos, game) {
  return 'patrol';
}
`,
    lua: `local function tryHorizontal(infos)
  if infos.canGoLeft and infos.distanceX < 0 then return 'left' end
  if infos.canGoRight and infos.distanceX > 0 then return 'right' end
  return nil
end

local function tryVertical(infos)
  if infos.canGoUp and infos.distanceY < 0 then return 'up' end
  if infos.canGoDown and infos.distanceY > 0 then return 'down' end
  return nil
end

function buildInfos(ghost, pacman, map)
  return {
    canGoUp = not map.isWall(ghost.gridX, ghost.gridY - 1),
    canGoDown = not map.isWall(ghost.gridX, ghost.gridY + 1),
    canGoLeft = not map.isWall(ghost.gridX - 1, ghost.gridY),
    canGoRight = not map.isWall(ghost.gridX + 1, ghost.gridY),
    distanceX = pacman.gridX - ghost.gridX,
    distanceY = pacman.gridY - ghost.gridY,
  }
end

function chooseDirection(infos, map)
  if math.abs(infos.distanceX) > math.abs(infos.distanceY) then
    return tryHorizontal(infos) or tryVertical(infos)
  end
  return tryVertical(infos) or tryHorizontal(infos)
end

function updateState(infos, game)
  return 'patrol'
end
`,
  },

  fsmStates: {
    js: `export function buildInfos(ghost, pacman, map) {
  return {
    totalDistance: Math.abs(pacman.gridX - ghost.gridX) + Math.abs(pacman.gridY - ghost.gridY),
    state: ghost.state,
  };
}

export function chooseDirection(infos, map) {
  return null;
}

export function updateState(infos, game) {
  if (game.scaredTimer > 0) return 'scared';
  if (infos.totalDistance <= 8) return 'follow';
  return 'patrol';
}
`,
    lua: `function buildInfos(ghost, pacman, map)
  return {
    totalDistance = math.abs(pacman.gridX - ghost.gridX) + math.abs(pacman.gridY - ghost.gridY),
    state = ghost.state,
  }
end

function chooseDirection(infos, map)
  return nil
end

function updateState(infos, game)
  if game.scaredTimer > 0 then return 'scared' end
  if infos.totalDistance <= 8 then return 'follow' end
  return 'patrol'
end
`,
  },

  patrolLock: {
    js: `export function buildInfos(ghost, pacman, map) {
  return {
    canGoLeft: !map.isWall(ghost.gridX - 1, ghost.gridY),
    canGoRight: !map.isWall(ghost.gridX + 1, ghost.gridY),
    currentDirection: ghost.direction,
    patrolLockTimer: ghost.patrolLockTimer,
    state: ghost.state,
  };
}

export function chooseDirection(infos, map) {
  if (infos.state !== 'patrol') return null;

  if (infos.patrolLockTimer > 0 && infos.currentDirection === 'left' && infos.canGoLeft) {
    return 'left';
  }
  if (infos.patrolLockTimer > 0 && infos.currentDirection === 'right' && infos.canGoRight) {
    return 'right';
  }
  return null;
}

export function updateState(infos, game) {
  return 'patrol';
}
`,
    lua: `function buildInfos(ghost, pacman, map)
  return {
    canGoLeft = not map.isWall(ghost.gridX - 1, ghost.gridY),
    canGoRight = not map.isWall(ghost.gridX + 1, ghost.gridY),
    currentDirection = ghost.direction,
    patrolLockTimer = ghost.patrolLockTimer,
    state = ghost.state,
  }
end

function chooseDirection(infos, map)
  if infos.state ~= 'patrol' then return nil end

  if infos.patrolLockTimer > 0 and infos.currentDirection == 'left' and infos.canGoLeft then
    return 'left'
  end
  if infos.patrolLockTimer > 0 and infos.currentDirection == 'right' and infos.canGoRight then
    return 'right'
  end
  return nil
end

function updateState(infos, game)
  return 'patrol'
end
`,
  },
};

export const SCENARIOS = [
  {
    name: 'ghost start, pacman to the right',
    ghost: { gridX: 8, gridY: 10, direction: null, state: 'patrol', patrolLockTimer: 0 },
    pacman: { gridX: 12, gridY: 10 },
    game: { scaredTimer: 0 },
  },
  {
    name: 'ghost start, pacman to the left',
    ghost: { gridX: 8, gridY: 10, direction: null, state: 'patrol', patrolLockTimer: 0 },
    pacman: { gridX: 4, gridY: 10 },
    game: { scaredTimer: 0 },
  },
  {
    name: 'ghost start, pacman diagonally up-right',
    ghost: { gridX: 8, gridY: 10, direction: null, state: 'patrol', patrolLockTimer: 0 },
    pacman: { gridX: 12, gridY: 7 },
    game: { scaredTimer: 0 },
  },
  {
    name: 'ghost start, pacman diagonally down-left',
    ghost: { gridX: 8, gridY: 10, direction: null, state: 'patrol', patrolLockTimer: 0 },
    pacman: { gridX: 5, gridY: 12 },
    game: { scaredTimer: 0 },
  },
  {
    name: 'patrol lock keeps left direction',
    ghost: { gridX: 8, gridY: 10, direction: 'left', state: 'patrol', patrolLockTimer: 1.2 },
    pacman: { gridX: 12, gridY: 10 },
    game: { scaredTimer: 0 },
  },
  {
    name: 'fsm follow when pacman is close',
    ghost: { gridX: 8, gridY: 10, direction: null, state: 'patrol', patrolLockTimer: 0 },
    pacman: { gridX: 10, gridY: 10 },
    game: { scaredTimer: 0 },
  },
  {
    name: 'fsm patrol when pacman is far',
    ghost: { gridX: 8, gridY: 10, direction: null, state: 'patrol', patrolLockTimer: 0 },
    pacman: { gridX: 1, gridY: 1 },
    game: { scaredTimer: 0 },
  },
  {
    name: 'fsm scared when super pill active',
    ghost: { gridX: 8, gridY: 10, direction: null, state: 'follow', patrolLockTimer: 0 },
    pacman: { gridX: 9, gridY: 10 },
    game: { scaredTimer: 4 },
  },
  {
    name: 'map corner is a wall',
    ghost: { gridX: 1, gridY: 1, direction: null, state: 'patrol', patrolLockTimer: 0 },
    pacman: { gridX: 8, gridY: 10 },
    game: { scaredTimer: 0 },
  },
];

export const SIMULATION_SCENARIOS = [
  {
    name: 'chase moves ghost toward pacman on the right',
    ghost: { gridX: 8, gridY: 10, direction: null, state: 'patrol', patrolLockTimer: 0 },
    pacman: { gridX: 14, gridY: 10 },
    game: { scaredTimer: 0 },
    steps: 180,
    dt: 1 / 60,
  },
  {
    name: 'chase moves ghost toward pacman diagonally',
    ghost: { gridX: 8, gridY: 10, direction: null, state: 'patrol', patrolLockTimer: 0 },
    pacman: { gridX: 14, gridY: 7 },
    game: { scaredTimer: 0 },
    steps: 240,
    dt: 1 / 60,
  },
];
