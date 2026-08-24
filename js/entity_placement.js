// NE PAS MODIFIER — glisser-déposer Pac-Man et fantôme sur la carte

import { TILE_SIZE } from './config.js';

function canvasCoords(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

function gridFromClient(canvas, clientX, clientY) {
  const { x, y } = canvasCoords(canvas, clientX, clientY);
  return {
    gridX: Math.floor(x / TILE_SIZE),
    gridY: Math.floor(y / TILE_SIZE),
  };
}

function distToEntity(canvas, clientX, clientY, entity) {
  const { x, y } = canvasCoords(canvas, clientX, clientY);
  const cx = entity.pixelX + TILE_SIZE / 2;
  const cy = entity.pixelY + TILE_SIZE / 2;
  const dx = x - cx;
  const dy = y - cy;
  return Math.sqrt(dx * dx + dy * dy);
}

function pickTarget(game, canvas, clientX, clientY) {
  const hitRadius = TILE_SIZE * 0.55;

  if (distToEntity(canvas, clientX, clientY, game.ghost) < hitRadius) {
    return 'ghost';
  }
  if (!game.dead && distToEntity(canvas, clientX, clientY, game.pacman) < hitRadius) {
    return 'pacman';
  }
  return null;
}

export function initEntityPlacement(canvas, game) {
  let dragTarget = null;

  function placeAt(target, gridX, gridY) {
    if (target === 'pacman') {
      return game.placePacman(gridX, gridY);
    }
    return game.placeGhost(gridX, gridY);
  }

  function updateHover(clientX, clientY) {
    if (dragTarget || !game.canPlaceEntities()) {
      canvas.classList.remove('placement-hover');
      return;
    }
    const target = pickTarget(game, canvas, clientX, clientY);
    canvas.classList.toggle('placement-hover', !!target);
  }

  canvas.addEventListener('mousedown', (e) => {
    if (!game.canPlaceEntities()) {
      return;
    }
    const target = pickTarget(game, canvas, e.clientX, e.clientY);
    if (!target) {
      return;
    }
    e.preventDefault();
    dragTarget = target;
    game.input.setEnabled(false);
    canvas.classList.add('placement-dragging');
    canvas.classList.remove('placement-hover');
    const { gridX, gridY } = gridFromClient(canvas, e.clientX, e.clientY);
    placeAt(dragTarget, gridX, gridY);
  });

  window.addEventListener('mousemove', (e) => {
    if (dragTarget) {
      const { gridX, gridY } = gridFromClient(canvas, e.clientX, e.clientY);
      placeAt(dragTarget, gridX, gridY);
      return;
    }
    updateHover(e.clientX, e.clientY);
  });

  window.addEventListener('mouseup', () => {
    if (!dragTarget) {
      return;
    }
    dragTarget = null;
    canvas.classList.remove('placement-dragging');
    if (game.started && !game.paused) {
      game.input.setEnabled(true);
    }
  });

  canvas.addEventListener('mouseleave', () => {
    if (!dragTarget) {
      canvas.classList.remove('placement-hover');
    }
  });
}
