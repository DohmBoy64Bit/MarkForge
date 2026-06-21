# MarkForge Editor

Phase 5A Tauri editor shell for the Windows-first local Markdown workspace.

## Commands

```bash
pnpm --filter @markforge/editor dev
pnpm --filter @markforge/editor build
pnpm --filter @markforge/editor tauri dev
pnpm --filter @markforge/editor tauri build
```

## Current Scope

- Tabbed Markdown document foundation with per-tab dirty state.
- New, open, save, save as, copy Markdown, clipboard check, and print actions.
- Source, split, and preview view modes.
- Sanitized preview rendering through `@markforge/markdown-engine`.
- Source search with match counts, match navigation, replace current, and replace all.
- Typed Markdown command registry for source-mode editing commands.
- Formatting command rail for bold, italic, inline code, link, H1/H2/H3, blockquote, unordered list, ordered list, task list, code fence, horizontal rule, and table scaffold.
- Keyboard shortcuts for Ctrl+B, Ctrl+I, Ctrl+K, Ctrl+Shift+7, and Ctrl+Shift+8 when focus is in the editor or command surface.
- Inspector panels for file state, command status, search, outline, recent files, front matter, warnings, clipboard state, and external-change state.
- LocalStorage-backed restore for unsaved/dirty tabs, recent file paths, theme, and view mode.
- Light and dark MarkForge-native workspace themes.
- Compact status bar with file, save, line, word, character, and warning counts.

## Deferred

- Real file watching beyond metadata polling.
- Prompted tab close behavior for unsaved documents.
- Keybinding preferences and a command palette.
- Rich WYSIWYG/realtime editing.
- Table editing beyond starter scaffold insertion.
- Regex/case-sensitive replace options.
- Full preference schema.
