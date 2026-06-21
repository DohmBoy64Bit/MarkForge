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
})

describe('parseFrontMatter', () => {
  it('extracts YAML front matter without rendering it as body content', () => {
    const parsed = parseFrontMatter('---\ntitle: Test\n---\n# Body')

    expect(parsed.frontMatter).toEqual({
      language: 'yaml',
      raw: 'title: Test',
      startLine: 1,
      endLine: 3
    })
    expect(parsed.body).toBe('# Body')

    const rendered = renderMarkdown('---\ntitle: Test\n---\n# Body')
    expect(rendered.html).not.toContain('title: Test')
    expect(rendered.html).toContain('<h1 id="heading-body">Body</h1>')
  })

  it('extracts TOML and JSON front matter conventions', () => {
    expect(parseFrontMatter('+++\ntitle = "Test"\n+++\n# Body').frontMatter?.language).toBe('toml')
    expect(parseFrontMatter(';;;\n{"title":"Test"}\n;;;\n# Body').frontMatter?.language).toBe('json')
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
})
