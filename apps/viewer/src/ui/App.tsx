import {
  conversionWarningStatus,
  createBrowserPrintConverter,
  createHtmlConverter,
  defaultHtmlExportPath
} from '@markforge/converters'
import { renderMarkdown, type FrontMatterData, type RenderedMarkdown } from '@markforge/markdown-engine'
import { createPlatformServices, type FileInfo } from '@markforge/platform'
import { appVisibleThemes, getTheme, themeToAppCssVariables, type ThemeId } from '@markforge/theme-engine'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import { open, save } from '@tauri-apps/plugin-dialog'
import {
  Clipboard,
  Copy,
  BookOpenText,
  FileCode,
  FileInput,
  FileSearch,
  ListTree,
  Moon,
  Printer,
  RefreshCcw,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  TriangleAlert,
  type LucideIcon
} from 'lucide-react'
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

type SearchMatch = {
  line: number
  text: string
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
    readText: async () => '',
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
const htmlConverter = createHtmlConverter()

const sampleDocument = `---
title: Viewer foundation
phase: 3
status: draft
---

# MarkForge Viewer

Open a Markdown file to inspect sanitized output, front matter, warnings, and document structure.

## Render contract

This view uses the shared markdown engine package, so editor and viewer rendering stay aligned.

## Search target

Search runs against document text and lists matching source lines for this foundation slice.

\`\`\`mermaid
graph TD; File-->Engine-->Viewer;
\`\`\`
`

export function App() {
  const [documentText, setDocumentText] = useState(sampleDocument)
  const [filePath, setFilePath] = useState<string | null>(null)
  const [lastKnownFileInfo, setLastKnownFileInfo] = useState<FileInfo | null>(null)
  const [status, setStatus] = useState('Ready')
  const [lastLoadedAt, setLastLoadedAt] = useState<Date | null>(null)
  const [externalChange, setExternalChange] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [theme, setTheme] = useState<ThemeId>('light')
  const [selectedMatch, setSelectedMatch] = useState(0)
  const articleRef = useRef<HTMLElement | null>(null)
  const startupFileLoadedRef = useRef(false)

  const renderState = useMemo(() => safeRenderMarkdown(documentText), [documentText])
  const { rendered, renderError } = renderState
  const searchMatches = useMemo(
    () => findMatches(rendered.body || documentText, searchQuery),
    [documentText, rendered.body, searchQuery]
  )
  const fileName = filePath ? filePath.split(/[\\/]/).pop() ?? filePath : 'Sample document'
  const frontMatterRows = useMemo(() => frontMatterEntries(rendered.frontMatter?.data), [rendered.frontMatter])
  const activeTheme = useMemo(() => getTheme(theme), [theme])
  const themeVariables = useMemo(() => themeToAppCssVariables(activeTheme) as CSSProperties, [activeTheme])

  const openDocument = useCallback(async () => {
    try {
      const selected = await selectOpenPathFromPlatform()

      if (typeof selected !== 'string') return

      await loadDocument(selected, 'Opened')
    } catch (error) {
      setStatus(messageFromError(error))
    }
  }, [])

  const reloadDocument = useCallback(async () => {
    if (!filePath) {
      setStatus('Open a file before reloading')
      return
    }

    try {
      await loadDocument(filePath, 'Reloaded')
    } catch (error) {
      setStatus(messageFromError(error))
    }
  }, [filePath])

  const copySource = useCallback(async () => {
    try {
      await writeClipboardText(documentText)
      setStatus('Source copied')
    } catch (error) {
      setStatus(messageFromError(error))
    }
  }, [documentText])

  const copyRendered = useCallback(async () => {
    try {
      const text = articleRef.current?.innerText.trim() ?? ''
      await writeClipboardText(text)
      setStatus(text ? 'Rendered text copied' : 'Nothing to copy')
    } catch (error) {
      setStatus(messageFromError(error))
    }
  }, [])

  const exportHtml = useCallback(async () => {
    try {
      const result = await htmlConverter.convert({
        format: 'html',
        markdown: documentText,
        title: filePath ? titleWithoutExtension(fileName) : 'Sample document'
      })

      if (!result.ok) {
        setStatus(result.error.message)
        return
      }

      if (!result.value.html) {
        setStatus('HTML export produced no output')
        return
      }

      const selected = await selectSaveHtmlPathFromPlatform(defaultHtmlExportPath(filePath ?? fileName))

      if (!selected) {
        setStatus('HTML export canceled')
        return
      }

      await writeDocumentToPlatform(selected, result.value.html)
      setStatus(conversionWarningStatus(`Exported HTML to ${selected}`, result.value.warnings))
    } catch (error) {
      setStatus(messageFromError(error))
    }
  }, [documentText, fileName, filePath])

  const printDocument = useCallback(async () => {
    const result = await browserPrintConverter.convert({
      format: 'browser-print',
      markdown: documentText
    })

    setStatus(result.ok ? 'Print dialog opened' : result.error.message)
  }, [documentText])

  useEffect(() => {
    if (startupFileLoadedRef.current) return

    startupFileLoadedRef.current = true

    void invoke<string | null>('startup_file_path')
      .then(path => {
        if (path) void loadDocument(path, 'Opened')
      })
      .catch(error => {
        setStatus(`Startup file unavailable: ${messageFromError(error)}`)
      })
  }, [])

  useEffect(() => {
    let unlisten: (() => void) | null = null

    void listen<string>('markforge://viewer-menu', event => {
      const id = event.payload
      if (id === 'file.open') void openDocument()
      if (id === 'file.reload') void reloadDocument()
      if (id === 'file.exportHtml') void exportHtml()
      if (id === 'file.copySource') void copySource()
      if (id === 'file.copyRendered') void copyRendered()
      if (id === 'file.print') void printDocument()
    }).then(cleanup => {
      unlisten = cleanup
    }).catch(error => {
      setStatus(`Native menu unavailable: ${messageFromError(error)}`)
    })

    return () => {
      unlisten?.()
    }
  }, [copyRendered, copySource, exportHtml, openDocument, printDocument, reloadDocument])

  useEffect(() => {
    if (!filePath || !lastKnownFileInfo?.modifiedMs) return

    const watcher = platform.watchFile(
      { path: filePath, previousInfo: lastKnownFileInfo },
      event => {
        setExternalChange(true)
        setStatus(event.type === 'missing' ? 'File is no longer available' : 'File changed on disk')
      }
    )

    if (!watcher.ok) {
      setStatus(watcher.error.message)
      return
    }

    return () => watcher.value.dispose()
  }, [filePath, lastKnownFileInfo])

  useEffect(() => {
    setSelectedMatch(0)
  }, [searchQuery])

  async function loadDocument(path: string, verb: 'Opened' | 'Reloaded') {
    const { contents, info } = await readDocumentFromPlatform(path)

    setDocumentText(contents)
    setFilePath(path)
    setLastKnownFileInfo(info)
    setExternalChange(false)
    setLastLoadedAt(new Date())
    setStatus(`${verb} ${path}`)
  }

  const selectedSearchMatch = searchMatches[selectedMatch]

  return (
    <main className={`viewerShell ${activeTheme.mode}`} data-theme={theme} style={themeVariables}>
      <header className="commandRail" aria-label="Viewer commands">
        <div className="brandLockup">
          <FileSearch size={20} aria-hidden="true" />
          <div>
            <span>MarkForge Viewer</span>
            <strong>{fileName}</strong>
          </div>
        </div>

        <nav className="toolbar" aria-label="File actions">
          <button type="button" onClick={() => void openDocument()} title="Open file" aria-label="Open file">
            <FileInput size={18} />
          </button>
          <button type="button" onClick={() => void reloadDocument()} title="Reload file" aria-label="Reload file">
            <RefreshCcw size={18} />
          </button>
          <button type="button" onClick={() => void copyRendered()} title="Copy rendered text" aria-label="Copy rendered text">
            <Copy size={18} />
          </button>
          <button type="button" onClick={() => void copySource()} title="Copy source" aria-label="Copy source">
            <Clipboard size={18} />
          </button>
          <button type="button" onClick={() => void exportHtml()} title="Export HTML" aria-label="Export HTML">
            <FileCode size={18} />
          </button>
          <button type="button" onClick={() => void printDocument()} title="Print" aria-label="Print">
            <Printer size={18} />
          </button>
        </nav>

        <label className="searchBox">
          <Search size={16} aria-hidden="true" />
          <input
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            placeholder="Search document"
            aria-label="Search document"
          />
          {searchQuery && <span>{searchMatches.length}</span>}
        </label>

        <div className="themeSwitch" aria-label="Theme">
          {appVisibleThemes.map(option => {
            const Icon = iconForTheme(option.id)

            return (
              <button
                key={option.id}
                type="button"
                className={theme === option.id ? 'active' : ''}
                onClick={() => setTheme(option.id)}
                title={`${option.label} theme`}
                aria-label={`${option.label} theme`}
              >
                <Icon size={16} />
              </button>
            )
          })}
        </div>
      </header>

      <section className="viewerWorkspace">
        <section className="documentStage" aria-label="Rendered Markdown document">
          {renderError && (
            <div className="renderError" role="alert">
              <TriangleAlert size={16} />
              <span>Renderer recovered from an error: {renderError}</span>
            </div>
          )}
          {externalChange && (
            <div className="changeNotice" role="status">
              <TriangleAlert size={16} />
              <span>Changed on disk</span>
              <button type="button" onClick={() => void reloadDocument()}>
                Reload
              </button>
            </div>
          )}
          <article className="documentPage" ref={articleRef} dangerouslySetInnerHTML={{ __html: rendered.html }} />
        </section>

        <aside className="inspector" aria-label="Document inspector">
          <section>
            <div className="panelTitle">
              <ShieldCheck size={16} />
              <h2>Status</h2>
            </div>
            <dl className="metaList">
              <dt>File</dt>
              <dd>{filePath ?? 'Sample document'}</dd>
              <dt>Size</dt>
              <dd>{lastKnownFileInfo?.len !== null && lastKnownFileInfo?.len !== undefined ? formatBytes(lastKnownFileInfo.len) : 'Not loaded'}</dd>
              <dt>Loaded</dt>
              <dd>{lastLoadedAt ? lastLoadedAt.toLocaleTimeString() : 'Startup sample'}</dd>
              <dt>Watcher</dt>
              <dd>{filePath ? (externalChange ? 'Refresh pending' : 'Watching file') : 'Waiting for file'}</dd>
              <dt>Message</dt>
              <dd>{status}</dd>
            </dl>
          </section>

          <section>
            <div className="panelTitle">
              <ListTree size={16} />
              <h2>Contents</h2>
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
              <Search size={16} />
              <h2>Search</h2>
            </div>
            {searchQuery ? (
              searchMatches.length > 0 ? (
                <ol className="matches">
                  {searchMatches.map((match, index) => (
                    <li key={`${match.line}-${match.text}`} className={index === selectedMatch ? 'selected' : ''}>
                      <button type="button" onClick={() => setSelectedMatch(index)}>
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
              <Clipboard size={16} />
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
    </main>
  )
}

function findMatches(source: string, query: string): SearchMatch[] {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) return []

  return source
    .split(/\r?\n/)
    .map((line, index) => ({ line: index + 1, text: line.trim() }))
    .filter(match => match.text.toLowerCase().includes(normalizedQuery))
}

function frontMatterEntries(data: FrontMatterData | null | undefined): [string, string][] {
  if (!data || Array.isArray(data) || typeof data !== 'object') return []

  return Object.entries(data).map(([key, value]) => [key, String(value)])
}

function highlightSnippet(text: string, query: string): string {
  const trimmed = text || '(blank line)'
  const index = trimmed.toLowerCase().indexOf(query.trim().toLowerCase())

  if (index === -1) return trimmed

  const start = Math.max(0, index - 32)
  const end = Math.min(trimmed.length, index + query.length + 48)
  const prefix = start > 0 ? '...' : ''
  const suffix = end < trimmed.length ? '...' : ''

  return `${prefix}${trimmed.slice(start, end)}${suffix}`
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function titleWithoutExtension(title: string): string {
  return title.replace(/\.(md|markdown|mdown|txt)$/i, '') || title
}

function iconForTheme(theme: ThemeId): LucideIcon {
  if (theme === 'dark') return Moon
  if (theme === 'github') return FileCode
  if (theme === 'high-contrast') return ShieldCheck
  if (theme === 'modern-neutral') return Settings
  if (theme === 'sepia') return BookOpenText
  return Sun
}

function messageFromError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Unexpected viewer error'
}

async function selectOpenPathFromPlatform(): Promise<string | null> {
  const result = await platform.dialogs.openMarkdownFile()
  if (!result.ok) throw new Error(result.error.message)
  return result.value
}

async function selectSaveHtmlPathFromPlatform(defaultPath: string): Promise<string | null> {
  const result = await platform.dialogs.saveHtmlFile(defaultPath)
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

async function writeDocumentToPlatform(path: string, contents: string): Promise<void> {
  const written = await platform.filesystem.writeTextFile(path, contents)
  if (!written.ok) throw new Error(written.error.message)
}

async function writeClipboardText(value: string): Promise<void> {
  const result = await platform.clipboard.writeText(value)
  if (!result.ok) throw new Error(result.error.message)
}

function safeRenderMarkdown(source: string): { rendered: RenderedMarkdown; renderError: string | null } {
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
        html: `<h1>Render failed</h1><p>The viewer shell is still running. Check the warning panel for details.</p><pre>${escapeHtml(source)}</pre>`,
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
