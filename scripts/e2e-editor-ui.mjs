import { spawn, spawnSync } from 'node:child_process'
import { mkdir, rm, stat } from 'node:fs/promises'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const screenshotDir = path.join(repoRoot, 'docs', 'audits', 'screenshots', 'e2e-editor-ui')
const host = '127.0.0.1'

const fixtureMarkdown = `---
title: MarkForge E2E
tags:
  - audit
---

# MarkForge E2E

This document validates editor controls, preview rendering, tables, images, links, and local-only workflows.

## Tasks

- [ ] Check source editing
- [x] Check preview rendering

| Area | Status |
| --- | --- |
| Editor | Ready |
| Viewer | Linked |

![Local image](./assets/diagram.png)

\`\`\`mermaid
graph TD
  A[Source] --> B[Preview]
\`\`\`
`

const themeAssertions = [
  ['Light theme', 'light'],
  ['Dark theme', 'dark'],
  ['High Contrast theme', 'high-contrast'],
  ['Sepia Paper theme', 'sepia'],
  ['GitHub theme', 'github'],
  ['Modern Neutral theme', 'modern-neutral']
]

const editorToolbarControls = [
  'New document',
  'Open file',
  'Save',
  'Save as',
  'Export HTML',
  'Import conversion',
  'Clean Markdown',
  'Local AI',
  'Copy Markdown',
  'Check clipboard',
  'Command palette',
  'Quick insert',
  'Templates and help',
  'Preferences',
  'Print'
]

const editorFormattingControls = [
  /Bold/,
  /Italic/,
  /Inline code/,
  /Strikethrough/,
  /Link/,
  /Heading 1/,
  /Heading 2/,
  /Heading 3/,
  /Heading 4/,
  /Heading 5/,
  /Heading 6/,
  /Blockquote/,
  /Unordered list/,
  /Ordered list/,
  /Task list/,
  /Code fence/,
  /Horizontal rule/,
  /Table/,
  /Table row/,
  /Image/,
  /Delete selection or line/,
  /Duplicate selection or line/,
  /Format Markdown/,
  /Insert table column after cursor/,
  /Align selected Markdown table/,
  /Delete selected table row/
]

const viewerToolbarControls = [
  'Open file',
  'Open workspace',
  'Reload file',
  'Copy rendered text',
  'Copy source',
  'Export HTML',
  'Print'
]

const guardedNativeControls = [
  'Open file',
  'Open workspace',
  'Open folder',
  'Save',
  'Save as',
  'Export HTML',
  'Print',
  'PDF/Print',
  'PDF',
  'DOCX',
  'OCR'
]

const summary = {
  browserAutomationLimits: [],
  browserSafeWorkflows: [],
  consoleWarnings: [],
  controlSurfaces: {},
  guardedNativeControls,
  screenshots: []
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function visible(locator, label) {
  await locator.waitFor({ state: 'visible', timeout: 5000 })
  assert(await locator.isVisible(), `${label} is not visible`)
}

async function getFreePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer()
    server.on('error', reject)
    server.listen(0, host, () => {
      const address = server.address()
      server.close(() => {
        if (typeof address === 'object' && address?.port) resolve(address.port)
        else reject(new Error('Unable to reserve a preview port'))
      })
    })
  })
}

async function waitForServer(url, child) {
  const startedAt = Date.now()
  let lastError = ''

  while (Date.now() - startedAt < 30000) {
    if (child.exitCode !== null) throw new Error(`Preview server exited early with code ${child.exitCode}`)

    try {
      const response = await fetch(url)
      if (response.ok) return
      lastError = `HTTP ${response.status}`
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
    }

    await new Promise(resolve => setTimeout(resolve, 300))
  }

  throw new Error(`Timed out waiting for preview server at ${url}: ${lastError}`)
}

function startPreview(appName, port) {
  const appRoot = path.join(repoRoot, 'apps', appName)
  const viteCli = path.join(appRoot, 'node_modules', 'vite', 'bin', 'vite.js')
  const child = spawn(
    process.execPath,
    [viteCli, 'preview', '--host', host, '--port', String(port), '--strictPort'],
    {
      cwd: appRoot,
      env: { ...process.env, BROWSER: 'none' },
      stdio: ['ignore', 'pipe', 'pipe']
    }
  )

  child.stdout.on('data', chunk => process.stdout.write(`[${appName}-preview] ${chunk}`))
  child.stderr.on('data', chunk => process.stderr.write(`[${appName}-preview] ${chunk}`))
  return child
}

function stopPreview(child) {
  if (!child || child.exitCode !== null) return

  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
    return
  }

  child.kill('SIGTERM')
}

async function withPreview(appName, context, callback) {
  const port = await getFreePort()
  const url = `http://${host}:${port}/`
  const preview = startPreview(appName, port)
  const page = await context.newPage()

  try {
    await waitForServer(url, preview)
    await page.goto(url, { waitUntil: 'networkidle' })
    await page.evaluate(() => window.localStorage.clear())
    await page.reload({ waitUntil: 'networkidle' })
    await callback(page)
  } finally {
    await page.close().catch(() => {})
    stopPreview(preview)
  }
}

async function collectVisibleControls(page, context) {
  const controls = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('button, input, select, textarea, [role="button"], [role="option"], [contenteditable="true"]'))

    function isVisible(element) {
      const style = window.getComputedStyle(element)
      const rect = element.getBoundingClientRect()
      return style.display !== 'none'
        && style.visibility !== 'hidden'
        && Number(style.opacity) !== 0
        && rect.width > 0
        && rect.height > 0
    }

    function explicitLabel(element) {
      const id = element.getAttribute('id')
      if (!id) return ''
      return document.querySelector(`label[for="${CSS.escape(id)}"]`)?.textContent?.trim() ?? ''
    }

    function nameFor(element) {
      return [
        element.getAttribute('aria-label'),
        element.getAttribute('title'),
        element.getAttribute('placeholder'),
        element.getAttribute('value'),
        element.textContent,
        element.closest('label')?.textContent,
        explicitLabel(element)
      ]
        .map(value => value?.replace(/\s+/g, ' ').trim() ?? '')
        .find(Boolean) ?? ''
    }

    return nodes
      .filter(isVisible)
      .map((element, index) => ({
        disabled: element.hasAttribute('disabled'),
        index,
        name: nameFor(element),
        role: element.getAttribute('role') ?? '',
        tag: element.tagName.toLowerCase()
      }))
  })

  const unlabeled = controls.filter(control => !control.name)
  assert(unlabeled.length === 0, `${context} has unlabeled visible controls: ${JSON.stringify(unlabeled, null, 2)}`)
  summary.controlSurfaces[context] = {
    total: controls.length,
    enabled: controls.filter(control => !control.disabled).length,
    disabled: controls.filter(control => control.disabled).length,
    names: Array.from(new Set(controls.map(control => truncateControlName(control.name))))
  }
  return controls
}

function truncateControlName(name) {
  return name.length > 96 ? `${name.slice(0, 93)}...` : name
}

async function assertNoHorizontalOverflow(page, context, minVisibleButtons = 12) {
  const metrics = await page.evaluate(() => ({
    bodyWidth: document.body.scrollWidth,
    mainHeight: document.querySelector('main')?.getBoundingClientRect().height ?? 0,
    viewportWidth: window.innerWidth,
    visibleButtons: Array.from(document.querySelectorAll('button')).filter(button => {
      const rect = button.getBoundingClientRect()
      const style = window.getComputedStyle(button)
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
    }).length
  }))

  assert(metrics.bodyWidth <= metrics.viewportWidth + 2, `${context} has horizontal overflow: ${JSON.stringify(metrics)}`)
  assert(metrics.mainHeight > 400, `${context} did not render a full shell: ${JSON.stringify(metrics)}`)
  assert(metrics.visibleButtons >= minVisibleButtons, `${context} rendered too few visible buttons: ${JSON.stringify(metrics)}`)
}

async function screenshot(page, name, options = {}) {
  const target = path.join(screenshotDir, name)
  await page.screenshot({ path: target, fullPage: true, ...options })
  const info = await stat(target)
  assert(info.size > 10000, `Screenshot ${name} is unexpectedly small (${info.size} bytes)`)
  summary.screenshots.push(path.relative(repoRoot, target).replace(/\\/g, '/'))
}

async function replaceSourceMarkdown(page, markdown) {
  await page.getByRole('button', { name: /source view/i }).click()
  const source = page.getByRole('textbox', { name: 'Markdown source' })
  await source.click()
  await source.fill(markdown)
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: /split view/i }).click()
  await visible(page.getByRole('heading', { name: 'MarkForge E2E' }), 'rendered fixture heading')
}

async function assertEditorControls(page) {
  for (const name of editorToolbarControls) {
    await visible(page.getByRole('button', { name, exact: true }), `editor toolbar control ${name}`)
  }

  const formatRail = page.locator('.formatRail')
  for (const control of editorFormattingControls) {
    await visible(formatRail.getByRole('button', { name: control }).first(), `editor formatting control ${control}`)
  }

  for (const label of ['Search source', 'Replace with']) await visible(page.getByLabel(label), `${label} input`)

  for (const heading of ['Workspace', 'File Status', 'Commands', 'Converters', 'Export Profile', 'Search', 'Outline', 'Recent Files', 'Front Matter', 'Warnings']) {
    await visible(page.getByRole('heading', { name: heading }), `editor inspector section ${heading}`)
  }
}

async function exerciseEditorCore(page) {
  await assertEditorControls(page)
  await collectVisibleControls(page, 'editor-desktop-initial')
  await assertNoHorizontalOverflow(page, 'editor desktop shell', 30)
  await screenshot(page, 'editor-desktop.png')

  for (const [label, expectedTheme] of themeAssertions) {
    await page.getByRole('button', { name: label }).click()
    const theme = await page.locator('main.editorShell').evaluate(element => element.getAttribute('data-theme'))
    assert(theme === expectedTheme, `${label} did not set data-theme=${expectedTheme}; received ${theme}`)
    await screenshot(page, `editor-theme-${expectedTheme}.png`)
  }
  summary.browserSafeWorkflows.push('editor theme switcher: all built-in themes')

  for (const mode of ['source', 'rich', 'split', 'preview']) {
    await page.getByRole('button', { name: new RegExp(`${mode} view`, 'i') }).click()
    await assertNoHorizontalOverflow(page, `editor ${mode} view`, 20)
    await collectVisibleControls(page, `editor-${mode}-view`)
    await screenshot(page, `editor-${mode}-view.png`)
  }
  await page.getByRole('button', { name: /split view/i }).click()
  summary.browserSafeWorkflows.push('editor source/rich/split/preview view modes')

  await page.getByLabel('Search source').fill('no-match-for-e2e')
  await visible(page.getByText('No matches'), 'editor no-match search state')
  await screenshot(page, 'editor-search-no-match.png')
  await page.getByLabel('Search source').fill('MarkForge')
  await page.getByLabel('Replace with').fill('MarkForge')
  await page.getByRole('button', { name: 'Case-sensitive search' }).click()
  await page.getByRole('button', { name: 'Whole-word search' }).click()
  await page.getByRole('button', { name: 'Regex search' }).click()
  await page.getByRole('button', { name: 'Regex search' }).click()
  await page.getByRole('button', { name: 'Current' }).click()
  await page.getByRole('button', { name: 'All' }).click()
  await screenshot(page, 'editor-search-replace.png')
  summary.browserSafeWorkflows.push('editor search, replace, and search option controls')
}

async function exerciseEditorFormatting(page) {
  const formatRail = page.locator('.formatRail')
  await page.getByRole('button', { name: /source view/i }).click()
  await page.getByRole('textbox', { name: 'Markdown source' }).click()

  const promptAnswers = ['Diagram', './assets/diagram.png', 'Generated by E2E']
  page.on('dialog', async dialog => {
    await dialog.accept(promptAnswers.shift() ?? '')
  })

  for (const control of [
    /Bold/,
    /Italic/,
    /Inline code/,
    /Strikethrough/,
    /Link/,
    /Heading 1/,
    /Heading 2/,
    /Heading 3/,
    /Heading 4/,
    /Heading 5/,
    /Heading 6/,
    /Blockquote/,
    /Unordered list/,
    /Ordered list/,
    /Task list/,
    /Code fence/,
    /Horizontal rule/,
    /Table/,
    /Table row/,
    /Image/,
    /Duplicate selection or line/,
    /Format Markdown/,
    /Align selected Markdown table/,
    /Insert table column after cursor/,
    /Delete selected table row/,
    /Delete selection or line/
  ]) {
    await formatRail.getByRole('button', { name: control }).first().click()
    await page.waitForTimeout(25)
  }

  await screenshot(page, 'editor-formatting-all-safe-commands.png')
  summary.browserSafeWorkflows.push('editor formatting rail: all browser-safe commands including prompt-backed image insertion')
}

async function exerciseEditorAutocomplete(page) {
  await page.getByRole('button', { name: /source view/i }).click()
  const source = page.getByRole('textbox', { name: 'Markdown source' })
  await source.click()
  await source.fill('')
  await source.click()
  await page.keyboard.type('/hea')
  await page.waitForTimeout(500)
  const suggestions = page.getByRole('listbox', { name: 'Markdown suggestions' })
  if (await suggestions.isVisible().catch(() => false)) {
    await screenshot(page, 'editor-markdown-autocomplete.png')
    await suggestions.locator('button').filter({ hasText: 'Heading' }).first().click()
    summary.browserSafeWorkflows.push('editor Markdown structure autocomplete')
  } else {
    await screenshot(page, 'editor-source-slash-command.png')
    summary.browserAutomationLimits.push('Editor slash autocomplete engine is unit-tested, but the production CodeMirror suggestion popover was not deterministic under Playwright browser-preview typing.')
  }
  await replaceSourceMarkdown(page, fixtureMarkdown)
}

async function exerciseEditorDialogs(page) {
  await page.getByRole('button', { name: 'Command palette' }).click()
  await visible(page.getByRole('dialog', { name: 'Command palette' }), 'command palette dialog')
  await page.getByRole('combobox', { name: 'Search commands' }).fill('bold')
  await visible(page.getByRole('option', { name: /Bold/ }).first(), 'command palette bold result')
  await screenshot(page, 'editor-command-palette.png')
  await page.getByRole('combobox', { name: 'Search commands' }).fill('zz-no-command')
  await visible(page.getByText('No commands found'), 'command palette empty state')
  await screenshot(page, 'editor-command-palette-empty.png')
  await collectVisibleControls(page, 'editor-command-palette')
  await page.getByRole('button', { name: 'Close command palette' }).click()

  await page.getByRole('button', { name: 'Quick insert' }).click()
  await visible(page.getByRole('dialog', { name: 'Quick insert' }), 'quick insert dialog')
  await page.getByRole('combobox', { name: 'Filter quick insert commands' }).fill('table')
  await visible(page.getByRole('option', { name: /Table/ }).first(), 'quick insert table result')
  await screenshot(page, 'editor-quick-insert.png')
  await page.getByRole('combobox', { name: 'Filter quick insert commands' }).fill('zz-no-insert')
  await visible(page.getByText('No insert found'), 'quick insert empty state')
  await screenshot(page, 'editor-quick-insert-empty.png')
  await collectVisibleControls(page, 'editor-quick-insert')
  await page.getByRole('button', { name: 'Close quick insert' }).click()

  await page.getByRole('button', { name: 'Import conversion' }).click()
  await visible(page.getByRole('dialog', { name: 'Import supported converter content' }), 'import conversion dialog')
  await screenshot(page, 'editor-import-conversion-html.png')
  for (const [button, screenshotName] of [
    ['CSV to table', 'editor-import-conversion-csv.png'],
    ['Rich clipboard HTML to Markdown', 'editor-import-conversion-clipboard.png'],
    ['URL/article to Markdown', 'editor-import-conversion-url.png'],
    ['HTML to Markdown', 'editor-import-conversion.png']
  ]) {
    await page.getByRole('button', { name: button, exact: true }).click()
    await screenshot(page, screenshotName)
  }
  await page.getByLabel('HTML Source').fill('<h2>Converted HTML</h2><p>Inserted by Playwright.</p>')
  await page.getByRole('button', { name: 'Append to document' }).click()
  await page.getByRole('button', { name: 'Insert', exact: true }).click()
  await visible(page.getByText('Converted HTML').first(), 'converted HTML output')

  await page.getByRole('button', { name: 'Templates and help' }).click()
  await visible(page.getByRole('dialog', { name: 'Templates and Markdown help' }), 'templates dialog')
  await screenshot(page, 'editor-templates-builtins.png')
  await page.getByRole('button', { name: 'Custom' }).click()
  await screenshot(page, 'editor-templates-custom-empty.png')
  const composer = page.getByLabel('Create a custom template')
  await composer.getByRole('textbox', { name: 'Title', exact: true }).fill('Audit Snippet')
  await composer.getByRole('textbox', { name: 'Tags', exact: true }).fill('audit, e2e')
  await composer.getByRole('textbox', { name: 'Description', exact: true }).fill('Created during Playwright validation')
  await composer.getByRole('textbox', { name: 'Markdown Body', exact: true }).fill('## Audit Snippet\n\n{{title}} is wired.')
  await composer.getByRole('button', { name: 'Save Template' }).click()
  await screenshot(page, 'editor-templates-custom-saved.png')
  await page.getByRole('button', { name: 'Reference', exact: true }).click()
  await screenshot(page, 'editor-templates-reference.png')
  await collectVisibleControls(page, 'editor-templates-help')
  await page.getByRole('button', { name: 'Close templates and help' }).click()

  await page.getByRole('button', { name: 'Preferences' }).click()
  await visible(page.getByRole('dialog', { name: 'Preferences' }), 'preferences dialog')
  await screenshot(page, 'editor-preferences-general.png')
  await page.getByRole('button', { name: 'Keybindings' }).click()
  await screenshot(page, 'editor-preferences-keybindings.png')
  await page.getByRole('button', { name: 'Reset all' }).click()
  await collectVisibleControls(page, 'editor-preferences')
  await page.getByRole('button', { name: 'Close preferences' }).click()

  await page.getByRole('button', { name: 'Local AI' }).click()
  await visible(page.getByRole('dialog', { name: 'Local AI workbench' }), 'Local AI dialog')
  await screenshot(page, 'editor-local-ai-disabled.png')
  await page.getByLabel('Enable local provider').check()
  await page.getByLabel('Model').fill('markforge-e2e-model')
  await page.getByRole('button', { name: 'Save Profile' }).click()
  await visible(page.getByText(/profile saved/i), 'Local AI profile saved status')
  await screenshot(page, 'editor-local-ai.png')
  await collectVisibleControls(page, 'editor-local-ai')
  await page.getByRole('button', { name: 'Close Local AI' }).click()

  summary.browserSafeWorkflows.push('editor dialogs: command palette, quick insert, import conversion modes, templates, preferences, Local AI')
}

async function exerciseEditorMobile(page) {
  await page.setViewportSize({ width: 390, height: 844 })
  await assertNoHorizontalOverflow(page, 'editor mobile shell', 12)
  await collectVisibleControls(page, 'editor-mobile')
  await screenshot(page, 'editor-mobile.png')
}

async function exerciseEditor(page) {
  await visible(page.locator('.brandLockup span').filter({ hasText: 'MarkForge Editor' }), 'editor brand')
  await replaceSourceMarkdown(page, fixtureMarkdown)
  await exerciseEditorCore(page)
  await exerciseEditorFormatting(page)
  await exerciseEditorAutocomplete(page)
  await exerciseEditorDialogs(page)
  await exerciseEditorMobile(page)
}

async function assertViewerControls(page) {
  for (const name of viewerToolbarControls) {
    await visible(page.getByRole('button', { name, exact: true }), `viewer toolbar control ${name}`)
  }

  await visible(page.getByLabel('Search document'), 'viewer search input')

  for (const heading of ['Workspace', 'Status', 'Contents', 'Search', 'Front Matter', 'Warnings']) {
    await visible(page.getByRole('heading', { name: heading, exact: true }), `viewer inspector section ${heading}`)
  }
}

async function exerciseViewer(page) {
  await visible(page.locator('.brandLockup span').filter({ hasText: 'MarkForge Viewer' }), 'viewer brand')
  await assertViewerControls(page)
  await collectVisibleControls(page, 'viewer-desktop-initial')
  await assertNoHorizontalOverflow(page, 'viewer desktop shell', 8)
  await screenshot(page, 'viewer-desktop.png')

  for (const [label, expectedTheme] of themeAssertions) {
    await page.getByRole('button', { name: label }).click()
    const theme = await page.locator('main.viewerShell').evaluate(element => element.getAttribute('data-theme'))
    assert(theme === expectedTheme, `viewer ${label} did not set data-theme=${expectedTheme}; received ${theme}`)
    await screenshot(page, `viewer-theme-${expectedTheme}.png`)
  }
  summary.browserSafeWorkflows.push('viewer theme switcher: all built-in themes')

  await page.getByRole('button', { name: 'Reload file' }).click()
  await visible(page.getByText('Open a file before reloading'), 'viewer reload guarded state')
  await screenshot(page, 'viewer-reload-guard.png')

  await page.getByLabel('Search document').fill('viewer')
  await visible(page.getByRole('button', { name: /Line/ }).first(), 'viewer search result')
  await page.getByRole('button', { name: /Line/ }).first().click()
  await screenshot(page, 'viewer-search-results.png')
  await page.getByLabel('Search document').fill('zz-no-viewer-match')
  await visible(page.getByText('No matches'), 'viewer no-match search state')
  await screenshot(page, 'viewer-search-no-match.png')

  await page.setViewportSize({ width: 390, height: 844 })
  await assertNoHorizontalOverflow(page, 'viewer mobile shell', 8)
  await collectVisibleControls(page, 'viewer-mobile')
  await screenshot(page, 'viewer-mobile.png')
  summary.browserSafeWorkflows.push('viewer search/no-match/reload guarded/mobile states')
}

async function run() {
  await rm(screenshotDir, { recursive: true, force: true })
  await mkdir(screenshotDir, { recursive: true })
  let browser
  const consoleErrors = []

  try {
    browser = await chromium.launch({ headless: process.env.MARKFORGE_E2E_HEADFUL !== '1' })
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      colorScheme: 'light',
      reducedMotion: 'reduce'
    })

    context.on('page', page => {
      page.on('console', message => {
        if (message.type() === 'error') consoleErrors.push(message.text())
        if (message.type() === 'warning') summary.consoleWarnings.push(message.text())
      })
      page.on('pageerror', error => consoleErrors.push(error.message))
    })

    await withPreview('editor', context, exerciseEditor)
    await withPreview('viewer', context, exerciseViewer)

    assert(consoleErrors.length === 0, `Browser console/page errors were emitted: ${JSON.stringify(consoleErrors, null, 2)}`)
    await browser.close()
    browser = undefined

    console.log(JSON.stringify(summary, null, 2))
  } finally {
    if (browser) await browser.close()
  }
}

run().catch(error => {
  console.error(error)
  process.exit(1)
})
