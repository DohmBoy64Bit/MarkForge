import { describe, expect, it } from 'vitest'
import {
  appVisibleThemes,
  builtInThemes,
  codeThemeForTheme,
  createCustomTheme,
  exportThemeForTheme,
  getTheme,
  resolveThemePreference,
  themeToAppCssVariables,
  themeToAppTokens,
  themeToCssVariables,
  themeToExportCss,
  validateTheme
} from './index'

describe('@markforge/theme-engine', () => {
  it('ships the required built-in theme registry', () => {
    expect(builtInThemes.map(theme => theme.id)).toEqual([
      'light',
      'dark',
      'high-contrast',
      'sepia',
      'github',
      'modern-neutral'
    ])
    expect(validateTheme(getTheme('dark')).ok).toBe(true)
  })

  it('exposes every built-in theme as app-visible after Phase 8 completion', () => {
    expect(appVisibleThemes.map(theme => theme.id)).toEqual(builtInThemes.map(theme => theme.id))
  })

  it('generates CSS variables and code/export mappings', () => {
    const theme = getTheme('github')

    expect(themeToCssVariables(theme)).toMatchObject({
      '--mf-background': '#f6f8fa',
      '--mf-accent': '#0969da'
    })
    expect(codeThemeForTheme(theme)).toBe('github-light')
    expect(exportThemeForTheme(theme)).toEqual({
      exportBackground: '#ffffff',
      exportForeground: '#24292f'
    })
  })

  it('generates app-facing CSS variables for editor and viewer shells', () => {
    const sepia = getTheme('sepia')

    expect(themeToAppTokens(sepia)).toMatchObject({
      page: '#fff9eb',
      codeBg: '#2a251d'
    })
    expect(themeToAppCssVariables(sepia)).toMatchObject({
      '--app-bg': '#eee2cc',
      '--accent-strong': '#4f5639',
      '--grid-line': 'rgba(78, 68, 52, 0.08)'
    })
  })

  it('resolves system theme preferences without app-local token logic', () => {
    expect(resolveThemePreference('system', 'dark').id).toBe('dark')
    expect(resolveThemePreference('system', 'light').id).toBe('light')
    expect(resolveThemePreference('github', 'dark').id).toBe('github')
  })

  it('creates validated custom themes from partial token overrides', () => {
    const custom = createCustomTheme({
      id: 'Writer Theme!',
      label: 'Writer Theme',
      mode: 'light',
      tokens: {
        accent: '#123456',
        exportBackground: '#fefefe'
      }
    })

    expect(custom.ok).toBe(true)
    expect(custom.ok && custom.value.id).toBe('writer-theme')
    expect(custom.ok && custom.value.tokens.accent).toBe('#123456')
    expect(custom.ok && themeToAppTokens(custom.value)).toMatchObject({
      accent: '#123456',
      page: '#fefefe'
    })
  })

  it('generates export CSS from package-owned theme tokens', () => {
    expect(themeToExportCss(getTheme('modern-neutral'))).toContain('--mf-accent: #0f766e;')
    expect(themeToExportCss(getTheme('modern-neutral'))).toContain('max-width: 72ch;')
  })
})
