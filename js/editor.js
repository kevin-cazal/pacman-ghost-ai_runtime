// NE PAS MODIFIER — code de base de l'atelier

const VS = 'lib/monaco/vs';

window.MonacoEnvironment = {
  getWorkerUrl(workerId, label) {
    if (label === 'json') {
      return `${VS}/language/json/json.worker.js`;
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return `${VS}/language/css/css.worker.js`;
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return `${VS}/language/html/html.worker.js`;
    }
    if (label === 'typescript' || label === 'javascript') {
      return `${VS}/language/typescript/ts.worker.js`;
    }
    return `${VS}/editor/editor.worker.js`;
  },
};

export function initEditor(host) {
  return new Promise((resolve, reject) => {
    if (typeof require === 'undefined') {
      reject(new Error('Monaco loader.js not loaded — run ./scripts/setup-monaco.sh'));
      return;
    }

    require.config({ paths: { vs: VS } });
    require(
      ['vs/editor/editor.main'],
      () => {
        const editor = monaco.editor.create(host, {
          language: 'lua',
          theme: 'vs-dark',
          automaticLayout: true,
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: 'on',
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          tabSize: 2,
          insertSpaces: true,
          folding: true,
        });
        resolve(editor);
      },
      (err) => reject(new Error(`Monaco failed to load: ${err}`))
    );
  });
}
