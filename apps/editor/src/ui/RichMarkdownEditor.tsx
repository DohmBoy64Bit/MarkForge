import { baseKeymap } from 'prosemirror-commands'
import { history, redo, undo } from 'prosemirror-history'
import { inputRules, smartQuotes, textblockTypeInputRule, wrappingInputRule } from 'prosemirror-inputrules'
import { defaultMarkdownParser, defaultMarkdownSerializer, schema } from 'prosemirror-markdown'
import type { Node as ProseMirrorNode } from 'prosemirror-model'
import { EditorState, Plugin } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { keymap } from 'prosemirror-keymap'
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react'

export type RichMarkdownSelection = {
  end: number
  start: number
}

export type RichMarkdownEditorHandle = {
  element: () => HTMLElement | null
  focus: () => void
  getMarkdownSelection: () => RichMarkdownSelection | null
}

type RichMarkdownEditorProps = {
  onChange: (value: string) => void
  onFocusChange: (hasFocus: boolean) => void
  onSelectionChange: (selection: RichMarkdownSelection & { hasFocus: boolean }) => void
  spellCheck?: boolean
  value: string
}

const markdownKeymap = keymap({
  'Mod-z': undo,
  'Mod-y': redo,
  'Shift-Mod-z': redo,
  ...baseKeymap
})

const markdownInputRules = inputRules({
  rules: [
    ...smartQuotes,
    wrappingInputRule(/^\s*>\s$/, schema.nodes.blockquote),
    wrappingInputRule(/^(\s*)([-+*])\s$/, schema.nodes.bullet_list),
    wrappingInputRule(/^(\s*)(\d+)\.\s$/, schema.nodes.ordered_list, match => ({ order: Number(match[2]) })),
    textblockTypeInputRule(/^```$/, schema.nodes.code_block),
    textblockTypeInputRule(/^(#{1,6})\s$/, schema.nodes.heading, match => ({ level: match[1].length }))
  ]
})

export const RichMarkdownEditor = forwardRef<RichMarkdownEditorHandle, RichMarkdownEditorProps>(
  function RichMarkdownEditor({ onChange, onFocusChange, onSelectionChange, spellCheck = true, value }, ref) {
    const hostRef = useRef<HTMLDivElement | null>(null)
    const viewRef = useRef<EditorView | null>(null)
    const valueRef = useRef(value)
    const onChangeRef = useRef(onChange)
    const onFocusChangeRef = useRef(onFocusChange)
    const onSelectionChangeRef = useRef(onSelectionChange)

    useEffect(() => {
      valueRef.current = value
    }, [value])

    useEffect(() => {
      onChangeRef.current = onChange
      onFocusChangeRef.current = onFocusChange
      onSelectionChangeRef.current = onSelectionChange
    }, [onChange, onFocusChange, onSelectionChange])

    const extensions = useMemo(() => [
      markdownKeymap,
      markdownInputRules,
      history(),
      new Plugin({
        props: {
          attributes: {
            'aria-label': 'Rich Markdown editor',
            class: 'richMarkdownProse',
            spellcheck: String(spellCheck)
          },
          handleDOMEvents: {
            blur: view => {
              reportSelection(view, false, onSelectionChangeRef.current)
              onFocusChangeRef.current(false)
              return false
            },
            focus: view => {
              reportSelection(view, true, onSelectionChangeRef.current)
              onFocusChangeRef.current(true)
              return false
            }
          }
        }
      })
    ], [spellCheck])

    useEffect(() => {
      const host = hostRef.current
      if (!host) return

      const view = new EditorView(host, {
        state: EditorState.create({
          doc: parseMarkdownDocument(valueRef.current),
          plugins: extensions
        }),
        dispatchTransaction(transaction) {
          const nextState = view.state.apply(transaction)
          view.updateState(nextState)

          if (transaction.selectionSet || transaction.docChanged) {
            reportSelection(view, view.hasFocus(), onSelectionChangeRef.current)
          }

          if (!transaction.docChanged) return

          const nextMarkdown = serializeMarkdownDocument(nextState.doc)
          valueRef.current = nextMarkdown
          onChangeRef.current(nextMarkdown)
        }
      })

      viewRef.current = view
      reportSelection(view, view.hasFocus(), onSelectionChangeRef.current)

      return () => {
        view.destroy()
        viewRef.current = null
      }
    }, [extensions])

    useEffect(() => {
      const view = viewRef.current
      if (!view) return

      const currentMarkdown = serializeMarkdownDocument(view.state.doc)
      if (currentMarkdown === value) return

      view.updateState(EditorState.create({
        doc: parseMarkdownDocument(value),
        plugins: extensions
      }))
      reportSelection(view, view.hasFocus(), onSelectionChangeRef.current)
    }, [extensions, value])

    useImperativeHandle(ref, () => ({
      element: () => viewRef.current?.dom ?? hostRef.current,
      focus: () => viewRef.current?.focus(),
      getMarkdownSelection: () => {
        const view = viewRef.current
        if (!view) return null

        const { from, to } = view.state.selection

        return {
          start: markdownOffsetBefore(view.state.doc, from),
          end: markdownOffsetBefore(view.state.doc, to)
        }
      }
    }), [])

    return <div ref={hostRef} className="richMarkdownEditor" />
  }
)

function parseMarkdownDocument(markdown: string): ProseMirrorNode {
  try {
    return defaultMarkdownParser.parse(markdown || '\n')
  } catch {
    return defaultMarkdownParser.parse('<!-- MarkForge could not parse this Markdown in rich mode. -->\n')
  }
}

function serializeMarkdownDocument(documentNode: ProseMirrorNode): string {
  return defaultMarkdownSerializer.serialize(documentNode).trimEnd() + '\n'
}

function markdownOffsetBefore(documentNode: ProseMirrorNode, position: number): number {
  const safePosition = Math.max(0, Math.min(position, documentNode.content.size))
  if (safePosition <= 0) return 0

  try {
    const partialDocument = schema.node('doc', null, documentNode.slice(0, safePosition).content)
    return defaultMarkdownSerializer.serialize(partialDocument).length
  } catch {
    return serializeMarkdownDocument(documentNode).length
  }
}

function reportSelection(
  view: EditorView,
  hasFocus: boolean,
  onSelectionChange: (selection: RichMarkdownSelection & { hasFocus: boolean }) => void
): void {
  const { from, to } = view.state.selection

  onSelectionChange({
    start: markdownOffsetBefore(view.state.doc, from),
    end: markdownOffsetBefore(view.state.doc, to),
    hasFocus
  })
}
