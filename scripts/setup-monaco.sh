#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if command -v npm >/dev/null 2>&1; then
  npm install monaco-editor@0.45.0 --no-save
  rm -rf lib/monaco/vs
  mkdir -p lib/monaco
  cp -r node_modules/monaco-editor/min/vs lib/monaco/vs
  echo "==> Monaco installed to lib/monaco/vs"
elif [[ -d "$ROOT/../pacman.c/web/monaco/vs" ]]; then
  rm -rf lib/monaco/vs
  mkdir -p lib/monaco
  cp -a "$ROOT/../pacman.c/web/monaco/vs" lib/monaco/vs
  echo "==> Monaco copied from pacman.c"
else
  echo "error: npm not found and pacman.c monaco not available" >&2
  exit 1
fi
