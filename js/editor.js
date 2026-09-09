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

          // ---------------------------------------------------------------
          // Rien n'apparaît que l'élève n'ait tapé.
          //
          // Les automatismes de Monaco font gagner du temps à qui sait déjà ce
          // qu'il écrit. Pour un débutant ils font l'inverse : du texte arrive
          // sans geste correspondant, et l'erreur qui suit ne se relie à rien
          // de ce qu'il a fait. Tout ce qui insère ou réécrit du texte est donc
          // coupé ici ; ce qui ne fait qu'afficher (coloration, numéros de
          // ligne, repli) reste.
          // ---------------------------------------------------------------

          // Fermeture des paires : « print('bonjour » devenait
          // « print('bonjour') », puis une paire de trop dès que l'élève tapait
          // la sienne. Les facettes qui effacent ou survolent le caractère
          // ajouté surprennent autant, d'où les six.
          autoClosingBrackets: 'never',
          autoClosingQuotes: 'never',
          autoClosingComments: 'never',
          autoClosingDelete: 'never',
          autoClosingOvertype: 'never',
          autoSurround: 'never',

          // Suggestions. Le piège principal : la liste s'ouvre pendant la
          // frappe, et Entrée valide la suggestion au lieu d'aller à la ligne.
          // L'élève croit avoir fait un retour chariot, il a écrit un mot.
          quickSuggestions: false,
          suggestOnTriggerCharacters: false,
          acceptSuggestionOnEnter: 'off',
          acceptSuggestionOnCommitCharacter: false,
          wordBasedSuggestions: 'off',
          snippetSuggestions: 'none',
          tabCompletion: 'off',
          inlineSuggest: { enabled: false },
          parameterHints: { enabled: false },

          // Actions proposées et reformatage : ils réécrivent du code déjà tapé.
          codeLens: false,
          lightbulb: { enabled: false },
          formatOnType: false,
          formatOnPaste: false,

          // L'indentation suit la ligne précédente, sans jamais réaligner une
          // ligne déjà écrite : « keep » et non « full », qui décale le `end`
          // tout seul au moment où on le tape.
          autoIndent: 'keep',

          // Déplacer du code en le glissant à la souris se fait sans s'en
          // apercevoir, et ressemble à une disparition.
          dragAndDrop: false,
        });
        resolve(editor);
      },
      (err) => reject(new Error(`Monaco failed to load: ${err}`))
    );
  });
}
