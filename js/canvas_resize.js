// NE PAS MODIFIER — code de base de l'atelier

import { COLS, ROWS, GAME_WIDTH, GAME_HEIGHT, MAX_RENDER_SCALE } from './config.js';

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

  // La mémoire du canvas suit la taille réellement affichée, en pixels écran.
  // Le rapport largeur/hauteur est calculé depuis la seule largeur pour rester
  // exact : displayH en découle déjà.
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const scale = Math.min((displayW * dpr) / GAME_WIDTH, MAX_RENDER_SCALE);
  const w = Math.round(GAME_WIDTH * scale);
  const h = Math.round(GAME_HEIGHT * scale);

  // Réassigner width/height vide le canvas et remet le contexte à zéro : on ne
  // le fait que si la taille change vraiment, sinon chaque resize clignote.
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
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
