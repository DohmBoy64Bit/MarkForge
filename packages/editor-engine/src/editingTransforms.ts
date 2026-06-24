export type TextSelection = {
  start: number
  end: number
}

export type TextEdit = {
  text: string
  selectionStart: number
  selectionEnd: number
}

export type ImageAttributes = {
  alt: string
  title?: string
  url: string
}

export function applyInlineWrap(
  source: string,
  selection: TextSelection,
  prefix: string,
  suffix: string,
  fallback: string
): TextEdit {
  const currentSelection = source.slice(selection.start, selection.end)

  if (
    currentSelection.startsWith(prefix) &&
    currentSelection.endsWith(suffix) &&
    currentSelection.length >= prefix.length + suffix.length
  ) {
    const unwrapped = currentSelection.slice(prefix.length, currentSelection.length - suffix.length)

    return replaceRange(source, selection.start, selection.end, unwrapped, {
      start: selection.start,
      end: selection.start + unwrapped.length
    })
  }

  if (
    currentSelection &&
    source.slice(selection.start - prefix.length, selection.start) === prefix &&
    source.slice(selection.end, selection.end + suffix.length) === suffix
  ) {
    return replaceRange(source, selection.start - prefix.length, selection.end + suffix.length, currentSelection, {
      start: selection.start - prefix.length,
      end: selection.start - prefix.length + currentSelection.length
    })
  }

  if (
    !currentSelection &&
    source.slice(selection.start - prefix.length, selection.start) === prefix &&
    source.slice(selection.end, selection.end + suffix.length) === suffix
  ) {
    return replaceRange(source, selection.start - prefix.length, selection.end + suffix.length, '', {
      start: selection.start - prefix.length,
      end: selection.start - prefix.length
    })
  }

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

export function insertImage(source: string, selection: TextSelection): TextEdit {
  const selected = source.slice(selection.start, selection.end).trim() || 'alt text'
  const url = 'image.png'
  const inserted = `![${selected}](${url})`
  const urlStart = selection.start + selected.length + 4

  return replaceRange(source, selection.start, selection.end, inserted, {
    start: urlStart,
    end: urlStart + url.length
  })
}

export function updateImageAttributes(source: string, selection: TextSelection, attributes: ImageAttributes): TextEdit {
  const image = findImageSyntax(source, selection)
  const alt = escapeImageText(attributes.alt || 'alt text')
  const url = escapeImageUrl(attributes.url || 'image.png')
  const title = attributes.title?.trim()
  const inserted = title
    ? `![${alt}](${url} "${escapeImageTitle(title)}")`
    : `![${alt}](${url})`

  if (!image) {
    return replaceRange(source, selection.start, selection.end, inserted, {
      start: selection.start + 2,
      end: selection.start + 2 + alt.length
    })
  }

  return replaceRange(source, image.start, image.end, inserted, {
    start: image.start + 2,
    end: image.start + 2 + alt.length
  })
}

export function applyHeading(source: string, selection: TextSelection, level: 1 | 2 | 3 | 4 | 5 | 6): TextEdit {
  const marker = '#'.repeat(level)
  const range = selectedLineRange(source, selection)
  const lines = source.slice(range.start, range.end).replace(/\n$/, '').split('\n')
  const shouldRemove = lines.length > 0 && lines.every(line => new RegExp(`^\\s{0,3}${marker}\\s+`).test(line))

  return applyLineTransform(source, selection, line => {
    if (shouldRemove) return line.replace(new RegExp(`^(\\s{0,3})${marker}\\s+`), '$1')

    const content = line.replace(/^\s{0,3}#{1,6}\s+/, '').trimStart()
    return `${'#'.repeat(level)} ${content || 'Heading'}`
  })
}

export function applyLinePrefix(
  source: string,
  selection: TextSelection,
  prefixFactory: (line: string, index: number) => string,
  removePattern?: RegExp
): TextEdit {
  const range = selectedLineRange(source, selection)
  const lines = source.slice(range.start, range.end).replace(/\n$/, '').split('\n')
  const shouldRemove = Boolean(removePattern) && lines.length > 0 && lines.every(line => removePattern?.test(line))

  return applyLineTransform(source, selection, (line, index) => {
    if (shouldRemove && removePattern) return line.replace(removePattern, '')

    return `${prefixFactory(line, index)}${line}`
  })
}

export function insertTableRowAfter(source: string, selection: TextSelection): TextEdit {
  const range = selectedLineRange(source, selection)
  const line = source.slice(range.start, range.end)
  const columnCount = Math.max(1, line.split('|').length - 2)
  const row = `| ${Array.from({ length: columnCount }, () => '').join(' | ')} |`
  const insertAt = range.end
  const prefix = source[insertAt] === '\n' ? '\n' : ''
  const inserted = `${prefix}${row}`
  const cursor = insertAt + inserted.length

  return replaceRange(source, insertAt, insertAt, inserted, {
    start: cursor,
    end: cursor
  })
}

export function deleteTableRow(source: string, selection: TextSelection): TextEdit {
  const range = selectedLineRangeWithBreak(source, selection)
  const line = source.slice(range.start, range.end)

  if (!isMarkdownTableRow(line)) {
    return deleteSelectionOrLines(source, selection)
  }

  return replaceRange(source, range.start, range.end, '', {
    start: range.start,
    end: range.start
  })
}

export function insertTableColumnAfter(source: string, selection: TextSelection): TextEdit {
  const table = selectedTableRange(source, selection)
  if (!table) return insertBlock(source, selection, '| Column |\n| --- |\n|  |')

  const cursorLine = lineIndexAt(source, selection.start)
  const insertIndex = table.lines[cursorLine - table.startLine]
    ? columnIndexAt(table.lines[cursorLine - table.startLine], selection.start - table.start)
    : Math.max(0, table.columnCount - 1)
  const nextLines = table.lines.map(line => {
    const cells = splitTableRow(line)
    const cell = isSeparatorRow(cells) ? ' --- ' : '  '
    const index = Math.min(insertIndex + 1, cells.length)
    cells.splice(index, 0, cell)
    return joinTableRow(cells)
  })
  const text = `${source.slice(0, table.start)}${nextLines.join('\n')}${source.slice(table.end)}`
  const selectionStart = table.start + nextLines[0].length

  return {
    text,
    selectionStart,
    selectionEnd: selectionStart
  }
}

export function alignMarkdownTable(source: string, selection: TextSelection): TextEdit {
  const table = selectedTableRange(source, selection)
  if (!table) return { text: source, selectionStart: selection.start, selectionEnd: selection.end }

  const rows = table.lines.map(splitTableRow)
  const columnCount = Math.max(...rows.map(row => row.length))
  rows.forEach(row => {
    while (row.length < columnCount) row.push(' ')
  })
  const widths = Array.from({ length: columnCount }, (_, column) => {
    return Math.max(3, ...rows.map(row => normalizeTableCell(row[column]).length))
  })
  const nextLines = rows.map((row, rowIndex) => {
    if (rowIndex === 1 && isSeparatorRow(row)) {
      return joinTableRow(widths.map(width => ` ${'-'.repeat(width)} `))
    }

    return joinTableRow(row.map((cell, column) => ` ${normalizeTableCell(cell).padEnd(widths[column], ' ')} `))
  })

  return {
    text: `${source.slice(0, table.start)}${nextLines.join('\n')}${source.slice(table.end)}`,
    selectionStart: table.start,
    selectionEnd: table.start + nextLines.join('\n').length
  }
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

export function deleteSelectionOrLines(source: string, selection: TextSelection): TextEdit {
  if (selection.start !== selection.end) {
    return replaceRange(source, selection.start, selection.end, '', {
      start: selection.start,
      end: selection.start
    })
  }

  const range = selectedLineRangeWithBreak(source, selection)

  return replaceRange(source, range.start, range.end, '', {
    start: range.start,
    end: range.start
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

export function formatMarkdownSource(source: string, selection: TextSelection): TextEdit {
  const normalized = source
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/([^\n])$/g, '$1\n')

  const cursor = Math.min(selection.end, normalized.length)

  return {
    text: normalized,
    selectionStart: cursor,
    selectionEnd: cursor
  }
}

export function duplicateSelectionOrLines(source: string, selection: TextSelection): TextEdit {
  if (selection.start !== selection.end) {
    const selected = source.slice(selection.start, selection.end)
    const insertAt = selection.end

    return replaceRange(source, insertAt, insertAt, selected, {
      start: insertAt,
      end: insertAt + selected.length
    })
  }

  const range = selectedLineRange(source, selection)
  const line = source.slice(range.start, range.end)
  const inserted = `\n${line}`
  const insertAt = range.end

  return replaceRange(source, insertAt, insertAt, inserted, {
    start: insertAt + 1,
    end: insertAt + 1 + line.length
  })
}

function selectedLineRangeWithBreak(source: string, selection: TextSelection): TextSelection {
  const range = selectedLineRange(source, selection)
  const end = source[range.end] === '\n' ? range.end + 1 : range.end

  if (range.start === 0 && end === source.length) return { start: 0, end }

  return { start: range.start, end }
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

function selectedTableRange(source: string, selection: TextSelection): {
  columnCount: number
  end: number
  lines: string[]
  start: number
  startLine: number
} | null {
  const lines = source.split('\n')
  const selectedLine = lineIndexAt(source, selection.start)
  if (!isMarkdownTableRow(lines[selectedLine] ?? '')) return null

  let startLine = selectedLine
  while (startLine > 0 && isMarkdownTableRow(lines[startLine - 1])) startLine -= 1

  let endLine = selectedLine
  while (endLine + 1 < lines.length && isMarkdownTableRow(lines[endLine + 1])) endLine += 1

  const tableLines = lines.slice(startLine, endLine + 1)
  if (tableLines.length < 2) return null

  const start = offsetForLine(lines, startLine)
  const end = offsetForLine(lines, endLine) + lines[endLine].length
  const columnCount = Math.max(...tableLines.map(line => splitTableRow(line).length))

  return { start, end, startLine, lines: tableLines, columnCount }
}

function lineIndexAt(source: string, offset: number): number {
  return source.slice(0, Math.max(0, Math.min(offset, source.length))).split('\n').length - 1
}

function offsetForLine(lines: string[], lineIndex: number): number {
  return lines.slice(0, lineIndex).reduce((offset, line) => offset + line.length + 1, 0)
}

function isMarkdownTableRow(line: string): boolean {
  return /^\s*\|.+\|\s*$/.test(line)
}

function splitTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '')
  return trimmed.split('|').map(cell => cell)
}

function joinTableRow(cells: string[]): string {
  return `|${cells.join('|')}|`
}

function isSeparatorRow(cells: string[]): boolean {
  return cells.every(cell => /^:?-{3,}:?$/.test(cell.trim()))
}

function normalizeTableCell(cell: string): string {
  return cell.trim()
}

function columnIndexAt(line: string, offsetInTable: number): number {
  const lineOffset = Math.max(0, Math.min(offsetInTable, line.length))
  return Math.max(0, line.slice(0, lineOffset).split('|').length - 2)
}

function findImageSyntax(source: string, selection: TextSelection): TextSelection | null {
  const pattern = /!\[([^\]\n]*)]\(([^)\n]*)\)/g
  let match: RegExpExecArray | null

  while ((match = pattern.exec(source))) {
    const start = match.index
    const end = start + match[0].length
    if (selection.start >= start && selection.end <= end) return { start, end }
  }

  return null
}

function escapeImageText(value: string): string {
  return value.replace(/]/g, '\\]')
}

function escapeImageUrl(value: string): string {
  return value.replace(/\)/g, '%29')
}

function escapeImageTitle(value: string): string {
  return value.replace(/"/g, '\\"')
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
