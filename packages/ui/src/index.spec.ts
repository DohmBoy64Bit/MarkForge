import { describe, expect, it } from 'vitest'
import React from 'react'
import { IconButton, clampActiveIndex, makeToolbarGroup, nextActiveIndex } from './index'

describe('@markforge/ui', () => {
  it('provides reusable toolbar helpers', () => {
    expect(makeToolbarGroup('file', 'File actions')).toEqual({
      id: 'file',
      ariaLabel: 'File actions'
    })
    expect(clampActiveIndex(9, 3)).toBe(2)
    expect(nextActiveIndex(0, -1, 3)).toBe(2)
  })

  it('creates an accessible icon button element', () => {
    const element = IconButton({
      active: true,
      ariaLabel: 'Print',
      title: 'Print',
      children: React.createElement('span')
    })

    expect(element.props['aria-label']).toBe('Print')
    expect(element.props['aria-pressed']).toBe(true)
    expect(element.props.type).toBe('button')
  })
})
