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
apps/editor ─┬─> packages/editor-engine
             ├─> packages/core
             ├─> packages/platform
             ├─> packages/converters
             ├─> packages/theme-engine
             ├─> packages/llm
             ├─> packages/ui
             └─> packages/shared

apps/viewer ─┬─> packages/markdown-engine
             ├─> packages/converters
             ├─> packages/theme-engine
             ├─> packages/ui
             └─> packages/platform

packages/editor-engine ─┬─> packages/markdown-engine
                        └─> packages/templates

packages/converters ─┬─> packages/markdown-engine
                     └─> packages/shared

packages/llm ───> packages/shared
```

UI may call application services through typed package interfaces, but UI components must not directly parse Markdown, read files, call provider SDKs, or implement converter/LLM runtime logic.

## Package Responsibilities

### `apps/editor`

Desktop editor application shell. Owns routing between workspace, editor panes, command palette, menus, dialogs, and app-level composition. It delegates all domain work to packages.

### `apps/viewer`

Standalone Markdown viewer app/mode. Owns viewer window composition, file-open/view lifecycle, search UI, TOC UI, workspace panel UI, print/export commands, and thin native adapter wiring.

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

Pinned future extraction note: `@markforge/ui` is product-wired for the shared icon-only command button primitive. Continue broader extraction only when concrete reusable primitives can move without changing behavior or layout. Low-risk candidates are panel headers, search fields, empty states, status rows, and other stable presentation-only controls. App shells should keep workflow state, document orchestration, Tauri adapters, and page layout composition until a component is proven reusable.

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
- `packages/platform` owns typed filesystem, dialog, clipboard, print, file-watch, workspace listing/search/watch, shell recent-document, spellcheck, updater-status, and native close-protection service contracts. Apps still provide thin Tauri adapter wiring at the shell boundary.
- `packages/theme-engine` owns central theme tokens, validation, built-in themes, app-visible theme listing, app-facing CSS variable generation, code theme mapping, and print/export color mapping. Editor and viewer now consume package-generated app theme variables and expose Light, Dark, Sepia Paper, High Contrast, GitHub, and Modern Neutral controls.
- `packages/converters` owns the converter contract, sanitized HTML export with basic export settings, HTML-to-Markdown import, CSV-to-Markdown table conversion, rich clipboard HTML import, URL/article import, Markdown cleanup, capability checks, browser-print pathway, warnings, and unsupported capability results.
- `packages/llm` owns local-only provider contracts, prompt templates, local action execution, mock provider tests, cancellation, loopback endpoint validation, Ollama and OpenAI-compatible local adapters, explicit unsupported local adapter boundaries, and the privacy guard. The editor now exposes a disabled-by-default Local AI workflow through this package.
- `packages/ui` owns initial reusable presentational helpers. App-specific dialogs and workflow components remain in `apps/editor` and `apps/viewer` until they are safely reusable.
- `apps/editor` now delegates preference/session/recent-file schema behavior to `packages/core`, platform read/write/dialog/clipboard/print/watch/workspace/shell-recent/close behavior to `packages/platform`, supported conversion execution to `packages/converters`, app theme variables to `packages/theme-engine`, editor preview/template/autocomplete/search/insertion APIs to `packages/editor-engine`, and Local AI provider execution to `packages/llm`. The Phase 12A source editor surface is CodeMirror-backed inside the app shell while command transforms remain package-owned in `packages/editor-engine`. The app still owns document orchestration, source search UI state, workspace panel state, converter workflow UI/activity history, Local AI dialog state, command UI wiring, custom template UI persistence, and live preview composition.
- `apps/viewer` now delegates file-open/read/info, workspace listing/search/watch, clipboard, native file watching with package polling fallback, and print/export behavior through `packages/platform`/`packages/converters`. It still owns viewer search state, workspace panel state, rendered view composition, and Tauri adapter wiring.
- Signing keys, updater publishing endpoints, Linux packaging artifacts, native PDF/DOCX/OCR conversion runtimes, richer native spellcheck providers, and WYSIWYG/realtime editing remain release/runtime or larger architecture work because they require external keys, release hosts, native Linux prerequisites, parser/runtime decisions, or a dedicated rich-editor engine choice. Workspace/folder watching, workspace search, workspace templates, rich clipboard HTML import, URL import, general Markdown slash autocomplete, source formatting/image/table-row/delete-line commands, and Windows shell recent-document updates now have concrete package/app implementations.
- `pnpm docs:check` validates required docs, local Markdown links, stale markers, implemented package README/manifest/source/test/public-entrypoint coverage, private package import bans, and workspace dependency/import consistency.
- `pnpm bundle:check` validates current built JavaScript bundles against documented per-app budgets after `pnpm build:editor` and `pnpm build:viewer`.
- `pnpm packaging:check` validates the Phase 10 Windows packaging baseline and release-critical Tauri/Cargo/package metadata.

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
