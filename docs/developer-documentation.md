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

`pnpm docs:check` runs the repository documentation validation script. It checks required documentation files, targeted stale-status drift markers, package placeholder/current implementation consistency, and local Markdown links across product documentation.

## Implementation State

Implementation has progressed through Phase 8 completion:

- Phase 1 Tauri editor proof of concept.
- Phase 2 shared Markdown engine.
- Phase 3 standalone viewer foundation.
- Phase 4 multi-document editor shell.
- Phase 5 source-mode command/editing foundations through Phase 5G.
- Phase 6B templates/help, guided template variables, local custom templates, and bounded `/template`/`/tpl` source suggestions.
- Phase 7F converter app integration for editor Export HTML, Import Conversion for HTML/CSV input, Clean Markdown, converter activity history, viewer Export HTML, browser print handoff preservation, and explicit unsupported results for heavier conversion targets.
- Phase 8 theme integration for package-backed editor/viewer app tokens and Light, Dark, Sepia Paper, High Contrast, GitHub, and Modern Neutral app-visible controls.

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
