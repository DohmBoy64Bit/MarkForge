import { describe, expect, it } from 'vitest'
import {
  filterMarkdownAutocompleteSuggestions,
  filterMarkdownPathSuggestions,
  findMarkdownAutocompleteTrigger,
  findMarkdownPathAutocompleteTrigger,
  replaceMarkdownPathTrigger,
  replaceMarkdownAutocompleteTrigger
} from './markdownAutocomplete'

describe('markdownAutocomplete', () => {
  it('finds slash autocomplete triggers outside template commands', () => {
    expect(findMarkdownAutocompleteTrigger('/tab', 4)).toEqual({
      start: 0,
      end: 4,
      query: 'tab'
    })
    expect(findMarkdownAutocompleteTrigger('/template readme', 16)).toBeNull()
  })

  it('filters Markdown suggestions by labels and search terms', () => {
    expect(filterMarkdownAutocompleteSuggestions('image').map(item => item.id)).toEqual(['image'])
    expect(filterMarkdownAutocompleteSuggestions('metadata').map(item => item.id)).toEqual(['front-matter'])
  })

  it('replaces the slash trigger with selected Markdown', () => {
    const trigger = findMarkdownAutocompleteTrigger('Before\n/img', 11)
    const suggestion = filterMarkdownAutocompleteSuggestions('image')[0]

    expect(trigger).not.toBeNull()
    expect(replaceMarkdownAutocompleteTrigger('Before\n/img', trigger!, suggestion)).toEqual({
      selectionStart: 7,
      selectionEnd: 29,
      text: 'Before\n![alt text](image.png)'
    })
  })

  it('detects Markdown link and image path triggers', () => {
    expect(findMarkdownPathAutocompleteTrigger('See [docs](gui', 14)).toEqual({
      start: 11,
      end: 14,
      query: 'gui',
      isImage: false
    })
    expect(findMarkdownPathAutocompleteTrigger('![alt](assets/im', 16)).toEqual({
      start: 7,
      end: 16,
      query: 'assets/im',
      isImage: true
    })
    expect(findMarkdownPathAutocompleteTrigger('[web](https://example.com', 26)).toBeNull()
  })

  it('filters path suggestions and keeps image triggers image-focused', () => {
    const trigger = findMarkdownPathAutocompleteTrigger('![alt](assets/', 14)!
    const suggestions = filterMarkdownPathSuggestions(trigger, [
      { path: 'C:\\project\\assets\\photo.png', relativePath: 'assets/photo.png' },
      { path: 'C:\\project\\docs\\guide.md', relativePath: 'docs/guide.md' },
      { path: 'C:\\project\\assets\\icons\\', relativePath: 'assets/icons/', isDirectory: true }
    ])

    expect(suggestions.map(suggestion => suggestion.insertText)).toEqual([
      'assets/icons/',
      'assets/photo.png'
    ])
  })

  it('replaces a path trigger with a workspace path', () => {
    const source = 'See [guide](doc)'
    const trigger = findMarkdownPathAutocompleteTrigger(source, source.length - 1)!
    expect(replaceMarkdownPathTrigger(source, trigger, {
      id: 'docs/guide.md',
      label: 'docs/guide.md',
      insertText: 'docs/guide.md'
    })).toEqual({
      text: 'See [guide](docs/guide.md)',
      selectionStart: 25,
      selectionEnd: 25
    })
  })
})
