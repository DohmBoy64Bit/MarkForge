import { err, ok, type Result } from '@markforge/shared'

export type ThemeId = 'dark' | 'github' | 'high-contrast' | 'light' | 'modern-neutral' | 'sepia'

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
