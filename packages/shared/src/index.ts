export type MarkForgeErrorCode =
  | 'cancelled'
  | 'invalid-input'
  | 'io-error'
  | 'not-found'
  | 'not-supported'
  | 'provider-error'
  | 'validation-error'

export type MarkForgeError = {
  code: MarkForgeErrorCode
  message: string
  cause?: unknown
  details?: Record<string, unknown>
}

export type Result<T, E extends MarkForgeError = MarkForgeError> =
  | { ok: true; value: T }
  | { error: E; ok: false }

export type CancellableOptions = {
  signal?: AbortSignal
}

export type Disposable = {
  dispose(): void
}

export type EventEnvelope<TType extends string, TPayload> = {
  payload: TPayload
  timestamp: number
  type: TType
}

export type JsonPrimitive = boolean | number | string | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

export type StorageLike = {
  getItem(key: string): string | null
  removeItem(key: string): void
  setItem(key: string, value: string): void
}

export function ok<T>(value: T): Result<T> {
  return { ok: true, value }
}

export function err(code: MarkForgeErrorCode, message: string, details?: Record<string, unknown>): Result<never> {
  return {
    ok: false,
    error: { code, message, details }
  }
}

export function toError(error: unknown, fallbackMessage = 'Unexpected MarkForge error'): MarkForgeError {
  if (isMarkForgeError(error)) return error
  if (error instanceof DOMException && error.name === 'AbortError') {
    return { code: 'cancelled', message: 'Operation was cancelled.', cause: error }
  }
  if (error instanceof Error) return { code: 'provider-error', message: error.message, cause: error }
  if (typeof error === 'string') return { code: 'provider-error', message: error }
  return { code: 'provider-error', message: fallbackMessage, cause: error }
}

export function isMarkForgeError(value: unknown): value is MarkForgeError {
  return value !== null &&
    typeof value === 'object' &&
    'code' in value &&
    'message' in value &&
    typeof value.code === 'string' &&
    typeof value.message === 'string'
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function assertNotCancelled(signal?: AbortSignal): Result<void> {
  return signal?.aborted ? err('cancelled', 'Operation was cancelled.') : ok(undefined)
}

export function createEvent<TType extends string, TPayload>(
  type: TType,
  payload: TPayload,
  timestamp = Date.now()
): EventEnvelope<TType, TPayload> {
  return { type, payload, timestamp }
}
