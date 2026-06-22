import {
  commandById,
  commandGroups,
  editorCommands,
  type EditorCommandIcon,
  type EditorCommandId
} from '@markforge/editor-engine'
import { createBrowserPrintConverter } from '@markforge/converters'
import {
  readEditorSession,
  readRecentFiles,
  rememberRecentFile as rememberRecentFilePath,
  saveEditorSession,
  saveRecentFiles,
  type PersistedEditorSession
} from '@markforge/core'
import { renderMarkdown, type FrontMatterData, type RenderedMarkdown } from '@markforge/markdown-engine'
import { createPlatformServices, type FileInfo } from '@markforge/platform'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { readText, writeText } from '@tauri-apps/plugin-clipboard-manager'
import { open, save } from '@tauri-apps/plugin-dialog'
import {
  BookOpenText,
  Bold,
  CaseSensitive,
  ClipboardCheck,
  ClipboardCopy,
  Code2,
  Command,
  CopyPlus,
  FileDown,
  FileInput,
  FilePenLine,
  FilePlus2,
  FileText,
  Files,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Italic,
  Keyboard,
  Link,
  List,
  ListChecks,
  ListOrdered,
  ListTree,
  Minus,
  Moon,
  Printer,
  Quote,
  Replace,
  Regex,
  Save,
  Search,
  Settings,
  ShieldCheck,
  SplitSquareHorizontal,
  Strikethrough,
  Sun,
  Table2,
  TextCursorInput,
  TriangleAlert,
  WholeWord,
  X,
  type LucideIcon
} from 'lucide-react'
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { templateCatalog, type MarkdownTemplate, type TemplateVariables } from '@markforge/templates'
import { CommandPalette } from './CommandPalette'
import { PreferencesDialog } from './PreferencesDialog'
import { QuickInsert } from './QuickInsert'
import { TemplatesHelpDialog } from './TemplatesHelpDialog'
import { UnsavedChangesDialog } from './UnsavedChangesDialog'
import { loadCustomTemplates } from './customTemplates'
import {
  closeStatusLabel,
  externalChangeLabel,
  fileStatusLabel,
  isDirty,
  normalizeExternalChange,
  reconcileFileInfo,
  shouldPromptForClose,
  type ExternalChangeState
} from './documentLifecycle'
import {
  actionIdFromKeyboardEvent,
  commandPaletteActionId,
  displayShortcut,
  keybindingDefinitions,
  quickInsertActionId,
  readEditorPreferences,
  saveEditorPreferences,
  shortcutForAction,
  templatesHelpActionId,
  type EditorPreferences,
  type Theme,
  type ViewMode
} from './editorPreferences'
import type { PaletteCommand } from './paletteCommandHelpers'
import { toQuickInsertCommands } from './quickInsertHelpers'
import {
  defaultSearchOptions,
  findSourceMatches,
  highlightSourceSnippet,
  replaceAllSourceMatches,
  replaceCurrentSourceMatch,
  type SourceSearchMatch,
  type SourceSearchOptions
} from './sourceSearch'
import {
  filterTemplateSuggestions,
  findTemplateSuggestionTrigger,
  replaceTemplateTrigger,
  resolveTemplateSuggestion
} from './templateAutocomplete'

type EditorDocument = {
  id: string
  title: string
  path: string | null
  text: string
  savedText: string
  lastKnownFileInfo: FileInfo | null
  externalChange: ExternalChangeState
  createdAt: number
  updatedAt: number
}

type PendingLifecycleAction =
  | { kind: 'close'; documentId: string }
  | { kind: 'reload'; documentId: string }

type SourceSelectionState = {
  end: number
  hasFocus: boolean
  start: number
}

const platform = createPlatformServices({
  filesystem: {
    getFileInfo: path => invoke<FileInfo>('get_file_info', { path }),
    readTextFile: path => invoke<string>('read_text_file', { path }),
    writeTextFile: (path, contents) => invoke<void>('write_text_file', { path, contents })
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
  }
})
const browserPrintConverter = createBrowserPrintConverter(() => {
  const result = platform.print.print()
  if (!result.ok) throw new Error(result.error.message)
})
const commandIconByName: Record<EditorCommandIcon, LucideIcon> = {
  bold: Bold,
  italic: Italic,
  inlineCode: Code2,
  strikethrough: Strikethrough,
  link: Link,
  heading1: Heading1,
  heading2: Heading2,
  heading3: Heading3,
  heading4: Heading4,
  heading5: Heading5,
  heading6: Heading6,
  blockquote: Quote,
  unorderedList: List,
  orderedList: ListOrdered,
  taskList: ListChecks,
  codeFence: TextCursorInput,
  horizontalRule: Minus,
  table: Table2,
  duplicate: CopyPlus
}

const selectionOverlayCommandIds: EditorCommandId[] = [
  'format.bold',
  'format.italic',
  'format.inlineCode',
  'format.strikethrough',
  'format.link'
]

const starter = `---
title: Editor shell foundation
phase: 4
status: draft
---

# MarkForge Editor Shell

Use this workspace to edit source Markdown, inspect render metadata, and keep a live preview beside the text.

## Workbench slice

- Create, open, save, and save as Markdown documents.
- Track dirty state per document tab.
- Search source lines and jump to a match.
- Render sanitized preview through the shared markdown engine.
- Preserve unsaved session tabs and editor preferences locally.

## Render checks

Inline math works here: $x^2 + y^2 = z^2$.

\`\`\`ts
const phase: number = 4
\`\`\`

\`\`\`mermaid
graph TD; Source-->Engine-->Preview;
\`\`\`
`

const emptyRendered: RenderedMarkdown = {
  body: '',
  frontMatter: null,
  headings: [],
  html: '<p>No active document.</p>',
  warnings: []
}

export function App() {
  const restored = useMemo(() => restoreInitialState(), [])
  const [documents, setDocuments] = useState<EditorDocument[]>(restored.documents)
  const [activeId, setActiveId] = useState(restored.activeId)
  const [preferences, setPreferences] = useState<EditorPreferences>(restored.preferences)
  const [searchQuery, setSearchQuery] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [searchOptions, setSearchOptions] = useState<SourceSearchOptions>(defaultSearchOptions)
  const [selectedMatch, setSelectedMatch] = useState(0)
  const [status, setStatus] = useState(restored.status)
  const [lastCommand, setLastCommand] = useState('No formatting command yet')
  const [clipboardStatus, setClipboardStatus] = useState('Not checked')
  const [recentFiles, setRecentFiles] = useState<string[]>(restored.recentFiles)
  const [customTemplates, setCustomTemplates] = useState<MarkdownTemplate[]>(() => loadCustomTemplates())
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isQuickInsertOpen, setIsQuickInsertOpen] = useState(false)
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false)
  const [isTemplatesHelpOpen, setIsTemplatesHelpOpen] = useState(false)
  const [pendingLifecycleAction, setPendingLifecycleAction] = useState<PendingLifecycleAction | null>(null)
  const [commandPaletteQuery, setCommandPaletteQuery] = useState('')
  const [commandPaletteActiveIndex, setCommandPaletteActiveIndex] = useState(0)
  const [quickInsertQuery, setQuickInsertQuery] = useState('')
  const [quickInsertActiveIndex, setQuickInsertActiveIndex] = useState(0)
  const [sourceSelection, setSourceSelection] = useState<SourceSelectionState>({ start: 0, end: 0, hasFocus: false })
  const [templateSuggestionActiveIndex, setTemplateSuggestionActiveIndex] = useState(0)
  const [dismissedTemplateSuggestionKey, setDismissedTemplateSuggestionKey] = useState<string | null>(null)
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
  const commandPaletteReturnFocusRef = useRef<HTMLElement | null>(null)
  const quickInsertReturnFocusRef = useRef<HTMLElement | null>(null)
  const preferencesReturnFocusRef = useRef<HTMLElement | null>(null)
  const templatesHelpReturnFocusRef = useRef<HTMLElement | null>(null)
  const unsavedDialogReturnFocusRef = useRef<HTMLElement | null>(null)

  const theme = preferences.theme
  const viewMode = preferences.viewMode
  const commandPaletteShortcut = shortcutForAction(commandPaletteActionId, preferences.keybindings)
  const quickInsertShortcut = shortcutForAction(quickInsertActionId, preferences.keybindings)
  const templatesHelpShortcut = shortcutForAction(templatesHelpActionId, preferences.keybindings)
  const activeDocument = documents.find(document => document.id === activeId) ?? documents[0] ?? null
  const activeDirty = activeDocument ? isDirty(activeDocument) : false
  const activeFileStatus = useMemo(() => fileStatusLabel(activeDocument), [activeDocument])
  const fileName = activeDocument ? activeDocument.title : 'No document'
  const renderState = useMemo(() => safeRenderMarkdown(activeDocument?.text ?? ''), [activeDocument?.text])
  const { rendered, renderError } = renderState
  const frontMatterRows = useMemo(() => frontMatterEntries(rendered.frontMatter?.data), [rendered.frontMatter])
  const searchResult = useMemo(
    () => findSourceMatches(activeDocument?.text ?? '', searchQuery, searchOptions),
    [activeDocument?.text, searchOptions, searchQuery]
  )
  const searchMatches = searchResult.matches
  const hasSearchError = Boolean(searchResult.error)
  const stats = useMemo(() => documentStats(activeDocument?.text ?? ''), [activeDocument?.text])
  const commandsWithShortcuts = useMemo(
    () => editorCommands.map(command => ({
      ...command,
      shortcut: shortcutForAction(command.id, preferences.keybindings)
    })),
    [preferences.keybindings]
  )
  const commandsByGroup = useMemo(
    () => commandGroups.map(group => ({
      ...group,
      commands: commandsWithShortcuts.filter(command => command.group === group.id)
    })),
    [commandsWithShortcuts]
  )
  const paletteCommands = useMemo<PaletteCommand[]>(
    () => commandGroups.flatMap(group =>
      commandsWithShortcuts
        .filter(command => command.group === group.id)
        .map(command => ({
          ...command,
          groupLabel: group.label
        }))
    ),
    [commandsWithShortcuts]
  )
  const quickInsertCommands = useMemo(
    () => toQuickInsertCommands(paletteCommands),
    [paletteCommands]
  )
  const templateVariables = useMemo<TemplateVariables>(
    () => templateVariablesForDocument(activeDocument),
    [activeDocument]
  )
  const allTemplates = useMemo(
    () => [...templateCatalog, ...customTemplates],
    [customTemplates]
  )
  const templateSuggestionTrigger = useMemo(
    () => activeDocument && sourceSelection.hasFocus
      ? findTemplateSuggestionTrigger(activeDocument.text, sourceSelection.end)
      : null,
    [activeDocument, sourceSelection.end, sourceSelection.hasFocus]
  )
  const templateSuggestionKey = templateSuggestionTrigger
    ? `${templateSuggestionTrigger.start}:${templateSuggestionTrigger.end}:${templateSuggestionTrigger.query}`
    : null
  const templateSuggestions = useMemo(
    () => templateSuggestionTrigger
      ? filterTemplateSuggestions(allTemplates, templateSuggestionTrigger.query)
      : [],
    [allTemplates, templateSuggestionTrigger]
  )
  const selectionOverlayCommands = useMemo(
    () => selectionOverlayCommandIds.map(commandId => commandById[commandId]),
    []
  )
  const setTheme = useCallback((theme: Theme) => {
    setPreferences(current => ({ ...current, theme }))
  }, [])
  const setViewMode = useCallback((viewMode: ViewMode | ((current: ViewMode) => ViewMode)) => {
    setPreferences(current => ({
      ...current,
      viewMode: typeof viewMode === 'function' ? viewMode(current.viewMode) : viewMode
    }))
  }, [])
  const toggleSearchOption = useCallback((option: keyof SourceSearchOptions) => {
    setSearchOptions(current => ({
      ...current,
      [option]: !current[option]
    }))
  }, [])

  const persistRecentFiles = useCallback((paths: string[]) => {
    const saved = saveRecentFiles(window.localStorage, paths)
    setRecentFiles(saved)
  }, [])

  const rememberRecentFile = useCallback((path: string) => {
    persistRecentFiles(rememberRecentFilePath(path, recentFiles))
  }, [persistRecentFiles, recentFiles])

  const updateActiveDocument = useCallback((changes: Partial<EditorDocument>) => {
    setDocuments(current =>
      current.map(document =>
        document.id === activeId
          ? {
              ...document,
              ...changes,
              updatedAt: Date.now()
            }
          : document
      )
    )
  }, [activeId])

  const setEditorSelection = useCallback((start: number, end: number, scrollTop?: number) => {
    window.requestAnimationFrame(() => {
      const textarea = textAreaRef.current
      if (!textarea) return

      textarea.focus()
      if (typeof scrollTop === 'number') textarea.scrollTop = scrollTop
      textarea.setSelectionRange(start, end)
      setSourceSelection({ start, end, hasFocus: true })
    })
  }, [])

  const updateSourceSelection = useCallback((hasFocus = document.activeElement === textAreaRef.current) => {
    const textarea = textAreaRef.current

    if (!textarea) {
      setSourceSelection({ start: 0, end: 0, hasFocus: false })
      return
    }

    setSourceSelection({
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
      hasFocus
    })
  }, [])

  const applyEditorCommand = useCallback((commandId: EditorCommandId) => {
    const document = activeDocument
    const command = commandById[commandId]
    const textarea = textAreaRef.current

    if (!document || !command) {
      setStatus('No active document for formatting')
      return
    }

    const selectionStart = textarea?.selectionStart ?? document.text.length
    const selectionEnd = textarea?.selectionEnd ?? selectionStart
    const scrollTop = textarea?.scrollTop
    const edit = command.execute(document.text, { start: selectionStart, end: selectionEnd })
    const confirmation = `${command.label} applied`

    updateActiveDocument({ text: edit.text })
    setLastCommand(confirmation)
    setStatus(confirmation)
    setEditorSelection(edit.selectionStart, edit.selectionEnd, scrollTop)
  }, [activeDocument, setEditorSelection, updateActiveDocument])

  const openCommandPalette = useCallback(() => {
    commandPaletteReturnFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    setCommandPaletteQuery('')
    setCommandPaletteActiveIndex(0)
    setIsQuickInsertOpen(false)
    setIsTemplatesHelpOpen(false)
    setIsCommandPaletteOpen(true)
    setStatus('Command palette opened')
  }, [])

  const closeCommandPalette = useCallback((restoreFocus = true) => {
    setIsCommandPaletteOpen(false)
    setCommandPaletteQuery('')
    setCommandPaletteActiveIndex(0)

    if (restoreFocus) {
      window.requestAnimationFrame(() => {
        commandPaletteReturnFocusRef.current?.focus()
        commandPaletteReturnFocusRef.current = null
      })
    }
  }, [])

  const openQuickInsert = useCallback(() => {
    if (!activeDocument) {
      setStatus('No active document for quick insert')
      return
    }

    quickInsertReturnFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    setQuickInsertQuery('')
    setQuickInsertActiveIndex(0)
    setIsCommandPaletteOpen(false)
    setIsTemplatesHelpOpen(false)
    setIsQuickInsertOpen(true)
    setStatus('Quick insert opened')
  }, [activeDocument])

  const closeQuickInsert = useCallback((restoreFocus = true) => {
    setIsQuickInsertOpen(false)
    setQuickInsertQuery('')
    setQuickInsertActiveIndex(0)

    if (restoreFocus) {
      window.requestAnimationFrame(() => {
        quickInsertReturnFocusRef.current?.focus()
        quickInsertReturnFocusRef.current = null
      })
    }
  }, [])

  const openPreferences = useCallback(() => {
    preferencesReturnFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    setIsCommandPaletteOpen(false)
    setIsQuickInsertOpen(false)
    setIsTemplatesHelpOpen(false)
    setIsPreferencesOpen(true)
    setStatus('Preferences opened')
  }, [])

  const closePreferences = useCallback((restoreFocus = true) => {
    setIsPreferencesOpen(false)

    if (restoreFocus) {
      window.requestAnimationFrame(() => {
        preferencesReturnFocusRef.current?.focus()
        preferencesReturnFocusRef.current = null
      })
    }
  }, [])

  const openTemplatesHelp = useCallback(() => {
    if (!activeDocument) {
      setStatus('No active document for templates')
      return
    }

    templatesHelpReturnFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    setIsCommandPaletteOpen(false)
    setIsQuickInsertOpen(false)
    setIsPreferencesOpen(false)
    setIsTemplatesHelpOpen(true)
    setStatus('Templates and help opened')
  }, [activeDocument])

  const closeTemplatesHelp = useCallback((restoreFocus = true) => {
    setIsTemplatesHelpOpen(false)

    if (restoreFocus) {
      window.requestAnimationFrame(() => {
        templatesHelpReturnFocusRef.current?.focus()
        templatesHelpReturnFocusRef.current = null
      })
    }
  }, [])

  const insertTemplate = useCallback((template: MarkdownTemplate, body: string) => {
    const document = activeDocument
    const textarea = textAreaRef.current

    if (!document) {
      setStatus('No active document for template insertion')
      return
    }

    const selectionStart = textarea?.selectionStart ?? document.text.length
    const selectionEnd = textarea?.selectionEnd ?? selectionStart
    const scrollTop = textarea?.scrollTop
    const edit = insertTextAtSelection(document.text, body, selectionStart, selectionEnd)

    updateActiveDocument({ text: edit.text })
    setLastCommand(`${template.title} template inserted`)
    setStatus(`Inserted ${template.title}`)
    closeTemplatesHelp(false)
    setEditorSelection(edit.selectionStart, edit.selectionEnd, scrollTop)
  }, [activeDocument, closeTemplatesHelp, setEditorSelection, updateActiveDocument])

  const insertTemplateSuggestion = useCallback((template: MarkdownTemplate) => {
    const document = activeDocument
    const trigger = templateSuggestionTrigger
    const textarea = textAreaRef.current

    if (!document || !trigger) return

    const scrollTop = textarea?.scrollTop
    const body = resolveTemplateSuggestion(template, templateVariables)
    const edit = replaceTemplateTrigger(document.text, trigger, body)

    updateActiveDocument({ text: edit.text })
    setLastCommand(`${template.title} template inserted`)
    setStatus(`Inserted ${template.title}`)
    setDismissedTemplateSuggestionKey(null)
    setTemplateSuggestionActiveIndex(0)
    setEditorSelection(edit.selectionStart, edit.selectionEnd, scrollTop)
  }, [activeDocument, setEditorSelection, templateSuggestionTrigger, templateVariables, updateActiveDocument])

  const handleSourceKeyDown = useCallback((event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    const canUseSuggestions = templateSuggestionTrigger &&
      templateSuggestionKey !== dismissedTemplateSuggestionKey &&
      templateSuggestions.length > 0 &&
      !isCommandPaletteOpen &&
      !isQuickInsertOpen &&
      !isPreferencesOpen &&
      !isTemplatesHelpOpen

    if (!canUseSuggestions) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setTemplateSuggestionActiveIndex(current => nextTemplateIndex(current, 1, templateSuggestions.length))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setTemplateSuggestionActiveIndex(current => nextTemplateIndex(current, -1, templateSuggestions.length))
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      setDismissedTemplateSuggestionKey(templateSuggestionKey)
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      insertTemplateSuggestion(templateSuggestions[templateSuggestionActiveIndex] ?? templateSuggestions[0])
    }
  }, [
    dismissedTemplateSuggestionKey,
    insertTemplateSuggestion,
    isCommandPaletteOpen,
    isPreferencesOpen,
    isQuickInsertOpen,
    isTemplatesHelpOpen,
    templateSuggestionActiveIndex,
    templateSuggestionKey,
    templateSuggestionTrigger,
    templateSuggestions
  ])

  const executePaletteCommand = useCallback((commandId: EditorCommandId) => {
    closeCommandPalette(false)
    applyEditorCommand(commandId)
  }, [applyEditorCommand, closeCommandPalette])

  const executeQuickInsertCommand = useCallback((commandId: EditorCommandId) => {
    closeQuickInsert(false)
    applyEditorCommand(commandId)
  }, [applyEditorCommand, closeQuickInsert])

  const createDocument = useCallback((text = '# Untitled\n\n', title = 'Untitled.md') => {
    const document = createEditorDocument({ title, text })
    setDocuments(current => [...current, document])
    setActiveId(document.id)
    setStatus('New document')
    window.setTimeout(() => textAreaRef.current?.focus(), 0)
  }, [])

  const reloadDocumentFromDisk = useCallback(async (documentId: string): Promise<boolean> => {
    const document = documents.find(item => item.id === documentId)

    if (!document?.path) return false

    try {
      const { contents, info } = await readDocumentFromPlatform(document.path)

      setDocuments(current =>
        current.map(item =>
          item.id === document.id
            ? {
                ...item,
                title: titleFromPath(document.path ?? item.title),
                text: contents,
                savedText: contents,
                lastKnownFileInfo: info,
                externalChange: 'none',
                updatedAt: Date.now()
              }
            : item
        )
      )
      rememberRecentFile(document.path)
      setStatus(`Reloaded ${document.path}`)
      return true
    } catch (error) {
      setStatus(messageFromError(error))
      return false
    }
  }, [documents, rememberRecentFile])

  const requestReloadDocument = useCallback((documentId: string) => {
    const targetDocument = documents.find(item => item.id === documentId)

    if (!targetDocument?.path) return

    if (shouldPromptForClose(targetDocument)) {
      unsavedDialogReturnFocusRef.current = window.document.activeElement instanceof HTMLElement
        ? window.document.activeElement
        : null
      setActiveId(targetDocument.id)
      setPendingLifecycleAction({ kind: 'reload', documentId })
      setStatus('Confirm reload before replacing unsaved text')
      return
    }

    void reloadDocumentFromDisk(documentId)
  }, [documents, reloadDocumentFromDisk])

  const keepLocalCopy = useCallback(async (documentId: string) => {
    const document = documents.find(item => item.id === documentId)

    if (!document?.path) return

    try {
      const info = await getFileInfoFromPlatform(document.path)

      setDocuments(current =>
        current.map(item =>
          item.id === documentId
            ? {
                ...item,
                externalChange: 'none',
                lastKnownFileInfo: info,
                updatedAt: Date.now()
              }
            : item
        )
      )
      setStatus('Keeping local copy')
    } catch (error) {
      setStatus(messageFromError(error))
    }
  }, [documents])

  const openDocument = useCallback(async (path?: string) => {
    try {
      const selected = path ?? await selectOpenPathFromPlatform()

      if (typeof selected !== 'string') return

      const existing = documents.find(document => document.path === selected)

      if (existing && shouldPromptForClose(existing)) {
        unsavedDialogReturnFocusRef.current = window.document.activeElement instanceof HTMLElement
          ? window.document.activeElement
          : null
        setActiveId(existing.id)
        setPendingLifecycleAction({ kind: 'reload', documentId: existing.id })
        setStatus('Confirm reload before replacing unsaved text')
        return
      }

      if (existing) {
        await reloadDocumentFromDisk(existing.id)
        setActiveId(existing.id)
        return
      }

      const { contents, info } = await readDocumentFromPlatform(selected)
      const document = createEditorDocument({
        title: titleFromPath(selected),
        path: selected,
        text: contents,
        savedText: contents,
        lastKnownFileInfo: info
      })

      setDocuments(current => [...current, document])
      setActiveId(document.id)

      rememberRecentFile(selected)
      setStatus(`Opened ${selected}`)
    } catch (error) {
      setStatus(messageFromError(error))
    }
  }, [documents, reloadDocumentFromDisk, rememberRecentFile])

  const saveDocumentAs = useCallback(async (documentId = activeId): Promise<boolean> => {
    const document = documents.find(item => item.id === documentId)
    if (!document) return false

    try {
      const selected = await selectSavePathFromPlatform(document.path ?? document.title)

      if (!selected) {
        setStatus('Save canceled')
        return false
      }

      const info = await writeDocumentToPlatform(selected, document.text)

      setDocuments(current =>
        current.map(item =>
          item.id === document.id
            ? {
                ...item,
                title: titleFromPath(selected),
                path: selected,
                savedText: document.text,
                lastKnownFileInfo: info,
                externalChange: 'none',
                updatedAt: Date.now()
              }
            : item
        )
      )
      rememberRecentFile(selected)
      setStatus(`Saved ${selected}`)
      return true
    } catch (error) {
      setStatus(messageFromError(error))
      return false
    }
  }, [activeId, documents, rememberRecentFile])

  const saveDocument = useCallback(async (documentId = activeId): Promise<boolean> => {
    const document = documents.find(item => item.id === documentId)
    if (!document) return false

    if (!document.path) {
      return saveDocumentAs(document.id)
    }

    try {
      const info = await writeDocumentToPlatform(document.path, document.text)

      setDocuments(current =>
        current.map(item =>
          item.id === document.id
            ? {
                ...item,
                savedText: document.text,
                lastKnownFileInfo: info,
                externalChange: 'none',
                updatedAt: Date.now()
              }
            : item
        )
      )
      rememberRecentFile(document.path)
      setStatus(`Saved ${document.path}`)
      return true
    } catch (error) {
      setStatus(messageFromError(error))
      return false
    }
  }, [activeId, documents, rememberRecentFile, saveDocumentAs])

  const copyMarkdown = useCallback(async () => {
    if (!activeDocument) return

    try {
      await writeClipboardText(activeDocument.text)
      setClipboardStatus('Markdown copied')
      setStatus('Markdown copied')
    } catch (error) {
      setClipboardStatus('Clipboard unavailable')
      setStatus(messageFromError(error))
    }
  }, [activeDocument])

  const checkClipboard = useCallback(async () => {
    try {
      const value = await readClipboardText()
      setClipboardStatus(value ? `${value.length} text characters` : 'Clipboard is empty')
      setStatus('Clipboard checked')
    } catch (error) {
      setClipboardStatus('Clipboard unavailable')
      setStatus(messageFromError(error))
    }
  }, [])

  const printDocument = useCallback(async () => {
    const result = await browserPrintConverter.convert({
      format: 'browser-print',
      markdown: activeDocument?.text ?? ''
    })

    setStatus(result.ok ? 'Print dialog opened' : result.error.message)
  }, [activeDocument?.text])

  const forceCloseDocument = useCallback((id: string) => {
    setDocuments(current => {
      if (current.length === 1) {
        const replacement = createEditorDocument({ title: 'Untitled.md', text: '# Untitled\n\n' })
        setActiveId(replacement.id)
        setStatus(closeStatusLabel(0))
        return [replacement]
      }

      const next = current.filter(document => document.id !== id)
      if (activeId === id) {
        setActiveId(next[Math.max(0, current.findIndex(document => document.id === id) - 1)]?.id ?? next[0]?.id ?? null)
      }
      setStatus(closeStatusLabel(next.length))
      return next
    })
  }, [activeId])

  const requestCloseDocument = useCallback((id: string) => {
    const targetDocument = documents.find(document => document.id === id)

    if (!targetDocument) return

    if (shouldPromptForClose(targetDocument)) {
      unsavedDialogReturnFocusRef.current = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
      setActiveId(targetDocument.id)
      setPendingLifecycleAction({ kind: 'close', documentId: id })
      setStatus('Confirm close before discarding unsaved text')
      return
    }

    forceCloseDocument(id)
  }, [documents, forceCloseDocument])

  const closeUnsavedDialog = useCallback((restoreFocus = true) => {
    setPendingLifecycleAction(null)

    if (restoreFocus) {
      window.requestAnimationFrame(() => {
        unsavedDialogReturnFocusRef.current?.focus()
        unsavedDialogReturnFocusRef.current = null
      })
    }
  }, [])

  const cancelPendingLifecycleAction = useCallback(() => {
    closeUnsavedDialog()
    setStatus('Action canceled')
  }, [closeUnsavedDialog])

  const savePendingLifecycleAction = useCallback(async () => {
    if (!pendingLifecycleAction) return

    const saved = await saveDocument(pendingLifecycleAction.documentId)
    if (!saved) return

    if (pendingLifecycleAction.kind === 'close') {
      closeUnsavedDialog(false)
      forceCloseDocument(pendingLifecycleAction.documentId)
      return
    }

    closeUnsavedDialog(false)
    setStatus('Local edits saved')
  }, [closeUnsavedDialog, forceCloseDocument, pendingLifecycleAction, saveDocument])

  const discardPendingLifecycleAction = useCallback(async () => {
    if (!pendingLifecycleAction) return

    if (pendingLifecycleAction.kind === 'close') {
      closeUnsavedDialog(false)
      forceCloseDocument(pendingLifecycleAction.documentId)
      return
    }

    const reloaded = await reloadDocumentFromDisk(pendingLifecycleAction.documentId)
    if (reloaded) closeUnsavedDialog(false)
  }, [closeUnsavedDialog, forceCloseDocument, pendingLifecycleAction, reloadDocumentFromDisk])

  const jumpToMatch = useCallback((match: SourceSearchMatch, index: number) => {
    setSelectedMatch(index)
    setViewMode(current => current === 'preview' ? 'split' : current)
    window.setTimeout(() => {
      const textarea = textAreaRef.current
      if (!textarea) return
      textarea.focus()
      textarea.setSelectionRange(match.start, match.end)
      const lineHeight = Number.parseFloat(window.getComputedStyle(textarea).lineHeight) || 22
      textarea.scrollTop = Math.max(0, (match.line - 4) * lineHeight)
    }, 0)
  }, [])

  const replaceCurrentMatch = useCallback(() => {
    const document = activeDocument
    const match = searchMatches[selectedMatch]

    if (!document || !searchQuery.trim()) {
      setStatus('Search before replacing')
      return
    }

    if (!match) {
      setStatus('No selected match to replace')
      return
    }

    const result = replaceCurrentSourceMatch(document.text, searchQuery, replaceText, searchOptions, match)

    if (result.error) {
      setStatus(`Search regex error: ${result.error}`)
      return
    }

    const cursor = match.start + result.replacementLength

    updateActiveDocument({ text: result.text })
    setLastCommand('Replace current applied')
    setStatus('Replaced current match')
    setEditorSelection(match.start, cursor)
  }, [activeDocument, replaceText, searchMatches, searchOptions, searchQuery, selectedMatch, setEditorSelection, updateActiveDocument])

  const replaceAllMatches = useCallback(() => {
    const document = activeDocument

    if (!document || !searchQuery.trim()) {
      setStatus('Search before replacing')
      return
    }

    if (searchMatches.length === 0) {
      setStatus('No matches to replace')
      return
    }

    const result = replaceAllSourceMatches(document.text, searchQuery, replaceText, searchOptions)

    if (result.error) {
      setStatus(`Search regex error: ${result.error}`)
      return
    }

    updateActiveDocument({ text: result.text })
    setSelectedMatch(0)
    setLastCommand(`Replace all applied to ${result.count} matches`)
    setStatus(`Replaced ${result.count} matches`)
    setEditorSelection(0, 0)
  }, [activeDocument, replaceText, searchMatches.length, searchOptions, searchQuery, setEditorSelection, updateActiveDocument])

  useEffect(() => {
    let unlisten: (() => void) | null = null

    void listen<string>('markforge://menu', event => {
      const id = event.payload

      if (id === 'file.new') createDocument()
      else if (id === 'file.open') void openDocument()
      else if (id === 'file.save') void saveDocument()
      else if (id === 'file.saveAs') void saveDocumentAs()
      else if (id === 'edit.copyMarkdown') void copyMarkdown()
      else if (id === 'view.print') void printDocument()
      else if (id === 'help.phase1') setStatus('Phase 1 help menu received; Phase 4 shell is active')
      else setStatus(`Unsupported menu command: ${id}`)
    }).then(cleanup => {
      unlisten = cleanup
    }).catch(error => {
      setStatus(`Native menu unavailable: ${messageFromError(error)}`)
    })

    return () => {
      unlisten?.()
    }
  }, [copyMarkdown, createDocument, openDocument, printDocument, saveDocument, saveDocumentAs])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const actionId = actionIdFromKeyboardEvent(event, preferences.keybindings)

      if (!actionId || !shouldHandleEditorShortcut(event, textAreaRef.current)) return

      if (actionId === commandPaletteActionId) {
        event.preventDefault()

        if (isCommandPaletteOpen) closeCommandPalette()
        else openCommandPalette()

        return
      }

      if (actionId === quickInsertActionId) {
        event.preventDefault()

        if (isQuickInsertOpen) closeQuickInsert()
        else openQuickInsert()

        return
      }

      if (actionId === templatesHelpActionId) {
        event.preventDefault()

        if (isTemplatesHelpOpen) closeTemplatesHelp()
        else openTemplatesHelp()

        return
      }

      event.preventDefault()
      applyEditorCommand(actionId)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    applyEditorCommand,
    closeCommandPalette,
    closeQuickInsert,
    closeTemplatesHelp,
    isCommandPaletteOpen,
    isQuickInsertOpen,
    isTemplatesHelpOpen,
    openCommandPalette,
    openQuickInsert,
    openTemplatesHelp,
    preferences.keybindings
  ])

  useEffect(() => {
    const trackedDocuments = documents.filter(document => document.path)

    if (trackedDocuments.length === 0) return

    const pollDocuments = async () => {
      const results = await Promise.all(trackedDocuments.map(async document => {
        if (!document.path) return null

        try {
          const info = await getFileInfoFromPlatform(document.path)
          return {
            documentId: document.id,
            next: reconcileFileInfo(document, info)
          }
        } catch (error) {
          setStatus(messageFromError(error))
          return null
        }
      }))

      const updates = results.filter(result => result !== null)

      if (updates.length === 0) return

      setDocuments(current =>
        current.map(document => {
          const update = updates.find(item => item.documentId === document.id)

          if (!update) return document
          if (
            document.externalChange === update.next.externalChange &&
            fileInfoEquals(document.lastKnownFileInfo, update.next.lastKnownFileInfo)
          ) {
            return document
          }

          return {
            ...document,
            externalChange: update.next.externalChange,
            lastKnownFileInfo: update.next.lastKnownFileInfo,
            updatedAt: Date.now()
          }
        })
      )

      const changedCount = updates.filter(update => update.next.externalChange !== 'none').length

      if (changedCount > 0) {
        setStatus(changedCount === 1 ? 'File changed on disk' : `${changedCount} files changed on disk`)
      }
    }

    const interval = window.setInterval(() => {
      void pollDocuments()
    }, 2500)

    return () => window.clearInterval(interval)
  }, [documents])

  useEffect(() => {
    setSelectedMatch(0)
  }, [activeDocument?.id, searchOptions, searchQuery])

  useEffect(() => {
    const persisted: PersistedEditorSession = {
      activeId,
      docs: documents
        .filter(document => !document.path || isDirty(document))
        .map(document => ({
          id: document.id,
          title: document.title,
          path: document.path,
          text: document.text,
          savedText: document.savedText,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt
        }))
    }

    saveEditorSession(window.localStorage, persisted)
  }, [activeId, documents])

  useEffect(() => {
    saveEditorPreferences(preferences)
  }, [preferences])

  useEffect(() => {
    const hasDirtyDocuments = documents.some(document => isDirty(document))

    if (!hasDirtyDocuments) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [documents])

  const selectedSearchMatch = searchMatches[selectedMatch]
  const pendingLifecycleDocument = pendingLifecycleAction
    ? documents.find(document => document.id === pendingLifecycleAction.documentId) ?? null
    : null
  const showTemplateSuggestions = Boolean(
    activeDocument &&
    templateSuggestionTrigger &&
    templateSuggestionKey !== dismissedTemplateSuggestionKey &&
    templateSuggestions.length > 0 &&
    viewMode !== 'preview' &&
    !isCommandPaletteOpen &&
    !isQuickInsertOpen &&
    !isPreferencesOpen &&
    !isTemplatesHelpOpen
  )
  const showSelectionOverlay = Boolean(
    activeDocument &&
    sourceSelection.hasFocus &&
    sourceSelection.end > sourceSelection.start &&
    viewMode !== 'preview' &&
    !isCommandPaletteOpen &&
    !isQuickInsertOpen &&
    !isPreferencesOpen &&
    !isTemplatesHelpOpen &&
    !showTemplateSuggestions &&
    !pendingLifecycleAction
  )

  return (
    <main className={`editorShell ${theme}`} data-theme={theme}>
      <header className="commandRail" aria-label="Editor commands">
        <div className="brandLockup">
          <FilePenLine size={20} aria-hidden="true" />
          <div>
            <span>MarkForge Editor</span>
            <strong>{fileName}</strong>
          </div>
        </div>

        <nav className="toolbar" aria-label="File actions">
          <button type="button" onClick={() => createDocument()} title="New document" aria-label="New document">
            <FilePlus2 size={18} />
          </button>
          <button type="button" onClick={() => void openDocument()} title="Open file" aria-label="Open file">
            <FileInput size={18} />
          </button>
          <button type="button" onClick={() => void saveDocument()} title="Save" aria-label="Save">
            <Save size={18} />
          </button>
          <button type="button" onClick={() => void saveDocumentAs()} title="Save as" aria-label="Save as">
            <FileDown size={18} />
          </button>
          <button type="button" onClick={() => void copyMarkdown()} title="Copy Markdown" aria-label="Copy Markdown">
            <ClipboardCopy size={18} />
          </button>
          <button type="button" onClick={() => void checkClipboard()} title="Check clipboard" aria-label="Check clipboard">
            <ClipboardCheck size={18} />
          </button>
          <button
            type="button"
            onClick={openCommandPalette}
            title={`Command palette (${displayShortcut(commandPaletteShortcut)})`}
            aria-label="Command palette"
          >
            <Command size={18} />
          </button>
          <button
            type="button"
            disabled={!activeDocument}
            onClick={openQuickInsert}
            title={`Quick insert (${displayShortcut(quickInsertShortcut)})`}
            aria-label="Quick insert"
          >
            <TextCursorInput size={18} />
          </button>
          <button
            type="button"
            disabled={!activeDocument}
            onClick={openTemplatesHelp}
            title={`Templates and help (${displayShortcut(templatesHelpShortcut)})`}
            aria-label="Templates and help"
          >
            <BookOpenText size={18} />
          </button>
          <button
            type="button"
            onClick={openPreferences}
            title="Preferences"
            aria-label="Preferences"
          >
            <Settings size={18} />
          </button>
          <button type="button" onClick={() => void printDocument()} title="Print" aria-label="Print">
            <Printer size={18} />
          </button>
        </nav>

        <div className="viewSwitch" aria-label="View mode">
          {(['source', 'split', 'preview'] as const).map(mode => (
            <button
              key={mode}
              type="button"
              className={viewMode === mode ? 'active' : ''}
              onClick={() => setViewMode(mode)}
              title={`${mode} view`}
              aria-label={`${mode} view`}
            >
              {mode === 'split' ? <SplitSquareHorizontal size={15} /> : mode}
            </button>
          ))}
        </div>

        <label className={`searchBox ${hasSearchError ? 'error' : ''}`}>
          <Search size={16} aria-hidden="true" />
          <input
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            placeholder="Search source"
            aria-label="Search source"
          />
          {searchQuery && (
            <span title={searchResult.error ?? `${searchMatches.length} matches`}>
              {hasSearchError ? '!' : searchMatches.length}
            </span>
          )}
        </label>

        <div className="searchOptions" aria-label="Search options">
          <button
            type="button"
            className={searchOptions.caseSensitive ? 'active' : ''}
            onClick={() => toggleSearchOption('caseSensitive')}
            title="Case-sensitive search"
            aria-pressed={searchOptions.caseSensitive}
            aria-label="Case-sensitive search"
          >
            <CaseSensitive size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={searchOptions.wholeWord ? 'active' : ''}
            onClick={() => toggleSearchOption('wholeWord')}
            title="Whole-word search"
            aria-pressed={searchOptions.wholeWord}
            aria-label="Whole-word search"
          >
            <WholeWord size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={searchOptions.regex ? 'active' : ''}
            onClick={() => toggleSearchOption('regex')}
            title="Regex search"
            aria-pressed={searchOptions.regex}
            aria-label="Regex search"
          >
            <Regex size={15} aria-hidden="true" />
          </button>
        </div>

        <div className="themeSwitch" aria-label="Theme">
          <button
            type="button"
            className={theme === 'light' ? 'active' : ''}
            onClick={() => setTheme('light')}
            title="Light mode"
            aria-label="Light mode"
          >
            <Sun size={16} />
          </button>
          <button
            type="button"
            className={theme === 'dark' ? 'active' : ''}
            onClick={() => setTheme('dark')}
            title="Dark mode"
            aria-label="Dark mode"
          >
            <Moon size={16} />
          </button>
        </div>
      </header>

      <section className="tabStrip" aria-label="Open documents">
        {documents.map(document => (
          <div
            key={document.id}
            className={`tabItem ${document.id === activeId ? 'active' : ''}`}
          >
            <button
              type="button"
              className="tabButton"
              onClick={() => setActiveId(document.id)}
              title={document.path ?? document.title}
              aria-current={document.id === activeId ? 'page' : undefined}
            >
              <span className={isDirty(document) ? 'dirtyDot' : 'cleanDot'} aria-hidden="true" />
              <span>{document.title}</span>
              {document.externalChange !== 'none' && (
                <TriangleAlert size={13} aria-label={externalChangeLabel(document.externalChange)} />
              )}
            </button>
            <button
              type="button"
              className="tabCloseButton"
              onClick={() => requestCloseDocument(document.id)}
              title={`Close ${document.title}`}
              aria-label={`Close ${document.title}`}
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        ))}
      </section>

      <section className="formatRail" aria-label="Markdown formatting commands">
        {commandsByGroup.map(group => (
          <div className="commandGroup" key={group.id} aria-label={`${group.label} formatting commands`}>
            <span className="commandGroupLabel">{group.label}</span>
            <div className="commandButtons">
              {group.commands.map(command => {
                const Icon = commandIconByName[command.icon]
                const title = command.shortcut ? `${command.label} (${displayShortcut(command.shortcut)})` : command.label
                const headingLabel = command.id.startsWith('block.heading')
                  ? `H${command.id.slice(-1)}`
                  : null

                return (
                  <button
                    key={command.id}
                    type="button"
                    disabled={!activeDocument}
                    onClick={() => applyEditorCommand(command.id)}
                    title={title}
                    aria-label={title}
                  >
                    <Icon size={16} aria-hidden="true" />
                    {headingLabel && <span>{headingLabel}</span>}
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        <div className="commandGroup replaceGroup" aria-label="Replace commands">
          <span className="commandGroupLabel">Replace</span>
          <label className="replaceBox">
            <Replace size={15} aria-hidden="true" />
            <input
              value={replaceText}
              onChange={event => setReplaceText(event.target.value)}
              placeholder="Replace with"
              aria-label="Replace with"
            />
          </label>
          <div className="replaceActions">
            <button
              type="button"
              disabled={!activeDocument || hasSearchError || searchMatches.length === 0}
              onClick={replaceCurrentMatch}
              title="Replace selected search match"
            >
              Current
            </button>
            <button
              type="button"
              disabled={!activeDocument || hasSearchError || searchMatches.length === 0}
              onClick={replaceAllMatches}
              title="Replace all search matches"
            >
              All
            </button>
          </div>
        </div>
      </section>

      <section className={`editorWorkspace ${viewMode}`}>
        <section
          className={`sourcePane ${viewMode === 'preview' ? 'isHidden' : ''}`}
          aria-label="Markdown source editor"
        >
          <div className="paneHeader">
            <strong>Source</strong>
            <span>{activeDirty ? 'Unsaved' : 'Saved'}</span>
          </div>
          <textarea
            ref={textAreaRef}
            value={activeDocument?.text ?? ''}
            spellCheck
            onBlur={() => setSourceSelection(current => ({ ...current, hasFocus: false }))}
            onChange={event => {
              updateActiveDocument({ text: event.target.value })
              setDismissedTemplateSuggestionKey(null)
              setTemplateSuggestionActiveIndex(0)
              updateSourceSelection(true)
            }}
            onFocus={() => updateSourceSelection(true)}
            onKeyDown={handleSourceKeyDown}
            onKeyUp={() => updateSourceSelection(true)}
            onMouseUp={() => updateSourceSelection(true)}
            onSelect={() => updateSourceSelection(true)}
            aria-label="Markdown source"
          />
          {showTemplateSuggestions && (
            <div
              className="templateSuggestionMenu"
              role="listbox"
              aria-label="Template suggestions"
              onMouseDown={event => event.preventDefault()}
            >
              <div className="templateSuggestionHint">
                <FileText size={14} aria-hidden="true" />
                <span>{templateSuggestionTrigger?.query ? `Templates matching "${templateSuggestionTrigger.query}"` : 'Template suggestions'}</span>
              </div>
              {templateSuggestions.map((template, index) => (
                <button
                  key={template.id}
                  type="button"
                  className={index === templateSuggestionActiveIndex ? 'active' : ''}
                  onClick={() => insertTemplateSuggestion(template)}
                  onMouseEnter={() => setTemplateSuggestionActiveIndex(index)}
                  role="option"
                  aria-selected={index === templateSuggestionActiveIndex}
                >
                  <span>{template.category}</span>
                  <strong>{template.title}</strong>
                  <small>{template.description}</small>
                </button>
              ))}
            </div>
          )}
          {showSelectionOverlay && (
            <div className="selectionOverlay" role="toolbar" aria-label="Selection formatting">
              {selectionOverlayCommands.map(command => {
                const Icon = commandIconByName[command.icon]

                return (
                  <button
                    key={command.id}
                    type="button"
                    onClick={() => applyEditorCommand(command.id)}
                    onMouseDown={event => event.preventDefault()}
                    title={command.label}
                    aria-label={command.label}
                  >
                    <Icon size={15} aria-hidden="true" />
                  </button>
                )
              })}
            </div>
          )}
        </section>

        <section
          className={`previewPane ${viewMode === 'source' ? 'isHidden' : ''}`}
          aria-label="Markdown preview"
        >
          <div className="paneHeader">
            <strong>Preview</strong>
            <span>{rendered.warnings.length} warnings</span>
          </div>
          <div className="previewStage">
            {renderError && (
              <div className="renderError" role="alert">
                <TriangleAlert size={16} />
                <span>Renderer recovered: {renderError}</span>
              </div>
            )}
            {activeDocument && activeDocument.externalChange !== 'none' && (
              <div className="changeNotice" role="status">
                <TriangleAlert size={16} aria-hidden="true" />
                <div>
                  <strong>{externalChangeLabel(activeDocument.externalChange)}</strong>
                  <span>
                    {activeDocument.externalChange === 'missing'
                      ? 'Keep the local copy or choose another save path.'
                      : activeDirty
                        ? 'Reload replaces local edits.'
                        : 'Reload from disk or keep this local copy.'}
                  </span>
                </div>
                <div className="changeNoticeActions">
                  {activeDocument.externalChange !== 'missing' && (
                    <button type="button" onClick={() => requestReloadDocument(activeDocument.id)}>
                      Reload
                    </button>
                  )}
                  <button type="button" onClick={() => void keepLocalCopy(activeDocument.id)}>
                    Keep local
                  </button>
                </div>
              </div>
            )}
            <article className="documentPage" dangerouslySetInnerHTML={{ __html: rendered.html }} />
          </div>
        </section>

        <aside className="inspector" aria-label="Document inspector">
          <section>
            <div className="panelTitle">
              <ShieldCheck size={16} />
              <h2>File Status</h2>
            </div>
            <dl className="metaList">
              <dt>Path</dt>
              <dd>{activeDocument?.path ?? 'Unsaved tab'}</dd>
              <dt>State</dt>
              <dd>{activeFileStatus}</dd>
              <dt>Size</dt>
              <dd>{formatBytes(activeDocument?.lastKnownFileInfo?.len ?? activeDocument?.text.length ?? 0)}</dd>
              <dt>External</dt>
              <dd>
                {activeDocument?.externalChange && activeDocument.externalChange !== 'none'
                  ? externalChangeLabel(activeDocument.externalChange)
                  : activeDocument?.path
                    ? 'Polling metadata'
                    : 'Not tracked'}
              </dd>
              <dt>Clipboard</dt>
              <dd>{clipboardStatus}</dd>
            </dl>
          </section>

          <section>
            <div className="panelTitle">
              <Keyboard size={16} />
              <h2>Commands</h2>
            </div>
            <p className="commandStatus">{lastCommand}</p>
            <dl className="shortcutList">
              {keybindingDefinitions.map(definition => (
                <Fragment key={definition.id}>
                  <dt>{displayShortcut(shortcutForAction(definition.id, preferences.keybindings))}</dt>
                  <dd title={definition.id}>{definition.label}</dd>
                </Fragment>
              ))}
            </dl>
          </section>

          <section>
            <div className="panelTitle">
              <Search size={16} />
              <h2>Search</h2>
            </div>
            {searchQuery ? (
              hasSearchError ? (
                <p className="emptyLine">Invalid regex</p>
              ) : searchMatches.length > 0 ? (
                <ol className="matches">
                  {searchMatches.map((match, index) => (
                    <li key={`${match.line}-${match.column}-${match.text}`} className={index === selectedMatch ? 'selected' : ''}>
                      <button type="button" onClick={() => jumpToMatch(match, index)}>
                        <span>Line {match.line}</span>
                        <mark>{highlightSourceSnippet(match.text, searchQuery, searchOptions)}</mark>
                      </button>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="emptyLine">No matches</p>
              )
            ) : (
              <p className="emptyLine">Search is idle</p>
            )}
            {searchResult.error && <p className="selectionHint">Regex error: {searchResult.error}</p>}
            {selectedSearchMatch && <p className="selectionHint">Selected line {selectedSearchMatch.line}</p>}
          </section>

          <section>
            <div className="panelTitle">
              <ListTree size={16} />
              <h2>Outline</h2>
            </div>
            {rendered.headings.length > 0 ? (
              <ol className="toc">
                {rendered.headings.map(heading => (
                  <li key={`${heading.id}-${heading.text}`} style={{ '--depth': heading.level - 1 } as CSSProperties}>
                    <a href={`#${heading.id}`}>{heading.text}</a>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="emptyLine">No headings</p>
            )}
          </section>

          <section>
            <div className="panelTitle">
              <Files size={16} />
              <h2>Recent Files</h2>
            </div>
            {recentFiles.length > 0 ? (
              <ol className="recentFiles">
                {recentFiles.map(path => (
                  <li key={path}>
                    <button type="button" onClick={() => void openDocument(path)} title={path}>
                      {titleFromPath(path)}
                      <span>{path}</span>
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="emptyLine">None yet</p>
            )}
          </section>

          <section>
            <div className="panelTitle">
              <ClipboardCheck size={16} />
              <h2>Front Matter</h2>
            </div>
            {rendered.frontMatter ? (
              <>
                <p className="frontMatterRange">
                  {rendered.frontMatter.language.toUpperCase()}, lines {rendered.frontMatter.startLine}-{rendered.frontMatter.endLine}
                </p>
                {frontMatterRows.length > 0 ? (
                  <dl className="metaList compact">
                    {frontMatterRows.map(row => (
                      <Fragment key={row[0]}>
                        <dt>{row[0]}</dt>
                        <dd>{row[1]}</dd>
                      </Fragment>
                    ))}
                  </dl>
                ) : (
                  <pre className="rawMatter">{rendered.frontMatter.raw}</pre>
                )}
              </>
            ) : (
              <p className="emptyLine">None</p>
            )}
          </section>

          <section>
            <div className="panelTitle">
              <TriangleAlert size={16} />
              <h2>Warnings</h2>
            </div>
            {rendered.warnings.length > 0 ? (
              <ol className="warnings">
                {rendered.warnings.map((warning, index) => (
                  <li key={`${warning.code}-${warning.line ?? index}`}>
                    <span>{warning.severity}</span>
                    <p>{warning.line ? `Line ${warning.line}: ` : ''}{warning.message}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="emptyLine">None</p>
            )}
          </section>
        </aside>
      </section>

      <footer className="statusBar" aria-label="Document status">
        <span>{activeDirty ? 'Unsaved' : 'Saved'}</span>
        <span>{activeDocument?.path ?? 'Untitled'}</span>
        <span>{stats.lines} lines</span>
        <span>{stats.words} words</span>
        <span>{stats.characters} chars</span>
        <span>{rendered.warnings.length} warnings</span>
        <strong>{status}</strong>
      </footer>

      {isCommandPaletteOpen && (
        <CommandPalette
          activeIndex={commandPaletteActiveIndex}
          commandPaletteShortcut={commandPaletteShortcut}
          commands={paletteCommands}
          iconByName={commandIconByName}
          onActiveIndexChange={setCommandPaletteActiveIndex}
          onExecute={executePaletteCommand}
          onQueryChange={setCommandPaletteQuery}
          onRequestClose={closeCommandPalette}
          query={commandPaletteQuery}
        />
      )}

      {isQuickInsertOpen && (
        <QuickInsert
          activeIndex={quickInsertActiveIndex}
          commands={quickInsertCommands}
          iconByName={commandIconByName}
          onActiveIndexChange={setQuickInsertActiveIndex}
          onExecute={executeQuickInsertCommand}
          onQueryChange={setQuickInsertQuery}
          onRequestClose={closeQuickInsert}
          query={quickInsertQuery}
          shortcut={quickInsertShortcut}
        />
      )}

      {isPreferencesOpen && (
        <PreferencesDialog
          preferences={preferences}
          onPreferencesChange={setPreferences}
          onRequestClose={closePreferences}
        />
      )}

      {isTemplatesHelpOpen && (
        <TemplatesHelpDialog
          customTemplates={customTemplates}
          onCustomTemplatesChange={setCustomTemplates}
          onInsert={insertTemplate}
          onRequestClose={closeTemplatesHelp}
          shortcut={templatesHelpShortcut}
          variables={templateVariables}
        />
      )}

      {pendingLifecycleAction && pendingLifecycleDocument && (
        <UnsavedChangesDialog
          documentPath={pendingLifecycleDocument.path}
          documentTitle={pendingLifecycleDocument.title}
          mode={pendingLifecycleAction.kind}
          onCancel={cancelPendingLifecycleAction}
          onDiscard={() => void discardPendingLifecycleAction()}
          onSave={() => void savePendingLifecycleAction()}
        />
      )}
    </main>
  )
}

function restoreInitialState(): {
  activeId: string
  documents: EditorDocument[]
  preferences: EditorPreferences
  recentFiles: string[]
  status: string
} {
  const preferences = readEditorPreferences()
  const session = readEditorSession(window.localStorage)
  const recentFiles = readRecentFiles(window.localStorage)
  const restoredDocuments = session?.docs
    ?.filter(document => typeof document.text === 'string')
    .map(document => createEditorDocument({
      ...document,
      lastKnownFileInfo: null,
      externalChange: 'none'
    })) ?? []
  const documents = restoredDocuments.length > 0
    ? restoredDocuments
    : [createEditorDocument({ title: 'Welcome.md', text: starter, savedText: starter })]
  const activeId = documents.find(document => document.id === session?.activeId)?.id ?? documents[0].id

  return {
    activeId,
    documents,
    preferences,
    recentFiles,
    status: restoredDocuments.length > 0 ? 'Restored unsaved session' : 'Ready'
  }
}

function createEditorDocument(input: Partial<EditorDocument> & { title: string; text: string }): EditorDocument {
  const now = Date.now()

  return {
    id: input.id ?? `doc-${now}-${Math.random().toString(36).slice(2)}`,
    title: input.title,
    path: input.path ?? null,
    text: input.text,
    savedText: input.savedText ?? '',
    lastKnownFileInfo: input.lastKnownFileInfo ?? null,
    externalChange: normalizeExternalChange(input.externalChange),
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now
  }
}

function safeRenderMarkdown(source: string): { rendered: RenderedMarkdown; renderError: string | null } {
  if (!source) {
    return { rendered: emptyRendered, renderError: null }
  }

  try {
    return {
      rendered: renderMarkdown(source),
      renderError: null
    }
  } catch (error) {
    const message = messageFromError(error)

    return {
      rendered: {
        body: source,
        frontMatter: null,
        headings: [],
        html: `<h1>Render failed</h1><p>The editor shell is still running.</p><pre>${escapeHtml(source)}</pre>`,
        warnings: [
          {
            code: 'renderer-failed',
            message,
            severity: 'warning'
          }
        ]
      } as RenderedMarkdown,
      renderError: message
    }
  }
}

function frontMatterEntries(data: FrontMatterData | null | undefined): [string, string][] {
  if (!data || Array.isArray(data) || typeof data !== 'object') return []

  return Object.entries(data).map(([key, value]) => [key, String(value)])
}

function shouldHandleEditorShortcut(event: KeyboardEvent, textarea: HTMLTextAreaElement | null): boolean {
  if (event.defaultPrevented) return false

  const target = event.target

  if (!(target instanceof HTMLElement)) return true
  if (target === textarea) return true
  if (target.isContentEditable) return false

  return !['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)
}

function documentStats(source: string): { characters: number; lines: number; words: number } {
  const words = source.trim() ? source.trim().split(/\s+/).length : 0

  return {
    characters: source.length,
    lines: source ? source.split(/\r?\n/).length : 0,
    words
  }
}

function insertTextAtSelection(
  source: string,
  insertion: string,
  selectionStart: number,
  selectionEnd: number
): { selectionEnd: number; selectionStart: number; text: string } {
  const start = Math.max(0, Math.min(selectionStart, source.length))
  const end = Math.max(start, Math.min(selectionEnd, source.length))
  const before = source.slice(0, start)
  const after = source.slice(end)
  const prefix = before && !before.endsWith('\n') ? '\n\n' : ''
  const suffix = after && !insertion.endsWith('\n') ? '\n\n' : ''
  const insertedStart = before.length + prefix.length
  const insertedEnd = insertedStart + insertion.length

  return {
    selectionStart: insertedStart,
    selectionEnd: insertedEnd,
    text: `${before}${prefix}${insertion}${suffix}${after}`
  }
}

function nextTemplateIndex(current: number, delta: number, count: number): number {
  if (count <= 0) return 0

  return (current + delta + count) % count
}

function templateVariablesForDocument(document: EditorDocument | null): TemplateVariables {
  const title = document ? titleWithoutExtension(document.title) : 'Untitled'

  return {
    date: new Date().toISOString().slice(0, 10),
    install_command: 'pnpm install',
    license: 'TBD',
    owner: '',
    title,
    version: 'Unreleased'
  }
}

function titleWithoutExtension(title: string): string {
  return title.replace(/\.(md|markdown|mdown|txt)$/i, '') || title
}

function titleFromPath(path: string): string {
  return path.split(/[\\/]/).pop() ?? path
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function fileInfoEquals(left: FileInfo | null, right: FileInfo | null): boolean {
  if (left === right) return true
  if (!left || !right) return false

  return left.exists === right.exists &&
    left.modifiedMs === right.modifiedMs &&
    left.len === right.len
}

function messageFromError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Unexpected editor error'
}

async function selectOpenPathFromPlatform(): Promise<string | null> {
  const result = await platform.dialogs.openMarkdownFile()
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}

async function selectSavePathFromPlatform(defaultPath: string): Promise<string | null> {
  const result = await platform.dialogs.saveMarkdownFile(defaultPath)
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}

async function readDocumentFromPlatform(path: string): Promise<{ contents: string; info: FileInfo }> {
  const contents = await platform.filesystem.readTextFile(path)
  if (!contents.ok) throw new Error(contents.error.message)

  const info = await platform.filesystem.getFileInfo(path)
  if (!info.ok) throw new Error(info.error.message)

  return { contents: contents.value, info: info.value }
}

async function writeDocumentToPlatform(path: string, contents: string): Promise<FileInfo> {
  const written = await platform.filesystem.writeTextFile(path, contents)
  if (!written.ok) throw new Error(written.error.message)

  return getFileInfoFromPlatform(path)
}

async function getFileInfoFromPlatform(path: string): Promise<FileInfo> {
  const result = await platform.filesystem.getFileInfo(path)
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}

async function writeClipboardText(value: string): Promise<void> {
  const result = await platform.clipboard.writeText(value)
  if (!result.ok) throw new Error(result.error.message)
}

async function readClipboardText(): Promise<string> {
  const result = await platform.clipboard.readText()
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
