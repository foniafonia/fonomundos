import type { Parada, Tarea } from './tipos'

/**
 * Ruta de 3 años: 8 paradas en orden fijo.
 *
 * El orden de las paradas y de sus tareas no se toca nunca, ni para
 * «mejorarlo»: lo decide el diseño clínico de la Ruta, no el código.
 */

const NO_CF = 'Es pronunciación, no conciencia fonológica'

function pronunciacion(num: number, sonido: string, ayudaExtra = ''): Tarea {
  const s = sonido.toLocaleLowerCase('es-ES')
  return {
    num, actividadId: 'articulacion', modo: 'acompanada',
    parametros: `Sonido /${s}/ en palabras. ${NO_CF}`,
    ayuda: `Ver el fonogesto y oír el sonido solo antes de cada palabra${ayudaExtra}`,
    config: { sonido },
  }
}

export const PARADAS_3_ANOS: Parada[] = [
  {
    id: 'r3-p1',
    numero: 1,
    nombre: 'Oír y contar palabras',
    objetivo: 'Oír dos palabras y recordarlas en orden. Descubrir que una frase se puede partir en trozos, contarlos y ponerlos en su sitio.',
    tareas: [
      {
        num: 1, actividadId: 'memoria-series', modo: 'solo',
        parametros: 'Dos palabras cada vez; cuatro niveles, cada uno con más dibujos donde elegir',
        ayuda: 'La serie suena dos veces; si sigue costando, se vuelve al nivel más fácil',
        config: { n: 2 },
      },
      {
        num: 2, actividadId: 'contar-palabras', modo: 'solo',
        parametros: 'Frases cortas con dibujo; se puede usar una ficha por cada palabra',
        ayuda: 'Frases muy cortas; el adulto acompaña cada palabra con una palmada',
        config: {},
      },
      {
        num: 3, actividadId: 'ordenar-frase', modo: 'solo',
        parametros: 'Frases cortas; antes de ordenar, se ve la frase bien colocada',
        ayuda: 'La frase bien colocada se queda a la vista todo el rato',
        config: {},
      },
      pronunciacion(4, 'P'),
    ],
    sesionesMinimas: 8,
    repaso: null,
    versionOral: [
      'Recuerda la serie: nombrar dos cosas que haya cerca; el niño las dice o las señala en el mismo orden.',
      'Cuenta las palabras: decir una frase corta y que el niño deje una ficha en la mesa por palabra.',
      'Ordena la frase: con tarjetas de dibujos, colocarlas según la frase que ha oído.',
      'Pronunciación: decir en voz alta cosas que lleven /p/ y que el niño las repita.',
    ],
    aparte: [
      'Mirar un dibujo y contar qué ocurre.',
      'Hacer pequeños encargos con objetos de la clase.',
    ],
  },
  {
    id: 'r3-p2',
    numero: 2,
    nombre: 'Series y frases más largas',
    objetivo: 'Que recordar dos palabras salga solo, y contar las palabras de frases cada vez más largas.',
    tareas: [
      {
        num: 1, actividadId: 'memoria-series', modo: 'solo',
        parametros: 'Dos palabras cada vez; cuatro niveles',
        ayuda: 'La serie suena dos veces; volver al nivel más fácil',
        config: { n: 2 },
      },
      {
        num: 2, actividadId: 'emparejar-oracion', modo: 'solo',
        parametros: 'Se oye una frase y se busca su dibujo',
        ayuda: 'Menos dibujos donde elegir; volver a oír la frase',
        config: {},
        duda: 'Unir frase y dibujo trabaja comprensión más que conciencia fonológica. ¿Se queda en la sesión o pasa a juego aparte?',
      },
      {
        num: 3, actividadId: 'contar-palabras', modo: 'solo',
        parametros: 'Tres niveles, de frases cortas a frases largas, con la frase escrita en pantalla',
        ayuda: 'Volver al nivel anterior y a la frase escrita',
        config: {},
      },
      {
        num: 4, actividadId: 'ordenar-frase', modo: 'solo',
        parametros: 'Frases cortas',
        ayuda: 'Frase bien colocada a la vista; frases de dos palabras',
        config: {},
      },
      pronunciacion(5, 'P'),
      pronunciacion(6, 'K', '; si no sale, seguir con /p/'),
    ],
    sesionesMinimas: 12,
    repaso: { actividadId: 'memoria-series', texto: 'Recuerda la serie de dos palabras.', config: { n: 2 } },
    versionOral: [
      'Recuerda la serie: dos cosas de la clase; el niño las repite.',
      'Frase y dibujo: decir una frase y que el niño señale la tarjeta que le toca.',
      'Cuenta las palabras: una ficha por palabra, alargando las frases poco a poco.',
      'Ordena la frase: tarjetas de dibujos en el orden de la frase.',
      'Pronunciación /p/ y /k/: repetir palabras juntos.',
    ],
    aparte: [
      'Mirar un dibujo y contar qué ocurre.',
    ],
  },
  {
    id: 'r3-p3',
    numero: 3,
    nombre: '¿Qué palabra falta?',
    objetivo: 'Ya no basta con repetir: hay que notar qué palabra ha desaparecido de un grupo de 3, y después de 4. Seguimos contando y ordenando frases.',
    tareas: [
      {
        num: 1, actividadId: 'memoria-quitado', modo: 'solo',
        parametros: 'Grupos de 3 palabras y, después, de 4',
        ayuda: 'Quedarse en grupos de 3; si sigue costando, volver a Recuerda la serie',
        config: { n: 3, nFinal: 4 },
      },
      {
        num: 2, actividadId: 'contar-palabras', modo: 'solo',
        parametros: 'Tres niveles, con la frase escrita',
        ayuda: 'Volver al nivel anterior',
        config: {},
      },
      {
        num: 3, actividadId: 'ordenar-frase', modo: 'solo',
        parametros: 'Frases del nivel 1',
        ayuda: 'Frase bien colocada a la vista',
        config: { juego: 1 },
      },
      pronunciacion(4, 'P'),
      pronunciacion(5, 'K'),
      pronunciacion(6, 'G', '; compararlo con /k/'),
    ],
    sesionesMinimas: 12,
    repaso: { actividadId: 'memoria-series', texto: 'Recuerda la serie de dos palabras.', config: { n: 2 } },
    versionOral: [
      '¿Cuál falta?: poner en la mesa tres cosas (luego cuatro), decir su nombre, taparlas, retirar una y preguntar cuál no está.',
      'Cuenta las palabras: una ficha por palabra.',
      'Ordena la frase: tarjetas en orden.',
      'Pronunciación /p/, /k/ y /g/: repetir palabras juntos.',
    ],
    aparte: [
      'De un grupo de cosas, elegir la que no encaja y explicar por qué; lo importante es la razón que da.',
      'Adivinar un animal a partir de pistas.',
    ],
  },
  {
    id: 'r3-p4',
    numero: 4,
    nombre: 'Faltan palabras en grupos más grandes',
    objetivo: 'Encontrar con más soltura la que ha desaparecido, en grupos de 3 y de 4, y colocar frases un poco más largas.',
    tareas: [
      {
        num: 1, actividadId: 'memoria-quitado', modo: 'solo',
        parametros: 'Grupos de 3 y de 4 palabras',
        ayuda: 'Quedarse en grupos de 3',
        config: { n: 3, nFinal: 4 },
      },
      {
        num: 2, actividadId: 'ordenar-frase', modo: 'solo',
        parametros: 'Frases del nivel 2',
        ayuda: 'Frases del nivel 1, con la frase bien colocada a la vista',
        config: { juego: 2 },
      },
      pronunciacion(3, 'K'),
      pronunciacion(4, 'G'),
      pronunciacion(5, 'D'),
    ],
    sesionesMinimas: 10,
    repaso: { actividadId: 'contar-palabras', texto: 'Cuenta las palabras, nivel 2.', config: { juego: 2 } },
    versionOral: [
      '¿Cuál falta?: con cosas de la clase, retirar una.',
      'Ordena la frase: tarjetas en orden.',
      'Pronunciación /k/, /g/ y /d/: repetir palabras juntos.',
    ],
    aparte: [
      'Inventar una frase mirando un dibujo.',
      'Explicar para qué sirven cosas de casa.',
      'Adivinar cosas de casa a partir de pistas.',
      'Hacer pequeños encargos siguiendo instrucciones.',
    ],
  },
  {
    id: 'r3-p5',
    numero: 5,
    nombre: 'Grupos de cuatro palabras',
    objetivo: 'Encontrar sin ayuda la que ha desaparecido de un grupo de 4 y colocar frases con más piezas.',
    tareas: [
      {
        num: 1, actividadId: 'memoria-quitado', modo: 'solo',
        parametros: 'Grupos de 3 y de 4 palabras',
        ayuda: 'Quedarse en grupos de 3',
        config: { n: 3, nFinal: 4 },
      },
      {
        num: 2, actividadId: 'ordenar-frase', modo: 'solo',
        parametros: 'Frases del nivel 3',
        ayuda: 'Frases del nivel 2',
        config: { juego: 3 },
      },
      pronunciacion(3, 'D'),
      pronunciacion(4, 'T', '; compararlo con /d/'),
    ],
    sesionesMinimas: 8,
    repaso: { actividadId: 'contar-palabras', texto: 'Cuenta las palabras, nivel 3.', config: { juego: 3 } },
    versionOral: [
      '¿Cuál falta?: cuatro cosas, retirar una.',
      'Ordena la frase: tarjetas en orden.',
      'Pronunciación /d/ y /t/: repetir palabras juntos.',
    ],
    aparte: [
      'Inventar frases mirando dibujos.',
      'De un grupo de cosas, elegir la que no encaja y explicar por qué.',
      'Comprender frases cortas.',
      'Adivinar prendas de ropa a partir de pistas.',
    ],
  },
  {
    id: 'r3-p6',
    numero: 6,
    nombre: '¿Qué palabra se ha añadido?',
    objetivo: 'Al revés que antes: notar la palabra nueva que se ha colado en un grupo de 2 o de 3.',
    tareas: [
      {
        num: 1, actividadId: 'memoria-anadido', modo: 'solo',
        parametros: 'Grupos de 2 con una más y de 3 con una más',
        ayuda: 'Quedarse en 2 con una más; si sigue costando, volver a ¿Cuál falta? con 3',
        config: { n: 2, nFinal: 3 },
        duda: 'El diseño repite dos bloques de 3 con una más. ¿El segundo debería ser 4 con una más?',
      },
      {
        num: 2, actividadId: 'ordenar-frase', modo: 'solo',
        parametros: 'Frases del nivel 4',
        ayuda: 'Frases del nivel 3',
        config: { juego: 4 },
      },
      pronunciacion(3, 'T'),
      pronunciacion(4, 'L'),
    ],
    sesionesMinimas: 8,
    repaso: { actividadId: 'memoria-quitado', texto: '¿Cuál falta?, con grupos de 4.', config: { n: 4 } },
    versionOral: [
      '¿Cuál se ha añadido?: decir el nombre de dos o tres cosas, taparlas, poner una más y preguntar cuál es la nueva.',
      'Ordena la frase: tarjetas en orden.',
      'Pronunciación /t/ y /l/: repetir palabras juntos.',
    ],
    aparte: [
      'Inventar frases mirando dibujos.',
      'Buscar qué cosas van juntas y explicar el motivo.',
      'Hacer pequeños encargos siguiendo instrucciones.',
      'Pensar qué le hace falta a un personaje en una situación.',
    ],
  },
  {
    id: 'r3-p7',
    numero: 7,
    nombre: 'Palabras dentro de palabras y primeras rimas',
    objetivo: 'Mirar dentro de las palabras: unir dos para formar una nueva, quitar un trozo y ver qué queda, y empezar a oír cuándo dos palabras terminan igual.',
    tareas: [
      {
        num: 1, actividadId: 'compuestas-suma', modo: 'solo',
        parametros: 'Unir dos palabras para formar una nueva; tres niveles',
        ayuda: 'Nivel 1, con los dibujos de las dos palabras delante',
        config: {},
      },
      {
        num: 2, actividadId: 'compuestas-resta', modo: 'solo',
        parametros: 'Quitar un trozo a una palabra formada por dos y decir lo que queda; cuatro niveles',
        ayuda: 'Nivel anterior; si hace falta, volver a Junta dos palabras',
        config: {},
      },
      {
        num: 3, actividadId: 'rima-buscar', modo: 'solo',
        parametros: 'Elegir, entre varias, la que termina igual que la palabra modelo',
        ayuda: 'Solo dos opciones; volver a oír el final de la modelo',
        config: {},
      },
      {
        num: 4, actividadId: 'rima-buscar', modo: 'solo',
        parametros: 'Formar parejas que terminan igual',
        ayuda: 'Menos parejas; volver a oírlas',
        config: {},
        duda: 'Formar parejas que terminan igual no tiene juego propio: está como Busca la rima con parejas. ¿Basta o hace falta un juego nuevo?',
      },
      pronunciacion(5, 'K'),
      pronunciacion(6, 'G'),
      pronunciacion(7, 'D'),
      pronunciacion(8, 'F'),
    ],
    sesionesMinimas: 16,
    repaso: { actividadId: 'memoria-anadido', texto: '¿Cuál se ha añadido?, con grupos de 3.', config: { n: 3 } },
    versionOral: [
      'Junta dos palabras: el adulto dice dos palabras sueltas y el niño las une en una.',
      'Quita una palabra: el adulto dice una palabra hecha de dos, le quita un trozo y el niño dice qué queda.',
      'Busca la rima: el adulto dice una palabra modelo y otras dos; el niño elige la que acaba igual.',
      'Parejas que terminan igual: tarjetas a la vista, juntar las que suenan igual al final.',
      'Pronunciación /k/, /g/, /d/ y /f/: repetir palabras juntos.',
    ],
    aparte: [
      'Buscar qué cosas van juntas y explicar el motivo.',
      'Hacer pequeños encargos siguiendo instrucciones.',
      'Pensar qué le hace falta a un personaje en una situación.',
    ],
  },
  {
    id: 'r3-p8',
    numero: 8,
    nombre: 'Juntar, quitar y completar rimas',
    objetivo: 'Unir y quitar trozos de palabras con soltura, y pasar de notar que dos palabras terminan igual a encontrar la que falta para que terminen igual.',
    tareas: [
      {
        num: 1, actividadId: 'compuestas-suma', modo: 'solo',
        parametros: 'Tres niveles',
        ayuda: 'Nivel 1, con dibujos',
        config: {},
      },
      {
        num: 2, actividadId: 'compuestas-resta', modo: 'solo',
        parametros: 'Cuatro niveles',
        ayuda: 'Nivel anterior',
        config: {},
      },
      {
        num: 3, actividadId: 'rima-buscar', modo: 'solo',
        parametros: 'Separar las que terminan como la palabra modelo de las que no',
        ayuda: 'Solo dos opciones; volver a oír el final',
        config: {},
        duda: 'Separar las que terminan igual está como Busca la rima; falta decidir cómo se juega.',
      },
      {
        num: 4, actividadId: 'rima-completar', modo: 'solo',
        parametros: 'Elegir la palabra que falta para que la frase acabe igual; tres niveles',
        ayuda: 'Solo dos opciones; si cuesta, volver a Busca la rima',
        config: {},
      },
      {
        num: 5, actividadId: 'compuestas-resta', modo: 'solo',
        parametros: 'Cuatro niveles',
        ayuda: 'Nivel anterior',
        config: {},
        duda: 'Quita una palabra aparece dos veces en esta parada. ¿Se deja una sola?',
      },
      pronunciacion(6, 'F'),
      pronunciacion(7, 'L'),
      pronunciacion(8, 'S'),
      pronunciacion(9, 'CH', '; compararlo con /s/'),
    ],
    sesionesMinimas: 18,
    repaso: { actividadId: 'rima-buscar', texto: 'Busca la rima.', config: {} },
    versionOral: [
      'Junta dos palabras y Quita una palabra: como en la parada 7, con palabras de la clase.',
      'Busca la rima: el adulto dice una palabra modelo y luego otras; cuando una acaba igual, el niño aplaude.',
      'Completa la rima: el adulto empieza una rima corta y se detiene; el niño elige cómo acaba.',
      'Pronunciación /f/, /l/, /s/ y /ch/: repetir palabras juntos.',
    ],
    aparte: [
      'Comprender frases.',
      'Escuchar cuentos cortos y responder a preguntas.',
    ],
  },
]

/** Dudas del diseño que no cuelgan de una tarea concreta. */
export const DUDAS_GENERALES = [
  'Paradas 4 a 6: inventar frases queda fuera de la sesión porque es producir. ¿Debería entrar como juego acompañado?',
  'Paradas 7 y 8: la pronunciación no trae palabras propias. ¿Se usan las de paradas anteriores?',
]
