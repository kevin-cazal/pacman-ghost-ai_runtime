// NE PAS MODIFIER — pont Fengari pour le code Lua des élèves

function getFengari() {
  const fengari = globalThis.fengari;
  if (!fengari) {
    throw new Error('Fengari non chargé — lance ./scripts/setup-fengari.sh');
  }
  return fengari;
}

function isLuaTableProxy(value) {
  return typeof value === 'function' && typeof value.get === 'function' && typeof value.invoke === 'function';
}

export function luaProxyToObject(proxy) {
  if (proxy === undefined || proxy === null) {
    return proxy;
  }
  if (!isLuaTableProxy(proxy)) {
    return proxy;
  }

  const obj = {};
  if (typeof proxy[Symbol.iterator] === 'function') {
    for (const entry of proxy) {
      const [key, value] = entry;
      obj[key] = isLuaTableProxy(value) ? luaProxyToObject(value) : value;
    }
  }
  return obj;
}

function toLuaGhost(ghostCtx) {
  return {
    gridX: ghostCtx.gridX,
    gridY: ghostCtx.gridY,
    direction: ghostCtx.direction,
    state: ghostCtx.state,
    patrolLockTimer: ghostCtx.patrolLockTimer,
  };
}

function toLuaPacman(pacmanCtx) {
  return {
    gridX: pacmanCtx.gridX,
    gridY: pacmanCtx.gridY,
  };
}

// Fengari passes the first Lua argument as JS `this` when Lua calls a JS function
// with dot syntax (see fengari-interop#32). `map.isWall(0, 0)` becomes isWall.call(0, 0).
function wrapLuaMethod(fn) {
  return function (...args) {
    if (args.length + 1 === fn.length) {
      return fn(this, ...args);
    }
    return fn(...args);
  };
}

function toLuaApi(data, methods = {}) {
  const api = { ...data };
  for (const [name, fn] of Object.entries(methods)) {
    api[name] = wrapLuaMethod(fn);
  }
  return api;
}

function toLuaMap(map) {
  return toLuaApi({}, {
    isWall: (x, y) => map.isWall(x, y),
  });
}

function toLuaGame(game) {
  return toLuaApi({
    scaredTimer: game.scaredTimer,
  });
}

function toLuaInfos(infos) {
  if (!infos || typeof infos !== 'object') {
    return infos;
  }
  return { ...infos };
}

function createLuaState() {
  const { lua, lauxlib, lualib, to_luastring, interop } = getFengari();
  const { push, luaopen_js } = interop;
  const { luaL_newstate, luaL_requiref, luaL_loadstring, luaL_dostring } = lauxlib;
  const { luaL_openlibs } = lualib;
  const {
    lua_getglobal,
    lua_pcall,
    lua_settop,
    lua_type,
    lua_pop,
    LUA_OK,
    LUA_TFUNCTION,
    lua_tojsstring,
  } = lua;

  const L = luaL_newstate();
  luaL_openlibs(L);
  luaL_requiref(L, to_luastring('js'), luaopen_js, 0);
  lua_pop(L, 1);

  function callGlobal(name, args, { convertResult = true } = {}) {
    lua_getglobal(L, to_luastring(name));
    if (lua_type(L, -1) !== LUA_TFUNCTION) {
      lua_settop(L, 0);
      throw new Error(`Fonction ${name} introuvable`);
    }

    args.forEach((arg) => push(L, arg));

    const status = lua_pcall(L, args.length, 1, 0);
    if (status !== LUA_OK) {
      const err = interop.tojs(L, -1);
      lua_settop(L, 0);
      throw err instanceof Error ? err : new Error(String(err));
    }

    let result = interop.tojs(L, -1);
    lua_settop(L, 0);

    if (convertResult && isLuaTableProxy(result)) {
      result = luaProxyToObject(result);
    }

    if (result === undefined) {
      return null;
    }

    return result;
  }

  function loadStudentSource(source) {
    const status = luaL_loadstring(L, to_luastring(source));
    if (status !== LUA_OK) {
      const msg = lua_tojsstring(L, -1);
      lua_settop(L, 0);
      throw new Error(msg);
    }

    const runStatus = lua_pcall(L, 0, 0, 0);
    if (runStatus !== LUA_OK) {
      const err = interop.tojs(L, -1);
      lua_settop(L, 0);
      throw err instanceof Error ? err : new Error(String(err));
    }

    lua_settop(L, 0);
  }

  function assertGlobalFunction(name) {
    lua_getglobal(L, to_luastring(name));
    const ok = lua_type(L, -1) === LUA_TFUNCTION;
    lua_pop(L, 1);
    if (!ok) {
      throw new Error(`Fonction ${name} manquante`);
    }
  }

  return {
    loadStudentSource,
    assertGlobalFunction,
    callGlobal,
  };
}

export function compileAndBindStudentCode(source, { requiresBuildInfos = true } = {}) {
  const runtime = createLuaState();

  runtime.loadStudentSource(source);

  if (requiresBuildInfos) {
    runtime.assertGlobalFunction('buildInfos');
  }
  runtime.assertGlobalFunction('chooseDirection');
  runtime.assertGlobalFunction('updateState');

  const bindings = {
    chooseDirection(infos, map) {
      return runtime.callGlobal('chooseDirection', [toLuaInfos(infos), toLuaMap(map)], {
        convertResult: false,
      });
    },
    updateState(infos, game) {
      return runtime.callGlobal('updateState', [toLuaInfos(infos), toLuaGame(game)], {
        convertResult: false,
      });
    },
  };

  if (requiresBuildInfos) {
    bindings.buildInfos = (ghostCtx, pacmanCtx, map) =>
      runtime.callGlobal('buildInfos', [toLuaGhost(ghostCtx), toLuaPacman(pacmanCtx), toLuaMap(map)]);
  }

  return bindings;
}
