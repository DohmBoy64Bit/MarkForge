import { Save, Trash2, TriangleAlert, X } from 'lucide-react'
import { useEffect, useRef, type KeyboardEvent } from 'react'

type UnsavedChangesDialogProps = {
  documentPath: string | null
  documentTitle: string
  mode: 'close' | 'reload'
  onCancel: () => void
  onDiscard: () => void
  onSave: () => void
}

export function UnsavedChangesDialog({
  documentPath,
  documentTitle,
  mode,
  onCancel,
  onDiscard,
  onSave
}: UnsavedChangesDialogProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null)
  const heading = mode === 'reload' ? 'Replace local edits?' : 'Save changes?'
  const detail = mode === 'reload'
    ? 'Reloading from disk will replace unsaved text in this tab.'
    : 'This tab has unsaved text.'

  useEffect(() => {
    cancelButtonRef.current?.focus()
  }, [])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onCancel()
      return
    }

    if (event.key === 'Tab') {
      trapDialogTab(event, dialogRef.current)
    }
  }

  return (
    <div className="unsavedBackdrop" onMouseDown={onCancel}>
      <div
        ref={dialogRef}
        aria-labelledby="unsaved-dialog-title"
        aria-modal="true"
        className="unsavedDialog"
        onKeyDown={handleKeyDown}
        onMouseDown={event => event.stopPropagation()}
        role="dialog"
      >
        <header className="unsavedHeader">
          <div>
            <TriangleAlert size={18} aria-hidden="true" />
            <div>
              <h2 id="unsaved-dialog-title">{heading}</h2>
              <p>{documentTitle}</p>
            </div>
          </div>
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            title="Cancel"
            aria-label="Cancel"
          >
            <X size={16} />
          </button>
        </header>

        <div className="unsavedBody">
          <p>{detail}</p>
          {documentPath && <span title={documentPath}>{documentPath}</span>}
        </div>

        <footer className="unsavedActions">
          <button type="button" className="primary" onClick={onSave}>
            <Save size={15} aria-hidden="true" />
            <span>Save</span>
          </button>
          <button type="button" className="danger" onClick={onDiscard}>
            <Trash2 size={15} aria-hidden="true" />
            <span>Discard</span>
          </button>
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        </footer>
      </div>
    </div>
  )
}

function trapDialogTab(event: KeyboardEvent, dialog: HTMLElement | null): void {
  if (!dialog) return

  const focusable = Array.from(
    dialog.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])')
  ).filter(element => !element.hasAttribute('aria-hidden'))

  if (focusable.length === 0) return

  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  const active = document.activeElement

  if (event.shiftKey && active === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}
