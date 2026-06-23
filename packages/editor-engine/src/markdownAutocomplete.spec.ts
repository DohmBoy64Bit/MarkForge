import { describe, expect, it } from 'vitest'
import {
  filterMarkdownAutocompleteSuggestions,
  findMarkdownAutocompleteTrigger,
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
})
