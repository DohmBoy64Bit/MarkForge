# MarkForge Editor

Phase 1 Tauri proof-of-concept for the Windows-first desktop editor shell.

## Commands

```bash
pnpm --filter @markforge/editor dev
pnpm --filter @markforge/editor build
pnpm --filter @markforge/editor tauri dev
pnpm --filter @markforge/editor tauri build
```

## Phase 1 Scope

- Open and save local Markdown files through Tauri-backed platform services.
- Render sanitized Markdown preview through `packages/markdown-engine`.
- Exercise clipboard read/write for Markdown text.
- Exercise native menu events and keyboard accelerators.
- Exercise print through the webview.
- Poll file metadata to detect external file changes.
