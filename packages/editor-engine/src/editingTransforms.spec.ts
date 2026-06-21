import { describe, expect, it } from 'vitest'
import {
  applyHeading,
  applyInlineWrap,
  applyLinePrefix,
  applyLink,
  insertBlock,
  wrapBlock
} from './editingTransforms'

describe('editingTransforms', () => {
  it('wraps selections with inline Markdown markers', () => {
    const edit = applyInlineWrap('Make this bold', { start: 10, end: 14 }, '**', '**', 'bold text')

    expect(edit).toEqual({
      text: 'Make this **bold**',
      selectionStart: 12,
      selectionEnd: 16
    })
  })

  it('inserts fallback inline text for empty selections', () => {
    const edit = applyInlineWrap('Start ', { start: 6, end: 6 }, '`', '`', 'code')

    expect(edit).toEqual({
      text: 'Start `code`',
      selectionStart: 7,
      selectionEnd: 11
    })
  })

  it('formats links around selected text', () => {
    const edit = applyLink('Read docs', { start: 5, end: 9 })

    expect(edit.text).toBe('Read [docs](https://example.com)')
    expect(edit.text.slice(edit.selectionStart, edit.selectionEnd)).toBe('https://example.com')
  })

  it('applies heading markers to the selected line range', () => {
    const edit = applyHeading('Intro\nOld heading\nTail', { start: 8, end: 12 }, 2)

    expect(edit.text).toBe('Intro\n## Old heading\nTail')
    expect(edit.selectionStart).toBe(6)
    expect(edit.selectionEnd).toBe(20)
  })

  it('prefixes each selected line with generated list markers', () => {
    const edit = applyLinePrefix('a\nb\nc', { start: 0, end: 3 }, (_line, index) => `${index + 1}. `)

    expect(edit.text).toBe('1. a\n2. b\nc')
  })

  it('wraps selected blocks and keeps the original selection inside the wrapper', () => {
    const edit = wrapBlock('console.log(1)', { start: 0, end: 14 }, '```\n', '\n```', 'code')

    expect(edit.text).toBe('```\nconsole.log(1)\n```')
    expect(edit.selectionStart).toBe(4)
    expect(edit.selectionEnd).toBe(18)
  })

  it('inserts block content with surrounding spacing', () => {
    const edit = insertBlock('before after', { start: 7, end: 7 }, '---')

    expect(edit.text).toBe('before \n\n---\n\nafter')
    expect(edit.selectionStart).toBe(14)
    expect(edit.selectionEnd).toBe(14)
  })
})
