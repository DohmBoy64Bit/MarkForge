# @markforge/templates

Typed Markdown template catalog for MarkForge-owned starter documents.

## Current Scope

- Data-driven catalog entries for README, meeting notes, changelog, project spec, blog post, GitHub issue, pull request, and technical docs.
- Metadata on every template: stable id, title, category, description, tags, and Markdown body.
- Filtering helpers for search terms, category, and tags.
- Simple `{{variable}}` replacement helpers with unknown placeholders preserved by default.

## API

```ts
import {
  applyTemplate,
  filterTemplates,
  templateCatalog
} from '@markforge/templates'

const template = filterTemplates(templateCatalog, { query: 'github review' })[0]
const markdown = applyTemplate(template, {
  date: '2026-06-21',
  title: 'Release Notes'
})
```

## Deferred

- Template variable wizard.
- Workspace/user-authored template storage.
- Autocomplete integration.
- Template linting and schema validation beyond the typed package surface.
