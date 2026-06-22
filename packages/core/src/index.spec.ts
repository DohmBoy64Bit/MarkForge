import { describe, expect, it } from 'vitest'
import {
  createDefaultPreferences,
  readEditorPreferences,
  rememberRecentFile,
  restoreEditorPreferences,
  restoreEditorSession,
  saveEditorPreferences,
  type KeybindingDefinition
} from './index'

const definitions: KeybindingDefinition<'app.commandPalette' | 'format.bold'>[] = [
  { id: 'app.commandPalette', label: 'Command Palette', group: 'Application', defaultShortcut: 'Ctrl+Shift+P' },
  { id: 'format.bold', label: 'Bold', group: 'Formatting', defaultShortcut: 'Ctrl+B' }
]

function createStorage(initial: Record<string, string> = {}) {
  const entries = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    removeItem: (key: string) => {
      entries.delete(key)
    },
    setItem: (key: string, value: string) => {
      entries.set(key, value)
    }
  }
}

describe('@markforge/core', () => {
  it('creates and restores versioned editor preferences', () => {
    expect(createDefaultPreferences(definitions)).toEqual({
      version: 2,
      theme: 'light',
      viewMode: 'split',
      keybindings: {
        'app.commandPalette': 'Ctrl+Shift+P',
        'format.bold': 'Ctrl+B'
      }
    })

    expect(restoreEditorPreferences({
      theme: 'dark',
      viewMode: 'preview',
      keybindings: {
        'format.bold': 'Ctrl+Alt+B',
        unknown: 'Ctrl+U'
      }
    }, definitions).keybindings).toEqual({
      'app.commandPalette': 'Ctrl+Shift+P',
      'format.bold': 'Ctrl+Alt+B'
    })
  })

  it('reads and writes preferences through storage adapters', () => {
    const storage = createStorage()
    const preferences = createDefaultPreferences(definitions)

    saveEditorPreferences(storage, { ...preferences, theme: 'dark' })

    expect(readEditorPreferences(storage, definitions).theme).toBe('dark')
  })

  it('restores non-light/dark app chrome theme preferences', () => {
    expect(restoreEditorPreferences({ theme: 'sepia' }, definitions).theme).toBe('sepia')
    expect(restoreEditorPreferences({ theme: 'high-contrast' }, definitions).theme).toBe('high-contrast')
    expect(restoreEditorPreferences({ theme: 'github' }, definitions).theme).toBe('github')
    expect(restoreEditorPreferences({ theme: 'modern-neutral' }, definitions).theme).toBe('modern-neutral')
    expect(restoreEditorPreferences({ theme: 'not-real' }, definitions).theme).toBe('light')
  })

  it('normalizes sessions and recent files', () => {
    expect(restoreEditorSession({
      activeId: 'a',
      docs: [
        { id: 'a', title: 'A.md', text: '# A', savedText: '# A', path: 'A.md', createdAt: 1, updatedAt: 2 },
        { id: 'bad', title: 'Bad.md' }
      ]
    })?.docs).toHaveLength(1)

    expect(rememberRecentFile('b.md', ['a.md', 'b.md', 'a.md'], 3)).toEqual(['b.md', 'a.md'])
  })
})
