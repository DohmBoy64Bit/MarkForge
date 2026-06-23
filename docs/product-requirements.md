# Product Requirements

## Vision

MarkForge is a modern, fast, local-first Markdown editor and standalone Markdown viewer for Windows and Linux. Windows is the first production target. The writing experience should be calm, readable, and uncluttered, inspired by MarkText's simplicity without copying its visual design or source.

## Product Principles

- Local-first by default. User documents stay on the user's machine.
- Professional desktop behavior: native file workflows, reliable menus, keyboard support, accessible UI, dependable packaging, and predictable updates.
- Clear module ownership. UI components do not own business logic.
- Feature parity is evidence-based. MarkText features must be tracked in `docs/marktext-parity-matrix.md`.
- Originality matters. Functional parity is a target, but MarkForge must have its own architecture, interaction design, theming, converter system, viewer, and local LLM layer.
- MarkForge must not be a 1:1 visual clone of MarkText. MarkText is an audit source for behavior, not a design template to copy.

## Primary Users

- Developers writing READMEs, changelogs, specifications, GitHub issues, pull requests, and technical docs.
- Technical writers maintaining Markdown documentation.
- Knowledge workers who need notes, meeting minutes, outlines, and exported documents.
- Users who want a safe standalone Markdown viewer for local files.

## Core Editor Requirements

- Realtime rendered Markdown editing and/or WYSIWYG-style editing.
- Source Markdown mode.
- Optional split editor/preview mode.
- Focus, typewriter, and distraction-free modes.
- CommonMark and GitHub Flavored Markdown support.
- Markdown extensions: tables, task lists, footnotes if parser-supported, strikethrough, links, images, blockquotes, code fences, front matter, emoji, math with KaTeX or equivalent, and diagrams if feasible.
- Table of contents generated from headings.
- Built-in tag/block inserter.
- Autocomplete and suggestions for Markdown syntax, links, headings, images, tables, front matter fields, code fences, and templates.
- Markdown linting, formatting, and cleanup tools.
- Search and replace in document.
- File explorer/workspace support.
- Recent files and session restore.
- Export to HTML and PDF; DOCX when the conversion layer is stable.
- Clipboard support for Markdown, HTML, and plain text.
- Drag-and-drop and paste image handling.
- Built-in Markdown help/reference panel.
- Keyboard shortcut editor.
- Data-driven templates for README, documentation, notes, changelogs, blog posts, meeting notes, project specs, GitHub issues, pull requests, and technical docs.

Phase 6B baseline:

- `packages/templates` owns the typed built-in catalog, variable metadata, placeholder extraction, default merging, and custom-template normalization helpers.
- The editor exposes template search, guided variable editing, live resolved preview, and insertion plus compact Markdown reference help.
- Local custom templates are supported through editor `localStorage` with create, search, insert, delete, and reset behavior.
- Source-mode template suggestions are supported for line-leading `/template` and `/tpl` triggers.
- Workspace template files under `.markforge/templates/*.md` load into the editor template/search/autocomplete flow when a workspace is open.
- Syncable template libraries and general Markdown autocomplete remain later requirements.

## Conversion Requirements

The `packages/converters` package must expose a plugin-style conversion architecture. Initial targets:

- HTML to Markdown.
- DOCX to Markdown.
- PDF to Markdown with explicit limitations.
- Rich clipboard content to Markdown.
- CSV/table data to Markdown table.
- URL/article to Markdown through readability extraction.
- Image OCR to Markdown text where practical.
- Markdown cleanup/normalization.

Each converter must be independently testable and report confidence, warnings, and unsupported structures.

Current converter baseline:

- `packages/converters` exposes tested Markdown-to-HTML export, browser-print handoff, HTML-to-Markdown import, CSV-to-Markdown table conversion, rich clipboard HTML import, URL/article HTML import, basic HTML export settings, and Markdown cleanup.
- The editor exposes supported active-document converter UI for Export HTML, Import Conversion for HTML/CSV/rich clipboard/URL input, Clean Markdown, and converter activity history.
- The viewer exposes Export HTML for the currently rendered Markdown/text document.
- HTML-to-Markdown reports lossy conversion because styling/layout are not preserved.
- URL/article conversion validates HTTP(S) input and uses the converter fetch path with trust/lossiness warnings.
- DOCX, native PDF import/export, and OCR return explicit unsupported capability results until their parsing/runtime/trust requirements are defined.

## Local LLM Requirements

- AI assistance is disabled until the user configures a provider.
- Provider interface must support Ollama, llama.cpp, LM Studio, or comparable local backends.
- No document content may be sent to cloud APIs unless a future cloud provider is explicitly configured by the user.
- Model recommendation must be selected at implementation time from current benchmarks and hardware constraints; this repository must not hardcode a stale model choice.
- Features: generate Markdown draft, summarize document, improve clarity, fix formatting, create outline, convert rough notes to structured Markdown, generate tables, suggest headings, and explain Markdown syntax.
- UI must clearly show when local AI is active.

Phase 9 baseline:

- `packages/llm` owns provider contracts, prompt templates, explicit user-invocation guards, loopback endpoint validation, Ollama generation, and OpenAI-compatible local chat adapters for LM Studio/llama.cpp-style servers.
- The editor exposes a disabled-by-default Local AI dialog with provider/endpoint/model fields, action and source selection, prompt preview, result output, running/error states, and explicit insert controls.
- Current implemented actions are summarize, improve clarity, create outline, and explain Markdown syntax.
- Cloud AI providers remain out of scope.

## Standalone Viewer Requirements

- Separate viewer mode/app component.
- Fast rendering of Markdown files.
- Theme support.
- Table of contents sidebar.
- Search within document.
- Print/export support.
- Copy code block buttons.
- Math, diagrams, tables, task lists, and front matter display options.
- Presentation/reading mode if feasible.
- Sanitized HTML rendering.
- File watching and auto-refresh.

## Theming Requirements

- Central theme engine; no hardcoded product colors in feature components.
- Built-in themes: light, dark, high contrast, sepia/paper, GitHub-like, and modern neutral.
- Themes cover editor, preview, viewer, code blocks, sidebars, menus, and dialogs.
- User custom themes should later use JSON and CSS variables.

Phase 8 baseline:

- `packages/theme-engine` owns app-facing theme variables for editor and viewer shells.
- The editor and viewer expose Light, Dark, Sepia Paper, High Contrast, GitHub, and Modern Neutral app theme controls.
- Persisted editor preferences accept the complete built-in app-visible theme set.

## Platform Requirements

- Windows baseline first: installer, file associations, recent documents, update story, shell integration, network paths, high DPI, and keyboard layouts.
- Linux follows after Windows baseline stability: AppImage, deb, rpm, or Flatpak based on packaging research.
- Platform assumptions must be isolated behind `packages/platform`.

Phase 10 baseline:

- The editor and viewer have documented Windows NSIS build commands and expected installer artifact paths.
- `pnpm packaging:check` validates release-critical packaging configuration and version alignment.
- Manual Windows installer smoke checks are documented.
- Linux compatibility is started as a smoke plan, with AppImage evaluated first before deb/rpm.
- Code signing, updater publishing, and Linux artifacts remain later release-hardening requirements.

Release-hardening baseline:

- Windows installer smoke passed for install, shortcut creation, launch, uninstall, and cleanup.
- Windows file association declarations are implemented for `.md`, `.markdown`, `.mdown`, and `.txt` in editor and viewer installers.
- Editor and viewer can load a supported startup file path argument through their existing platform file-read services.
- The editor updates Windows shell recent documents for opened/saved supported files through the platform shell service.
- Update/signing is guarded by explicit disabled updater artifact configuration and `packaging:check` drift prevention.
- Code signing, updater publishing, and Linux artifacts remain later release-hardening requirements.

## Non-Goals for the First Baseline

- Cloud synchronization.
- Cloud AI providers.
- Collaborative editing.
- Mobile support.
- Full PDF layout reconstruction in PDF-to-Markdown conversion.
- 1:1 MarkText visual clone.
