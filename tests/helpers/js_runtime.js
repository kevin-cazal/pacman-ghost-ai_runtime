import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function compileJsStudentCode(source) {
  const dir = mkdtempSync(join(tmpdir(), 'pacman-js-ai-'));
  const file = join(dir, 'student.mjs');
  writeFileSync(file, source, 'utf8');

  const module = await import(pathToFileURL(file).href);

  if (typeof module.chooseDirection !== 'function') {
    throw new Error('Export chooseDirection manquant');
  }
  if (typeof module.updateState !== 'function') {
    throw new Error('Export updateState manquant');
  }

  return {
    buildInfos: typeof module.buildInfos === 'function' ? module.buildInfos : null,
    chooseDirection: module.chooseDirection,
    updateState: module.updateState,
  };
}
