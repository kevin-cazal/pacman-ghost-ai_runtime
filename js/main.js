// NE PAS MODIFIER — code de base de l'atelier

import { Game } from './game.js';
import { initEditor } from './editor.js';
import { loadInitialCode, applyStudentCode, formatRuntimeError, evalInStudentState } from './workshop_loader.js';
import { getWorkshopMode } from './workshop/config.js';
import { renderMarkdown } from './workshop/markdown.js';
import { watchCanvasResize } from './canvas_resize.js';
import { initEntityPlacement } from './entity_placement.js';
import { initConsolePane, clearConsole } from './workshop/console_pane.js';

const workshopMode = getWorkshopMode();

const state = {
  atelier: 1,
};

let ATELIER_MARKDOWN = null;

const canvas = document.getElementById('game');
const game = new Game(canvas);

if (new URLSearchParams(window.location.search).has('test')) {
  window.__game = game;
}

game.onRuntimeError = (error) => {
  showError(formatRuntimeError(error, error.context));
  game.input.setEnabled(false);
  setFocus('editor');
};
const panelInstructions = document.getElementById('panel-instructions');
const panelCode = document.getElementById('panel-code');
const gamePane = document.getElementById('game-pane');
const instructionsEl = document.getElementById('instructions');
const btnStart = document.getElementById('btn-start');
const btnReset = document.getElementById('btn-reset');
const editorErrorEl = document.getElementById('editor-error');
const editorConsoleEl = document.getElementById('editor-console');

let editor = null;

function syncGameControls() {
  const running = game.started;
  btnStart.textContent = running ? 'Arrêter' : 'Démarrer';
  btnStart.classList.toggle('game-btn-start', !running);
  btnStart.classList.toggle('game-btn-stop', running);
}

function setFocus(mode) {
  document.body.classList.remove('focus-editor', 'focus-game');
  document.body.classList.add(mode === 'game' ? 'focus-game' : 'focus-editor');
  game.input.setEnabled(mode === 'game' && game.started && !game.paused);
}

panelInstructions.addEventListener('mousedown', () => setFocus('editor'));
panelCode.addEventListener('mousedown', () => setFocus('editor'));
gamePane.addEventListener('mousedown', () => {
  setFocus('game');
  canvas.focus();
});

function renderInstructions() {
  if (!ATELIER_MARKDOWN) {
    instructionsEl.innerHTML = '<p class="instructions-loading">Chargement des instructions…</p>';
    return;
  }

  const md = ATELIER_MARKDOWN[state.atelier];
  if (!md) {
    instructionsEl.innerHTML = '<p class="instructions-loading">Instructions indisponibles.</p>';
    return;
  }

  instructionsEl.innerHTML = renderMarkdown(md);
}

function showError(message) {
  if (message) {
    editorErrorEl.textContent = message;
    editorErrorEl.hidden = false;
  } else {
    editorErrorEl.hidden = true;
    editorErrorEl.textContent = '';
  }
}

async function applyCurrentCode() {
  if (!editor) return 'Éditeur non disponible';

  clearConsole();
  const error = await applyStudentCode(editor.getValue(), game, workshopMode);
  showError(error);
  return error;
}

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    const atelier = Number(tab.dataset.atelier);
    state.atelier = atelier;
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t === tab));
    renderInstructions();
  });
});

btnStart.addEventListener('click', async (e) => {
  e.stopPropagation();
  if (game.started) {
    game.stop();
    game.input.setEnabled(false);
    setFocus('editor');
    syncGameControls();
    return;
  }

  btnStart.disabled = true;
  const error = await applyCurrentCode();
  btnStart.disabled = false;

  if (error) {
    setFocus('editor');
    return;
  }

  game.begin();
  setFocus('game');
  canvas.focus();
  syncGameControls();
});

btnReset.addEventListener('click', (e) => {
  e.stopPropagation();
  if (game.started) {
    game.stop();
  }
  game.reset();
  game.input.setEnabled(false);
  setFocus('editor');
  syncGameControls();
});

async function boot() {
  renderInstructions();

  const stepsModule = await import(workshopMode.stepsPath);
  try {
    await stepsModule.loadWorkshopContent();
  } catch (err) {
    instructionsEl.innerHTML =
      `<p class="instructions-loading">Impossible de charger les instructions : ${err.message}</p>`;
    throw err;
  }

  ATELIER_MARKDOWN = stepsModule.ATELIER_MARKDOWN;

  document.title = 'Mini Pac-Man — Atelier';

  renderInstructions();
  setFocus('editor');
  syncGameControls();
  initConsolePane(editorConsoleEl, evalInStudentState);
  watchCanvasResize(canvas);
  initEntityPlacement(canvas, game);

  try {
    editor = await initEditor(document.getElementById('editor-host'));
    const code = await loadInitialCode(workshopMode);
    editor.setValue(code);

    const error = await applyStudentCode(code, game, workshopMode);
    showError(error);

    game.start();
    game._render();
  } catch (err) {
    showError(err.message || String(err));
    document.getElementById('editor-host').textContent =
      'Monaco non disponible. Lance : ./scripts/setup-monaco.sh';
  }
}

boot();
