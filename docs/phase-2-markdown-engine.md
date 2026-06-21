# Phase 2 Markdown Engine

Date: 2026-06-21

Phase 2 turns `packages/markdown-engine` from a proof-of-concept renderer into an explicit contract that the editor and future viewer can depend on.

## Implemented

- `renderMarkdown(source, options)` returns sanitized HTML, body text, headings, front matter, and warnings.
- `parseFrontMatter(source)` extracts YAML, TOML, and JSON-style front matter blocks.
- Simple structured front matter parsing for YAML/TOML key-value pairs.
- JSON front matter parsing with warnings on invalid JSON.
- Stable prefixed heading IDs and duplicate slug handling.
- Common Markdown rendering with GFM-style tables, task lists, and footnotes.
- Code highlighting through `highlight.js` with a curated language registry.
- KaTeX math rendering through the markdown-it KaTeX plugin.
- Explicit warnings for unknown code languages and deferred diagram fences such as Mermaid, PlantUML, Vega, and Vega-Lite.
- Sanitization keeps raw HTML behind render options and strips unsafe script/link behavior.

## Verification

Commands run successfully:

```bash
pnpm test
pnpm build:editor
cargo check
pnpm docs:check
```

`pnpm build:editor` currently reports a Vite chunk-size warning. That is expected after adding KaTeX and syntax highlighting. A later performance slice should split the markdown engine/highlighter path or lazy-load heavier renderers.

## Still Deferred

- Full CommonMark/GFM conformance fixture import.
- Full YAML/TOML parsing through dedicated parsers.
- Mermaid/PlantUML/Vega rendering.
- Code highlighter theme integration through `packages/theme-engine`.
- Viewer app integration.
