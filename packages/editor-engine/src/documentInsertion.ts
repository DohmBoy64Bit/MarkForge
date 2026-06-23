export type MarkdownInsertMode = 'append-to-document' | 'insert-at-cursor' | 'replace-selection'

export type MarkdownInsertionSelection = {
  end: number
  start: number
}

export type MarkdownInsertionEdit = {
  selectionEnd: number
  selectionStart: number
  text: string
}

export function applyMarkdownInsertion(
  source: string,
  markdown: string,
  selection: MarkdownInsertionSelection,
  mode: MarkdownInsertMode
): MarkdownInsertionEdit {
  const insertion = normalizeMarkdownInsertion(markdown)
  const range = clampSelection(source, selection)

  if (!insertion) {
    return {
      selectionStart: range.start,
      selectionEnd: range.end,
      text: source
    }
  }

  if (mode === 'append-to-document') {
    const separator = source ? appendSeparatorFor(source) : ''
    const selectionStart = source.length + separator.length

    return {
      selectionStart,
      selectionEnd: selectionStart + insertion.length,
      text: `${source}${separator}${insertion}`
    }
  }

  const start = range.start
  const end = mode === 'insert-at-cursor' ? range.start : range.end
  const before = source.slice(0, start)
  const after = source.slice(end)
  const prefix = mode === 'insert-at-cursor' && before && !before.endsWith('\n') ? '\n\n' : ''
  const suffix = mode === 'insert-at-cursor' && after && !after.startsWith('\n') ? '\n\n' : ''
  const selectionStart = before.length + prefix.length

  return {
    selectionStart,
    selectionEnd: selectionStart + insertion.length,
    text: `${before}${prefix}${insertion}${suffix}${after}`
  }
}

export function labelForMarkdownInsertMode(mode: MarkdownInsertMode): string {
  if (mode === 'replace-selection') return 'Replace'
  if (mode === 'insert-at-cursor') return 'Cursor'
  return 'Append'
}

function normalizeMarkdownInsertion(markdown: string): string {
  return markdown.replace(/\r\n?/g, '\n').trim()
}

function clampSelection(source: string, selection: MarkdownInsertionSelection): MarkdownInsertionSelection {
  const start = Math.max(0, Math.min(selection.start, source.length))
  const end = Math.max(start, Math.min(selection.end, source.length))

  return { start, end }
}

function appendSeparatorFor(source: string): string {
  if (source.endsWith('\n\n')) return ''
  if (source.endsWith('\n')) return '\n'
  return '\n\n'
}
