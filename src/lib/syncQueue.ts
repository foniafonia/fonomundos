type SyncKind = 'feedback' | 'session'

export interface SyncQueueItem<T = unknown> {
  id: string
  kind: SyncKind
  payload: T
  createdAt: string
  attempts: number
  lastError?: string
}

const KEY = 'fonomundos.syncQueue'
const EVENT = 'fonomundos:sync-queue'

function notify() {
  window.dispatchEvent(new CustomEvent(EVENT))
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function itemKey(kind: SyncKind, payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const record = payload as Record<string, unknown>
  if (kind === 'feedback' && typeof record.id === 'string') return `feedback:${record.id}`
  if (kind === 'session') {
    const sesion = record.sesion as Record<string, unknown> | undefined
    if (sesion && typeof sesion.id === 'string') return `session:${sesion.id}`
  }
  return null
}

export function getSyncQueue(): SyncQueueItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

function setSyncQueue(items: SyncQueueItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items))
  notify()
}

export function enqueueSyncItem<T>(kind: SyncKind, payload: T, lastError?: string) {
  const key = itemKey(kind, payload)
  const current = getSyncQueue()
  if (key) {
    const existing = current.find((item) => itemKey(item.kind, item.payload) === key)
    if (existing) return existing as SyncQueueItem<T>
  }

  const item: SyncQueueItem<T> = {
    id: uid(),
    kind,
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
    lastError,
  }
  setSyncQueue([...current, item])
  return item
}

export function removeSyncItem(id: string) {
  setSyncQueue(getSyncQueue().filter((item) => item.id !== id))
}

export function markSyncFailed(id: string, error: string) {
  setSyncQueue(getSyncQueue().map((item) => (
    item.id === id
      ? { ...item, attempts: item.attempts + 1, lastError: error }
      : item
  )))
}

export function onSyncQueueChange(cb: () => void) {
  window.addEventListener(EVENT, cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener(EVENT, cb)
    window.removeEventListener('storage', cb)
  }
}
