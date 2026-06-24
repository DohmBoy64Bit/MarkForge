import { describe, expect, it } from 'vitest'
import {
  applyHeading,
  applyInlineWrap,
  applyLinePrefix,
  applyLink,
  alignMarkdownTable,
  deleteSelectionOrLines,
  deleteTableRow,
  duplicateSelectionOrLines,
  formatMarkdownSource,
  insertImage,
  insertBlock,
  insertTableColumnAfter,
  insertTableRowAfter,
  updateImageAttributes,
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

  it('toggles inline Markdown markers when the selected text includes the wrapper', () => {
    const edit = applyInlineWrap('Make **bold** now', { start: 5, end: 13 }, '**', '**', 'bold text')

    expect(edit).toEqual({
      text: 'Make bold now',
      selectionStart: 5,
      selectionEnd: 9
    })
  })

  it('toggles inline Markdown markers around the current selection', () => {
    const edit = applyInlineWrap('Make **bold** now', { start: 7, end: 11 }, '**', '**', 'bold text')

    expect(edit).toEqual({
      text: 'Make bold now',
      selectionStart: 5,
      selectionEnd: 9
    })
  })

  it('formats links around selected text', () => {
    const edit = applyLink('Read docs', { start: 5, end: 9 })

    expect(edit.text).toBe('Read [docs](https://example.com)')
    expect(edit.text.slice(edit.selectionStart, edit.selectionEnd)).toBe('https://example.com')
  })

  it('inserts image Markdown and selects the image path', () => {
    const edit = insertImage('Logo', { start: 0, end: 4 })

    expect(edit.text).toBe('![Logo](image.png)')
    expect(edit.text.slice(edit.selectionStart, edit.selectionEnd)).toBe('image.png')
  })

  it('updates an image syntax range with alt, URL, and title', () => {
    const edit = updateImageAttributes('Logo: ![old](old.png)', { start: 9, end: 12 }, {
      alt: 'New logo',
      url: 'assets/logo.png',
      title: 'Brand mark'
    })

    expect(edit.text).toBe('Logo: ![New logo](assets/logo.png "Brand mark")')
    expect(edit.text.slice(edit.selectionStart, edit.selectionEnd)).toBe('New logo')
  })

  it('applies heading markers to the selected line range', () => {
    const edit = applyHeading('Intro\nOld heading\nTail', { start: 8, end: 12 }, 2)

    expect(edit.text).toBe('Intro\n## Old heading\nTail')
    expect(edit.selectionStart).toBe(6)
    expect(edit.selectionEnd).toBe(20)
  })

  it('supports H4-H6 headings and removes the same heading marker when toggled', () => {
    const h6 = applyHeading('Intro\nDeep heading\nTail', { start: 7, end: 11 }, 6)

    expect(h6.text).toBe('Intro\n###### Deep heading\nTail')

    const toggled = applyHeading(h6.text, { start: 7, end: 12 }, 6)

    expect(toggled.text).toBe('Intro\nDeep heading\nTail')
  })

  it('toggles line prefixes off when every selected line already has the marker', () => {
    const edit = applyLinePrefix('- a\n- b\nc', { start: 0, end: 6 }, () => '- ', /^\s{0,3}[-*+]\s+/)

    expect(edit.text).toBe('a\nb\nc')
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

  it('inserts a table row matching the selected table line width', () => {
    const edit = insertTableRowAfter('| A | B | C |\n| --- | --- | --- |', { start: 2, end: 2 })

    expect(edit.text).toBe('| A | B | C |\n|  |  |  |\n| --- | --- | --- |')
  })

  it('inserts a table column after the current column', () => {
    const edit = insertTableColumnAfter('| A | B |\n| --- | --- |\n| 1 | 2 |', { start: 3, end: 3 })

    expect(edit.text).toBe('| A |  | B |\n| --- | --- | --- |\n| 1 |  | 2 |')
  })

  it('deletes the current table row', () => {
    const edit = deleteTableRow('| A | B |\n| --- | --- |\n| 1 | 2 |\n| 3 | 4 |', { start: 24, end: 24 })

    expect(edit.text).toBe('| A | B |\n| --- | --- |\n| 3 | 4 |')
  })

  it('aligns a Markdown table without changing table content', () => {
    const edit = alignMarkdownTable('| A | Longer |\n| --- | --- |\n| 1 | 22 |', { start: 2, end: 2 })

    expect(edit.text).toBe('| A   | Longer |\n| --- | ------ |\n| 1   | 22     |')
  })

  it('deletes the current line when the selection is empty', () => {
    const edit = deleteSelectionOrLines('alpha\nbeta\ngamma', { start: 7, end: 7 })

    expect(edit.text).toBe('alpha\ngamma')
    expect(edit.selectionStart).toBe(6)
  })

  it('duplicates the selected text after the current selection', () => {
    const edit = duplicateSelectionOrLines('alpha beta', { start: 6, end: 10 })

    expect(edit.text).toBe('alpha betabeta')
    expect(edit.selectionStart).toBe(10)
    expect(edit.selectionEnd).toBe(14)
  })

  it('duplicates the current line when the selection is empty', () => {
    const edit = duplicateSelectionOrLines('alpha\nbeta', { start: 1, end: 1 })

    expect(edit.text).toBe('alpha\nalpha\nbeta')
    expect(edit.selectionStart).toBe(6)
    expect(edit.selectionEnd).toBe(11)
  })

  it('formats Markdown by trimming trailing spaces and compacting blank runs', () => {
    const edit = formatMarkdownSource('alpha  \n\n\nbeta', { start: 0, end: 0 })

    expect(edit.text).toBe('alpha\n\nbeta\n')
  })
})
