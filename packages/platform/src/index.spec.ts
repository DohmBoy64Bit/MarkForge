import { describe, expect, it, vi } from 'vitest'
import { createPlatformServices } from './index'

describe('@markforge/platform', () => {
  it('wraps filesystem, dialog, clipboard, and print adapters in typed results', async () => {
    const services = createPlatformServices({
      filesystem: {
        getFileInfo: async () => ({ exists: true, modifiedMs: 1, len: 3 }),
        readTextFile: async () => 'doc',
        writeTextFile: async () => undefined
      },
      dialogs: {
        open: async () => 'note.md',
        save: async () => 'saved.md'
      },
      clipboard: {
        readText: async () => 'clip',
        writeText: async () => undefined
      },
      print: { print: vi.fn() }
    })

    await expect(services.filesystem.readTextFile('note.md')).resolves.toEqual({ ok: true, value: 'doc' })
    await expect(services.dialogs.openMarkdownFile()).resolves.toEqual({ ok: true, value: 'note.md' })
    await expect(services.clipboard.readText()).resolves.toEqual({ ok: true, value: 'clip' })
    expect(services.print.print()).toEqual({ ok: true, value: undefined })
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
})
