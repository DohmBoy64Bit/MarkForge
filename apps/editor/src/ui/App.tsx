import { renderMarkdown, type FrontMatterData, type RenderedMarkdown } from '@markforge/markdown-engine'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { readText, writeText } from '@tauri-apps/plugin-clipboard-manager'
import { open, save } from '@tauri-apps/plugin-dialog'
import {
  ClipboardCheck,
  ClipboardCopy,
  FileDown,
  FileInput,
  FilePenLine,
  FilePlus2,
  Files,
  ListTree,
  Moon,
  Printer,
  Save,
  Search,
  ShieldCheck,
  SplitSquareHorizontal,
  Sun,
  TriangleAlert,
  X
} from 'lucide-react'
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

type FileInfo = {
  exists: boolean
  modifiedMs: number | null
  len: number | null
}

type EditorDocument = {
  id: string
  title: string
  path: string | null
  text: string
  savedText: string
  lastKnownFileInfo: FileInfo | null
  externalChange: boolean
  createdAt: number
  updatedAt: number
}

type SearchMatch = {
  line: number
  column: number
  text: string
  start: number
  end: number
}

type ViewMode = 'source' | 'split' | 'preview'
type Theme = 'light' | 'dark'

type PersistedSession = {
  activeId: string | null
  docs: Array<Pick<EditorDocument, 'id' | 'title' | 'path' | 'text' | 'savedText' | 'createdAt' | 'updatedAt'>>
}

type PersistedPrefs = {
  theme?: Theme
  viewMode?: ViewMode
}

const supportedExtensions = ['md', 'markdown', 'mdown', 'txt']
const sessionKey = 'markforge.editor.session.v1'
const prefsKey = 'markforge.editor.prefs.v1'
const recentKey = 'markforge.editor.recent.v1'

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
  const [viewMode, setViewMode] = useState<ViewMode>(restored.viewMode)
  const [theme, setTheme] = useState<Theme>(restored.theme)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMatch, setSelectedMatch] = useState(0)
  const [status, setStatus] = useState(restored.status)
  const [clipboardStatus, setClipboardStatus] = useState('Not checked')
  const [recentFiles, setRecentFiles] = useState<string[]>(restored.recentFiles)
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)

  const activeDocument = documents.find(document => document.id === activeId) ?? documents[0] ?? null
  const activeDirty = activeDocument ? isDirty(activeDocument) : false
  const fileName = activeDocument ? activeDocument.title : 'No document'
  const renderState = useMemo(() => safeRenderMarkdown(activeDocument?.text ?? ''), [activeDocument?.text])
  const { rendered, renderError } = renderState
  const frontMatterRows = useMemo(() => frontMatterEntries(rendered.frontMatter?.data), [rendered.frontMatter])
  const searchMatches = useMemo(
    () => findMatches(activeDocument?.text ?? '', searchQuery),
    [activeDocument?.text, searchQuery]
  )
  const stats = useMemo(() => documentStats(activeDocument?.text ?? ''), [activeDocument?.text])

  const persistRecentFiles = useCallback((paths: string[]) => {
    setRecentFiles(paths)
    saveJson(recentKey, paths)
  }, [])

  const rememberRecentFile = useCallback((path: string) => {
    persistRecentFiles([path, ...recentFiles.filter(recent => recent !== path)].slice(0, 8))
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

  const createDocument = useCallback((text = '# Untitled\n\n', title = 'Untitled.md') => {
    const document = createEditorDocument({ title, text })
    setDocuments(current => [...current, document])
    setActiveId(document.id)
    setStatus('New document')
    window.setTimeout(() => textAreaRef.current?.focus(), 0)
  }, [])

  const openDocument = useCallback(async (path?: string) => {
    try {
      const selected = path ?? await open({
        multiple: false,
        filters: [{ name: 'Markdown and text', extensions: supportedExtensions }]
      })

      if (typeof selected !== 'string') return

      const contents = await invoke<string>('read_text_file', { path: selected })
      const info = await invoke<FileInfo>('get_file_info', { path: selected })
      const existing = documents.find(document => document.path === selected)

      if (existing) {
        setDocuments(current =>
          current.map(document =>
            document.id === existing.id
              ? {
                  ...document,
                  text: contents,
                  savedText: contents,
                  lastKnownFileInfo: info,
                  externalChange: false,
                  updatedAt: Date.now()
                }
              : document
          )
        )
        setActiveId(existing.id)
      } else {
        const document = createEditorDocument({
          title: titleFromPath(selected),
          path: selected,
          text: contents,
          savedText: contents,
          lastKnownFileInfo: info
        })
        setDocuments(current => [...current, document])
        setActiveId(document.id)
      }

      rememberRecentFile(selected)
      setStatus(`Opened ${selected}`)
    } catch (error) {
      setStatus(messageFromError(error))
    }
  }, [documents, rememberRecentFile])

  const saveDocumentAs = useCallback(async () => {
    const document = activeDocument
    if (!document) return

    try {
      const selected = await save({
        filters: [{ name: 'Markdown', extensions: ['md'] }],
        defaultPath: document.path ?? document.title
      })

      if (!selected) return

      await invoke('write_text_file', { path: selected, contents: document.text })
      const info = await invoke<FileInfo>('get_file_info', { path: selected })

      setDocuments(current =>
        current.map(item =>
          item.id === document.id
            ? {
                ...item,
                title: titleFromPath(selected),
                path: selected,
                savedText: document.text,
                lastKnownFileInfo: info,
                externalChange: false,
                updatedAt: Date.now()
              }
            : item
        )
      )
      rememberRecentFile(selected)
      setStatus(`Saved ${selected}`)
    } catch (error) {
      setStatus(messageFromError(error))
    }
  }, [activeDocument, rememberRecentFile])

  const saveDocument = useCallback(async () => {
    const document = activeDocument
    if (!document) return

    if (!document.path) {
      await saveDocumentAs()
      return
    }

    try {
      await invoke('write_text_file', { path: document.path, contents: document.text })
      const info = await invoke<FileInfo>('get_file_info', { path: document.path })

      setDocuments(current =>
        current.map(item =>
          item.id === document.id
            ? {
                ...item,
                savedText: document.text,
                lastKnownFileInfo: info,
                externalChange: false,
                updatedAt: Date.now()
              }
            : item
        )
      )
      rememberRecentFile(document.path)
      setStatus(`Saved ${document.path}`)
    } catch (error) {
      setStatus(messageFromError(error))
    }
  }, [activeDocument, rememberRecentFile, saveDocumentAs])

  const copyMarkdown = useCallback(async () => {
    if (!activeDocument) return

    try {
      await writeText(activeDocument.text)
      setClipboardStatus('Markdown copied')
      setStatus('Markdown copied')
    } catch (error) {
      setClipboardStatus('Clipboard unavailable')
      setStatus(messageFromError(error))
    }
  }, [activeDocument])

  const checkClipboard = useCallback(async () => {
    try {
      const value = await readText()
      setClipboardStatus(value ? `${value.length} text characters` : 'Clipboard is empty')
      setStatus('Clipboard checked')
    } catch (error) {
      setClipboardStatus('Clipboard unavailable')
      setStatus(messageFromError(error))
    }
  }, [])

  const closeDocument = useCallback((id: string) => {
    setDocuments(current => {
      if (current.length === 1) {
        const replacement = createEditorDocument({ title: 'Untitled.md', text: '# Untitled\n\n' })
        setActiveId(replacement.id)
        setStatus('Started a new document')
        return [replacement]
      }

      const next = current.filter(document => document.id !== id)
      if (activeId === id) {
        setActiveId(next[Math.max(0, current.findIndex(document => document.id === id) - 1)]?.id ?? next[0]?.id ?? null)
      }
      setStatus('Closed document tab')
      return next
    })
  }, [activeId])

  const jumpToMatch = useCallback((match: SearchMatch, index: number) => {
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

  useEffect(() => {
    let unlisten: (() => void) | null = null

    void listen<string>('markforge://menu', event => {
      const id = event.payload

      if (id === 'file.new') createDocument()
      else if (id === 'file.open') void openDocument()
      else if (id === 'file.save') void saveDocument()
      else if (id === 'file.saveAs') void saveDocumentAs()
      else if (id === 'edit.copyMarkdown') void copyMarkdown()
      else if (id === 'view.print') window.print()
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
  }, [copyMarkdown, createDocument, openDocument, saveDocument, saveDocumentAs])

  useEffect(() => {
    if (!activeDocument?.path || !activeDocument.lastKnownFileInfo?.modifiedMs) return

    const interval = window.setInterval(async () => {
      try {
        const current = await invoke<FileInfo>('get_file_info', { path: activeDocument.path })

        if (!current.exists) {
          updateActiveDocument({ externalChange: true })
          setStatus('File is no longer available')
          return
        }

        if (current.modifiedMs && current.modifiedMs !== activeDocument.lastKnownFileInfo?.modifiedMs) {
          updateActiveDocument({ externalChange: true })
          setStatus('File changed on disk')
        }
      } catch (error) {
        setStatus(messageFromError(error))
      }
    }, 2500)

    return () => window.clearInterval(interval)
  }, [activeDocument?.path, activeDocument?.lastKnownFileInfo?.modifiedMs, updateActiveDocument])

  useEffect(() => {
    setSelectedMatch(0)
  }, [activeDocument?.id, searchQuery])

  useEffect(() => {
    const persisted: PersistedSession = {
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

    saveJson(sessionKey, persisted)
  }, [activeId, documents])

  useEffect(() => {
    saveJson(prefsKey, { theme, viewMode } satisfies PersistedPrefs)
  }, [theme, viewMode])

  const selectedSearchMatch = searchMatches[selectedMatch]

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
          <button type="button" onClick={() => window.print()} title="Print" aria-label="Print">
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

        <label className="searchBox">
          <Search size={16} aria-hidden="true" />
          <input
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            placeholder="Search source"
            aria-label="Search source"
          />
          {searchQuery && <span>{searchMatches.length}</span>}
        </label>

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
          <button
            key={document.id}
            type="button"
            className={`tabButton ${document.id === activeId ? 'active' : ''}`}
            onClick={() => setActiveId(document.id)}
            title={document.path ?? document.title}
          >
            <span className={isDirty(document) ? 'dirtyDot' : 'cleanDot'} aria-hidden="true" />
            <span>{document.title}</span>
            {document.externalChange && <TriangleAlert size={13} aria-label="Changed on disk" />}
            <X
              size={14}
              aria-label="Close tab"
              onClick={event => {
                event.stopPropagation()
                closeDocument(document.id)
              }}
            />
          </button>
        ))}
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
            onChange={event => updateActiveDocument({ text: event.target.value, externalChange: false })}
            aria-label="Markdown source"
          />
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
            {activeDocument?.externalChange && (
              <div className="changeNotice" role="status">
                <TriangleAlert size={16} />
                <span>Changed on disk</span>
                {activeDocument.path && (
                  <button type="button" onClick={() => void openDocument(activeDocument.path ?? undefined)}>
                    Reload
                  </button>
                )}
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
              <dd>{activeDirty ? 'Unsaved changes' : 'Saved'}</dd>
              <dt>Size</dt>
              <dd>{formatBytes(activeDocument?.lastKnownFileInfo?.len ?? activeDocument?.text.length ?? 0)}</dd>
              <dt>External</dt>
              <dd>{activeDocument?.externalChange ? 'Refresh pending' : activeDocument?.path ? 'Polling metadata' : 'Not tracked'}</dd>
              <dt>Clipboard</dt>
              <dd>{clipboardStatus}</dd>
            </dl>
          </section>

          <section>
            <div className="panelTitle">
              <Search size={16} />
              <h2>Search</h2>
            </div>
            {searchQuery ? (
              searchMatches.length > 0 ? (
                <ol className="matches">
                  {searchMatches.map((match, index) => (
                    <li key={`${match.line}-${match.column}-${match.text}`} className={index === selectedMatch ? 'selected' : ''}>
                      <button type="button" onClick={() => jumpToMatch(match, index)}>
                        <span>Line {match.line}</span>
                        <mark>{highlightSnippet(match.text, searchQuery)}</mark>
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
    </main>
  )
}

function restoreInitialState(): {
  activeId: string
  documents: EditorDocument[]
  recentFiles: string[]
  status: string
  theme: Theme
  viewMode: ViewMode
} {
  const prefs = readJson<PersistedPrefs>(prefsKey)
  const session = readJson<PersistedSession>(sessionKey)
  const recentFiles = readJson<string[]>(recentKey) ?? []
  const restoredDocuments = session?.docs
    ?.filter(document => typeof document.text === 'string')
    .map(document => createEditorDocument({
      ...document,
      lastKnownFileInfo: null,
      externalChange: false
    })) ?? []
  const documents = restoredDocuments.length > 0
    ? restoredDocuments
    : [createEditorDocument({ title: 'Welcome.md', text: starter, savedText: starter })]
  const activeId = documents.find(document => document.id === session?.activeId)?.id ?? documents[0].id

  return {
    activeId,
    documents,
    recentFiles,
    status: restoredDocuments.length > 0 ? 'Restored unsaved session' : 'Ready',
    theme: prefs?.theme === 'dark' ? 'dark' : 'light',
    viewMode: isViewMode(prefs?.viewMode) ? prefs.viewMode : 'split'
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
    externalChange: input.externalChange ?? false,
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

function findMatches(source: string, query: string): SearchMatch[] {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) return []

  let offset = 0

  return source.split(/\r?\n/).flatMap((line, index) => {
    const matches: SearchMatch[] = []
    let searchFrom = 0
    const lowerLine = line.toLowerCase()

    while (searchFrom <= lowerLine.length) {
      const column = lowerLine.indexOf(normalizedQuery, searchFrom)
      if (column === -1) break

      matches.push({
        line: index + 1,
        column: column + 1,
        text: line.trim() || '(blank line)',
        start: offset + column,
        end: offset + column + normalizedQuery.length
      })
      searchFrom = column + normalizedQuery.length
    }

    offset += line.length + 1
    return matches
  })
}

function frontMatterEntries(data: FrontMatterData | null | undefined): [string, string][] {
  if (!data || Array.isArray(data) || typeof data !== 'object') return []

  return Object.entries(data).map(([key, value]) => [key, String(value)])
}

function highlightSnippet(text: string, query: string): string {
  const trimmed = text || '(blank line)'
  const index = trimmed.toLowerCase().indexOf(query.trim().toLowerCase())

  if (index === -1) return trimmed

  const start = Math.max(0, index - 24)
  const end = Math.min(trimmed.length, index + query.length + 42)
  const prefix = start > 0 ? '...' : ''
  const suffix = end < trimmed.length ? '...' : ''

  return `${prefix}${trimmed.slice(start, end)}${suffix}`
}

function documentStats(source: string): { characters: number; lines: number; words: number } {
  const words = source.trim() ? source.trim().split(/\s+/).length : 0

  return {
    characters: source.length,
    lines: source ? source.split(/\r?\n/).length : 0,
    words
  }
}

function isDirty(document: EditorDocument): boolean {
  return document.text !== document.savedText
}

function titleFromPath(path: string): string {
  return path.split(/[\\/]/).pop() ?? path
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function messageFromError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Unexpected editor error'
}

function isViewMode(value: unknown): value is ViewMode {
  return value === 'source' || value === 'split' || value === 'preview'
}

function readJson<T>(key: string): T | null {
  try {
    const value = window.localStorage.getItem(key)
    return value ? JSON.parse(value) as T : null
  } catch {
    return null
  }
}

function saveJson<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Local storage is a convenience layer; the editor should keep running without it.
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
