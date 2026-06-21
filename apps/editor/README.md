# MarkForge Editor

Phase 4 Tauri editor shell for the Windows-first local Markdown workspace.

## Commands

```bash
pnpm --filter @markforge/editor dev
pnpm --filter @markforge/editor build
pnpm --filter @markforge/editor tauri dev
pnpm --filter @markforge/editor tauri build
```

## Phase 4 Scope

- Tabbed Markdown document foundation with per-tab dirty state.
- New, open, save, save as, copy Markdown, clipboard check, and print actions.
- Source, split, and preview view modes.
- Sanitized preview rendering through `@markforge/markdown-engine`.
- Source search with match counts and match navigation.
- Inspector panels for file state, search, outline, recent files, front matter, warnings, clipboard state, and external-change state.
- LocalStorage-backed restore for unsaved/dirty tabs, recent file paths, theme, and view mode.
- Light and dark MarkForge-native workspace themes.
- Compact status bar with file, save, line, word, character, and warning counts.

## Deferred

- Real file watching beyond metadata polling.
- Prompted tab close behavior for unsaved documents.
- Rich editor commands, formatting actions, and WYSIWYG/realtime editing.
- Full command registry and preference schema.
