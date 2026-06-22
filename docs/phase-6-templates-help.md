# Phase 6: Templates and Help

Phase 6 starts the MarkForge-owned templates and help track without turning the editor into a docs website or a template wizard.

## Phase 6A Shipped Foundation

- `packages/templates` is active as `@markforge/templates`.
- The package exports a typed starter catalog for README, meeting notes, changelog, project spec, blog post, GitHub issue, pull request, and technical docs.
- Catalog helpers support query/category/tag filtering and simple `{{variable}}` replacement.
- The editor has a compact Templates and Help dialog reachable from the toolbar and the preference-backed `Ctrl+Alt+T` shortcut.
- Template insertion uses the active source document update path and restores the inserted range selection.
- The help tab covers currently supported syntax: headings, emphasis, links, lists, task lists, code fences, tables, front matter, math, diagrams, and raw HTML sanitization.

## Deferred

- Guided variable forms.
- User-authored template libraries.
- Template autocomplete in the source editor.
- Full documentation website.
- Converter-backed insertion flows.
