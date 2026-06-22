import {
  BookOpenText,
  FileCode,
  Keyboard,
  Moon,
  RotateCcw,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  SplitSquareHorizontal,
  Sun,
  X,
  type LucideIcon
} from 'lucide-react'
import { appVisibleThemes, getTheme } from '@markforge/theme-engine'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import {
  conflictForAction,
  detectShortcutConflicts,
  displayShortcut,
  keybindingDefinitions,
  resetKeybinding,
  resetKeybindings,
  type EditorPreferences,
  type KeybindingActionId,
  type Theme,
  type ViewMode
} from './editorPreferences'

type PreferencesDialogProps = {
  onPreferencesChange: (preferences: EditorPreferences) => void
  onRequestClose: () => void
  preferences: EditorPreferences
}

type PreferencesTab = 'general' | 'keybindings'

const tabs: Array<{ id: PreferencesTab; label: string }> = [
  { id: 'general', label: 'General' },
  { id: 'keybindings', label: 'Keybindings' }
]

export function PreferencesDialog({
  onPreferencesChange,
  onRequestClose,
  preferences
}: PreferencesDialogProps) {
  const [activeTab, setActiveTab] = useState<PreferencesTab>('general')
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const conflicts = useMemo(
    () => detectShortcutConflicts(preferences.keybindings),
    [preferences.keybindings]
  )
  const activeTheme = useMemo(() => getTheme(preferences.theme), [preferences.theme])
  const definitionById = useMemo(
    () => Object.fromEntries(keybindingDefinitions.map(definition => [definition.id, definition])),
    []
  )
  const groupedDefinitions = useMemo(() => {
    return keybindingDefinitions.reduce<Array<{ group: string; items: typeof keybindingDefinitions }>>((groups, definition) => {
      const currentGroup = groups[groups.length - 1]

      if (currentGroup?.group === definition.group) {
        currentGroup.items.push(definition)
        return groups
      }

      groups.push({ group: definition.group, items: [definition] })
      return groups
    }, [])
  }, [])

  useEffect(() => {
    closeButtonRef.current?.focus()
  }, [])

  const updateTheme = (theme: Theme) => {
    onPreferencesChange({ ...preferences, theme })
  }

  const updateViewMode = (viewMode: ViewMode) => {
    onPreferencesChange({ ...preferences, viewMode })
  }

  const updateKeybinding = (actionId: KeybindingActionId, shortcut: string) => {
    onPreferencesChange({
      ...preferences,
      keybindings: {
        ...preferences.keybindings,
        [actionId]: shortcut
      }
    })
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onRequestClose()
      return
    }

    if (event.key === 'Tab') {
      trapDialogTab(event, dialogRef.current)
    }
  }

  return (
    <div className="preferencesBackdrop" onMouseDown={onRequestClose}>
      <div
        ref={dialogRef}
        aria-label="Preferences"
        aria-modal="true"
        className="preferencesDialog"
        onKeyDown={handleKeyDown}
        onMouseDown={event => event.stopPropagation()}
        role="dialog"
      >
        <header className="preferencesHeader">
          <div>
            <Settings size={18} aria-hidden="true" />
            <div>
              <h2>Preferences</h2>
              <p>Saved locally</p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onRequestClose}
            title="Close preferences"
            aria-label="Close preferences"
          >
            <X size={16} />
          </button>
        </header>

        <div className="preferencesBody">
          <nav className="preferencesTabs" aria-label="Preference sections">
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                className={activeTab === tab.id ? 'active' : ''}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.id === 'general' ? <SlidersHorizontal size={15} /> : <Keyboard size={15} />}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <section className="preferencesPanel" aria-label={`${activeTab} preferences`}>
            {activeTab === 'general' ? (
              <div className="preferencesSection">
                <div className="preferenceBlock">
                  <div>
                    <h3>Theme</h3>
                    <p>{activeTheme.label} application chrome</p>
                  </div>
                  <div className="preferenceSegment themeSegment" aria-label="Theme preference">
                    {appVisibleThemes.map(option => {
                      const Icon = iconForTheme(option.id)

                      return (
                        <button
                          key={option.id}
                          type="button"
                          className={preferences.theme === option.id ? 'active' : ''}
                          onClick={() => updateTheme(option.id)}
                        >
                          <Icon size={15} />
                          <span>{option.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="preferenceBlock">
                  <div>
                    <h3>Default view</h3>
                    <p>Restored on next launch</p>
                  </div>
                  <div className="preferenceSegment viewModeSegment" aria-label="Default view mode preference">
                    {(['source', 'split', 'preview'] as const).map(mode => (
                      <button
                        key={mode}
                        type="button"
                        className={preferences.viewMode === mode ? 'active' : ''}
                        onClick={() => updateViewMode(mode)}
                      >
                        {mode === 'split' ? <SplitSquareHorizontal size={15} /> : null}
                        <span>{mode}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <p className="preferenceNote">Preferences use local storage on this device.</p>
              </div>
            ) : (
              <div className="preferencesSection keybindingSection">
                <div className="keybindingSummary">
                  <span>{keybindingDefinitions.length} actions</span>
                  <span>{conflicts.length} conflicts</span>
                  <button
                    type="button"
                    onClick={() => onPreferencesChange({ ...preferences, keybindings: resetKeybindings() })}
                  >
                    <RotateCcw size={14} />
                    <span>Reset all</span>
                  </button>
                </div>

                <div className="keybindingGroups">
                  {groupedDefinitions.map(group => (
                    <section className="keybindingGroup" key={group.group}>
                      <h3>{group.group}</h3>
                      <div className="keybindingRows">
                        {group.items.map(definition => {
                          const conflict = conflictForAction(definition.id, conflicts)
                          const shortcut = preferences.keybindings[definition.id] ?? ''
                          const conflictLabels = conflict?.actionIds
                            .filter(actionId => actionId !== definition.id)
                            .map(actionId => definitionById[actionId]?.label ?? actionId)
                            .join(', ')

                          return (
                            <div className={conflict ? 'keybindingRow conflict' : 'keybindingRow'} key={definition.id}>
                              <div className="keybindingCopy">
                                <strong>{definition.label}</strong>
                                <span>{definition.id}</span>
                                {conflict && <em>Conflict with {conflictLabels}</em>}
                              </div>
                              <label className="keybindingInput">
                                <span>{displayShortcut(shortcut)}</span>
                                <input
                                  value={shortcut}
                                  onChange={event => updateKeybinding(definition.id, event.target.value)}
                                  maxLength={32}
                                  placeholder="Unassigned"
                                  aria-label={`${definition.label} shortcut`}
                                />
                              </label>
                              <button
                                type="button"
                                className="keybindingReset"
                                onClick={() => {
                                  onPreferencesChange({
                                    ...preferences,
                                    keybindings: resetKeybinding(definition.id, preferences.keybindings)
                                  })
                                }}
                                title={`Reset ${definition.label}`}
                                aria-label={`Reset ${definition.label}`}
                              >
                                <RotateCcw size={14} />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function iconForTheme(theme: Theme): LucideIcon {
  if (theme === 'dark') return Moon
  if (theme === 'github') return FileCode
  if (theme === 'high-contrast') return ShieldCheck
  if (theme === 'modern-neutral') return Settings
  if (theme === 'sepia') return BookOpenText
  return Sun
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
