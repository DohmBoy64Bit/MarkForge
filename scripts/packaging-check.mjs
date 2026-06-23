import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const apps = [
  {
    app: 'editor',
    cargoName: 'markforge-editor',
    identifier: 'com.markforge.editor',
    minHeight: 640,
    minWidth: 900,
    productName: 'MarkForge',
    requiredAssociationExtensions: ['md', 'markdown', 'mdown', 'txt'],
    requiredAssociationRole: 'Editor',
    tauriDir: 'apps/editor/src-tauri'
  },
  {
    app: 'viewer',
    cargoName: 'markforge-viewer',
    identifier: 'com.markforge.viewer',
    minHeight: 620,
    minWidth: 860,
    productName: 'MarkForge Viewer',
    requiredAssociationExtensions: ['md', 'markdown', 'mdown', 'txt'],
    requiredAssociationRole: 'Viewer',
    tauriDir: 'apps/viewer/src-tauri'
  }
]

const errors = []

const rootPackage = readJson('package.json')
for (const scriptName of [
  'docs:check',
  'test',
  'build:editor',
  'build:viewer',
  'tauri:build',
  'tauri:viewer:build',
  'bundle:check',
  'packaging:check'
]) {
  if (!rootPackage.scripts?.[scriptName]) {
    errors.push(`Missing root package script: ${scriptName}`)
  }
}

for (const app of apps) {
  const tauriConfigPath = path.join(app.tauriDir, 'tauri.conf.json')
  const cargoPath = path.join(app.tauriDir, 'Cargo.toml')
  const capabilitiesPath = path.join(app.tauriDir, 'capabilities/default.json')
  const iconPath = path.join(app.tauriDir, 'icons/icon.ico')

  const config = readJson(tauriConfigPath)
  requireEqual(`${app.app} productName`, config.productName, app.productName)
  requireEqual(`${app.app} identifier`, config.identifier, app.identifier)
  requireEqual(`${app.app} version`, config.version, rootPackage.version)
  requireEqual(`${app.app} build.beforeBuildCommand`, config.build?.beforeBuildCommand, 'pnpm build')
  requireEqual(`${app.app} bundle.active`, config.bundle?.active, true)
  requireEqual(`${app.app} updater artifact generation`, config.bundle?.createUpdaterArtifacts, false)

  if (!Array.isArray(config.bundle?.targets) || !config.bundle.targets.includes('nsis')) {
    errors.push(`${app.app} must keep Windows NSIS in bundle.targets`)
  }

  requireEqual(`${app.app} NSIS install mode`, config.bundle?.windows?.nsis?.installMode, 'currentUser')
  requireUnsignedReleaseGuard(app, config)
  requireFileAssociation(app, config)

  const windowConfig = config.app?.windows?.[0]
  if (!windowConfig) {
    errors.push(`${app.app} is missing primary window config`)
  } else {
    if (windowConfig.minWidth < app.minWidth) {
      errors.push(`${app.app} minWidth is below release baseline: ${windowConfig.minWidth}`)
    }
    if (windowConfig.minHeight < app.minHeight) {
      errors.push(`${app.app} minHeight is below release baseline: ${windowConfig.minHeight}`)
    }
  }

  const csp = config.app?.security?.csp ?? ''
  if (!csp.includes("default-src 'self'")) {
    errors.push(`${app.app} CSP must keep default-src self`)
  }

  requireFile(capabilitiesPath, `${app.app} Tauri capability file`)
  requireFile(iconPath, `${app.app} Windows icon`)

  const cargoToml = readText(cargoPath)
  if (!cargoToml.includes(`name = "${app.cargoName}"`)) {
    errors.push(`${app.app} Cargo package name must be ${app.cargoName}`)
  }
  if (!cargoToml.includes(`version = "${rootPackage.version}"`)) {
    errors.push(`${app.app} Cargo package version must match root package version ${rootPackage.version}`)
  }
}

function requireUnsignedReleaseGuard(app, config) {
  const windows = config.bundle?.windows ?? {}
  for (const field of ['certificateThumbprint', 'digestAlgorithm', 'signCommand', 'timestampUrl']) {
    if (windows[field]) {
      errors.push(`${app.app} must not configure Windows signing field ${field} until release signing is intentionally enabled`)
    }
  }

  if (config.plugins?.updater) {
    errors.push(`${app.app} must not configure updater plugin endpoints until signing keys and release channels are approved`)
  }
}

function requireFileAssociation(app, config) {
  const associations = config.bundle?.fileAssociations
  if (!Array.isArray(associations) || associations.length === 0) {
    errors.push(`${app.app} must declare bundle.fileAssociations`)
    return
  }

  const association = associations.find(item => item.role === app.requiredAssociationRole)
  if (!association) {
    errors.push(`${app.app} must declare a ${app.requiredAssociationRole} file association`)
    return
  }

  const extensions = Array.isArray(association.ext) ? association.ext : []
  for (const extension of app.requiredAssociationExtensions) {
    if (!extensions.includes(extension)) {
      errors.push(`${app.app} file association is missing .${extension}`)
    }
  }

  if (!association.description) {
    errors.push(`${app.app} file association must include a Windows description`)
  }
}

if (errors.length > 0) {
  console.error('MarkForge packaging validation failed:')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log('MarkForge packaging validation passed.')

function projectPath(relativePath) {
  return path.join(root, relativePath)
}

function readText(relativePath) {
  return fs.readFileSync(projectPath(relativePath), 'utf8')
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath))
}

function requireEqual(label, actual, expected) {
  if (actual !== expected) {
    errors.push(`${label} must be ${JSON.stringify(expected)}, found ${JSON.stringify(actual)}`)
  }
}

function requireFile(relativePath, label) {
  if (!fs.existsSync(projectPath(relativePath))) {
    errors.push(`Missing ${label}: ${relativePath}`)
  }
}
