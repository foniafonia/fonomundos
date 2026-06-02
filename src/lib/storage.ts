import type { Paciente, Sesion } from '../types'
import { uid } from './id'

const K_PACIENTES = 'fonomundos.pacientes'
const K_SESIONES = 'fonomundos.sesiones'
const K_ACTIVO = 'fonomundos.pacienteActivo'

function leer<T>(clave: string, def: T): T {
  try {
    const raw = localStorage.getItem(clave)
    return raw ? (JSON.parse(raw) as T) : def
  } catch {
    return def
  }
}

function escribir(clave: string, valor: unknown) {
  localStorage.setItem(clave, JSON.stringify(valor))
}

// ---------- Pacientes ----------
export function getPacientes(): Paciente[] {
  return leer<Paciente[]>(K_PACIENTES, [])
}

export function guardarPaciente(p: Paciente) {
  const lista = getPacientes()
  const i = lista.findIndex((x) => x.id === p.id)
  if (i >= 0) lista[i] = p
  else lista.push(p)
  escribir(K_PACIENTES, lista)
}

export function crearPaciente(datos: Partial<Paciente>): Paciente {
  const p: Paciente = {
    id: uid(),
    nombre: datos.nombre || 'Sin nombre',
    edad: datos.edad || '',
    curso: datos.curso || '',
    diagnostico: datos.diagnostico || '',
    observaciones: datos.observaciones || '',
    objetivos: datos.objetivos || '',
    creado: Date.now(),
    itinerario: datos.itinerario ?? 'prevencion',
    antecFamiliares: datos.antecFamiliares ?? false,
    lenguaMaterna: datos.lenguaMaterna ?? 'español',
    deficitSensorial: datos.deficitSensorial ?? false,
    monedas: 0,
    xp: 0,
  }
  guardarPaciente(p)
  return p
}

export function getPacienteActivoId(): string | null {
  return leer<string | null>(K_ACTIVO, null)
}

export function setPacienteActivo(id: string | null) {
  escribir(K_ACTIVO, id)
}

// ---------- Sesiones ----------
export function getSesiones(pacienteId?: string): Sesion[] {
  const todas = leer<Sesion[]>(K_SESIONES, [])
  return pacienteId ? todas.filter((s) => s.pacienteId === pacienteId) : todas
}

export function guardarSesion(s: Sesion) {
  const todas = leer<Sesion[]>(K_SESIONES, [])
  todas.push(s)
  escribir(K_SESIONES, todas)
}
