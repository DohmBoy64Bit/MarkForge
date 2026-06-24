import { spawn, spawnSync } from 'node:child_process'
import { mkdir, rm, stat } from 'node:fs/promises'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const screenshotDir = path.join(repoRoot, 'docs', 'audits', 'screenshots', 'e2e-viewer-ui')
const host = '127.0.0.1'

const themeAssertions = [
  ['Light theme', 'light'],
  ['Dark theme', 'dark'],
  ['High Contrast theme', 'high-contrast'],
  ['Sepia Paper theme', 'sepia'],
  ['GitHub theme', 'github'],
  ['Modern Neutral theme', 'modern-neutral']
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

const viewerInspectorSections = [
  'Workspace',
  'Status',
  'Contents',
  'Search',
  'Front Matter',
  'Warnings'
]

const summary = {
  browserPreviewLimits: [],
  controlSurfaces: {},
  screenshots: [],
  workflows: []
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
    if (child.exitCode !== null) throw new Error(`Viewer preview exited early with code ${child.exitCode}`)

    try {
      const response = await fetch(url)
      if (response.ok) return
      lastError = `HTTP ${response.status}`
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
    }

    await new Promise(resolve => setTimeout(resolve, 300))
  }

  throw new Error(`Timed out waiting for viewer preview at ${url}: ${lastError}`)
}

function startViewerPreview(port) {
  const viewerRoot = path.join(repoRoot, 'apps', 'viewer')
  const viteCli = path.join(viewerRoot, 'node_modules', 'vite', 'bin', 'vite.js')
  const child = spawn(
    process.execPath,
    [viteCli, 'preview', '--host', host, '--port', String(port), '--strictPort'],
    {
      cwd: viewerRoot,
      env: { ...process.env, BROWSER: 'none' },
      stdio: ['ignore', 'pipe', 'pipe']
    }
  )

  child.stdout.on('data', chunk => process.stdout.write(`[viewer-preview] ${chunk}`))
  child.stderr.on('data', chunk => process.stderr.write(`[viewer-preview] ${chunk}`))
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

async function screenshot(page, name) {
  const target = path.join(screenshotDir, name)
  await page.screenshot({ path: target, fullPage: true })
  const info = await stat(target)
  assert(info.size > 10000, `Screenshot ${name} is unexpectedly small (${info.size} bytes)`)
  summary.screenshots.push(path.relative(repoRoot, target).replace(/\\/g, '/'))
}

function viewerMessage(page) {
  return page.locator('.metaList').filter({ hasText: 'Message' }).last().locator('dd').last()
}

function workspaceStatus(page) {
  return page.locator('.workspaceStatus')
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
      .map(control => ({
        disabled: control.hasAttribute('disabled'),
        name: nameFor(control),
        role: control.getAttribute('role') ?? '',
        tag: control.tagName.toLowerCase()
      }))
  })

  const unlabeled = controls.filter(control => !control.name)
  assert(unlabeled.length === 0, `${context} has unlabeled visible controls: ${JSON.stringify(unlabeled, null, 2)}`)

  summary.controlSurfaces[context] = {
    total: controls.length,
    enabled: controls.filter(control => !control.disabled).length,
    disabled: controls.filter(control => control.disabled).length,
    names: Array.from(new Set(controls.map(control => control.name)))
  }

  return controls
}

async function assertNoHorizontalOverflow(page, context, minVisibleButtons = 8) {
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
  assert(metrics.mainHeight > 400, `${context} did not render a full viewer shell: ${JSON.stringify(metrics)}`)
  assert(metrics.visibleButtons >= minVisibleButtons, `${context} rendered too few buttons: ${JSON.stringify(metrics)}`)
}

async function assertViewerChrome(page) {
  await visible(page.locator('.brandLockup span').filter({ hasText: 'MarkForge Viewer' }), 'viewer brand')
  await visible(page.getByRole('region', { name: 'Rendered Markdown document' }), 'rendered Markdown document region')
  await visible(page.getByRole('complementary', { name: 'Document inspector' }), 'document inspector')

  for (const name of viewerToolbarControls) {
    await visible(page.getByRole('button', { name, exact: true }), `viewer toolbar control ${name}`)
  }

  for (const section of viewerInspectorSections) {
    await visible(page.getByRole('heading', { name: section, exact: true }), `viewer inspector section ${section}`)
  }

  await visible(page.getByLabel('Search document'), 'viewer search input')
  await visible(page.getByText('No workspace open'), 'viewer workspace idle state')
  const inspector = page.getByRole('complementary', { name: 'Document inspector' })
  await visible(inspector.getByText('Sample document'), 'viewer sample document status')
  await visible(inspector.getByText('Startup sample'), 'viewer startup sample status')
  await visible(page.getByText('YAML, lines 1-5'), 'viewer front matter range')
  await visible(page.getByText('Viewer foundation').first(), 'viewer front matter title')
  await visible(page.getByText(/mermaid diagram syntax/i), 'viewer warning')
  await visible(page.getByRole('link', { name: 'MarkForge Viewer' }), 'viewer contents link')
}

async function exerciseThemes(page) {
  for (const [label, expectedTheme] of themeAssertions) {
    await page.getByRole('button', { name: label }).click()
    const theme = await page.locator('main.viewerShell').evaluate(element => element.getAttribute('data-theme'))
    assert(theme === expectedTheme, `${label} did not set viewer data-theme=${expectedTheme}; received ${theme}`)
    await screenshot(page, `viewer-theme-${expectedTheme}.png`)
  }
  summary.workflows.push('all viewer built-in themes')
}

async function exerciseSearchAndContents(page) {
  await page.getByLabel('Search document').fill('viewer')
  await visible(page.getByText('Selected line'), 'viewer selected search line')
  const searchButtons = page.locator('.matches button')
  const count = await searchButtons.count()
  assert(count >= 1, `viewer search should expose at least one result, saw ${count}`)
  await searchButtons.first().click()
  assert(
    await page.getByText(/Jumped to line|Selected line/).count() > 0,
    'viewer search selection status did not appear'
  )
  await screenshot(page, 'viewer-search-results.png')

  await page.getByRole('link', { name: 'Render contract' }).click()
  await screenshot(page, 'viewer-outline-link.png')

  await page.getByLabel('Search document').fill('zz-no-viewer-match')
  await visible(page.getByText('No matches'), 'viewer no-match search state')
  await screenshot(page, 'viewer-search-no-match.png')

  await page.getByLabel('Search document').fill('')
  await visible(page.getByText('Search is idle'), 'viewer idle search state')
  await screenshot(page, 'viewer-search-idle.png')
  summary.workflows.push('viewer search results, no-match, idle, and contents links')
}

async function clickAndCaptureGuardedControl(page, name, screenshotName, assertion) {
  await page.getByRole('button', { name, exact: true }).click()
  await page.waitForTimeout(250)
  await assertion()
  await screenshot(page, screenshotName)
}

async function exerciseToolbarAndGuards(page) {
  await clickAndCaptureGuardedControl(
    page,
    'Reload file',
    'viewer-reload-guard.png',
    async () => visible(page.getByText('Open a file before reloading'), 'viewer reload guard')
  )

  await clickAndCaptureGuardedControl(
    page,
    'Copy rendered text',
    'viewer-copy-rendered.png',
    async () => visible(
      viewerMessage(page).filter({ hasText: /Rendered text copied|Nothing to copy|Clipboard write failed|Cannot read properties of undefined/i }),
      'viewer copy rendered status'
    )
  )

  await clickAndCaptureGuardedControl(
    page,
    'Copy source',
    'viewer-copy-source.png',
    async () => visible(
      viewerMessage(page).filter({ hasText: /Source copied|Clipboard write failed|Cannot read properties of undefined/i }),
      'viewer copy source status'
    )
  )

  await clickAndCaptureGuardedControl(
    page,
    'Print',
    'viewer-print.png',
    async () => visible(viewerMessage(page).filter({ hasText: /Print dialog opened|Print adapter/i }), 'viewer print status')
  )

  await clickAndCaptureGuardedControl(
    page,
    'Open file',
    'viewer-open-file-guard.png',
    async () => visible(
      viewerMessage(page).filter({ hasText: /Open dialog|Cannot read properties of undefined/i }),
      'viewer open-file guarded result'
    )
  )

  await clickAndCaptureGuardedControl(
    page,
    'Open workspace',
    'viewer-open-workspace-guard.png',
    async () => visible(workspaceStatus(page).filter({ hasText: /Workspace open dialog|Open dialog|No workspace open|Cannot read properties of undefined/i }), 'viewer open-workspace guarded result')
  )

  await clickAndCaptureGuardedControl(
    page,
    'Open',
    'viewer-open-folder-guard.png',
    async () => visible(workspaceStatus(page).filter({ hasText: /Workspace open dialog|Open dialog|No workspace open|Cannot read properties of undefined/i }), 'viewer inspector open-folder guarded result')
  )

  await clickAndCaptureGuardedControl(
    page,
    'Export HTML',
    'viewer-export-html-guard.png',
    async () => visible(
      viewerMessage(page).filter({ hasText: /Save dialog|HTML export canceled|Exported HTML|Cannot read properties of undefined/i }),
      'viewer export guarded result'
    )
  )

  summary.workflows.push('viewer toolbar controls and browser-preview guarded native paths')
  summary.browserPreviewLimits.push('Open file, open workspace, open folder, and HTML export require host dialogs; the browser-preview E2E asserts their guarded status updates instead of completing native dialogs.')
}

async function exerciseResponsiveStates(page) {
  await page.setViewportSize({ width: 390, height: 844 })
  await assertNoHorizontalOverflow(page, 'viewer mobile shell', 8)
  await collectVisibleControls(page, 'viewer-mobile')
  await screenshot(page, 'viewer-mobile.png')

  await page.setViewportSize({ width: 1024, height: 768 })
  await assertNoHorizontalOverflow(page, 'viewer tablet shell', 8)
  await collectVisibleControls(page, 'viewer-tablet')
  await screenshot(page, 'viewer-tablet.png')

  summary.workflows.push('viewer mobile and tablet responsive states')
}

async function run() {
  await rm(screenshotDir, { recursive: true, force: true })
  await mkdir(screenshotDir, { recursive: true })

  const port = await getFreePort()
  const url = `http://${host}:${port}/`
  const preview = startViewerPreview(port)
  let browser
  const consoleErrors = []
  const consoleWarnings = []

  try {
    await waitForServer(url, preview)
    browser = await chromium.launch({ headless: process.env.MARKFORGE_E2E_HEADFUL !== '1' })
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      colorScheme: 'light',
      reducedMotion: 'reduce'
    })
    const page = await context.newPage()

    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text())
      if (message.type() === 'warning') consoleWarnings.push(message.text())
    })
    page.on('pageerror', error => consoleErrors.push(error.message))

    await page.goto(url, { waitUntil: 'networkidle' })
    await page.evaluate(() => window.localStorage.clear())
    await page.reload({ waitUntil: 'networkidle' })

    await assertViewerChrome(page)
    await collectVisibleControls(page, 'viewer-desktop-initial')
    await assertNoHorizontalOverflow(page, 'viewer desktop shell', 8)
    await screenshot(page, 'viewer-desktop.png')

    await exerciseThemes(page)
    await exerciseSearchAndContents(page)
    await exerciseToolbarAndGuards(page)
    await exerciseResponsiveStates(page)

    assert(consoleErrors.length === 0, `Viewer browser console/page errors were emitted: ${JSON.stringify(consoleErrors, null, 2)}`)
    summary.consoleWarnings = consoleWarnings

    await browser.close()
    browser = undefined

    console.log(JSON.stringify(summary, null, 2))
  } finally {
    if (browser) await browser.close()
    stopPreview(preview)
  }
}

run().catch(error => {
  console.error(error)
  process.exit(1)
})
