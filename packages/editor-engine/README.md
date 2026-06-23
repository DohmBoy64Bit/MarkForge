# packages/editor-engine

Editing behavior, source/realtime/split mode adapters, autocomplete, block insertion, table tools, image tools, and formatting actions.

Current implemented surface:

- Typed source-mode Markdown command registry.
- Selection-aware text transforms for inline formatting, headings, line prefixes, block wrappers, and block insertion.
- Editor-facing Markdown preview rendering API that routes preview work through `packages/markdown-engine`.
- Template catalog/types/custom-template normalization re-exports that let the editor shell avoid direct template package imports.
- Package-owned `/template` and `/tpl` autocomplete trigger detection, filtering, resolution, and source replacement helpers.
