import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { enviarFeedback, sincronizarFeedbackPendiente } from '../lib/feedback'
import { sincronizarSesionesPendientes } from '../lib/storageCloud'
import { getSyncQueue, onSyncQueueChange } from '../lib/syncQueue'

type Estado = 'idle' | 'syncing' | 'ok' | 'error'
const RECENT_ACTIVITY_KEY = 'fonomundos.recentActivityAt'
const ACTIVE_CONTEXT_KEY = 'fonomundos.safetyActiveContext'
const RECENT_ACTIVITY_MS = 30 * 60 * 1000

export default function SessionSafetyNet() {
  const [pending, setPending] = useState(() => getSyncQueue())
  const [estado, setEstado] = useState<Estado>('idle')
  const [modal, setModal] = useState(false)
  const [nota, setNota] = useState('')
  const [visible, setVisible] = useState(false)
  const syncingRef = useRef(false)
  const activeContextRef = useRef(false)

  const pendingCount = pending.length
  const feedbackPendiente = useMemo(() => pending.filter((item) => item.kind === 'feedback').length, [pending])
  const sesionesPendientes = useMemo(() => pending.filter((item) => item.kind === 'session').length, [pending])

  function refresh() {
    setPending(getSyncQueue())
  }

  function markRecentActivity() {
    sessionStorage.setItem(RECENT_ACTIVITY_KEY, String(Date.now()))
  }

  function hasRecentActivity() {
    const at = Number(sessionStorage.getItem(RECENT_ACTIVITY_KEY) || 0)
    return Date.now() - at < RECENT_ACTIVITY_MS
  }

  function hasActiveContext() {
    return activeContextRef.current || sessionStorage.getItem(ACTIVE_CONTEXT_KEY) === '1'
  }

  const syncNow = useCallback(async () => {
    if (syncingRef.current) return
    const totalAntes = getSyncQueue().length
    if (totalAntes === 0) {
      setEstado('ok')
      setVisible(true)
      setTimeout(() => setVisible(false), 3500)
      return
    }

    if (!navigator.onLine) {
      setEstado('error')
      setVisible(true)
      return
    }

    syncingRef.current = true
    setEstado('syncing')
    try {
      await Promise.allSettled([
        sincronizarFeedbackPendiente(),
        sincronizarSesionesPendientes(),
      ])
      refresh()
      const quedan = getSyncQueue().length
      setEstado(quedan ? 'error' : 'ok')
      setVisible(true)
      if (!quedan) setTimeout(() => setVisible(false), 3500)
    } catch {
      setEstado('error')
      setVisible(true)
    } finally {
      syncingRef.current = false
    }
  }, [])

  async function enviarUltimaNota() {
    if (!nota.trim() && getSyncQueue().length === 0) return
    setEstado('syncing')
    if (nota.trim()) {
      await enviarFeedback('salida-sesion', 'observacion-final', 'otro', nota.trim())
      setNota('')
    }
    await syncNow()
    setModal(false)
  }

  useEffect(() => onSyncQueueChange(refresh), [])

  useEffect(() => {
    if (pendingCount > 0) setVisible(true)
  }, [pendingCount])

  useEffect(() => {
    const id = window.setInterval(() => {
      if (getSyncQueue().length > 0) syncNow()
    }, 20000)
    return () => window.clearInterval(id)
  }, [syncNow])

  useEffect(() => {
    const showSafetyModal = () => {
      markRecentActivity()
      setModal(true)
      setVisible(true)
    }
    const touchSafety = () => {
      markRecentActivity()
      setVisible(true)
    }
    const setSafetyContext = (e: Event) => {
      const detail = (e as CustomEvent<{ activo?: boolean }>).detail
      activeContextRef.current = detail?.activo === true
      sessionStorage.setItem(ACTIVE_CONTEXT_KEY, activeContextRef.current ? '1' : '0')
    }
    const markInteraction = () => {
      if (hasActiveContext()) markRecentActivity()
    }
    const online = () => syncNow()
    const pagehide = () => {
      if (getSyncQueue().length > 0) {
        void sincronizarFeedbackPendiente()
        void sincronizarSesionesPendientes()
      }
    }
    const beforeUnload = (e: BeforeUnloadEvent) => {
      const hayPendientes = getSyncQueue().length > 0
      if (!hayPendientes && !hasActiveContext() && !hasRecentActivity()) return
      e.preventDefault()
      e.returnValue = ''
    }
    const exitIntent = (e: MouseEvent) => {
      if (e.clientY > 56 || modal) return
      const hayPendientes = getSyncQueue().length > 0
      if (!hayPendientes && (!hasActiveContext() || !hasRecentActivity())) return
      if (Date.now() - Number(sessionStorage.getItem('fonomundos.lastExitPrompt') || 0) < 120000) return
      sessionStorage.setItem('fonomundos.lastExitPrompt', String(Date.now()))
      setModal(true)
      setVisible(true)
    }

    window.addEventListener('fonomundos:safety-modal', showSafetyModal)
    window.addEventListener('fonomundos:safety-touch', touchSafety)
    window.addEventListener('fonomundos:safety-context', setSafetyContext)
    window.addEventListener('online', online)
    window.addEventListener('pagehide', pagehide)
    window.addEventListener('beforeunload', beforeUnload)
    window.addEventListener('pointerdown', markInteraction, { passive: true })
    window.addEventListener('keydown', markInteraction)
    document.addEventListener('mouseout', exitIntent)
    return () => {
      window.removeEventListener('fonomundos:safety-modal', showSafetyModal)
      window.removeEventListener('fonomundos:safety-touch', touchSafety)
      window.removeEventListener('fonomundos:safety-context', setSafetyContext)
      window.removeEventListener('online', online)
      window.removeEventListener('pagehide', pagehide)
      window.removeEventListener('beforeunload', beforeUnload)
      window.removeEventListener('pointerdown', markInteraction)
      window.removeEventListener('keydown', markInteraction)
      document.removeEventListener('mouseout', exitIntent)
    }
  }, [modal, syncNow])

  const label = pendingCount > 0
    ? `${pendingCount} pendiente${pendingCount === 1 ? '' : 's'}`
    : estado === 'syncing'
      ? 'Guardando...'
      : estado === 'ok'
        ? 'Todo guardado'
        : 'Datos protegidos'

  return (
    <>
      <div
        className={`safety-net-widget fixed bottom-3 left-3 z-50 print:hidden transition-opacity ${visible || pendingCount > 0 ? 'opacity-100' : 'opacity-55 hover:opacity-100'}`}
      >
        <div className="crayon mano flex max-w-[92vw] items-center gap-2 px-3 py-2 text-sm shadow-lg"
          style={{ background: pendingCount ? 'var(--cera-mostaza)' : 'var(--papel-2)' }}>
          <span aria-hidden="true">{pendingCount ? '⏳' : '✓'}</span>
          <button onClick={() => setModal(true)} className="text-left leading-tight">
            <b>{label}</b>
            {pendingCount > 0 && (
              <span className="block text-xs opacity-70">
                {sesionesPendientes} sesiones · {feedbackPendiente} comentarios
              </span>
            )}
          </button>
          {pendingCount > 0 && (
            <button onClick={syncNow} className="crayon px-2 py-1 text-xs text-white" style={{ background: 'var(--cera-verde)' }}>
              Enviar
            </button>
          )}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/25 p-4 print:hidden sm:items-center">
          <div className="crayon w-full max-w-md p-5 shadow-2xl" style={{ background: 'var(--papel)' }}>
            <h2 className="mano mb-2 text-2xl">Antes de salir</h2>
            <p className="mano mb-3 text-sm" style={{ opacity: 0.75 }}>
              Tu sesión ayuda a construir FonoMundos. Si has visto algo que mejorar, envíalo antes de irte.
            </p>
            {pendingCount > 0 && (
              <div className="crayon mb-3 p-3 text-sm" style={{ background: 'var(--cera-mostaza)' }}>
                Quedan {pendingCount} dato{pendingCount === 1 ? '' : 's'} por sincronizar.
              </div>
            )}
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Última observación, mejora o fallo que hayas visto..."
              rows={4}
              className="crayon mano mb-3 w-full resize-none px-3 py-2 text-base outline-none"
              style={{ background: 'var(--papel-2)' }}
            />
            <div className="flex flex-wrap gap-2">
              <button onClick={enviarUltimaNota} disabled={!nota.trim() && pendingCount === 0}
                className="crayon mano flex-1 px-4 py-2 text-white disabled:opacity-40"
                style={{ background: 'var(--cera-coral)' }}>
                Enviar
              </button>
              <button onClick={() => setModal(false)} className="crayon mano px-4 py-2" style={{ background: 'var(--papel-2)' }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
