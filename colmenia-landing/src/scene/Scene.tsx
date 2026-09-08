import { useMemo, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  Vignette,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'

import { Backdrop } from './Backdrop'
import { Core, RADIUS, type HoverPayload } from './Core'
import { Dust } from './Dust'
import type { LiveCell } from '../config/cells'

type Props = {
  quality: 'high' | 'low'
  reveal: React.RefObject<number>
  intro: React.RefObject<number>
  pointer: React.RefObject<{ x: number; y: number }>
  onHover: (p: HoverPayload) => void
  onSelect: (cell: LiveCell) => void
}

/**
 * Cámara: nunca se mueve de golpe. Tres capas de movimiento superpuestas —
 * la llegada de la intro, una deriva propia muy lenta y la respuesta al
 * puntero — todas amortiguadas. La suma es lo que da la sensación de peso.
 */
function CameraRig({
  pointer,
  intro,
}: {
  pointer: React.RefObject<{ x: number; y: number }>
  intro: React.RefObject<number>
}) {
  const { camera, size } = useThree()
  const target = useMemo(() => new THREE.Vector3(), [])
  const from = useMemo(() => new THREE.Vector3(), [])
  const to = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const d = Math.min(delta, 0.05)

    /*
     * Distancia calculada, no fija. Con una distancia fija el encuadre solo
     * funciona en el monitor donde se diseñó: en vertical la esfera se sale
     * por los lados, porque el fov es vertical y el ancho no da. Se busca la
     * distancia a la que el objeto ocupa la fracción que queremos del lado
     * MÁS CORTO del encuadre.
     */
    const cam = state.camera as THREE.PerspectiveCamera
    const aspect = size.width / Math.max(size.height, 1)
    const tanV = Math.tan(THREE.MathUtils.degToRad(cam.fov * 0.5))
    const tanMin = Math.min(tanV, tanV * aspect)
    const fill = aspect < 1 ? 0.8 : 0.66
    const dist = RADIUS / (tanMin * fill)

    to.set(0, 0, dist)
    from.set(dist * 0.26, dist * 0.2, dist * 1.78)

    // Llegada de la intro con ease-out fuerte.
    const p = intro.current
    const eased = 1 - Math.pow(1 - Math.min(p, 1), 3)
    target.lerpVectors(from, to, eased)

    // Deriva ambiental y respuesta al puntero, ambas en proporción a la
    // distancia: si van en unidades fijas, en móvil (cámara muy atrás) el
    // movimiento se vuelve imperceptible y en pantallas anchas, excesivo.
    target.x += Math.sin(t * 0.11) * dist * 0.027
    target.y += Math.cos(t * 0.085) * dist * 0.020
    target.x += pointer.current.x * dist * 0.077
    target.y += pointer.current.y * dist * 0.050

    camera.position.lerp(target, 1 - Math.pow(0.0015, d))
    camera.lookAt(0, 0, 0)
  })

  return null
}

export function Scene({ quality, reveal, intro, pointer, onHover, onSelect }: Props) {
  const high = quality === 'high'

  /*
   * Resolución adaptativa. Detectar la gama del dispositivo al arrancar es
   * una conjetura; medir los fotogramas reales, no. Si la máquina no da,
   * baja la escala de render antes que la fluidez: una portada a 40 fps
   * borrosa se perdona, a 15 fps nítida no.
   */
  const [dpr, setDpr] = useState(high ? 1.75 : 1.35)

  return (
    <Canvas
      dpr={dpr}
      gl={{
        antialias: high,
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
      }}
      camera={{ position: [5, 4, 34], fov: 40, near: 0.1, far: 240 }}
      onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color('#03050a'), 1)
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 0.94
      }}
    >
      <PerformanceMonitor
        onDecline={() => setDpr((d) => Math.max(0.75, d - 0.35))}
        onIncline={() => setDpr((d) => Math.min(high ? 1.75 : 1.35, d + 0.2))}
      />

      <CameraRig pointer={pointer} intro={intro} />

      <Backdrop reveal={reveal} />

      <Core quality={quality} reveal={reveal} onHover={onHover} onSelect={onSelect} />

      <Dust
        count={high ? 1100 : 380}
        inner={6}
        outer={34}
        size={[0.5, 1.6]}
        parallax={0.012}
        reveal={reveal}
        pointer={pointer}
      />
      <Dust
        count={high ? 150 : 60}
        inner={4.2}
        outer={9}
        size={[1.4, 3.4]}
        parallax={0.05}
        reveal={reveal}
        pointer={pointer}
      />

      <EffectComposer multisampling={0}>
        {/* Umbral alto: solo florecen las brasas y los filos, no la esfera
            entera. Con el umbral bajo esto se convierte en una lámpara. */}
        <Bloom
          intensity={high ? 0.85 : 0.6}
          luminanceThreshold={0.30}
          luminanceSmoothing={0.42}
          mipmapBlur
          radius={0.85}
        />
        {high ? (
          <ChromaticAberration
            offset={new THREE.Vector2(0.0005, 0.0007)}
            blendFunction={BlendFunction.NORMAL}
            radialModulation={false}
            modulationOffset={0}
          />
        ) : (
          <></>
        )}
        <Vignette eskil={false} offset={0.26} darkness={0.72} />
        <Noise opacity={high ? 0.035 : 0.02} blendFunction={BlendFunction.OVERLAY} />
      </EffectComposer>
    </Canvas>
  )
}
