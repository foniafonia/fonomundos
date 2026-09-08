import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

import {
  buildHexSphere,
  buildCellGeometry,
  buildEdgeGeometry,
  cellAtLatLon,
  nearestCell,
  pseudoRandom,
} from './hexSphere'
import {
  COLORS,
  KEY_LIGHT,
  cellVertex,
  cellFragment,
  edgeVertex,
  edgeFragment,
  pulseVertex,
  pulseFragment,
} from './shaders'
import { LIVE_CELLS, type LiveCell } from '../config/cells'

export const RADIUS = 2.6
const c3 = (c: readonly number[]) => new THREE.Color(c[0], c[1], c[2])

export type HoverPayload = {
  cell: LiveCell
  x: number
  y: number
} | null

type Props = {
  quality: 'high' | 'low'
  reveal: React.RefObject<number>
  onHover: (payload: HoverPayload) => void
  onSelect: (cell: LiveCell) => void
}

export function Core({ quality, reveal, onHover, onSelect }: Props) {
  const group = useRef<THREE.Group>(null!)
  const { size } = useThree()

  // Con celdas grandes esto parece un balón. La malla fina es lo que lo
  // convierte en tejido: se lee como estructura, no como panel.
  const detail = quality === 'high' ? 6 : 4

  /* ---------------------------------------------------------- geometría */

  const { sphere, liveMap, cluster, cellGeo, edgeGeo, pulseGeo } = useMemo(() => {
    const sphere = buildHexSphere(RADIUS, detail)

    // Las siete celdas vivas se anclan a la celda real más próxima a su lat/lon.
    const liveMap = new Map<number, LiveCell>()
    for (const cell of LIVE_CELLS) {
      let idx = cellAtLatLon(sphere.cells, cell.lat, cell.lon)
      // Evitar que dos destinos caigan en la misma celda.
      while (liveMap.has(idx)) idx = sphere.cells[idx].neighbors[0]
      liveMap.set(idx, cell)
    }

    /* Un destino no es una celda suelta: es un racimo. Con la malla fina una
       sola celda sería un punto perdido y un blanco imposible de acertar. El
       núcleo va a tope, la primera corona a media luz y la segunda apenas
       insinuada: así se lee como algo encendido POR DENTRO del tejido. */
    const liveIds = new Map<number, number>()
    const cluster = new Map<number, number>() // celda -> índice del núcleo

    for (const centerIdx of liveMap.keys()) {
      liveIds.set(centerIdx, 1)
      cluster.set(centerIdx, centerIdx)

      // Solo la primera corona: ilumina poco y es la zona de acierto. Si se
      // extiende a la segunda, siete racimos ocupan un cuarto de la esfera,
      // el ratón acierta mires donde mires y la etiqueta acaba señalando una
      // celda que está a cien píxeles del cursor.
      for (const n of sphere.cells[centerIdx].neighbors) {
        if ((liveIds.get(n) ?? 0) < 0.26) liveIds.set(n, 0.26)
        if (!cluster.has(n)) cluster.set(n, centerIdx)
      }
    }

    // El origen de la onda de entrada: la celda de ACADEMIA, ligeramente
    // hacia cámara, para que la colmena nazca "desde delante".
    const origin = sphere.cells[[...liveMap.keys()][0]].normal.clone()

    const cellGeo = buildCellGeometry(sphere, liveIds, origin)
    const edgeGeo = buildEdgeGeometry(sphere, liveIds, origin)

    /* Arcos de información. Van SIEMPRE de un núcleo vivo a otro: si se
       conectan celdas al azar, la escena se llena de líneas que cruzan la
       silueta y parecen arañazos en vez de conexiones. Se generan una vez y
       el shader mueve el pulso por dentro: cero coste por fotograma. */
    const liveIdx = [...liveMap.keys()]
    const arcs: THREE.BufferGeometry[] = []
    const pairs: [number, number][] = []

    for (let i = 0; i < liveIdx.length; i++) {
      pairs.push([liveIdx[i], liveIdx[(i + 1) % liveIdx.length]])
    }

    for (let i = 0; i < pairs.length; i++) {
      const a = sphere.cells[pairs[i][0]]
      const target = sphere.cells[pairs[i][1]]
      if (target.index === a.index) continue

      // Bien por fuera de la superficie: un arco que roza la esfera se lee
      // como una raya sobre ella, no como algo que la sobrevuela.
      const mid = new THREE.Vector3()
        .addVectors(a.center, target.center)
        .multiplyScalar(0.5)
        .normalize()
        .multiplyScalar(RADIUS * (1.34 + pseudoRandom(i * 5.1) * 0.30))

      const curve = new THREE.QuadraticBezierCurve3(a.center.clone(), mid, target.center.clone())
      const tube = new THREE.TubeGeometry(curve, 56, 0.014, 5, false)
      const count = tube.getAttribute('position').count
      tube.setAttribute(
        'aArcId',
        new THREE.Float32BufferAttribute(new Array(count).fill(i), 1)
      )
      arcs.push(tube)
    }

    const pulseGeo = arcs.length ? mergeGeometries(arcs, false)! : new THREE.BufferGeometry()
    arcs.forEach((g) => g.dispose())

    return { sphere, liveMap, cluster, cellGeo, edgeGeo, pulseGeo }
  }, [detail, quality])

  /* --------------------------------------------------------- materiales */

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uRadius: { value: RADIUS },
      uHoverId: { value: -99 },
      uHoverDir: { value: new THREE.Vector3(0, 0, 1) },
      uHoverAmt: { value: 0 },
      uLight: {
        value: new THREE.Vector3(KEY_LIGHT[0], KEY_LIGHT[1], KEY_LIGHT[2]).normalize(),
      },
      uDeep: { value: c3(COLORS.deep) },
      uCold: { value: c3(COLORS.cold) },
      uColdDim: { value: c3(COLORS.coldDim) },
      uWarm: { value: c3(COLORS.warm) },
      uWarmCore: { value: c3(COLORS.warmCore) },
      uFlash: { value: c3(COLORS.flash) },
    }),
    []
  )

  const cellMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: cellVertex,
        fragmentShader: cellFragment,
        uniforms,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.NormalBlending,
      }),
    [uniforms]
  )

  const edgeMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: edgeVertex,
        fragmentShader: edgeFragment,
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [uniforms]
  )

  const pulseMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: pulseVertex,
        fragmentShader: pulseFragment,
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [uniforms]
  )

  /* ------------------------------------------------------------- estado */

  const hoverId = useRef(-99)
  const hoverAmt = useRef(0)
  const hoverDir = useRef(new THREE.Vector3(0, 0, 1))
  const hoveredCell = useRef<LiveCell | null>(null)
  const reported = useRef<LiveCell | null>(null)
  const localPoint = useMemo(() => new THREE.Vector3(), [])
  const projected = useMemo(() => new THREE.Vector3(), [])
  const toCam = useMemo(() => new THREE.Vector3(), [])
  const normalW = useMemo(() => new THREE.Vector3(), [])

  const pick = (point: THREE.Vector3) => {
    localPoint.copy(point)
    group.current.worldToLocal(localPoint)
    const dir = localPoint.normalize()
    const raw = nearestCell(sphere.cells, dir)

    // Si el puntero cae en cualquier celda del racimo, el destino es el
    // núcleo: el blanco útil es el racimo entero, no un hexágono de 20px.
    const core = cluster.get(raw)
    const idx = core ?? raw

    hoverId.current = idx
    hoverDir.current.copy(sphere.cells[idx].normal)
    hoveredCell.current = core !== undefined ? liveMap.get(core) ?? null : null
    document.body.style.cursor = hoveredCell.current ? 'pointer' : 'default'
  }

  const clear = () => {
    hoverId.current = -99
    hoveredCell.current = null
    reported.current = null
    document.body.style.cursor = 'default'
    onHover(null)
  }

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const d = Math.min(delta, 0.05)

    uniforms.uTime.value = t
    uniforms.uReveal.value = reveal.current

    // El hover entra y sale con inercia: nada aparece de golpe.
    const target = hoveredCell.current ? 1 : hoverId.current >= 0 ? 0.55 : 0
    hoverAmt.current += (target - hoverAmt.current) * (1 - Math.pow(0.001, d))
    uniforms.uHoverAmt.value = hoverAmt.current
    uniforms.uHoverId.value = hoverId.current
    uniforms.uHoverDir.value.lerp(hoverDir.current, 1 - Math.pow(0.0005, d))

    // Rotación propia: muy lenta, con una ligera oscilación para que nunca
    // parezca un giro mecánico de demo.
    if (group.current) {
      // Subida en el encuadre, proporcional a lo que se ve: deja sitio al
      // bloque de texto en el tercio inferior. En vertical sube más, porque
      // ahí el texto necesita mucho más aire.
      const cam = state.camera as THREE.PerspectiveCamera
      const halfH = cam.position.length() * Math.tan(THREE.MathUtils.degToRad(cam.fov * 0.5))
      const portrait = state.size.width < state.size.height
      group.current.position.y = halfH * (portrait ? 0.24 : 0.19)

      group.current.rotation.y += d * 0.035
      group.current.rotation.x = Math.sin(t * 0.09) * 0.06
      group.current.rotation.z = Math.cos(t * 0.07) * 0.03
    }

    /* Salida del racimo. `pick` deja hoveredCell en null al pasar a una celda
       apagada, pero eso no llega solo a React: sin este aviso la etiqueta se
       queda pegada en pantalla y parece que toda la esfera es navegable. */
    if (!hoveredCell.current && reported.current) {
      reported.current = null
      onHover(null)
    }

    // Posición en pantalla de la celda activa, para que la etiqueta la siga.
    if (hoveredCell.current && group.current) {
      const idx = hoverId.current
      projected.copy(sphere.cells[idx].center)
      group.current.localToWorld(projected)

      // Si la celda se ha ido al otro lado (la esfera gira sola), la etiqueta
      // se retira. Sin esto queda un rótulo señalando el vacío.
      toCam.subVectors(state.camera.position, projected)
      normalW.copy(sphere.cells[idx].normal).applyQuaternion(group.current.quaternion)
      if (normalW.dot(toCam.normalize()) < 0.06) {
        clear()
        return
      }

      projected.project(state.camera)
      reported.current = hoveredCell.current
      onHover({
        cell: hoveredCell.current,
        x: (projected.x * 0.5 + 0.5) * size.width,
        y: (-projected.y * 0.5 + 0.5) * size.height,
      })
    }
  })

  return (
    <group ref={group}>
      <lineSegments frustumCulled={false}>
        <primitive object={edgeGeo} attach="geometry" />
        <primitive object={edgeMat} attach="material" />
      </lineSegments>

      <mesh frustumCulled={false}>
        <primitive object={cellGeo} attach="geometry" />
        <primitive object={cellMat} attach="material" />
      </mesh>

      <mesh frustumCulled={false}>
        <primitive object={pulseGeo} attach="geometry" />
        <primitive object={pulseMat} attach="material" />
      </mesh>

      {/* Superficie invisible de captura: el hover se resuelve por dirección,
          no por triángulo, así responde igual en toda la celda. */}
      <mesh
        onPointerMove={(e) => {
          e.stopPropagation()
          pick(e.point)
        }}
        onPointerOut={clear}
        onPointerDown={(e) => {
          e.stopPropagation()
          pick(e.point)
          if (hoveredCell.current) onSelect(hoveredCell.current)
        }}
      >
        <sphereGeometry args={[RADIUS * 1.02, 32, 32]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}
