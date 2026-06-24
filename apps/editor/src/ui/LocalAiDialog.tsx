import { labelForMarkdownInsertMode, type MarkdownInsertMode } from '@markforge/editor-engine'
import {
  defaultLocalLlmProviderProfiles,
  localLlmActions,
  restoreLocalLlmProviderProfiles,
  serializeLocalLlmProviderProfiles,
  type LocalLlmActionId,
  type LocalLlmProviderKind,
  type LocalLlmProviderProfile,
  type LlmPromptStreamChunk
} from '@markforge/llm'
import {
  AlertTriangle,
  BrainCircuit,
  ClipboardCopy,
  Cpu,
  FileText,
  Play,
  ShieldCheck,
  Square,
  TextCursorInput,
  X
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import {
  buildLocalAiPromptPreview,
  defaultEndpointForLocalAiProvider,
  editorLocalAiProviderKinds,
  labelForLocalAiProvider,
  type EditorLocalAiProviderKind
} from './localAiWorkflow'

export type LocalAiRunRequest = {
  actionId: LocalLlmActionId
  endpoint: string
  model: string
  onToken?: (chunk: LlmPromptStreamChunk) => void
  providerKind: EditorLocalAiProviderKind
  useSelection: boolean
}

export type LocalAiRunResult =
  | { ok: true; value: { provider: LocalLlmProviderKind; text: string } }
  | { error: { message: string }; ok: false }

type LocalAiDialogProps = {
  documentText: string
  isRunning: boolean
  onInsertResult: (text: string, mode: MarkdownInsertMode) => void
  onRequestClose: () => void
  onRun: (request: LocalAiRunRequest) => Promise<LocalAiRunResult>
  selectionLength: number
  selectionText: string
}

const insertModes: MarkdownInsertMode[] = ['replace-selection', 'insert-at-cursor', 'append-to-document']
const localAiProfileStorageKey = 'markforge.editor.localAiProfiles.v1'

export function LocalAiDialog({
  documentText,
  isRunning,
  onInsertResult,
  onRequestClose,
  onRun,
  selectionLength,
  selectionText
}: LocalAiDialogProps) {
  const [isEnabled, setIsEnabled] = useState(false)
  const [providerKind, setProviderKind] = useState<EditorLocalAiProviderKind>('ollama')
  const [endpoint, setEndpoint] = useState(defaultEndpointForLocalAiProvider('ollama'))
  const [model, setModel] = useState('')
  const [profiles, setProfiles] = useState<LocalLlmProviderProfile[]>(() => readLocalAiProfiles())
  const [selectedProfileId, setSelectedProfileId] = useState('ollama-default')
  const [actionId, setActionId] = useState<LocalLlmActionId>('summarize-document')
  const [useSelection, setUseSelection] = useState(selectionLength > 0)
  const [resultText, setResultText] = useState('')
  const [message, setMessage] = useState('Disabled until you enable a local provider.')
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const modelInputRef = useRef<HTMLInputElement | null>(null)

  const promptPreview = useMemo(
    () => buildLocalAiPromptPreview(actionId, documentText, selectionText, useSelection),
    [actionId, documentText, selectionText, useSelection]
  )
  const selectedAction = localLlmActions.find(action => action.id === actionId) ?? localLlmActions[0]
  const providerLabel = labelForLocalAiProvider(providerKind)
  const statusLabel = isRunning ? 'Running' : isEnabled ? `${providerLabel} enabled` : 'Disabled'
  const statusKind = isRunning ? 'running' : isEnabled ? 'active' : 'disabled'
  const canRun = isEnabled && !isRunning && model.trim().length > 0 && endpoint.trim().length > 0 && promptPreview.ok

  useEffect(() => {
    modelInputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (selectionLength === 0 && useSelection) setUseSelection(false)
  }, [selectionLength, useSelection])

  useEffect(() => {
    writeLocalAiProfiles(profiles)
  }, [profiles])

  const applyProfile = (profile: LocalLlmProviderProfile) => {
    setProviderKind(profile.kind)
    setEndpoint(profile.endpoint)
    setModel(profile.model)
    setSelectedProfileId(profile.id)
    setResultText('')
    setMessage(`${profile.label} selected. Enable the provider before running.`)
  }

  const handleProviderChange = (kind: EditorLocalAiProviderKind) => {
    setProviderKind(kind)
    setEndpoint(defaultEndpointForLocalAiProvider(kind))
    setSelectedProfileId(profiles.find(profile => profile.kind === kind)?.id ?? '')
    setResultText('')
    setMessage(`${labelForLocalAiProvider(kind)} selected. Enable the provider before running.`)
  }

  const saveProfile = () => {
    const normalizedEndpoint = endpoint.trim()
    const normalizedModel = model.trim()

    if (!normalizedEndpoint || !normalizedModel) {
      setMessage('Profiles need both an endpoint and model.')
      return
    }

    const existing = profiles.find(profile => profile.id === selectedProfileId)
    const id = existing && !isDefaultLocalAiProfile(existing.id)
      ? existing.id
      : `profile-${Date.now()}`
    const nextProfile: LocalLlmProviderProfile = {
      endpoint: normalizedEndpoint,
      id,
      kind: providerKind,
      label: `${labelForLocalAiProvider(providerKind)} ${normalizedModel}`,
      model: normalizedModel
    }

    setProfiles(current => {
      const withoutCurrent = current.filter(profile => profile.id !== id)
      return [nextProfile, ...withoutCurrent]
    })
    setSelectedProfileId(id)
    setMessage(`${nextProfile.label} profile saved.`)
  }

  const deleteProfile = () => {
    const profile = profiles.find(item => item.id === selectedProfileId)
    if (!profile || isDefaultLocalAiProfile(profile.id)) return

    setProfiles(current => current.filter(item => item.id !== profile.id))
    const fallback = profiles.find(item => item.id !== profile.id) ?? defaultLocalLlmProviderProfiles[0]
    applyProfile(fallback)
    setMessage(`${profile.label} profile removed.`)
  }

  const runLocalAi = async () => {
    if (!canRun) return

    setMessage(`Sending ${promptPreview.ok ? promptPreview.value.inputSource : 'document'} text to ${providerLabel} on this machine.`)
    setResultText('')
    let streamed = false

    const result = await onRun({
      actionId,
      endpoint,
      model,
      providerKind,
      useSelection,
      onToken: chunk => {
        streamed = true
        setResultText(current => `${current}${chunk.text}`)
      }
    })

    if (!result.ok) {
      setMessage(result.error.message)
      return
    }

    if (!streamed) setResultText(result.value.text)
    setMessage(`${providerLabel} returned local output.`)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void runLocalAi()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onRequestClose()
      return
    }

    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault()
      void runLocalAi()
    }
  }

  return (
    <div className="localAiBackdrop" onMouseDown={onRequestClose}>
      <form
        aria-label="Local AI workbench"
        aria-modal="true"
        className="localAiDialog"
        onKeyDown={handleKeyDown}
        onMouseDown={event => event.stopPropagation()}
        onSubmit={handleSubmit}
        role="dialog"
      >
        <header className="localAiHeader">
          <div>
            <BrainCircuit size={18} aria-hidden="true" />
            <div>
              <h2>Local AI</h2>
              <p>{selectedAction.description}</p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onRequestClose}
            title="Close Local AI"
            aria-label="Close Local AI"
          >
            <X size={16} />
          </button>
        </header>

        <section className="localAiBody">
          <div className="localAiStatusRow" data-status={statusKind}>
            <Cpu size={16} aria-hidden="true" />
            <strong>{statusLabel}</strong>
            <span>{message}</span>
          </div>

          <div className="localAiProviderGrid">
            <label className="localAiEnable">
              <input
                checked={isEnabled}
                onChange={event => {
                  setIsEnabled(event.target.checked)
                  setMessage(event.target.checked
                    ? 'Local provider enabled. Run still requires an explicit button press.'
                    : 'Disabled until you enable a local provider.')
                }}
                type="checkbox"
              />
              <span>Enable local provider</span>
            </label>

            <label className="localAiField">
              <span>Profile</span>
              <select
                value={selectedProfileId}
                onChange={event => {
                  const profile = profiles.find(item => item.id === event.target.value)
                  if (profile) applyProfile(profile)
                }}
              >
                {profiles.map(profile => (
                  <option key={profile.id} value={profile.id}>{profile.label}</option>
                ))}
              </select>
            </label>

            <label className="localAiField">
              <span>Provider</span>
              <select
                value={providerKind}
                onChange={event => handleProviderChange(event.target.value as EditorLocalAiProviderKind)}
              >
                {editorLocalAiProviderKinds.map(kind => (
                  <option key={kind} value={kind}>{labelForLocalAiProvider(kind)}</option>
                ))}
              </select>
            </label>

            <label className="localAiField">
              <span>Endpoint</span>
              <input
                value={endpoint}
                onChange={event => setEndpoint(event.target.value)}
                spellCheck={false}
              />
            </label>

            <label className="localAiField">
              <span>Model</span>
              <input
                ref={modelInputRef}
                value={model}
                onChange={event => setModel(event.target.value)}
                placeholder="local model name"
                spellCheck={false}
              />
            </label>

            <div className="localAiProfileActions" aria-label="Local AI profile actions">
              <button
                type="button"
                onClick={saveProfile}
                title="Save the current endpoint and model as a Local AI profile"
              >
                <ShieldCheck size={14} />
                <span>Save Profile</span>
              </button>
              <button
                type="button"
                disabled={isDefaultLocalAiProfile(selectedProfileId)}
                onClick={deleteProfile}
                title="Delete the selected custom Local AI profile"
              >
                <X size={14} />
                <span>Delete</span>
              </button>
            </div>
          </div>

          <div className="localAiControls">
            <div className="localAiModeGroup" aria-label="Local AI action">
              {localLlmActions.map(action => (
                <button
                  key={action.id}
                  type="button"
                  className={action.id === actionId ? 'active' : ''}
                  onClick={() => setActionId(action.id)}
                  title={action.description}
                  aria-label={action.description}
                >
                  <BrainCircuit size={15} />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>

            <div className="localAiModeGroup" aria-label="Prompt source">
              <button
                type="button"
                className={useSelection ? 'active' : ''}
                disabled={selectionLength === 0}
                onClick={() => setUseSelection(true)}
                title="Use selected Markdown"
                aria-label="Use selected Markdown"
              >
                <TextCursorInput size={15} />
                <span>Selection</span>
              </button>
              <button
                type="button"
                className={!useSelection ? 'active' : ''}
                onClick={() => setUseSelection(false)}
                title="Use active document"
                aria-label="Use active document"
              >
                <FileText size={15} />
                <span>Document</span>
              </button>
            </div>
          </div>

          <div className="localAiPrivacy">
            <ShieldCheck size={15} aria-hidden="true" />
            <span>Document text is sent only to the configured loopback provider after pressing Run. Cloud endpoints are rejected.</span>
          </div>

          <div className="localAiWorkGrid">
            <label className="localAiPrompt">
              <span>Prompt Preview</span>
              <textarea
                readOnly
                value={promptPreview.ok ? promptPreview.value.prompt : promptPreview.error.message}
                aria-invalid={!promptPreview.ok}
              />
            </label>

            <label className="localAiPrompt localAiResult">
              <span>Result Output</span>
              <textarea
                readOnly
                value={resultText || 'Run a local action to view output here.'}
              />
            </label>
          </div>
        </section>

        <footer className="localAiFooter">
          <span>
            {promptPreview.ok
              ? `${promptPreview.value.inputLength} ${promptPreview.value.inputSource} characters ready`
              : promptPreview.error.message}
          </span>
          {resultText && (
            <div className="localAiInsertGroup" aria-label="Insert Local AI result">
              {insertModes.map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onInsertResult(resultText, mode)}
                  title={`${labelForMarkdownInsertMode(mode)} Local AI result`}
                  aria-label={`${labelForMarkdownInsertMode(mode)} Local AI result`}
                >
                  <ClipboardCopy size={15} />
                  <span>{labelForMarkdownInsertMode(mode)}</span>
                </button>
              ))}
            </div>
          )}
          <button type="submit" disabled={!canRun}>
            {isRunning ? <Square size={15} /> : <Play size={15} />}
            <span>{isRunning ? 'Running' : 'Run'}</span>
          </button>
          {!isEnabled && (
            <AlertTriangle className="localAiFooterIcon" size={15} aria-hidden="true" />
          )}
        </footer>
      </form>
    </div>
  )
}

function isDefaultLocalAiProfile(id: string): boolean {
  return defaultLocalLlmProviderProfiles.some(profile => profile.id === id)
}

function readLocalAiProfiles(): LocalLlmProviderProfile[] {
  if (typeof window === 'undefined') return defaultLocalLlmProviderProfiles.slice()

  try {
    return restoreLocalLlmProviderProfiles(JSON.parse(window.localStorage.getItem(localAiProfileStorageKey) ?? 'null'))
  } catch {
    return defaultLocalLlmProviderProfiles.slice()
  }
}

function writeLocalAiProfiles(profiles: LocalLlmProviderProfile[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(localAiProfileStorageKey, serializeLocalLlmProviderProfiles(profiles))
}
