import type { EditorCommand } from '@markforge/editor-engine'
import { commandSearchText, nextPaletteIndex, type PaletteCommand } from './paletteCommandHelpers'

export type QuickInsertCommand = PaletteCommand & {
  quickInsertHint: string
}

const quickInsertHints: Partial<Record<EditorCommand['id'], string>> = {
  'block.heading1': 'Large section title',
  'block.heading2': 'Section heading',
  'block.heading3': 'Nested heading',
  'block.heading4': 'Small heading',
  'block.heading5': 'Minor heading',
  'block.heading6': 'Tiny heading',
  'block.blockquote': 'Quoted block',
  'block.unorderedList': 'Bulleted list',
  'block.orderedList': 'Numbered list',
  'block.taskList': 'Checklist',
  'block.codeFence': 'Fenced code block',
  'insert.horizontalRule': 'Divider line',
  'insert.table': 'Markdown table'
}

export function isQuickInsertCommand(command: PaletteCommand): boolean {
  return command.group === 'block' || command.group === 'insert'
}

export function toQuickInsertCommands(commands: PaletteCommand[]): QuickInsertCommand[] {
  return commands
    .filter(isQuickInsertCommand)
    .map(command => ({
      ...command,
      quickInsertHint: quickInsertHints[command.id] ?? command.groupLabel
    }))
}

export function quickInsertSearchText(command: QuickInsertCommand): string {
  return `${commandSearchText(command)} ${command.quickInsertHint}`.toLowerCase()
}

export function filterQuickInsertCommands(commands: QuickInsertCommand[], query: string): QuickInsertCommand[] {
  const terms = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)

  if (terms.length === 0) return commands

  return commands.filter(command => {
    const haystack = quickInsertSearchText(command)
    return terms.every(term => haystack.includes(term))
  })
}

export function nextQuickInsertIndex(current: number, delta: number, count: number): number {
  return nextPaletteIndex(current, delta, count)
}
