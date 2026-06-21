# MarkForge

MarkForge is being built as a professional, local-first Markdown editor and standalone Markdown viewer for Windows and Linux, with Windows as the first production target.

The initial architecture and parity audit are complete, and implementation has progressed through Phase 5A. MarkForge is not product-ready yet and remains intentionally distinct from a 1:1 MarkText clone.

## Current Status

- Phase 1 validated the Tauri v2 Windows x64 editor proof of concept.
- Phase 2 established the shared Markdown engine contract.
- Phase 3 added the standalone viewer foundation.
- Phase 4 added the multi-document editor shell.
- Phase 5A added the first source-editing command registry, Markdown formatting rail, and replace actions.
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
- [Developer documentation](docs/developer-documentation.md)
- [User documentation](docs/user-documentation.md)
- [Theming documentation](docs/theming-documentation.md)
- [Local LLM setup documentation](docs/local-llm-setup.md)
