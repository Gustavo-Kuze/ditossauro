#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

python3 -m venv "$ROOT_DIR/.venv"
source "$ROOT_DIR/.venv/bin/activate"
pip install --upgrade pip
pip install -r "$ROOT_DIR/backend/requirements.txt"

pushd "$ROOT_DIR" >/dev/null
npm install
popd >/dev/null

pushd "$ROOT_DIR/frontend" >/dev/null
npm install
popd >/dev/null

npm run tauri:dev

