import { assertNotCancelled, err, ok, toError, type CancellableOptions, type Disposable, type Result } from '@markforge/shared'

export type FileInfo = {
  exists: boolean
  len: number | null
  modifiedMs: number | null
}

export type FileDialogFilter = {
  extensions: string[]
  name: string
}

export type OpenFileDialogOptions = {
  directory?: boolean
  filters?: FileDialogFilter[]
  multiple?: boolean
}

export type SaveFileDialogOptions = {
  defaultPath?: string
  filters?: FileDialogFilter[]
}

export type PlatformAdapters = {
  clipboard?: {
    readText(): Promise<string>
    writeText(text: string): Promise<void>
  }
  dialogs?: {
    open(options: OpenFileDialogOptions): Promise<string | string[] | null>
    save?(options: SaveFileDialogOptions): Promise<string | null>
  }
  filesystem?: {
    getFileInfo(path: string): Promise<FileInfo>
    listWorkspaceFiles?(root: string): Promise<WorkspaceFileEntry[]>
    readBinaryFile?(path: string): Promise<Uint8Array>
    readTextFile(path: string): Promise<string>
    searchWorkspace?(root: string, options: WorkspaceSearchOptions): Promise<WorkspaceSearchMatch[]>
    writeBinaryFile?(path: string, contents: Uint8Array): Promise<void>
    writeTextFile?(path: string, contents: string): Promise<void>
  }
  fileWatcher?: {
    watchFile(options: FileWatcherOptions, onEvent: (event: FileWatchEvent) => void): Result<Disposable>
    watchWorkspace?(options: WorkspaceWatcherOptions, onEvent: (event: WorkspaceWatchEvent) => void): Result<Disposable>
  }
  print?: {
    print(): void
  }
  shell?: {
    addRecentDocument(path: string): Promise<void>
  }
  spellcheck?: {
    checkText(text: string, options?: SpellcheckOptions): Promise<SpellcheckIssue[]>
  }
  updater?: {
    getStatus(): Promise<UpdateStatus>
  }
  window?: {
    destroy(): Promise<void>
    onCloseRequested(handler: (event: WindowCloseRequestedEvent) => void | Promise<void>): Promise<() => void>
  }
}

export type FileWatchEvent = {
  current: FileInfo
  path: string
  type: 'changed' | 'missing'
}

export type FileWatcherOptions = {
  intervalMs?: number
  path: string
  previousInfo: FileInfo | null
}

export type PlatformServices = {
  clipboard: ClipboardService
  dialogs: DialogService
  filesystem: FilesystemService
  lifecycle: WindowLifecycleService
  print: PrintService
  shell: ShellIntegrationService
  spellcheck: SpellcheckService
  updater: UpdateService
  watchFile(options: FileWatcherOptions, onEvent: (event: FileWatchEvent) => void): Result<Disposable>
  watchWorkspace(options: WorkspaceWatcherOptions, onEvent: (event: WorkspaceWatchEvent) => void): Result<Disposable>
}

export type ClipboardService = {
  readText(options?: CancellableOptions): Promise<Result<string>>
  writeText(text: string, options?: CancellableOptions): Promise<Result<void>>
}

export type DialogService = {
  openDocxFile(options?: CancellableOptions): Promise<Result<string | null>>
  openImageFile(options?: CancellableOptions): Promise<Result<string | null>>
  openMarkdownFile(options?: CancellableOptions): Promise<Result<string | null>>
  openPdfFile(options?: CancellableOptions): Promise<Result<string | null>>
  saveDocxFile(defaultPath?: string, options?: CancellableOptions): Promise<Result<string | null>>
  openWorkspaceDirectory(options?: CancellableOptions): Promise<Result<string | null>>
  saveHtmlFile(defaultPath?: string, options?: CancellableOptions): Promise<Result<string | null>>
  saveMarkdownFile(defaultPath?: string, options?: CancellableOptions): Promise<Result<string | null>>
  savePdfFile(defaultPath?: string, options?: CancellableOptions): Promise<Result<string | null>>
}

export type FilesystemService = {
  getFileInfo(path: string, options?: CancellableOptions): Promise<Result<FileInfo>>
  listWorkspaceFiles(root: string, options?: CancellableOptions): Promise<Result<WorkspaceFileEntry[]>>
  readBinaryFile(path: string, options?: CancellableOptions): Promise<Result<Uint8Array>>
  readTextFile(path: string, options?: CancellableOptions): Promise<Result<string>>
  searchWorkspace(root: string, searchOptions: WorkspaceSearchOptions, options?: CancellableOptions): Promise<Result<WorkspaceSearchMatch[]>>
  writeBinaryFile(path: string, contents: Uint8Array, options?: CancellableOptions): Promise<Result<void>>
  writeTextFile(path: string, contents: string, options?: CancellableOptions): Promise<Result<void>>
}

export type PrintService = {
  print(): Result<void>
}

export type ShellIntegrationService = {
  addRecentDocument(path: string, options?: CancellableOptions): Promise<Result<void>>
}

export type SpellcheckIssue = {
  end: number
  start: number
  suggestion?: string
  word: string
}

export type SpellcheckOptions = {
  ignoredWords?: string[]
  language?: string
}

export type SpellcheckService = {
  checkText(text: string, options?: SpellcheckOptions & CancellableOptions): Promise<Result<SpellcheckIssue[]>>
}

export type DictionarySpellcheckOptions = {
  dictionary: Iterable<string>
  suggestions?: Record<string, string>
}

export type UpdateStatus =
  | { channel: 'disabled'; reason: string; status: 'disabled' }
  | { currentVersion: string; status: 'current' }
  | { currentVersion: string; latestVersion: string; status: 'available'; url?: string }

export type UpdateService = {
  getStatus(options?: CancellableOptions): Promise<Result<UpdateStatus>>
}

export type WindowCloseRequestedEvent = {
  preventDefault(): void
}

export type WindowLifecycleService = {
  destroy(): Promise<Result<void>>
  protectClose(options: CloseProtectionOptions): Result<Disposable>
}

export type CloseProtectionOptions = {
  onClosePrevented(): void
  shouldPreventClose(): boolean
}

export type NativeFileWatchPayload = FileWatchEvent

export type WorkspaceFileEntry = {
  extension: string
  len: number | null
  modifiedMs: number | null
  name: string
  path: string
  relativePath: string
}

export type WorkspaceSearchOptions = {
  caseSensitive?: boolean
  limit?: number
  query: string
}

export type WorkspaceSearchMatch = {
  column: number
  line: number
  path: string
  preview: string
  relativePath: string
}

export type WorkspaceWatchEvent = {
  path: string
  relativePath: string
  root: string
  type: 'changed' | 'created' | 'missing'
}

export type WorkspaceWatcherOptions = {
  intervalMs?: number
  root: string
}

export type NativeWorkspaceWatchPayload = WorkspaceWatchEvent

export type NativeFileWatcherAdapters = {
  eventName?: string
  listen(eventName: string, handler: (payload: NativeFileWatchPayload) => void): Promise<() => void>
  onError?(error: unknown): void
  start(path: string): Promise<void>
  stop(path: string): Promise<void>
}

export type NativeWorkspaceWatcherAdapters = {
  eventName?: string
  listen(eventName: string, handler: (payload: NativeWorkspaceWatchPayload) => void): Promise<() => void>
  onError?(error: unknown): void
  start(root: string): Promise<void>
  stop(root: string): Promise<void>
}

export const markdownFileFilters: FileDialogFilter[] = [
  { name: 'Markdown and text', extensions: ['md', 'markdown', 'mdown', 'txt'] }
]

export const htmlFileFilters: FileDialogFilter[] = [
  { name: 'HTML document', extensions: ['html', 'htm'] }
]

export const docxFileFilters: FileDialogFilter[] = [
  { name: 'Word document', extensions: ['docx'] }
]

export const pdfFileFilters: FileDialogFilter[] = [
  { name: 'PDF document', extensions: ['pdf'] }
]

export const imageFileFilters: FileDialogFilter[] = [
  { name: 'Image', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tif', 'tiff'] }
]

export function createDictionarySpellcheckAdapter(options: DictionarySpellcheckOptions): NonNullable<PlatformAdapters['spellcheck']> {
  const dictionary = new Set(Array.from(options.dictionary, word => normalizeSpellcheckWord(word)).filter(Boolean))
  const suggestions = new Map(Object.entries(options.suggestions ?? {}).map(([word, suggestion]) => [
    normalizeSpellcheckWord(word),
    suggestion
  ]))

  return {
    async checkText(text, checkOptions) {
      const ignored = new Set((checkOptions?.ignoredWords ?? []).map(normalizeSpellcheckWord))
      const issues: SpellcheckIssue[] = []
      const wordPattern = /[A-Za-z][A-Za-z'-]*/g
      let match: RegExpExecArray | null

      while ((match = wordPattern.exec(text))) {
        const word = match[0]
        const normalized = normalizeSpellcheckWord(word)
        if (!normalized || ignored.has(normalized) || dictionary.has(normalized)) continue

        issues.push({
          start: match.index,
          end: match.index + word.length,
          word,
          suggestion: suggestions.get(normalized)
        })
      }

      return issues
    }
  }
}

export function createPlatformServices(adapters: PlatformAdapters): PlatformServices {
  const filesystem: FilesystemService = {
    async getFileInfo(path, options) {
      const cancelled = assertNotCancelled(options?.signal)
      if (!cancelled.ok) return cancelled
      if (!adapters.filesystem) return err('not-supported', 'Filesystem adapter is not available.')

      try {
        return ok(await adapters.filesystem.getFileInfo(path))
      } catch (error) {
        return { ok: false, error: toError(error, 'File info request failed.') }
      }
    },
    async readTextFile(path, options) {
      const cancelled = assertNotCancelled(options?.signal)
      if (!cancelled.ok) return cancelled
      if (!adapters.filesystem) return err('not-supported', 'Filesystem adapter is not available.')

      try {
        return ok(await adapters.filesystem.readTextFile(path))
      } catch (error) {
        return { ok: false, error: toError(error, 'File read failed.') }
      }
    },
    async readBinaryFile(path, options) {
      const cancelled = assertNotCancelled(options?.signal)
      if (!cancelled.ok) return cancelled
      const readBinaryFile = adapters.filesystem?.readBinaryFile
      if (!readBinaryFile) return err('not-supported', 'Binary file read adapter is not available.')

      try {
        return ok(await readBinaryFile(path))
      } catch (error) {
        return { ok: false, error: toError(error, 'Binary file read failed.') }
      }
    },
    async listWorkspaceFiles(root, options) {
      const cancelled = assertNotCancelled(options?.signal)
      if (!cancelled.ok) return cancelled
      const listWorkspaceFiles = adapters.filesystem?.listWorkspaceFiles
      if (!listWorkspaceFiles) return err('not-supported', 'Workspace file listing adapter is not available.')

      try {
        return ok(sortWorkspaceEntries(await listWorkspaceFiles(root)))
      } catch (error) {
        return { ok: false, error: toError(error, 'Workspace file listing failed.') }
      }
    },
    async searchWorkspace(root, searchOptions, options) {
      const cancelled = assertNotCancelled(options?.signal)
      if (!cancelled.ok) return cancelled
      if (!searchOptions.query.trim()) return ok([])
      const searchWorkspace = adapters.filesystem?.searchWorkspace
      if (!searchWorkspace) return err('not-supported', 'Workspace search adapter is not available.')

      try {
        return ok(await searchWorkspace(root, {
          ...searchOptions,
          limit: normalizeWorkspaceSearchLimit(searchOptions.limit)
        }))
      } catch (error) {
        return { ok: false, error: toError(error, 'Workspace search failed.') }
      }
    },
    async writeTextFile(path, contents, options) {
      const cancelled = assertNotCancelled(options?.signal)
      if (!cancelled.ok) return cancelled
      const writeTextFile = adapters.filesystem?.writeTextFile
      if (!writeTextFile) return err('not-supported', 'Filesystem write adapter is not available.')

      try {
        await writeTextFile(path, contents)
        return ok(undefined)
      } catch (error) {
        return { ok: false, error: toError(error, 'File write failed.') }
      }
    },
    async writeBinaryFile(path, contents, options) {
      const cancelled = assertNotCancelled(options?.signal)
      if (!cancelled.ok) return cancelled
      const writeBinaryFile = adapters.filesystem?.writeBinaryFile
      if (!writeBinaryFile) return err('not-supported', 'Binary file write adapter is not available.')

      try {
        await writeBinaryFile(path, contents)
        return ok(undefined)
      } catch (error) {
        return { ok: false, error: toError(error, 'Binary file write failed.') }
      }
    }
  }

  return {
    filesystem,
    dialogs: {
      async openDocxFile(options) {
        return openSingleFileDialog(adapters, docxFileFilters, 'DOCX open dialog failed.', options)
      },
      async openImageFile(options) {
        return openSingleFileDialog(adapters, imageFileFilters, 'Image open dialog failed.', options)
      },
      async openMarkdownFile(options) {
        const cancelled = assertNotCancelled(options?.signal)
        if (!cancelled.ok) return cancelled
        if (!adapters.dialogs) return err('not-supported', 'Open dialog adapter is not available.')

        try {
          const selected = await adapters.dialogs.open({ multiple: false, filters: markdownFileFilters })
          return ok(typeof selected === 'string' ? selected : null)
        } catch (error) {
          return { ok: false, error: toError(error, 'Open dialog failed.') }
        }
      },
      async openPdfFile(options) {
        return openSingleFileDialog(adapters, pdfFileFilters, 'PDF open dialog failed.', options)
      },
      async openWorkspaceDirectory(options) {
        const cancelled = assertNotCancelled(options?.signal)
        if (!cancelled.ok) return cancelled
        if (!adapters.dialogs) return err('not-supported', 'Open dialog adapter is not available.')

        try {
          const selected = await adapters.dialogs.open({ directory: true, multiple: false })
          return ok(typeof selected === 'string' ? selected : null)
        } catch (error) {
          return { ok: false, error: toError(error, 'Workspace open dialog failed.') }
        }
      },
      async saveHtmlFile(defaultPath, options) {
        const cancelled = assertNotCancelled(options?.signal)
        if (!cancelled.ok) return cancelled
        if (!adapters.dialogs?.save) return err('not-supported', 'Save dialog adapter is not available.')

        try {
          return ok(await adapters.dialogs.save({ defaultPath, filters: htmlFileFilters }))
        } catch (error) {
          return { ok: false, error: toError(error, 'Save dialog failed.') }
        }
      },
      async saveDocxFile(defaultPath, options) {
        return saveSingleFileDialog(adapters, docxFileFilters, defaultPath, 'DOCX save dialog failed.', options)
      },
      async saveMarkdownFile(defaultPath, options) {
        const cancelled = assertNotCancelled(options?.signal)
        if (!cancelled.ok) return cancelled
        if (!adapters.dialogs?.save) return err('not-supported', 'Save dialog adapter is not available.')

        try {
          return ok(await adapters.dialogs.save({ defaultPath, filters: markdownFileFilters }))
        } catch (error) {
          return { ok: false, error: toError(error, 'Save dialog failed.') }
        }
      },
      async savePdfFile(defaultPath, options) {
        return saveSingleFileDialog(adapters, pdfFileFilters, defaultPath, 'PDF save dialog failed.', options)
      }
    },
    clipboard: {
      async readText(options) {
        const cancelled = assertNotCancelled(options?.signal)
        if (!cancelled.ok) return cancelled
        if (!adapters.clipboard) return err('not-supported', 'Clipboard adapter is not available.')

        try {
          return ok(await adapters.clipboard.readText())
        } catch (error) {
          return { ok: false, error: toError(error, 'Clipboard read failed.') }
        }
      },
      async writeText(text, options) {
        const cancelled = assertNotCancelled(options?.signal)
        if (!cancelled.ok) return cancelled
        if (!adapters.clipboard) return err('not-supported', 'Clipboard adapter is not available.')

        try {
          await adapters.clipboard.writeText(text)
          return ok(undefined)
        } catch (error) {
          return { ok: false, error: toError(error, 'Clipboard write failed.') }
        }
      }
    },
    print: {
      print() {
        if (!adapters.print) return err('not-supported', 'Print adapter is not available.')
        adapters.print.print()
        return ok(undefined)
      }
    },
    shell: {
      async addRecentDocument(path, options) {
        const cancelled = assertNotCancelled(options?.signal)
        if (!cancelled.ok) return cancelled
        if (!adapters.shell) return err('not-supported', 'Shell recent-document adapter is not available.')

        try {
          await adapters.shell.addRecentDocument(path)
          return ok(undefined)
        } catch (error) {
          return { ok: false, error: toError(error, 'Shell recent-document update failed.') }
        }
      }
    },
    spellcheck: {
      async checkText(text, options) {
        const cancelled = assertNotCancelled(options?.signal)
        if (!cancelled.ok) return cancelled
        if (!adapters.spellcheck) return err('not-supported', 'Spellcheck adapter is not available.')

        try {
          return ok(await adapters.spellcheck.checkText(text, options))
        } catch (error) {
          return { ok: false, error: toError(error, 'Spellcheck failed.') }
        }
      }
    },
    updater: {
      async getStatus(options) {
        const cancelled = assertNotCancelled(options?.signal)
        if (!cancelled.ok) return cancelled
        if (!adapters.updater) {
          return ok({
            channel: 'disabled',
            reason: 'Updater adapter is not configured for this build.',
            status: 'disabled'
          })
        }

        try {
          return ok(await adapters.updater.getStatus())
        } catch (error) {
          return { ok: false, error: toError(error, 'Update status check failed.') }
        }
      }
    },
    lifecycle: {
      async destroy() {
        if (!adapters.window) return err('not-supported', 'Window lifecycle adapter is not available.')

        try {
          await adapters.window.destroy()
          return ok(undefined)
        } catch (error) {
          return { ok: false, error: toError(error, 'Window destroy failed.') }
        }
      },
      protectClose(options) {
        if (!adapters.window) return err('not-supported', 'Window lifecycle adapter is not available.')

        let disposed = false
        let unlisten: (() => void) | null = null

        adapters.window.onCloseRequested(event => {
          if (!options.shouldPreventClose()) return

          event.preventDefault()
          options.onClosePrevented()
        }).then(cleanup => {
          if (disposed) {
            cleanup()
            return
          }

          unlisten = cleanup
        }).catch(error => {
          // Close protection should never break app startup; callers still retain beforeunload fallback guards.
          console.warn(toError(error, 'Window close protection failed.').message)
        })

        return ok({
          dispose() {
            disposed = true
            unlisten?.()
          }
        })
      }
    },
    watchFile(options, onEvent) {
      if (adapters.fileWatcher) {
        return adapters.fileWatcher.watchFile(options, onEvent)
      }

      if (!adapters.filesystem) return err('not-supported', 'Filesystem adapter is not available.')
      if (typeof window === 'undefined') return err('not-supported', 'Polling file watching requires a browser window.')

      let previousInfo = options.previousInfo
      const interval = window.setInterval(async () => {
        const result = await filesystem.getFileInfo(options.path)
        if (!result.ok) return

        const current = result.value
        if (!current.exists) {
          if (previousInfo?.exists !== false) {
            onEvent({ path: options.path, current, type: 'missing' })
          }
          previousInfo = current
          return
        }

        if (
          previousInfo?.modifiedMs !== null &&
          previousInfo?.modifiedMs !== undefined &&
          current.modifiedMs !== null &&
          current.modifiedMs !== previousInfo.modifiedMs
        ) {
          onEvent({ path: options.path, current, type: 'changed' })
        }

        previousInfo = current
      }, options.intervalMs ?? 2500)

      return ok({
        dispose() {
          window.clearInterval(interval)
        }
      })
    },
    watchWorkspace(options, onEvent) {
      if (adapters.fileWatcher?.watchWorkspace) {
        return adapters.fileWatcher.watchWorkspace(options, onEvent)
      }

      const listWorkspaceFiles = filesystem.listWorkspaceFiles
      if (!adapters.filesystem?.listWorkspaceFiles) return err('not-supported', 'Workspace file listing adapter is not available.')
      if (typeof window === 'undefined') return err('not-supported', 'Polling workspace watching requires a browser window.')

      let previousEntries = new Map<string, WorkspaceFileEntry>()
      let disposed = false

      void listWorkspaceFiles(options.root).then(result => {
        if (!result.ok || disposed) return
        previousEntries = workspaceEntryMap(result.value)
      })

      const interval = window.setInterval(async () => {
        const result = await listWorkspaceFiles(options.root)
        if (!result.ok) return

        const currentEntries = workspaceEntryMap(result.value)

        for (const [path, current] of currentEntries) {
          const previous = previousEntries.get(path)
          if (!previous) {
            onEvent({ root: options.root, path, relativePath: current.relativePath, type: 'created' })
          } else if (previous.modifiedMs !== current.modifiedMs || previous.len !== current.len) {
            onEvent({ root: options.root, path, relativePath: current.relativePath, type: 'changed' })
          }
        }

        for (const [path, previous] of previousEntries) {
          if (!currentEntries.has(path)) {
            onEvent({ root: options.root, path, relativePath: previous.relativePath, type: 'missing' })
          }
        }

        previousEntries = currentEntries
      }, options.intervalMs ?? 5000)

      return ok({
        dispose() {
          disposed = true
          window.clearInterval(interval)
        }
      })
    }
  }
}

async function openSingleFileDialog(
  adapters: PlatformAdapters,
  filters: FileDialogFilter[],
  failureMessage: string,
  options?: CancellableOptions
): Promise<Result<string | null>> {
  const cancelled = assertNotCancelled(options?.signal)
  if (!cancelled.ok) return cancelled
  if (!adapters.dialogs) return err('not-supported', 'Open dialog adapter is not available.')

  try {
    const selected = await adapters.dialogs.open({ multiple: false, filters })
    return ok(typeof selected === 'string' ? selected : null)
  } catch (error) {
    return { ok: false, error: toError(error, failureMessage) }
  }
}

async function saveSingleFileDialog(
  adapters: PlatformAdapters,
  filters: FileDialogFilter[],
  defaultPath: string | undefined,
  failureMessage: string,
  options?: CancellableOptions
): Promise<Result<string | null>> {
  const cancelled = assertNotCancelled(options?.signal)
  if (!cancelled.ok) return cancelled
  if (!adapters.dialogs?.save) return err('not-supported', 'Save dialog adapter is not available.')

  try {
    return ok(await adapters.dialogs.save({ defaultPath, filters }))
  } catch (error) {
    return { ok: false, error: toError(error, failureMessage) }
  }
}

export function createNativeFileWatcher(adapters: NativeFileWatcherAdapters): PlatformAdapters['fileWatcher'] {
  return {
    watchFile(options, onEvent) {
      const eventName = adapters.eventName ?? 'markforge://file-watch'
      let disposed = false
      let unlisten: (() => void) | null = null

      adapters.listen(eventName, payload => {
        if (disposed || payload.path !== options.path) return
        onEvent(payload)
      }).then(cleanup => {
        if (disposed) {
          cleanup()
          return
        }

        unlisten = cleanup
        return adapters.start(options.path)
      }).catch(error => {
        adapters.onError?.(error)
      })

      return ok({
        dispose() {
          disposed = true
          unlisten?.()
          void adapters.stop(options.path).catch(error => adapters.onError?.(error))
        }
      })
    }
  }
}

export function createNativeWorkspaceWatcher(adapters: NativeWorkspaceWatcherAdapters): NonNullable<PlatformAdapters['fileWatcher']>['watchWorkspace'] {
  return (options, onEvent) => {
    const eventName = adapters.eventName ?? 'markforge://workspace-watch'
    let disposed = false
    let unlisten: (() => void) | null = null

    adapters.listen(eventName, payload => {
      if (disposed || payload.root !== options.root) return
      onEvent(payload)
    }).then(cleanup => {
      if (disposed) {
        cleanup()
        return
      }

      unlisten = cleanup
      return adapters.start(options.root)
    }).catch(error => {
      adapters.onError?.(error)
    })

    return ok({
      dispose() {
        disposed = true
        unlisten?.()
        void adapters.stop(options.root).catch(error => adapters.onError?.(error))
      }
    })
  }
}

export function messageFromResultError(result: Result<unknown>): string {
  return result.ok ? '' : result.error.message
}

function normalizeWorkspaceSearchLimit(limit: number | undefined): number {
  if (!limit || !Number.isFinite(limit)) return 100
  return Math.max(1, Math.min(500, Math.floor(limit)))
}

function sortWorkspaceEntries(entries: WorkspaceFileEntry[]): WorkspaceFileEntry[] {
  return [...entries].sort((a, b) => a.relativePath.localeCompare(b.relativePath))
}

function normalizeSpellcheckWord(word: string): string {
  return word.trim().toLowerCase()
}

function workspaceEntryMap(entries: WorkspaceFileEntry[]): Map<string, WorkspaceFileEntry> {
  return new Map(entries.map(entry => [entry.path, entry]))
}
