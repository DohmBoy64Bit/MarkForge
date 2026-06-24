# MarkForge Editor

Tauri editor shell for the Windows-first local Markdown workspace, currently covering Phase 12A-plus source/rich editing and post-Phase-12A remediation scope.

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
- Source, rich, split, and preview view modes.
- CodeMirror 6-backed Markdown source editor with line numbers, history, Markdown syntax highlighting, bracket matching, active-line highlighting, line wrapping, and package-compatible selection handling.
- ProseMirror-backed rich Markdown editor mode with Markdown parse/serialize bridging and shared document state.
- Sanitized preview rendering through the editor-facing `@markforge/editor-engine` preview API.
- Source search through `@markforge/editor-engine`, with match counts, match navigation, case-sensitive/whole-word/regex options, replace current, and replace all.
- Typed Markdown command registry for source-mode editing commands.
- Formatting command rail for reversible bold, italic, inline code, strikethrough, link, H1-H6, blockquote, unordered list, ordered list, task list, code fence, horizontal rule, table scaffold, table row/column tooling, table alignment, image insertion/update, delete selection/current-line, duplicate selection/current-line, and Markdown formatting.
- Preference-backed keyboard shortcuts for Ctrl+B, Ctrl+I, Ctrl+K, Ctrl+D, Ctrl+Shift+7, Ctrl+Shift+8, quick insert, and the command palette when focus is in the editor or command surface.
- Command palette opened by the toolbar or the configured shortcut, with searchable command metadata, grouped results, keyboard navigation, shortcut badges, empty state, and execution through the shared editor-engine commands.
- Quick insert opened by the toolbar or Ctrl+/, with searchable block/insert commands, keyboard navigation, Escape/backdrop close, focus restoration, and execution through the same editor-engine command path.
- Templates and help dialog opened by the toolbar or Ctrl+Alt+T, with searchable typed templates from `@markforge/editor-engine`, guided variable fields, live resolved preview, insertion into the active source document, local custom-template create/delete/reset behavior, and a compact Markdown syntax reference.
- Source suggestions for line-leading `/template` and `/tpl` template triggers, general Markdown slash autocomplete for headings, links, images, tables, front matter, code fences, task lists, and blockquotes, plus workspace-backed link/image path completion.
- Converter-backed Export HTML writes the active Markdown document to a selected `.html` file through `@markforge/converters` and `@markforge/platform`.
- Converter-backed Export PDF and Export DOCX write binary `.pdf` and `.docx` files through `@markforge/converters` and `@markforge/platform`.
- Converter-backed Import Conversion accepts supported HTML and CSV source input, then inserts converted Markdown by selection, cursor, or append mode.
- Converter-backed Import Conversion also accepts rich clipboard HTML, HTTP(S) URL/article input, DOCX files, PDF text, and OCR image input through supported package converters.
- Converter-backed Clean Markdown normalizes whitespace in the active document through the same source document update path as other editing actions.
- Local AI dialog for loopback providers only, with disabled-by-default enablement, persisted provider/endpoint/model profiles, summarize/improve/outline/explain/format/draft/table/headings actions, selection/document source controls, prompt preview, streamed result output when available, running/error states, and explicit result insertion.
- Selection formatting overlay for non-empty source selections with bold, italic, inline code, strikethrough, and link buttons.
- Preferences dialog for package-backed Light, Dark, Sepia Paper, High Contrast, GitHub, and Modern Neutral themes, default view mode, editable source command keybindings, per-command reset, reset all, and duplicate shortcut conflict display.
- Prompted close/reload protection for dirty tabs with Save, Discard, and Cancel decisions.
- Native Tauri close-request protection plus browser `beforeunload` fallback when any open document has unsaved edits.
- Native file watching across open file-backed tabs, with package polling fallback support and changed-on-disk/missing-on-disk reconciliation notices.
- Workspace panel for opening a folder, indexing Markdown/text files, filtering file paths, searching across file contents, opening results, and refreshing from native workspace watch events.
- Workspace `.markforge/templates/*.md` files are loaded into the template/help and `/template` suggestion flows.
- Windows shell recent-document updates are attempted through the platform service when files are opened or saved.
- Reload from disk and Keep local actions for external changes, including dirty-document confirmation before replacing local edits.
- Inspector panels for file state, command status, converter activity history, search, outline, recent files, front matter, warnings, clipboard state, and external-change state.
- LocalStorage-backed restore for unsaved/dirty tabs, recent file paths, theme, view mode, editor keybindings, and editor-local custom templates.
- Light, Dark, Sepia Paper, High Contrast, GitHub, and Modern Neutral MarkForge-native workspace themes backed by `@markforge/theme-engine` app variables.
- Compact status bar with file, save, line, word, character, and warning counts.
- Compact status bar shows Local AI off/open/running state.
- Windows installer declares `.md`, `.markdown`, `.mdown`, and `.txt` file associations and startup file arguments load through the existing document-open path.

## Deferred

- Broader rich editing fixture coverage and parity-specific rich behavior beyond the current ProseMirror Markdown bridge.
- Advanced table editing beyond current source row/column/alignment helpers.
- Richer line transform menus beyond delete/duplicate.
- Syncable template libraries beyond editor-local and workspace `.markforge/templates/*.md` templates.
- Full preference schema beyond the Phase 5D local editor settings foundation.
- Provider model discovery and richer Local AI workflows beyond the current local profile/streaming/action set.
- Code signing, auto-update publishing, richer native spellcheck providers, and Linux installer artifacts.
