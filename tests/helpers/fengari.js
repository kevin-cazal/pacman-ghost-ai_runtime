import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

export function loadFengari() {
  if (globalThis.fengari) {
    return;
  }

  globalThis.window = globalThis;
  const source = readFileSync(join(root, 'lib/fengari/fengari-web.js'), 'utf8');
  // fengari-web is a browser bundle that expects `window`
  // eslint-disable-next-line no-eval
  eval(source);
}
