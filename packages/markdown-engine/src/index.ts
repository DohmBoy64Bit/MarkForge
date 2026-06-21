/// <reference path="./vendor.d.ts" />

import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'
import footnote from 'markdown-it-footnote'
import taskLists from 'markdown-it-task-lists'

export type RenderedMarkdown = {
  body: string
  frontMatter: MarkdownFrontMatter | null
  html: string
  headings: MarkdownHeading[]
}

export type RenderMarkdownOptions = {
  allowHtml?: boolean
}

export type MarkdownHeading = {
  id: string
  level: number
  text: string
}

export type MarkdownFrontMatter = {
  language: 'yaml' | 'toml' | 'json'
  raw: string
  startLine: number
  endLine: number
}

export type ParsedMarkdownDocument = {
  body: string
  frontMatter: MarkdownFrontMatter | null
}

export function renderMarkdown(source: string, options: RenderMarkdownOptions = {}): RenderedMarkdown {
  const parsed = parseFrontMatter(source)
  const markdown = createMarkdownIt(options)
  const rawHtml = markdown.render(parsed.body, { slugCounts: new Map<string, number>() })
  const html = DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target', 'rel', 'id', 'class', 'checked']
  })

  return {
    body: parsed.body,
    frontMatter: parsed.frontMatter,
    html,
    headings: extractHeadings(parsed.body)
  }
}

export function parseFrontMatter(source: string): ParsedMarkdownDocument {
  const normalized = source.replace(/^\uFEFF/, '')
  const lines = normalized.split(/\r?\n/)
  const first = lines[0]?.trim()
  const language = frontMatterLanguageForDelimiter(first)

  if (!language) {
    return { body: normalized, frontMatter: null }
  }

  const endIndex = lines.findIndex((line, index) => index > 0 && line.trim() === first)

  if (endIndex === -1) {
    return { body: normalized, frontMatter: null }
  }

  return {
    body: lines.slice(endIndex + 1).join('\n').replace(/^\n/, ''),
    frontMatter: {
      language,
      raw: lines.slice(1, endIndex).join('\n'),
      startLine: 1,
      endLine: endIndex + 1
    }
  }
}

export function extractHeadings(source: string): MarkdownHeading[] {
  const usedSlugs = new Map<string, number>()

  return source
    .split(/\r?\n/)
    .map(line => /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line))
    .filter((match): match is RegExpExecArray => match !== null)
    .map(match => {
      const text = match[2].trim()
      const id = uniqueSlug(text, usedSlugs)

      return {
        id,
        level: match[1].length,
        text
      }
    })
}

function createMarkdownIt(options: RenderMarkdownOptions): MarkdownIt {
  const markdown = new MarkdownIt({
    html: options.allowHtml ?? true,
    linkify: true,
    typographer: true
  })
    .use(footnote)
    .use(taskLists, { enabled: true, label: true })

  const defaultRenderToken = markdown.renderer.renderToken.bind(markdown.renderer)
  const defaultLinkOpen = markdown.renderer.rules.link_open ?? defaultRenderToken
  const defaultHeadingOpen = markdown.renderer.rules.heading_open ?? defaultRenderToken

  markdown.renderer.rules.link_open = (tokens, index, renderOptions, env, self) => {
    tokens[index].attrSet('target', '_blank')
    tokens[index].attrSet('rel', 'noreferrer noopener')
    return defaultLinkOpen(tokens, index, renderOptions, env, self)
  }

  markdown.renderer.rules.heading_open = (tokens, index, renderOptions, env, self) => {
    const nextToken = tokens[index + 1]
    const slugCounts = getSlugCounts(env)

    if (nextToken?.type === 'inline' && nextToken.content) {
      tokens[index].attrSet('id', uniqueSlug(nextToken.content, slugCounts))
    }

    return defaultHeadingOpen(tokens, index, renderOptions, env, self)
  }

  return markdown
}

function getSlugCounts(env: unknown): Map<string, number> {
  if (
    typeof env === 'object' &&
    env !== null &&
    'slugCounts' in env &&
    env.slugCounts instanceof Map
  ) {
    return env.slugCounts as Map<string, number>
  }

  return new Map<string, number>()
}

function frontMatterLanguageForDelimiter(delimiter: string | undefined): MarkdownFrontMatter['language'] | null {
  if (delimiter === '---') return 'yaml'
  if (delimiter === '+++') return 'toml'
  if (delimiter === ';;;') return 'json'
  return null
}

function uniqueSlug(value: string, usedSlugs: Map<string, number>): string {
  const base = `heading-${slugify(value) || 'section'}`
  const count = usedSlugs.get(base) ?? 0
  usedSlugs.set(base, count + 1)

  return count === 0 ? base : `${base}-${count + 1}`
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/<[^>]+>/g, '')
    .replace(/[`~!@#$%^&*()+=[\]{}\\|;:'",.<>/?]/g, '')
    .replace(/\s+/g, '-')
}
