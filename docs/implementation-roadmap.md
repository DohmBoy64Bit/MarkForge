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

Exit criteria:

- Engine unit tests cover required syntax and XSS fixtures.
- Viewer can render static Markdown through the engine.

## Phase 3: Viewer

- Build standalone viewer shell.
- Add theme support, TOC sidebar, in-document search, copy code buttons, print/export, file watching, and display options.

Exit criteria:

- Viewer opens local files, refreshes on change, and passes security tests.

## Phase 4: Editor Shell

- Build editor workspace shell, tabs, source mode, split preview, command registry, menus, preferences, recent files, and session restore.
- Add basic editing operations and source Markdown workflows.

Exit criteria:

- Windows users can open, edit, save, search, and preview Markdown reliably.

## Phase 5: Advanced Editing

- Add WYSIWYG/realtime editing behavior.
- Add quick insert, format overlay, line transformer, table tools, image tools, autocomplete, linting, formatting, focus/typewriter/distraction-free modes.

Exit criteria:

- MarkText parity rows for core editing are supported or explicitly deferred.

## Phase 6: Templates and Help

- Implement data-driven templates.
- Add Markdown reference/help panel.
- Add template autocomplete and insertion flows.

Exit criteria:

- Required template categories are available and tested.

## Phase 7: Converters

- Implement converter plugin contracts.
- Add HTML, DOCX, PDF, clipboard rich text, CSV/table, URL/article, OCR where practical, and Markdown cleanup modules.

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

