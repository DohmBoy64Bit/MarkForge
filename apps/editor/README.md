# MarkForge Editor

Phase 5F Tauri editor shell for the Windows-first local Markdown workspace.

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
- Source search with match counts, match navigation, case-sensitive/whole-word/regex options, replace current, and replace all.
- Typed Markdown command registry for source-mode editing commands.
- Formatting command rail for reversible bold, italic, inline code, strikethrough, link, H1-H6, blockquote, unordered list, ordered list, task list, code fence, horizontal rule, table scaffold, and duplicate selection/current-line.
- Preference-backed keyboard shortcuts for Ctrl+B, Ctrl+I, Ctrl+K, Ctrl+D, Ctrl+Shift+7, Ctrl+Shift+8, and the command palette when focus is in the editor or command surface.
- Command palette opened by the toolbar or the configured shortcut, with searchable command metadata, grouped results, keyboard navigation, shortcut badges, empty state, and execution through the shared editor-engine commands.
- Preferences dialog for local theme, default view mode, editable source command keybindings, per-command reset, reset all, and duplicate shortcut conflict display.
- Prompted close/reload protection for dirty tabs with Save, Discard, and Cancel decisions.
- Browser `beforeunload` protection when any open document has unsaved edits.
- Metadata polling across open file-backed tabs, with changed-on-disk and missing-on-disk reconciliation notices.
- Reload from disk and Keep local actions for external changes, including dirty-document confirmation before replacing local edits.
- Inspector panels for file state, command status, search, outline, recent files, front matter, warnings, clipboard state, and external-change state.
- LocalStorage-backed restore for unsaved/dirty tabs, recent file paths, theme, view mode, and editor keybindings.
- Light and dark MarkForge-native workspace themes.
- Compact status bar with file, save, line, word, character, and warning counts.

## Deferred

- Native file watching beyond metadata polling.
- Native Tauri window-close interception before process exit.
- Rich WYSIWYG/realtime editing.
- Table editing beyond starter scaffold insertion.
- Quick insert, selection format overlay, and richer line transform menus.
- Full preference schema beyond the Phase 5D local editor settings foundation.
