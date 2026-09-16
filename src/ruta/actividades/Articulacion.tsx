import { useEffect, useMemo, useRef, useState } from 'react'
import { decirFonema, decirPalabra } from '../../lib/pronunciacion'
import { tieneClip } from '../../lib/vozArchivos'
import { barajar } from '../../data/palabras'
import { CONSIGNAS, locutar } from '../locucion'
import { PALABRAS_ARTICULACION, gestoDe, imagenDe } from '../vocabulario'
import type { PropsBloque } from '../tipos'

/**
 * Pronunciación: fonogesto + audio del sonido + palabras.
 *
 * Es PRONUNCIACIÓN, no conciencia fonológica. FonoMundos no escucha: valora el
 * adulto con ✓/✗. Por eso no se guarda en la sesión del paciente, donde se
 * mezclaría con los índices fonológicos; queda en el historial de la Ruta.
 *
 * Ayuda: nivel ≥ 1 → fonogesto grande y el sonido suena antes de cada palabra.
 */

export default function Articulacion({ items, nivelAyuda, config, corte, onFin }: PropsBloque) {
  const sonido = (config.sonido ?? 'P').toLocaleUpperCase('es-ES')
  const lista = PALABRAS_ARTICULACION[sonido] ?? []
  // Cada palabra sale como mucho dos veces: con sonidos de pocas palabras (/d/)
  // la sesión es más corta en vez de machacar la misma.
  // El bloque se monta con `key` propia: items, config y nivelAyuda no cambian
  // mientras vive, así que la secuencia se calcula una vez.
  const secuencia = useMemo(() => {
    const total = Math.min(items, lista.length * 2)
    const out: string[] = []
    while (out.length < total) out.push(...barajar(lista))
    return out.slice(0, total)
  }, [items, lista])
  const [indice, setIndice] = useState(0)
  const [marcas, setMarcas] = useState<boolean[]>([])
  const [bloqueado, setBloqueado] = useState(false)
  const [sinGesto, setSinGesto] = useState(false)
  const terminado = useRef(false)
  const temporizador = useRef<number | null>(null)

  const palabra = secuencia[indice]
  const sonidoAislado = decirFonema(sonido)
  const haySonido = tieneClip(sonidoAislado)
  const gesto = gestoDe(sonido)
  const conSonidoAntes = nivelAyuda >= 1
  const etiqueta = `/${sonido.toLocaleLowerCase('es-ES')}/`

  function presentar(i: number) {
    locutar([
      ...(i === 0 ? [CONSIGNAS.escuchaRepite] : []),
      ...(conSonidoAntes ? [sonidoAislado] : []),
      decirPalabra(secuencia[i]),
    ])
  }

  useEffect(() => {
    if (!palabra) return
    const id = window.setTimeout(() => presentar(indice), indice === 0 ? 500 : 250)
    return () => window.clearTimeout(id)
  }, [indice])

  useEffect(() => () => {
    if (temporizador.current) window.clearTimeout(temporizador.current)
  }, [])

  function terminar(parcial: boolean, m: boolean[]) {
    if (terminado.current) return
    terminado.current = true
    onFin({ aciertos: m.filter(Boolean).length, total: m.length, parcial, sesionId: null })
  }

  useEffect(() => {
    if (corte) terminar(true, marcas)
  }, [corte])

  function valorar(bien: boolean) {
    if (bloqueado || terminado.current) return
    const m = [...marcas, bien]
    setMarcas(m)
    setBloqueado(true)
    if (bien) locutar([CONSIGNAS.muyBien])
    temporizador.current = window.setTimeout(() => {
      if (m.length >= secuencia.length) {
        terminar(false, m)
        return
      }
      setIndice(m.length)
      setBloqueado(false)
    }, bien ? 900 : 450)
  }

  const tablero = lista
    .filter((p) => secuencia.includes(p))
    .map((p) => {
      const hechas = marcas.filter((_, i) => secuencia[i] === p)
      return { p, bien: hechas.filter(Boolean).length, todavia: hechas.filter((x) => !x).length }
    })

  return (
    <div className="flex flex-col items-center gap-4 text-center w-full max-w-2xl">
      <div className="crayon mano px-4 py-2 text-sm" style={{ background: 'var(--cera-mostaza)', color: 'var(--tinta)' }}>
        🗣️ <b>Pronunciación {etiqueta}</b> · esto no es conciencia fonológica.
        Valora el adulto: FonoMundos no escucha.
      </div>

      <div className="flex items-center gap-4">
        {gesto && !sinGesto && (
          <img
            src={gesto}
            alt={`Fonogesto de ${etiqueta}`}
            onError={() => setSinGesto(true)}
            className={`crayon bg-white object-contain ${conSonidoAntes ? 'w-40 h-40' : 'w-24 h-24'}`}
          />
        )}
        <div className="flex flex-col items-center gap-2">
          <span className="mano text-5xl">{etiqueta}</span>
          {haySonido ? (
            <button onClick={() => locutar([sonidoAislado])} className="crayon mano px-3 py-1 text-base"
              style={{ background: 'var(--papel-2)' }}>
              🔊 Sonido
            </button>
          ) : (
            <span className="mano text-xs max-w-40" style={{ opacity: 0.7 }}>
              Este sonido aislado aún no tiene audio: modélalo tú.
            </span>
          )}
        </div>
      </div>

      {palabra && (
        <div key={indice} className="animate-pop flex flex-col items-center gap-1">
          <span className="text-8xl leading-none">{imagenDe(palabra)}</span>
          <div className="flex items-center gap-2">
            <span className="mano text-3xl">{palabra.toLocaleLowerCase('es-ES')}</span>
            <button onClick={() => presentar(indice)} aria-label="Escuchar la palabra"
              className="crayon mano px-3 py-1" style={{ background: 'var(--papel-2)' }}>
              🔊
            </button>
          </div>
          <span className="mano text-sm" style={{ opacity: 0.6 }}>{indice + 1}/{secuencia.length}</span>
        </div>
      )}

      <p className="mano text-lg">¿Cómo lo ha dicho?</p>
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        <button onClick={() => valorar(true)} disabled={bloqueado}
          className="crayon mano py-5 text-xl text-white active:scale-95 disabled:opacity-60"
          style={{ background: 'var(--cera-verde)' }}>
          ✓ Lo ha dicho bien
        </button>
        <button onClick={() => valorar(false)} disabled={bloqueado}
          className="crayon crayon-2 mano py-5 text-xl text-white active:scale-95 disabled:opacity-60"
          style={{ background: 'var(--cera-coral)' }}>
          ✗ Todavía no
        </button>
      </div>

      <div className="w-full">
        <p className="mano text-sm mb-2" style={{ opacity: 0.7 }}>Tablero de {etiqueta}</p>
        <div className="flex flex-wrap justify-center gap-2">
          {tablero.map(({ p, bien, todavia }) => (
            <div key={p} className="crayon px-2 py-1 flex flex-col items-center min-w-14"
              style={{ background: p === palabra ? 'var(--cera-azul)' : 'var(--papel-2)' }}>
              <span className="text-2xl">{imagenDe(p)}</span>
              <span className="mano text-xs">{bien ? `✓${bien}` : ''} {todavia ? `✗${todavia}` : ''}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
