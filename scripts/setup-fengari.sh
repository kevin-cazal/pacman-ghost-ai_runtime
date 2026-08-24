#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

FENGARI_VERSION="0.1.4"
FENGARI_URL="https://github.com/fengari-lua/fengari-web/releases/download/v${FENGARI_VERSION}/fengari-web.js"

rm -rf lib/fengari
mkdir -p lib/fengari
curl -fsSL -o lib/fengari/fengari-web.js "$FENGARI_URL"
echo "==> Fengari ${FENGARI_VERSION} installed to lib/fengari/fengari-web.js"
