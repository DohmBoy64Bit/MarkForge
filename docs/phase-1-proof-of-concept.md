# Phase 1 Proof of Concept

Date: 2026-06-21

Phase 1 validates the Tauri-first desktop stack from `docs/adr/0001-desktop-stack.md` with a Windows x64 build.

## Implemented

- Tauri v2 desktop shell under `apps/editor`.
- React/Vite frontend with a three-pane editor layout.
- Sanitized Markdown preview through `packages/markdown-engine`.
- Local file open/save through Tauri commands and dialog plugin.
- Clipboard read/write smoke controls through Tauri clipboard plugin.
- Native application menu with accelerators for new, open, save, save as, copy Markdown, print, and fullscreen.
- File metadata polling to detect external changes to the opened file.
- Webview print path through `window.print()`.
- Windows NSIS bundle target.

## Verification

Commands run successfully:

```bash
pnpm build:editor
cargo check
pnpm tauri:build
```

Generated Windows installer:

```text
apps/editor/src-tauri/target/release/bundle/nsis/MarkForge_0.0.0_x64-setup.exe
```

## Notes

- The icon is a generated placeholder for Phase 1 only.
- File watching is currently implemented as metadata polling. A native watcher should replace it after platform service APIs settle.
- Print/PDF is a proof-of-concept webview print call, not the final export pipeline.
- Shortcut editing is not implemented yet; Phase 1 only validates native menu accelerators.
