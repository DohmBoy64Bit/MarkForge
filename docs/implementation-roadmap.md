# Implementation Roadmap

## Phase 0: Governance and Evidence

- Initialize repository and package workspace.
- Generate MarkText audit bundle with repomixr.
- Maintain `docs/research/marktext-audit-snapshot.md`.
- Maintain `docs/marktext-parity-matrix.md`.
- Freeze architecture and stack ADR before implementation.

Exit criteria:

- Parity matrix has every audited MarkText feature with status.
- Product requirements, architecture, and stack ADR are accepted.

## Phase 1: Desktop Proof of Concept

- Create minimal Tauri app shell for Windows.
- Validate platform proof-of-concept gate in ADR 0001.
- Establish test runner, linting, type checking, and CI scripts.

Exit criteria:

- Windows x64 dev build runs.
- Platform service spike passes manual and automated smoke checks.
- Stack decision is confirmed or revised.

## Phase 2: Markdown Engine

- Implement parser/render facade.
- Add CommonMark and GFM fixtures.
- Add sanitization, TOC extraction, heading anchors, front matter, math extension, and code highlighting path.
- Add HTML export foundation.

Current status:

- Initial renderer contract, sanitization, front matter extraction, heading IDs, GFM-style task lists/tables/footnotes, KaTeX math, code highlighting, and renderer warnings are implemented.
- Full conformance fixtures, full YAML/TOML parsing, diagram rendering, and theme-integrated code highlighting remain open.

Exit criteria:

- Engine unit tests cover required syntax and XSS fixtures.
- Viewer can render static Markdown through the engine.

## Phase 3: Viewer

- Build standalone viewer shell.
- Add theme support, TOC sidebar, in-document search, copy code buttons, print/export, file watching, and display options.

Current status:

- Initial standalone viewer package is implemented with local file open/reload, sanitized rendering through `packages/markdown-engine`, metadata polling, front matter/warnings display, generated TOC, search-match list, copy source/rendered text, print, native menu wiring, and light/dark mode control.
- Real filesystem watching, rendered search highlighting, copy code buttons, export workflows, and full theme-engine integration remain open.

Exit criteria:

- Viewer opens local files, refreshes on change, and passes security tests.

## Phase 4: Editor Shell

- Build editor workspace shell, tabs, source mode, split preview, command registry, menus, preferences, recent files, and session restore.
- Add basic editing operations and source Markdown workflows.

Current status:

- Initial editor shell foundation is implemented with tabbed document state, per-tab dirty tracking, new/open/save/save-as/copy/clipboard-check/print actions, source/split/preview modes, source search, shared markdown preview rendering, inspector panels, localStorage session restore for unsaved or dirty tabs, recent file paths, light/dark preferences, native menu event handling, metadata polling for active-file external changes, and a compact document status bar.
- Phase 5A added the first typed source-mode command registry, Markdown formatting command rail, core formatting shortcuts, command status feedback, and replace-current/replace-all source search actions.
- Phase 5C added the first command palette foundation over the shared editor-engine command registry, including Ctrl+Shift+P, grouped search results, keyboard navigation, shortcut display, and execution through the source-mode command path.
- Phase 5D added a compact Preferences dialog for theme/default view selection and a local preference-backed keybinding foundation for the command palette plus existing editor commands, including editable shortcut strings, reset controls, duplicate conflict display, and deterministic first-registry-item shortcut dispatch.
- Phase 5E added dirty-tab close/reload protection, browser `beforeunload` guarding, all-open-file metadata polling, changed/missing-on-disk reconciliation notices, Keep local snoozing, and clearer inspector file status labels.
- Phase 5F added reversible source formatting, H1-H6 command coverage, strikethrough, duplicate selection/current-line, and compact source search options for case-sensitive, whole-word, and regex matching/replacement.
- Phase 5G added quick insert and a source selection formatting overlay, both backed by the existing editor-engine command registry and app command execution path.
- Phase 6A added a compact templates/help dialog, a preference-backed Templates and Help shortcut, and template insertion through the existing source document update path.
- Phase 6B added template variable metadata/editing, local custom templates in editor `localStorage`, and a bounded `/template`/`/tpl` source suggestion surface.
- Full preferences schema, non-format command remapping, native filesystem watching, native Tauri close interception, rendered-preview search highlighting, filesystem/workspace template loading, and rich/WYSIWYG editing remain open.

Exit criteria:

- Windows users can open, edit, save, search, and preview Markdown reliably.

## Phase 5: Advanced Editing

- Add WYSIWYG/realtime editing behavior.
- Add quick insert, format overlay, line transformer, table tools, image tools, autocomplete, linting, formatting, focus/typewriter/distraction-free modes.

Current status:

- Phase 5A source-mode advanced editing is implemented with selection-aware transforms for inline emphasis/code/link, heading application, blockquote/list/task-list prefixes, code fences, horizontal rules, and starter table insertion.
- Phase 5B moved the source command registry and text transforms into `packages/editor-engine` while keeping React-specific toolbar rendering in `apps/editor`.
- Phase 5C added a compact MarkForge-native command palette in the editor app, backed by the editor-engine command metadata and existing transform execution path.
- Phase 5D added the editor Preferences dialog and keybinding foundation, with preference-backed shortcut labels and keyboard dispatch across the toolbar, command palette, inspector, and source textarea.
- Phase 5E added unsaved-work protection and external-change reconciliation around the existing metadata polling foundation.
- Phase 5F added toggle-aware Markdown transforms, H4-H6, strikethrough, duplicate selection/current-line, and shared search/replace matching for literal, case-sensitive, whole-word, and regex modes.
- Phase 5G added a compact quick insert surface for block/insert commands and a floating selection overlay for common inline formatting in source mode.
- WYSIWYG/realtime editing, advanced table tools, image workflows, autocomplete, linting, formatter integration, non-format command remapping, full settings schema, native filesystem watching, and focus/typewriter modes remain open.

Exit criteria:

- MarkText parity rows for core editing are supported or explicitly deferred.

## Phase 6: Templates and Help

- Implement data-driven templates.
- Add Markdown reference/help panel.
- Add template autocomplete and insertion flows.

Current status:

- Phase 6A activates `packages/templates` with a typed starter catalog, search/filter helpers, simple variable application, and package tests.
- Phase 6B adds typed variable metadata/helpers, guided variable editing in the dialog, local custom templates with create/delete/reset behavior, and a first source suggestion surface for `/template` and `/tpl`.
- The editor exposes a compact toolbar/shortcut dialog for built-in/custom template search, live resolved preview, insertion, and a concise Markdown reference.
- Filesystem/workspace template loading, general Markdown autocomplete, syncable user template libraries, and a docs website remain open.

Exit criteria:

- Required template categories are available and tested.

## Phase 7: Converters

- Implement converter plugin contracts.
- Add HTML, DOCX, PDF, clipboard rich text, CSV/table, URL/article, OCR where practical, and Markdown cleanup modules.

Current status:

- Phase 7A expands `packages/converters` beyond the remediation package boundary with tested conversion capabilities for Markdown-to-HTML export, browser-print handoff, HTML-to-Markdown import through Turndown, CSV-to-Markdown table conversion, and Markdown whitespace cleanup.
- Phase 7B exposes the safe converter subset in the apps: editor toolbar/menu actions for Export HTML and Clean Markdown, plus viewer Export HTML backed by a constrained HTML save/write path.
- DOCX, native PDF import/export, rich clipboard import, URL/article extraction, and OCR are exposed as explicit unsupported converter boundaries until file parsing, platform MIME access, network/readability policy, OCR runtime, and fixture requirements are defined.

Exit criteria:

- Each converter reports warnings and limitations.
- Fixtures cover successful and lossy conversions.

## Phase 8: Theme Engine

- Implement built-in themes: light, dark, high contrast, sepia/paper, GitHub-like, modern neutral.
- Apply tokens to editor, preview, viewer, code blocks, sidebars, menus, and dialogs.
- Document custom theme extension model.

Exit criteria:

- Theme tests and visual review cover every app surface.

## Phase 9: Local LLM

- Implement provider abstraction.
- Add first local provider after benchmark/hardware verification.
- Add AI actions and explicit UI indicators.

Exit criteria:

- AI disabled by default.
- No cloud document transfer paths exist.
- Provider contract tests pass.

## Phase 10: Packaging and Documentation

- Build Windows installer/update path.
- Complete developer and user docs.
- Add Linux compatibility pass and package strategy.

Exit criteria:

- Initial working Windows build is reproducible.
- Automated tests pass.
- Linux smoke plan is documented and started.
