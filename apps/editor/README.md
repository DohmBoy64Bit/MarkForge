# MarkForge Editor

Phase 10-complete Tauri editor shell for the Windows-first local Markdown workspace.

## Commands

```bash
pnpm --filter @markforge/editor dev
pnpm --filter @markforge/editor build
pnpm --filter @markforge/editor tauri dev
pnpm --filter @markforge/editor tauri build
```

## Current Scope

- Tabbed Markdown document foundation with per-tab dirty state.
- New, open, save, save as, Export HTML, Import Conversion, Clean Markdown, Local AI, copy Markdown, clipboard check, and print actions.
- Source, split, and preview view modes.
- Sanitized preview rendering through `@markforge/markdown-engine`.
- Source search with match counts, match navigation, case-sensitive/whole-word/regex options, replace current, and replace all.
- Typed Markdown command registry for source-mode editing commands.
- Formatting command rail for reversible bold, italic, inline code, strikethrough, link, H1-H6, blockquote, unordered list, ordered list, task list, code fence, horizontal rule, table scaffold, and duplicate selection/current-line.
- Preference-backed keyboard shortcuts for Ctrl+B, Ctrl+I, Ctrl+K, Ctrl+D, Ctrl+Shift+7, Ctrl+Shift+8, quick insert, and the command palette when focus is in the editor or command surface.
- Command palette opened by the toolbar or the configured shortcut, with searchable command metadata, grouped results, keyboard navigation, shortcut badges, empty state, and execution through the shared editor-engine commands.
- Quick insert opened by the toolbar or Ctrl+/, with searchable block/insert commands, keyboard navigation, Escape/backdrop close, focus restoration, and execution through the same editor-engine command path.
- Templates and help dialog opened by the toolbar or Ctrl+Alt+T, with searchable typed templates from `@markforge/templates`, guided variable fields, live resolved preview, insertion into the active source document, local custom-template create/delete/reset behavior, and a compact Markdown syntax reference.
- Source template suggestions for line-leading `/template` and `/tpl` triggers, with filtering, Arrow key navigation, Enter insertion through the shared template resolver, and Escape close.
- Converter-backed Export HTML writes the active Markdown document to a selected `.html` file through `@markforge/converters` and `@markforge/platform`.
- Converter-backed Import Conversion accepts supported HTML and CSV source input, then inserts converted Markdown by selection, cursor, or append mode.
- Converter-backed Clean Markdown normalizes whitespace in the active document through the same source document update path as other editing actions.
- Local AI dialog for loopback providers only, with disabled-by-default enablement, provider/endpoint/model configuration, summarize/improve/outline/explain actions, selection/document source controls, prompt preview, result output, running/error states, and explicit result insertion.
- Selection formatting overlay for non-empty source selections with bold, italic, inline code, strikethrough, and link buttons.
- Preferences dialog for package-backed Light, Dark, Sepia Paper, High Contrast, GitHub, and Modern Neutral themes, default view mode, editable source command keybindings, per-command reset, reset all, and duplicate shortcut conflict display.
- Prompted close/reload protection for dirty tabs with Save, Discard, and Cancel decisions.
- Browser `beforeunload` protection when any open document has unsaved edits.
- Metadata polling across open file-backed tabs, with changed-on-disk and missing-on-disk reconciliation notices.
- Reload from disk and Keep local actions for external changes, including dirty-document confirmation before replacing local edits.
- Inspector panels for file state, command status, converter activity history, search, outline, recent files, front matter, warnings, clipboard state, and external-change state.
- LocalStorage-backed restore for unsaved/dirty tabs, recent file paths, theme, view mode, editor keybindings, and editor-local custom templates.
- Light, Dark, Sepia Paper, High Contrast, GitHub, and Modern Neutral MarkForge-native workspace themes backed by `@markforge/theme-engine` app variables.
- Compact status bar with file, save, line, word, character, and warning counts.
- Compact status bar shows Local AI off/open/running state.

## Deferred

- Native file watching beyond metadata polling.
- Native Tauri window-close interception before process exit.
- Rich WYSIWYG/realtime editing.
- Table editing beyond starter scaffold insertion.
- Richer line transform menus.
- Filesystem/workspace template loading and syncable template libraries beyond editor-local custom templates.
- General Markdown autocomplete beyond the Phase 6B template suggestion foundation.
- Full preference schema beyond the Phase 5D local editor settings foundation.
- DOCX, native PDF, OCR, URL/article, and rich clipboard converter UI beyond explicit unsupported package boundaries.
- Streaming Local AI output, provider model discovery, persisted Local AI settings, and additional prompt actions.
- Code signing, auto-update publishing, file associations, shell recent documents, and Linux installer artifacts.
