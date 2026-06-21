import { useEffect, useRef } from 'react'
import type { StoryZone } from './storyModeTypes'
import { ZONES } from './storyModeConfig'

interface Props {
  visitedZones: string[]
  onEnterZone: (zone: StoryZone) => void
  onSalir: () => void
}

export default function StoryGame({ visitedZones, onEnterZone, onSalir }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data?.type === 'fonomundos:zone-enter') {
        const zone = ZONES.find(z => z.id === e.data.zoneId)
        if (zone) onEnterZone(zone)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onEnterZone])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', background: '#0f1a12' }}>
      <button
        onClick={onSalir}
        style={{
          position: 'absolute', top: 12, left: 12, zIndex: 100,
          background: 'rgba(0,0,0,0.75)', color: '#bbf7d0',
          border: '1px solid #166534', borderRadius: 8,
          padding: '6px 16px', cursor: 'pointer', fontWeight: 'bold',
          fontSize: 14, fontFamily: 'inherit',
        }}
      >
        ← Salir
      </button>

      <div style={{
        position: 'absolute', top: 12, right: 12, zIndex: 100,
        background: 'rgba(0,0,0,0.75)', color: '#bbf7d0',
        border: '1px solid #166534', borderRadius: 8,
        padding: '6px 14px', fontSize: 13, fontWeight: 'bold',
        fontFamily: 'inherit',
      }}>
        {visitedZones.length}/7 zonas visitadas
      </div>

      <iframe
        ref={iframeRef}
        src="/fonomundo-bosque/index.html"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        allow="autoplay"
        title="FonoMundo — Bosque de los Sonidos"
      />
    </div>
  )
}
