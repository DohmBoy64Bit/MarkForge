import {
  createDefaultPreferences,
  editorPrefsKey,
  readEditorPreferences as readCoreEditorPreferences,
  restoreEditorPreferences as restoreCoreEditorPreferences,
  saveEditorPreferences as saveCoreEditorPreferences,
  type EditorPreferences as CoreEditorPreferences,
  type KeybindingDefinition as CoreKeybindingDefinition,
  type ThemePreference
} from '@markforge/core'
import { commandGroups, editorCommands, type EditorCommandId } from '@markforge/editor-engine'

export { editorPrefsKey }

export type Theme = ThemePreference
export type ViewMode = 'preview' | 'rich' | 'source' | 'split'
export type KeybindingActionId = 'app.commandPalette' | 'app.quickInsert' | 'app.templatesHelp' | EditorCommandId

export type KeybindingDefinition = CoreKeybindingDefinition<KeybindingActionId>
export type EditorPreferences = Omit<CoreEditorPreferences<KeybindingActionId>, 'viewMode'> & {
  viewMode: ViewMode
}

export type ShortcutConflict = {
  shortcut: string
  actionIds: KeybindingActionId[]
}

type ShortcutEvent = Pick<KeyboardEvent, 'altKey' | 'code' | 'ctrlKey' | 'key' | 'metaKey' | 'shiftKey'>

export const commandPaletteActionId = 'app.commandPalette' as const
export const quickInsertActionId = 'app.quickInsert' as const
export const templatesHelpActionId = 'app.templatesHelp' as const

export const keybindingDefinitions: KeybindingDefinition[] = [
  {
    id: commandPaletteActionId,
    label: 'Command Palette',
    group: 'Application',
    defaultShortcut: 'Ctrl+Shift+P'
  },
  {
    id: quickInsertActionId,
    label: 'Quick Insert',
    group: 'Application',
    defaultShortcut: 'Ctrl+/'
  },
  {
    id: templatesHelpActionId,
    label: 'Templates and Help',
    group: 'Application',
    defaultShortcut: 'Ctrl+Alt+T'
  },
  ...editorCommands.map(command => ({
    id: command.id,
    label: command.label,
    group: commandGroups.find(group => group.id === command.group)?.label ?? command.group,
    defaultShortcut: command.shortcut ?? ''
  }))
]

const defaultKeybindings = createDefaultPreferences(keybindingDefinitions).keybindings

export const defaultEditorPreferences: EditorPreferences = {
  ...createDefaultPreferences(keybindingDefinitions),
  viewMode: 'split'
}

export function restoreEditorPreferences(value: unknown): EditorPreferences {
  const restored = restoreCoreEditorPreferences(value, keybindingDefinitions)
  const storedViewMode = isRecord(value) ? value.viewMode : null

  return {
    ...restored,
    viewMode: isViewMode(storedViewMode) ? storedViewMode : restored.viewMode
  }
}

export function readEditorPreferences(storage: Storage = window.localStorage): EditorPreferences {
  return readCoreEditorPreferences(storage, keybindingDefinitions)
}

export function saveEditorPreferences(
  preferences: EditorPreferences,
  storage: Storage = window.localStorage
): void {
  saveCoreEditorPreferences(storage, preferences as CoreEditorPreferences<KeybindingActionId>)
}

export function shortcutForAction(
  actionId: KeybindingActionId,
  keybindings: Record<KeybindingActionId, string>
): string {
  return keybindings[actionId] ?? defaultKeybindings[actionId] ?? ''
}

export function displayShortcut(shortcut: string): string {
  return normalizeShortcut(shortcut) || 'Unassigned'
}

export function resetKeybindings(): Record<KeybindingActionId, string> {
  return { ...defaultKeybindings }
}

export function resetKeybinding(
  actionId: KeybindingActionId,
  keybindings: Record<KeybindingActionId, string>
): Record<KeybindingActionId, string> {
  return {
    ...keybindings,
    [actionId]: defaultKeybindings[actionId] ?? ''
  }
}

export function detectShortcutConflicts(
  keybindings: Record<KeybindingActionId, string>,
  definitions: KeybindingDefinition[] = keybindingDefinitions
): ShortcutConflict[] {
  const byShortcut = new Map<string, KeybindingActionId[]>()

  for (const definition of definitions) {
    const shortcut = normalizeShortcut(shortcutForAction(definition.id, keybindings))
    if (!shortcut) continue

    byShortcut.set(shortcut, [...(byShortcut.get(shortcut) ?? []), definition.id])
  }

  return Array.from(byShortcut.entries())
    .filter(([, actionIds]) => actionIds.length > 1)
    .map(([shortcut, actionIds]) => ({ shortcut, actionIds }))
}

export function conflictForAction(
  actionId: KeybindingActionId,
  conflicts: ShortcutConflict[]
): ShortcutConflict | null {
  return conflicts.find(conflict => conflict.actionIds.includes(actionId)) ?? null
}

export function actionIdFromKeyboardEvent(
  event: ShortcutEvent,
  keybindings: Record<KeybindingActionId, string>,
  definitions: KeybindingDefinition[] = keybindingDefinitions
): KeybindingActionId | null {
  // Registry order is the deterministic tie-breaker when users assign duplicate shortcuts.
  for (const definition of definitions) {
    if (matchesShortcut(shortcutForAction(definition.id, keybindings), event)) {
      return definition.id
    }
  }

  return null
}

export function matchesShortcut(shortcut: string, event: ShortcutEvent): boolean {
  const parsed = parseShortcut(shortcut)

  if (!parsed) return false

  const hasPrimaryModifier = event.ctrlKey || event.metaKey

  if (parsed.primary !== hasPrimaryModifier) return false
  if (parsed.shift !== event.shiftKey) return false
  if (parsed.alt !== event.altKey) return false

  if (/^\d$/.test(parsed.key)) return event.code === `Digit${parsed.key}` || event.key === parsed.key

  return event.key.toLowerCase() === parsed.key.toLowerCase()
}

export function normalizeShortcut(shortcut: string): string {
  const parsed = parseShortcut(shortcut)

  if (!parsed) return ''

  return [
    parsed.primary ? 'Ctrl' : null,
    parsed.shift ? 'Shift' : null,
    parsed.alt ? 'Alt' : null,
    formatKeyToken(parsed.key)
  ].filter(Boolean).join('+')
}

function parseShortcut(shortcut: string): { alt: boolean; key: string; primary: boolean; shift: boolean } | null {
  const tokens = shortcut
    .trim()
    .split('+')
    .map(token => token.trim())
    .filter(Boolean)

  if (tokens.length === 0) return null

  let alt = false
  let primary = false
  let shift = false
  let key = ''

  for (const token of tokens) {
    const normalized = token.toLowerCase()

    if (normalized === 'ctrl' || normalized === 'control' || normalized === 'cmd' || normalized === 'command' || normalized === 'meta') {
      primary = true
    } else if (normalized === 'shift') {
      shift = true
    } else if (normalized === 'alt' || normalized === 'option') {
      alt = true
    } else {
      if (key) return null
      key = token
    }
  }

  if (!key) return null

  return { alt, key: formatKeyToken(key), primary, shift }
}

function formatKeyToken(key: string): string {
  if (key.length === 1) return key.toUpperCase()

  const lowerKey = key.toLowerCase()
  if (lowerKey === 'space') return 'Space'
  if (lowerKey === 'escape' || lowerKey === 'esc') return 'Escape'
  if (lowerKey === 'enter' || lowerKey === 'return') return 'Enter'
  if (lowerKey === 'tab') return 'Tab'
  if (lowerKey === 'backspace') return 'Backspace'
  if (lowerKey === 'delete' || lowerKey === 'del') return 'Delete'

  return key
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isViewMode(value: unknown): value is ViewMode {
  return value === 'source' || value === 'split' || value === 'preview' || value === 'rich'
}
