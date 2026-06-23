# Phase 2 Markdown Engine

Date: 2026-06-21

Phase 2 turned `packages/markdown-engine` from a proof-of-concept renderer into an explicit contract that the editor and viewer now depend on. This page is historical; the current status below includes later remediation where relevant.

## Implemented

- `renderMarkdown(source, options)` returns sanitized HTML, body text, headings, front matter, and warnings.
- `parseFrontMatter(source)` extracts YAML, TOML, and JSON-style front matter blocks.
- Simple structured front matter parsing for YAML/TOML key-value pairs.
- JSON front matter parsing with warnings on invalid JSON.
- Stable prefixed heading IDs and duplicate slug handling.
- Common Markdown rendering with GFM-style tables, task lists, and footnotes.
- Code highlighting through `highlight.js` with a curated language registry.
- KaTeX math rendering through the markdown-it KaTeX plugin.
- Explicit warnings for unknown code languages and unsupported diagram fences. Later remediation added safe built-in rendering for simple Mermaid graph/flowchart fences; broader Mermaid syntax, PlantUML, Vega, and Vega-Lite still render as source with warnings.
- Sanitization keeps raw HTML behind render options and strips unsafe script/link behavior.

## Verification

Commands run successfully:

```bash
pnpm test
pnpm build:editor
cargo check
pnpm docs:check
```

The renderer bundles are split into app, React, icon, and markdown/rendering chunks. `pnpm bundle:check` enforces a 500 KiB JavaScript asset ceiling so markdown/highlighter growth does not silently reintroduce the previous Vite chunk-size warning.

## Still Deferred

- Full CommonMark/GFM conformance fixture import.
- Full YAML/TOML parsing through dedicated parsers.
- Broader diagram runtimes and syntax coverage beyond the safe built-in Mermaid graph/flowchart subset.
- Code highlighter theme integration through `packages/theme-engine`.
