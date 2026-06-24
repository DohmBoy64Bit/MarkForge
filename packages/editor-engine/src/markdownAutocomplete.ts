export type MarkdownAutocompleteTrigger = {
  end: number
  query: string
  start: number
}

export type MarkdownAutocompleteSuggestion = {
  description: string
  id: string
  insertText: string
  label: string
  searchTerms: string[]
}

export type MarkdownAutocompleteEdit = {
  selectionEnd: number
  selectionStart: number
  text: string
}

export type MarkdownPathAutocompleteTrigger = {
  end: number
  isImage: boolean
  query: string
  start: number
}

export type MarkdownPathAutocompleteEntry = {
  isDirectory?: boolean
  path: string
  relativePath?: string
}

export type MarkdownPathAutocompleteSuggestion = {
  id: string
  insertText: string
  label: string
}

export const markdownAutocompleteSuggestions: MarkdownAutocompleteSuggestion[] = [
  {
    id: 'heading',
    label: 'Heading',
    description: 'Insert a section heading',
    insertText: '# Heading',
    searchTerms: ['heading', 'title', 'h1']
  },
  {
    id: 'link',
    label: 'Link',
    description: 'Insert a Markdown link',
    insertText: '[label](https://example.com)',
    searchTerms: ['link', 'url', 'anchor']
  },
  {
    id: 'image',
    label: 'Image',
    description: 'Insert an image reference',
    insertText: '![alt text](image.png)',
    searchTerms: ['image', 'picture', 'asset', 'path']
  },
  {
    id: 'table',
    label: 'Table',
    description: 'Insert a starter table',
    insertText: '| Name | Value |\n| --- | --- |\n| Item | Detail |',
    searchTerms: ['table', 'grid', 'columns']
  },
  {
    id: 'front-matter',
    label: 'Front matter',
    description: 'Insert a YAML metadata block',
    insertText: '---\ntitle: Untitled\nstatus: draft\n---',
    searchTerms: ['front matter', 'metadata', 'yaml']
  },
  {
    id: 'code-fence',
    label: 'Code fence',
    description: 'Insert a fenced code block',
    insertText: '```text\ncode\n```',
    searchTerms: ['code', 'fence', 'block']
  },
  {
    id: 'task-list',
    label: 'Task list',
    description: 'Insert a task list item',
    insertText: '- [ ] Task',
    searchTerms: ['task', 'checkbox', 'todo']
  },
  {
    id: 'quote',
    label: 'Blockquote',
    description: 'Insert a quoted block',
    insertText: '> Quote',
    searchTerms: ['quote', 'blockquote', 'callout']
  }
]

export function findMarkdownAutocompleteTrigger(source: string, cursor: number): MarkdownAutocompleteTrigger | null {
  const caret = Math.max(0, Math.min(cursor, source.length))
  const lineStart = source.lastIndexOf('\n', caret - 1) + 1
  const lineBeforeCursor = source.slice(lineStart, caret)
  const triggerMatch = lineBeforeCursor.match(/^(\s*)\/([^\n]*)$/)

  if (!triggerMatch) return null

  const query = triggerMatch[2].trim()
  if (/^(template|tpl)(\s|$)/i.test(query)) return null

  return {
    start: lineStart + triggerMatch[1].length,
    end: caret,
    query
  }
}

export function filterMarkdownAutocompleteSuggestions(
  query: string,
  limit = 8
): MarkdownAutocompleteSuggestion[] {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) return markdownAutocompleteSuggestions.slice(0, limit)

  return markdownAutocompleteSuggestions
    .filter(suggestion => {
      const haystack = [
        suggestion.id,
        suggestion.label,
        suggestion.description,
        ...suggestion.searchTerms
      ].join(' ').toLowerCase()

      return haystack.includes(normalizedQuery)
    })
    .slice(0, limit)
}

export function replaceMarkdownAutocompleteTrigger(
  source: string,
  trigger: MarkdownAutocompleteTrigger,
  suggestion: MarkdownAutocompleteSuggestion
): MarkdownAutocompleteEdit {
  const start = Math.max(0, Math.min(trigger.start, source.length))
  const end = Math.max(start, Math.min(trigger.end, source.length))
  const text = `${source.slice(0, start)}${suggestion.insertText}${source.slice(end)}`
  const selectionStart = start
  const selectionEnd = start + suggestion.insertText.length

  return {
    selectionEnd,
    selectionStart,
    text
  }
}

export function findMarkdownPathAutocompleteTrigger(source: string, cursor: number): MarkdownPathAutocompleteTrigger | null {
  const caret = Math.max(0, Math.min(cursor, source.length))
  const beforeCursor = source.slice(0, caret)
  const imageMatch = /!\[[^\]\n]*]\(([^)\n]*)$/.exec(beforeCursor)
  const linkMatch = /(?<!!)\[[^\]\n]*]\(([^)\n]*)$/.exec(beforeCursor)
  const match = imageMatch ?? linkMatch

  if (!match) return null

  const query = match[1]
  if (/^[a-z][a-z0-9+.-]*:/i.test(query) || query.startsWith('#')) return null

  return {
    start: caret - query.length,
    end: caret,
    query,
    isImage: Boolean(imageMatch)
  }
}

export function filterMarkdownPathSuggestions(
  trigger: MarkdownPathAutocompleteTrigger,
  entries: MarkdownPathAutocompleteEntry[],
  limit = 8
): MarkdownPathAutocompleteSuggestion[] {
  const normalizedQuery = normalizePathForSearch(trigger.query)
  const imageExtensions = new Set(['avif', 'gif', 'jpeg', 'jpg', 'png', 'svg', 'webp'])

  return entries
    .map(entry => {
      const insertText = normalizePathForInsert(entry.relativePath ?? entry.path)
      const extension = extensionOf(insertText)
      return {
        entry,
        insertText,
        extension,
        searchText: normalizePathForSearch(insertText)
      }
    })
    .filter(item => !trigger.isImage || item.entry.isDirectory || imageExtensions.has(item.extension))
    .filter(item => !normalizedQuery || item.searchText.includes(normalizedQuery))
    .sort((first, second) => first.insertText.localeCompare(second.insertText))
    .slice(0, limit)
    .map(item => ({
      id: item.insertText,
      insertText: item.insertText,
      label: item.insertText
    }))
}

export function replaceMarkdownPathTrigger(
  source: string,
  trigger: MarkdownPathAutocompleteTrigger,
  suggestion: MarkdownPathAutocompleteSuggestion
): MarkdownAutocompleteEdit {
  const start = Math.max(0, Math.min(trigger.start, source.length))
  const end = Math.max(start, Math.min(trigger.end, source.length))
  const text = `${source.slice(0, start)}${suggestion.insertText}${source.slice(end)}`
  const selection = start + suggestion.insertText.length

  return {
    selectionEnd: selection,
    selectionStart: selection,
    text
  }
}

function normalizePathForSearch(value: string): string {
  return value.replace(/\\/g, '/').toLowerCase()
}

function normalizePathForInsert(value: string): string {
  return value.replace(/\\/g, '/').replace(/^\.\//, '')
}

function extensionOf(value: string): string {
  const last = value.split('/').pop() ?? value
  const index = last.lastIndexOf('.')
  return index >= 0 ? last.slice(index + 1).toLowerCase() : ''
}
