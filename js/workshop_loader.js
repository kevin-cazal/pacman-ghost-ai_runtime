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

export async function applyStudentCode(code, game, mode = getWorkshopMode()) {
  try {
    const bindings = compileAndBindStudentCode(code, {
      requiresBuildInfos: mode.requiresBuildInfos,
    });

    setGhostAI(
      bindings.chooseDirection,
      bindings.updateState,
      mode.requiresBuildInfos ? bindings.buildInfos : null
    );
    setGhostAIErrorHandler((err, context) => {
      game.handleRuntimeError(err, context);
    });
    lastGoodBindings = bindings;
    saveCode(code, mode);
    game.clearRuntimeError();
    return null;
  } catch (err) {
    if (lastGoodBindings) {
      setGhostAI(
        lastGoodBindings.chooseDirection,
        lastGoodBindings.updateState,
        mode.requiresBuildInfos ? lastGoodBindings.buildInfos : null
      );
      setGhostAIErrorHandler((err, context) => {
        game.handleRuntimeError(err, context);
      });
    }
    return formatError(err);
  }
}

export function formatRuntimeError(err, context) {
  const msg = err && err.message ? err.message : String(err);
  const fn = context || 'ton code';

  if (msg.includes('attempt to index') && msg.includes('nil value')) {
    return `Erreur à l'exécution (${fn}) : ${msg} — Vérifie les noms de variables (ex. infos, pas info). Clique Arrêter, corrige, puis Démarrer.`;
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
  if (msg.includes('buildInfos manquante')) {
    return `Fonction buildInfos manquante — la fonction buildInfos doit rester dans le fichier.`;
  }
  if (msg.includes('chooseDirection manquante')) {
    return `Fonction chooseDirection manquante — la fonction chooseDirection doit rester dans le fichier.`;
  }
  if (msg.includes('updateState manquante')) {
    return `Fonction updateState manquante — la fonction updateState doit rester dans le fichier.`;
  }
  if (msg.includes('Fengari non chargé')) {
    return `${msg}`;
  }
  return `Erreur : ${msg} — Lis le message, corrige ton code, puis reclique Démarrer. Le jeu garde le dernier code valide.`;
}
