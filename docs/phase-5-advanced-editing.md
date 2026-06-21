# Phase 5 Advanced Editing

Phase 5A starts MarkForge's advanced editing track by making source Markdown directly manipulable through compact commands while preserving the Phase 4 editor shell.

## Implemented in Phase 5A

- Typed editor command registry in `packages/editor-engine/src/commands.ts` with command id, label, icon key, group, optional shortcut, and execution behavior.
- Selection-aware transform helpers in `packages/editor-engine/src/editingTransforms.ts` for inline wraps, links, heading application, line prefixes, block wrappers, and block insertion.
- MarkForge-native formatting command rail grouped into Inline, Block, Insert, and Replace controls.
- Inline formatting commands for bold, italic, inline code, and links.
- Block commands for H1/H2/H3, blockquote, unordered list, ordered list, task list, and code fence.
- Insert commands for horizontal rule and a compact starter table.
- Browser-level shortcuts for Ctrl+B, Ctrl+I, Ctrl+K, Ctrl+Shift+7, and Ctrl+Shift+8, scoped away from search and replace inputs.
- Replace-current and replace-all actions backed by the existing source search matches.
- Command feedback in the status bar plus an inspector command panel showing the last command and shortcut list.
- Phase 5C command palette opened from the toolbar or Ctrl+Shift+P, with grouped command search, keyboard navigation, empty state, shortcut badges, and execution through the existing source command path.

## Selection Behavior

- Formatting commands operate on the current textarea selection when available.
- Empty selections insert useful fallback Markdown such as `**bold text**`, `[label](https://example.com)`, or a starter table.
- After a command runs, focus returns to the source textarea and the next useful selection is restored.
- Commands update the active document text through the editor app while the source transforms live in `packages/editor-engine`.
- When no match or no active search exists, replace actions report a status message instead of changing text.
- Command palette execution closes the overlay, applies the selected editor-engine command, and restores the useful textarea selection through the app's existing focus path.

## Design Direction

The Phase 5 UI keeps the Phase 4 workbench structure: cool application chrome, warm source and preview surfaces, restrained teal accent, compact icon buttons, and dense inspector panels. The command rail sits between tabs and the editor workspace so Markdown editing feels close to the document, while the command palette adds a fast keyboard-first overlay without changing the main workspace density.

## Deferred

- Rich WYSIWYG/realtime editing behavior.
- User-editable keybinding preferences.
- Toggle-aware formatting that removes existing Markdown markers.
- Regex, case-sensitive, whole-word, and capture-group replace modes.
- Advanced table editing, image insertion/editing tools, autocomplete, linting, formatter integration, focus mode, typewriter mode, and distraction-free layouts.
- Prompt-before-close for unsaved documents and real filesystem watching.

## Phase 5B Extraction

Phase 5B moved the Phase 5A command registry and text transforms from `apps/editor` into `packages/editor-engine`. The React app still owns toolbar rendering, icon mapping, textarea focus restoration, and active-document state, but command behavior is now package-owned and covered by package-level tests.

## Phase 5C Command Palette

Phase 5C adds a compact command palette in `apps/editor` while keeping command behavior in `packages/editor-engine`.

- Palette command rows are derived from editor-engine command metadata and app-side group labels.
- Search matches command labels, groups, shortcuts, and ids.
- Arrow keys move the active row, Enter executes it, Escape closes the overlay, and Tab stays inside the dialog.
- Ctrl+Shift+P opens the palette from the editor or command surface, while search and replace inputs keep their normal typing behavior.
- The inspector shortcut list now includes the Command Palette entry as the first keybinding foundation step.

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
