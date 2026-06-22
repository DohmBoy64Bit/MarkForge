import { err, ok, type Result } from '@markforge/shared'

export type ThemeId = 'dark' | 'github' | 'high-contrast' | 'light' | 'modern-neutral' | 'sepia'

export type AppThemeTokens = {
  accent: string
  accentSoft: string
  accentStrong: string
  appBg: string
  codeBg: string
  codeText: string
  danger: string
  dangerSoft: string
  faint: string
  gridLine: string
  panel: string
  panelBorder: string
  page: string
  rail: string
  railBorder: string
  source: string
  text: string
  warning: string
  warningSoft: string
  muted: string
}

export type ThemeTokens = {
  accent: string
  background: string
  border: string
  codeBackground: string
  codeTheme: 'github-dark' | 'github-light' | 'high-contrast' | 'neutral' | 'sepia'
  exportBackground: string
  exportForeground: string
  foreground: string
  muted: string
  panel: string
}

export type MarkForgeTheme = {
  id: ThemeId
  label: string
  mode: 'dark' | 'light'
  tokens: ThemeTokens
}

export const builtInThemes: MarkForgeTheme[] = [
  {
    id: 'light',
    label: 'Light',
    mode: 'light',
    tokens: {
      background: '#f6f5f1',
      foreground: '#212325',
      panel: '#ffffff',
      border: '#d9d5cb',
      muted: '#667085',
      accent: '#2f6fed',
      codeBackground: '#f2f4f7',
      codeTheme: 'github-light',
      exportBackground: '#ffffff',
      exportForeground: '#111827'
    }
  },
  {
    id: 'dark',
    label: 'Dark',
    mode: 'dark',
    tokens: {
      background: '#16181d',
      foreground: '#eceff4',
      panel: '#20232b',
      border: '#363b47',
      muted: '#aab2c0',
      accent: '#7aa2f7',
      codeBackground: '#101217',
      codeTheme: 'github-dark',
      exportBackground: '#ffffff',
      exportForeground: '#111827'
    }
  },
  {
    id: 'high-contrast',
    label: 'High Contrast',
    mode: 'dark',
    tokens: {
      background: '#000000',
      foreground: '#ffffff',
      panel: '#0b0b0b',
      border: '#ffffff',
      muted: '#e5e7eb',
      accent: '#ffdd00',
      codeBackground: '#000000',
      codeTheme: 'high-contrast',
      exportBackground: '#ffffff',
      exportForeground: '#000000'
    }
  },
  {
    id: 'sepia',
    label: 'Sepia Paper',
    mode: 'light',
    tokens: {
      background: '#f5eddc',
      foreground: '#2f2a21',
      panel: '#fff8e8',
      border: '#d9c8a8',
      muted: '#766a58',
      accent: '#7f5f2a',
      codeBackground: '#ede2cb',
      codeTheme: 'sepia',
      exportBackground: '#fff8e8',
      exportForeground: '#2f2a21'
    }
  },
  {
    id: 'github',
    label: 'GitHub',
    mode: 'light',
    tokens: {
      background: '#f6f8fa',
      foreground: '#24292f',
      panel: '#ffffff',
      border: '#d0d7de',
      muted: '#57606a',
      accent: '#0969da',
      codeBackground: '#f6f8fa',
      codeTheme: 'github-light',
      exportBackground: '#ffffff',
      exportForeground: '#24292f'
    }
  },
  {
    id: 'modern-neutral',
    label: 'Modern Neutral',
    mode: 'light',
    tokens: {
      background: '#f3f4f6',
      foreground: '#1f2937',
      panel: '#ffffff',
      border: '#d1d5db',
      muted: '#6b7280',
      accent: '#0f766e',
      codeBackground: '#e5e7eb',
      codeTheme: 'neutral',
      exportBackground: '#ffffff',
      exportForeground: '#111827'
    }
  }
]

export const appVisibleThemes: MarkForgeTheme[] = builtInThemes

export function getTheme(id: ThemeId): MarkForgeTheme {
  return builtInThemes.find(theme => theme.id === id) ?? builtInThemes[0]
}

export function validateTheme(theme: MarkForgeTheme): Result<MarkForgeTheme> {
  const missing = Object.entries(theme.tokens)
    .filter(([, value]) => typeof value !== 'string' || value.trim() === '')
    .map(([key]) => key)

  if (!theme.id || !theme.label || missing.length > 0) {
    return err('validation-error', 'Theme is missing required token values.', { missing })
  }

  return ok(theme)
}

export function themeToCssVariables(theme: MarkForgeTheme): Record<string, string> {
  return {
    '--mf-background': theme.tokens.background,
    '--mf-foreground': theme.tokens.foreground,
    '--mf-panel': theme.tokens.panel,
    '--mf-border': theme.tokens.border,
    '--mf-muted': theme.tokens.muted,
    '--mf-accent': theme.tokens.accent,
    '--mf-code-background': theme.tokens.codeBackground
  }
}

export function themeToAppTokens(theme: MarkForgeTheme): AppThemeTokens {
  return appTokensByTheme[theme.id] ?? appTokensByTheme.light
}

export function themeToAppCssVariables(theme: MarkForgeTheme): Record<string, string> {
  const tokens = themeToAppTokens(theme)

  return {
    '--app-bg': tokens.appBg,
    '--rail': tokens.rail,
    '--rail-border': tokens.railBorder,
    '--panel': tokens.panel,
    '--panel-border': tokens.panelBorder,
    '--source': tokens.source,
    '--page': tokens.page,
    '--text': tokens.text,
    '--muted': tokens.muted,
    '--faint': tokens.faint,
    '--accent': tokens.accent,
    '--accent-strong': tokens.accentStrong,
    '--accent-soft': tokens.accentSoft,
    '--warning': tokens.warning,
    '--warning-soft': tokens.warningSoft,
    '--danger': tokens.danger,
    '--danger-soft': tokens.dangerSoft,
    '--code-bg': tokens.codeBg,
    '--code-text': tokens.codeText,
    '--grid-line': tokens.gridLine
  }
}

export function themeToCssText(theme: MarkForgeTheme): string {
  return Object.entries(themeToCssVariables(theme))
    .map(([name, value]) => `${name}: ${value};`)
    .join('\n')
}

export function codeThemeForTheme(theme: MarkForgeTheme): ThemeTokens['codeTheme'] {
  return theme.tokens.codeTheme
}

export function exportThemeForTheme(theme: MarkForgeTheme): Pick<ThemeTokens, 'exportBackground' | 'exportForeground'> {
  return {
    exportBackground: theme.tokens.exportBackground,
    exportForeground: theme.tokens.exportForeground
  }
}

const appTokensByTheme: Record<ThemeId, AppThemeTokens> = {
  light: {
    appBg: '#e6eaed',
    rail: '#f7f9fa',
    railBorder: '#c8d1da',
    panel: '#f2f5f6',
    panelBorder: '#d3dbe2',
    source: '#fbfcfd',
    page: '#fffdf7',
    text: '#1f2b36',
    muted: '#667481',
    faint: '#8996a1',
    accent: '#176f70',
    accentStrong: '#0f575b',
    accentSoft: '#dcefed',
    warning: '#965f00',
    warningSoft: '#fff2d3',
    danger: '#ad3328',
    dangerSoft: '#fff0ee',
    codeBg: '#17202b',
    codeText: '#ecf4f8',
    gridLine: 'rgba(31, 43, 54, 0.05)'
  },
  dark: {
    appBg: '#15191c',
    rail: '#1d2226',
    railBorder: '#333c44',
    panel: '#1a1f23',
    panelBorder: '#303840',
    source: '#161b1f',
    page: '#20252a',
    text: '#e8edf1',
    muted: '#9ba8b3',
    faint: '#798692',
    accent: '#78c7be',
    accentStrong: '#9bded7',
    accentSoft: '#1f3c3d',
    warning: '#f3c46d',
    warningSoft: '#3a2f1d',
    danger: '#ff9f94',
    dangerSoft: '#3b2423',
    codeBg: '#10161d',
    codeText: '#eff6f8',
    gridLine: 'rgba(232, 237, 241, 0.05)'
  },
  'high-contrast': {
    appBg: '#000000',
    rail: '#080808',
    railBorder: '#ffffff',
    panel: '#050505',
    panelBorder: '#ffffff',
    source: '#000000',
    page: '#000000',
    text: '#ffffff',
    muted: '#e5e7eb',
    faint: '#cbd5e1',
    accent: '#ffdd00',
    accentStrong: '#fff176',
    accentSoft: '#2e2600',
    warning: '#ffdd00',
    warningSoft: '#2e2600',
    danger: '#ff6b6b',
    dangerSoft: '#330909',
    codeBg: '#000000',
    codeText: '#ffffff',
    gridLine: 'rgba(255, 255, 255, 0.12)'
  },
  sepia: {
    appBg: '#eee2cc',
    rail: '#fbf4e5',
    railBorder: '#d2bea0',
    panel: '#f7ecd9',
    panelBorder: '#dbc7a6',
    source: '#fff8e8',
    page: '#fff9eb',
    text: '#2f2a21',
    muted: '#776b59',
    faint: '#9a8a72',
    accent: '#6d7051',
    accentStrong: '#4f5639',
    accentSoft: '#e4e6c8',
    warning: '#8a5a16',
    warningSoft: '#f6e6bc',
    danger: '#a33f2f',
    dangerSoft: '#f7d8cf',
    codeBg: '#2a251d',
    codeText: '#f7edda',
    gridLine: 'rgba(78, 68, 52, 0.08)'
  },
  github: {
    appBg: '#f6f8fa',
    rail: '#ffffff',
    railBorder: '#d0d7de',
    panel: '#f6f8fa',
    panelBorder: '#d0d7de',
    source: '#ffffff',
    page: '#ffffff',
    text: '#24292f',
    muted: '#57606a',
    faint: '#8c959f',
    accent: '#0969da',
    accentStrong: '#0550ae',
    accentSoft: '#ddf4ff',
    warning: '#9a6700',
    warningSoft: '#fff8c5',
    danger: '#cf222e',
    dangerSoft: '#ffebe9',
    codeBg: '#24292f',
    codeText: '#f6f8fa',
    gridLine: 'rgba(36, 41, 47, 0.06)'
  },
  'modern-neutral': {
    appBg: '#eaedf0',
    rail: '#f8fafc',
    railBorder: '#cbd5e1',
    panel: '#f1f5f9',
    panelBorder: '#cbd5e1',
    source: '#ffffff',
    page: '#ffffff',
    text: '#1f2937',
    muted: '#64748b',
    faint: '#94a3b8',
    accent: '#0f766e',
    accentStrong: '#115e59',
    accentSoft: '#ccfbf1',
    warning: '#a16207',
    warningSoft: '#fef3c7',
    danger: '#b91c1c',
    dangerSoft: '#fee2e2',
    codeBg: '#111827',
    codeText: '#f8fafc',
    gridLine: 'rgba(31, 41, 55, 0.06)'
  }
}
