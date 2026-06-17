// Modelos prehechos de BINGO logopédico.
// Las palabras existen en EMOJI (guia.ts) → todas muestran dibujo.
// Las sílabas se muestran como texto grande (sin emoji).

export type TipoBingo = 'fonema' | 'silaba' | 'palabra'

export interface ModeloBingo {
  id: string
  tipo: TipoBingo
  titulo: string
  desc: string
  emoji: string          // icono del modelo en el menú
  color: string          // color de las bolas (variable CSS de la paleta)
  items: string[]        // banco de elementos (palabras o sílabas)
}

export const MODELOS_BINGO: ModeloBingo[] = [
  // ── FONEMAS · refuerzo articulatorio (palabras con el fonema objetivo) ──
  { id: 'fon-r', tipo: 'fonema', titulo: 'Fonema /R/', desc: 'Palabras con el sonido R.', emoji: '🌹', color: 'var(--cera-coral)',
    items: ['ROSA','RANA','RATÓN','RELOJ','TORO','ORO','ZORRO','GORRA','FRESA','CEREBRO','ÁRBOL','PÁJARO','RAQUETA','NARIZ','GORILA','SIRENA'] },
  { id: 'fon-s', tipo: 'fonema', titulo: 'Fonema /S/', desc: 'Palabras con el sonido S.', emoji: '☀️', color: 'var(--cera-mostaza)',
    items: ['SOL','SAL','SAPO','SOPA','SELLO','OSO','MESA','VASO','SANDÍA','BESO','QUESO','SILLA','SIRENA','SALERO','ESTRELLA','UVAS'] },
  { id: 'fon-l', tipo: 'fonema', titulo: 'Fonema /L/', desc: 'Palabras con el sonido L.', emoji: '🌙', color: 'var(--cera-azul)',
    items: ['LUNA','LAZO','VELA','PALA','POLO','LOBO','SOL','SILLA','LIMÓN','LATA','BALA','PELOTA','GALLO','MALETA','LECHE','LUPA'] },
  { id: 'fon-p', tipo: 'fonema', titulo: 'Fonema /P/', desc: 'Palabras con el sonido P.', emoji: '🦆', color: 'var(--cera-verde)',
    items: ['PATO','PALA','PINO','PIÑA','PEZ','PALOMA','POLO','SOPA','MAPA','SAPO','PAN','PELO','PELOTA','PLÁTANO','PIANO','ZAPATO'] },
  { id: 'fon-m', tipo: 'fonema', titulo: 'Fonema /M/', desc: 'Palabras con el sonido M.', emoji: '🍯', color: 'var(--cera-lila)',
    items: ['MESA','MIEL','MAPA','MALETA','MANO','CAMA','MOTO','TOMATE','MAR','MANZANA','MARTILLO','DINERO','GNOMO','PALOMA','CHAMPÚ','GORILA'] },
  { id: 'fon-t', tipo: 'fonema', titulo: 'Fonema /T/', desc: 'Palabras con el sonido T.', emoji: '🍅', color: 'var(--cera-coral)',
    items: ['PATO','TORO','TARTA','MOTO','TACO','TAZA','NOTA','BOTA','TOMATE','TENEDOR','GUANTES','TREN','TETERA','RAQUETA','CHAQUETA','ZAPATO'] },

  // ── SÍLABAS · conciencia silábica (sale la sílaba, se busca en el cartón) ──
  { id: 'sil-pml', tipo: 'silaba', titulo: 'Sílabas P · M · L', desc: 'Familias pa-pe-pi / ma-me-mi / la-le-li…', emoji: '🔤', color: 'var(--cera-mostaza)',
    items: ['PA','PE','PI','PO','PU','MA','ME','MI','MO','MU','LA','LE','LI','LO','LU'] },
  { id: 'sil-str', tipo: 'silaba', titulo: 'Sílabas S · T · R', desc: 'Familias sa-se-si / ta-te-ti / ra-re-ri…', emoji: '🔡', color: 'var(--cera-azul)',
    items: ['SA','SE','SI','SO','SU','TA','TE','TI','TO','TU','RA','RE','RI','RO','RU'] },

  // ── PALABRAS · vocabulario por categorías ──
  { id: 'voc-animales', tipo: 'palabra', titulo: 'Animales', desc: 'Bingo de vocabulario: animales.', emoji: '🐸', color: 'var(--cera-verde)',
    items: ['PATO','RANA','OSO','OVEJA','FOCA','TORO','ZORRO','RATÓN','LOBO','GALLO','GORILA','ELEFANTE','PÁJARO','SAPO','SERPIENTE','LAGARTIJA'] },
  { id: 'voc-comida', tipo: 'palabra', titulo: 'Comida', desc: 'Bingo de vocabulario: comida.', emoji: '🍓', color: 'var(--cera-coral)',
    items: ['TARTA','MIEL','SOPA','QUESO','FRESA','POLO','TOMATE','LECHE','SANDÍA','CAFÉ','COCO','MANZANA','PAN','UVAS','PLÁTANO','LIMÓN'] },
  { id: 'voc-casa', tipo: 'palabra', titulo: 'La casa', desc: 'Bingo de vocabulario: objetos de casa.', emoji: '🪑', color: 'var(--cera-lila)',
    items: ['MESA','SILLA','CAMA','VELA','RELOJ','ESPEJO','LLAVE','VASO','TENEDOR','TAZA','TETERA','BOMBILLA','CEPILLO','JABÓN','PARAGUAS','ZAPATO'] },
]

export function getModeloBingo(id: string): ModeloBingo | undefined {
  return MODELOS_BINGO.find(m => m.id === id)
}
