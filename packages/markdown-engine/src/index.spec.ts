import { describe, expect, it } from 'vitest'
import { extractHeadings, parseFrontMatter, renderMarkdown } from './index'

describe('renderMarkdown', () => {
  it('renders common markdown and assigns stable heading ids', () => {
    const rendered = renderMarkdown('# Title\n\n## Title\n\n**strong** and _emphasis_')

    expect(rendered.html).toContain('<h1 id="heading-title">Title</h1>')
    expect(rendered.html).toContain('<h2 id="heading-title-2">Title</h2>')
    expect(rendered.html).toContain('<strong>strong</strong>')
    expect(rendered.headings).toEqual([
      { id: 'heading-title', level: 1, text: 'Title' },
      { id: 'heading-title-2', level: 2, text: 'Title' }
    ])
    expect(rendered.warnings).toEqual([])
  })

  it('sanitizes raw HTML and dangerous links', () => {
    const rendered = renderMarkdown(
      '# Safe\n\n<script>alert("xss")</script>\n\n<a href="javascript:alert(1)" onclick="bad()">bad</a>'
    )

    expect(rendered.html).not.toContain('<script>')
    expect(rendered.html).not.toContain('javascript:')
    expect(rendered.html).not.toContain('onclick')
  })

  it('can disable raw HTML rendering before sanitization', () => {
    const rendered = renderMarkdown('<section>raw</section>', { allowHtml: false })

    expect(rendered.html).toContain('&lt;section&gt;raw&lt;/section&gt;')
  })

  it('renders GFM-style tables, task lists, and footnotes', () => {
    const rendered = renderMarkdown(
      [
        '| A | B |',
        '| - | - |',
        '| 1 | 2 |',
        '',
        '- [x] done',
        '- [ ] todo',
        '',
        'Footnote here.[^a]',
        '',
        '[^a]: detail'
      ].join('\n')
    )

    expect(rendered.html).toContain('<table>')
    expect(rendered.html).toContain('type="checkbox"')
    expect(rendered.html).toContain('checked')
    expect(rendered.html).toContain('footnote-ref')
    expect(rendered.html).toContain('detail')
  })

  it('adds safe attributes to generated links', () => {
    const rendered = renderMarkdown('[OpenAI](https://openai.com)')

    expect(rendered.html).toContain('target="_blank"')
    expect(rendered.html).toContain('rel="noreferrer noopener"')
  })

  it('highlights known fenced code languages', () => {
    const rendered = renderMarkdown('```ts\nconst value: number = 1\n```')

    expect(rendered.html).toContain('class="hljs"')
    expect(rendered.html).toContain('language-ts')
    expect(rendered.html).toContain('hljs-keyword')
  })

  it('warns about unknown fenced code languages', () => {
    const rendered = renderMarkdown('```madeuplang\nhello\n```')

    expect(rendered.warnings).toContainEqual({
      code: 'unknown-code-language',
      message: 'No syntax highlighter is registered for "madeuplang".',
      severity: 'info'
    })
  })

  it('can disable code highlighting', () => {
    const rendered = renderMarkdown('```ts\nconst value = 1\n```', { enableCodeHighlight: false })

    expect(rendered.html).not.toContain('class="hljs"')
    expect(rendered.html).toContain('<code class="language-ts">')
  })

  it('renders inline and block math through KaTeX', () => {
    const rendered = renderMarkdown('Inline $x^2$.\n\n$$\ny = mx + b\n$$')

    expect(rendered.html).toContain('katex')
    expect(rendered.html).toContain('math')
  })

  it('can leave math syntax as plain Markdown content when math is disabled', () => {
    const rendered = renderMarkdown('Inline $x^2$.', { enableMath: false })

    expect(rendered.html).not.toContain('katex')
    expect(rendered.html).toContain('$x^2$')
  })

  it('renders supported Mermaid flowchart fences as sanitized diagrams', () => {
    const rendered = renderMarkdown('```mermaid\ngraph TD; A-->B;\n```')

    expect(rendered.html).toContain('mf-diagram-mermaid')
    expect(rendered.html).toContain('<svg')
    expect(rendered.html).toContain('Mermaid flowchart')
    expect(rendered.warnings).toEqual([])
  })

  it('warns when diagram syntax is outside the built-in safe renderer', () => {
    const rendered = renderMarkdown('```plantuml\nAlice -> Bob\n```')

    expect(rendered.html).toContain('mf-diagram-source')
    expect(rendered.warnings).toContainEqual({
      code: 'diagram-rendering-limited',
      message: 'plantuml diagram syntax is outside the built-in safe renderer and is shown as source.',
      severity: 'info'
    })
  })
})

describe('parseFrontMatter', () => {
  it('extracts YAML front matter without rendering it as body content', () => {
    const parsed = parseFrontMatter('---\ntitle: Test\ndraft: false\ncount: 3\n---\n# Body')

    expect(parsed.frontMatter).toEqual({
      data: { title: 'Test', draft: false, count: 3 },
      language: 'yaml',
      raw: 'title: Test\ndraft: false\ncount: 3',
      startLine: 1,
      endLine: 5
    })
    expect(parsed.body).toBe('# Body')

    const rendered = renderMarkdown('---\ntitle: Test\n---\n# Body')
    expect(rendered.html).not.toContain('title: Test')
    expect(rendered.html).toContain('<h1 id="heading-body">Body</h1>')
  })

  it('extracts TOML and JSON front matter conventions', () => {
    expect(parseFrontMatter('+++\ntitle = "Test"\n+++\n# Body').frontMatter).toMatchObject({
      data: { title: 'Test' },
      language: 'toml'
    })
    expect(parseFrontMatter(';;;\n{"title":"Test"}\n;;;\n# Body').frontMatter).toMatchObject({
      data: { title: 'Test' },
      language: 'json'
    })
  })

  it('returns a warning for invalid JSON front matter', () => {
    const parsed = parseFrontMatter(';;;\n{"title":\n;;;\n# Body')

    expect(parsed.frontMatter?.data).toBeNull()
    expect(parsed.warnings).toContainEqual({
      code: 'front-matter-json-parse-failed',
      line: 2,
      message: 'JSON front matter could not be parsed.',
      severity: 'warning'
    })
  })

  it('leaves unmatched delimiters in the body', () => {
    const parsed = parseFrontMatter('---\ntitle: Missing close\n# Body')

    expect(parsed.frontMatter).toBeNull()
    expect(parsed.body).toContain('Missing close')
  })
})

describe('extractHeadings', () => {
  it('deduplicates heading slugs and ignores non-heading lines', () => {
    expect(extractHeadings('# A!\nparagraph\n### A!')).toEqual([
      { id: 'heading-a', level: 1, text: 'A!' },
      { id: 'heading-a-2', level: 3, text: 'A!' }
    ])
  })

  it('uses rendered link text for heading labels', () => {
    expect(extractHeadings('## [Docs](https://example.com)')).toEqual([
      { id: 'heading-docs', level: 2, text: 'Docs' }
    ])
  })
})
