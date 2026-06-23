# Release Hardening Final Drift Audit - 2026-06-22

Milestone: release hardening Milestone 5.

## Scope

This audit was run after the Milestone 5 cleanup slice. It checks the deferred/drift items touched in this pass, records current validation output, and states what still remains intentionally deferred.

## Implemented Cleanup

- Renderer chunk debt: editor and viewer Vite configs now split app, React, icon, and markdown/rendering chunks.
- Bundle gate: `scripts/bundle-check.mjs` now enforces a 500 KiB JavaScript asset ceiling for both editor and viewer emitted assets.
- Platform watcher ownership: editor and viewer now use `platform.watchFile(...)` for file-change detection instead of owning `window.setInterval` loops.
- Watcher behavior: `packages/platform` now avoids repeated missing-file events once a missing state has already been observed.
- Watcher coverage: `packages/platform/src/index.spec.ts` covers changed, missing, and disposed watcher behavior.
- Current-state docs: app READMEs, architecture, implementation roadmap, Phase 2, Phase 5, and platform README were updated for the watcher and bundle states.

## Validation

Fresh commands run successfully:

```bash
pnpm docs:check
pnpm packaging:check
pnpm bundle:check
pnpm test
pnpm build:editor
pnpm build:viewer
cargo check --manifest-path apps/editor/src-tauri/Cargo.toml
cargo check --manifest-path apps/viewer/src-tauri/Cargo.toml
```

Observed build assets:

- Editor largest JavaScript asset: `markdown-vendor-B5xMls8y.js`, 469.45 kB.
- Viewer largest JavaScript asset: `markdown-vendor-B5xMls8y.js`, 469.45 kB.
- No Vite chunk-size warning was emitted by either renderer build in this pass.

Observed test result:

- `pnpm test`: 20 files passed, 125 tests passed.

## Drift/Debt Status

| Area | Status after this pass | Evidence |
| --- | --- | --- |
| Vite chunk-size warning / TD-05 | Fixed for current build output. | Split chunks, 500 KiB bundle check, warning-free editor/viewer builds. |
| App-owned file-change timers / TD-01 | Reduced. Polling remains, but ownership moved into `packages/platform`. | App source calls `platform.watchFile`; direct `window.setInterval` remains only inside the platform fallback. |
| Native file watching | Completed by Phase 11 for opened files. | Rust `notify` watchers emit `markforge://file-watch`; `packages/platform` keeps polling fallback. |
| Native close interception | Completed by Phase 11 for editor dirty documents. | Tauri `onCloseRequested` routes through the existing Save/Discard/Cancel flow; browser `beforeunload` remains a fallback. |
| CodeMirror/WYSIWYG editor surface | CodeMirror source surface completed by Phase 12A; WYSIWYG remains deferred. | Editor uses a CodeMirror-backed source surface with package-backed source transforms. |
| Diagram rendering and conformance corpus | Deferred. | Markdown engine still emits explicit deferred diagram warnings. |
| Full native conversion/export stack | Deferred. | Current implementation supports browser print and sanitized HTML export/import/cleanup paths, not native PDF/DOCX/OCR/URL conversions. |
| Filesystem/workspace templates | Deferred. | Current templates are built-in plus local custom templates. |
| Linux artifact smoke | Blocked by host prerequisites. | See [Linux smoke - 2026-06-22](linux-smoke-2026-06-22.md). |

## Final Assessment

The release-hardening cleanup slice removed the active bundle warning debt and reduced watcher ownership drift without claiming native watcher support. Remaining deferred items are feature-scale work with explicit product or platform contracts still required before implementation.
