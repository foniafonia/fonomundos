import * as THREE from 'three'

/**
 * Colmena esférica procedural.
 *
 * Se construye como el DUAL de un icosaedro subdividido: cada vértice del
 * icosaedro se convierte en una celda cuyas esquinas son los baricentros de
 * sus triángulos adyacentes. El resultado es un poliedro de Goldberg —
 * hexágonos, más los doce pentágonos que la topología obliga a tener.
 *
 * No hay modelos externos: todo se genera en el arranque.
 */

export type HexCell = {
  index: number
  center: THREE.Vector3
  normal: THREE.Vector3
  corners: THREE.Vector3[]
  neighbors: number[]
}

export type HexSphere = {
  cells: HexCell[]
  radius: number
}

const key = (v: THREE.Vector3) =>
  `${v.x.toFixed(5)}|${v.y.toFixed(5)}|${v.z.toFixed(5)}`

export function buildHexSphere(radius: number, detail: number): HexSphere {
  const source = new THREE.IcosahedronGeometry(1, detail)
  const pos = source.getAttribute('position') as THREE.BufferAttribute

  // 1. Deduplicar vértices (la geometría viene sin índice).
  const uniqueMap = new Map<string, number>()
  const uniqueVerts: THREE.Vector3[] = []
  const faces: [number, number, number][] = []

  const tmp = new THREE.Vector3()
  for (let f = 0; f < pos.count; f += 3) {
    const tri: number[] = []
    for (let k = 0; k < 3; k++) {
      tmp.fromBufferAttribute(pos, f + k).normalize()
      const kk = key(tmp)
      let idx = uniqueMap.get(kk)
      if (idx === undefined) {
        idx = uniqueVerts.length
        uniqueMap.set(kk, idx)
        uniqueVerts.push(tmp.clone())
      }
      tri.push(idx)
    }
    faces.push([tri[0], tri[1], tri[2]])
  }
  source.dispose()

  // 2. Caras adyacentes y vecinos por vértice.
  const adjacentFaces: number[][] = uniqueVerts.map(() => [])
  const neighborSets: Set<number>[] = uniqueVerts.map(() => new Set())

  faces.forEach((face, fi) => {
    for (let k = 0; k < 3; k++) {
      adjacentFaces[face[k]].push(fi)
      neighborSets[face[k]].add(face[(k + 1) % 3])
      neighborSets[face[k]].add(face[(k + 2) % 3])
    }
  })

  // 3. Baricentro de cada triángulo, proyectado a la esfera.
  const faceCentroids = faces.map(([a, b, c]) =>
    new THREE.Vector3()
      .add(uniqueVerts[a])
      .add(uniqueVerts[b])
      .add(uniqueVerts[c])
      .divideScalar(3)
      .normalize()
  )

  // 4. Cada vértice se convierte en celda: ordenamos sus baricentros
  //    angularmente alrededor de la normal para cerrar el polígono.
  const cells: HexCell[] = uniqueVerts.map((v, i) => {
    const normal = v.clone()

    // Base tangente estable en el punto.
    const helper =
      Math.abs(normal.y) < 0.99 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)
    const t1 = new THREE.Vector3().crossVectors(helper, normal).normalize()
    const t2 = new THREE.Vector3().crossVectors(normal, t1).normalize()

    const corners = adjacentFaces[i]
      .map((fi) => faceCentroids[fi])
      .map((c) => {
        const d = new THREE.Vector3().subVectors(c, normal)
        return { c, angle: Math.atan2(d.dot(t2), d.dot(t1)) }
      })
      .sort((a, b) => a.angle - b.angle)
      .map(({ c }) => c.clone().multiplyScalar(radius))

    return {
      index: i,
      center: normal.clone().multiplyScalar(radius),
      normal,
      corners,
      neighbors: [...neighborSets[i]],
    }
  })

  return { cells, radius }
}

/** Celda más cercana a una dirección dada (para el hover por raycast a la esfera). */
export function nearestCell(cells: HexCell[], dir: THREE.Vector3): number {
  let best = -1
  let bestDot = -Infinity
  for (let i = 0; i < cells.length; i++) {
    const d = cells[i].normal.dot(dir)
    if (d > bestDot) {
      bestDot = d
      best = i
    }
  }
  return best
}

/** Índice de la celda más cercana a unas coordenadas lat/lon en grados. */
export function cellAtLatLon(cells: HexCell[], lat: number, lon: number): number {
  const phi = THREE.MathUtils.degToRad(90 - lat)
  const theta = THREE.MathUtils.degToRad(lon)
  const dir = new THREE.Vector3(
    Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta)
  )
  return nearestCell(cells, dir)
}

/**
 * Malla de celdas: un solo BufferGeometry con todas las caras y atributos por
 * celda, para que un shader pueda animarlas individualmente en una sola llamada
 * de dibujo.
 *
 * - aCellId: identidad de la celda (hover, celdas vivas)
 * - aRim:    0 en el centro de la celda, 1 en el borde
 * - aSeed:   aleatorio estable por celda (desfase de respiración)
 * - aWave:   distancia angular al punto de origen, para la entrada radial
 * - aLive:   1 si es una de las siete celdas vivas
 */
export function buildCellGeometry(
  sphere: HexSphere,
  /** Intensidad viva por celda: 1 en el núcleo, menos en su corona. */
  liveIds: Map<number, number>,
  origin: THREE.Vector3,
  inset = 0.93
): THREE.BufferGeometry {
  const positions: number[] = []
  const normals: number[] = []
  const cellIds: number[] = []
  const rims: number[] = []
  const seeds: number[] = []
  const waves: number[] = []
  const lives: number[] = []

  const originDir = origin.clone().normalize()

  for (const cell of sphere.cells) {
    const seed = pseudoRandom(cell.index)
    const wave = Math.acos(THREE.MathUtils.clamp(cell.normal.dot(originDir), -1, 1)) / Math.PI
    const live = liveIds.get(cell.index) ?? 0

    // Centro ligeramente elevado: da volumen a la celda sin extruirla.
    const center = cell.center.clone().multiplyScalar(1.004)
    const inner = cell.corners.map((c) =>
      c.clone().sub(cell.center).multiplyScalar(inset).add(cell.center)
    )

    for (let i = 0; i < inner.length; i++) {
      const a = inner[i]
      const b = inner[(i + 1) % inner.length]

      pushVertex(center, cell.normal, 0)
      pushVertex(a, cell.normal, 1)
      pushVertex(b, cell.normal, 1)
    }

    function pushVertex(v: THREE.Vector3, n: THREE.Vector3, rim: number) {
      positions.push(v.x, v.y, v.z)
      normals.push(n.x, n.y, n.z)
      cellIds.push(cell.index)
      rims.push(rim)
      seeds.push(seed)
      waves.push(wave)
      lives.push(live)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geo.setAttribute('aCellId', new THREE.Float32BufferAttribute(cellIds, 1))
  geo.setAttribute('aRim', new THREE.Float32BufferAttribute(rims, 1))
  geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 1))
  geo.setAttribute('aWave', new THREE.Float32BufferAttribute(waves, 1))
  geo.setAttribute('aLive', new THREE.Float32BufferAttribute(lives, 1))
  geo.computeBoundingSphere()
  return geo
}

/** Contorno de cada celda como segmentos, con los mismos atributos. */
export function buildEdgeGeometry(
  sphere: HexSphere,
  /** Intensidad viva por celda: 1 en el núcleo, menos en su corona. */
  liveIds: Map<number, number>,
  origin: THREE.Vector3,
  inset = 0.93
): THREE.BufferGeometry {
  const positions: number[] = []
  const cellIds: number[] = []
  const seeds: number[] = []
  const waves: number[] = []
  const lives: number[] = []

  const originDir = origin.clone().normalize()

  for (const cell of sphere.cells) {
    const seed = pseudoRandom(cell.index)
    const wave = Math.acos(THREE.MathUtils.clamp(cell.normal.dot(originDir), -1, 1)) / Math.PI
    const live = liveIds.get(cell.index) ?? 0

    const inner = cell.corners.map((c) =>
      c.clone().sub(cell.center).multiplyScalar(inset).add(cell.center).multiplyScalar(1.006)
    )

    for (let i = 0; i < inner.length; i++) {
      const a = inner[i]
      const b = inner[(i + 1) % inner.length]
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z)
      for (let k = 0; k < 2; k++) {
        cellIds.push(cell.index)
        seeds.push(seed)
        waves.push(wave)
        lives.push(live)
      }
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('aCellId', new THREE.Float32BufferAttribute(cellIds, 1))
  geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 1))
  geo.setAttribute('aWave', new THREE.Float32BufferAttribute(waves, 1))
  geo.setAttribute('aLive', new THREE.Float32BufferAttribute(lives, 1))
  geo.computeBoundingSphere()
  return geo
}

export function pseudoRandom(i: number): number {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}
