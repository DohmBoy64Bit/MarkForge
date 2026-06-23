# Phase 11 Native Platform Hardening

Date: 2026-06-23

Phase 11 hardens the platform boundary that later feature work depends on. The goal is to move open-file change detection and close interception into native Tauri paths while keeping package-owned APIs and fallback behavior.

## Implemented

- Added Rust `notify` dependency to the editor and viewer Tauri shells.
- Added `watch_text_file` and `unwatch_text_file` commands in both shells.
- Added Tauri-managed watcher state so watcher handles live on the Rust side until explicitly unwatched or app exit.
- Added `markforge://file-watch` events with `{ path, current, type }` payloads, where `current` matches the existing `FileInfo` contract.
- Added editor and viewer workspace listing, workspace search, recursive workspace watch, and `markforge://workspace-watch` events.
- Extended `packages/platform` with a native file watcher adapter contract.
- Extended `packages/platform` with workspace directory, workspace search, workspace watch, shell recent-document, spellcheck, and updater-status service contracts.
- Kept the existing polling watcher as a fallback when no native adapter is supplied.
- Wired editor and viewer to native watch commands through `packages/platform`.
- Wired the editor and viewer workspace panels to the platform workspace APIs.
- Wired editor file open/save paths to the platform shell recent-document service and added a Windows best-effort native recent-document command.
- Added `packages/platform` close-protection APIs.
- Wired editor Tauri `onCloseRequested` events into the existing unsaved-document Save/Discard/Cancel dialog flow.
- Preserved browser `beforeunload` as a fallback guard for webview/browser paths.

## Validation

Commands run successfully:

```bash
pnpm test
pnpm build:editor
pnpm build:viewer
pnpm bundle:check
pnpm packaging:check
pnpm docs:check
cargo check --manifest-path apps/editor/src-tauri/Cargo.toml
cargo check --manifest-path apps/viewer/src-tauri/Cargo.toml
pnpm tauri:build
pnpm tauri:viewer:build
```

Generated Windows installers:

```text
apps/editor/src-tauri/target/release/bundle/nsis/MarkForge_0.0.0_x64-setup.exe
apps/viewer/src-tauri/target/release/bundle/nsis/MarkForge Viewer_0.0.0_x64-setup.exe
```

Linux smoke was rerun through WSL and remains blocked by host prerequisites:

```bash
wsl.exe -d Ubuntu -- bash -lc "cd /mnt/c/Projects/MarkForge && bash scripts/linux-smoke.sh"
```

The script still reports missing native Linux `node`, native `cargo`, native `rustc`, `webkit2gtk-4.1`, `javascriptcoregtk-4.1`, and a Windows Corepack shim on PATH instead of native Linux Corepack.

## Remaining Release Work

- Native spellcheck provider adapters beyond browser/CodeMirror spellcheck attributes and the platform package contract.
- Auto-update publishing, signing keys, and release-channel hosting.
- Linux artifact build/launch smoke once native Linux prerequisites are available.
