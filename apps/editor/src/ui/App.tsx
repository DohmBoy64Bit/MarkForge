import { renderMarkdown } from '@markforge/markdown-engine'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { readText, writeText } from '@tauri-apps/plugin-clipboard-manager'
import { open, save } from '@tauri-apps/plugin-dialog'
import {
  ClipboardCheck,
  ClipboardCopy,
  FileDown,
  FileInput,
  FilePlus2,
  Printer,
  Save,
  ShieldCheck
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

type FileInfo = {
  exists: boolean
  modifiedMs: number | null
  len: number | null
}

const starter = `---
title: MarkForge Phase 2
draft: false
---

# MarkForge Phase 2

This is the Markdown engine hardening slice running inside the Windows-first desktop proof-of-concept.

- Open and save Markdown files.
- Render sanitized preview from the markdown engine package.
- Parse front matter metadata.
- Highlight fenced code blocks.
- Render inline math like $x^2$.
- Warn when a deferred diagram renderer is needed.
- Exercise clipboard read/write.
- Receive native menu events.
- Poll file metadata for external changes.

~~~ts
const phase: number = 2
~~~

\`\`\`mermaid
graph TD; A-->B;
\`\`\`

<script>alert('sanitization check')</script>
`

export function App() {
  const [documentText, setDocumentText] = useState(starter)
  const [filePath, setFilePath] = useState<string | null>(null)
  const [lastKnownFileInfo, setLastKnownFileInfo] = useState<FileInfo | null>(null)
  const [status, setStatus] = useState('Ready')
  const [clipboardStatus, setClipboardStatus] = useState('Not checked')
  const [externalChange, setExternalChange] = useState(false)
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)

  const rendered = useMemo(() => renderMarkdown(documentText), [documentText])

  useEffect(() => {
    return listen<string>('markforge://menu', event => {
      const id = event.payload
      if (id === 'file.new') newDocument()
      if (id === 'file.open') void openDocument()
      if (id === 'file.save') void saveDocument()
      if (id === 'file.saveAs') void saveDocumentAs()
      if (id === 'edit.copyMarkdown') void copyMarkdown()
      if (id === 'view.print') window.print()
    }) as unknown as () => void
  }, [documentText, filePath])

  useEffect(() => {
    if (!filePath || !lastKnownFileInfo?.modifiedMs) return

    const interval = window.setInterval(async () => {
      const current = await invoke<FileInfo>('get_file_info', { path: filePath })
      if (current.modifiedMs && current.modifiedMs !== lastKnownFileInfo.modifiedMs) {
        setExternalChange(true)
        setStatus('File changed on disk')
      }
    }, 2500)

    return () => window.clearInterval(interval)
  }, [filePath, lastKnownFileInfo])

  function newDocument() {
    setDocumentText('# Untitled\n\n')
    setFilePath(null)
    setLastKnownFileInfo(null)
    setExternalChange(false)
    setStatus('New document')
    textAreaRef.current?.focus()
  }

  async function openDocument() {
    const selected = await open({
      multiple: false,
      filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'mdown', 'txt'] }]
    })

    if (typeof selected !== 'string') return

    const contents = await invoke<string>('read_text_file', { path: selected })
    const info = await invoke<FileInfo>('get_file_info', { path: selected })

    setDocumentText(contents)
    setFilePath(selected)
    setLastKnownFileInfo(info)
    setExternalChange(false)
    setStatus(`Opened ${selected}`)
  }

  async function saveDocument() {
    if (!filePath) {
      await saveDocumentAs()
      return
    }

    await invoke('write_text_file', { path: filePath, contents: documentText })
    setLastKnownFileInfo(await invoke<FileInfo>('get_file_info', { path: filePath }))
    setExternalChange(false)
    setStatus(`Saved ${filePath}`)
  }

  async function saveDocumentAs() {
    const selected = await save({
      filters: [{ name: 'Markdown', extensions: ['md'] }],
      defaultPath: 'untitled.md'
    })

    if (!selected) return

    await invoke('write_text_file', { path: selected, contents: documentText })
    setFilePath(selected)
    setLastKnownFileInfo(await invoke<FileInfo>('get_file_info', { path: selected }))
    setExternalChange(false)
    setStatus(`Saved ${selected}`)
  }

  async function copyMarkdown() {
    await writeText(documentText)
    setClipboardStatus('Markdown copied')
  }

  async function checkClipboard() {
    const value = await readText()
    setClipboardStatus(value ? `Clipboard text length: ${value.length}` : 'Clipboard is empty')
  }

  return (
    <main className="shell">
      <section className="toolbar" aria-label="Document actions">
        <button type="button" onClick={newDocument} title="New document">
          <FilePlus2 size={18} />
        </button>
        <button type="button" onClick={() => void openDocument()} title="Open Markdown file">
          <FileInput size={18} />
        </button>
        <button type="button" onClick={() => void saveDocument()} title="Save">
          <Save size={18} />
        </button>
        <button type="button" onClick={() => void saveDocumentAs()} title="Save as">
          <FileDown size={18} />
        </button>
        <button type="button" onClick={() => void copyMarkdown()} title="Copy Markdown">
          <ClipboardCopy size={18} />
        </button>
        <button type="button" onClick={() => void checkClipboard()} title="Check clipboard">
          <ClipboardCheck size={18} />
        </button>
        <button type="button" onClick={() => window.print()} title="Print">
          <Printer size={18} />
        </button>
        <span className="security" title="Preview HTML is sanitized">
          <ShieldCheck size={16} />
          Sanitized preview
        </span>
      </section>

      <section className="workspace">
        <aside className="sidebar">
          <h1>MarkForge</h1>
          <dl>
            <dt>File</dt>
            <dd>{filePath ?? 'Untitled'}</dd>
            <dt>Front matter</dt>
            <dd>{rendered.frontMatter ? `${rendered.frontMatter.language}, lines ${rendered.frontMatter.startLine}-${rendered.frontMatter.endLine}` : 'None'}</dd>
            <dt>Render warnings</dt>
            <dd>{rendered.warnings.length}</dd>
            <dt>Status</dt>
            <dd>{status}</dd>
            <dt>Clipboard</dt>
            <dd>{clipboardStatus}</dd>
            <dt>External change</dt>
            <dd>{externalChange ? 'Detected' : 'Not detected'}</dd>
          </dl>
          <h2>Outline</h2>
          <ol className="toc">
            {rendered.headings.map(heading => (
              <li key={`${heading.id}-${heading.text}`} style={{ paddingLeft: `${(heading.level - 1) * 10}px` }}>
                {heading.text}
              </li>
            ))}
          </ol>
          {rendered.warnings.length > 0 && (
            <>
              <h2>Warnings</h2>
              <ol className="warnings">
                {rendered.warnings.map((warning, index) => (
                  <li key={`${warning.code}-${warning.line ?? index}`}>
                    {warning.line ? `Line ${warning.line}: ` : ''}
                    {warning.message}
                  </li>
                ))}
              </ol>
            </>
          )}
        </aside>

        <section className="editorPane" aria-label="Markdown editor">
          <textarea
            ref={textAreaRef}
            value={documentText}
            spellCheck
            onChange={event => {
              setDocumentText(event.target.value)
              setExternalChange(false)
            }}
          />
        </section>

        <section className="previewPane" aria-label="Markdown preview">
          <article dangerouslySetInnerHTML={{ __html: rendered.html }} />
        </section>
      </section>
    </main>
  )
}
