import { describe, expect, it } from 'vitest'
import {
  filterTemplateSuggestions,
  findTemplateSuggestionTrigger,
  replaceTemplateTrigger,
  resolveTemplateSuggestion,
  templateCatalog
} from './index'

describe('template autocomplete helpers', () => {
  it('detects /template and /tpl triggers at the start of the current line', () => {
    expect(findTemplateSuggestionTrigger('Intro\n/template read', 'Intro\n/template read'.length)).toEqual({
      start: 6,
      end: 20,
      query: 'read'
    })
    expect(findTemplateSuggestionTrigger('  /tpl github', '  /tpl github'.length)).toEqual({
      start: 2,
      end: 13,
      query: 'github'
    })
  })

  it('ignores triggers that are not line-leading commands', () => {
    expect(findTemplateSuggestionTrigger('paragraph /tpl read', 'paragraph /tpl read'.length)).toBeNull()
    expect(findTemplateSuggestionTrigger('/template read\nnext', '/template read\nnext'.length)).toBeNull()
  })

  it('filters suggestions and resolves through the shared template path', () => {
    const suggestions = filterTemplateSuggestions(templateCatalog, 'github')

    expect(suggestions.map(template => template.id)).toEqual(['github-issue', 'pull-request'])
    expect(resolveTemplateSuggestion(suggestions[0], { description: 'Crash on launch' })).toContain('Crash on launch')
  })

  it('replaces the trigger range with resolved Markdown', () => {
    const source = 'Before\n/template readme\nAfter'
    const trigger = findTemplateSuggestionTrigger(source, 'Before\n/template readme'.length)

    expect(trigger).not.toBeNull()
    expect(replaceTemplateTrigger(source, trigger!, '# MarkForge')).toEqual({
      selectionStart: 7,
      selectionEnd: 18,
      text: 'Before\n# MarkForge\nAfter'
    })
  })
})
