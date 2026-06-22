import { describe, expect, it } from 'vitest'
import {
  actionIdFromKeyboardEvent,
  commandPaletteActionId,
  detectShortcutConflicts,
  displayShortcut,
  keybindingDefinitions,
  quickInsertActionId,
  resetKeybinding,
  restoreEditorPreferences,
  templatesHelpActionId
} from './editorPreferences'

const keyboardEvent = (input: Partial<KeyboardEvent>): KeyboardEvent => ({
  altKey: false,
  code: '',
  ctrlKey: false,
  key: '',
  metaKey: false,
  shiftKey: false,
  ...input
}) as KeyboardEvent

describe('editor preferences', () => {
  it('migrates legacy theme and view mode records onto the v2 keybinding shape', () => {
    const preferences = restoreEditorPreferences({
      theme: 'dark',
      viewMode: 'preview'
    })

    expect(preferences).toMatchObject({
      version: 2,
      theme: 'dark',
      viewMode: 'preview'
    })
    expect(preferences.keybindings[commandPaletteActionId]).toBe('Ctrl+Shift+P')
    expect(preferences.keybindings[quickInsertActionId]).toBe('Ctrl+/')
    expect(preferences.keybindings[templatesHelpActionId]).toBe('Ctrl+Alt+T')
    expect(preferences.keybindings['format.bold']).toBe('Ctrl+B')
    expect(preferences.keybindings['format.strikethrough']).toBe('')
    expect(preferences.keybindings['edit.duplicate']).toBe('Ctrl+D')
  })

  it('falls back safely for invalid stored preference data', () => {
    expect(restoreEditorPreferences('nope')).toMatchObject({
      version: 2,
      theme: 'light',
      viewMode: 'split'
    })
    expect(restoreEditorPreferences({ theme: 'sepia', viewMode: 'reader' })).toMatchObject({
      theme: 'sepia',
      viewMode: 'split'
    })
    expect(restoreEditorPreferences({ theme: 'high-contrast', viewMode: 'reader' })).toMatchObject({
      theme: 'high-contrast',
      viewMode: 'split'
    })
    expect(restoreEditorPreferences({ theme: 'github', viewMode: 'reader' })).toMatchObject({
      theme: 'github',
      viewMode: 'split'
    })
    expect(restoreEditorPreferences({ theme: 'modern-neutral', viewMode: 'reader' })).toMatchObject({
      theme: 'modern-neutral',
      viewMode: 'split'
    })
    expect(restoreEditorPreferences({ theme: 'not-real', viewMode: 'reader' })).toMatchObject({
      theme: 'light',
      viewMode: 'split'
    })
  })

  it('normalizes shortcut labels for display and marks blank values unassigned', () => {
    expect(displayShortcut(' ctrl + shift + 7 ')).toBe('Ctrl+Shift+7')
    expect(displayShortcut('')).toBe('Unassigned')
    expect(displayShortcut('Ctrl+')).toBe('Unassigned')
  })

  it('detects duplicate non-empty shortcuts', () => {
    const preferences = restoreEditorPreferences({
      keybindings: {
        [commandPaletteActionId]: 'Ctrl+B',
        'format.bold': 'Ctrl+B',
        'format.italic': ''
      }
    })

    expect(detectShortcutConflicts(preferences.keybindings)).toContainEqual({
      shortcut: 'Ctrl+B',
      actionIds: [commandPaletteActionId, 'format.bold']
    })
  })

  it('matches shortcuts with Ctrl or Meta as the primary modifier', () => {
    const preferences = restoreEditorPreferences(null)

    expect(actionIdFromKeyboardEvent(
      keyboardEvent({ code: 'KeyB', ctrlKey: true, key: 'b' }),
      preferences.keybindings
    )).toBe('format.bold')
    expect(actionIdFromKeyboardEvent(
      keyboardEvent({ code: 'KeyB', key: 'b', metaKey: true }),
      preferences.keybindings
    )).toBe('format.bold')
  })

  it('matches shifted digit shortcuts by code so punctuation keyboard values still work', () => {
    const preferences = restoreEditorPreferences(null)

    expect(actionIdFromKeyboardEvent(
      keyboardEvent({ code: 'Digit7', ctrlKey: true, key: '&', shiftKey: true }),
      preferences.keybindings
    )).toBe('block.orderedList')
  })

  it('matches the quick insert app shortcut', () => {
    const preferences = restoreEditorPreferences(null)

    expect(actionIdFromKeyboardEvent(
      keyboardEvent({ code: 'Slash', ctrlKey: true, key: '/' }),
      preferences.keybindings
    )).toBe(quickInsertActionId)
  })

  it('matches the templates and help app shortcut', () => {
    const preferences = restoreEditorPreferences(null)

    expect(actionIdFromKeyboardEvent(
      keyboardEvent({ altKey: true, code: 'KeyT', ctrlKey: true, key: 't' }),
      preferences.keybindings
    )).toBe(templatesHelpActionId)
  })

  it('does not match blank shortcuts', () => {
    const preferences = restoreEditorPreferences({
      keybindings: {
        'format.bold': ''
      }
    })

    expect(actionIdFromKeyboardEvent(
      keyboardEvent({ code: 'KeyB', ctrlKey: true, key: 'b' }),
      preferences.keybindings
    )).toBeNull()
  })

  it('uses the first registry item when duplicate shortcuts are triggered', () => {
    const preferences = restoreEditorPreferences({
      keybindings: {
        [commandPaletteActionId]: 'Ctrl+B',
        'format.bold': 'Ctrl+B'
      }
    })

    expect(actionIdFromKeyboardEvent(
      keyboardEvent({ code: 'KeyB', ctrlKey: true, key: 'b' }),
      preferences.keybindings,
      keybindingDefinitions
    )).toBe(commandPaletteActionId)
  })

  it('resets a single keybinding to its default value', () => {
    const preferences = restoreEditorPreferences({
      keybindings: {
        'format.bold': 'Ctrl+Alt+B'
      }
    })

    expect(resetKeybinding('format.bold', preferences.keybindings)['format.bold']).toBe('Ctrl+B')
  })
})
