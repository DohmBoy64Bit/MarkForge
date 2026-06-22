import { editorCommands } from '@markforge/editor-engine'
import { describe, expect, it } from 'vitest'
import type { PaletteCommand } from './paletteCommandHelpers'
import {
  filterQuickInsertCommands,
  isQuickInsertCommand,
  nextQuickInsertIndex,
  quickInsertSearchText,
  toQuickInsertCommands
} from './quickInsertHelpers'

const paletteCommands: PaletteCommand[] = editorCommands.map(command => ({
  ...command,
  groupLabel: command.group === 'inline'
    ? 'Inline'
    : command.group === 'block'
      ? 'Block'
      : command.group === 'insert'
        ? 'Insert'
        : 'Edit'
}))

describe('quick insert helpers', () => {
  it('keeps block and insert commands but excludes inline and edit commands', () => {
    expect(isQuickInsertCommand(paletteCommands.find(command => command.id === 'block.heading2')!)).toBe(true)
    expect(isQuickInsertCommand(paletteCommands.find(command => command.id === 'insert.table')!)).toBe(true)
    expect(isQuickInsertCommand(paletteCommands.find(command => command.id === 'format.bold')!)).toBe(false)
    expect(isQuickInsertCommand(paletteCommands.find(command => command.id === 'edit.duplicate')!)).toBe(false)
  })

  it('adds compact hints for searchable quick insert commands', () => {
    const commands = toQuickInsertCommands(paletteCommands)
    const table = commands.find(command => command.id === 'insert.table')

    expect(commands.map(command => command.id)).not.toContain('format.bold')
    expect(table?.quickInsertHint).toBe('Markdown table')
    expect(quickInsertSearchText(table!)).toContain('markdown table')
  })

  it('filters by command label, group, id, and hint terms', () => {
    const commands = toQuickInsertCommands(paletteCommands)

    expect(filterQuickInsertCommands(commands, 'checklist').map(command => command.id)).toEqual(['block.taskList'])
    expect(filterQuickInsertCommands(commands, 'insert divider').map(command => command.id)).toEqual(['insert.horizontalRule'])
    expect(filterQuickInsertCommands(commands, 'block heading 3').map(command => command.id)).toEqual(['block.heading3'])
  })

  it('wraps active quick insert index', () => {
    expect(nextQuickInsertIndex(0, 1, 2)).toBe(1)
    expect(nextQuickInsertIndex(1, 1, 2)).toBe(0)
    expect(nextQuickInsertIndex(0, -1, 2)).toBe(1)
    expect(nextQuickInsertIndex(3, 1, 0)).toBe(0)
  })
})
