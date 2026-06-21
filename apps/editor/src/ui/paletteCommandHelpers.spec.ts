import { describe, expect, it } from 'vitest'
import { editorCommands } from '@markforge/editor-engine'
import { commandSearchText, filterCommands, nextPaletteIndex, type PaletteCommand } from './paletteCommandHelpers'

const paletteCommands: PaletteCommand[] = editorCommands.map(command => ({
  ...command,
  groupLabel: command.group === 'inline' ? 'Inline' : command.group === 'block' ? 'Block' : 'Insert'
}))

describe('command palette helpers', () => {
  it('builds searchable text from labels, groups, shortcuts, and ids', () => {
    const command = paletteCommands.find(item => item.id === 'format.bold')

    expect(command).toBeDefined()
    expect(commandSearchText(command!)).toContain('bold')
    expect(commandSearchText(command!)).toContain('inline')
    expect(commandSearchText(command!)).toContain('ctrl+b')
    expect(commandSearchText(command!)).toContain('format.bold')
  })

  it('filters commands by all query terms', () => {
    expect(filterCommands(paletteCommands, 'block quote').map(command => command.id)).toEqual(['block.blockquote'])
    expect(filterCommands(paletteCommands, 'ctrl shift 7').map(command => command.id)).toEqual(['block.orderedList'])
  })

  it('returns all commands for blank queries', () => {
    expect(filterCommands(paletteCommands, '   ')).toHaveLength(paletteCommands.length)
  })

  it('wraps active index in both directions', () => {
    expect(nextPaletteIndex(0, 1, 3)).toBe(1)
    expect(nextPaletteIndex(2, 1, 3)).toBe(0)
    expect(nextPaletteIndex(0, -1, 3)).toBe(2)
    expect(nextPaletteIndex(4, 1, 0)).toBe(0)
  })
})
