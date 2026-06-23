import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const requiredFiles = [
  'README.md',
  'docs/architecture.md',
  'docs/developer-documentation.md',
  'docs/audits/documentation-code-drift-debt-audit.md',
  'docs/audits/drift-debt-remediation-report.md',
  'docs/audits/final-pre-next-phase-implementation-report.md',
  'docs/changelogs/final-loose-ends-implementation-changelog.md',
  'docs/changelogs/final-findings-fix-execution-changelog.md',
  'docs/final-findings-fix-execution-report.md',
  'docs/final-loose-ends-truthfulness-report.md',
  'docs/implementation-roadmap.md',
  'docs/marktext-parity-matrix.md',
  'docs/phase-4-editor-shell.md',
  'docs/phase-5-advanced-editing.md',
  'docs/phase-6-templates-help.md',
  'docs/phase-7-converters.md',
  'docs/phase-10-packaging-documentation.md',
  'docs/phase-11-native-platform-hardening.md',
  'docs/phase-12-rich-editor-surface.md',
  'docs/packaging-release.md',
  'docs/release-hardening.md',
  'docs/update-signing-strategy.md',
  'docs/product-requirements.md',
  'docs/user-documentation.md',
  'packages/markdown-engine/README.md',
  'packages/editor-engine/README.md',
  'packages/templates/README.md'
]

const plannedOnlyPackages = []

const implementedPackages = [
  'converters',
  'core',
  'editor-engine',
  'llm',
  'markdown-engine',
  'platform',
  'shared',
  'templates',
  'theme-engine',
  'ui'
]

const staleMarkers = [
  {
    file: 'README.md',
    marker: 'implementation has progressed through Phase 5A',
    message: 'README current status must not stop at Phase 5A.'
  },
  {
    file: 'docs/developer-documentation.md',
    marker: 'Implementation has progressed through Phase 5A',
    message: 'Developer documentation implementation state must not stop at Phase 5A.'
  },
  {
    file: 'docs/marktext-parity-matrix.md',
    marker: 'MarkForge has docs gate only; implementation tests pending.',
    message: 'Parity matrix must acknowledge current app/package tests.'
  },
  {
    file: 'README.md',
    marker: 'implementation has progressed through Phase 6B',
    message: 'README current status must not stop at Phase 6B.'
  },
  {
    file: 'docs/developer-documentation.md',
    marker: 'Implementation has progressed through Phase 6B',
    message: 'Developer documentation implementation state must not stop at Phase 6B.'
  },
  {
    file: 'README.md',
    marker: 'implementation has progressed through Phase 10 packaging/documentation',
    message: 'README current status must not stop at Phase 10.'
  },
  {
    file: 'docs/developer-documentation.md',
    marker: 'Implementation has progressed through Phase 10 packaging/documentation',
    message: 'Developer documentation implementation state must not stop at Phase 10.'
  }
]

const ignoredLinkPrefixes = [
  'http:',
  'https:',
  'mailto:',
  '#',
  'app://'
]

const errors = []

function projectPath(relativePath) {
  return path.join(root, relativePath)
}

function readText(relativePath) {
  return fs.readFileSync(projectPath(relativePath), 'utf8')
}

function exists(relativePath) {
  return fs.existsSync(projectPath(relativePath))
}

for (const file of requiredFiles) {
  if (!exists(file)) {
    errors.push(`Missing required documentation file: ${file}`)
  }
}

for (const pkg of implementedPackages) {
  for (const child of ['README.md', 'package.json', 'src/index.ts']) {
    const relativePath = `packages/${pkg}/${child}`
    if (!exists(relativePath)) {
      errors.push(`Implemented package is missing ${child}: packages/${pkg}`)
    }
  }

  if (!hasPackageSpec(pkg)) {
    errors.push(`Implemented package is missing package-level tests: packages/${pkg}`)
  }

  const packageJsonPath = `packages/${pkg}/package.json`
  if (exists(packageJsonPath)) {
    const packageJson = JSON.parse(readText(packageJsonPath))
    if (packageJson.exports?.['.'] !== './src/index.ts') {
      errors.push(`Implemented package must export only its public entrypoint: packages/${pkg}`)
    }
  }
}

for (const workspacePackage of collectWorkspacePackages()) {
  validateWorkspacePackageImports(workspacePackage)
}

for (const pkg of plannedOnlyPackages) {
  const readmePath = `packages/${pkg}/README.md`
  if (!exists(readmePath)) {
    errors.push(`Planned package is missing README: packages/${pkg}`)
    continue
  }

  const readme = readText(readmePath)
  if (!readme.includes('Current status: planned target package only.')) {
    errors.push(`Planned package README must state README-only status: ${readmePath}`)
  }

  for (const child of ['package.json', 'src']) {
    if (exists(`packages/${pkg}/${child}`)) {
      errors.push(`Planned package marked README-only but implementation path exists: packages/${pkg}/${child}`)
    }
  }
}

for (const { file, marker, message } of staleMarkers) {
  if (exists(file) && readText(file).includes(marker)) {
    errors.push(`${message} Found stale marker in ${file}: ${marker}`)
  }
}

const productMarkdownFiles = collectMarkdownFiles(['README.md', 'docs', 'apps', 'packages', 'tests'])

for (const file of productMarkdownFiles) {
  const text = readText(file)
  const linkPattern = /\[[^\]]+\]\(([^)]+)\)/g
  for (const match of text.matchAll(linkPattern)) {
    const rawLink = match[1].trim()
    if (!rawLink || ignoredLinkPrefixes.some((prefix) => rawLink.startsWith(prefix))) {
      continue
    }

    const [targetWithoutAnchor] = rawLink.split('#')
    if (!targetWithoutAnchor) {
      continue
    }

    const decodedTarget = decodeURIComponent(targetWithoutAnchor)
    const normalized = path.normalize(path.join(path.dirname(projectPath(file)), decodedTarget))
    if (!normalized.startsWith(root)) {
      errors.push(`Documentation link escapes repository root in ${file}: ${rawLink}`)
      continue
    }

    if (!fs.existsSync(normalized)) {
      errors.push(`Broken local documentation link in ${file}: ${rawLink}`)
    }
  }
}

if (errors.length > 0) {
  console.error('MarkForge docs validation failed:')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log(`MarkForge docs validation passed (${productMarkdownFiles.length} markdown files checked).`)

function collectMarkdownFiles(entries) {
  const files = []

  for (const entry of entries) {
    const absolutePath = projectPath(entry)
    if (!fs.existsSync(absolutePath)) {
      continue
    }

    const stat = fs.statSync(absolutePath)
    if (stat.isFile()) {
      if (entry.endsWith('.md') || entry.endsWith('.mdx')) {
        files.push(path.normalize(entry))
      }
      continue
    }

    for (const child of fs.readdirSync(absolutePath, { withFileTypes: true })) {
      const relativeChild = path.join(entry, child.name)
      if (child.isDirectory()) {
        files.push(...collectMarkdownFiles([relativeChild]))
      } else if (child.isFile() && (child.name.endsWith('.md') || child.name.endsWith('.mdx'))) {
        files.push(path.normalize(relativeChild))
      }
    }
  }

  return files.sort()
}

function hasPackageSpec(pkg) {
  const sourcePath = projectPath(`packages/${pkg}/src`)
  if (!fs.existsSync(sourcePath)) return false

  return fs.readdirSync(sourcePath, { recursive: true })
    .some(file => typeof file === 'string' && /\.spec\.tsx?$/.test(file))
}

function collectWorkspacePackages() {
  const packages = []

  for (const base of ['apps', 'packages']) {
    const basePath = projectPath(base)
    if (!fs.existsSync(basePath)) continue

    for (const child of fs.readdirSync(basePath, { withFileTypes: true })) {
      if (!child.isDirectory()) continue

      const relativePath = path.join(base, child.name)
      const packageJsonPath = path.join(relativePath, 'package.json')
      if (!exists(packageJsonPath)) continue

      const packageJson = JSON.parse(readText(packageJsonPath))
      packages.push({ packageJson, packageJsonPath, relativePath })
    }
  }

  return packages
}

function validateWorkspacePackageImports(workspacePackage) {
  const sourcePath = projectPath(path.join(workspacePackage.relativePath, 'src'))
  if (!fs.existsSync(sourcePath)) return

  const imports = collectWorkspaceImports(workspacePackage.relativePath)
  const directImports = new Set(imports.map(importPath => importPath.split('/').slice(0, 2).join('/')))
  const declaredDependencies = {
    ...workspacePackage.packageJson.dependencies,
    ...workspacePackage.packageJson.peerDependencies,
    ...workspacePackage.packageJson.devDependencies
  }
  const declaredWorkspaceDeps = Object.entries(declaredDependencies)
    .filter(([name, version]) => name.startsWith('@markforge/') && version === 'workspace:*')
    .map(([name]) => name)

  for (const importPath of imports) {
    const parts = importPath.split('/')
    const directPackage = parts.slice(0, 2).join('/')

    if (parts.length > 2) {
      errors.push(`Private package import is not allowed in ${workspacePackage.relativePath}: ${importPath}`)
    }

    if (directPackage !== workspacePackage.packageJson.name && !declaredDependencies[directPackage]) {
      errors.push(`Workspace package imports ${directPackage} without declaring it in ${workspacePackage.packageJsonPath}`)
    }
  }

  for (const dependency of declaredWorkspaceDeps) {
    if (dependency === workspacePackage.packageJson.name) continue
    if (!directImports.has(dependency)) {
      errors.push(`Workspace dependency is declared but unused in source: ${workspacePackage.packageJsonPath} -> ${dependency}`)
    }
  }
}

function collectWorkspaceImports(relativePackagePath) {
  const imports = []
  const sourcePath = projectPath(path.join(relativePackagePath, 'src'))

  for (const file of fs.readdirSync(sourcePath, { recursive: true })) {
    if (typeof file !== 'string' || !/\.[cm]?tsx?$/.test(file)) continue

    const relativeFile = path.join(relativePackagePath, 'src', file)
    const text = readText(relativeFile)
    const importPattern = /(?:import|export)\s+(?:[^'"]+\s+from\s+)?['"](@markforge\/[^'"]+)['"]/g

    for (const match of text.matchAll(importPattern)) {
      imports.push(match[1])
    }
  }

  return imports
}
