import os from 'node:os'
import path from 'node:path'
import { existsSync } from 'node:fs'
import { spawn, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..', '..')
const appName = process.env.MARKFORGE_TAURI_APP ?? 'editor'

const apps = {
  editor: {
    binary: process.platform === 'win32' ? 'markforge-editor.exe' : 'markforge-editor',
    package: '@markforge/editor',
    spec: './editor.wdio.mjs',
    targetDir: path.join(repoRoot, 'apps', 'editor', 'src-tauri', 'target', 'debug')
  },
  viewer: {
    binary: process.platform === 'win32' ? 'markforge-viewer.exe' : 'markforge-viewer',
    package: '@markforge/viewer',
    spec: './viewer.wdio.mjs',
    targetDir: path.join(repoRoot, 'apps', 'viewer', 'src-tauri', 'target', 'debug')
  }
}

const selected = apps[appName]
if (!selected) {
  throw new Error(`Unknown MARKFORGE_TAURI_APP value: ${appName}`)
}

const tauriDriverPath = process.env.TAURI_DRIVER_PATH
  ?? path.join(os.homedir(), '.cargo', 'bin', process.platform === 'win32' ? 'tauri-driver.exe' : 'tauri-driver')
const application = path.join(selected.targetDir, selected.binary)
let tauriDriver
let intentionalExit = false

function resolveNativeDriverPath() {
  if (process.env.MARKFORGE_NATIVE_DRIVER_PATH) return process.env.MARKFORGE_NATIVE_DRIVER_PATH
  if (process.platform !== 'win32') return undefined

  const result = spawnSync(
    process.execPath,
    [path.join(repoRoot, 'scripts', 'resolve-edge-driver.mjs')],
    {
      cwd: repoRoot,
      shell: false,
      stdio: ['ignore', 'pipe', 'inherit']
    }
  )

  if (result.status !== 0) {
    throw new Error(`Unable to resolve msedgedriver.exe; resolver exited with status ${result.status}`)
  }

  return result.stdout.toString().trim()
}

function closeTauriDriver() {
  intentionalExit = true
  if (!tauriDriver || tauriDriver.exitCode !== null) return

  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(tauriDriver.pid), '/T', '/F'], { stdio: 'ignore' })
    return
  }

  tauriDriver.kill('SIGTERM')
}

function onShutdown(fn) {
  const cleanup = () => {
    try {
      fn()
    } finally {
      process.exit()
    }
  }

  process.once('SIGINT', cleanup)
  process.once('SIGTERM', cleanup)
  process.once('SIGHUP', cleanup)
  if (process.platform === 'win32') process.once('SIGBREAK', cleanup)
}

onShutdown(closeTauriDriver)

export const config = {
  host: '127.0.0.1',
  port: 4444,
  specs: [selected.spec],
  maxInstances: 1,
  capabilities: [{
    maxInstances: 1,
    'tauri:options': {
      application
    }
  }],
  reporters: ['spec'],
  framework: 'mocha',
  mochaOpts: {
    timeout: 60000,
    ui: 'bdd'
  },
  onPrepare() {
    if (!existsSync(tauriDriverPath)) {
      throw new Error(`tauri-driver was not found at ${tauriDriverPath}. Install it with: cargo install tauri-driver --locked`)
    }

    const build = spawnSync(
      'pnpm',
      ['--filter', selected.package, 'tauri', 'build', '--debug', '--no-bundle'],
      {
        cwd: repoRoot,
        shell: process.platform === 'win32',
        stdio: 'inherit'
      }
    )

    if (build.status !== 0) {
      throw new Error(`${selected.package} debug Tauri build failed with status ${build.status}`)
    }

    if (!existsSync(application)) {
      throw new Error(`Expected debug application was not built: ${application}`)
    }
  },
  beforeSession() {
    intentionalExit = false
    const nativeDriverPath = resolveNativeDriverPath()
    const driverArgs = nativeDriverPath ? ['--native-driver', nativeDriverPath] : []

    tauriDriver = spawn(tauriDriverPath, driverArgs, {
      stdio: ['ignore', process.stdout, process.stderr]
    })

    tauriDriver.on('error', error => {
      throw error
    })
    tauriDriver.on('exit', code => {
      if (!intentionalExit) {
        throw new Error(`tauri-driver exited early with code ${code}`)
      }
    })
  },
  afterSession() {
    closeTauriDriver()
  },
  onComplete() {
    closeTauriDriver()
  }
}
