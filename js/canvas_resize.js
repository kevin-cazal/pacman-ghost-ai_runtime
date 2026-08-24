// NE PAS MODIFIER — code de base de l'atelier

import { COLS, ROWS } from './config.js';

const GAME_ASPECT = COLS / ROWS;

export function fitCanvasToContainer(canvas) {
  const wrap = canvas.parentElement;
  if (!wrap) {
    return;
  }

  const maxW = wrap.clientWidth;
  const maxH = wrap.clientHeight;
  if (maxW <= 0 || maxH <= 0) {
    return;
  }

  const containerAspect = maxW / maxH;
  let displayW;
  let displayH;

  if (containerAspect > GAME_ASPECT) {
    displayH = maxH;
    displayW = maxH * GAME_ASPECT;
  } else {
    displayW = maxW;
    displayH = maxW / GAME_ASPECT;
  }

  canvas.style.width = `${Math.floor(displayW)}px`;
  canvas.style.height = `${Math.floor(displayH)}px`;
}

export function watchCanvasResize(canvas) {
  const wrap = canvas.parentElement;
  if (!wrap) {
    return;
  }

  const update = () => fitCanvasToContainer(canvas);
  update();

  const observer = new ResizeObserver(update);
  observer.observe(wrap);
  window.addEventListener('resize', update);
}
