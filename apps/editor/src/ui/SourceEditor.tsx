import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import {
  bracketMatching,
  defaultHighlightStyle,
  foldGutter,
  indentOnInput,
  syntaxHighlighting
} from '@codemirror/language'
import { EditorSelection, EditorState, Transaction, type Extension } from '@codemirror/state'
import {
  crosshairCursor,
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection,
  type ViewUpdate
} from '@codemirror/view'
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react'

export type SourceSelection = {
  end: number
  hasFocus: boolean
  start: number
}

export type SourceEditorHandle = {
  element: () => HTMLElement | null
  focus: () => void
  getScrollTop: () => number | undefined
  getSelection: () => { end: number; start: number } | null
  scrollToLine: (line: number) => void
  setSelection: (start: number, end: number, scrollTop?: number) => void
}

type SourceEditorProps = {
  onChange: (value: string) => void
  onFocusChange: (hasFocus: boolean) => void
  onKeyDown: (event: KeyboardEvent) => void
  onSelectionChange: (selection: SourceSelection) => void
  spellCheck?: boolean
  value: string
}

const sourceEditorTheme = EditorView.theme({
  '&': {
    height: '100%',
    minHeight: '0',
    color: 'var(--text)',
    backgroundColor: 'transparent',
    fontFamily: '"Cascadia Code", "SFMono-Regular", Consolas, monospace',
    fontSize: '15px'
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: 'inherit',
    lineHeight: '1.66'
  },
  '.cm-content': {
    minHeight: '100%',
    padding: '24px',
    caretColor: 'var(--accent-strong)'
  },
  '.cm-line': {
    padding: '0'
  },
  '.cm-gutters': {
    borderRight: '1px solid color-mix(in srgb, var(--panel-border), transparent 35%)',
    backgroundColor: 'color-mix(in srgb, var(--source), var(--panel) 24%)',
    color: 'var(--muted)'
  },
  '.cm-lineNumbers .cm-gutterElement': {
    minWidth: '38px',
    padding: '0 10px 0 8px',
    fontSize: '12px',
    fontWeight: '700'
  },
  '.cm-foldGutter .cm-gutterElement': {
    color: 'var(--faint)'
  },
  '.cm-activeLine': {
    backgroundColor: 'color-mix(in srgb, var(--accent-soft), transparent 62%)'
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'color-mix(in srgb, var(--accent-soft), transparent 42%)',
    color: 'var(--accent-strong)'
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: 'color-mix(in srgb, var(--accent), transparent 72%)'
  },
  '.cm-cursor': {
    borderLeftColor: 'var(--accent-strong)'
  },
  '&.cm-focused': {
    outline: '2px solid var(--accent)',
    outlineOffset: '-2px'
  },
  '.cm-tooltip': {
    border: '1px solid var(--panel-border)',
    borderRadius: '7px',
    backgroundColor: 'var(--panel)',
    color: 'var(--text)',
    boxShadow: '0 16px 34px rgba(14, 24, 32, 0.22)'
  }
})

export const SourceEditor = forwardRef<SourceEditorHandle, SourceEditorProps>(function SourceEditor(
  { onChange, onFocusChange, onKeyDown, onSelectionChange, spellCheck = true, value },
  ref
) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const viewRef = useRef<EditorView | null>(null)
  const valueRef = useRef(value)
  const isApplyingExternalValueRef = useRef(false)
  const pendingChangeRef = useRef<string | null>(null)
  const changeFrameRef = useRef<number | null>(null)
  const onChangeRef = useRef(onChange)
  const onFocusChangeRef = useRef(onFocusChange)
  const onKeyDownRef = useRef(onKeyDown)
  const onSelectionChangeRef = useRef(onSelectionChange)

  useEffect(() => {
    valueRef.current = value
  }, [value])

  useEffect(() => {
    onChangeRef.current = onChange
    onFocusChangeRef.current = onFocusChange
    onKeyDownRef.current = onKeyDown
    onSelectionChangeRef.current = onSelectionChange
  }, [onChange, onFocusChange, onKeyDown, onSelectionChange])

  const extensions = useMemo<Extension[]>(() => [
    lineNumbers(),
    foldGutter(),
    highlightSpecialChars(),
    history(),
    drawSelection(),
    dropCursor(),
    indentOnInput(),
    bracketMatching(),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
    markdown(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
    EditorView.lineWrapping,
    sourceEditorTheme,
    EditorView.domEventHandlers({
      blur: (_event, view) => {
        reportSelection(view, false, onSelectionChangeRef.current)
        onFocusChangeRef.current(false)
      },
      focus: (_event, view) => {
        reportSelection(view, true, onSelectionChangeRef.current)
        onFocusChangeRef.current(true)
      },
      keydown: event => {
        onKeyDownRef.current(event)
        return event.defaultPrevented
      }
    }),
    EditorView.updateListener.of((update: ViewUpdate) => {
      if (update.docChanged) {
        const nextValue = update.state.doc.toString()
        valueRef.current = nextValue
        if (!isApplyingExternalValueRef.current) scheduleOnChange(nextValue)
      }

      if (update.selectionSet || update.docChanged || update.focusChanged) {
        reportSelection(update.view, update.view.hasFocus, onSelectionChangeRef.current)
      }
    }),
    EditorView.contentAttributes.of({ spellcheck: String(spellCheck), 'aria-label': 'Markdown source' })
  ], [spellCheck])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const view = new EditorView({
      parent: host,
      state: EditorState.create({
        doc: valueRef.current,
        extensions
      })
    })

    viewRef.current = view
    reportSelection(view, view.hasFocus, onSelectionChangeRef.current)

    return () => {
      if (changeFrameRef.current !== null) {
        window.cancelAnimationFrame(changeFrameRef.current)
        changeFrameRef.current = null
      }
      view.destroy()
      viewRef.current = null
    }
  }, [extensions])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return

    const currentValue = view.state.doc.toString()
    if (currentValue === value) return

    const selection = view.state.selection.main
    const nextLength = value.length
    const anchor = Math.min(selection.anchor, nextLength)
    const head = Math.min(selection.head, nextLength)

    isApplyingExternalValueRef.current = true
    try {
      view.dispatch({
        changes: { from: 0, to: currentValue.length, insert: value },
        selection: EditorSelection.range(anchor, head),
        annotations: Transaction.addToHistory.of(false)
      })
    } finally {
      isApplyingExternalValueRef.current = false
    }
  }, [value])

  useImperativeHandle(ref, () => ({
    element: () => viewRef.current?.dom ?? hostRef.current,
    focus: () => viewRef.current?.focus(),
    getScrollTop: () => viewRef.current?.scrollDOM.scrollTop,
    getSelection: () => {
      const selection = viewRef.current?.state.selection.main
      if (!selection) return null

      return {
        start: selection.from,
        end: selection.to
      }
    },
    scrollToLine: (line: number) => {
      const view = viewRef.current
      if (!view) return

      const targetLine = view.state.doc.line(Math.max(1, Math.min(line, view.state.doc.lines)))
      view.dispatch({
        effects: EditorView.scrollIntoView(targetLine.from, { y: 'center' }),
        selection: EditorSelection.range(targetLine.from, targetLine.to)
      })
      view.focus()
    },
    setSelection: (start: number, end: number, scrollTop?: number) => {
      const view = viewRef.current
      if (!view) return

      const docLength = view.state.doc.length
      const selectionStart = Math.max(0, Math.min(start, docLength))
      const selectionEnd = Math.max(selectionStart, Math.min(end, docLength))

      view.focus()
      view.dispatch({
        selection: EditorSelection.range(selectionStart, selectionEnd),
        ...(typeof scrollTop === 'number'
          ? {}
          : { effects: EditorView.scrollIntoView(selectionEnd, { y: 'nearest' }) })
      })
      if (typeof scrollTop === 'number') view.scrollDOM.scrollTop = scrollTop
      reportSelection(view, true, onSelectionChangeRef.current)
    }
  }), [])

  return <div ref={hostRef} className="sourceEditor" />

  function scheduleOnChange(nextValue: string): void {
    pendingChangeRef.current = nextValue
    if (changeFrameRef.current !== null) return

    changeFrameRef.current = window.requestAnimationFrame(() => {
      changeFrameRef.current = null
      const pendingValue = pendingChangeRef.current
      pendingChangeRef.current = null

      if (pendingValue !== null) onChangeRef.current(pendingValue)
    })
  }
})

function reportSelection(
  view: EditorView,
  hasFocus: boolean,
  onSelectionChange: (selection: SourceSelection) => void
): void {
  const selection = view.state.selection.main

  onSelectionChange({
    start: selection.from,
    end: selection.to,
    hasFocus
  })
}
