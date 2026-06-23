import {
  applyTemplate,
  deriveTemplateVariables,
  filterTemplates,
  mergeTemplateVariables,
  templateCatalog,
  templateCategories,
  type MarkdownTemplate,
  type TemplateCategory,
  type TemplateVariables
} from '@markforge/editor-engine'
import {
  BookOpenText,
  CornerDownLeft,
  FileText,
  Plus,
  RotateCcw,
  Save,
  Search,
  SlidersHorizontal,
  Trash2,
  X
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import {
  deleteCustomTemplate,
  resetCustomTemplates,
  upsertCustomTemplate
} from './customTemplates'
import { displayShortcut, matchesShortcut } from './editorPreferences'

type TemplatesHelpDialogProps = {
  customTemplates: MarkdownTemplate[]
  onCustomTemplatesChange: (templates: MarkdownTemplate[]) => void
  onInsert: (template: MarkdownTemplate, body: string) => void
  onRequestClose: () => void
  shortcut: string
  variables: TemplateVariables
}

type TemplatesHelpTab = 'templates' | 'custom' | 'help'

type CustomTemplateDraft = {
  body: string
  category: TemplateCategory
  description: string
  tags: string
  title: string
}

const emptyCustomDraft: CustomTemplateDraft = {
  body: '# {{title}}\n\n',
  category: 'documentation',
  description: '',
  tags: '',
  title: ''
}

const helpSections = [
  {
    title: 'Headings',
    syntax: '# H1\n## H2\n### H3',
    note: 'Use one space after the marker.'
  },
  {
    title: 'Emphasis',
    syntax: '**bold**\n*italic*\n~~strike~~\n`inline code`',
    note: 'Combine inline styles only when it improves scanning.'
  },
  {
    title: 'Links',
    syntax: '[label](https://example.com)',
    note: 'Rendered links keep standard Markdown behavior.'
  },
  {
    title: 'Lists',
    syntax: '- Bullet\n1. Numbered\n- [ ] Task\n- [x] Done',
    note: 'Task lists render as checkboxes in preview.'
  },
  {
    title: 'Code Fences',
    syntax: '```ts\nconst ready = true\n```',
    note: 'Language hints enable syntax highlighting.'
  },
  {
    title: 'Tables',
    syntax: '| Name | Status |\n| --- | --- |\n| Draft | Open |',
    note: 'Keep table cells short for narrow screens.'
  },
  {
    title: 'Front Matter',
    syntax: '---\ntitle: Notes\ntags:\n  - draft\n---',
    note: 'YAML metadata is exposed in the inspector.'
  },
  {
    title: 'Math',
    syntax: 'Inline: $x^2$\n\n$$\na^2 + b^2 = c^2\n$$',
    note: 'KaTeX-backed rendering supports common notation.'
  },
  {
    title: 'Diagrams',
    syntax: '```mermaid\nflowchart LR\n  A --> B\n```',
    note: 'Mermaid blocks render through the Markdown engine.'
  },
  {
    title: 'Raw HTML',
    syntax: '<details>\n<summary>More</summary>\nContent\n</details>',
    note: 'HTML is sanitized before preview output.'
  }
]

export function TemplatesHelpDialog({
  customTemplates,
  onCustomTemplatesChange,
  onInsert,
  onRequestClose,
  shortcut,
  variables
}: TemplatesHelpDialogProps) {
  const [activeTab, setActiveTab] = useState<TemplatesHelpTab>('templates')
  const [category, setCategory] = useState<TemplateCategory | 'all'>('all')
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [templateVariableValues, setTemplateVariableValues] = useState<TemplateVariables>({})
  const [customDraft, setCustomDraft] = useState<CustomTemplateDraft>(emptyCustomDraft)
  const [customStatus, setCustomStatus] = useState('Local templates stay in this browser profile.')
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const activeSource = activeTab === 'custom' ? customTemplates : templateCatalog
  const filteredTemplates = useMemo(
    () => filterTemplates(activeSource, {
      category: category === 'all' ? undefined : category,
      query
    }),
    [activeSource, category, query]
  )
  const activeTemplate = filteredTemplates[activeIndex] ?? filteredTemplates[0] ?? null
  const activeVariableDefinitions = useMemo(
    () => activeTemplate ? deriveTemplateVariables(activeTemplate) : [],
    [activeTemplate]
  )
  const resolvedVariables = useMemo(
    () => activeTemplate ? mergeTemplateVariables(activeTemplate, { ...variables, ...templateVariableValues }) : {},
    [activeTemplate, templateVariableValues, variables]
  )
  const activePreview = activeTemplate ? applyTemplate(activeTemplate, resolvedVariables) : ''
  const missingRequiredVariables = activeVariableDefinitions.filter(definition =>
    definition.required && String(resolvedVariables[definition.name] ?? '').trim() === ''
  )

  useEffect(() => {
    if (activeTab === 'templates' || activeTab === 'custom') inputRef.current?.focus()
    else closeButtonRef.current?.focus()
  }, [activeTab])

  useEffect(() => {
    setActiveIndex(0)
  }, [activeTab, category, query])

  useEffect(() => {
    if (!activeTemplate) return

    document.getElementById(templateOptionId(activeTemplate.id))?.scrollIntoView({ block: 'nearest' })
    setTemplateVariableValues(mergeTemplateVariables(activeTemplate, variables))
  }, [activeTemplate, variables])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (matchesShortcut(shortcut, event.nativeEvent)) {
      event.preventDefault()
      onRequestClose()
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      onRequestClose()
      return
    }

    const isEditingField = isFormField(event.target) && event.target !== inputRef.current

    if (!isEditingField && (activeTab === 'templates' || activeTab === 'custom') && event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex(nextTemplateIndex(activeIndex, 1, filteredTemplates.length))
      return
    }

    if (!isEditingField && (activeTab === 'templates' || activeTab === 'custom') && event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex(nextTemplateIndex(activeIndex, -1, filteredTemplates.length))
      return
    }

    if (!isEditingField && (activeTab === 'templates' || activeTab === 'custom') && event.key === 'Enter') {
      event.preventDefault()
      if (activeTemplate && missingRequiredVariables.length === 0) onInsert(activeTemplate, activePreview)
      return
    }

    if (event.key === 'Tab') {
      trapDialogTab(event, dialogRef.current)
    }
  }

  const saveCustomDraft = () => {
    const result = upsertCustomTemplate(customDraft, customTemplates)

    if (result.template) {
      onCustomTemplatesChange(result.templates)
      setCustomDraft(emptyCustomDraft)
      setCustomStatus(`Saved ${result.template.title}`)
      setActiveTab('custom')
      setQuery('')
      setCategory('all')
      restoreDialogFocus()
      return
    }

    setCustomStatus(result.errors.join(' '))
    restoreDialogFocus()
  }

  const deleteActiveCustomTemplate = () => {
    if (!activeTemplate || activeTab !== 'custom') return

    const nextTemplates = deleteCustomTemplate(activeTemplate.id, customTemplates)
    onCustomTemplatesChange(nextTemplates)
    setCustomStatus(`Deleted ${activeTemplate.title}`)
    setActiveIndex(0)
    restoreDialogFocus()
  }

  const resetCustomEntries = () => {
    const nextTemplates = resetCustomTemplates()
    onCustomTemplatesChange(nextTemplates)
    setCustomStatus('Custom templates reset.')
    setActiveIndex(0)
    restoreDialogFocus()
  }

  const restoreDialogFocus = () => {
    window.requestAnimationFrame(() => {
      if (!dialogRef.current) return

      if (!dialogRef.current.contains(document.activeElement) || document.activeElement === document.body) {
        inputRef.current?.focus()
      }
    })
  }

  return (
    <div className="templatesHelpBackdrop" onMouseDown={onRequestClose}>
      <div
        ref={dialogRef}
        aria-label="Templates and Markdown help"
        aria-modal="true"
        className="templatesHelpDialog"
        onKeyDown={handleKeyDown}
        onMouseDown={event => event.stopPropagation()}
        role="dialog"
      >
        <header className="templatesHelpHeader">
          <div>
            <BookOpenText size={18} aria-hidden="true" />
            <div>
              <h2>Templates and Help</h2>
              <p>{displayShortcut(shortcut)}</p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onRequestClose}
            title="Close templates and help"
            aria-label="Close templates and help"
          >
            <X size={16} />
          </button>
        </header>

        <nav className="templatesHelpTabs" aria-label="Templates and help sections">
          <button
            type="button"
            className={activeTab === 'templates' ? 'active' : ''}
            onClick={() => setActiveTab('templates')}
          >
            <FileText size={15} />
            <span>Built-ins</span>
          </button>
          <button
            type="button"
            className={activeTab === 'custom' ? 'active' : ''}
            onClick={() => setActiveTab('custom')}
          >
            <Plus size={15} />
            <span>Custom</span>
          </button>
          <button
            type="button"
            className={activeTab === 'help' ? 'active' : ''}
            onClick={() => setActiveTab('help')}
          >
            <BookOpenText size={15} />
            <span>Reference</span>
          </button>
        </nav>

        {activeTab === 'templates' || activeTab === 'custom' ? (
          <section className={`templatesHelpBody templatesBody ${activeTab === 'custom' ? 'customTemplatesBody' : ''}`} aria-label="Template catalog">
            <div className="templateFilters">
              <label className="templateSearch">
                <Search size={15} aria-hidden="true" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder={activeTab === 'custom' ? 'Search custom templates' : 'Search templates'}
                  aria-label="Search templates"
                />
              </label>
              <label className="templateCategory">
                <span>Category</span>
                <select
                  value={category}
                  onChange={event => setCategory(event.target.value as TemplateCategory | 'all')}
                  aria-label="Filter templates by category"
                >
                  <option value="all">All</option>
                  {templateCategories.map(categoryName => (
                    <option key={categoryName} value={categoryName}>{categoryName}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="templatePicker">
              <div className="templateList" role="listbox" aria-label="Templates">
                {filteredTemplates.length > 0 ? (
                  filteredTemplates.map((template, index) => {
                    const isActive = template.id === activeTemplate?.id

                    return (
                      <button
                        key={template.id}
                        id={templateOptionId(template.id)}
                        type="button"
                        aria-selected={isActive}
                        className={isActive ? 'active' : ''}
                        onClick={() => setActiveIndex(index)}
                        onDoubleClick={() => onInsert(template, applyTemplate(template, resolvedVariables))}
                        onMouseEnter={() => setActiveIndex(index)}
                        role="option"
                      >
                        <span>{template.category}</span>
                        <strong>{template.title}</strong>
                        <small>{template.description}</small>
                      </button>
                    )
                  })
                ) : (
                  <div className="templateEmpty" role="status">
                    <strong>{activeTab === 'custom' ? 'No custom templates yet' : 'No templates found'}</strong>
                    <span>{activeTab === 'custom' ? 'Create one below, then insert it from here.' : 'Try README, meeting, GitHub, release, or docs.'}</span>
                  </div>
                )}
              </div>

              <aside className="templatePreview" aria-label="Template preview">
                {activeTemplate ? (
                  <>
                    <div>
                      <span>{activeTab === 'custom' ? 'local custom' : activeTemplate.category}</span>
                      <h3>{activeTemplate.title}</h3>
                      <p>{activeTemplate.description}</p>
                    </div>
                    <div className="templateVariableEditor" aria-label="Template variables">
                      <div className="templateVariableHeader">
                        <SlidersHorizontal size={14} aria-hidden="true" />
                        <strong>Variables</strong>
                        {missingRequiredVariables.length > 0 && <span>{missingRequiredVariables.length} required</span>}
                      </div>
                      {activeVariableDefinitions.length > 0 ? (
                        activeVariableDefinitions.map(definition => (
                          <label key={definition.name} className={definition.required ? 'required' : ''}>
                            <span>{definition.label}</span>
                            <input
                              value={String(resolvedVariables[definition.name] ?? '')}
                              onChange={event => setTemplateVariableValues(current => ({
                                ...current,
                                [definition.name]: event.target.value
                              }))}
                              placeholder={definition.defaultValue ?? definition.name}
                              aria-label={definition.label}
                            />
                            <small>{definition.description}</small>
                          </label>
                        ))
                      ) : (
                        <p>No placeholders in this template.</p>
                      )}
                    </div>
                    <pre>{activePreview}</pre>
                    <div className="templatePreviewFooter">
                      <span>{activeTemplate.tags.join(', ') || 'No tags'}</span>
                      {activeTab === 'custom' && (
                        <button type="button" className="danger" onClick={deleteActiveCustomTemplate}>
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onInsert(activeTemplate, activePreview)}
                        disabled={missingRequiredVariables.length > 0}
                      >
                        <CornerDownLeft size={14} />
                        <span>Insert</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="templateNoPreview">Select a template to preview it.</p>
                )}
              </aside>
            </div>

            {activeTab === 'custom' && (
              <form
                className="customTemplateComposer"
                onSubmit={event => {
                  event.preventDefault()
                  saveCustomDraft()
                }}
                aria-label="Create a custom template"
              >
                <div className="customTemplateComposerHeader">
                  <strong>Create Custom Template</strong>
                  <span>{customStatus}</span>
                </div>
                <label>
                  <span>Title</span>
                  <input
                    value={customDraft.title}
                    onChange={event => setCustomDraft(current => ({ ...current, title: event.target.value }))}
                    placeholder="Runbook"
                  />
                </label>
                <label>
                  <span>Category</span>
                  <select
                    value={customDraft.category}
                    onChange={event => setCustomDraft(current => ({ ...current, category: event.target.value as TemplateCategory }))}
                  >
                    {templateCategories.map(categoryName => (
                      <option key={categoryName} value={categoryName}>{categoryName}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Tags</span>
                  <input
                    value={customDraft.tags}
                    onChange={event => setCustomDraft(current => ({ ...current, tags: event.target.value }))}
                    placeholder="ops, weekly, release"
                  />
                </label>
                <label>
                  <span>Description</span>
                  <input
                    value={customDraft.description}
                    onChange={event => setCustomDraft(current => ({ ...current, description: event.target.value }))}
                    placeholder="Short note shown in search"
                  />
                </label>
                <label className="customTemplateBodyField">
                  <span>Markdown Body</span>
                  <textarea
                    value={customDraft.body}
                    onChange={event => setCustomDraft(current => ({ ...current, body: event.target.value }))}
                    placeholder="# {{title}}"
                  />
                </label>
                <div className="customTemplateActions">
                  <button type="button" onClick={resetCustomEntries} disabled={customTemplates.length === 0}>
                    <RotateCcw size={14} />
                    <span>Reset Local</span>
                  </button>
                  <button type="submit">
                    <Save size={14} />
                    <span>Save Template</span>
                  </button>
                </div>
              </form>
            )}
          </section>
        ) : (
          <section className="templatesHelpBody referenceBody" aria-label="Markdown reference">
            {helpSections.map(section => (
              <article key={section.title} className="referenceItem">
                <div>
                  <h3>{section.title}</h3>
                  <p>{section.note}</p>
                </div>
                <pre>{section.syntax}</pre>
              </article>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}

function templateOptionId(templateId: string): string {
  return `template-option-${templateId}`
}

function nextTemplateIndex(current: number, delta: number, count: number): number {
  if (count <= 0) return 0

  return (current + delta + count) % count
}

function trapDialogTab(event: KeyboardEvent, dialog: HTMLElement | null): void {
  if (!dialog) return

  const focusable = Array.from(
    dialog.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')
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

function isFormField(target: EventTarget | null): target is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  return target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement
}
