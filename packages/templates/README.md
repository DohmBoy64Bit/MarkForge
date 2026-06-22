# @markforge/templates

Typed Markdown template catalog for MarkForge-owned starter documents.

## Current Scope

- Data-driven catalog entries for README, meeting notes, changelog, project spec, blog post, GitHub issue, pull request, and technical docs.
- Metadata on every template: stable id, title, category, description, tags, Markdown body, and optional variable definitions.
- Filtering helpers for search terms, category, and tags.
- Simple `{{variable}}` replacement helpers with unknown placeholders preserved by default.
- Placeholder extraction, derived variable definitions, template default merging, and custom-template validation/normalization.

## API

```ts
import {
  applyTemplate,
  deriveTemplateVariables,
  filterTemplates,
  mergeTemplateVariables,
  templateCatalog
} from '@markforge/templates'

const template = filterTemplates(templateCatalog, { query: 'github review' })[0]
const fields = deriveTemplateVariables(template)
const variables = mergeTemplateVariables(template, {
  date: '2026-06-21',
  title: 'Release Notes'
})
const markdown = applyTemplate(template, variables)
```

## Deferred

- Filesystem/workspace template loading.
- Syncable user-authored template libraries beyond editor-local storage.
- General autocomplete integration beyond the editor's first `/template` and `/tpl` suggestion surface.
- Template linting and schema validation beyond the typed package surface.
