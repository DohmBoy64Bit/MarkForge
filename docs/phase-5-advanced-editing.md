# Phase 5 Advanced Editing

Phase 5A starts MarkForge's advanced editing track by making source Markdown directly manipulable through compact commands while preserving the Phase 4 editor shell.

## Implemented in Phase 5A

- Typed editor command registry in `packages/editor-engine/src/commands.ts` with command id, label, icon key, group, optional shortcut, and execution behavior.
- Selection-aware transform helpers in `packages/editor-engine/src/editingTransforms.ts` for inline wraps, links, heading application, line prefixes, block wrappers, and block insertion.
- MarkForge-native formatting command rail grouped into Inline, Block, Insert, and Replace controls.
- Inline formatting commands for bold, italic, inline code, and links.
- Block commands for H1-H6, blockquote, unordered list, ordered list, task list, and code fence.
- Insert commands for horizontal rule and a compact starter table.
- Browser-level shortcuts for Ctrl+B, Ctrl+I, Ctrl+K, Ctrl+Shift+7, and Ctrl+Shift+8, scoped away from search and replace inputs.
- Replace-current and replace-all actions backed by the existing source search matches.
- Command feedback in the status bar plus an inspector command panel showing the last command and shortcut list.
- Phase 5C command palette opened from the toolbar or Ctrl+Shift+P, with grouped command search, keyboard navigation, empty state, shortcut badges, and execution through the existing source command path.
- Phase 5D Preferences dialog for local theme/default view choices and editable keybindings for the command palette plus existing editor commands.
- Phase 5E unsaved-work protection for dirty tab close/reload flows with Save, Discard, and Cancel decisions.
- Browser `beforeunload` protection whenever any open editor tab is dirty.
- Phase 5E external-change reconciliation built on metadata polling across open file-backed tabs, with changed/missing-on-disk notices, Reload from disk, Keep local, and clearer inspector status labels.
- Phase 5F reversible source formatting for inline wrappers, headings, quote/list/task-list prefixes, plus H4-H6, strikethrough, and duplicate selection/current-line command coverage.
- Phase 5F source search options for case-sensitive, whole-word, and regex matching, with shared match navigation and replace-current/replace-all behavior.
- Phase 5G quick insert opened from the toolbar or Ctrl+/ with searchable block/insert commands, keyboard navigation, Enter execution, Escape/backdrop close, and focus restoration.
- Phase 5G selection formatting overlay for non-empty source selections with bold, italic, inline code, strikethrough, and link commands.

## Selection Behavior

- Formatting commands operate on the current textarea selection when available.
- Empty selections insert useful fallback Markdown such as `**bold text**`, `[label](https://example.com)`, or a starter table.
- After a command runs, focus returns to the source textarea and the next useful selection is restored.
- Commands update the active document text through the editor app while the source transforms live in `packages/editor-engine`.
- When no match or no active search exists, replace actions report a status message instead of changing text.
- Command palette execution closes the overlay, applies the selected editor-engine command, and restores the useful textarea selection through the app's existing focus path.
- Quick insert execution follows the same editor-engine command path as the command rail and command palette.
- The source selection overlay appears only while the textarea owns a non-empty selection and hides for cleared selections, preview-only view, other overlays/dialogs, or missing active documents.
- Inline source commands toggle existing Markdown markers when the selected text includes the wrapper or the selected text is already surrounded by the wrapper.
- Heading commands cover H1-H6 and remove the matching heading marker when the selected line range already uses that level.
- Blockquote, unordered list, ordered list, and task list commands remove their prefixes when every selected line already has the target marker.

## Design Direction

The Phase 5 UI keeps the Phase 4 workbench structure: cool application chrome, warm source and preview surfaces, restrained teal accent, compact icon buttons, and dense inspector panels. The command rail sits between tabs and the editor workspace so Markdown editing feels close to the document, while the command palette, quick insert, selection overlay, and Preferences dialog add keyboard-first surfaces without changing the main workspace density.

## Phase 5E Reliability

Phase 5E adds the first reliability pass around local documents.

- Closing a dirty tab opens a compact dialog instead of discarding text immediately.
- Save closes only after a successful write; Save As keeps the tab open if the picker is canceled or the write fails.
- Discard closes the dirty tab, or reloads from disk for dirty reload confirmations.
- Cancel leaves tab state unchanged and restores focus.
- External-change watching now checks every open file-backed document rather than only the active file through the platform polling watcher abstraction.
- Missing files are distinguished from modified files in the tab, preview notice, and File Status inspector.
- Keep local clears the current external-change notice by adopting the latest observed metadata as the new baseline; a missing file stays quiet while still missing and alerts again if it reappears.

Phase 11 routes this workflow through native Tauri file-watch and close-request events. The package polling watcher and browser `beforeunload` guard remain fallback behavior.

## Phase 5F Source Editing Polish

Phase 5F makes source-mode editing behave more like a Markdown editor than a one-way inserter.

- Bold, italic, inline code, and strikethrough commands wrap selected text, insert useful fallback text for empty selections, and remove existing markers when toggled on already formatted text.
- Heading commands now cover H1-H6 and toggle the matching heading level off for selected lines.
- Blockquote, unordered list, ordered list, and task list commands toggle their line prefixes off when all selected lines already use that marker.
- Duplicate selection or line is registered as a source editing utility command with a default `Ctrl+D` shortcut.
- The command registry remains the source of truth for the toolbar, command palette, shortcut inspector, and preference restoration.
- Source search now has compact case-sensitive, whole-word, and regex option buttons. Invalid regex input reports a status/error state and disables replacement.
- Replace current and replace all share the same matcher/options as the match list. Regex mode supports capture-group replacement, while literal mode treats replacement text literally.

## Phase 5G Quick Insert and Selection Overlay

Phase 5G adds compact insertion and inline-format surfaces for source editing while keeping command execution centralized in `@markforge/editor-engine`.

- Quick insert is registered as the `app.quickInsert` preference action with a default `Ctrl+/` shortcut and a toolbar entry.
- The quick insert dialog filters block and insert commands, including H1-H6, blockquote, unordered list, ordered list, task list, code fence, horizontal rule, and table.
- Arrow keys, Home/End, Enter, Escape, backdrop click, and focus restoration follow the command palette interaction model.
- Filtering is backed by focused helper tests and searches command labels, groups, ids, shortcuts, and compact insertion hints.
- A floating selection toolbar appears near the source pane when the source textarea has a non-empty selection.
- Selection toolbar buttons expose accessible labels/titles and run bold, italic, inline code, strikethrough, and link through the existing app command path.
- The overlay avoids caret-coordinate math; it stays anchored near the source pane header and hides when another overlay/dialog is open or the source selection is no longer active.

## Phase 5B Extraction

Phase 5B moved the Phase 5A command registry and text transforms from `apps/editor` into `packages/editor-engine`. The React app still owns toolbar rendering, icon mapping, textarea focus restoration, and active-document state, but command behavior is now package-owned and covered by package-level tests.

## Phase 5C Command Palette

Phase 5C adds a compact command palette in `apps/editor` while keeping command behavior in `packages/editor-engine`.

- Palette command rows are derived from editor-engine command metadata and app-side group labels.
- Search matches command labels, groups, shortcuts, and ids.
- Arrow keys move the active row, Enter executes it, Escape closes the overlay, and Tab stays inside the dialog.
- Ctrl+Shift+P opens the palette from the editor or command surface, while search and replace inputs keep their normal typing behavior.
- The inspector shortcut list now includes the Command Palette entry as the first keybinding foundation step.

## Phase 5D Preferences and Keybindings

Phase 5D adds a compact Preferences dialog and moves existing editor shortcut dispatch onto a local preference-backed registry.

- Preferences opens from the top command rail and closes by close button, backdrop click, or Escape.
- General preferences update the existing light/dark theme and source/split/preview default view mode state.
- Keybinding rows cover the command palette and every current editor-engine source command, including command id, group, editable shortcut string, per-command reset, and reset all.
- Blank shortcut values are treated as unassigned and do not trigger.
- Duplicate non-empty shortcuts are shown as conflicts. Runtime dispatch is deterministic for now: the first action in the keybinding registry wins.
- Toolbar titles, command palette badges, and the inspector shortcut list use current preference values.
- The existing `markforge.editor.prefs.v1` localStorage key remains compatible with legacy `{ theme, viewMode }` records and now restores a versioned keybinding shape.

## Deferred

- Rich WYSIWYG/realtime editing behavior.
- Full preferences schema beyond the Phase 5D local editor settings foundation.
- Non-format command remapping and platform-native/global shortcut registration.
- Advanced table editing, image insertion/editing tools, autocomplete, linting, formatter integration, focus mode, typewriter mode, and distraction-free layouts.
- Richer line transformer menus beyond the duplicate command.
- Workspace/folder watching beyond open-file native watch events.

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
