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
  variables?: TemplateVariableDefinition[]
}

export type TemplateFilter = {
  category?: TemplateCategory
  query?: string
  tags?: string[]
}

export type TemplateVariables = Record<string, string | number | boolean | null | undefined>

export type TemplateVariableDefinition = {
  defaultValue?: string
  description?: string
  label: string
  name: string
  required?: boolean
}

export type ApplyTemplateVariablesOptions = {
  preserveUnknown?: boolean
}

export type NormalizeCustomTemplateInput = Omit<Partial<MarkdownTemplate>, 'category' | 'tags' | 'variables'> & {
  body?: string
  category?: TemplateCategory | string
  description?: string
  id?: string
  tags?: string[] | string
  title?: string
  variables?: TemplateVariableDefinition[]
}

export type WorkspaceTemplateFile = {
  body: string
  path: string
  relativePath: string
}

export type NormalizedCustomTemplateResult =
  | { errors: string[]; template: null }
  | { errors: []; template: MarkdownTemplate }

const templateCategoriesSet = new Set<TemplateCategory>([
  'collaboration',
  'documentation',
  'engineering',
  'planning',
  'publishing',
  'release'
])

export const templateCatalog: MarkdownTemplate[] = [
  {
    id: 'readme',
    title: 'README',
    category: 'documentation',
    description: 'Project landing page with setup, usage, and contribution notes.',
    tags: ['project', 'overview', 'setup'],
    variables: [
      {
        name: 'title',
        label: 'Project title',
        defaultValue: 'Project Name',
        description: 'The name shown as the README heading.',
        required: true
      },
      {
        name: 'description',
        label: 'Description',
        defaultValue: 'A concise project description.',
        description: 'A short summary of what the project does.',
        required: true
      },
      {
        name: 'install_command',
        label: 'Install command',
        defaultValue: 'pnpm install',
        description: 'The shell command readers should run first.',
        required: true
      },
      {
        name: 'license',
        label: 'License',
        defaultValue: 'TBD',
        description: 'The license identifier or status.',
        required: false
      }
    ],
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
    variables: [
      {
        name: 'title',
        label: 'Meeting title',
        defaultValue: 'Team Sync',
        description: 'The meeting name shown in the heading.',
        required: true
      },
      {
        name: 'date',
        label: 'Date',
        defaultValue: '',
        description: 'Meeting date in your preferred format.',
        required: true
      },
      {
        name: 'owner',
        label: 'Facilitator',
        defaultValue: '',
        description: 'The person guiding the meeting.',
        required: false
      }
    ],
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
    variables: [
      {
        name: 'title',
        label: 'Project title',
        defaultValue: 'Project Name',
        description: 'The project or product name.',
        required: true
      },
      {
        name: 'version',
        label: 'Version',
        defaultValue: 'Unreleased',
        description: 'The release version or channel.',
        required: true
      },
      {
        name: 'date',
        label: 'Date',
        defaultValue: '',
        description: 'Release date or target date.',
        required: false
      }
    ],
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
    variables: [
      {
        name: 'title',
        label: 'Project title',
        defaultValue: 'Project Name',
        description: 'The initiative or project name.',
        required: true
      },
      {
        name: 'owner',
        label: 'Owner',
        defaultValue: '',
        description: 'The accountable owner or team.',
        required: false
      }
    ],
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
    variables: [
      {
        name: 'title',
        label: 'Post title',
        defaultValue: 'Post Title',
        description: 'The front matter and H1 title.',
        required: true
      },
      {
        name: 'date',
        label: 'Date',
        defaultValue: '',
        description: 'Publication date.',
        required: false
      }
    ],
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
    variables: [
      {
        name: 'description',
        label: 'Summary',
        defaultValue: 'Describe the issue or task.',
        description: 'A short problem summary.',
        required: true
      }
    ],
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
  return applyTemplateVariables(template.body, mergeTemplateVariables(template, variables), options)
}

export function extractTemplatePlaceholders(body: string): string[] {
  const names = new Set<string>()
  const pattern = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g
  let match: RegExpExecArray | null

  while ((match = pattern.exec(body)) !== null) {
    names.add(match[1])
  }

  return Array.from(names)
}

export function deriveTemplateVariables(
  template: Pick<MarkdownTemplate, 'body' | 'variables'>
): TemplateVariableDefinition[] {
  const explicitVariables = template.variables ?? []
  const definitionsByName = new Map(explicitVariables.map(definition => [definition.name, normalizeVariableDefinition(definition)]))

  for (const name of extractTemplatePlaceholders(template.body)) {
    if (!definitionsByName.has(name)) {
      definitionsByName.set(name, {
        name,
        label: labelFromVariableName(name),
        defaultValue: '',
        description: `Value for {{${name}}}.`,
        required: false
      })
    }
  }

  return Array.from(definitionsByName.values())
}

export function mergeTemplateVariables(
  template: Pick<MarkdownTemplate, 'body' | 'variables'>,
  overrides: TemplateVariables = {}
): TemplateVariables {
  const merged: TemplateVariables = {}

  for (const definition of deriveTemplateVariables(template)) {
    if (definition.defaultValue !== undefined) merged[definition.name] = definition.defaultValue
  }

  return {
    ...merged,
    ...overrides
  }
}

export function normalizeCustomTemplate(input: NormalizeCustomTemplateInput): NormalizedCustomTemplateResult {
  const errors: string[] = []
  const title = String(input.title ?? '').trim()
  const body = String(input.body ?? '').trim()
  const description = String(input.description ?? '').trim()
  const category = normalizeCategory(input.category)
  const tags = normalizeTags(input.tags)

  if (!title) errors.push('Title is required.')
  if (!body) errors.push('Markdown body is required.')
  if (!category) errors.push('Category must be one of the built-in template categories.')

  if (errors.length > 0 || !category) return { errors, template: null }

  const id = normalizeTemplateId(input.id, title)
  const template: MarkdownTemplate = {
    id,
    title,
    category,
    description: description || 'Local custom template.',
    tags,
    body,
    variables: deriveTemplateVariables({
      body,
      variables: input.variables?.map(normalizeVariableDefinition)
    })
  }

  return { errors: [], template }
}

export function isWorkspaceTemplatePath(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, '/').toLowerCase()
  return normalized.startsWith('.markforge/templates/') && normalized.endsWith('.md')
}

export function workspaceTemplateFromFile(file: WorkspaceTemplateFile): MarkdownTemplate {
  const title = titleFromWorkspaceTemplate(file.body, file.relativePath)
  const id = `workspace-${slugFromPath(file.relativePath)}`

  return {
    id,
    title,
    category: 'documentation',
    description: `Workspace template from ${file.relativePath}.`,
    tags: ['workspace'],
    body: file.body,
    variables: deriveTemplateVariables({ body: file.body })
  }
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

function normalizeVariableDefinition(definition: TemplateVariableDefinition): TemplateVariableDefinition {
  return {
    name: definition.name.trim(),
    label: definition.label.trim() || labelFromVariableName(definition.name),
    defaultValue: definition.defaultValue ?? '',
    description: definition.description?.trim() || `Value for {{${definition.name}}}.`,
    required: Boolean(definition.required)
  }
}

function labelFromVariableName(name: string): string {
  return name
    .replace(/[_.-]+/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase())
}

function normalizeCategory(category: NormalizeCustomTemplateInput['category']): TemplateCategory | null {
  if (typeof category !== 'string') return 'documentation'

  const normalized = category.trim().toLowerCase()
  return templateCategoriesSet.has(normalized as TemplateCategory) ? normalized as TemplateCategory : null
}

function normalizeTags(tags: NormalizeCustomTemplateInput['tags']): string[] {
  const rawTags = Array.isArray(tags) ? tags : String(tags ?? '').split(',')
  const uniqueTags = new Set<string>()

  for (const tag of rawTags) {
    const normalized = String(tag).trim().toLowerCase()
    if (normalized) uniqueTags.add(normalized)
  }

  return Array.from(uniqueTags)
}

function normalizeTemplateId(id: string | undefined, title: string): string {
  const source = id?.trim() || title
  if (source.startsWith('custom-')) return source

  const slug = source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug ? `custom-${slug}` : `custom-${Date.now()}`
}

function titleFromWorkspaceTemplate(body: string, relativePath: string): string {
  const heading = body.split(/\r?\n/).find(line => /^#\s+\S/.test(line))
  if (heading) return heading.replace(/^#\s+/, '').trim()

  const fileName = relativePath.split(/[\\/]/).pop()?.replace(/\.md$/i, '') ?? 'Workspace Template'
  return labelFromVariableName(fileName)
}

function slugFromPath(relativePath: string): string {
  const slug = relativePath
    .toLowerCase()
    .replace(/\\/g, '/')
    .replace(/^\.markforge\/templates\//, '')
    .replace(/\.md$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'template'
}
