import { describe, expect, it } from 'vitest'
import { builtInThemes, codeThemeForTheme, exportThemeForTheme, getTheme, themeToCssVariables, validateTheme } from './index'

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
})
