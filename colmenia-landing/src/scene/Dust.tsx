import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS, dustVertex, dustFragment } from './shaders'

type Props = {
  count: number
  inner: number
  outer: number
  size: [number, number]
  /** Cuánto arrastra el puntero a esta capa. Distinto por capa = parallax. */
  parallax: number
  reveal: React.RefObject<number>
  pointer: React.RefObject<{ x: number; y: number }>
}

export function Dust({ count, inner, outer, size, parallax, reveal, pointer }: Props) {
  const points = useRef<THREE.Points>(null!)
  const { viewport } = useThree()

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const seeds = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // Distribución en cáscara esférica: nada se acumula en el centro.
      const r = inner + Math.pow(Math.random(), 0.7) * (outer - inner)
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.75
      positions[i * 3 + 2] = r * Math.cos(phi)

      sizes[i] = size[0] + Math.random() * (size[1] - size[0])
      seeds[i] = Math.random()
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    return geo
  }, [count, inner, outer, size])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: dustVertex,
        fragmentShader: dustFragment,
        uniforms: {
          uTime: { value: 0 },
          uReveal: { value: 0 },
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
          uCold: { value: new THREE.Color(COLORS.cold[0], COLORS.cold[1], COLORS.cold[2]) },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  )

  useFrame((state, delta) => {
    const d = Math.min(delta, 0.05)
    material.uniforms.uTime.value = state.clock.elapsedTime
    material.uniforms.uReveal.value = reveal.current

    if (points.current) {
      points.current.rotation.y += d * 0.01
      // Parallax: cada capa sigue al puntero con distinta intensidad.
      const tx = pointer.current.x * viewport.width * parallax
      const ty = pointer.current.y * viewport.height * parallax
      points.current.position.x += (tx - points.current.position.x) * (1 - Math.pow(0.02, d))
      points.current.position.y += (ty - points.current.position.y) * (1 - Math.pow(0.02, d))
    }
  })

  return (
    <points ref={points} frustumCulled={false}>
      <primitive object={geometry} attach="geometry" />
      <primitive object={material} attach="material" />
    </points>
  )
}
