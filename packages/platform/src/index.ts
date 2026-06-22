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
    readTextFile(path: string): Promise<string>
    writeTextFile?(path: string, contents: string): Promise<void>
  }
  print?: {
    print(): void
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
  print: PrintService
  watchFile(options: FileWatcherOptions, onEvent: (event: FileWatchEvent) => void): Result<Disposable>
}

export type ClipboardService = {
  readText(options?: CancellableOptions): Promise<Result<string>>
  writeText(text: string, options?: CancellableOptions): Promise<Result<void>>
}

export type DialogService = {
  openMarkdownFile(options?: CancellableOptions): Promise<Result<string | null>>
  saveHtmlFile(defaultPath?: string, options?: CancellableOptions): Promise<Result<string | null>>
  saveMarkdownFile(defaultPath?: string, options?: CancellableOptions): Promise<Result<string | null>>
}

export type FilesystemService = {
  getFileInfo(path: string, options?: CancellableOptions): Promise<Result<FileInfo>>
  readTextFile(path: string, options?: CancellableOptions): Promise<Result<string>>
  writeTextFile(path: string, contents: string, options?: CancellableOptions): Promise<Result<void>>
}

export type PrintService = {
  print(): Result<void>
}

export const markdownFileFilters: FileDialogFilter[] = [
  { name: 'Markdown and text', extensions: ['md', 'markdown', 'mdown', 'txt'] }
]

export const htmlFileFilters: FileDialogFilter[] = [
  { name: 'HTML document', extensions: ['html', 'htm'] }
]

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
    }
  }

  return {
    filesystem,
    dialogs: {
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
      async saveMarkdownFile(defaultPath, options) {
        const cancelled = assertNotCancelled(options?.signal)
        if (!cancelled.ok) return cancelled
        if (!adapters.dialogs?.save) return err('not-supported', 'Save dialog adapter is not available.')

        try {
          return ok(await adapters.dialogs.save({ defaultPath, filters: markdownFileFilters }))
        } catch (error) {
          return { ok: false, error: toError(error, 'Save dialog failed.') }
        }
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
    watchFile(options, onEvent) {
      if (!adapters.filesystem) return err('not-supported', 'Filesystem adapter is not available.')
      if (typeof window === 'undefined') return err('not-supported', 'Polling file watching requires a browser window.')

      let previousInfo = options.previousInfo
      const interval = window.setInterval(async () => {
        const result = await filesystem.getFileInfo(options.path)
        if (!result.ok) return

        const current = result.value
        if (!current.exists) {
          onEvent({ path: options.path, current, type: 'missing' })
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
    }
  }
}

export function messageFromResultError(result: Result<unknown>): string {
  return result.ok ? '' : result.error.message
}
