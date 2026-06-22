import {
  applyTemplate,
  filterTemplates,
  templateCatalog,
  templateCategories,
  type MarkdownTemplate,
  type TemplateCategory,
  type TemplateVariables
} from '@markforge/templates'
import { BookOpenText, CornerDownLeft, FileText, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { displayShortcut, matchesShortcut } from './editorPreferences'

type TemplatesHelpDialogProps = {
  onInsert: (template: MarkdownTemplate, body: string) => void
  onRequestClose: () => void
  shortcut: string
  variables: TemplateVariables
}

type TemplatesHelpTab = 'templates' | 'help'

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
  onInsert,
  onRequestClose,
  shortcut,
  variables
}: TemplatesHelpDialogProps) {
  const [activeTab, setActiveTab] = useState<TemplatesHelpTab>('templates')
  const [category, setCategory] = useState<TemplateCategory | 'all'>('all')
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const filteredTemplates = useMemo(
    () => filterTemplates(templateCatalog, {
      category: category === 'all' ? undefined : category,
      query
    }),
    [category, query]
  )
  const activeTemplate = filteredTemplates[activeIndex] ?? filteredTemplates[0] ?? null
  const activePreview = activeTemplate ? applyTemplate(activeTemplate, variables) : ''

  useEffect(() => {
    if (activeTab === 'templates') inputRef.current?.focus()
    else closeButtonRef.current?.focus()
  }, [activeTab])

  useEffect(() => {
    setActiveIndex(0)
  }, [category, query])

  useEffect(() => {
    if (!activeTemplate) return

    document.getElementById(templateOptionId(activeTemplate.id))?.scrollIntoView({ block: 'nearest' })
  }, [activeTemplate])

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

    if (activeTab === 'templates' && event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex(nextTemplateIndex(activeIndex, 1, filteredTemplates.length))
      return
    }

    if (activeTab === 'templates' && event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex(nextTemplateIndex(activeIndex, -1, filteredTemplates.length))
      return
    }

    if (activeTab === 'templates' && event.key === 'Enter') {
      event.preventDefault()
      if (activeTemplate) onInsert(activeTemplate, activePreview)
      return
    }

    if (event.key === 'Tab') {
      trapDialogTab(event, dialogRef.current)
    }
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
            <span>Templates</span>
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

        {activeTab === 'templates' ? (
          <section className="templatesHelpBody templatesBody" aria-label="Template catalog">
            <div className="templateFilters">
              <label className="templateSearch">
                <Search size={15} aria-hidden="true" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="Search templates"
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
                        onDoubleClick={() => onInsert(template, applyTemplate(template, variables))}
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
                    <strong>No templates found</strong>
                    <span>Try README, meeting, GitHub, release, or docs.</span>
                  </div>
                )}
              </div>

              <aside className="templatePreview" aria-label="Template preview">
                {activeTemplate ? (
                  <>
                    <div>
                      <span>{activeTemplate.category}</span>
                      <h3>{activeTemplate.title}</h3>
                      <p>{activeTemplate.description}</p>
                    </div>
                    <pre>{activePreview}</pre>
                    <div className="templatePreviewFooter">
                      <span>{activeTemplate.tags.join(', ')}</span>
                      <button type="button" onClick={() => onInsert(activeTemplate, activePreview)}>
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
    dialog.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])')
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
