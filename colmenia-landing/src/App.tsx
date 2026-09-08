import { useCallback, useEffect, useRef, useState } from 'react'
import { Scene } from './scene/Scene'
import type { HoverPayload } from './scene/Core'
import { LIVE_CELLS, SUBLINE, TAGLINE, WORDMARK, type LiveCell } from './config/cells'

const SEEN_KEY = 'colmenia:seen'

type Phase = 'dark' | 'birth' | 'title' | 'ready'

export default function App() {
  const reveal = useRef(0)
  const intro = useRef(0)
  const pointer = useRef({ x: 0, y: 0 })
  const activeId = useRef<string | null>(null)

  const [phase, setPhase] = useState<Phase>('dark')
  const [hover, setHover] = useState<HoverPayload>(null)
  const [touched, setTouched] = useState(false)
  const [quality] = useState<'high' | 'low'>(() => {
    if (typeof window === 'undefined') return 'high'
    const coarse = window.matchMedia('(pointer: coarse)').matches
    const small = Math.min(window.innerWidth, window.innerHeight) < 700
    const weak = (navigator.hardwareConcurrency ?? 8) <= 4
    return coarse || small || weak ? 'low' : 'high'
  })

  const isTouch =
    typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

  /*
   * Sin WebGL no hay portada, pero sí tiene que haber sitio. Un navegador
   * con aceleración desactivada, una política de empresa o una tarjeta en
   * lista negra no pueden dejar a nadie ante una pantalla negra.
   */
  const [webgl] = useState(() => {
    if (typeof document === 'undefined') return true
    try {
      const c = document.createElement('canvas')
      return !!(c.getContext('webgl2') || c.getContext('webgl'))
    } catch {
      return false
    }
  })

  /* ------------------------------------------------------- coreografía */

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const seen = sessionStorage.getItem(SEEN_KEY) === '1'
    // La intro completa solo la primera vez. Volver no debe costar cuatro segundos.
    const speed = reduced ? 6 : seen ? 2.6 : 1

    let raf = 0
    const t0 = performance.now()

    const tick = (now: number) => {
      const t = ((now - t0) / 1000) * speed

      // Onda de nacimiento: arranca tras un respiro en negro.
      const rp = clamp01((t - 0.35) / 2.05)
      reveal.current = easeOutCubic(rp) * 1.15

      // Llegada de cámara, más larga que la onda para que no acaben a la vez.
      intro.current = clamp01(t / 3.0)

      if (t > 3.3) setPhase('ready')
      else if (t > 2.15) setPhase('title')
      else if (t > 0.3) setPhase('birth')

      if (t < 4) raf = requestAnimationFrame(tick)
      else sessionStorage.setItem(SEEN_KEY, '1')
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  /* ------------------------------------------------------ ajuste del logo */

  /*
   * El wordmark se mide, no se calcula. Depender de un `clamp()` afinado a
   * ojo significa depender de las métricas de Space Grotesk, y esa fuente
   * puede tardar o no llegar: con la de respaldo, más ancha, la palabra se
   * sale por los lados. Aquí se mide el ancho real y se escala si no cabe.
   */
  const wordmarkRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const fit = () => {
      const el = wordmarkRef.current
      if (!el) return
      const parent = el.parentElement
      if (!parent) return
      el.style.setProperty('--fit', '1')

      // clientWidth incluye el padding, así que hay que restarlo: si no, se
      // cree que cabe justo cuando está desbordando el margen lateral.
      const cs = getComputedStyle(parent)
      const available =
        parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
      const natural = el.scrollWidth

      if (natural > 0 && available > 0) {
        el.style.setProperty('--fit', String(Math.min(1, available / natural)))
      }
    }

    fit()
    document.fonts?.ready.then(fit).catch(() => {})
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  /* ---------------------------------------------------------- puntero */

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1)
      const c = document.getElementById('cursor')
      if (c) c.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  /* ------------------------------------------------------- interacción */

  const onHover = useCallback((p: HoverPayload) => {
    setHover(p)
    activeId.current = p?.cell.id ?? activeId.current
    if (p) setTouched(true)
  }, [])

  const onSelect = useCallback(
    (cell: LiveCell) => {
      if (!cell.url) return
      // En táctil, el primer toque enseña; el segundo entra.
      if (isTouch && activeId.current !== cell.id) {
        activeId.current = cell.id
        return
      }
      window.location.href = cell.url
    },
    [isTouch]
  )

  const showUI = phase === 'title' || phase === 'ready'
  const ready = phase === 'ready'

  return (
    <div className={`stage ${webgl ? '' : 'stage--flat'}`}>
      {webgl && (
        <Scene
          quality={quality}
          reveal={reveal}
          intro={intro}
          pointer={pointer}
          onHover={onHover}
          onSelect={onSelect}
        />
      )}

      {/* Chispa inicial: refuerza el primer latido antes de que haya colmena. */}
      {webgl && <div className={`spark ${phase !== 'dark' ? 'spark--out' : ''}`} />}

      {/* Velo que se abre. Evita el parpadeo del primer fotograma de WebGL. */}
      {webgl && <div className={`veil ${phase !== 'dark' ? 'veil--open' : ''}`} />}

      <div className={`hud ${showUI || !webgl ? 'hud--in' : ''}`}>
        <h1 className="wordmark" ref={wordmarkRef} aria-label={WORDMARK}>
          {WORDMARK.split('').map((ch, i) => (
            <span className="wordmark__mask" key={i}>
              <span
                className="wordmark__char"
                style={{ transitionDelay: `${i * 46}ms` }}
              >
                {ch}
              </span>
            </span>
          ))}
        </h1>

        <p className="tagline">{TAGLINE}</p>
        <p className="subline">{SUBLINE}</p>
      </div>

      <div className={`hint ${ready && !touched && webgl ? 'hint--in' : ''}`}>
        {isTouch ? 'Toca las celdas encendidas' : 'Recorre las celdas encendidas'}
      </div>

      {webgl && hover && (
        <div
          className="label"
          style={{
            // Sujeta a los bordes: una celda arriba del todo dejaría el
            // rótulo cortado por el borde superior de la ventana.
            transform: `translate3d(${clamp(hover.x, 24, window.innerWidth - 24)}px, ${clamp(
              hover.y,
              62,
              window.innerHeight - 62
            )}px, 0)`,
          }}
          data-side={hover.x > window.innerWidth * 0.58 ? 'left' : 'right'}
        >
          <span className="label__dot" />
          <span className="label__rule" />
          <span className="label__box">
            <span className="label__name">
              {hover.cell.name}
              {!hover.cell.url && <em className="label__soon">pronto</em>}
            </span>
            <span className="label__line">{hover.cell.line}</span>
          </span>
        </div>
      )}

      <div id="cursor" className={`cursor ${hover ? 'cursor--active' : ''}`} aria-hidden />

      {/* Los destinos, accesibles aunque no haya WebGL ni ratón. */}
      <nav className="fallback" aria-label="Secciones de COLMENIA">
        {LIVE_CELLS.filter((c) => c.url).map((c) => (
          <a key={c.id} href={c.url}>
            {c.name}
          </a>
        ))}
      </nav>
    </div>
  )
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
