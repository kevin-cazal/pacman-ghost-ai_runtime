// NE PAS MODIFIER — panneau Console de l'atelier
//
// Sortie de `print(...)` pour le code Lua des élèves. Le but est qu'un élève
// n'ait jamais à ouvrir la console du navigateur.
//
// Deux contraintes viennent du jeu : `buildInfos` et `chooseDirection` sont
// appelées à la fréquence d'affichage, donc un `print` dedans produit ~60
// lignes par seconde. On plie donc les lignes identiques consécutives en
// « × N », on borne l'historique, et on écrit dans le DOM de façon
// incrémentale (une ligne ajoutée = un noeud ajouté), sous requestAnimationFrame.
//
// La saisie accepte les exemples sur plusieurs lignes des boîtes à outils : tant
// que Lua signale un morceau incomplet, on garde les lignes de côté et l'invite
// passe à « >> ». Une ligne vide, ou Échap, abandonne ce qui est en attente.

const MAX_LINES = 200;
const PLACEHOLDER = 'Tape du code Lua ici pour l’essayer.';
const PLACEHOLDER_SUITE = 'Continue ton exemple, ou laisse vide pour annuler.';
const INCOMPLET = '__WS_INCOMPLET__';

let outEl = null;
let emptyEl = null;
let lines = [];
let pending = false;
let frame = 0;

function decode(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (value instanceof Uint8Array) return new TextDecoder().decode(value);
  return String(value);
}

function atBottom() {
  return outEl.scrollHeight - outEl.scrollTop - outEl.clientHeight < 24;
}

function makeLine(text, echo) {
  const el = document.createElement('div');
  el.className = echo ? 'console-line console-line-echo' : 'console-line';
  el.append(document.createTextNode(text));
  return el;
}

function flush() {
  frame = 0;
  if (!pending || !outEl) return;
  pending = false;

  const stick = atBottom();
  emptyEl.hidden = lines.length > 0;

  for (const line of lines) {
    if (!line.el) {
      line.el = makeLine(line.text, line.echo);
      outEl.append(line.el);
    }
    if (line.count !== line.shownCount) {
      line.shownCount = line.count;
      if (line.count > 1) {
        if (!line.badge) {
          line.badge = document.createElement('span');
          line.badge.className = 'console-count';
          line.el.append(line.badge);
        }
        line.badge.textContent = ` × ${line.count}`;
      }
    }
  }

  if (stick) outEl.scrollTop = outEl.scrollHeight;
}

function schedule() {
  pending = true;
  if (!frame && outEl) frame = requestAnimationFrame(flush);
}

export function consoleWrite(value) {
  const text = decode(value);
  const last = lines[lines.length - 1];

  if (last && last.text === text) {
    last.count += 1;
  } else {
    lines.push({ text, count: 1, shownCount: 0, el: null, badge: null, echo: false });
    while (lines.length > MAX_LINES) {
      const dropped = lines.shift();
      if (dropped.el) dropped.el.remove();
    }
  }
  schedule();
}

export function consoleEcho(text) {
  const line = { text, count: 1, shownCount: 0, el: null, badge: null, echo: true };
  lines.push(line);
  while (lines.length > MAX_LINES) {
    const dropped = lines.shift();
    if (dropped.el) dropped.el.remove();
  }
  schedule();
}

export function clearConsole() {
  for (const line of lines) {
    if (line.el) line.el.remove();
  }
  lines = [];
  schedule();
}

export function initConsolePane(root, onSubmit) {
  outEl = root.querySelector('.console-out');
  emptyEl = root.querySelector('.console-empty');

  const btn = root.querySelector('.console-clear');
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearConsole();
    });
  }

  const input = root.querySelector('.console-input');
  const promptEl = root.querySelector('.console-prompt');
  if (input && onSubmit) {
    const history = [];
    let cursor = 0;
    let buffer = [];

    const setPrompt = (suite) => {
      if (promptEl) promptEl.textContent = suite ? '>>' : '>';
      input.placeholder = suite ? PLACEHOLDER_SUITE : PLACEHOLDER;
    };
    const reset = () => {
      buffer = [];
      setPrompt(false);
    };
    setPrompt(false);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && buffer.length) {
        input.value = '';
        reset();
        e.preventDefault();
        return;
      }
      if (e.key === 'Enter') {
        const line = input.value.trim();
        // Ligne vide : on abandonne le morceau en attente, sinon on ne fait rien.
        if (!line) {
          if (buffer.length) reset();
          return;
        }
        history.push(line);
        cursor = history.length;
        input.value = '';
        consoleEcho((buffer.length ? '>> ' : '> ') + line);

        buffer.push(line);
        const result = onSubmit(buffer.join('\n'));

        if (result === INCOMPLET) {
          setPrompt(true);
          return;
        }
        reset();
        if (result !== null && result !== undefined && result !== '') consoleWrite(result);
      } else if (e.key === 'ArrowUp' && history.length) {
        cursor = Math.max(0, cursor - 1);
        input.value = history[cursor] || '';
        e.preventDefault();
      } else if (e.key === 'ArrowDown' && history.length) {
        cursor = Math.min(history.length, cursor + 1);
        input.value = history[cursor] || '';
        e.preventDefault();
      }
    });
  }

  schedule();
}
