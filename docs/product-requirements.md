# Product Requirements

## Vision

MarkForge is a modern, fast, local-first Markdown editor and standalone Markdown viewer for Windows and Linux. Windows is the first production target. The writing experience should be calm, readable, and uncluttered, inspired by MarkText's simplicity without copying its visual design or source.

## Product Principles

- Local-first by default. User documents stay on the user's machine.
- Professional desktop behavior: native file workflows, reliable menus, keyboard support, accessible UI, dependable packaging, and predictable updates.
- Clear module ownership. UI components do not own business logic.
- Feature parity is evidence-based. MarkText features must be tracked in `docs/marktext-parity-matrix.md`.
- Originality matters. Functional parity is a target, but MarkForge must have its own architecture, interaction design, theming, converter system, viewer, and local LLM layer.

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

## Local LLM Requirements

- AI assistance is disabled until the user configures a provider.
- Provider interface must support Ollama, llama.cpp, LM Studio, or comparable local backends.
- No document content may be sent to cloud APIs unless a future cloud provider is explicitly configured by the user.
- Model recommendation must be selected at implementation time from current benchmarks and hardware constraints; this repository must not hardcode a stale model choice.
- Features: generate Markdown draft, summarize document, improve clarity, fix formatting, create outline, convert rough notes to structured Markdown, generate tables, suggest headings, and explain Markdown syntax.
- UI must clearly show when local AI is active.

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

## Platform Requirements

- Windows baseline first: installer, file associations, recent documents, update story, shell integration, network paths, high DPI, and keyboard layouts.
- Linux follows after Windows baseline stability: AppImage, deb, rpm, or Flatpak based on packaging research.
- Platform assumptions must be isolated behind `packages/platform`.

## Non-Goals for the First Baseline

- Cloud synchronization.
- Cloud AI providers.
- Collaborative editing.
- Mobile support.
- Full PDF layout reconstruction in PDF-to-Markdown conversion.
- 1:1 MarkText visual clone.

