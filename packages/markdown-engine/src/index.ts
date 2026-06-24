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
    | 'diagram-rendering-limited'
    | 'front-matter-json-parse-failed'
    | 'front-matter-structured-parse-limited'
    | 'renderer-failed'
    | 'unknown-code-language'
  line?: number
  message: string
  severity: 'info' | 'warning'
}

type MarkdownEnvironment = {
  slugCounts: Map<string, number>
  warnings: MarkdownRenderWarning[]
}

type MarkdownPlugin = (markdown: MarkdownIt, ...params: unknown[]) => void

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
  const warnings = [...parsed.warnings]
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
    .use(resolveMarkdownPlugin(footnote))
    .use(resolveMarkdownPlugin(taskLists), { enabled: true, label: true })

  if (options.enableMath ?? true) {
    markdown.use(resolveMarkdownPlugin(katexPlugin))
  }

  const defaultRenderToken = markdown.renderer.renderToken.bind(markdown.renderer)
  const defaultFence = markdown.renderer.rules.fence?.bind(markdown.renderer)
  const defaultLinkOpen = markdown.renderer.rules.link_open ?? defaultRenderToken
  const defaultHeadingOpen = markdown.renderer.rules.heading_open ?? defaultRenderToken

  markdown.renderer.rules.fence = (tokens, index, renderOptions, env, self) => {
    const token = tokens[index]
    const language = token.info.trim().split(/\s+/)[0]?.toLowerCase()

    if (language && diagramLanguages.has(language)) {
      return renderDiagramFence(language, token.content, warnings)
    }

    if (defaultFence) return defaultFence(tokens, index, renderOptions, env, self)
    return self.renderToken(tokens, index, renderOptions)
  }

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

function resolveMarkdownPlugin<T>(plugin: T): MarkdownPlugin {
  if (typeof plugin === 'function') {
    return plugin as MarkdownPlugin
  }

  if (
    typeof plugin === 'object' &&
    plugin !== null &&
    'default' in plugin &&
    typeof plugin.default === 'function'
  ) {
    return plugin.default as MarkdownPlugin
  }

  throw new TypeError('Invalid Markdown-it plugin')
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
      'd',
      'data-diagram-language',
      'fill',
      'height',
      'id',
      'marker-end',
      'mathvariant',
      'rel',
      'role',
      'rx',
      'stroke',
      'target',
      'text-anchor',
      'transform',
      'viewBox',
      'width',
      'x',
      'x1',
      'x2',
      'xmlns',
      'y',
      'y1',
      'y2'
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

function renderDiagramFence(language: string, source: string, warnings: MarkdownRenderWarning[]): string {
  if (language === 'mermaid') {
    const rendered = renderMermaidFlowchart(source)
    if (rendered) return rendered
  }

  if (language === 'plantuml') {
    const rendered = renderPlantUmlSequence(source)
    if (rendered) return rendered
  }

  if (language === 'vega' || language === 'vega-lite') {
    const rendered = renderJsonBarChart(language, source)
    if (rendered) return rendered
  }

  warnings.push({
    code: 'diagram-rendering-limited',
    message: `${language} diagram syntax is outside the built-in safe renderer and is shown as source.`,
    severity: 'info'
  })

  return [
    `<figure class="mf-diagram mf-diagram-source" data-diagram-language="${escapeHtml(language)}">`,
    '<figcaption>Diagram source</figcaption>',
    `<pre><code>${escapeHtml(source)}</code></pre>`,
    '</figure>'
  ].join('')
}

function renderPlantUmlSequence(source: string): string | null {
  const lines = source
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('@start') && !line.startsWith('@end') && !line.startsWith("'"))
  const messages = lines.map(line => /^([A-Za-z0-9_. -]+)\s*(-+>|--+>)\s*([A-Za-z0-9_. -]+)(?::\s*(.+))?$/.exec(line))

  if (messages.length === 0 || messages.some(match => !match)) return null

  const actors = Array.from(new Set(messages.flatMap(match => [match?.[1].trim() ?? '', match?.[3].trim() ?? '']).filter(Boolean)))
  if (actors.length < 2) return null

  const width = Math.max(360, actors.length * 160)
  const rowHeight = 58
  const height = 74 + messages.length * rowHeight
  const actorX = new Map(actors.map((actor, index) => [actor, 70 + index * ((width - 140) / Math.max(1, actors.length - 1))]))
  const actorNodes = actors.map(actor => {
    const x = actorX.get(actor) ?? 0
    return [
      `<g class="mf-diagram-node" transform="translate(${x - 48} 18)">`,
      '<rect width="96" height="34" rx="7"></rect>',
      `<text x="48" y="22" text-anchor="middle">${escapeHtml(actor)}</text>`,
      '</g>',
      `<line class="mf-diagram-lifeline" x1="${x}" y1="52" x2="${x}" y2="${height - 18}"></line>`
    ].join('')
  }).join('')
  const messageNodes = messages.map((match, index) => {
    const from = match?.[1].trim() ?? ''
    const to = match?.[3].trim() ?? ''
    const label = match?.[4]?.trim() ?? ''
    const fromX = actorX.get(from) ?? 0
    const toX = actorX.get(to) ?? 0
    const y = 86 + index * rowHeight
    const labelX = (fromX + toX) / 2
    const labelY = y - 8

    return [
      `<line class="mf-diagram-edge" x1="${fromX}" y1="${y}" x2="${toX}" y2="${y}" marker-end="url(#mf-arrow)"></line>`,
      label ? `<text class="mf-diagram-label" x="${labelX}" y="${labelY}" text-anchor="middle">${escapeHtml(label)}</text>` : ''
    ].join('')
  }).join('')

  return [
    '<figure class="mf-diagram mf-diagram-plantuml" data-diagram-language="plantuml">',
    '<figcaption>PlantUML sequence</figcaption>',
    `<svg role="img" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`,
    '<defs><marker id="mf-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z"></path></marker></defs>',
    actorNodes,
    messageNodes,
    '</svg>',
    '</figure>'
  ].join('')
}

function renderJsonBarChart(language: string, source: string): string | null {
  const spec = parseDiagramJson(source)
  if (!isRecord(spec)) return null

  const mark = typeof spec.mark === 'string'
    ? spec.mark
    : isRecord(spec.mark) && typeof spec.mark.type === 'string'
      ? spec.mark.type
      : null
  if (mark !== 'bar') return null

  const values = isRecord(spec.data) && Array.isArray(spec.data.values) ? spec.data.values : null
  const xField = fieldFromEncoding(spec.encoding, 'x')
  const yField = fieldFromEncoding(spec.encoding, 'y')
  if (!values || !xField || !yField) return null

  const rows = values
    .filter(isRecord)
    .map(row => ({
      label: String(row[xField] ?? ''),
      value: Number(row[yField] ?? 0)
    }))
    .filter(row => row.label && Number.isFinite(row.value))
  if (rows.length === 0) return null

  const width = 360
  const height = 220
  const padding = 34
  const plotWidth = width - padding * 2
  const plotHeight = height - padding * 2
  const max = Math.max(1, ...rows.map(row => row.value))
  const gap = 8
  const barWidth = Math.max(16, (plotWidth - gap * (rows.length - 1)) / rows.length)
  const bars = rows.map((row, index) => {
    const barHeight = (row.value / max) * plotHeight
    const x = padding + index * (barWidth + gap)
    const y = padding + plotHeight - barHeight

    return [
      `<rect class="mf-diagram-bar" x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="4"></rect>`,
      `<text class="mf-diagram-label" x="${x + barWidth / 2}" y="${height - 12}" text-anchor="middle">${escapeHtml(row.label)}</text>`,
      `<text class="mf-diagram-label" x="${x + barWidth / 2}" y="${Math.max(16, y - 6)}" text-anchor="middle">${escapeHtml(String(row.value))}</text>`
    ].join('')
  }).join('')

  return [
    `<figure class="mf-diagram mf-diagram-vega" data-diagram-language="${escapeHtml(language)}">`,
    `<figcaption>${language === 'vega-lite' ? 'Vega-Lite' : 'Vega'} bar chart</figcaption>`,
    `<svg role="img" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`,
    `<line class="mf-diagram-axis" x1="${padding}" y1="${padding + plotHeight}" x2="${width - padding}" y2="${padding + plotHeight}"></line>`,
    `<line class="mf-diagram-axis" x1="${padding}" y1="${padding}" x2="${padding}" y2="${padding + plotHeight}"></line>`,
    bars,
    '</svg>',
    '</figure>'
  ].join('')
}

function parseDiagramJson(source: string): unknown {
  try {
    return JSON.parse(source)
  } catch {
    return null
  }
}

function fieldFromEncoding(encoding: unknown, channel: 'x' | 'y'): string | null {
  if (!isRecord(encoding)) return null
  const definition = encoding[channel]
  if (!isRecord(definition) || typeof definition.field !== 'string') return null
  return definition.field
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function renderMermaidFlowchart(source: string): string | null {
  const lines = source
    .split(/\r?\n|;/)
    .map(line => line.trim())
    .filter(Boolean)
  const header = lines.shift()

  if (!header || !/^(graph|flowchart)\s+(TD|TB|BT|LR|RL)$/i.test(header)) {
    return null
  }

  const edges: Array<{ from: string; to: string }> = []
  const labels = new Map<string, string>()

  for (const line of lines) {
    const match = /^([A-Za-z0-9_-]+)(?:\["([^"]+)"\])?\s*-+>+\s*([A-Za-z0-9_-]+)(?:\["([^"]+)"\])?$/.exec(line)
    if (!match) continue

    const [, from, fromLabel, to, toLabel] = match
    edges.push({ from, to })
    labels.set(from, fromLabel ?? from)
    labels.set(to, toLabel ?? to)
  }

  if (edges.length === 0) return null

  const nodeIds = Array.from(new Set(edges.flatMap(edge => [edge.from, edge.to])))
  const nodeIndex = new Map(nodeIds.map((id, index) => [id, index]))
  const width = 320
  const rowHeight = 78
  const height = Math.max(96, nodeIds.length * rowHeight + 24)
  const nodeWidth = 180
  const nodeHeight = 42
  const x = (width - nodeWidth) / 2

  const nodeY = (id: string) => 18 + (nodeIndex.get(id) ?? 0) * rowHeight
  const nodes = nodeIds.map(id => {
    const y = nodeY(id)
    return [
      `<g class="mf-diagram-node" transform="translate(${x} ${y})">`,
      `<rect width="${nodeWidth}" height="${nodeHeight}" rx="7"></rect>`,
      `<text x="${nodeWidth / 2}" y="26" text-anchor="middle">${escapeHtml(labels.get(id) ?? id)}</text>`,
      '</g>'
    ].join('')
  }).join('')
  const connectors = edges.map(edge => {
    const fromY = nodeY(edge.from) + nodeHeight
    const toY = nodeY(edge.to)
    const center = width / 2
    return `<line class="mf-diagram-edge" x1="${center}" y1="${fromY}" x2="${center}" y2="${toY}" marker-end="url(#mf-arrow)"></line>`
  }).join('')

  return [
    '<figure class="mf-diagram mf-diagram-mermaid" data-diagram-language="mermaid">',
    '<figcaption>Mermaid flowchart</figcaption>',
    `<svg role="img" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`,
    '<defs><marker id="mf-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z"></path></marker></defs>',
    connectors,
    nodes,
    '</svg>',
    '</figure>'
  ].join('')
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
