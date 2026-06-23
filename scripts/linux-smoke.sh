#!/usr/bin/env bash
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 1

failures=0

record_failure() {
  echo "FAIL: $1"
  failures=$((failures + 1))
}

require_command() {
  local name="$1"
  if command -v "$name" >/dev/null 2>&1; then
    local resolved
    resolved="$(command -v "$name")"
    if [[ "$resolved" == /mnt/c/* || "$resolved" == *.exe ]]; then
      record_failure "$name must be a native Linux command, found Windows path: $resolved"
    else
      echo "OK: $name=$resolved"
    fi
  else
    record_failure "missing command: $name"
  fi
}

require_pkg_config() {
  local name="$1"
  if pkg-config --exists "$name" 2>/dev/null; then
    echo "OK: $name=$(pkg-config --modversion "$name")"
  else
    record_failure "missing pkg-config package: $name"
  fi
}

echo "MarkForge Linux smoke"
echo "kernel=$(uname -srmo)"

if [[ "$(uname -s)" != "Linux" ]]; then
  record_failure "linux:smoke must run on Linux"
fi

require_command node
require_command corepack
require_command cargo
require_command rustc
require_command pkg-config

if command -v node >/dev/null 2>&1; then
  node -e "const major=Number(process.versions.node.split('.')[0]); if (major < 22) { console.error('FAIL: Node.js 22 or newer required, found ' + process.version); process.exit(1); } console.log('OK: node=' + process.version)" || failures=$((failures + 1))
fi

if command -v pkg-config >/dev/null 2>&1; then
  require_pkg_config gtk+-3.0
  require_pkg_config webkit2gtk-4.1
  require_pkg_config javascriptcoregtk-4.1
fi

if [[ "$failures" -gt 0 ]]; then
  echo "Linux smoke prerequisites failed with $failures issue(s)."
  exit 1
fi

corepack pnpm docs:check || exit 1
corepack pnpm test || exit 1
corepack pnpm build:editor || exit 1
corepack pnpm build:viewer || exit 1
corepack pnpm bundle:check || exit 1
corepack pnpm packaging:check || exit 1

cargo check --manifest-path apps/editor/src-tauri/Cargo.toml || exit 1
cargo check --manifest-path apps/viewer/src-tauri/Cargo.toml || exit 1

if [[ "${MARKFORGE_LINUX_BUNDLE:-0}" == "1" ]]; then
  corepack pnpm tauri:build || exit 1
  corepack pnpm tauri:viewer:build || exit 1
fi

echo "MarkForge Linux smoke passed."
