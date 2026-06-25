import {
  createNativeFileWatcher,
  createNativeWorkspaceWatcher,
  createPlatformServices,
  type FileInfo,
  type NativeFileWatchPayload,
  type NativeWorkspaceWatchPayload,
  type PlatformAdapters,
  type WorkspaceFileEntry,
  type WorkspaceSearchMatch
} from '@markforge/platform'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { readText, writeText } from '@tauri-apps/plugin-clipboard-manager'
import { open, save } from '@tauri-apps/plugin-dialog'

export function createEditorPlatform() {
  const nativeFileWatcher = createNativeFileWatcher({
    listen: async (eventName, handler) => listen<NativeFileWatchPayload>(eventName, event => handler(event.payload)),
    onError: error => console.warn(error),
    start: path => invoke<void>('watch_text_file', { path }),
    stop: path => invoke<void>('unwatch_text_file', { path })
  })!

  return createPlatformServices({
    filesystem: {
      getFileInfo: path => invoke<FileInfo>('get_file_info', { path }),
      listWorkspaceFiles: root => invoke<WorkspaceFileEntry[]>('list_workspace_files', { root }),
      readBinaryFile: async path => new Uint8Array(await invoke<number[]>('read_binary_file', { path })),
      readTextFile: path => invoke<string>('read_text_file', { path }),
      searchWorkspace: (root, options) => invoke<WorkspaceSearchMatch[]>('search_workspace', {
        root,
        query: options.query,
        caseSensitive: options.caseSensitive,
        limit: options.limit
      }),
      writeBinaryFile: (path, contents) => invoke<void>('write_binary_file', { path, contents: Array.from(contents) }),
      writeTextFile: (path, contents) => invoke<void>('write_text_file', { path, contents })
    },
    fileWatcher: {
      watchFile: nativeFileWatcher.watchFile,
      watchWorkspace: createNativeWorkspaceWatcher({
        listen: async (eventName, handler) => listen<NativeWorkspaceWatchPayload>(eventName, event => handler(event.payload)),
        onError: error => console.warn(error),
        start: root => invoke<void>('watch_workspace', { root }),
        stop: root => invoke<void>('unwatch_workspace', { root })
      })
    },
    dialogs: {
      open,
      save
    },
    clipboard: {
      readText,
      writeText
    },
    print: {
      print: () => window.print()
    },
    shell: {
      addRecentDocument: path => invoke<void>('add_recent_document', { path })
    },
    window: createWindowLifecycleAdapter()
  })
}

export function createWindowLifecycleAdapter(): PlatformAdapters['window'] {
  if (!hasTauriWindowMetadata()) return undefined

  return {
    destroy: () => getCurrentWindow().destroy(),
    onCloseRequested: handler => getCurrentWindow().onCloseRequested(handler)
  }
}

export function hasTauriWindowMetadata(): boolean {
  return Boolean((window as Window & {
    __TAURI_INTERNALS__?: { metadata?: unknown }
  }).__TAURI_INTERNALS__?.metadata)
}
