import { describe, expect, it } from 'vitest'
import {
  applyTemplate,
  applyTemplateVariables,
  filterTemplates,
  getTemplateById,
  searchTemplates,
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
})
