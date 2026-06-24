import { describe, expect, it, vi } from 'vitest'
import {
  createDictionarySpellcheckAdapter,
  createNativeFileWatcher,
  createNativeWorkspaceWatcher,
  createPlatformServices
} from './index'

describe('@markforge/platform', () => {
  it('wraps filesystem, dialog, clipboard, and print adapters in typed results', async () => {
    const save = vi.fn(async () => 'saved.md')
    const services = createPlatformServices({
      filesystem: {
        getFileInfo: async () => ({ exists: true, modifiedMs: 1, len: 3 }),
        readTextFile: async () => 'doc',
        writeTextFile: async () => undefined
      },
      dialogs: {
        open: async () => 'note.md',
        save
      },
      clipboard: {
        readText: async () => 'clip',
        writeText: async () => undefined
      },
      print: { print: vi.fn() }
    })

    await expect(services.filesystem.readTextFile('note.md')).resolves.toEqual({ ok: true, value: 'doc' })
    await expect(services.dialogs.openMarkdownFile()).resolves.toEqual({ ok: true, value: 'note.md' })
    await expect(services.dialogs.saveMarkdownFile('draft.md')).resolves.toEqual({ ok: true, value: 'saved.md' })
    await expect(services.clipboard.readText()).resolves.toEqual({ ok: true, value: 'clip' })
    expect(services.print.print()).toEqual({ ok: true, value: undefined })
    expect(save).toHaveBeenCalledWith({
      defaultPath: 'draft.md',
      filters: [{ name: 'Markdown and text', extensions: ['md', 'markdown', 'mdown', 'txt'] }]
    })
  })

  it('offers an HTML save dialog filter for converter exports', async () => {
    const save = vi.fn(async () => 'export.html')
    const services = createPlatformServices({
      dialogs: {
        open: async () => null,
        save
      }
    })

    await expect(services.dialogs.saveHtmlFile('draft.html')).resolves.toEqual({ ok: true, value: 'export.html' })
    expect(save).toHaveBeenCalledWith({
      defaultPath: 'draft.html',
      filters: [{ name: 'HTML document', extensions: ['html', 'htm'] }]
    })
  })

  it('offers binary import and export dialog filters for converter files', async () => {
    const open = vi.fn(async () => 'input.pdf')
    const save = vi.fn(async () => 'output.pdf')
    const services = createPlatformServices({
      dialogs: { open, save }
    })

    await expect(services.dialogs.openPdfFile()).resolves.toEqual({ ok: true, value: 'input.pdf' })
    await expect(services.dialogs.openDocxFile()).resolves.toEqual({ ok: true, value: 'input.pdf' })
    await expect(services.dialogs.openImageFile()).resolves.toEqual({ ok: true, value: 'input.pdf' })
    await expect(services.dialogs.savePdfFile('draft.pdf')).resolves.toEqual({ ok: true, value: 'output.pdf' })
    await expect(services.dialogs.saveDocxFile('draft.docx')).resolves.toEqual({ ok: true, value: 'output.pdf' })
    expect(open).toHaveBeenNthCalledWith(1, {
      multiple: false,
      filters: [{ name: 'PDF document', extensions: ['pdf'] }]
    })
    expect(open).toHaveBeenNthCalledWith(2, {
      multiple: false,
      filters: [{ name: 'Word document', extensions: ['docx'] }]
    })
    expect(open).toHaveBeenNthCalledWith(3, {
      multiple: false,
      filters: [{ name: 'Image', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tif', 'tiff'] }]
    })
    expect(save).toHaveBeenNthCalledWith(1, {
      defaultPath: 'draft.pdf',
      filters: [{ name: 'PDF document', extensions: ['pdf'] }]
    })
    expect(save).toHaveBeenNthCalledWith(2, {
      defaultPath: 'draft.docx',
      filters: [{ name: 'Word document', extensions: ['docx'] }]
    })
  })

  it('opens workspace directories and exposes sorted workspace file listings', async () => {
    const open = vi.fn(async () => 'C:/workspace')
    const services = createPlatformServices({
      dialogs: {
        open
      },
      filesystem: {
        getFileInfo: async () => ({ exists: true, modifiedMs: 1, len: 1 }),
        listWorkspaceFiles: async () => [
          {
            extension: 'md',
            len: 10,
            modifiedMs: 2,
            name: 'b.md',
            path: 'C:/workspace/b.md',
            relativePath: 'b.md'
          },
          {
            extension: 'md',
            len: 10,
            modifiedMs: 2,
            name: 'a.md',
            path: 'C:/workspace/docs/a.md',
            relativePath: 'docs/a.md'
          }
        ],
        readTextFile: async () => 'doc'
      }
    })

    await expect(services.dialogs.openWorkspaceDirectory()).resolves.toEqual({ ok: true, value: 'C:/workspace' })
    expect(open).toHaveBeenCalledWith({ directory: true, multiple: false })
    await expect(services.filesystem.listWorkspaceFiles('C:/workspace')).resolves.toEqual({
      ok: true,
      value: [
        {
          extension: 'md',
          len: 10,
          modifiedMs: 2,
          name: 'b.md',
          path: 'C:/workspace/b.md',
          relativePath: 'b.md'
        },
        {
          extension: 'md',
          len: 10,
          modifiedMs: 2,
          name: 'a.md',
          path: 'C:/workspace/docs/a.md',
          relativePath: 'docs/a.md'
        }
      ]
    })
  })

  it('searches workspaces with normalized result limits', async () => {
    const searchWorkspace = vi.fn(async () => [
      {
        column: 4,
        line: 2,
        path: 'C:/workspace/readme.md',
        preview: '## Alpha',
        relativePath: 'readme.md'
      }
    ])
    const services = createPlatformServices({
      filesystem: {
        getFileInfo: async () => ({ exists: true, modifiedMs: 1, len: 1 }),
        readTextFile: async () => 'doc',
        searchWorkspace
      }
    })

    await expect(services.filesystem.searchWorkspace('C:/workspace', { query: 'alpha', limit: 9999 })).resolves.toEqual({
      ok: true,
      value: [
        {
          column: 4,
          line: 2,
          path: 'C:/workspace/readme.md',
          preview: '## Alpha',
          relativePath: 'readme.md'
        }
      ]
    })
    expect(searchWorkspace).toHaveBeenCalledWith('C:/workspace', { query: 'alpha', limit: 500 })
    await expect(services.filesystem.searchWorkspace('C:/workspace', { query: '   ' })).resolves.toEqual({
      ok: true,
      value: []
    })
  })

  it('reports unsupported capabilities explicitly', async () => {
    const services = createPlatformServices({})

    await expect(services.filesystem.readTextFile('note.md')).resolves.toMatchObject({
      ok: false,
      error: { code: 'not-supported' }
    })
    expect(services.print.print()).toMatchObject({
      ok: false,
      error: { code: 'not-supported' }
    })
  })

  it('supports read-only filesystem adapters for viewer file info and reads', async () => {
    const services = createPlatformServices({
      filesystem: {
        getFileInfo: async () => ({ exists: true, modifiedMs: 42, len: 12 }),
        readTextFile: async () => '# Read only'
      }
    })

    await expect(services.filesystem.getFileInfo('note.md')).resolves.toEqual({
      ok: true,
      value: { exists: true, modifiedMs: 42, len: 12 }
    })
    await expect(services.filesystem.readTextFile('note.md')).resolves.toEqual({
      ok: true,
      value: '# Read only'
    })
    await expect(services.filesystem.writeTextFile('note.md', 'updated')).resolves.toMatchObject({
      ok: false,
      error: { code: 'not-supported' }
    })
  })

  it('wraps binary filesystem reads and writes', async () => {
    const bytes = new Uint8Array([1, 2, 3])
    const readBinaryFile = vi.fn(async () => bytes)
    const writeBinaryFile = vi.fn(async () => undefined)
    const services = createPlatformServices({
      filesystem: {
        getFileInfo: async () => ({ exists: true, modifiedMs: 42, len: 3 }),
        readBinaryFile,
        readTextFile: async () => 'text',
        writeBinaryFile
      }
    })

    await expect(services.filesystem.readBinaryFile('input.pdf')).resolves.toEqual({ ok: true, value: bytes })
    await expect(services.filesystem.writeBinaryFile('output.pdf', bytes)).resolves.toEqual({ ok: true, value: undefined })
    expect(readBinaryFile).toHaveBeenCalledWith('input.pdf')
    expect(writeBinaryFile).toHaveBeenCalledWith('output.pdf', bytes)
  })

  it('supports read-only filesystem adapters for viewer-style file metadata checks', async () => {
    const services = createPlatformServices({
      filesystem: {
        getFileInfo: async () => ({ exists: true, modifiedMs: 42, len: 8 }),
        readTextFile: async () => 'viewer'
      }
    })

    await expect(services.filesystem.getFileInfo('note.md')).resolves.toEqual({
      ok: true,
      value: { exists: true, modifiedMs: 42, len: 8 }
    })
  })

  it('wraps shell recent documents, spellcheck, and updater status adapters', async () => {
    const addRecentDocument = vi.fn(async () => undefined)
    const checkText = vi.fn(async () => [{ start: 0, end: 5, word: 'teh', suggestion: 'the' }])
    const getStatus = vi.fn(async () => ({ currentVersion: '1.0.0', status: 'current' as const }))
    const services = createPlatformServices({
      shell: { addRecentDocument },
      spellcheck: { checkText },
      updater: { getStatus }
    })

    await expect(services.shell.addRecentDocument('C:/docs/readme.md')).resolves.toEqual({ ok: true, value: undefined })
    await expect(services.spellcheck.checkText('teh doc')).resolves.toEqual({
      ok: true,
      value: [{ start: 0, end: 5, word: 'teh', suggestion: 'the' }]
    })
    await expect(services.updater.getStatus()).resolves.toEqual({
      ok: true,
      value: { currentVersion: '1.0.0', status: 'current' }
    })
    expect(addRecentDocument).toHaveBeenCalledWith('C:/docs/readme.md')
    expect(checkText).toHaveBeenCalledWith('teh doc', undefined)
  })

  it('reports disabled updater status explicitly when no updater adapter is configured', async () => {
    const services = createPlatformServices({})

    await expect(services.updater.getStatus()).resolves.toEqual({
      ok: true,
      value: {
        channel: 'disabled',
        reason: 'Updater adapter is not configured for this build.',
        status: 'disabled'
      }
    })
    await expect(services.shell.addRecentDocument('note.md')).resolves.toMatchObject({
      ok: false,
      error: { code: 'not-supported' }
    })
    await expect(services.spellcheck.checkText('teh')).resolves.toMatchObject({
      ok: false,
      error: { code: 'not-supported' }
    })
  })

  it('provides a package-owned dictionary spellcheck adapter', async () => {
    const services = createPlatformServices({
      spellcheck: createDictionarySpellcheckAdapter({
        dictionary: ['the', 'document', 'is', 'ready'],
        suggestions: { teh: 'the' }
      })
    })

    await expect(services.spellcheck.checkText('teh document is ready', {
      ignoredWords: ['ready']
    })).resolves.toEqual({
      ok: true,
      value: [{ start: 0, end: 3, word: 'teh', suggestion: 'the' }]
    })
  })

  it('emits file watch changes and disposes the polling fallback', async () => {
    vi.useFakeTimers()

    const events: string[] = []
    const infos = [
      { exists: true, modifiedMs: 2, len: 10 },
      { exists: false, modifiedMs: null, len: null },
      { exists: false, modifiedMs: null, len: null }
    ]
    const getFileInfo = vi.fn(async () => infos.shift() ?? { exists: true, modifiedMs: 3, len: 11 })
    const services = createPlatformServices({
      filesystem: {
        getFileInfo,
        readTextFile: async () => 'watched'
      }
    })

    const watcher = services.watchFile(
      { intervalMs: 10, path: 'note.md', previousInfo: { exists: true, modifiedMs: 1, len: 9 } },
      event => events.push(event.type)
    )

    expect(watcher.ok).toBe(true)
    await vi.advanceTimersByTimeAsync(30)

    expect(events).toEqual(['changed', 'missing'])

    if (watcher.ok) watcher.value.dispose()
    await vi.advanceTimersByTimeAsync(20)

    expect(getFileInfo).toHaveBeenCalledTimes(3)
    vi.useRealTimers()
  })

  it('prefers a native file watcher adapter when one is available', () => {
    const watchFile = vi.fn(() => ({
      ok: true as const,
      value: { dispose: vi.fn() }
    }))
    const services = createPlatformServices({
      fileWatcher: { watchFile },
      filesystem: {
        getFileInfo: async () => ({ exists: true, modifiedMs: 1, len: 1 }),
        readTextFile: async () => 'native'
      }
    })

    const result = services.watchFile(
      { path: 'note.md', previousInfo: null },
      () => undefined
    )

    expect(result.ok).toBe(true)
    expect(watchFile).toHaveBeenCalledOnce()
  })

  it('uses native workspace watchers when available', async () => {
    let handler: ((payload: { path: string; relativePath: string; root: string; type: 'changed' | 'created' | 'missing' }) => void) | null = null
    const unlisten = vi.fn()
    const start = vi.fn(async () => undefined)
    const stop = vi.fn(async () => undefined)
    const watchWorkspace = createNativeWorkspaceWatcher({
      listen: async (_eventName, nextHandler) => {
        handler = nextHandler
        return unlisten
      },
      start,
      stop
    })
    const services = createPlatformServices({
      fileWatcher: {
        watchFile: vi.fn(() => ({
          ok: true as const,
          value: { dispose: vi.fn() }
        })),
        watchWorkspace
      }
    })
    const events: string[] = []

    const result = services.watchWorkspace({ root: 'C:/workspace' }, event => events.push(event.relativePath))

    expect(result.ok).toBe(true)
    await Promise.resolve()
    await Promise.resolve()

    handler?.({ root: 'C:/other', path: 'C:/other/a.md', relativePath: 'a.md', type: 'changed' })
    handler?.({ root: 'C:/workspace', path: 'C:/workspace/a.md', relativePath: 'a.md', type: 'changed' })

    expect(start).toHaveBeenCalledWith('C:/workspace')
    expect(events).toEqual(['a.md'])

    if (result.ok) result.value.dispose()
    expect(unlisten).toHaveBeenCalledOnce()
    expect(stop).toHaveBeenCalledWith('C:/workspace')
  })

  it('adapts native file watch events and stops native watching on dispose', async () => {
    let handler: ((payload: { current: { exists: boolean; len: number | null; modifiedMs: number | null }; path: string; type: 'changed' | 'missing' }) => void) | null = null
    const unlisten = vi.fn()
    const start = vi.fn(async () => undefined)
    const stop = vi.fn(async () => undefined)
    const watcher = createNativeFileWatcher({
      listen: async (_eventName, nextHandler) => {
        handler = nextHandler
        return unlisten
      },
      start,
      stop
    })
    const events: string[] = []

    const result = watcher.watchFile(
      { path: 'note.md', previousInfo: null },
      event => events.push(event.type)
    )

    expect(result.ok).toBe(true)
    await Promise.resolve()
    await Promise.resolve()

    handler?.({ path: 'other.md', type: 'changed', current: { exists: true, modifiedMs: 1, len: 1 } })
    handler?.({ path: 'note.md', type: 'changed', current: { exists: true, modifiedMs: 2, len: 2 } })

    expect(start).toHaveBeenCalledWith('note.md')
    expect(events).toEqual(['changed'])

    if (result.ok) result.value.dispose()
    expect(unlisten).toHaveBeenCalledOnce()
    expect(stop).toHaveBeenCalledWith('note.md')
  })

  it('protects native window close requests when the caller reports dirty state', async () => {
    let closeHandler: ((event: { preventDefault(): void }) => void | Promise<void>) | null = null
    const unlisten = vi.fn()
    const services = createPlatformServices({
      window: {
        destroy: async () => undefined,
        onCloseRequested: async handler => {
          closeHandler = handler
          return unlisten
        }
      }
    })
    const prevented = vi.fn()
    const event = { preventDefault: vi.fn() }

    const result = services.lifecycle.protectClose({
      onClosePrevented: prevented,
      shouldPreventClose: () => true
    })

    expect(result.ok).toBe(true)
    await Promise.resolve()
    closeHandler?.(event)

    expect(event.preventDefault).toHaveBeenCalledOnce()
    expect(prevented).toHaveBeenCalledOnce()

    if (result.ok) result.value.dispose()
    expect(unlisten).toHaveBeenCalledOnce()
  })
})
