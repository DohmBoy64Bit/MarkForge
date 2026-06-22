# Architecture

## Required Structure

MarkForge uses a monorepo with strict package boundaries:

```text
apps/editor
apps/viewer
packages/core
packages/markdown-engine
packages/editor-engine
packages/converters
packages/templates
packages/theme-engine
packages/llm
packages/ui
packages/platform
packages/shared
docs
tests
```

No implementation code should be placed outside these boundaries except standard root-level project files, package/build configuration, and documentation.

## Dependency Direction

```text
apps/editor ─┬─> packages/ui
             ├─> packages/editor-engine
             ├─> packages/core
             ├─> packages/platform
             └─> packages/shared

apps/viewer ─┬─> packages/ui
             ├─> packages/markdown-engine
             ├─> packages/theme-engine
             ├─> packages/platform
             └─> packages/shared

packages/editor-engine ─┬─> packages/markdown-engine
                        ├─> packages/templates
                        ├─> packages/theme-engine
                        └─> packages/shared

packages/converters ─┬─> packages/markdown-engine
                     └─> packages/shared

packages/llm ───> packages/shared
```

UI may call application services through typed interfaces, but UI components must not directly parse Markdown, read files, call LLM providers, or run converters.

## Package Responsibilities

### `apps/editor`

Desktop editor application shell. Owns routing between workspace, editor panes, command palette, menus, dialogs, and app-level composition. It delegates all domain work to packages.

### `apps/viewer`

Standalone Markdown viewer app/mode. Owns viewer window composition, file-open/view lifecycle, search UI, TOC UI, print/export commands, and file-watch refresh wiring.

### `packages/core`

Application state, command registry, preference schema, migrations, session restore, recent files, project/workspace models, and domain services that are not tied to UI or platform APIs.

### `packages/markdown-engine`

Markdown parsing, rendering, sanitization, TOC extraction, heading anchors, extension configuration, front matter parsing, math/diagram integration points, export HTML generation, and Markdown normalization APIs.

### `packages/editor-engine`

Editing behavior and document manipulation: WYSIWYG/realtime editing adapter, source mode adapter, split mode coordination, autocomplete, block inserter, table tools, image tools, focus/typewriter behavior, lint/format actions, and selection transforms.

### `packages/converters`

Plugin-style conversion runtime and converter implementations. Each converter exposes metadata, capability checks, conversion results, warnings, and tests.

### `packages/templates`

Data-driven Markdown templates, template variables, validation, preview metadata, and insertion/rendering APIs.

### `packages/theme-engine`

Central theme tokens, CSS variable generation, theme validation, built-in theme registry, code theme mapping, export/print theme mapping, and future custom theme loading.

### `packages/llm`

Provider interfaces and local-only AI workflows. It owns Ollama/llama.cpp/LM Studio adapters, prompt templates, streaming abstractions, cancellation, and privacy boundaries. It must not depend on editor UI.

### `packages/ui`

Reusable presentational components, layout primitives, dialogs, menus, toolbars, settings panels, icons, and accessibility helpers. Components receive data/actions through props or adapters.

### `packages/platform`

Desktop platform services: filesystem, dialogs, clipboard, shell links, file watching, recent documents, printing/PDF, spell checking, native menus, update checks, app paths, and OS-specific behavior.

### `packages/shared`

Shared types, result/error helpers, event contracts, schema utilities, and constants that do not create runtime cycles.

### `tests`

Cross-package integration, fixture, and end-to-end tests. Package-level unit tests may live beside package source once implementation begins.

## Current Implementation Drift / Transitional Debt

The structure and dependency graph above remain the target architecture. The current repository now has real package boundaries for every required `packages/*` directory: `core`, `platform`, `shared`, `converters`, `theme-engine`, `llm`, `ui`, `markdown-engine`, `editor-engine`, and `templates` each have a manifest, public source entrypoint, README, and package-level tests.

- `packages/shared` owns typed result/error, cancellation, event, JSON, and storage contracts used by other packages.
- `packages/core` owns the versioned editor preference schema, session restore schema, recent-file helpers, and localStorage adapter helpers used by the editor shell.
- `packages/platform` owns typed filesystem, dialog, clipboard, print, and polling file-watch service contracts. Apps still provide thin Tauri adapter wiring at the shell boundary.
- `packages/theme-engine` owns central theme tokens, validation, built-in themes, app-facing CSS variable generation, code theme mapping, and print/export color mapping. Editor and viewer now consume package-generated app theme variables and expose Light, Dark, and Sepia Paper controls; high contrast, GitHub-like, and modern neutral are still package-ready but not fully surfaced.
- `packages/converters` owns the converter contract, sanitized HTML export, HTML-to-Markdown import, CSV-to-Markdown table conversion, Markdown cleanup, capability checks, browser-print pathway, warnings, and unsupported capability results.
- `packages/llm` owns local-only provider contracts, prompt templates, a mock provider, cancellation, explicit unsupported local adapter boundaries, and the privacy guard. No user-facing AI workflow is enabled.
- `packages/ui` owns initial reusable presentational helpers. App-specific dialogs and workflow components remain in `apps/editor` and `apps/viewer` until they are safely reusable.
- `apps/editor` now delegates preference/session/recent-file schema behavior to `packages/core`, platform read/write/dialog/clipboard/print behavior to `packages/platform`, supported conversion execution to `packages/converters`, and app theme variables to `packages/theme-engine`. It still owns document orchestration, search state, converter workflow UI/activity history, command UI wiring, custom template UI persistence, live preview composition, and direct imports of `@markforge/markdown-engine` and `@markforge/templates`; those are remaining dependency-direction drifts to resolve when editor-engine/template ownership is expanded.
- `apps/viewer` now delegates file-open/read/info, clipboard, metadata polling, and print behavior through `packages/platform`/`packages/converters`. It still owns viewer search state, rendered view composition, and Tauri adapter wiring.
- Native file watching, native close interception, shell links, spellcheck, update checks, Linux packaging hardening, and full native PDF/DOCX/OCR/CSV/URL conversion remain unsupported because the current code/docs do not provide enough exact contracts to implement them safely.
- `pnpm docs:check` validates required docs, local Markdown links, stale markers, and implemented package README/manifest/source/test/public-entrypoint coverage.
- `pnpm bundle:check` validates current built JavaScript bundles against documented per-app budgets after `pnpm build:editor` and `pnpm build:viewer`.

Remaining drift is tracked debt, not the final intended ownership model.

## Public API Rules

- Every package exports through a single public entrypoint.
- Public types and functions must be documented.
- Internal modules are not imported across package boundaries.
- Errors cross package boundaries as typed result objects or documented exceptions.
- Long-running operations support cancellation.

## Security Rules

- Markdown preview and viewer HTML must be sanitized by `packages/markdown-engine`.
- Raw HTML rendering must be configurable.
- External links go through `packages/platform`.
- File paths are normalized through `packages/platform`.
- Converter plugins run with explicit capability declarations and clear trust boundaries.
- Local LLM providers never receive document content until the user explicitly invokes an AI action.

## Testing Strategy

- Markdown parser/render tests for CommonMark/GFM/extensions.
- Sanitization/XSS regression tests.
- Converter unit tests with fixtures.
- Template validation/render tests.
- LLM provider contract tests using local mocked providers.
- Platform service tests with Windows path, network path, WSL-like path, and Linux path fixtures.
- UI behavior tests for command palette, menus, keybindings, editor mode toggles, TOC, search, image paste, and export.
- Packaging smoke tests for Windows before Linux packaging work begins.
