/// <reference path="./vendor.d.ts" />

import katexPlugin from '@vscode/markdown-it-katex'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import markdownLanguage from 'highlight.js/lib/languages/markdown'
import python from 'highlight.js/lib/languages/python'
import rust from 'highlight.js/lib/languages/rust'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'
import MarkdownIt from 'markdown-it'
import footnote from 'markdown-it-footnote'
import taskLists from 'markdown-it-task-lists'

export type RenderedMarkdown = {
  body: string
  frontMatter: MarkdownFrontMatter | null
  html: string
  headings: MarkdownHeading[]
  warnings: MarkdownRenderWarning[]
}

export type RenderMarkdownOptions = {
  allowHtml?: boolean
  enableCodeHighlight?: boolean
  enableMath?: boolean
}

export type MarkdownHeading = {
  id: string
  level: number
  text: string
}

export type MarkdownFrontMatter = {
  data: FrontMatterData | null
  endLine: number
  language: 'yaml' | 'toml' | 'json'
  raw: string
  startLine: number
}

export type FrontMatterData = Record<string, FrontMatterScalar> | unknown[]

export type FrontMatterScalar = boolean | number | string | null

export type ParsedMarkdownDocument = {
  body: string
  frontMatter: MarkdownFrontMatter | null
  warnings: MarkdownRenderWarning[]
}

export type MarkdownRenderWarning = {
  code:
    | 'diagram-rendering-deferred'
    | 'front-matter-json-parse-failed'
    | 'front-matter-structured-parse-limited'
    | 'unknown-code-language'
  line?: number
  message: string
  severity: 'info' | 'warning'
}

type MarkdownEnvironment = {
  slugCounts: Map<string, number>
  warnings: MarkdownRenderWarning[]
}

const diagramLanguages = new Set(['mermaid', 'plantuml', 'vega', 'vega-lite'])

hljs.registerLanguage('bash', bash)
hljs.registerLanguage('css', css)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('json', json)
hljs.registerLanguage('markdown', markdownLanguage)
hljs.registerLanguage('md', markdownLanguage)
hljs.registerLanguage('python', python)
hljs.registerLanguage('py', python)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('rs', rust)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('yml', yaml)

export function renderMarkdown(source: string, options: RenderMarkdownOptions = {}): RenderedMarkdown {
  const parsed = parseFrontMatter(source)
  const warnings = [...parsed.warnings, ...detectDeferredDiagrams(parsed.body)]
  const markdown = createMarkdownIt(options, warnings)
  const rawHtml = markdown.render(parsed.body, {
    slugCounts: new Map<string, number>(),
    warnings
  } satisfies MarkdownEnvironment)
  const html = sanitizeHtml(rawHtml)

  return {
    body: parsed.body,
    frontMatter: parsed.frontMatter,
    html,
    headings: extractHeadings(parsed.body),
    warnings
  }
}

export function parseFrontMatter(source: string): ParsedMarkdownDocument {
  const normalized = source.replace(/^\uFEFF/, '')
  const lines = normalized.split(/\r?\n/)
  const first = lines[0]?.trim()
  const language = frontMatterLanguageForDelimiter(first)

  if (!language) {
    return { body: normalized, frontMatter: null, warnings: [] }
  }

  const endIndex = lines.findIndex((line, index) => index > 0 && line.trim() === first)

  if (endIndex === -1) {
    return { body: normalized, frontMatter: null, warnings: [] }
  }

  const raw = lines.slice(1, endIndex).join('\n')
  const parsed = parseFrontMatterData(language, raw)

  return {
    body: lines.slice(endIndex + 1).join('\n').replace(/^\n/, ''),
    frontMatter: {
      data: parsed.data,
      language,
      raw,
      startLine: 1,
      endLine: endIndex + 1
    },
    warnings: parsed.warnings
  }
}

export function extractHeadings(source: string): MarkdownHeading[] {
  const usedSlugs = new Map<string, number>()

  return source
    .split(/\r?\n/)
    .map(line => /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line))
    .filter((match): match is RegExpExecArray => match !== null)
    .map(match => {
      const text = stripInlineMarkdown(match[2].trim())
      const id = uniqueSlug(text, usedSlugs)

      return {
        id,
        level: match[1].length,
        text
      }
    })
}

function createMarkdownIt(options: RenderMarkdownOptions, warnings: MarkdownRenderWarning[]): MarkdownIt {
  const markdown = new MarkdownIt({
    highlight: createHighlightRenderer(options, warnings),
    html: options.allowHtml ?? true,
    linkify: true,
    typographer: true
  })
    .use(footnote)
    .use(taskLists, { enabled: true, label: true })

  if (options.enableMath ?? true) {
    markdown.use(katexPlugin)
  }

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
      tokens[index].attrSet('id', uniqueSlug(stripInlineMarkdown(nextToken.content), slugCounts))
    }

    return defaultHeadingOpen(tokens, index, renderOptions, env, self)
  }

  return markdown
}

function createHighlightRenderer(
  options: RenderMarkdownOptions,
  warnings: MarkdownRenderWarning[]
): (source: string, language: string) => string {
  return (source: string, language: string) => {
    if (options.enableCodeHighlight === false) {
      return ''
    }

    const normalizedLanguage = language.trim().toLowerCase()

    if (!normalizedLanguage) {
      return ''
    }

    if (diagramLanguages.has(normalizedLanguage)) {
      return ''
    }

    if (!hljs.getLanguage(normalizedLanguage)) {
      warnings.push({
        code: 'unknown-code-language',
        message: `No syntax highlighter is registered for "${normalizedLanguage}".`,
        severity: 'info'
      })
      return ''
    }

    const highlighted = hljs.highlight(source, {
      language: normalizedLanguage,
      ignoreIllegals: true
    }).value

    return `<pre class="hljs"><code class="language-${escapeHtml(normalizedLanguage)}">${highlighted}</code></pre>`
  }
}

function sanitizeHtml(rawHtml: string): string {
  return DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true, mathMl: true, svg: true },
    ADD_ATTR: [
      'aria-hidden',
      'checked',
      'class',
      'fill',
      'height',
      'id',
      'mathvariant',
      'rel',
      'stroke',
      'target',
      'viewBox',
      'width',
      'xmlns'
    ]
  })
}

function parseFrontMatterData(
  language: MarkdownFrontMatter['language'],
  raw: string
): { data: FrontMatterData | null; warnings: MarkdownRenderWarning[] } {
  if (!raw.trim()) {
    return { data: {}, warnings: [] }
  }

  if (language === 'json') {
    try {
      return { data: JSON.parse(raw) as FrontMatterData, warnings: [] }
    } catch {
      return {
        data: null,
        warnings: [
          {
            code: 'front-matter-json-parse-failed',
            line: 2,
            message: 'JSON front matter could not be parsed.',
            severity: 'warning'
          }
        ]
      }
    }
  }

  return parseKeyValueFrontMatter(language, raw)
}

function parseKeyValueFrontMatter(
  language: 'toml' | 'yaml',
  raw: string
): { data: FrontMatterData; warnings: MarkdownRenderWarning[] } {
  const data: Record<string, FrontMatterScalar> = {}
  const warnings: MarkdownRenderWarning[] = []

  raw.split(/\r?\n/).forEach((line, index) => {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      return
    }

    const separator = language === 'yaml' ? ':' : '='
    const separatorIndex = trimmed.indexOf(separator)

    if (separatorIndex === -1) {
      warnings.push({
        code: 'front-matter-structured-parse-limited',
        line: index + 2,
        message: `Front matter line ${index + 2} is preserved as raw text but was not parsed structurally.`,
        severity: 'info'
      })
      return
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed.slice(separatorIndex + 1).trim()

    if (!key) {
      return
    }

    data[key] = parseScalar(value)
  })

  return { data, warnings }
}

function detectDeferredDiagrams(source: string): MarkdownRenderWarning[] {
  const warnings: MarkdownRenderWarning[] = []
  const lines = source.split(/\r?\n/)

  lines.forEach((line, index) => {
    const match = /^```\s*([A-Za-z0-9_-]+)/.exec(line.trim())
    const language = match?.[1]?.toLowerCase()

    if (language && diagramLanguages.has(language)) {
      warnings.push({
        code: 'diagram-rendering-deferred',
        line: index + 1,
        message: `${language} diagrams are detected but rendered as fenced code until the diagram renderer is implemented.`,
        severity: 'info'
      })
    }
  })

  return warnings
}

function parseScalar(value: string): FrontMatterScalar {
  const unquoted = value.replace(/^["']|["']$/g, '')

  if (value === 'true') return true
  if (value === 'false') return false
  if (value === 'null') return null

  const number = Number(unquoted)
  if (unquoted && Number.isFinite(number)) {
    return number
  }

  return unquoted
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

function stripInlineMarkdown(value: string): string {
  return value
    .replace(/!\[([^\]]*)]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/[`*_~]/g, '')
    .trim()
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/<[^>]+>/g, '')
    .replace(/[`~!@#$%^&*()+=[\]{}\\|;:'",.<>/?]/g, '')
    .replace(/\s+/g, '-')
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
