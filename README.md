# MarkForge

MarkForge is being built as a professional, local-first Markdown editor and standalone Markdown viewer for Windows and Linux, with Windows as the first production target.

The initial architecture and parity audit are complete, and implementation has progressed through Phase 12A rich editor surface work. MarkForge is not product-ready yet and remains intentionally distinct from a 1:1 MarkText clone.

## Current Status

- Phase 1 validated the Tauri v2 Windows x64 editor proof of concept.
- Phase 2 established the shared Markdown engine contract.
- Phase 3 added the standalone viewer foundation.
- Phase 4 added the multi-document editor shell.
- Phase 5 added source-mode command/editing foundations through Phase 5G, including the command palette, preferences/keybindings, unsaved-work protection, quick insert, and selection formatting overlay.
- Phase 6B added templates/help, guided template variables, local custom templates, and bounded `/template`/`/tpl` source suggestions.
- Phase 7F completes the current safe converter UI slice: editor Export HTML, Import Conversion for HTML/CSV into Markdown, Clean Markdown, converter activity history, viewer Export HTML, browser-print handoff preservation, and explicit unsupported results for heavier converters.
- Phase 8 completes built-in app theme exposure: editor/viewer chrome now uses `packages/theme-engine` app tokens for Light, Dark, Sepia Paper, High Contrast, GitHub, and Modern Neutral.
- Phase 9 adds the first local-only AI surface: `packages/llm` owns provider contracts/adapters and privacy guards, while the editor exposes a disabled-by-default Local AI dialog for loopback providers only.
- Phase 10 adds reproducible packaging documentation and validation: Windows NSIS installer commands, release smoke checks, `packaging:check`, and a started Linux smoke plan.
- Phase 11 adds native open-file watching and editor close-request protection through `packages/platform`, with polling/browser guards preserved as fallback paths.
- Phase 12A replaces the plain textarea with a CodeMirror 6 Markdown source editor while preserving existing command, template, converter, Local AI, search, dirty-state, and preview workflows.
- Post-Phase-12A remediation adds editor workspace listing/search/watch, workspace templates, rich clipboard HTML import, URL/article HTML import, basic HTML export settings, safe Mermaid flowchart rendering, Windows shell recent-document updates, and platform spellcheck/updater contracts.
- Several package boundaries are still transitional; see [Architecture](docs/architecture.md).

## Evidence

The MarkText repository bundle is stored at:

- [docs/research/repomixr/output/marktext/repomix-output.xml](docs/research/repomixr/output/marktext/repomix-output.xml)
- [docs/research/repomixr/output/SUMMARY.md](docs/research/repomixr/output/SUMMARY.md)

The audit config is:

- [docs/research/repomixr/marktext-repos.json](docs/research/repomixr/marktext-repos.json)

## Documentation

- [Product requirements](docs/product-requirements.md)
- [MarkText parity matrix](docs/marktext-parity-matrix.md)
- [Architecture](docs/architecture.md)
- [Implementation roadmap](docs/implementation-roadmap.md)
- [Desktop stack ADR](docs/adr/0001-desktop-stack.md)
- [Design principles](docs/design-principles.md)
- [Phase 1 proof of concept](docs/phase-1-proof-of-concept.md)
- [Phase 2 markdown engine](docs/phase-2-markdown-engine.md)
- [Phase 3 viewer foundation](docs/phase-3-viewer-foundation.md)
- [Phase 4 editor shell](docs/phase-4-editor-shell.md)
- [Phase 5 advanced editing](docs/phase-5-advanced-editing.md)
- [Phase 6 templates and help](docs/phase-6-templates-help.md)
- [Phase 7 converters](docs/phase-7-converters.md)
- [Phase 8 theme engine](docs/phase-8-theme-engine.md)
- [Phase 9 local LLM](docs/phase-9-local-llm.md)
- [Phase 10 packaging and documentation](docs/phase-10-packaging-documentation.md)
- [Phase 11 native platform hardening](docs/phase-11-native-platform-hardening.md)
- [Phase 12 rich editor surface](docs/phase-12-rich-editor-surface.md)
- [Packaging and release](docs/packaging-release.md)
- [Release hardening](docs/release-hardening.md)
- [Update and signing strategy](docs/update-signing-strategy.md)
- [Developer documentation](docs/developer-documentation.md)
- [User documentation](docs/user-documentation.md)
- [Theming documentation](docs/theming-documentation.md)
- [Local LLM setup documentation](docs/local-llm-setup.md)
