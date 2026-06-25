import { clearMocks, mockIPC, mockWindows } from '@tauri-apps/api/mocks'
import { emit } from '@tauri-apps/api/event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createEditorPlatform,
  createWindowLifecycleAdapter,
  hasTauriWindowMetadata
} from './tauriPlatform'

type IpcCall = {
  cmd: string
  payload?: Record<string, unknown> | number[] | ArrayBuffer | Uint8Array
}

function installEditorIpcMock(calls: IpcCall[] = []) {
  mockIPC((cmd, payload) => {
    calls.push({ cmd, payload })

    switch (cmd) {
      case 'get_file_info':
        return { exists: true, len: 12, modifiedMs: 1234 }
      case 'read_text_file':
        return '# Mocked editor document'
      case 'read_binary_file':
        return [1, 2, 255]
      case 'write_text_file':
      case 'write_binary_file':
      case 'add_recent_document':
      case 'watch_text_file':
      case 'unwatch_text_file':
      case 'watch_workspace':
      case 'unwatch_workspace':
        return undefined
      case 'list_workspace_files':
        return [{
          extension: 'md',
          len: 18,
          modifiedMs: 4321,
          name: 'note.md',
          path: 'C:/workspace/note.md',
          relativePath: 'note.md'
        }]
      case 'search_workspace':
        return [{
          column: 3,
          line: 7,
          path: 'C:/workspace/note.md',
          preview: 'A mocked search hit',
          relativePath: 'note.md'
        }]
      case 'plugin:clipboard-manager|read_text':
        return 'clipboard text'
      case 'plugin:clipboard-manager|write_text':
        return undefined
      case 'plugin:dialog|open': {
        const options = (payload as { options?: { directory?: boolean } } | undefined)?.options
        return options?.directory ? 'C:/workspace' : 'C:/workspace/note.md'
      }
      case 'plugin:dialog|save':
        return 'C:/workspace/output.md'
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

describe('editor Tauri platform adapter', () => {
  it('maps editor platform services to mocked Tauri invoke and plugin calls', async () => {
    const calls: IpcCall[] = []
    installEditorIpcMock(calls)
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined)
    const platform = createEditorPlatform()

    await expect(platform.filesystem.getFileInfo('C:/workspace/note.md')).resolves.toMatchObject({
      ok: true,
      value: { exists: true, len: 12, modifiedMs: 1234 }
    })
    await expect(platform.filesystem.readTextFile('C:/workspace/note.md')).resolves.toMatchObject({
      ok: true,
      value: '# Mocked editor document'
    })

    const binary = await platform.filesystem.readBinaryFile('C:/workspace/image.png')
    expect(binary).toMatchObject({ ok: true })
    if (binary.ok) expect(Array.from(binary.value)).toEqual([1, 2, 255])

    await expect(platform.filesystem.writeTextFile('C:/workspace/note.md', 'updated')).resolves.toMatchObject({ ok: true })
    await expect(platform.filesystem.writeBinaryFile('C:/workspace/image.png', new Uint8Array([5, 6]))).resolves.toMatchObject({ ok: true })
    await expect(platform.filesystem.listWorkspaceFiles('C:/workspace')).resolves.toMatchObject({
      ok: true,
      value: [{ relativePath: 'note.md' }]
    })
    await expect(platform.filesystem.searchWorkspace('C:/workspace', { query: 'mock', limit: 5 })).resolves.toMatchObject({
      ok: true,
      value: [{ line: 7, column: 3 }]
    })
    await expect(platform.dialogs.openMarkdownFile()).resolves.toMatchObject({ ok: true, value: 'C:/workspace/note.md' })
    await expect(platform.dialogs.openWorkspaceDirectory()).resolves.toMatchObject({ ok: true, value: 'C:/workspace' })
    await expect(platform.dialogs.savePdfFile('out.pdf')).resolves.toMatchObject({ ok: true, value: 'C:/workspace/output.md' })
    await expect(platform.clipboard.readText()).resolves.toMatchObject({ ok: true, value: 'clipboard text' })
    await expect(platform.clipboard.writeText('copied')).resolves.toMatchObject({ ok: true })
    await expect(platform.shell.addRecentDocument('C:/workspace/note.md')).resolves.toMatchObject({ ok: true })
    expect(platform.print.print()).toMatchObject({ ok: true })

    expect(print).toHaveBeenCalledOnce()
    expect(calls.map(call => call.cmd)).toEqual(expect.arrayContaining([
      'get_file_info',
      'read_text_file',
      'read_binary_file',
      'write_text_file',
      'write_binary_file',
      'list_workspace_files',
      'search_workspace',
      'plugin:dialog|open',
      'plugin:dialog|save',
      'plugin:clipboard-manager|read_text',
      'plugin:clipboard-manager|write_text',
      'add_recent_document'
    ]))
    expect(calls).toContainEqual({
      cmd: 'write_binary_file',
      payload: { path: 'C:/workspace/image.png', contents: [5, 6] }
    })
  })

  it('uses mocked Tauri events for native file and workspace watchers', async () => {
    const calls: IpcCall[] = []
    installEditorIpcMock(calls)
    const platform = createEditorPlatform()
    const onFileEvent = vi.fn()
    const onWorkspaceEvent = vi.fn()

    const fileWatcher = platform.watchFile({ path: 'C:/workspace/note.md', previousInfo: null }, onFileEvent)
    const workspaceWatcher = platform.watchWorkspace({ root: 'C:/workspace' }, onWorkspaceEvent)
    expect(fileWatcher).toMatchObject({ ok: true })
    expect(workspaceWatcher).toMatchObject({ ok: true })
    await nextTick()

    await emit('markforge://file-watch', {
      current: { exists: true, len: 18, modifiedMs: 1234 },
      path: 'C:/workspace/note.md',
      type: 'changed'
    })
    await emit('markforge://workspace-watch', {
      path: 'C:/workspace/next.md',
      relativePath: 'next.md',
      root: 'C:/workspace',
      type: 'created'
    })
    await nextTick()

    expect(onFileEvent).toHaveBeenCalledWith({
      current: { exists: true, len: 18, modifiedMs: 1234 },
      path: 'C:/workspace/note.md',
      type: 'changed'
    })
    expect(onWorkspaceEvent).toHaveBeenCalledWith({
      path: 'C:/workspace/next.md',
      relativePath: 'next.md',
      root: 'C:/workspace',
      type: 'created'
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

  it('detects mocked Tauri window metadata before enabling lifecycle APIs', () => {
    expect(hasTauriWindowMetadata()).toBe(false)
    expect(createWindowLifecycleAdapter()).toBeUndefined()

    mockWindows('main')

    expect(hasTauriWindowMetadata()).toBe(true)
    expect(createWindowLifecycleAdapter()).toBeDefined()
  })
})
