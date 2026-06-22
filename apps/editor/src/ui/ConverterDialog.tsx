import { ArrowDownToLine, Code2, FileCode, Table2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { labelForConverterInsertMode, type ConverterInsertMode } from './converterWorkflow'

export type ConverterImportMode = 'csv-to-markdown-table' | 'html-to-markdown'

export type ConverterImportRequest = {
  input: string
  insertMode: ConverterInsertMode
  mode: ConverterImportMode
}

type ConverterDialogProps = {
  activeSelectionLength: number
  isConverting: boolean
  onConvert: (request: ConverterImportRequest) => void
  onRequestClose: () => void
}

const converterModes: Array<{
  description: string
  id: ConverterImportMode
  label: string
}> = [
  {
    id: 'html-to-markdown',
    label: 'HTML',
    description: 'HTML to Markdown'
  },
  {
    id: 'csv-to-markdown-table',
    label: 'CSV',
    description: 'CSV to table'
  }
]

const insertModes: ConverterInsertMode[] = ['replace-selection', 'insert-at-cursor', 'append-to-document']

export function ConverterDialog({
  activeSelectionLength,
  isConverting,
  onConvert,
  onRequestClose
}: ConverterDialogProps) {
  const [mode, setMode] = useState<ConverterImportMode>('html-to-markdown')
  const [insertMode, setInsertMode] = useState<ConverterInsertMode>(
    activeSelectionLength > 0 ? 'replace-selection' : 'insert-at-cursor'
  )
  const [input, setInput] = useState('')
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const isReady = input.trim().length > 0 && !isConverting
  const activeMode = useMemo(
    () => converterModes.find(item => item.id === mode) ?? converterModes[0],
    [mode]
  )

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!isReady) return

    onConvert({ input, insertMode, mode })
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onRequestClose()
      return
    }

    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault()
      if (isReady) onConvert({ input, insertMode, mode })
    }
  }

  return (
    <div className="converterBackdrop" onMouseDown={onRequestClose}>
      <form
        aria-label="Import supported converter content"
        aria-modal="true"
        className="converterDialog"
        onKeyDown={handleKeyDown}
        onMouseDown={event => event.stopPropagation()}
        onSubmit={handleSubmit}
        role="dialog"
      >
        <header className="converterHeader">
          <div>
            <ArrowDownToLine size={18} aria-hidden="true" />
            <div>
              <h2>Import Conversion</h2>
              <p>{activeMode.description}</p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onRequestClose}
            title="Close import conversion"
            aria-label="Close import conversion"
          >
            <X size={16} />
          </button>
        </header>

        <section className="converterBody">
          <div className="converterControls">
            <div className="converterModeGroup" aria-label="Source format">
              {converterModes.map(item => (
                <button
                  key={item.id}
                  type="button"
                  className={item.id === mode ? 'active' : ''}
                  onClick={() => setMode(item.id)}
                  title={item.description}
                  aria-label={item.description}
                >
                  {item.id === 'html-to-markdown' ? <FileCode size={16} /> : <Table2 size={16} />}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            <div className="converterModeGroup" aria-label="Insert location">
              {insertModes.map(item => (
                <button
                  key={item}
                  type="button"
                  className={item === insertMode ? 'active' : ''}
                  onClick={() => setInsertMode(item)}
                  title={insertModeTitle(item)}
                  aria-label={insertModeTitle(item)}
                >
                  <Code2 size={16} />
                  <span>{labelForConverterInsertMode(item)}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="converterSource">
            <span>{mode === 'html-to-markdown' ? 'HTML Source' : 'CSV Source'}</span>
            <textarea
              ref={inputRef}
              value={input}
              onChange={event => setInput(event.target.value)}
              placeholder={mode === 'html-to-markdown' ? '<h1>Release notes</h1>' : 'Name,Status\nAlpha,Ready'}
              spellCheck={false}
            />
          </label>
        </section>

        <footer className="converterFooter">
          <span>{converterFooterLabel(insertMode, activeSelectionLength)}</span>
          <button type="submit" disabled={!isReady}>
            <ArrowDownToLine size={16} />
            <span>{isConverting ? 'Converting' : 'Insert'}</span>
          </button>
        </footer>
      </form>
    </div>
  )
}

function converterFooterLabel(mode: ConverterInsertMode, activeSelectionLength: number): string {
  if (mode === 'replace-selection') {
    return activeSelectionLength > 0 ? `${activeSelectionLength} selected characters` : 'No selected text'
  }

  if (mode === 'insert-at-cursor') return 'Uses the current cursor position'
  return 'Adds content to the end of the document'
}

function insertModeTitle(mode: ConverterInsertMode): string {
  if (mode === 'replace-selection') return 'Replace selected text'
  if (mode === 'insert-at-cursor') return 'Insert at cursor'
  return 'Append to document'
}
