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
- Full conformance fixtures, full YAML/TOML parsing, broader diagram runtime coverage beyond safe Mermaid flowcharts, and theme-integrated code highlighting remain open.

Exit criteria:

- Engine unit tests cover required syntax and XSS fixtures.
- Viewer can render static Markdown through the engine.

## Phase 3: Viewer

- Build standalone viewer shell.
- Add theme support, TOC sidebar, in-document search, copy code buttons, print/export, file watching, and display options.

Current status:

- Initial standalone viewer package is implemented with local file open/reload, sanitized rendering through `packages/markdown-engine`, native opened-file and workspace watching with package polling fallback, front matter/warnings display, generated TOC, search-match list, workspace file indexing/filtering/search/opening, copy source/rendered text, print, native menu wiring, HTML export, and package-backed built-in app theme controls.
- Rendered search highlighting, copy code buttons, fuzzy quick-open, and broader export workflows remain open.

Exit criteria:

- Viewer opens local files, refreshes on change, and passes security tests.

## Phase 4: Editor Shell

- Build editor workspace shell, tabs, source mode, split preview, command registry, menus, preferences, recent files, and session restore.
- Add basic editing operations and source Markdown workflows.

Current status:

- Initial editor shell foundation is implemented with tabbed document state, per-tab dirty tracking, new/open/save/save-as/copy/clipboard-check/print actions, source/split/preview modes, source search, shared markdown preview rendering, inspector panels, localStorage session restore for unsaved or dirty tabs, recent file paths, package-backed built-in app theme preferences, native menu event handling, native file watching with package polling fallback for external changes, and a compact document status bar.
- Phase 5A added the first typed source-mode command registry, Markdown formatting command rail, core formatting shortcuts, command status feedback, and replace-current/replace-all source search actions.
- Phase 5C added the first command palette foundation over the shared editor-engine command registry, including Ctrl+Shift+P, grouped search results, keyboard navigation, shortcut display, and execution through the source-mode command path.
- Phase 5D added a compact Preferences dialog for theme/default view selection and a local preference-backed keybinding foundation for the command palette plus existing editor commands, including editable shortcut strings, reset controls, duplicate conflict display, and deterministic first-registry-item shortcut dispatch.
- Phase 5E added dirty-tab close/reload protection, browser `beforeunload` guarding, all-open-file polling watch behavior, changed/missing-on-disk reconciliation notices, Keep local snoozing, and clearer inspector file status labels.
- Phase 5F added reversible source formatting, H1-H6 command coverage, strikethrough, duplicate selection/current-line, and compact source search options for case-sensitive, whole-word, and regex matching/replacement.
- Phase 5G added quick insert and a source selection formatting overlay, both backed by the existing editor-engine command registry and app command execution path.
- Phase 6A added a compact templates/help dialog, a preference-backed Templates and Help shortcut, and template insertion through the existing source document update path.
- Phase 6B added template variable metadata/editing, local custom templates in editor `localStorage`, and a bounded `/template`/`/tpl` source suggestion surface.
- Phase 12A replaces the plain textarea source surface with a CodeMirror 6 Markdown editor while preserving the existing command, template, converter, Local AI, search, selection, dirty-state, and preview workflows.
- Full preferences schema, non-format command remapping, rendered-preview search highlighting, syncable template libraries, fuzzy quick-open, focus/typewriter modes, and broader rich-editing fixture coverage remain open.

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
- Phase 5E added unsaved-work protection and external-change reconciliation around the existing metadata polling foundation; Phase 11 routes the same workflow through native Tauri close-request/file-watch events with polling fallback support.
- Phase 5F added toggle-aware Markdown transforms, H4-H6, strikethrough, duplicate selection/current-line, and shared search/replace matching for literal, case-sensitive, whole-word, and regex modes.
- Phase 5G added a compact quick insert surface for block/insert commands and a floating selection overlay for common inline formatting in source mode.
- Post-Phase-12A remediation adds package-owned image insertion/update, table row/column insertion, table alignment, selection/current-line deletion, Markdown source formatting, source search/replace helpers, shared converter/Local AI insertion helpers, general slash autocomplete for headings, links, images, tables, front matter, code fences, task lists, blockquotes, and workspace-backed link/image path autocomplete.
- Phase 12A adds the CodeMirror 6 source editor foundation with Markdown syntax highlighting, line numbers, history, line wrapping, active-line highlighting, and app command compatibility.
- A ProseMirror-backed rich Markdown mode is implemented for Markdown parse/serialize editing. Rich-editing fixture coverage, image asset picking, linting, formatter integration beyond the current source formatter, non-format command remapping, full settings schema, fuzzy quick-open, and focus/typewriter modes remain open.

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
- Workspace template loading from `.markforge/templates/*.md` is implemented in the editor. General line-leading Markdown structure autocomplete and workspace-backed Markdown link/image path completion are implemented; syncable user template libraries and hosted docs publishing remain open.

Exit criteria:

- Required template categories are available and tested.

## Phase 7: Converters

- Implement converter plugin contracts.
- Add HTML, DOCX, PDF, clipboard rich text, CSV/table, URL/article, OCR where practical, and Markdown cleanup modules.

Current status:

- Phase 7A expands `packages/converters` beyond the remediation package boundary with tested conversion capabilities for Markdown-to-HTML export, browser-print handoff, HTML-to-Markdown import through Turndown, CSV-to-Markdown table conversion, and Markdown whitespace cleanup.
- Phase 7B exposes the safe converter subset in the apps: editor toolbar/menu actions for Export HTML and Clean Markdown, plus viewer Export HTML backed by a constrained HTML save/write path.
- Phase 7C adds editor Import Conversion for supported HTML and CSV input, inserting converted Markdown into the active document by selection, cursor, or append mode.
- Phase 7D adds converter activity history for supported editor conversion actions.
- Phase 7E polishes the converter import workflow with responsive segmented controls, disabled/converting states, and stable dialog layout.
- Phase 7F updates converter documentation, validation, and screenshot evidence.
- The current converter set also supports rich clipboard HTML import, URL/article HTML import through a validated fetch path, DOCX import/export, PDF text import, Markdown-to-PDF export, OCR image import, and basic HTML export settings for generated metadata/TOC.
- DOCX, PDF, and OCR conversion are implemented through packaged JavaScript runtimes and require broader fixtures before being treated as complete document-fidelity parity.

Exit criteria:

- Each converter reports warnings and limitations.
- Fixtures cover successful and lossy conversions.

## Phase 8: Theme Engine

- Implement built-in themes: light, dark, high contrast, sepia/paper, GitHub-like, modern neutral.
- Apply tokens to editor, preview, viewer, code blocks, sidebars, menus, and dialogs.
- Document custom theme extension model.

Current status:

- Phase 8A audited app-local theme duplication and confirmed editor/viewer CSS variables were not yet package-owned.
- Phase 8B adds app-facing token generation in `packages/theme-engine` for shell CSS variables used by editor and viewer.
- Phase 8C wires editor and viewer shell roots to `themeToAppCssVariables(...)` instead of local light/dark variable blocks.
- Phase 8D exposes Sepia Paper as the first non-light/dark app-visible theme in editor/viewer controls and preferences.
- Phase 8E exposes High Contrast, GitHub, and Modern Neutral through the package-owned app-visible theme list.
- Phase 8F keeps persistence, editor/viewer controls, preferences, tests, docs, and screenshot evidence aligned around all six built-in app themes.

Exit criteria:

- Theme tests and visual review cover every app surface.

## Phase 9: Local LLM

- Implement provider abstraction.
- Add first local provider after benchmark/hardware verification.
- Add AI actions and explicit UI indicators.

Current status:

- Phase 9 is implemented for local-only provider foundations and the first editor UI surface.
- `packages/llm` owns prompt templates, local action execution, explicit user-invocation privacy checks, loopback endpoint validation, Ollama HTTP generation, and OpenAI-compatible local endpoints for LM Studio/llama.cpp-style servers.
- The editor exposes a compact Local AI dialog with disabled-by-default provider enablement, provider/endpoint/model configuration, action and source selection, prompt preview, result output, running/error/disabled states, and explicit insert controls.
- Cloud AI providers remain out of scope and no cloud endpoint path is accepted by the current local provider validators.

Exit criteria:

- AI disabled by default.
- No cloud document transfer paths exist.
- Provider contract tests pass.

## Phase 10: Packaging and Documentation

- Build Windows installer/update path.
- Complete developer and user docs.
- Add Linux compatibility pass and package strategy.

Current status:

- Phase 10 is implemented for the reproducible packaging/documentation baseline.
- Windows NSIS build commands, expected artifact paths, manual installer smoke checks, and release prerequisites are documented in `docs/packaging-release.md`.
- `pnpm packaging:check` validates package/Tauri/Cargo version alignment, Windows NSIS targets, per-user installer mode, window baselines, CSP baseline, icons, capabilities, and root release scripts.
- Linux packaging is started as a documented smoke plan with AppImage-first evaluation, followed by deb/rpm only after Tauri prerequisite and launch smoke checks.
- Auto-updater publishing, code signing, richer shell recent-document smoke coverage, and Linux artifacts remain later release-hardening work. Windows file associations, startup-file loading, and editor Windows shell recent-document updates are implemented.

Exit criteria:

- Initial working Windows build is reproducible.
- Automated tests pass.
- Linux smoke plan is documented and started.

## Phase 11: Native Platform Hardening

- Move file-change detection from renderer polling to native Tauri filesystem events.
- Route native window close requests through the existing unsaved-document protection flow.
- Keep polling and browser unload behavior as fallback guards.
- Preserve package ownership in `packages/platform`.

Current status:

- Editor and viewer Tauri shells use the Rust `notify` crate to watch opened Markdown/text files and emit `markforge://file-watch` events.
- `packages/platform` prefers native file-watch adapters and keeps the polling implementation as a fallback.
- The editor and viewer Tauri shells expose workspace listing, workspace search, and recursive workspace watch commands for supported Markdown/text files.
- The editor registers Tauri `onCloseRequested` protection through `packages/platform` and walks every dirty document through the existing Save/Discard/Cancel dialog before force-destroying the window.
- Linux artifact smoke remains blocked by missing native Linux prerequisites on the current WSL host.

Exit criteria:

- Native watcher and close-protection tests pass.
- Editor/viewer builds and Rust checks pass.
- Linux smoke status is documented honestly.

## Phase 12: Rich Editor Surface

- Replace the plain textarea source editor with the planned CodeMirror 6 source surface.
- Preserve existing MarkForge command, quick insert, template, converter, Local AI, search/replace, dirty-state, and preview workflows.
- Keep MarkForge visually distinct from MarkText while improving source editing fidelity.

Current status:

- Phase 12A is implemented for CodeMirror 6 source editing in `apps/editor`.
- The source editor now supports line numbers, history, Markdown syntax highlighting, bracket matching, active-line highlighting, line wrapping, and app-theme-compatible styling.
- Existing formatting commands, command palette, quick insert, template insertion/suggestions, converter insertion, Local AI insertion, search jumps, replace actions, source/rich/split/preview modes, and selection overlay operate through shared Markdown document state.
- A ProseMirror-backed rich Markdown mode is implemented; broader rich editing fixture coverage and parity-specific behavior remain hardening work.

Exit criteria:

- CodeMirror editor builds and passes app tests.
- Bundle budget remains enforced through CodeMirror vendor chunks.
- Visual evaluation confirms the workbench renders on desktop and mobile.
