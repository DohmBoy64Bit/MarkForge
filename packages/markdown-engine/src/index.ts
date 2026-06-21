import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'

const markdown = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

export type RenderedMarkdown = {
  html: string
  headings: MarkdownHeading[]
}

export type MarkdownHeading = {
  id: string
  level: number
  text: string
}

export function renderMarkdown(source: string): RenderedMarkdown {
  const rawHtml = markdown.render(source)
  const html = DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target', 'rel']
  })

  return {
    html,
    headings: extractHeadings(source)
  }
}

export function extractHeadings(source: string): MarkdownHeading[] {
  return source
    .split(/\r?\n/)
    .map(line => /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line))
    .filter((match): match is RegExpExecArray => match !== null)
    .map(match => {
      const text = match[2].trim()

      return {
        id: slugify(text),
        level: match[1].length,
        text
      }
    })
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[`~!@#$%^&*()+=[\]{}\\|;:'",.<>/?]/g, '')
    .replace(/\s+/g, '-')
}
