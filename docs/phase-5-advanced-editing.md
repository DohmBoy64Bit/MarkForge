# Phase 5 Advanced Editing

Phase 5A starts MarkForge's advanced editing track by making source Markdown directly manipulable through compact commands while preserving the Phase 4 editor shell.

## Implemented in Phase 5A

- Typed editor command registry in `apps/editor/src/ui/commands.ts` with command id, label, icon, group, optional shortcut, and execution behavior.
- Selection-aware transform helpers in `apps/editor/src/ui/editingTransforms.ts` for inline wraps, links, heading application, line prefixes, block wrappers, and block insertion.
- MarkForge-native formatting command rail grouped into Inline, Block, Insert, and Replace controls.
- Inline formatting commands for bold, italic, inline code, and links.
- Block commands for H1/H2/H3, blockquote, unordered list, ordered list, task list, and code fence.
- Insert commands for horizontal rule and a compact starter table.
- Browser-level shortcuts for Ctrl+B, Ctrl+I, Ctrl+K, Ctrl+Shift+7, and Ctrl+Shift+8, scoped away from search and replace inputs.
- Replace-current and replace-all actions backed by the existing source search matches.
- Command feedback in the status bar plus an inspector command panel showing the last command and shortcut list.

## Selection Behavior

- Formatting commands operate on the current textarea selection when available.
- Empty selections insert useful fallback Markdown such as `**bold text**`, `[label](https://example.com)`, or a starter table.
- After a command runs, focus returns to the source textarea and the next useful selection is restored.
- Commands update the active document text and clear the external-change flag so dirty state follows the existing saved-text snapshot model.
- When no match or no active search exists, replace actions report a status message instead of changing text.

## Design Direction

The Phase 5A UI keeps the Phase 4 workbench structure: cool application chrome, warm source and preview surfaces, restrained teal accent, compact icon buttons, and dense inspector panels. The command rail sits between tabs and the editor workspace so Markdown editing feels close to the document, not buried in menus.

## Deferred

- Rich WYSIWYG/realtime editing behavior.
- Command palette and user-editable keybinding preferences.
- Toggle-aware formatting that removes existing Markdown markers.
- Regex, case-sensitive, whole-word, and capture-group replace modes.
- Advanced table editing, image insertion/editing tools, autocomplete, linting, formatter integration, focus mode, typewriter mode, and distraction-free layouts.
- Prompt-before-close for unsaved documents and real filesystem watching.

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
