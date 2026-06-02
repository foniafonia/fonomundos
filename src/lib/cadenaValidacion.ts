import type { Cadena } from '../data/guia'

// ============================================================================
// Validación del solucionario de cadenas (Actividad 3) + feedback guiado.
//
// La fuente de verdad es la SECUENCIA de la cadena (el solucionario visual del
// PDF). validarEnlaceCadena() trata la secuencia como una "base de datos de
// pares correctos": un enlace (desde → hacia) es válido solo si `hacia` es el
// elemento que sigue a `desde` en la secuencia.
//
// Los BORDES (fonema inicial/final por imagen) se usan SOLO para la pista
// guiada ("busca la palabra que empieza por…"). NO se usan como validador duro
// porque el propio solucionario visual incumple la regla en algún enlace.
// ============================================================================

export interface ValidacionEnlace {
  cadenaId: string
  desde: string
  hacia: string
  esperado: string | null
  correcto: boolean
  posicionEsperada: number
}

export function validarEnlaceCadena(cadena: Cadena, desde: string, hacia: string): ValidacionEnlace {
  const pos = cadena.secuencia.indexOf(desde)
  const esperado = pos >= 0 ? cadena.secuencia[pos + 1] ?? null : null
  return {
    cadenaId: cadena.id,
    desde,
    hacia,
    esperado,
    correcto: esperado !== null && hacia === esperado,
    posicionEsperada: pos + 1,
  }
}

export interface BordeFonema {
  ini: string
  fin: string
}

// ID_Fonema_Inicial / ID_Fonema_Final por imagen (superset de ambas versiones
// del solucionario, por robustez ante cambios en el corpus).
export const BORDES_FONEMA: Record<string, BordeFonema> = {
  SOL: { ini: 'S', fin: 'L' }, LAZO: { ini: 'L', fin: 'O' }, OSO: { ini: 'O', fin: 'O' },
  OVEJA: { ini: 'O', fin: 'A' }, LIMÓN: { ini: 'L', fin: 'N' }, AVESTRUZ: { ini: 'A', fin: 'Z' },
  SAL: { ini: 'S', fin: 'L' }, ÁRBOL: { ini: 'A', fin: 'L' }, LUPA: { ini: 'L', fin: 'A' },
  OJOS: { ini: 'O', fin: 'S' }, LATA: { ini: 'L', fin: 'A' }, SERPIENTE: { ini: 'S', fin: 'E' },
  EMBARAZADA: { ini: 'E', fin: 'A' }, RELOJ: { ini: 'R', fin: 'J' }, NARIZ: { ini: 'N', fin: 'Z' },
  OCHO: { ini: 'O', fin: 'O' }, AVIÓN: { ini: 'A', fin: 'N' }, ORUGA: { ini: 'O', fin: 'A' },
  JAULA: { ini: 'J', fin: 'A' }, AMBULANCIA: { ini: 'A', fin: 'A' }, SIETE: { ini: 'S', fin: 'E' },
  MESA: { ini: 'M', fin: 'A' }, NIEVE: { ini: 'N', fin: 'E' }, ESTRELLA: { ini: 'E', fin: 'A' },
  ÁLBUM: { ini: 'A', fin: 'M' }, MOTO: { ini: 'M', fin: 'O' }, ORO: { ini: 'O', fin: 'O' },
  CHAMPÚ: { ini: 'CH', fin: 'U' }, UVAS: { ini: 'U', fin: 'S' }, SIRENA: { ini: 'S', fin: 'A' },
  AGUA: { ini: 'A', fin: 'A' }, AZUL: { ini: 'A', fin: 'L' }, LECHE: { ini: 'L', fin: 'E' },
  GNOMO: { ini: 'G', fin: 'O' }, ESPEJO: { ini: 'E', fin: 'O' }, OREJA: { ini: 'O', fin: 'A' },
  ZAPATILLAS: { ini: 'Z', fin: 'S' }, NIDO: { ini: 'N', fin: 'O' }, ZORRO: { ini: 'Z', fin: 'O' },
  AZÚCAR: { ini: 'A', fin: 'R' }, RATÓN: { ini: 'R', fin: 'N' }, ELEFANTE: { ini: 'E', fin: 'E' },
  OGRO: { ini: 'O', fin: 'O' },
}

export function bordeDe(palabra: string): BordeFonema | undefined {
  return BORDES_FONEMA[palabra.toUpperCase()]
}
