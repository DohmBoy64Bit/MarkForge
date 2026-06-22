import { describe, expect, it } from 'vitest'
import {
  defaultSearchOptions,
  findSourceMatches,
  replaceAllSourceMatches,
  replaceCurrentSourceMatch
} from './sourceSearch'

describe('sourceSearch', () => {
  it('finds literal matches case-insensitively by default', () => {
    const result = findSourceMatches('Alpha\nalpha beta', 'alpha', defaultSearchOptions)

    expect(result.error).toBeNull()
    expect(result.matches).toHaveLength(2)
    expect(result.matches[1]).toMatchObject({
      line: 2,
      column: 1,
      text: 'alpha beta'
    })
  })

  it('respects case-sensitive and whole-word options', () => {
    const result = findSourceMatches('Cat catalog cat', 'cat', {
      caseSensitive: true,
      regex: false,
      wholeWord: true
    })

    expect(result.matches.map(match => match.start)).toEqual([12])
  })

  it('reports invalid regular expressions without throwing', () => {
    const result = findSourceMatches('alpha', '(', {
      caseSensitive: false,
      regex: true,
      wholeWord: false
    })

    expect(result.matches).toEqual([])
    expect(result.error).toContain('Invalid regular expression')
  })

  it('replaces all regex matches with capture groups when regex mode is enabled', () => {
    const result = replaceAllSourceMatches('first: Ada\nfirst: Grace', 'first: (\\w+)', 'name: $1', {
      caseSensitive: false,
      regex: true,
      wholeWord: false
    })

    expect(result).toEqual({
      count: 2,
      error: null,
      text: 'name: Ada\nname: Grace'
    })
  })

  it('treats replacement text literally outside regex mode', () => {
    const result = replaceAllSourceMatches('alpha alpha', 'alpha', '$1', defaultSearchOptions)

    expect(result.text).toBe('$1 $1')
  })

  it('replaces only the selected match for current replacement', () => {
    const matches = findSourceMatches('one two one', 'one', defaultSearchOptions).matches
    const result = replaceCurrentSourceMatch('one two one', 'one', 'three', defaultSearchOptions, matches[1])

    expect(result).toEqual({
      error: null,
      replacementLength: 5,
      text: 'one two three'
    })
  })
})
