import { describe, expect, it } from 'vitest'
import {
  closeStatusLabel,
  externalChangeLabel,
  fileStatusLabel,
  isDirty,
  normalizeExternalChange,
  reconcileFileInfo,
  shouldPromptForClose,
  type LifecycleDocument
} from './documentLifecycle'

function document(overrides: Partial<LifecycleDocument> = {}): LifecycleDocument {
  return {
    externalChange: 'none',
    lastKnownFileInfo: { exists: true, modifiedMs: 100, len: 5 },
    path: 'C:/notes/test.md',
    savedText: 'saved',
    text: 'saved',
    ...overrides
  }
}

describe('document lifecycle helpers', () => {
  it('tracks dirty state from saved text', () => {
    expect(isDirty(document())).toBe(false)
    expect(isDirty(document({ text: 'draft' }))).toBe(true)
    expect(shouldPromptForClose(document({ text: 'draft' }))).toBe(true)
    expect(shouldPromptForClose(null)).toBe(false)
  })

  it('normalizes legacy external change values', () => {
    expect(normalizeExternalChange(true)).toBe('modified')
    expect(normalizeExternalChange(false)).toBe('none')
    expect(normalizeExternalChange('missing')).toBe('missing')
  })

  it('classifies modified and missing files from metadata', () => {
    expect(reconcileFileInfo(document(), { exists: true, modifiedMs: 120, len: 6 })).toEqual({
      externalChange: 'modified',
      lastKnownFileInfo: { exists: true, modifiedMs: 100, len: 5 }
    })
    expect(reconcileFileInfo(document(), { exists: false, modifiedMs: null, len: null })).toEqual({
      externalChange: 'missing',
      lastKnownFileInfo: { exists: false, modifiedMs: null, len: null }
    })
  })

  it('keeps a missing-file snooze quiet until metadata changes meaningfully', () => {
    const snoozedMissing = document({
      externalChange: 'none',
      lastKnownFileInfo: { exists: false, modifiedMs: null, len: null }
    })

    expect(reconcileFileInfo(snoozedMissing, { exists: false, modifiedMs: null, len: null })).toEqual({
      externalChange: 'none',
      lastKnownFileInfo: { exists: false, modifiedMs: null, len: null }
    })
    expect(reconcileFileInfo(snoozedMissing, { exists: true, modifiedMs: 140, len: 7 })).toEqual({
      externalChange: 'modified',
      lastKnownFileInfo: { exists: false, modifiedMs: null, len: null }
    })
  })

  it('keeps an unsnoozed missing-file notice visible across polls', () => {
    expect(reconcileFileInfo(document({
      externalChange: 'missing',
      lastKnownFileInfo: { exists: false, modifiedMs: null, len: null }
    }), { exists: false, modifiedMs: null, len: null })).toEqual({
      externalChange: 'missing',
      lastKnownFileInfo: { exists: false, modifiedMs: null, len: null }
    })
  })

  it('uses first metadata poll as baseline when no prior file info exists', () => {
    expect(reconcileFileInfo(document({ lastKnownFileInfo: null }), { exists: true, modifiedMs: 120, len: 6 })).toEqual({
      externalChange: 'none',
      lastKnownFileInfo: { exists: true, modifiedMs: 120, len: 6 }
    })
  })

  it('returns concise file status labels', () => {
    expect(fileStatusLabel(null)).toBe('No document')
    expect(fileStatusLabel(document({ path: null }))).toBe('Unsaved tab')
    expect(fileStatusLabel(document({ text: 'draft', path: null }))).toBe('Unsaved local draft')
    expect(fileStatusLabel(document({ externalChange: 'modified' }))).toBe('Changed on disk')
    expect(fileStatusLabel(document({ externalChange: 'modified', text: 'draft' }))).toBe('Local edits newer')
    expect(fileStatusLabel(document({ externalChange: 'missing' }))).toBe('Missing on disk')
    expect(externalChangeLabel('modified')).toBe('Changed on disk')
  })

  it('describes close outcomes for last-tab replacement and normal tab close', () => {
    expect(closeStatusLabel(0)).toBe('Started a new document')
    expect(closeStatusLabel(2)).toBe('Closed document tab')
  })
})
