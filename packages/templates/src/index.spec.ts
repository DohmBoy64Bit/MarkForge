import { describe, expect, it } from 'vitest'
import {
  applyTemplate,
  applyTemplateVariables,
  deriveTemplateVariables,
  extractTemplatePlaceholders,
  filterTemplates,
  getTemplateById,
  isWorkspaceTemplatePath,
  mergeTemplateVariables,
  normalizeCustomTemplate,
  searchTemplates,
  workspaceTemplateFromFile,
  templateCatalog,
  templateCategories
} from './index'

describe('@markforge/templates', () => {
  it('ships the required foundational catalog entries with metadata and Markdown bodies', () => {
    expect(templateCatalog.map(template => template.id)).toEqual([
      'readme',
      'meeting-notes',
      'changelog',
      'project-spec',
      'blog-post',
      'github-issue',
      'pull-request',
      'technical-docs'
    ])

    for (const template of templateCatalog) {
      expect(template.title).not.toBe('')
      expect(template.description).not.toBe('')
      expect(template.tags.length).toBeGreaterThan(0)
      expect(template.body).toContain('#')
    }

    expect(templateCategories).toContain('documentation')
    expect(templateCategories).toContain('collaboration')
  })

  it('finds templates by query, category, and tag filters', () => {
    expect(searchTemplates('github review').map(template => template.id)).toEqual(['pull-request'])
    expect(filterTemplates(templateCatalog, { category: 'collaboration' }).map(template => template.id)).toEqual([
      'meeting-notes',
      'github-issue',
      'pull-request'
    ])
    expect(filterTemplates(templateCatalog, { tags: ['front matter'] }).map(template => template.id)).toEqual(['blog-post'])
    expect(filterTemplates(templateCatalog, { category: 'engineering', query: 'mermaid api' }).map(template => template.id)).toEqual([
      'technical-docs'
    ])
  })

  it('looks up templates by stable id', () => {
    expect(getTemplateById('readme')?.title).toBe('README')
    expect(getTemplateById('missing')).toBeNull()
  })

  it('applies simple variables while preserving unknown placeholders by default', () => {
    expect(applyTemplateVariables('# {{ title }}\n{{missing}}', { title: 'Launch Plan' })).toBe('# Launch Plan\n{{missing}}')
    expect(applyTemplateVariables('{{missing}}', {}, { preserveUnknown: false })).toBe('')
  })

  it('extracts unique placeholder names in first-seen order', () => {
    expect(extractTemplatePlaceholders('{{ title }} {{owner}}\n{{title}}\n{{front-matter.value}}')).toEqual([
      'title',
      'owner',
      'front-matter.value'
    ])
  })

  it('derives missing variable definitions from template bodies', () => {
    expect(deriveTemplateVariables({
      body: '# {{title}}\nOwner: {{owner}}',
      variables: [
        {
          name: 'title',
          label: 'Document title',
          defaultValue: 'Plan',
          description: 'Heading text.',
          required: true
        }
      ]
    })).toEqual([
      {
        name: 'title',
        label: 'Document title',
        defaultValue: 'Plan',
        description: 'Heading text.',
        required: true
      },
      {
        name: 'owner',
        label: 'Owner',
        defaultValue: '',
        description: 'Value for {{owner}}.',
        required: false
      }
    ])
  })

  it('merges template defaults with caller overrides', () => {
    const readme = getTemplateById('readme')

    expect(readme).not.toBeNull()
    expect(mergeTemplateVariables(readme!, { title: 'MarkForge' })).toMatchObject({
      title: 'MarkForge',
      description: 'A concise project description.',
      install_command: 'pnpm install',
      license: 'TBD'
    })
  })

  it('applies variables to catalog templates', () => {
    const readme = getTemplateById('readme')

    expect(readme).not.toBeNull()
    expect(applyTemplate(readme!, {
      description: 'A local-first Markdown editor.',
      install_command: 'pnpm install',
      license: 'MIT',
      title: 'MarkForge'
    })).toContain('A local-first Markdown editor.')
  })

  it('normalizes valid custom templates with derived variables', () => {
    const result = normalizeCustomTemplate({
      title: 'Runbook',
      category: 'engineering',
      description: 'Incident response notes.',
      tags: 'ops, incident, ops',
      body: '# {{service}}\nOwner: {{owner}}'
    })

    expect(result.errors).toEqual([])
    expect(result.template).toMatchObject({
      id: 'custom-runbook',
      title: 'Runbook',
      category: 'engineering',
      tags: ['ops', 'incident']
    })
    expect(result.template?.variables?.map(variable => variable.name)).toEqual(['service', 'owner'])
  })

  it('recognizes and normalizes workspace template files', () => {
    expect(isWorkspaceTemplatePath('.markforge/templates/runbook.md')).toBe(true)
    expect(isWorkspaceTemplatePath('docs/runbook.md')).toBe(false)

    const template = workspaceTemplateFromFile({
      body: '# Release Runbook\n\nShip {{version}} with {{owner}}.',
      path: 'C:/repo/.markforge/templates/runbook.md',
      relativePath: '.markforge/templates/runbook.md'
    })

    expect(template).toMatchObject({
      id: 'workspace-runbook',
      title: 'Release Runbook',
      category: 'documentation',
      tags: ['workspace']
    })
    expect(template.variables?.map(variable => variable.name)).toEqual(['version', 'owner'])
  })

  it('rejects invalid custom templates with actionable errors', () => {
    const result = normalizeCustomTemplate({
      title: '',
      category: 'not-real',
      body: ''
    })

    expect(result.template).toBeNull()
    expect(result.errors).toEqual([
      'Title is required.',
      'Markdown body is required.',
      'Category must be one of the built-in template categories.'
    ])
  })
})
