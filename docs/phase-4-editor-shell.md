# Phase 4 Editor Shell

Phase 4 turns the editor from a single-document proof-of-concept into a compact local document workbench.

## Implemented Foundation

- Multi-document tab state with an active document, per-document path, saved snapshot, file metadata, and external-change flag.
- File actions for new, open, save, save as, copy Markdown, clipboard check, and print.
- Native `markforge://menu` handling for the Phase 1 menu commands, including graceful status reporting for unsupported commands.
- Source, split, and preview view modes with persisted preference state.
- Shared `@markforge/markdown-engine` rendering with a safe fallback path if rendering throws.
- Source search with match count, line list, and textarea selection jump.
- Right inspector for file status, search, outline, recent files, front matter, render warnings, clipboard status, and external-change state.
- LocalStorage-backed session restore for unsaved or dirty tabs, recent file paths, theme, and view mode.
- Compact status bar with save state, file label, line count, word count, character count, warning count, and command status.
- Light/dark MarkForge-native theme tokens aligned with the viewer shell.

## Design Direction

The shell uses a workspace-first layout: command rail, tab strip, source/preview workbench, right inspector, and status bar. It keeps the viewer family's cool chrome, warm preview surface, and restrained teal accent while giving the editor denser controls and clearer document state.

## Phase-era Deferred Items

This section is a historical Phase 4 record. Some items below were superseded by later Phase 5 implementation; use [Implementation roadmap](implementation-roadmap.md) and [Phase 5 advanced editing](phase-5-advanced-editing.md) for current status.

- Prompt-before-close for dirty tabs was superseded by Phase 5E dirty-tab close/reload protection and browser `beforeunload` guarding; Phase 11 adds native Tauri close-request interception through the same Save/Discard/Cancel flow.
- Phase 5A superseded the initial command registry and source formatting rail deferral.
- Command palette UI and the user-editable keybinding preference model were superseded by Phase 5C and Phase 5D.
- Real filesystem watching beyond active-file metadata polling.
- Rich WYSIWYG/realtime editing, toggle-aware formatting, and advanced Markdown editing tools.
- Search highlighting inside rendered preview.
- Export workflows and theme-engine package integration.

## Verification

Use these commands from the repository root:

```bash
pnpm --filter @markforge/editor build
pnpm test
pnpm docs:check
```

If the Rust toolchain is available, also run:

```bash
cargo check
```

from `apps/editor/src-tauri`.
