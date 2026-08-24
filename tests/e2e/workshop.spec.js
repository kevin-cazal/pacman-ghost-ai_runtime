import { test, expect } from '@playwright/test';

import { FIXTURES } from '../fixtures/solutions.js';

test.describe('workshop browser e2e', () => {
  test('loads Fengari and applies the Lua template without error', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => globalThis.fengari);

    const result = await page.evaluate(async () => {
      const { compileAndBindStudentCode } = await import('/js/workshop/lua_runtime.js');
      const { Map } = await import('/js/map.js');

      const response = await fetch('/js/workshop/ghost_ai_build.lua');
      const code = await response.text();
      const bindings = compileAndBindStudentCode(code);
      const map = new Map();
      const ghost = { gridX: 8, gridY: 10, direction: null, state: 'patrol', patrolLockTimer: 0 };
      const pacman = { gridX: 12, gridY: 10 };

      return {
        buildInfos: bindings.buildInfos(ghost, pacman, map),
        chooseDirection: bindings.chooseDirection({}, map),
        updateState: bindings.updateState({}, { scaredTimer: 0 }),
      };
    });

    expect(result.buildInfos).toEqual({});
    expect(result.chooseDirection).toBeNull();
    expect(result.updateState).toBe('patrol');
  });

  test('ghost moves with the chase reference solution', async ({ page }) => {
    await page.goto('/?test=1');
    await page.waitForFunction(() => globalThis.fengari && window.__game);

    const result = await page.evaluate(async (code) => {
      const { applyStudentCode } = await import('/js/workshop_loader.js');
      const game = window.__game;

      game.reset();
      game.placePacman(14, 10);

      const error = await applyStudentCode(code, game);
      if (error) {
        return { error };
      }

      game.begin();

      const start = { gridX: game.ghost.gridX, gridY: game.ghost.gridY };
      for (let step = 0; step < 180; step += 1) {
        game._update(1 / 60);
        if (game.ghost.gridX !== start.gridX || game.ghost.gridY !== start.gridY) {
          break;
        }
      }

      return {
        error: null,
        start,
        after: {
          gridX: game.ghost.gridX,
          gridY: game.ghost.gridY,
          direction: game.ghost.direction,
          runtimeError: game.runtimeError,
        },
      };
    }, FIXTURES.chaseOptimized.lua);

    expect(result.error).toBeNull();
    expect(result.after.runtimeError).toBeNull();
    expect(result.after.direction).toBe('right');
    expect(result.after.gridX).toBeGreaterThan(result.start.gridX);
  });
});
