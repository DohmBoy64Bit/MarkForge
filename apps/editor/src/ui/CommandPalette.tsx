import type { EditorCommandIcon, EditorCommandId } from '@markforge/editor-engine'
import { Command, CornerDownLeft, Search, X, type LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, type KeyboardEvent } from 'react'
import { matchesShortcut } from './editorPreferences'
import { filterCommands, nextPaletteIndex, type PaletteCommand } from './paletteCommandHelpers'

type CommandPaletteProps = {
  activeIndex: number
  commandPaletteShortcut: string
  commands: PaletteCommand[]
  iconByName: Record<EditorCommandIcon, LucideIcon>
  onActiveIndexChange: (index: number) => void
  onExecute: (commandId: EditorCommandId) => void
  onQueryChange: (query: string) => void
  onRequestClose: () => void
  query: string
}

type GroupedCommands = Array<{
  commands: PaletteCommand[]
  label: string
  startIndex: number
}>

export function CommandPalette({
  activeIndex,
  commandPaletteShortcut,
  commands,
  iconByName,
  onActiveIndexChange,
  onExecute,
  onQueryChange,
  onRequestClose,
  query
}: CommandPaletteProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const filteredCommands = useMemo(() => filterCommands(commands, query), [commands, query])
  const groupedCommands = useMemo(() => groupCommands(filteredCommands), [filteredCommands])
  const activeCommand = filteredCommands[activeIndex] ?? filteredCommands[0] ?? null
  const activeId = activeCommand ? commandOptionId(activeCommand.id) : undefined

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  useEffect(() => {
    if (!activeId) return

    document.getElementById(activeId)?.scrollIntoView({ block: 'nearest' })
  }, [activeId])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (matchesShortcut(commandPaletteShortcut, event.nativeEvent)) {
      event.preventDefault()
      onRequestClose()
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      onRequestClose()
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      onActiveIndexChange(nextPaletteIndex(activeIndex, 1, filteredCommands.length))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      onActiveIndexChange(nextPaletteIndex(activeIndex, -1, filteredCommands.length))
      return
    }

    if (event.key === 'Home') {
      event.preventDefault()
      onActiveIndexChange(0)
      return
    }

    if (event.key === 'End') {
      event.preventDefault()
      onActiveIndexChange(Math.max(0, filteredCommands.length - 1))
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      if (activeCommand) onExecute(activeCommand.id)
      return
    }

    if (event.key === 'Tab') {
      trapDialogTab(event, dialogRef.current)
    }
  }

  return (
    <div className="paletteBackdrop" onMouseDown={() => onRequestClose()}>
      <div
        ref={dialogRef}
        aria-label="Command palette"
        aria-modal="true"
        className="commandPalette"
        onKeyDown={handleKeyDown}
        onMouseDown={event => event.stopPropagation()}
        role="dialog"
      >
        <div className="paletteInputRow">
          <Command size={17} aria-hidden="true" />
          <label>
            <span>Command search</span>
            <input
              ref={inputRef}
              aria-activedescendant={activeId}
              aria-autocomplete="list"
              aria-controls="command-palette-results"
              aria-label="Search commands"
              autoComplete="off"
              onChange={event => {
                onQueryChange(event.target.value)
                onActiveIndexChange(0)
              }}
              placeholder="Search commands"
              role="combobox"
              value={query}
            />
          </label>
          <button type="button" onClick={() => onRequestClose()} title="Close command palette" aria-label="Close command palette">
            <X size={16} />
          </button>
        </div>

        <div className="paletteMeta">
          <span><Search size={13} aria-hidden="true" /> {filteredCommands.length} commands</span>
          <span><CornerDownLeft size={13} aria-hidden="true" /> Enter to run</span>
        </div>

        <div id="command-palette-results" className="paletteResults" role="listbox" aria-label="Matching commands">
          {filteredCommands.length > 0 ? (
            groupedCommands.map(group => (
              <section className="paletteGroup" key={group.label}>
                <h2>{group.label}</h2>
                <div>
                  {group.commands.map((command, localIndex) => {
                    const commandIndex = group.startIndex + localIndex
                    const Icon = iconByName[command.icon]
                    const isActive = commandIndex === activeIndex

                    return (
                      <button
                        key={command.id}
                        id={commandOptionId(command.id)}
                        type="button"
                        aria-selected={isActive}
                        className={isActive ? 'active' : ''}
                        onClick={() => onExecute(command.id)}
                        onMouseEnter={() => onActiveIndexChange(commandIndex)}
                        role="option"
                      >
                        <span className="paletteIcon"><Icon size={15} aria-hidden="true" /></span>
                        <span className="paletteCommandCopy">
                          <strong>{command.label}</strong>
                          <small>{command.id}</small>
                        </span>
                        {command.shortcut && <kbd>{command.shortcut}</kbd>}
                      </button>
                    )
                  })}
                </div>
              </section>
            ))
          ) : (
            <div className="paletteEmpty" role="status">
              <strong>No commands found</strong>
              <span>Try a command name, group, shortcut, or id.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function groupCommands(commands: PaletteCommand[]): GroupedCommands {
  return commands.reduce<GroupedCommands>((groups, command, index) => {
    const currentGroup = groups[groups.length - 1]

    if (currentGroup?.label === command.groupLabel) {
      currentGroup.commands.push(command)
      return groups
    }

    groups.push({
      commands: [command],
      label: command.groupLabel,
      startIndex: index
    })
    return groups
  }, [])
}

function commandOptionId(commandId: EditorCommandId): string {
  return `command-palette-option-${commandId.replace(/\./g, '-')}`
}

function trapDialogTab(event: KeyboardEvent, dialog: HTMLElement | null): void {
  if (!dialog) return

  const focusable = Array.from(
    dialog.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])')
  ).filter(element => !element.hasAttribute('aria-hidden'))

  if (focusable.length === 0) return

  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  const active = document.activeElement

  if (event.shiftKey && active === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}
