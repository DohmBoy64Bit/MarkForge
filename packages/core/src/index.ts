import { isRecord, type StorageLike } from '@markforge/shared'

export type ThemePreference = 'dark' | 'light'
export type ViewModePreference = 'preview' | 'source' | 'split'

export type KeybindingDefinition<TActionId extends string = string> = {
  defaultShortcut: string
  group: string
  id: TActionId
  label: string
}

export type EditorPreferences<TActionId extends string = string> = {
  keybindings: Record<TActionId, string>
  theme: ThemePreference
  version: 2
  viewMode: ViewModePreference
}

export type PersistedSessionDocument = {
  createdAt: number
  id: string
  path: string | null
  savedText: string
  text: string
  title: string
  updatedAt: number
}

export type PersistedEditorSession = {
  activeId: string | null
  docs: PersistedSessionDocument[]
}

export const editorPrefsKey = 'markforge.editor.prefs.v1'
export const editorSessionKey = 'markforge.editor.session.v1'
export const recentFilesKey = 'markforge.editor.recent.v1'

export function createDefaultPreferences<TActionId extends string>(
  definitions: KeybindingDefinition<TActionId>[]
): EditorPreferences<TActionId> {
  return {
    version: 2,
    theme: 'light',
    viewMode: 'split',
    keybindings: Object.fromEntries(
      definitions.map(definition => [definition.id, definition.defaultShortcut])
    ) as Record<TActionId, string>
  }
}

export function restoreEditorPreferences<TActionId extends string>(
  value: unknown,
  definitions: KeybindingDefinition<TActionId>[]
): EditorPreferences<TActionId> {
  const defaults = createDefaultPreferences(definitions)
  if (!isRecord(value)) return clonePreferences(defaults)

  return {
    version: 2,
    theme: value.theme === 'dark' ? 'dark' : 'light',
    viewMode: isViewMode(value.viewMode) ? value.viewMode : 'split',
    keybindings: restoreKeybindings(value.keybindings, defaults.keybindings, definitions)
  }
}

export function readEditorPreferences<TActionId extends string>(
  storage: StorageLike,
  definitions: KeybindingDefinition<TActionId>[]
): EditorPreferences<TActionId> {
  return restoreEditorPreferences(readJson(storage, editorPrefsKey), definitions)
}

export function saveEditorPreferences<TActionId extends string>(
  storage: StorageLike,
  preferences: EditorPreferences<TActionId>
): void {
  writeJson(storage, editorPrefsKey, preferences)
}

export function restoreEditorSession(value: unknown): PersistedEditorSession | null {
  if (!isRecord(value) || !Array.isArray(value.docs)) return null

  const docs = value.docs.flatMap(document => {
    if (!isRecord(document) || typeof document.text !== 'string' || typeof document.title !== 'string') return []

    return [{
      id: typeof document.id === 'string' ? document.id : '',
      title: document.title,
      path: typeof document.path === 'string' ? document.path : null,
      text: document.text,
      savedText: typeof document.savedText === 'string' ? document.savedText : '',
      createdAt: typeof document.createdAt === 'number' ? document.createdAt : Date.now(),
      updatedAt: typeof document.updatedAt === 'number' ? document.updatedAt : Date.now()
    }]
  })

  return {
    activeId: typeof value.activeId === 'string' ? value.activeId : null,
    docs
  }
}

export function readEditorSession(storage: StorageLike): PersistedEditorSession | null {
  return restoreEditorSession(readJson(storage, editorSessionKey))
}

export function saveEditorSession(storage: StorageLike, session: PersistedEditorSession): void {
  writeJson(storage, editorSessionKey, session)
}

export function readRecentFiles(storage: StorageLike): string[] {
  return normalizeRecentFiles(readJson(storage, recentFilesKey))
}

export function saveRecentFiles(storage: StorageLike, paths: string[]): string[] {
  const normalized = normalizeRecentFiles(paths)
  writeJson(storage, recentFilesKey, normalized)
  return normalized
}

export function rememberRecentFile(path: string, existingPaths: string[], maxItems = 8): string[] {
  const normalizedPath = path.trim()
  if (!normalizedPath) return normalizeRecentFiles(existingPaths, maxItems)

  return [
    normalizedPath,
    ...normalizeRecentFiles(existingPaths, maxItems).filter(recent => recent !== normalizedPath)
  ].slice(0, maxItems)
}

export function readJson<T = unknown>(storage: StorageLike, key: string): T | null {
  try {
    const value = storage.getItem(key)
    return value ? JSON.parse(value) as T : null
  } catch {
    return null
  }
}

export function writeJson(storage: StorageLike, key: string, value: unknown): void {
  try {
    storage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage is a convenience layer; callers should keep running without it.
  }
}

function restoreKeybindings<TActionId extends string>(
  value: unknown,
  defaults: Record<TActionId, string>,
  definitions: KeybindingDefinition<TActionId>[]
): Record<TActionId, string> {
  if (!isRecord(value)) return { ...defaults }

  const restored = { ...defaults }
  for (const definition of definitions) {
    const shortcut = value[definition.id]
    if (typeof shortcut === 'string') restored[definition.id] = shortcut
  }

  return restored
}

function normalizeRecentFiles(value: unknown, maxItems = 8): string[] {
  if (!Array.isArray(value)) return []

  const seen = new Set<string>()
  const paths: string[] = []

  for (const item of value) {
    if (typeof item !== 'string') continue
    const normalized = item.trim()
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    paths.push(normalized)
  }

  return paths.slice(0, maxItems)
}

function isViewMode(value: unknown): value is ViewModePreference {
  return value === 'source' || value === 'split' || value === 'preview'
}

function clonePreferences<TActionId extends string>(
  preferences: EditorPreferences<TActionId>
): EditorPreferences<TActionId> {
  return {
    ...preferences,
    keybindings: { ...preferences.keybindings }
  }
}
