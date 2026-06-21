# Developer Documentation

## Prerequisites

- Node.js 22.19.0 or newer.
- pnpm 10 or newer.
- Python 3.10 or newer for repomixr audit scripts.
- Rust toolchain will be required if ADR 0001 is accepted.

## Current Commands

```bash
pnpm docs:check
pnpm test
pnpm audit:marktext
```

`pnpm audit:marktext` creates or updates the repomixr checkout under the OS temp directory and runs the required MarkText bundle generation.

## Architecture Gate

Implementation work must wait until these documents are reviewed:

- `docs/marktext-parity-matrix.md`
- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/adr/0001-desktop-stack.md`

## Code Rules

- UI components must not contain business logic.
- Markdown parsing/rendering must live in `packages/markdown-engine`.
- File system access must live behind `packages/platform`.
- LLM support must live behind provider interfaces in `packages/llm`.
- Conversion tools must be modular and testable in `packages/converters`.
- Theme handling must be centralized in `packages/theme-engine`.
- Templates must be data-driven in `packages/templates`.
- Public package APIs must be documented.
