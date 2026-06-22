export type TemplateCategory =
  | 'collaboration'
  | 'documentation'
  | 'engineering'
  | 'planning'
  | 'publishing'
  | 'release'

export type MarkdownTemplate = {
  body: string
  category: TemplateCategory
  description: string
  id: string
  tags: string[]
  title: string
}

export type TemplateFilter = {
  category?: TemplateCategory
  query?: string
  tags?: string[]
}

export type TemplateVariables = Record<string, string | number | boolean | null | undefined>

export type ApplyTemplateVariablesOptions = {
  preserveUnknown?: boolean
}

export const templateCatalog: MarkdownTemplate[] = [
  {
    id: 'readme',
    title: 'README',
    category: 'documentation',
    description: 'Project landing page with setup, usage, and contribution notes.',
    tags: ['project', 'overview', 'setup'],
    body: `# {{title}}

{{description}}

## Quick Start

\`\`\`sh
{{install_command}}
\`\`\`

## Usage

- Describe the main workflow.
- Link to deeper documentation.
- Note supported platforms.

## Development

- Run tests before submitting changes.
- Keep examples current with released behavior.

## License

{{license}}
`
  },
  {
    id: 'meeting-notes',
    title: 'Meeting Notes',
    category: 'collaboration',
    description: 'Agenda, decisions, and action items for working sessions.',
    tags: ['notes', 'agenda', 'actions'],
    body: `# {{title}} Meeting Notes

Date: {{date}}
Facilitator: {{owner}}

## Agenda

- Topic one
- Topic two

## Decisions

- Decision:

## Action Items

- [ ] Owner - Follow-up

## Notes

-
`
  },
  {
    id: 'changelog',
    title: 'Changelog',
    category: 'release',
    description: 'Keep user-visible changes grouped by release.',
    tags: ['release', 'version', 'history'],
    body: `# Changelog

All notable changes to {{title}} are documented here.

## {{version}} - {{date}}

### Added

- 

### Changed

- 

### Fixed

- 
`
  },
  {
    id: 'project-spec',
    title: 'Project Spec',
    category: 'planning',
    description: 'Scope, goals, constraints, and delivery checkpoints.',
    tags: ['spec', 'planning', 'requirements'],
    body: `# {{title}} Project Spec

Owner: {{owner}}
Status: Draft

## Problem

What user or business problem does this solve?

## Goals

- 

## Non-Goals

- 

## Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| R1 |  | Must |

## Risks

- 

## Milestones

- [ ] Discovery
- [ ] Implementation
- [ ] Verification
`
  },
  {
    id: 'blog-post',
    title: 'Blog Post',
    category: 'publishing',
    description: 'Front matter and article structure for a technical post.',
    tags: ['article', 'front matter', 'publishing'],
    body: `---
title: "{{title}}"
date: "{{date}}"
tags:
  - markdown
---

# {{title}}

Start with the reader's context and the promise of the post.

## Why It Matters

Explain the practical problem.

## Walkthrough

1. First step
2. Second step
3. Result

## Takeaways

- 
`
  },
  {
    id: 'github-issue',
    title: 'GitHub Issue',
    category: 'collaboration',
    description: 'Bug or task report with expected behavior and acceptance checks.',
    tags: ['github', 'issue', 'bug'],
    body: `## Summary

{{description}}

## Steps to Reproduce

1. 
2. 
3. 

## Expected Behavior


## Actual Behavior


## Acceptance Criteria

- [ ] 
- [ ] 
`
  },
  {
    id: 'pull-request',
    title: 'Pull Request',
    category: 'collaboration',
    description: 'Concise PR summary with testing and risk notes.',
    tags: ['github', 'review', 'changes'],
    body: `## Summary

- 

## Testing

- [ ] Unit tests
- [ ] Manual verification

## Risk

- 

## Screenshots

N/A
`
  },
  {
    id: 'technical-docs',
    title: 'Technical Docs',
    category: 'engineering',
    description: 'Reference page for architecture, API, or operational notes.',
    tags: ['technical', 'api', 'reference'],
    body: `# {{title}}

## Overview

Describe the system, API, or workflow.

## Architecture

\`\`\`mermaid
flowchart LR
  User --> Interface
  Interface --> Service
  Service --> Data
\`\`\`

## API

| Name | Type | Description |
| --- | --- | --- |
|  |  |  |

## Examples

\`\`\`ts
const example = true
\`\`\`

## Operational Notes

- 
`
  }
]

export const templateCategories = Array.from(
  new Set(templateCatalog.map(template => template.category))
).sort() as TemplateCategory[]

export function getTemplateById(id: string): MarkdownTemplate | null {
  return templateCatalog.find(template => template.id === id) ?? null
}

export function filterTemplates(templates: MarkdownTemplate[], filter: TemplateFilter = {}): MarkdownTemplate[] {
  const queryTerms = searchTerms(filter.query ?? '')
  const requiredTags = (filter.tags ?? []).map(tag => tag.toLowerCase())

  return templates.filter(template => {
    if (filter.category && template.category !== filter.category) return false

    const templateTags = template.tags.map(tag => tag.toLowerCase())
    if (requiredTags.length > 0 && !requiredTags.every(tag => templateTags.includes(tag))) return false

    if (queryTerms.length === 0) return true

    const haystack = templateSearchText(template)
    return queryTerms.every(term => haystack.includes(term))
  })
}

export function searchTemplates(query: string, templates: MarkdownTemplate[] = templateCatalog): MarkdownTemplate[] {
  return filterTemplates(templates, { query })
}

export function applyTemplateVariables(
  body: string,
  variables: TemplateVariables = {},
  options: ApplyTemplateVariablesOptions = {}
): string {
  const preserveUnknown = options.preserveUnknown ?? true

  return body.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (placeholder, key: string) => {
    const value = variables[key]

    if (value === undefined || value === null) return preserveUnknown ? placeholder : ''

    return String(value)
  })
}

export function applyTemplate(
  template: MarkdownTemplate,
  variables: TemplateVariables = {},
  options?: ApplyTemplateVariablesOptions
): string {
  return applyTemplateVariables(template.body, variables, options)
}

function templateSearchText(template: MarkdownTemplate): string {
  return [
    template.id,
    template.title,
    template.category,
    template.description,
    ...template.tags,
    template.body
  ].join(' ').toLowerCase()
}

function searchTerms(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
}
