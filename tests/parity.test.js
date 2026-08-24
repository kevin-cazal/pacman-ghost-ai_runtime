import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

import { compileAndBindStudentCode } from '../js/workshop/lua_runtime.js';
import { FIXTURES, SCENARIOS, SIMULATION_SCENARIOS } from './fixtures/solutions.js';
import { loadFengari } from './helpers/fengari.js';
import { compileJsStudentCode } from './helpers/js_runtime.js';
import {
  assertAiParity,
  assertSimulationParity,
  normalizeInfos,
  runAiScenario,
} from './helpers/parity.js';

async function loadPair(fixtureName) {
  const fixture = FIXTURES[fixtureName];
  return {
    js: await compileJsStudentCode(fixture.js),
    lua: compileAndBindStudentCode(fixture.lua),
  };
}

before(() => {
  loadFengari();
});

describe('Lua vs JS parity', () => {
  it('template fixture matches on all scenarios', async () => {
    const pair = await loadPair('template');

    for (const scenario of SCENARIOS) {
      assertAiParity(pair.js, pair.lua, scenario);
    }
  });

  it('canGoLeft fixture matches on all scenarios', async () => {
    const pair = await loadPair('canGoLeft');

    for (const scenario of SCENARIOS) {
      assertAiParity(pair.js, pair.lua, scenario);
    }
  });

  it('chaseOptimized fixture matches on all scenarios', async () => {
    const pair = await loadPair('chaseOptimized');

    for (const scenario of SCENARIOS) {
      assertAiParity(pair.js, pair.lua, scenario);
    }
  });

  it('fsmStates fixture matches on all scenarios', async () => {
    const pair = await loadPair('fsmStates');

    for (const scenario of SCENARIOS) {
      assertAiParity(pair.js, pair.lua, scenario);
    }
  });

  it('patrolLock fixture matches on all scenarios', async () => {
    const pair = await loadPair('patrolLock');

    for (const scenario of SCENARIOS) {
      assertAiParity(pair.js, pair.lua, scenario);
    }
  });

  it('chaseOptimized simulation matches JS movement trace', async () => {
    const pair = await loadPair('chaseOptimized');

    for (const scenario of SIMULATION_SCENARIOS) {
      assertSimulationParity(pair.js, pair.lua, scenario);
    }
  });

  it('map.isWall returns the same values through Lua and JS runtimes', async () => {
    const pair = await loadPair('canGoLeft');
    const scenario = SCENARIOS[0];
    const infos = runAiScenario(pair.lua, scenario).buildInfos;

    assert.equal(typeof infos.canGoLeft, 'boolean');
    assert.equal(infos.canGoLeft, runAiScenario(pair.js, scenario).buildInfos.canGoLeft);
  });

  it('Lua buildInfos matches default ghost infos shape for chase fixture', async () => {
    const pair = await loadPair('chaseOptimized');
    const scenario = SCENARIOS[0];
    const infos = normalizeInfos(runAiScenario(pair.lua, scenario).buildInfos);

    assert.deepEqual(Object.keys(infos).sort(), [
      'canGoDown',
      'canGoLeft',
      'canGoRight',
      'canGoUp',
      'distanceX',
      'distanceY',
    ]);
  });
});
