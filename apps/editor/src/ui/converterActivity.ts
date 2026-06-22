export type ConverterActivityStatus = 'error' | 'success' | 'warning'

export type ConverterActivityEntry = {
  detail: string
  id: string
  label: string
  status: ConverterActivityStatus
  timestamp: number
}

export type ConverterActivityInput = {
  detail: string
  label: string
  status: ConverterActivityStatus
}

export function prependConverterActivity(
  entries: ConverterActivityEntry[],
  input: ConverterActivityInput,
  limit = 5,
  timestamp = Date.now()
): ConverterActivityEntry[] {
  const next = {
    ...input,
    id: `${timestamp}-${sanitizeActivityLabel(input.label)}`,
    timestamp
  }

  return [next, ...entries].slice(0, Math.max(1, limit))
}

export function formatConverterActivityTime(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  }).format(timestamp)
}

function sanitizeActivityLabel(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'converter'
}
