export type SourceSearchOptions = {
  caseSensitive: boolean
  regex: boolean
  wholeWord: boolean
}

export type SourceSearchMatch = {
  column: number
  end: number
  line: number
  start: number
  text: string
}

export type SourceSearchResult = {
  error: string | null
  matches: SourceSearchMatch[]
}

export const defaultSearchOptions: SourceSearchOptions = {
  caseSensitive: false,
  regex: false,
  wholeWord: false
}

export function findSourceMatches(
  source: string,
  query: string,
  options: SourceSearchOptions = defaultSearchOptions
): SourceSearchResult {
  const expression = createSearchExpression(query, options)

  if (!expression.value) return { error: expression.error, matches: [] }

  const matches: SourceSearchMatch[] = []

  for (const match of source.matchAll(expression.value)) {
    const text = match[0]
    if (!text) continue

    matches.push(matchFromRange(source, match.index ?? 0, text.length))
  }

  return { error: null, matches }
}

export function replaceCurrentSourceMatch(
  source: string,
  query: string,
  replacement: string,
  options: SourceSearchOptions,
  match: SourceSearchMatch | undefined
): { error: string | null; replacementLength: number; text: string } {
  const expression = createSearchExpression(query, options, false)

  if (expression.error) return { error: expression.error, text: source, replacementLength: 0 }
  if (!expression.value || !match) return { error: null, text: source, replacementLength: 0 }

  const matchedText = source.slice(match.start, match.end)
  const nextReplacement = options.regex
    ? matchedText.replace(expression.value, replacement)
    : replacement

  return {
    error: null,
    text: `${source.slice(0, match.start)}${nextReplacement}${source.slice(match.end)}`,
    replacementLength: nextReplacement.length
  }
}

export function replaceAllSourceMatches(
  source: string,
  query: string,
  replacement: string,
  options: SourceSearchOptions
): { count: number; error: string | null; text: string } {
  const result = findSourceMatches(source, query, options)

  if (result.error) return { count: 0, error: result.error, text: source }
  if (result.matches.length === 0) return { count: 0, error: null, text: source }

  const expression = createSearchExpression(query, options)

  if (!expression.value) return { count: 0, error: expression.error, text: source }
  if (!options.regex) {
    let cursor = 0
    let text = ''

    for (const match of result.matches) {
      text += source.slice(cursor, match.start)
      text += replacement
      cursor = match.end
    }

    text += source.slice(cursor)

    return {
      count: result.matches.length,
      error: null,
      text
    }
  }

  return {
    count: result.matches.length,
    error: null,
    text: source.replace(expression.value, replacement)
  }
}

export function highlightSourceSnippet(text: string, query: string, options: SourceSearchOptions): string {
  const trimmed = text || '(blank line)'
  const expression = createSearchExpression(query, options, false)

  if (!expression.value) return trimmed

  const match = expression.value.exec(trimmed)
  if (!match?.[0]) return trimmed

  const index = match.index
  const start = Math.max(0, index - 24)
  const end = Math.min(trimmed.length, index + match[0].length + 42)
  const prefix = start > 0 ? '...' : ''
  const suffix = end < trimmed.length ? '...' : ''

  return `${prefix}${trimmed.slice(start, end)}${suffix}`
}

function createSearchExpression(
  query: string,
  options: SourceSearchOptions,
  global = true
): { error: string | null; value: RegExp | null } {
  const trimmed = query.trim()

  if (!trimmed) return { error: null, value: null }

  const source = options.regex ? trimmed : escapeRegExp(trimmed)
  const bounded = options.wholeWord ? `\\b(?:${source})\\b` : source
  const flags = `${global ? 'g' : ''}${options.caseSensitive ? '' : 'i'}`

  try {
    return { error: null, value: new RegExp(bounded, flags) }
  } catch (error) {
    return { error: messageFromError(error), value: null }
  }
}

function matchFromRange(source: string, start: number, length: number): SourceSearchMatch {
  const before = source.slice(0, start)
  const line = before.split('\n').length
  const lineStart = before.lastIndexOf('\n') + 1
  const lineEnd = source.indexOf('\n', start)
  const rawLine = source.slice(lineStart, lineEnd === -1 ? source.length : lineEnd)
  const text = rawLine.replace(/\r$/, '').trim() || '(blank line)'

  return {
    line,
    column: start - lineStart + 1,
    text,
    start,
    end: start + length
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function messageFromError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Invalid regular expression'
}
