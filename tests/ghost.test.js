import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

import { compileAndBindStudentCode } from '../js/workshop/lua_runtime.js';
import { Map } from '../js/map.js';
import { FIXTURES } from './fixtures/solutions.js';
import { loadFengari } from './helpers/fengari.js';
import { simulateGhost, think } from './helpers/simulate.js';

const START = { X: 8, Y: 10 };

before(() => {
  loadFengari();
});

describe('le contrat de la fonction ghost', () => {
  it('le modèle de départ ne bouge pas et reste en patrouille', () => {
    const bindings = compileAndBindStudentCode(FIXTURES.template);
    const answer = think(bindings, { me: START, pacman: { X: 12, Y: 10 } });
    assert.equal(answer.direction, null);
    assert.equal(answer.state, null, 'state non défini : le jeu retombe sur patrol');
  });

  it('un fichier sans fonction ghost est refusé avec un message nommé', () => {
    assert.throws(
      () => compileAndBindStudentCode('x = 1'),
      /Fonction ghost manquante/
    );
  });

  it('me, pacman et map sont visibles depuis le code', () => {
    const bindings = compileAndBindStudentCode(FIXTURES.canGoLeft);
    assert.equal(think(bindings, { me: START, pacman: { X: 12, Y: 10 } }).direction, 'left');
    // (1, 1) est un coin : à sa gauche, le mur du bord.
    assert.equal(think(bindings, { me: { X: 1, Y: 1 }, pacman: { X: 12, Y: 10 } }).direction, null);
  });

  it('les positions arrivent en entiers, pas en flottants', () => {
    const bindings = compileAndBindStudentCode(`function ghost()
  return tostring(me.X) .. ',' .. tostring(pacman.Y)
end`);
    assert.equal(think(bindings, { me: START, pacman: { X: 12, Y: 10 } }).direction, '8,10');
  });

  it('la poursuite prend l’axe où l’écart est le plus grand', () => {
    const bindings = compileAndBindStudentCode(FIXTURES.chase);
    const map = new Map();
    const cases = [
      { pacman: { X: 12, Y: 10 }, expected: 'right' },
      { pacman: { X: 4, Y: 10 }, expected: 'left' },
      { pacman: { X: 12, Y: 7 }, expected: 'right' },
      { pacman: { X: 5, Y: 12 }, expected: 'left' },
    ];
    for (const c of cases) {
      const dx = c.expected === 'right' ? 1 : -1;
      assert.equal(map.isWall(START.X + dx, START.Y), false, 'le scénario suppose la case libre');
      assert.equal(think(bindings, { me: START, pacman: c.pacman }).direction, c.expected);
    }
  });

  it('la globale state est relue après chaque appel', () => {
    const bindings = compileAndBindStudentCode(FIXTURES.fsm);
    assert.equal(think(bindings, { me: START, pacman: { X: 1, Y: 1 } }).state, 'patrol');
    assert.equal(think(bindings, { me: START, pacman: { X: 10, Y: 10 } }).state, 'follow');
    assert.equal(
      think(bindings, { me: START, pacman: { X: 10, Y: 10 }, game: { scaredTimer: 4 } }).state,
      'scared'
    );
  });
});

describe('le fantôme dans le jeu', () => {
  it('ghost est appelée 60 fois par seconde, quelle que soit la cadence d’affichage', () => {
    for (const [fps, seconds] of [[60, 2], [144, 2], [30, 2]]) {
      const bindings = compileAndBindStudentCode(FIXTURES.counter);
      simulateGhost(bindings, {
        me: START,
        pacman: { X: 12, Y: 10 },
        steps: fps * seconds,
        dt: 1 / fps,
      });
      assert.equal(bindings.evalConsole('calls'), String(60 * seconds), `à ${fps} images/s`);
    }
  });

  it('la poursuite amène le fantôme sur la case de Pac-Man, puis il s’arrête', () => {
    const bindings = compileAndBindStudentCode(FIXTURES.chase);
    const { trace } = simulateGhost(bindings, { me: START, pacman: { X: 14, Y: 10 }, steps: 180 });
    assert.equal(trace[30].direction, 'right');
    const last = trace[trace.length - 1];
    assert.deepEqual([last.gridX, last.gridY, last.direction], [14, 10, null]);
  });

  it('l’humeur choisie par le code colore le fantôme', () => {
    const bindings = compileAndBindStudentCode(FIXTURES.fsm);
    let sim = simulateGhost(bindings, { me: START, pacman: { X: 10, Y: 10 }, steps: 2 });
    assert.equal(sim.ghost.state, 'follow');
    sim = simulateGhost(bindings, { me: START, pacman: { X: 10, Y: 10 }, game: { scaredTimer: 3 }, steps: 2 });
    assert.equal(sim.ghost.state, 'scared');
    sim = simulateGhost(bindings, { me: START, pacman: { X: 1, Y: 1 }, steps: 2 });
    assert.equal(sim.ghost.state, 'patrol');
  });

  it('une valeur de state inconnue retombe sur patrol', () => {
    const bindings = compileAndBindStudentCode(`state = 'furieux'
function ghost() return nil end`);
    const { ghost } = simulateGhost(bindings, { me: START, pacman: { X: 1, Y: 1 }, steps: 2 });
    assert.equal(ghost.state, 'patrol');
  });

  it('une erreur dans ghost coupe le code et est signalée une fois', () => {
    const bindings = compileAndBindStudentCode(`function ghost()
  return infos.canGoLeft
end`);
    const { ghost, trace } = simulateGhost(bindings, { me: START, pacman: { X: 1, Y: 1 }, steps: 120 });
    assert.equal(ghost.direction, null);
    assert.ok(trace.every((f) => f.gridX === START.X && f.gridY === START.Y), 'il n’a pas bougé');
  });

  it('tenir sa direction : il file tout droit au lieu de tourner à chaque case', () => {
    const bindings = compileAndBindStudentCode(FIXTURES.holdDirection);
    const { trace } = simulateGhost(bindings, { me: START, pacman: { X: 1, Y: 1 }, steps: 60 * 6 });
    let changes = 0;
    for (let i = 1; i < trace.length; i += 1) {
      if (trace[i].direction !== trace[i - 1].direction) changes += 1;
    }
    // 6 s à 1,5 s par segment : 4 virages, plus ceux que les murs imposent.
    assert.ok(changes >= 2 && changes <= 8, `${changes} changements de direction`);
    const visited = new Set(trace.map((f) => `${f.gridX},${f.gridY}`));
    assert.ok(visited.size >= 8, `${visited.size} cases visitées`);
  });
});
