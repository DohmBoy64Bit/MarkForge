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

