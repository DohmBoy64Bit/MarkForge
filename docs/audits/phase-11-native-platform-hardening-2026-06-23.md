# Phase 11 Native Platform Hardening Audit - 2026-06-23

## Scope

This audit covers Phase 11 native platform hardening after release hardening Milestone 5. It verifies native open-file watcher wiring, native editor close-request protection, package fallback behavior, and the current Linux smoke blocker.

## Code Changes Audited

- `apps/editor/src-tauri/src/lib.rs`
- `apps/viewer/src-tauri/src/lib.rs`
- `apps/editor/src-tauri/Cargo.toml`
- `apps/viewer/src-tauri/Cargo.toml`
- `apps/editor/src/ui/App.tsx`
- `apps/viewer/src/ui/App.tsx`
- `packages/platform/src/index.ts`
- `packages/platform/src/index.spec.ts`

## Findings

| Area | Status | Evidence |
| --- | --- | --- |
| Native open-file watching | Implemented. | Editor/viewer Rust shells own `notify` watchers and emit `markforge://file-watch`. |
| Watcher package boundary | Implemented. | `packages/platform` exposes native watcher adapter support and keeps polling fallback. |
| Native close interception | Implemented for editor dirty documents. | Editor wires Tauri `onCloseRequested` through `packages/platform.lifecycle.protectClose`. |
| Close fallback | Preserved. | Browser `beforeunload` guard remains active when dirty documents exist. |
| Viewer close protection | Not required. | Viewer has no editable dirty-document state. |
| Linux artifact smoke | Blocked by host prerequisites. | `pnpm linux:smoke` through WSL still fails before repository checks. |

## Validation Evidence

Successful commands:

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

Observed test result:

- `pnpm test`: 20 files passed, 128 tests passed.

Observed build result:

- Editor build passed with largest JavaScript asset below the 500 KiB bundle budget.
- Viewer build passed with largest JavaScript asset below the 500 KiB bundle budget.
- Editor Tauri build produced `apps/editor/src-tauri/target/release/bundle/nsis/MarkForge_0.0.0_x64-setup.exe`.
- Viewer Tauri build produced `apps/viewer/src-tauri/target/release/bundle/nsis/MarkForge Viewer_0.0.0_x64-setup.exe`.

Linux smoke rerun result:

- Missing native Linux `node`.
- Windows Corepack shim found instead of native Linux Corepack.
- Missing native `cargo`.
- Missing native `rustc`.
- Missing `webkit2gtk-4.1`.
- Missing `javascriptcoregtk-4.1`.

## Remaining Deferred Work

- Workspace/folder watching.
- Shell recent documents.
- Spellcheck.
- Auto-update publishing/signing.
- Linux artifact smoke after prerequisites are installed.

## Final Assessment

Phase 11 removes the previous native open-file watch and native close-interception debt for the editor/viewer baseline without removing fallback guards. The remaining platform work is broader OS integration or Linux host readiness, not the open-file watcher/dirty-close gap tracked by the previous release hardening audit.
