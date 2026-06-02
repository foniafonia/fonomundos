import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = (url && key)
  ? createClient(url, key)
  : null

export function supabaseActivo(): boolean {
  return supabase !== null
}

// Tipos de la base de datos
export interface DBProfesional {
  id: string
  email: string
  nombre?: string
  especialidad?: string
  centro?: string
  creado_at?: string
}

export interface DBPaciente {
  id: string
  profesional_id: string
  codigo: string
  edad?: string
  curso?: string
  diagnostico?: string
  observaciones?: string
  objetivos?: string
  itinerario?: string
  antec_familiares?: boolean
  lengua_materna?: string
  deficit_sensorial?: boolean
  monedas?: number
  xp?: number
  creado_at?: string
}

export interface DBSesion {
  id: string
  paciente_id: string
  profesional_id: string
  inicio: number
  fin: number
  modo_evaluacion?: boolean
  notas_logopeda?: string
  resultados: object[]
  creado_at?: string
}
