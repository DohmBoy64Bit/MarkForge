import type { EditorCommandIcon, EditorCommandId } from '@markforge/editor-engine'
import { CornerDownLeft, Search, X, type LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, type KeyboardEvent } from 'react'
import { matchesShortcut } from './editorPreferences'
import {
  filterQuickInsertCommands,
  nextQuickInsertIndex,
  type QuickInsertCommand
} from './quickInsertHelpers'

type QuickInsertProps = {
  activeIndex: number
  commands: QuickInsertCommand[]
  iconByName: Record<EditorCommandIcon, LucideIcon>
  onActiveIndexChange: (index: number) => void
  onExecute: (commandId: EditorCommandId) => void
  onQueryChange: (query: string) => void
  onRequestClose: () => void
  query: string
  shortcut: string
}

export function QuickInsert({
  activeIndex,
  commands,
  iconByName,
  onActiveIndexChange,
  onExecute,
  onQueryChange,
  onRequestClose,
  query,
  shortcut
}: QuickInsertProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const filteredCommands = useMemo(() => filterQuickInsertCommands(commands, query), [commands, query])
  const activeCommand = filteredCommands[activeIndex] ?? filteredCommands[0] ?? null
  const activeId = activeCommand ? quickInsertOptionId(activeCommand.id) : undefined

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  useEffect(() => {
    if (!activeId) return

    document.getElementById(activeId)?.scrollIntoView({ block: 'nearest' })
  }, [activeId])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (matchesShortcut(shortcut, event.nativeEvent)) {
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
      onActiveIndexChange(nextQuickInsertIndex(activeIndex, 1, filteredCommands.length))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      onActiveIndexChange(nextQuickInsertIndex(activeIndex, -1, filteredCommands.length))
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
      keepFocusInDialog(event, dialogRef.current)
    }
  }

  return (
    <div className="quickInsertBackdrop" onMouseDown={() => onRequestClose()}>
      <div
        ref={dialogRef}
        aria-label="Quick insert"
        aria-modal="true"
        className="quickInsertPanel"
        onKeyDown={handleKeyDown}
        onMouseDown={event => event.stopPropagation()}
        role="dialog"
      >
        <div className="quickInsertInputRow">
          <Search size={16} aria-hidden="true" />
          <label>
            <span>Quick insert</span>
            <input
              ref={inputRef}
              aria-activedescendant={activeId}
              aria-autocomplete="list"
              aria-controls="quick-insert-results"
              aria-label="Filter quick insert commands"
              autoComplete="off"
              onChange={event => {
                onQueryChange(event.target.value)
                onActiveIndexChange(0)
              }}
              placeholder="Heading, list, table..."
              role="combobox"
              value={query}
            />
          </label>
          <button type="button" onClick={() => onRequestClose()} title="Close quick insert" aria-label="Close quick insert">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="quickInsertMeta">
          <span>{filteredCommands.length} blocks</span>
          <span><CornerDownLeft size={13} aria-hidden="true" /> Enter</span>
        </div>

        <div id="quick-insert-results" className="quickInsertResults" role="listbox" aria-label="Quick insert commands">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((command, index) => {
              const Icon = iconByName[command.icon]
              const isActive = index === activeIndex

              return (
                <button
                  key={command.id}
                  id={quickInsertOptionId(command.id)}
                  type="button"
                  aria-selected={isActive}
                  className={isActive ? 'active' : ''}
                  onClick={() => onExecute(command.id)}
                  onMouseEnter={() => onActiveIndexChange(index)}
                  role="option"
                >
                  <span className="quickInsertIcon"><Icon size={15} aria-hidden="true" /></span>
                  <span className="quickInsertCopy">
                    <strong>{command.label}</strong>
                    <small>{command.quickInsertHint}</small>
                  </span>
                </button>
              )
            })
          ) : (
            <div className="quickInsertEmpty" role="status">
              <strong>No insert found</strong>
              <span>Try heading, quote, list, code, rule, or table.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function quickInsertOptionId(commandId: EditorCommandId): string {
  return `quick-insert-option-${commandId.replace(/\./g, '-')}`
}

function keepFocusInDialog(event: KeyboardEvent, dialog: HTMLElement | null): void {
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
