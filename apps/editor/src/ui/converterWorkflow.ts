export type ConverterInsertMode = 'append-to-document' | 'insert-at-cursor' | 'replace-selection'

export type ConverterTextSelection = {
  end: number
  start: number
}

export type ConverterTextEdit = {
  selectionEnd: number
  selectionStart: number
  text: string
}

export function applyConvertedMarkdown(
  source: string,
  markdown: string,
  selection: ConverterTextSelection,
  mode: ConverterInsertMode
): ConverterTextEdit {
  const insertion = normalizeConvertedMarkdownForEditor(markdown)
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

  const start = mode === 'insert-at-cursor' ? range.start : range.start
  const end = mode === 'insert-at-cursor' ? range.start : range.end
  const before = source.slice(0, start)
  const after = source.slice(end)
  const prefix = before && !before.endsWith('\n') ? '\n\n' : ''
  const suffix = after && !after.startsWith('\n') ? '\n\n' : ''
  const selectionStart = before.length + prefix.length

  return {
    selectionStart,
    selectionEnd: selectionStart + insertion.length,
    text: `${before}${prefix}${insertion}${suffix}${after}`
  }
}

export function labelForConverterInsertMode(mode: ConverterInsertMode): string {
  if (mode === 'replace-selection') return 'Replace'
  if (mode === 'insert-at-cursor') return 'Cursor'
  return 'Append'
}

function normalizeConvertedMarkdownForEditor(markdown: string): string {
  return markdown.replace(/\r\n?/g, '\n').trim()
}

function clampSelection(source: string, selection: ConverterTextSelection): ConverterTextSelection {
  const start = Math.max(0, Math.min(selection.start, source.length))
  const end = Math.max(start, Math.min(selection.end, source.length))

  return { start, end }
}

function appendSeparatorFor(source: string): string {
  if (source.endsWith('\n\n')) return ''
  if (source.endsWith('\n')) return '\n'
  return '\n\n'
}
