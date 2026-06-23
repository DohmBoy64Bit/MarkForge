import { describe, expect, it } from 'vitest'
import { applyMarkdownInsertion, labelForMarkdownInsertMode } from './documentInsertion'

describe('documentInsertion', () => {
  it('replaces the selected text with normalized Markdown', () => {
    expect(applyMarkdownInsertion('Before\nold\nAfter', '\r\n# New\r\n', { start: 7, end: 10 }, 'replace-selection')).toEqual({
      selectionStart: 7,
      selectionEnd: 12,
      text: 'Before\n# New\nAfter'
    })
  })

  it('inserts at the cursor without removing the selected text', () => {
    expect(applyMarkdownInsertion('BeforeAfter', '| A |\n| --- |', { start: 6, end: 11 }, 'insert-at-cursor')).toEqual({
      selectionStart: 8,
      selectionEnd: 21,
      text: 'Before\n\n| A |\n| --- |\n\nAfter'
    })
  })

  it('appends after a blank line when the document has content', () => {
    expect(applyMarkdownInsertion('Before', '# Imported', { start: 0, end: 0 }, 'append-to-document')).toEqual({
      selectionStart: 8,
      selectionEnd: 18,
      text: 'Before\n\n# Imported'
    })
  })

  it('leaves text unchanged when inserted output is empty', () => {
    expect(applyMarkdownInsertion('Before', '   ', { start: 1, end: 3 }, 'replace-selection')).toEqual({
      selectionStart: 1,
      selectionEnd: 3,
      text: 'Before'
    })
  })

  it('labels insert modes for compact controls', () => {
    expect(labelForMarkdownInsertMode('replace-selection')).toBe('Replace')
    expect(labelForMarkdownInsertMode('insert-at-cursor')).toBe('Cursor')
    expect(labelForMarkdownInsertMode('append-to-document')).toBe('Append')
  })
})
