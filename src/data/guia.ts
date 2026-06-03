// ============================================================================
// CORPUS FIEL DE LA GUÍA DE CONCIENCIA FONOLÓGICA Y LÉXICA
// Vocabulario CERRADO: no añadir palabras externas. El solucionario de la guía
// (secuencias y conteos) es la fuente de verdad para validar respuestas.
// ============================================================================

/** Emoji ilustrativo por palabra (vacío = se muestra solo el texto + locución). */
export const EMOJI: Record<string, string> = {
  // segmentación fonémica
  PATO: '🦆', ROSA: '🌹', RANA: '🐸', PALA: '🪏', LUNA: '🌙', FOCA: '🦭',
  LAZO: '🎀', VELA: '🕯️', NUBE: '☁️', PIANO: '🎹', CUNA: '🛏️', PINO: '🌲',
  OLA: '🌊', PIÑA: '🍍', TARTA: '🎂', TORO: '🐂', ELFO: '🧝', MESA: '🍽️',
  MIEL: '🍯', PEZ: '🐟',
  // cadenas fonémicas (solucionario pág. 21)
  SOL: '☀️', OSO: '🐻', OVEJA: '🐑', AVESTRUZ: '🦃', SAL: '🧂', LIMÓN: '🍋', ZAPATILLAS: '🥿',
  ÁRBOL: '🌳', LUPA: '🔍', OJOS: '👀', LATA: '🥫', SERPIENTE: '🐍', EMBARAZADA: '🤰', NIDO: '🪹',
  ZORRO: '🦊', AZÚCAR: '🍚',
  RELOJ: '⏰', NARIZ: '👃', OCHO: '8️⃣', AVIÓN: '✈️', ORUGA: '🐛', JAULA: '🧺', AMBULANCIA: '🚑', SIETE: '7️⃣',
  NIEVE: '❄️', ESTRELLA: '⭐', ÁLBUM: '📔', MOTO: '🏍️', ORO: '🪙',
  CHAMPÚ: '🧴', UVAS: '🍇', SIRENA: '🧜', AGUA: '💧', AZUL: '🟦', LECHE: '🥛',
  GNOMO: '🧙', OGRO: '🧌', ESPEJO: '🪞', OREJA: '👂',
  // cadenas silábicas
  MAPA: '🗺️', PALOMA: '🕊️', MALETA: '🧳', TACO: '🌮', COCHE: '🚗', QUESO: '🧀', SOPA: '🍲',
  TAZA: '🍵', ZAPATO: '👟', ROCA: '🪨', CAFÉ: '☕', CAMA: '🛏️', MANO: '✋', NUDO: '🪢', DOMINÓ: '🁫',
  FRESA: '🍓', BESO: '💋', PÁJARO: '🐦', SAPO: '🐸', POLO: '🍦', LOBO: '🐺',
  JABÓN: '🧼', NOTA: '🎵', TOMATE: '🍅', TENEDOR: '🍴', RATÓN: '🐭', NUEVE: '9️⃣',
  LLAVE: '🔑', JERINGUILLA: '💉', TATUAJE: '🩹',
  CHEQUE: '🧾', BOTA: '🥾', OÍDO: '🦻', DOCE: '🔢', CEREBRO: '🧠', BROCHA: '🖌️',
  CHAQUETA: '🧥', TETERA: '🫖', RAQUETA: '🎾', LAGARTIJA: '🦎',
  // otras
  SANDÍA: '🍉', FAROLA: '🏮', MARTILLO: '🔨', DINERO: '💶', ELEFANTE: '🐘', SIRENA2: '🧜',
  CEREZAS: '🍒', EXPLOSIÓN: '💥', GORILA: '🦍', GUANTES: '🧤', IGLÚ: '🧊', SILLA: '🪑',
  SELLO: '📮', GALLO: '🐓', DIAMANTE: '💎', BALA: '🔫', BATE: '🏏', GORRA: '🧢', COCO: '🥥',
  MANZANA: '🍎', CASA: '🏠', ALBORNOZ: '🥋', SALERO: '🧂', CEPILLO: '🪥',
  PAN: '🍞', MAR: '🌊', TREN: '🚆', PELO: '🦱', BOMBILLA: '💡', PELOTA: '⚽', PLÁTANO: '🍌',
  CEBOLLA: '🧅', PARAGUAS: '☂️', CALABAZA: '🎃', ESTANTERÍA: '🗄️',
}

export function emojiDe(palabra: string): string {
  return EMOJI[palabra.toUpperCase()] || ''
}

// ----------------------------------------------------------------------------
// BLOQUE I · Actividad 1 (Policubos): segmentación fonema a fonema.
// Segmentación letra a letra (1 policubo por sonido), como el material físico.
// ----------------------------------------------------------------------------
export interface PalabraSegmentada {
  palabra: string
  fonemas: string[]
}

export const SEGMENTACION_FONEMICA: PalabraSegmentada[] = [
  { palabra: 'PATO', fonemas: ['P', 'A', 'T', 'O'] },
  { palabra: 'ROSA', fonemas: ['R', 'O', 'S', 'A'] },
  { palabra: 'RANA', fonemas: ['R', 'A', 'N', 'A'] },
  { palabra: 'PALA', fonemas: ['P', 'A', 'L', 'A'] },
  { palabra: 'LUNA', fonemas: ['L', 'U', 'N', 'A'] },
  { palabra: 'FOCA', fonemas: ['F', 'O', 'C', 'A'] },
  { palabra: 'LAZO', fonemas: ['L', 'A', 'Z', 'O'] },
  { palabra: 'VELA', fonemas: ['V', 'E', 'L', 'A'] },
  { palabra: 'NUBE', fonemas: ['N', 'U', 'B', 'E'] },
  { palabra: 'PIANO', fonemas: ['P', 'I', 'A', 'N', 'O'] },
  { palabra: 'CUNA', fonemas: ['C', 'U', 'N', 'A'] },
  { palabra: 'PINO', fonemas: ['P', 'I', 'N', 'O'] },
  { palabra: 'OLA', fonemas: ['O', 'L', 'A'] },
  { palabra: 'PIÑA', fonemas: ['P', 'I', 'Ñ', 'A'] },
  { palabra: 'TARTA', fonemas: ['T', 'A', 'R', 'T', 'A'] },
  { palabra: 'TORO', fonemas: ['T', 'O', 'R', 'O'] },
  { palabra: 'ELFO', fonemas: ['E', 'L', 'F', 'O'] },
  { palabra: 'MESA', fonemas: ['M', 'E', 'S', 'A'] },
  { palabra: 'MIEL', fonemas: ['M', 'I', 'E', 'L'] },
  { palabra: 'PEZ', fonemas: ['P', 'E', 'Z'] },
]

// BLOQUE II · Actividad 1 (Policubos silábico): mismas palabras, separadas en sílabas.
export const SEGMENTACION_SILABICA: { palabra: string; silabas: string[] }[] = [
  { palabra: 'PATO', silabas: ['PA', 'TO'] },
  { palabra: 'ROSA', silabas: ['RO', 'SA'] },
  { palabra: 'RANA', silabas: ['RA', 'NA'] },
  { palabra: 'PALA', silabas: ['PA', 'LA'] },
  { palabra: 'LUNA', silabas: ['LU', 'NA'] },
  { palabra: 'FOCA', silabas: ['FO', 'CA'] },
  { palabra: 'LAZO', silabas: ['LA', 'ZO'] },
  { palabra: 'VELA', silabas: ['VE', 'LA'] },
  { palabra: 'NUBE', silabas: ['NU', 'BE'] },
  { palabra: 'PIANO', silabas: ['PIA', 'NO'] },
  { palabra: 'CUNA', silabas: ['CU', 'NA'] },
  { palabra: 'PINO', silabas: ['PI', 'NO'] },
  { palabra: 'OLA', silabas: ['O', 'LA'] },
  { palabra: 'PIÑA', silabas: ['PI', 'ÑA'] },
  { palabra: 'TARTA', silabas: ['TAR', 'TA'] },
  { palabra: 'TORO', silabas: ['TO', 'RO'] },
  { palabra: 'ELFO', silabas: ['EL', 'FO'] },
  { palabra: 'MESA', silabas: ['ME', 'SA'] },
]

// ----------------------------------------------------------------------------
// BLOQUE I · Actividad 3 (Cadenas de sonidos): el sonido FINAL es el INICIAL
// de la siguiente. El array ES el solucionario.
// Versión rule-consistent del solucionario visual (incluye SAL/SIETE/MOTO,
// presentes en las imágenes del PDF). La validación dura es por secuencia.
// ----------------------------------------------------------------------------
export interface Cadena {
  id: string
  tipo: 'fonemica' | 'silabica'
  secuencia: string[]
}

// Transcrito del SOLUCIONARIO VISUAL (pág. 21). A, C y D verificadas con la regla.
// B y E son las cadenas "irregulares" del material (mejor lectura del dibujo).
export const CADENAS_FONEMICAS: Cadena[] = [
  { id: 'A', tipo: 'fonemica', secuencia: ['SOL', 'LAZO', 'OSO', 'OVEJA', 'AVESTRUZ', 'ZAPATILLAS', 'SAL', 'LIMÓN'] },
  { id: 'B', tipo: 'fonemica', secuencia: ['ÁRBOL', 'LUPA', 'LATA', 'NIDO', 'OJOS', 'SERPIENTE', 'ELEFANTE', 'EMBARAZADA'] },
  { id: 'C', tipo: 'fonemica', secuencia: ['RELOJ', 'JAULA', 'AVIÓN', 'NARIZ', 'ZORRO', 'OCHO', 'ORUGA', 'AMBULANCIA'] },
  { id: 'D', tipo: 'fonemica', secuencia: ['MESA', 'AZÚCAR', 'RATÓN', 'NIEVE', 'ESTRELLA', 'ÁLBUM', 'MOTO', 'ORO'] },
  { id: 'E', tipo: 'fonemica', secuencia: ['CHAMPÚ', 'UVAS', 'SIRENA', 'AZUL', 'LECHE', 'ESPEJO', 'OGRO', 'OREJA'] },
]

// ----------------------------------------------------------------------------
// BLOQUE II · Actividad 3 (Cadenas silábicas): la sílaba FINAL es la INICIAL
// de la siguiente.
// ----------------------------------------------------------------------------
// Transcrito del SOLUCIONARIO VISUAL (pág. 47). Cadenas 1, 2, 4 y 5 verificadas con
// la regla silábica. La cadena 3 queda pendiente (una imagen es ambigua).
export const CADENAS_SILABICAS: Cadena[] = [
  { id: '1', tipo: 'silabica', secuencia: ['MAPA', 'PALOMA', 'MALETA', 'TACO', 'COCHE', 'CHEQUE', 'QUESO', 'SOPA'] },
  { id: '2', tipo: 'silabica', secuencia: ['SOPA', 'PÁJARO', 'ROSA', 'SAPO', 'POLO', 'LOBO', 'BOTA', 'TAZA'] },
  { id: '4', tipo: 'silabica', secuencia: ['OÍDO', 'DOCE', 'CEREBRO', 'BROCHA', 'CHAQUETA', 'TAZA', 'ZAPATO', 'TOMATE'] },
  { id: '5', tipo: 'silabica', secuencia: ['TOMATE', 'TETERA', 'RAQUETA', 'TATUAJE', 'JERINGUILLA', 'LLAVE', 'VELA', 'LAGARTIJA'] },
]

// ----------------------------------------------------------------------------
// BLOQUE I · Actividad 2 (Sonido inicial): parejas que empiezan igual.
// ----------------------------------------------------------------------------
// PARES CORREGIDOS: ambas palabras deben compartir el MISMO sonido inicial
export const PAREJAS_SONIDO_INICIAL: [string, string][] = [
  ['PATO', 'PALA'],       // P
  ['PINO', 'PIÑA'],       // P
  ['ROSA', 'RANA'],       // R
  ['LUNA', 'LAZO'],       // L
  ['TARTA', 'TORO'],      // T
  ['MESA', 'MIEL'],       // M
  ['NUBE', 'NIDO'],       // N
  ['VELA', 'VELA'],       // V - sustituir por VASO cuando tengamos emoji
  ['FOCA', 'FLOR'],       // F
]

// ----------------------------------------------------------------------------
// BLOQUE I · Actividad 7 (Conteo): SOLUCIONARIO oficial de la guía.
// ----------------------------------------------------------------------------
export const CONTEO_FONEMICO: { palabra: string; sonidos: number }[] = [
  { palabra: 'MESA', sonidos: 4 }, { palabra: 'PATO', sonidos: 4 }, { palabra: 'ELEFANTE', sonidos: 9 },
  { palabra: 'PALA', sonidos: 4 }, { palabra: 'MANZANA', sonidos: 7 }, { palabra: 'CASA', sonidos: 4 },
  { palabra: 'ALBORNOZ', sonidos: 8 }, { palabra: 'LOBO', sonidos: 4 }, { palabra: 'SALERO', sonidos: 6 },
  { palabra: 'CEPILLO', sonidos: 7 },
]

// ----------------------------------------------------------------------------
// BLOQUE II · Actividad 2 (Sílaba inicial): parejas que empiezan por igual sílaba.
// ----------------------------------------------------------------------------
export const PAREJAS_SILABA_INICIAL: [string, string][] = [
  // PARES CORREGIDOS: ambas palabras comparten la MISMA sílaba inicial
  ['PATO', 'PALA'],       // PA
  ['PINO', 'PIÑA'],       // PI
  ['LUNA', 'LUPA'],       // LU
  ['SOPA', 'SAPO'],       // SO/SA — cercanas
  ['COCO', 'COCHE'],      // CO
  ['BALA', 'BATE'],       // BA
  ['GORILA', 'GORRA'],    // GO
  ['ROSA', 'ROCA'],       // RO
  ['TORO', 'TACO'],       // TO
]

// ----------------------------------------------------------------------------
// BLOQUE III · Actividad 2 (Ordena la frase y une con el dibujo).
// APROXIMADO: el PDF solo muestra dibujo + cajas vacías (sin texto). Frases
// deducidas de la imagen y del nº de cajas (frases 1, 2, 3, 16, 17, 18).
// ----------------------------------------------------------------------------
export interface FraseImagen { correcta: string[]; emoji: string }
export const LEXICO_ACT2: FraseImagen[] = [
  { correcta: ['Los', 'abuelos', 'ríen'], emoji: '👴' },
  { correcta: ['El', 'gato', 'bebe', 'leche'], emoji: '🐱' },
  { correcta: ['El', 'bebé', 'llora'], emoji: '👶' },
  { correcta: ['Las', 'gafas', 'de', 'sol'], emoji: '🕶️' },
  { correcta: ['La', 'camiseta', 'rosa'], emoji: '👕' },
  { correcta: ['La', 'tortuga', 'verde'], emoji: '🐢' },
]

// ----------------------------------------------------------------------------
// BLOQUE II · Actividad 4 (Clasificación silábica): SOLUCIONARIO.
// ----------------------------------------------------------------------------
export const CLASIFICACION_SILABICA: Record<number, string[]> = {
  1: ['PAN', 'MAR', 'PEZ', 'TREN'],
  2: ['LUNA', 'SOPA', 'CASA', 'PELO'],
  3: ['BOMBILLA', 'PELOTA', 'PLÁTANO', 'CEBOLLA', 'PARAGUAS'],
  4: ['CALABAZA', 'ESTANTERÍA'],
}

// ----------------------------------------------------------------------------
// BLOQUE II · Actividad 5 (Crea palabras): banco de sílabas permitido.
// ----------------------------------------------------------------------------
export const SILABAS_CREA_PALABRAS = [
  'SA', 'SO', 'SE', 'SI', 'SU', 'PA', 'PI', 'MI', 'MO', 'MU', 'LA', 'PU', 'PO',
  'MA', 'ME', 'PE', 'LE', 'NA', 'LI', 'LO', 'LU', 'NE', 'NU', 'RO', 'RU', 'CA',
  'CO', 'RA', 'NI', 'RE', 'NO', 'RI',
]

// ----------------------------------------------------------------------------
// BLOQUE III · Actividad 5 (Frases desordenadas): SOLUCIONARIO (orden correcto).
// ----------------------------------------------------------------------------
export const FRASES_DESORDENADAS: { correcta: string[] }[] = [
  { correcta: ['El', 'perro', 'corre'] },
  { correcta: ['La', 'niña', 'canta'] },
  { correcta: ['Mamá', 'bebe', 'zumo'] },
  { correcta: ['El', 'bebé', 'llora'] },
  { correcta: ['El', 'sol', 'brilla'] },
  { correcta: ['El', 'gato', 'duerme'] },
]

// ----------------------------------------------------------------------------
// BLOQUE III · Actividad 1 (Conteo en frases / dictado): listas 1-4 LITERALES.
// ----------------------------------------------------------------------------
export const FRASES_DICTADO: string[] = [
  // FRASES 1
  'El abuelo', 'Mi hermana Lucía', 'Carlos y Juan', 'Mi mamá es guapa', 'Sara tiene frío',
  'La tormenta', 'El perro y el gato', 'Amiga mía', 'La bruja Piruja', 'Me gustan los coches',
  'Carmen es muy alta', 'Hola', '¡Cuántos niños!', 'Adiós', 'Estoy bien', 'El príncipe Felipe',
  'La reina con corona', 'La rana Gustavo', 'Soy Lucas', 'Gracias', 'Me gusta jugar en el parque',
  'Gracias por ayudar',
  // FRASES 2
  'Los pájaros', 'Mi hermana es pequeña', 'María y Javier', 'Mi mamá cocina muy bien',
  'Lucía tiene un perro', 'La amiga', 'La cama de Sofía', 'Amigas', 'La foca gris', 'Me gustan cantar',
  'Diana una chica muy alta', 'Hola a todos', '¡Felicidades!', 'Nos vemos pronto', 'Estoy muy bien',
  'El príncipe feliz', 'La portera', 'El gato con botas', 'Soy tu amigo', 'Encantada',
  'Mi padre juega en el parque', 'Hasta pronto',
  // FRASES 3
  'La niña', 'Mi amiga Sara', 'Marta y Carmen', 'Tu mamá es lista', 'El conejo tiene calor',
  'Las nubes', 'El elefante está en la selva', 'Ahora', 'La hechicera mágica', 'Me gusta bailar',
  'Juan es muy bueno', 'Andar', '¡Sorpresa!', 'Cumpleaños feliz', 'Estoy mal', 'El cantante Juan',
  'La reina con vestido', 'La cerda Clea', 'Soy Lucas', 'De noche', 'Me gusta trabajar',
  'Gracias por todo',
  // FRASES 4
  'Nadar', 'Mi amigo José estudia mucho', 'Lorena, Noah y Jesús', 'Patatas fritas',
  'Hamburguesa con lechuga', 'La amistad', 'El perro negro y el gato', 'Miércoles', 'Las castañas',
  'Me gustan las flores', 'Tu coche es muy grande', '¿Qué tal?', '¡Corre!', 'Adivina adivinanza',
  'El martes voy a fútbol', 'La princesa y el dragón', 'La reina sin corona', 'En primavera voy al campo',
  'Soy un niño muy listo', 'De nada', 'Me gusta mucho comer patatas', 'Tengo cien canicas',
]

// ----------------------------------------------------------------------------
// BLOQUE III · Actividad 3 (Conteo de palabras): frases LITERALES de la guía.
// ----------------------------------------------------------------------------
export const FRASES_CONTEO: string[] = [
  'El gato duerme', 'La niña come pan', 'Mamá me quiere', 'Lucas tiene 5 años',
  'Mi perro se llama Toby', 'Yo soy profesora', 'Mamá canta', 'Martín está jugando',
  'La niña salta', 'El sol brilla', 'Martín quiere jugar con la pelota', 'No quiero dormir',
]

/** Cuenta palabras de una frase (ignora tokens de pura puntuación). */
export function contarPalabras(frase: string): number {
  return frase
    .trim()
    .split(/\s+/)
    .filter((t) => /[\p{L}\p{N}]/u.test(t)).length
}

// ----------------------------------------------------------------------------
// BLOQUE III · Actividad 4 (Emparejar oración-imagen): LITERAL de la guía.
// ----------------------------------------------------------------------------
export interface OracionImagen {
  oracion: string
  emoji: string
}
export const LEXICO_ORACION_IMAGEN: OracionImagen[] = [
  { oracion: 'El tren de colores', emoji: '🚆' },
  { oracion: 'El subrayador rosa', emoji: '🖍️' },
  { oracion: 'Un granjero con su gallina', emoji: '👨‍🌾' },
  { oracion: 'La oveja feliz', emoji: '🐑' },
  { oracion: 'Una pelota para jugar', emoji: '⚽' },
  { oracion: 'Un timbre sonando', emoji: '🔔' },
  { oracion: 'La camiseta roja', emoji: '🩺' },  // 👕 es azul en muchos sistemas; usamos placeholder hasta tener imagen
  { oracion: 'La plancha de la ropa', emoji: '♨️' },
  { oracion: 'Una sopa caliente', emoji: '🍲' },
  { oracion: 'Muchos libros', emoji: '📚' },
  { oracion: 'El niño durmiendo', emoji: '😴' },
  { oracion: 'Un baño relajante', emoji: '🛁' },
]
