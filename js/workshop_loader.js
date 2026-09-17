// NE PAS MODIFIER — code de base de l'atelier

import { setGhostAI, setGhostAIErrorHandler } from './entities/ghost.js';
import { getWorkshopMode } from './workshop/config.js';
import { compileAndBindStudentCode } from './workshop/lua_runtime.js';

let lastGoodBindings = null;

export async function loadInitialCode(mode = getWorkshopMode()) {
  const saved = localStorage.getItem(mode.storageKey);
  if (saved) {
    return saved;
  }
  const response = await fetch(mode.templateUrl);
  if (!response.ok) {
    throw new Error(`Impossible de charger le modèle ${mode.templateUrl}`);
  }
  return response.text();
}

export function saveCode(code, mode = getWorkshopMode()) {
  localStorage.setItem(mode.storageKey, code);
}

function bind(bindings, game) {
  setGhostAI((ghostCtx, pacmanCtx, map, g) => bindings.think(ghostCtx, pacmanCtx, map, g));
  setGhostAIErrorHandler((err, context) => {
    game.handleRuntimeError(err, context);
  });
  bindings.refresh(game.ghost._context(), game.pacman._context(), game.map, game);
}

export async function applyStudentCode(code, game, mode = getWorkshopMode()) {
  try {
    const bindings = compileAndBindStudentCode(code);
    bind(bindings, game);
    lastGoodBindings = bindings;
    saveCode(code, mode);
    game.clearRuntimeError();
    return null;
  } catch (err) {
    if (lastGoodBindings) {
      bind(lastGoodBindings, game);
    }
    return formatError(err);
  }
}

// La console évalue dans l'état Lua du dernier code valide : l'élève y retrouve
// ses propres fonctions et ses variables globales.
export function evalInStudentState(source) {
  if (!lastGoodBindings || !lastGoodBindings.evalConsole) {
    return 'Lance ton code une fois (bouton Démarrer) avant d’utiliser la console.';
  }
  try {
    return lastGoodBindings.evalConsole(source);
  } catch (err) {
    return `Erreur : ${err && err.message ? err.message : String(err)}`;
  }
}

export function formatRuntimeError(err, context) {
  const msg = err && err.message ? err.message : String(err);
  const fn = context || 'ton code';

  if (msg.includes('attempt to index') && msg.includes('nil value')) {
    return `Erreur à l'exécution (${fn}) : ${msg} — Vérifie les noms : me, pacman, map, game, et tes propres variables. Clique Arrêter, corrige, puis Démarrer.`;
  }
  if (msg.includes('attempt to call') && msg.includes('nil value')) {
    return `Erreur à l'exécution (${fn}) : ${msg} — Tu as peut-être oublié une propriété ou appelé une valeur qui n'est pas une fonction. Clique Arrêter, corrige, puis Démarrer.`;
  }
  return `Erreur à l'exécution (${fn}) : ${msg} — Clique Arrêter, corrige ton code, puis Démarrer.`;
}

function formatError(err) {
  const msg = err && err.message ? err.message : String(err);

  if (
    msg.includes('syntax error') ||
    msg.includes('expected') ||
    msg.includes('unfinished') ||
    msg.includes('unexpected symbol')
  ) {
    return `Erreur de syntaxe : ${msg} — Vérifie les mots-clés then/end, les parenthèses et les virgules. Le dernier code valide est toujours utilisé : corrige puis reclique Démarrer.`;
  }
  if (msg.includes('ghost manquante')) {
    return `Fonction ghost manquante — la ligne \`function ghost()\` et son \`end\` doivent rester dans le fichier.`;
  }
  if (msg.includes('Fengari non chargé')) {
    return `${msg}`;
  }
  return `Erreur : ${msg} — Lis le message, corrige ton code, puis reclique Démarrer. Le jeu garde le dernier code valide.`;
}
