import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const requestedApps = process.argv.slice(2)
const apps = requestedApps.length > 0 ? requestedApps : ['editor', 'viewer']
const allowed = new Set(['editor', 'viewer'])

for (const app of apps) {
  if (!allowed.has(app)) {
    console.error(`Unknown Tauri smoke app "${app}". Expected editor or viewer.`)
    process.exit(1)
  }

  console.log(`\n[tauri:smoke] ${app}`)
  const result = spawnSync(
    'pnpm',
    ['exec', 'wdio', 'run', 'tests/tauri-smoke/wdio.conf.mjs'],
    {
      cwd: repoRoot,
      env: {
        ...process.env,
        MARKFORGE_TAURI_APP: app
      },
      shell: process.platform === 'win32',
      stdio: 'inherit'
    }
  )

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}
