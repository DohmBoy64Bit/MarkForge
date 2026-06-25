import { clearMocks, mockIPC } from '@tauri-apps/api/mocks'
import { emit } from '@tauri-apps/api/event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createViewerPlatform, hasTauriWindowMetadata } from './tauriPlatform'

type IpcCall = {
  cmd: string
  payload?: Record<string, unknown> | number[] | ArrayBuffer | Uint8Array
}

function installViewerIpcMock(calls: IpcCall[] = []) {
  mockIPC((cmd, payload) => {
    calls.push({ cmd, payload })

    switch (cmd) {
      case 'get_file_info':
        return { exists: true, len: 24, modifiedMs: 2468 }
      case 'read_text_file':
        return '# Mocked viewer document'
      case 'write_text_file':
      case 'watch_text_file':
      case 'unwatch_text_file':
      case 'watch_workspace':
      case 'unwatch_workspace':
        return undefined
      case 'list_workspace_files':
        return [{
          extension: 'md',
          len: 24,
          modifiedMs: 2468,
          name: 'viewer.md',
          path: 'C:/viewer/viewer.md',
          relativePath: 'viewer.md'
        }]
      case 'search_workspace':
        return [{
          column: 1,
          line: 2,
          path: 'C:/viewer/viewer.md',
          preview: 'Viewer match',
          relativePath: 'viewer.md'
        }]
      case 'plugin:clipboard-manager|write_text':
        return undefined
      case 'plugin:dialog|open': {
        const options = (payload as { options?: { directory?: boolean } } | undefined)?.options
        return options?.directory ? 'C:/viewer' : 'C:/viewer/viewer.md'
      }
      case 'plugin:dialog|save':
        return 'C:/viewer/export.html'
      default:
        throw new Error(`Unexpected mocked IPC command: ${cmd}`)
    }
  }, { shouldMockEvents: true })
}

async function nextTick() {
  await new Promise(resolve => setTimeout(resolve, 0))
}

afterEach(() => {
  clearMocks()
  vi.restoreAllMocks()
})

describe('viewer Tauri platform adapter', () => {
  it('maps viewer platform services to mocked Tauri invoke and plugin calls', async () => {
    const calls: IpcCall[] = []
    installViewerIpcMock(calls)
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined)
    const platform = createViewerPlatform()

    await expect(platform.filesystem.getFileInfo('C:/viewer/viewer.md')).resolves.toMatchObject({
      ok: true,
      value: { exists: true, len: 24, modifiedMs: 2468 }
    })
    await expect(platform.filesystem.readTextFile('C:/viewer/viewer.md')).resolves.toMatchObject({
      ok: true,
      value: '# Mocked viewer document'
    })
    await expect(platform.filesystem.writeTextFile('C:/viewer/export.html', '<h1>Viewer</h1>')).resolves.toMatchObject({ ok: true })
    await expect(platform.filesystem.listWorkspaceFiles('C:/viewer')).resolves.toMatchObject({
      ok: true,
      value: [{ relativePath: 'viewer.md' }]
    })
    await expect(platform.filesystem.searchWorkspace('C:/viewer', { query: 'Viewer' })).resolves.toMatchObject({
      ok: true,
      value: [{ line: 2, preview: 'Viewer match' }]
    })
    await expect(platform.dialogs.openMarkdownFile()).resolves.toMatchObject({ ok: true, value: 'C:/viewer/viewer.md' })
    await expect(platform.dialogs.openWorkspaceDirectory()).resolves.toMatchObject({ ok: true, value: 'C:/viewer' })
    await expect(platform.dialogs.saveHtmlFile('export.html')).resolves.toMatchObject({ ok: true, value: 'C:/viewer/export.html' })
    await expect(platform.clipboard.readText()).resolves.toMatchObject({ ok: true, value: '' })
    await expect(platform.clipboard.writeText('rendered')).resolves.toMatchObject({ ok: true })
    expect(platform.print.print()).toMatchObject({ ok: true })

    expect(print).toHaveBeenCalledOnce()
    expect(calls.map(call => call.cmd)).toEqual(expect.arrayContaining([
      'get_file_info',
      'read_text_file',
      'write_text_file',
      'list_workspace_files',
      'search_workspace',
      'plugin:dialog|open',
      'plugin:dialog|save',
      'plugin:clipboard-manager|write_text'
    ]))
  })

  it('uses mocked Tauri events for viewer native file and workspace watchers', async () => {
    const calls: IpcCall[] = []
    installViewerIpcMock(calls)
    const platform = createViewerPlatform()
    const onFileEvent = vi.fn()
    const onWorkspaceEvent = vi.fn()

    const fileWatcher = platform.watchFile({ path: 'C:/viewer/viewer.md', previousInfo: null }, onFileEvent)
    const workspaceWatcher = platform.watchWorkspace({ root: 'C:/viewer' }, onWorkspaceEvent)
    expect(fileWatcher).toMatchObject({ ok: true })
    expect(workspaceWatcher).toMatchObject({ ok: true })
    await nextTick()

    await emit('markforge://file-watch', {
      current: { exists: false, len: null, modifiedMs: null },
      path: 'C:/viewer/viewer.md',
      type: 'missing'
    })
    await emit('markforge://workspace-watch', {
      path: 'C:/viewer/updated.md',
      relativePath: 'updated.md',
      root: 'C:/viewer',
      type: 'changed'
    })
    await nextTick()

    expect(onFileEvent).toHaveBeenCalledWith({
      current: { exists: false, len: null, modifiedMs: null },
      path: 'C:/viewer/viewer.md',
      type: 'missing'
    })
    expect(onWorkspaceEvent).toHaveBeenCalledWith({
      path: 'C:/viewer/updated.md',
      relativePath: 'updated.md',
      root: 'C:/viewer',
      type: 'changed'
    })

    if (fileWatcher.ok) fileWatcher.value.dispose()
    if (workspaceWatcher.ok) workspaceWatcher.value.dispose()
    await nextTick()

    expect(calls.map(call => call.cmd)).toEqual(expect.arrayContaining([
      'watch_text_file',
      'watch_workspace',
      'unwatch_text_file',
      'unwatch_workspace'
    ]))
  })

  it('keeps viewer startup metadata detection tied to Tauri internals', () => {
    expect(hasTauriWindowMetadata()).toBe(false)

    mockIPC(() => undefined)

    expect(hasTauriWindowMetadata()).toBe(false)
  })
})
