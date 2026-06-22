import {
  applyTemplate,
  filterTemplates,
  type MarkdownTemplate,
  type TemplateVariables
} from '@markforge/templates'

export type TemplateSuggestionTrigger = {
  end: number
  query: string
  start: number
}

export type TemplateInsertionEdit = {
  selectionEnd: number
  selectionStart: number
  text: string
}

export function findTemplateSuggestionTrigger(source: string, cursor: number): TemplateSuggestionTrigger | null {
  const caret = Math.max(0, Math.min(cursor, source.length))
  const lineStart = source.lastIndexOf('\n', caret - 1) + 1
  const lineBeforeCursor = source.slice(lineStart, caret)
  const triggerMatch = lineBeforeCursor.match(/^(\s*)\/(template|tpl)(?:\s+([^\n]*))?$/i)

  if (!triggerMatch) return null

  return {
    start: lineStart + triggerMatch[1].length,
    end: caret,
    query: (triggerMatch[3] ?? '').trim()
  }
}

export function filterTemplateSuggestions(
  templates: MarkdownTemplate[],
  query: string,
  limit = 7
): MarkdownTemplate[] {
  return filterTemplates(templates, { query }).slice(0, limit)
}

export function resolveTemplateSuggestion(
  template: MarkdownTemplate,
  variables: TemplateVariables
): string {
  return applyTemplate(template, variables)
}

export function replaceTemplateTrigger(
  source: string,
  trigger: TemplateSuggestionTrigger,
  insertion: string
): TemplateInsertionEdit {
  const start = Math.max(0, Math.min(trigger.start, source.length))
  const end = Math.max(start, Math.min(trigger.end, source.length))
  const text = `${source.slice(0, start)}${insertion}${source.slice(end)}`
  const selectionStart = start
  const selectionEnd = start + insertion.length

  return {
    selectionStart,
    selectionEnd,
    text
  }
}
