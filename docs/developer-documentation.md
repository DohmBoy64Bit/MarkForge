# Developer Documentation

## Prerequisites

- Node.js 22.19.0 or newer.
- pnpm 10 or newer.
- Python 3.10 or newer for repomixr audit scripts.
- Rust toolchain for Tauri desktop builds and `cargo check`.

## Current Commands

```bash
pnpm docs:check
pnpm test
pnpm audit:marktext
pnpm build:editor
pnpm build:viewer
pnpm tauri:build
pnpm tauri:viewer:build
```

`pnpm audit:marktext` creates or updates the repomixr checkout under the OS temp directory and runs the required MarkText bundle generation.

Run Tauri Rust checks from each app's `src-tauri` directory when changing desktop integration:

```bash
cargo check
```

`pnpm docs:check` is currently a placeholder scaffold check. Replace it with a real documentation validation pass before relying on it as a release gate.

## Implementation State

Implementation has progressed through Phase 5A:

- Phase 1 Tauri editor proof of concept.
- Phase 2 shared Markdown engine.
- Phase 3 standalone viewer foundation.
- Phase 4 multi-document editor shell.
- Phase 5A source editing command registry and Markdown formatting rail.

The architecture remains the target contract, but some app components still own temporary platform/session/editing logic while packages are being extracted.

## Code Rules

- UI components must not contain business logic.
- Markdown parsing/rendering must live in `packages/markdown-engine`.
- File system access must live behind `packages/platform`.
- LLM support must live behind provider interfaces in `packages/llm`.
- Conversion tools must be modular and testable in `packages/converters`.
- Theme handling must be centralized in `packages/theme-engine`.
- Templates must be data-driven in `packages/templates`.
- Public package APIs must be documented.
