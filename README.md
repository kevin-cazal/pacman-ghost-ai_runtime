> **Public snapshot — runtime `pacman`.**
> This repo is the version of [`kevin-cazal/pacman-ghost-ai_runtime`](https://github.com/kevin-cazal/pacman-ghost-ai_runtime) that is
> currently deployed by the workshop platform
> [CTFd_coding_platform](https://github.com/kevin-cazal/CTFd_coding_platform),
> taken at commit `00ffe3f`. History is not carried over: this is a snapshot, not a fork.
> Used by: [pacman-ghost-ai_subject](https://github.com/kevin-cazal/pacman-ghost-ai_subject).
>
> `docker pull ghcr.io/kevin-cazal/pacman-ghost-ai_runtime.src:latest` — the image is built
> and published by `.github/workflows/` on every push to `main`.

# Pac-Man Ghost AI — runtime

Le moteur de l'atelier « IA du fantôme de Pac-Man » : le jeu, l'éditeur de code, et le pont Lua
qui exécute le code de l'élève. Code élève en **Lua** (via Fengari), moteur de jeu en JavaScript.

**Ce dépôt ne contient pas les instructions de l'atelier.** Elles vivent dans
[pacman-ghost-ai_new](https://github.com/kevin-cazal/pacman-ghost-ai_new) et sont affichées par la
plateforme, à côté de ce runtime. Ce dépôt reste utilisable seul : il ouvre directement sur le jeu
et l'éditeur.

## Développement local

```bash
./scripts/setup-monaco.sh
./scripts/setup-fengari.sh
npm install
npx playwright install chromium
npm run test:all
```

Puis servir le dossier avec un serveur HTTP statique (les modules ES et le chargement du template
Lua nécessitent HTTP).

## Intégration dans une plateforme

Le runtime est monté dans une iframe de même origine et pilote un petit protocole postMessage
(WRP). Il n'a besoin d'aucun code spécifique pour cela : l'adaptateur est injecté par l'hôte. Le
code de l'élève est sauvegardé automatiquement dans `localStorage`, clé
`mini_pacman_ghost_ai_lua_v1`.
