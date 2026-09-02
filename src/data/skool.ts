/**
 * La puerta a la comunidad. Un solo destino en toda la app.
 *
 * Todo el texto vive aquí a propósito. El día que la comunidad pase a ser de
 * pago, el mismo botón en la misma pantalla deja de ser una invitación y pasa
 * a ser un muro: cambia lo que hay que decir, no dónde se dice. Se cambia
 * ACCESO y se actualizan las seis pantallas de golpe.
 *
 * No se dice "gratis para siempre" en ninguna parte. FonoMundos está abierto
 * hoy; prometer el futuro es una promesa que puede tocar romper.
 */

export const SKOOL_URL = 'https://www.skool.com/logopedia-7339/about'

/** Su nombre real. Es COLMENIA: la comunidad no es otra cosa, es su casa. */
export const NOMBRE = 'Colmen-ia'

/** Cambia esto el día del cierre. Es lo único que hay que tocar. */
export const ACCESO: 'abierto' | 'pago' = 'abierto'

const TEXTOS = {
  abierto: {
    /** Etiqueta del botón. Corta: se lee de un vistazo. */
    boton: `Entrar en ${NOMBRE}`,
    /** Debajo del botón. El argumento, no el adorno. */
    pie: 'Ahora está abierta.',
  },
  pago: {
    boton: `Ver ${NOMBRE}`,
    pie: 'Los miembros tienen el juego y todo lo que se va añadiendo.',
  },
} as const

export const SKOOL = TEXTOS[ACCESO]

/**
 * Qué se dice en cada sitio. El gancho no es "desbloquea": es que esto lo ha
 * hecho un profesional en ejercicio, sin equipo de desarrollo, y eso se aprende.
 */
export const GANCHO: Record<string, string> = {
  feedback: 'Lo que acabas de escribir entra en la lista de mejoras. Dentro se cuenta cómo se decide qué se construye y cómo montar tus propias herramientas.',
  comunidad: 'Logopedas, maestros, PT, AL y orientadores usando IA con criterio clínico. FonoMundos salió de ahí.',
  'que-es': 'Lo ha construido un profesional en ejercicio, no una empresa de software. Cómo se hace se cuenta dentro.',
  entrada: 'Hecho por profesionales que lo usan en consulta.',
}
