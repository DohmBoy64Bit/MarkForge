export type FileInfo = {
  exists: boolean
  modifiedMs: number | null
  len: number | null
}

export type ExternalChangeState = 'none' | 'modified' | 'missing'

export type LifecycleDocument = {
  externalChange: ExternalChangeState
  lastKnownFileInfo: FileInfo | null
  path: string | null
  savedText: string
  text: string
}

export function isDirty(document: LifecycleDocument): boolean {
  return document.text !== document.savedText
}

export function normalizeExternalChange(value: unknown): ExternalChangeState {
  if (value === 'modified' || value === 'missing') return value
  if (value === true) return 'modified'
  return 'none'
}

export function reconcileFileInfo(document: LifecycleDocument, currentInfo: FileInfo): {
  externalChange: ExternalChangeState
  lastKnownFileInfo: FileInfo
} {
  if (!currentInfo.exists) {
    const alreadySawMissingFile = document.lastKnownFileInfo?.exists === false

    return {
      externalChange: alreadySawMissingFile ? normalizeExternalChange(document.externalChange) : 'missing',
      lastKnownFileInfo: currentInfo
    }
  }

  if (document.lastKnownFileInfo?.exists === false) {
    return {
      externalChange: 'modified',
      lastKnownFileInfo: document.lastKnownFileInfo
    }
  }

  const previousModified = document.lastKnownFileInfo?.modifiedMs ?? null
  const currentModified = currentInfo.modifiedMs ?? null
  const changed = previousModified !== null &&
    currentModified !== null &&
    currentModified !== previousModified

  return {
    externalChange: changed ? 'modified' : normalizeExternalChange(document.externalChange),
    lastKnownFileInfo: document.lastKnownFileInfo ?? currentInfo
  }
}

export function externalChangeLabel(state: ExternalChangeState): string {
  if (state === 'missing') return 'Missing on disk'
  if (state === 'modified') return 'Changed on disk'
  return 'No external changes'
}

export function fileStatusLabel(document: LifecycleDocument | null): string {
  if (!document) return 'No document'
  if (!document.path) return isDirty(document) ? 'Unsaved local draft' : 'Unsaved tab'
  if (document.externalChange === 'missing') return 'Missing on disk'
  if (document.externalChange === 'modified') return isDirty(document) ? 'Local edits newer' : 'Changed on disk'
  if (isDirty(document)) return 'Unsaved changes'
  return 'Saved'
}

export function shouldPromptForClose(document: LifecycleDocument | null): boolean {
  return document ? isDirty(document) : false
}

export function closeStatusLabel(remainingCount: number): string {
  return remainingCount === 0 ? 'Started a new document' : 'Closed document tab'
}
