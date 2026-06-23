import { describe, expect, it, vi } from 'vitest'
import { createNativeFileWatcher, createPlatformServices } from './index'

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
