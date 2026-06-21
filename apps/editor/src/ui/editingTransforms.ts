export type TextSelection = {
  start: number
  end: number
}

export type TextEdit = {
  text: string
  selectionStart: number
  selectionEnd: number
}

export function applyInlineWrap(
  source: string,
  selection: TextSelection,
  prefix: string,
  suffix: string,
  fallback: string
): TextEdit {
  const selected = source.slice(selection.start, selection.end) || fallback
  const inserted = `${prefix}${selected}${suffix}`

  return replaceRange(source, selection.start, selection.end, inserted, {
    start: selection.start + prefix.length,
    end: selection.start + prefix.length + selected.length
  })
}

export function applyLink(source: string, selection: TextSelection): TextEdit {
  const selected = source.slice(selection.start, selection.end)

  if (selected) {
    const url = 'https://example.com'
    const inserted = `[${selected}](${url})`
    const urlStart = selection.start + selected.length + 3

    return replaceRange(source, selection.start, selection.end, inserted, {
      start: urlStart,
      end: urlStart + url.length
    })
  }

  const label = 'label'
  const inserted = `[${label}](https://example.com)`

  return replaceRange(source, selection.start, selection.end, inserted, {
    start: selection.start + 1,
    end: selection.start + 1 + label.length
  })
}

export function applyHeading(source: string, selection: TextSelection, level: 1 | 2 | 3): TextEdit {
  return applyLineTransform(source, selection, line => {
    const content = line.replace(/^\s{0,3}#{1,6}\s+/, '').trimStart()
    return `${'#'.repeat(level)} ${content || 'Heading'}`
  })
}

export function applyLinePrefix(
  source: string,
  selection: TextSelection,
  prefixFactory: (line: string, index: number) => string
): TextEdit {
  return applyLineTransform(source, selection, (line, index) => `${prefixFactory(line, index)}${line}`)
}

export function wrapBlock(
  source: string,
  selection: TextSelection,
  before: string,
  after: string,
  fallback: string
): TextEdit {
  const selected = source.slice(selection.start, selection.end) || fallback
  const inserted = `${before}${selected}${after}`

  return replaceRange(source, selection.start, selection.end, inserted, {
    start: selection.start + before.length,
    end: selection.start + before.length + selected.length
  })
}

export function insertBlock(source: string, selection: TextSelection, block: string): TextEdit {
  const prefix = selection.start > 0 && source[selection.start - 1] !== '\n' ? '\n\n' : ''
  const suffix = selection.end < source.length && source[selection.end] !== '\n' ? '\n\n' : '\n'
  const inserted = `${prefix}${block}${suffix}`
  const cursor = selection.start + inserted.length

  return replaceRange(source, selection.start, selection.end, inserted, {
    start: cursor,
    end: cursor
  })
}

function applyLineTransform(
  source: string,
  selection: TextSelection,
  transform: (line: string, index: number) => string
): TextEdit {
  const range = selectedLineRange(source, selection)
  const selected = source.slice(range.start, range.end)
  const trailingNewline = selected.endsWith('\n')
  const lines = selected.replace(/\n$/, '').split('\n')
  const transformed = lines.map((line, index) => transform(line, index)).join('\n') + (trailingNewline ? '\n' : '')

  return replaceRange(source, range.start, range.end, transformed, {
    start: range.start,
    end: range.start + transformed.length
  })
}

function selectedLineRange(source: string, selection: TextSelection): TextSelection {
  const selectionStart = Math.max(0, Math.min(selection.start, source.length))
  const selectionEnd = Math.max(selectionStart, Math.min(selection.end, source.length))
  const start = source.lastIndexOf('\n', Math.max(0, selectionStart - 1)) + 1
  const lineEnd = source.indexOf('\n', selectionEnd)
  const end = lineEnd === -1 ? source.length : lineEnd

  return { start, end }
}

function replaceRange(
  source: string,
  start: number,
  end: number,
  inserted: string,
  nextSelection: TextSelection
): TextEdit {
  return {
    text: `${source.slice(0, start)}${inserted}${source.slice(end)}`,
    selectionStart: nextSelection.start,
    selectionEnd: nextSelection.end
  }
}
