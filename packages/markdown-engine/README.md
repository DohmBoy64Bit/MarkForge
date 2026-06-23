# packages/markdown-engine

Markdown parsing, rendering, sanitization, TOC extraction, extension handling, diagram integration, and export HTML generation.

Current status: implemented package boundary.

## Public API

- Markdown rendering through Markdown-it with tables, task lists, footnotes, linkification, typographer behavior, and math support.
- Sanitized raw HTML handling with configurable raw HTML parsing.
- Stable heading extraction and generated heading ids.
- YAML/TOML/JSON front matter extraction with structured scalar parsing and invalid JSON warnings.
- Highlight.js-backed fenced-code highlighting for registered languages and explicit warnings for unknown languages.
- Built-in safe Mermaid flowchart rendering for simple graph/flowchart edge syntax.
- Explicit limited-syntax diagram warnings when a diagram fence is outside the built-in safe renderer.
