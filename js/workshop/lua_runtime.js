// NE PAS MODIFIER — pont Fengari pour le code Lua des élèves

import { consoleWrite } from './console_pane.js';

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
    X: ghostCtx.gridX,
    Y: ghostCtx.gridY,
    direction: ghostCtx.direction,
    state: ghostCtx.state,
    patrolLockTimer: ghostCtx.patrolLockTimer,
  };
}

function toLuaPacman(pacmanCtx) {
  return {
    X: pacmanCtx.gridX,
    Y: pacmanCtx.gridY,
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
    lua_createtable,
    lua_setfield,
    lua_pushinteger,
    lua_pushnumber,
    lua_pushboolean,
    lua_pushstring,
    lua_pushnil,
    lua_getglobal,
    lua_setglobal,
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

  installPrint();

  // Remplace le `print` de Lua pour qu'il écrive dans le panneau Console au
  // lieu de la console du navigateur. La mise en forme (varargs, tostring,
  // tabulations) est faite côté Lua : le pont JS ne reçoit qu'une chaîne.
  function installPrint() {
    push(L, function (text) {
      // Fengari passe parfois le premier argument via `this` (voir
      // fengari-interop#32) : on accepte les deux conventions.
      consoleWrite(text === undefined ? this : text);
    });
    lua_setglobal(L, to_luastring('__workshop_print'));

    const status = luaL_dostring(L, to_luastring(`
      local emit = __workshop_print
      __workshop_print = nil
      -- Les positions arrivent du moteur JS en flottants : 3 s'afficherait
      -- « 3.0 ». On retire le .0 quand la valeur est entière, et seulement là.
      local function show(v)
        if type(v) == 'number' and v > -1e15 and v < 1e15 and v == math.floor(v) then
          return string.format('%d', v)
        end
        return tostring(v)
      end
      print = function(...)
        local n = select('#', ...)
        local parts = {}
        for i = 1, n do parts[i] = show((select(i, ...))) end
        emit(table.concat(parts, '\t'))
      end

      -- REPL de la console. Il tourne dans le MÊME état Lua que le fichier de
      -- l'élève : ses fonctions et ses variables globales sont donc visibles.
      -- On tente d'abord un return implicite pour qu'une expression seule affiche sa
      -- valeur (« 1 + 1 » donne 2) ; sinon on charge la ligne telle quelle.
      function __ws_eval(src)
        local chunk = load('return ' .. src, '=console')
        if not chunk then
          local err
          chunk, err = load(src, '=console')
          if not chunk then return 'Erreur : ' .. tostring(err) end
        end
        local r = table.pack(pcall(chunk))
        if not r[1] then return 'Erreur : ' .. tostring(r[2]) end
        if r.n < 2 then return nil end
        local parts = {}
        for i = 2, r.n do parts[#parts + 1] = show(r[i]) end
        return table.concat(parts, '\t')
      end
    `));
    if (status !== LUA_OK) {
      lua_settop(L, 0);
      throw new Error('Impossible d’installer print');
    }
    lua_settop(L, 0);
  }

  // Les positions arrivent du moteur en `Number`. Poussées via l'interop, elles
  // deviennent des flottants Lua : `ghost.X` vaut alors 9.0, et un élève qui
  // écrit `print('x=' .. ghost.X)` lit « x=9.0 ». On construit donc une vraie
  // table Lua et on pousse chaque entier avec lua_pushinteger. Les valeurs
  // réellement fractionnaires (scaredTimer, patrolLockTimer) restent flottantes.
  function pushValue(v) {
    if (v === null || v === undefined) {
      lua_pushnil(L);
    } else if (typeof v === 'boolean') {
      lua_pushboolean(L, v);
    } else if (typeof v === 'number') {
      if (Number.isInteger(v)) lua_pushinteger(L, v);
      else lua_pushnumber(L, v);
    } else if (typeof v === 'string') {
      lua_pushstring(L, to_luastring(v));
    } else if (isPlainData(v)) {
      pushPlainTable(v);
    } else {
      push(L, v);
    }
  }

  function pushPlainTable(obj) {
    const entries = Object.entries(obj);
    lua_createtable(L, 0, entries.length);
    for (const [key, value] of entries) {
      pushValue(value);
      lua_setfield(L, -2, to_luastring(key));
    }
  }

  // Une table qui contient une fonction (map.isWall) doit passer par l'interop :
  // seul lui sait fabriquer le proxy appelable depuis Lua.
  function isPlainData(v) {
    if (v === null || typeof v !== 'object') return false;
    if (Array.isArray(v)) return false;
    return Object.values(v).every(
      (x) => typeof x !== 'function' && (typeof x !== 'object' || x === null || isPlainData(x))
    );
  }

  function callGlobal(name, args, { convertResult = true } = {}) {
    lua_getglobal(L, to_luastring(name));
    if (lua_type(L, -1) !== LUA_TFUNCTION) {
      lua_settop(L, 0);
      throw new Error(`Fonction ${name} introuvable`);
    }

    args.forEach((arg) => pushValue(arg));

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
    evalConsole(source) {
      return callGlobal('__ws_eval', [source]);
    },
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

  bindings.evalConsole = (src) => runtime.evalConsole(src);

  if (requiresBuildInfos) {
    bindings.buildInfos = (ghostCtx, pacmanCtx, map) =>
      runtime.callGlobal('buildInfos', [toLuaGhost(ghostCtx), toLuaPacman(pacmanCtx), toLuaMap(map)]);
  }

  return bindings;
}
