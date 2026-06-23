import {
  createLocalLlmProvider,
  isLocalEndpoint,
  localLlmActions,
  renderPromptTemplate,
  type LocalLlmActionId,
  type LocalLlmProvider,
  type LocalLlmProviderKind
} from '@markforge/llm'
import { err, ok, type Result } from '@markforge/shared'

export type EditorLocalAiProviderKind = Exclude<LocalLlmProviderKind, 'mock'>
export type LocalAiInsertMode = 'append-to-document' | 'insert-at-cursor' | 'replace-selection'

export type LocalAiPromptPreview = {
  inputLength: number
  inputSource: 'document' | 'selection'
  prompt: string
}

export type LocalAiTextEdit = {
  selectionEnd: number
  selectionStart: number
  text: string
}

export const editorLocalAiProviderKinds: EditorLocalAiProviderKind[] = ['ollama', 'lm-studio', 'llama.cpp']

export function defaultEndpointForLocalAiProvider(kind: EditorLocalAiProviderKind): string {
  if (kind === 'ollama') return 'http://127.0.0.1:11434'
  if (kind === 'lm-studio') return 'http://127.0.0.1:1234/v1'
  return 'http://127.0.0.1:8080/v1'
}

export function labelForLocalAiProvider(kind: EditorLocalAiProviderKind): string {
  if (kind === 'ollama') return 'Ollama'
  if (kind === 'lm-studio') return 'LM Studio'
  return 'llama.cpp'
}

export function createEditorLocalAiProvider(
  kind: EditorLocalAiProviderKind,
  endpoint: string,
  model: string
): Result<LocalLlmProvider> {
  const normalizedEndpoint = endpoint.trim()
  const normalizedModel = model.trim()

  if (!normalizedEndpoint || !isLocalEndpoint(normalizedEndpoint)) {
    return err('validation-error', 'Use a loopback endpoint such as http://127.0.0.1:11434.')
  }

  if (!normalizedModel) {
    return err('validation-error', 'Choose a local model before running Local AI.')
  }

  return ok(createLocalLlmProvider(kind, {
    endpoint: normalizedEndpoint,
    model: normalizedModel
  }))
}

export function buildLocalAiPromptPreview(
  actionId: LocalLlmActionId,
  documentText: string,
  selectionText: string,
  useSelection: boolean
): Result<LocalAiPromptPreview> {
  const action = localLlmActions.find(item => item.id === actionId)
  if (!action) return err('validation-error', 'Unknown Local AI action.', { actionId })

  const selection = selectionText.trim()
  const document = documentText.trim()
  const content = useSelection && selection ? selection : document

  if (!content) {
    return err('invalid-input', 'Local AI needs document or selection text.')
  }

  const rendered = renderPromptTemplate(action.template, { content })
  if (!rendered.ok) return rendered

  return ok({
    inputLength: content.length,
    inputSource: useSelection && selection ? 'selection' : 'document',
    prompt: rendered.value
  })
}

export function applyLocalAiResult(
  source: string,
  resultText: string,
  selection: { end: number; start: number },
  mode: LocalAiInsertMode
): LocalAiTextEdit {
  const insertion = normalizeLocalAiResult(resultText)
  const range = clampSelection(source, selection)

  if (!insertion) {
    return {
      selectionStart: range.start,
      selectionEnd: range.end,
      text: source
    }
  }

  if (mode === 'append-to-document') {
    const separator = source ? appendSeparatorFor(source) : ''
    const selectionStart = source.length + separator.length

    return {
      selectionStart,
      selectionEnd: selectionStart + insertion.length,
      text: `${source}${separator}${insertion}`
    }
  }

  if (mode === 'replace-selection') {
    const before = source.slice(0, range.start)
    const after = source.slice(range.end)

    return {
      selectionStart: before.length,
      selectionEnd: before.length + insertion.length,
      text: `${before}${insertion}${after}`
    }
  }

  const start = range.start
  const end = range.start
  const before = source.slice(0, start)
  const after = source.slice(end)
  const prefix = before && !before.endsWith('\n') ? '\n\n' : ''
  const suffix = after && !after.startsWith('\n') ? '\n\n' : ''
  const selectionStart = before.length + prefix.length

  return {
    selectionStart,
    selectionEnd: selectionStart + insertion.length,
    text: `${before}${prefix}${insertion}${suffix}${after}`
  }
}

export function labelForLocalAiInsertMode(mode: LocalAiInsertMode): string {
  if (mode === 'replace-selection') return 'Replace'
  if (mode === 'insert-at-cursor') return 'Cursor'
  return 'Append'
}

function normalizeLocalAiResult(resultText: string): string {
  return resultText.replace(/\r\n?/g, '\n').trim()
}

function clampSelection(source: string, selection: { end: number; start: number }): { end: number; start: number } {
  const start = Math.max(0, Math.min(selection.start, source.length))
  const end = Math.max(start, Math.min(selection.end, source.length))

  return { start, end }
}

function appendSeparatorFor(source: string): string {
  if (source.endsWith('\n\n')) return ''
  if (source.endsWith('\n')) return '\n'
  return '\n\n'
}
