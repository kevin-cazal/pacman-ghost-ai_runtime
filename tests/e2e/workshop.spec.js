import { test, expect } from '@playwright/test';

import { FIXTURES } from '../fixtures/solutions.js';

test.describe('workshop browser e2e', () => {
  test('loads Fengari and applies the Lua template without error', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => globalThis.fengari);

    const result = await page.evaluate(async () => {
      const { compileAndBindStudentCode } = await import('/js/workshop/lua_runtime.js');
      const { Map } = await import('/js/map.js');

      const response = await fetch('/js/workshop/ghost.lua');
      const code = await response.text();
      const bindings = compileAndBindStudentCode(code);
      const map = new Map();
      const me = { gridX: 8, gridY: 10, direction: null };
      const pacman = { gridX: 12, gridY: 10 };

      return bindings.think(me, pacman, map, { scaredTimer: 0 });
    });

    expect(result).toEqual({ direction: null, state: null });
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
    }, FIXTURES.chase);

    expect(result.error).toBeNull();
    expect(result.after.runtimeError).toBeNull();
    expect(result.after.direction).toBe('right');
    expect(result.after.gridX).toBeGreaterThan(result.start.gridX);
  });

  test('the console sees the game globals before the first start', async ({ page }) => {
    await page.goto('/?test=1');
    await page.waitForFunction(() => globalThis.fengari && window.__game);

    const result = await page.evaluate(async () => {
      const { applyStudentCode, evalInStudentState } = await import('/js/workshop_loader.js');
      const game = window.__game;
      game.reset();
      game.placePacman(3, 7);
      const error = await applyStudentCode('function ghost() return nil end', game);
      return {
        error,
        pacmanX: evalInStudentState('pacman.X'),
        me: evalInStudentState('me.X .. "," .. me.Y'),
        ghost: `${game.ghost.gridX},${game.ghost.gridY}`,
      };
    });

    expect(result.error).toBeNull();
    expect(result.pacmanX).toBe('3');
    expect(result.me).toBe(result.ghost);
  });

  test('state set by the student changes the ghost mood in the running game', async ({ page }) => {
    await page.goto('/?test=1');
    await page.waitForFunction(() => globalThis.fengari && window.__game);

    const result = await page.evaluate(async (code) => {
      const { applyStudentCode } = await import('/js/workshop_loader.js');
      const game = window.__game;
      game.reset();
      game.placePacman(1, 7);
      const error = await applyStudentCode(code, game);
      if (error) return { error };
      game.begin();
      game._update(1 / 60);
      const far = game.ghost.state;
      game.scaredTimer = 5;
      game._update(1 / 60);
      const scared = game.ghost.state;
      return { error: null, far, scared };
    }, FIXTURES.fsm);

    expect(result.error).toBeNull();
    expect(result.far).toBe('patrol');
    expect(result.scared).toBe('scared');
  });
});
