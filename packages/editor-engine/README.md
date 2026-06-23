# packages/editor-engine

Editing behavior, source/realtime/split mode adapters, autocomplete, block insertion, table tools, image tools, and formatting actions.

Current implemented surface:

- Typed source-mode Markdown command registry.
- Selection-aware text transforms for inline formatting, headings, line prefixes, block wrappers, image insertion, table row insertion, line deletion, duplication, document formatting, and block insertion.
- Shared Markdown insertion helpers for converter and Local AI result placement.
- Source search, replace-current, replace-all, regex, whole-word, case-sensitive matching, and match-snippet helpers.
- Editor-facing Markdown preview rendering API that routes preview work through `packages/markdown-engine`.
- Template catalog/types/custom-template normalization re-exports that let the editor shell avoid direct template package imports.
- Package-owned `/template` and `/tpl` autocomplete trigger detection, filtering, resolution, and source replacement helpers.
- Package-owned general slash autocomplete for headings, links, images, tables, front matter, code fences, task lists, and blockquotes.
