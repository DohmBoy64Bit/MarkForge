import type { EditorCommand } from '@markforge/editor-engine'

export type PaletteCommand = EditorCommand & {
  groupLabel: string
}

export function commandSearchText(command: PaletteCommand): string {
  return [
    command.label,
    command.groupLabel,
    command.shortcut,
    command.id
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function filterCommands(commands: PaletteCommand[], query: string): PaletteCommand[] {
  const terms = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)

  if (terms.length === 0) return commands

  return commands.filter(command => {
    const haystack = commandSearchText(command)
    return terms.every(term => haystack.includes(term))
  })
}

export function nextPaletteIndex(current: number, delta: number, count: number): number {
  if (count <= 0) return 0

  return (current + delta + count) % count
}
