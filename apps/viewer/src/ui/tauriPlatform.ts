import {
  createNativeFileWatcher,
  createNativeWorkspaceWatcher,
  createPlatformServices,
  type FileInfo,
  type NativeFileWatchPayload,
  type NativeWorkspaceWatchPayload,
  type WorkspaceFileEntry,
  type WorkspaceSearchMatch
} from '@markforge/platform'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import { open, save } from '@tauri-apps/plugin-dialog'

export function createViewerPlatform() {
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
      readTextFile: path => invoke<string>('read_text_file', { path }),
      searchWorkspace: (root, options) => invoke<WorkspaceSearchMatch[]>('search_workspace', {
        root,
        query: options.query,
        caseSensitive: options.caseSensitive,
        limit: options.limit
      }),
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
      readText: async () => '',
      writeText
    },
    print: {
      print: () => window.print()
    }
  })
}

export function hasTauriWindowMetadata(): boolean {
  return Boolean((window as Window & {
    __TAURI_INTERNALS__?: { metadata?: unknown }
  }).__TAURI_INTERNALS__?.metadata)
}
