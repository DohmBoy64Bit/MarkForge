# Phase 6: Templates and Help

Phase 6 starts the MarkForge-owned templates and help track without turning the editor into a docs website or a template wizard.

## Phase 6A Shipped Foundation

- `packages/templates` is active as `@markforge/templates`.
- The package exports a typed starter catalog for README, meeting notes, changelog, project spec, blog post, GitHub issue, pull request, and technical docs.
- Catalog helpers support query/category/tag filtering and simple `{{variable}}` replacement.
- The editor has a compact Templates and Help dialog reachable from the toolbar and the preference-backed `Ctrl+Alt+T` shortcut.
- Template insertion uses the active source document update path and restores the inserted range selection.
- The help tab covers currently supported syntax: headings, emphasis, links, lists, task lists, code fences, tables, front matter, math, diagrams, and raw HTML sanitization.

## Phase 6B Shipped Scope

- Built-in templates now carry typed variable metadata: name, label, default value, description, and required status where useful.
- `@markforge/templates` exports helpers for placeholder extraction, derived variable definitions, default/override merging, and custom-template validation/normalization.
- The Templates and Help dialog now includes guided variable fields for the selected template. The preview updates live and insertion uses the resolved Markdown.
- A Custom tab lets users create local templates with title, category, tags, description, and Markdown body. Entries are stored in `localStorage`, searchable, insertable, deletable, and resettable.
- The source editor has a bounded template suggestion surface. When the current source line starts with `/template` or `/tpl`, MarkForge filters template suggestions by the trigger text; Arrow keys navigate, Enter inserts through the shared template resolver, and Escape closes the menu.
- Helper tests cover variable extraction, default merging, custom-template validation/storage, source trigger detection, and suggestion insertion.

## Deferred

- Syncable or shared user-authored template libraries beyond local browser-profile storage.
- Path-aware/link-aware Markdown autocomplete and richer completion sources beyond the current line-leading Markdown structure suggestions.
- Full documentation website.

## Post-Phase-6 Updates

- The editor now loads workspace templates from `.markforge/templates/*.md` in an opened workspace and folds them into template search, insertion, and `/template` or `/tpl` suggestions.
- General line-leading Markdown slash autocomplete now inserts headings, links, images, tables, front matter, code fences, task lists, and blockquotes through `packages/editor-engine`.
- Converter-backed insertion flows are implemented through the Import Conversion dialog for supported converter inputs.
