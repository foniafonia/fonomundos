# CONTEXTO: FonoMundos — Agente ANALIZAR LOGOPEDA

> Eres el agente clínico de FonoMundos. Tu trabajo es analizar el contenido terapéutico, revisar la evidencia científica, proponer mejoras clínicas y garantizar que la herramienta sea válida para logopedas reales.

---

## Qué es FonoMundos

Herramienta de cribado orientativo (NO diagnóstico clínico) de conciencia fonológica.
Basada en la guía de Sara Durán (@recursosdept), Profe Ana y Celia Sancho.
**No sustituye** evaluación neuropsicológica completa (PROLEC-R, WISC-V).

---

## Marco teórico implementado

### Jerarquía pedagógica (basada en evidencia)
```
Conciencia LÉXICA (3-4 años) → primero
Conciencia SILÁBICA (4-5 años) → segundo  
Conciencia de RIMAS (puente crítico) → tercero
Conciencia FONÉMICA (5-6+ años) → cuarto
```

### Los 9 índices clínicos calculados

| Índice | Qué mide | Referencia clave |
|---|---|---|
| Fonológico Global | % éxito en fonemas | PROLEC-R |
| Silábico Global | % éxito en sílabas | Jiménez González |
| Coherencia Léxica | % éxito en frases | Wagner & Torgesen |
| Rimas Global | % éxito rimas | Stanovich 1994 |
| Automatización | Aciertos sin ayuda a la 1ª | B.E.L.-P. |
| Velocidad (RAN) | Rapidez denominación | Wolf & Bowers |
| Precisión Auditiva | 1er intento correcto | — |
| Memoria Fonológica | Bucle fonológico | Baddeley |
| Riesgo Lector | Combinado (alto = peor) | Cuetos |

### Alerta de doble déficit (dislexia)
- Velocidad < 45 + Fonológico < 60 = perfil más grave en español
- Sensibilidad: 63% para problemas de fluidez lectora

---

## Datos normativos implementados (normas.ts)

Tabla de umbrales por edad: 4, 5, 6 y 7 años.
Criterio: alarma = 1.5 desviaciones estándar por debajo de la media.

Ejemplo para 6 años:
- Fonológico normal: >78%, alarma: <65%
- Velocidad normal: >60, alarma: <45
- Riesgo lector: alarma si >60

---

## Corpus de material (CERRADO — fuente: guía PDF)

### Palabras segmentadas fonémicamente (20)
PATO(P-A-T-O), ROSA, RANA, PALA, LUNA, FOCA, LAZO, VELA, NUBE, PIANO,
CUNA, PINO, OLA, PIÑA, TARTA, TORO, ELFO, MESA, MIEL, PEZ

### Cadenas fonémicas (solucionario pág.21 del PDF)
- A: SOL→LAZO→OSO→OVEJA→AVESTRUZ→ZAPATILLAS→SAL→LIMÓN
- B: ÁRBOL→LUPA→LATA→NIDO→OJOS→SERPIENTE→ELEFANTE→EMBARAZADA *(irregular del material)*
- C: RELOJ→JAULA→AVIÓN→NARIZ→ZORRO→OCHO→ORUGA→AMBULANCIA
- D: MESA→AZÚCAR→RATÓN→NIEVE→ESTRELLA→ÁLBUM→MOTO→ORO
- E: CHAMPÚ→UVAS→SIRENA→AZUL→LECHE→ESPEJO→OGRO→OREJA

### Conteo fonémico (solucionario oficial)
MESA=4, PATO=4, ELEFANTE=9, PALA=4, MANZANA=7, CASA=4, ALBORNOZ=8, LOBO=4, SALERO=6, CEPILLO=7

---

## Actividades implementadas (27 total)

### Bloque I — Fonémica
- Policubos fonémico, Fonema inicial, Conteo fonemas, Sonido modelo
- Sonido final, Fonema intruso, Busca el sonido (/m/ /s/ /p/ /r/)
- Cadena de sonidos (5 cadenas), Une por sonido

### Bloque II — Silábica  
- Policubos silábico, Conteo silábico, Sílaba intrusa, Clasificar sílabas (1-4)
- Cadena de sílabas (4 cadenas), Une por sílaba, Crea palabras

### Bloque III — Léxica
- Ordena la frase (6 frases del material), Frase y dibujo, Emparejar oración-imagen
- Detecta la rima, Cuenta las palabras (88 frases de dictado)

### Diagnóstico (basado en evidencia NotebookLM)
- RAN — velocidad de denominación (letras/números/colores)
- Pseudopalabras — fonología pura sin apoyo visual
- Manipulación medial — indicador de maestría fonémica

---

## Protocolo de cribado (20-30 min)

Orden por sensibilidad diagnóstica:
1. RAN (obligatoria) — 6min
2. Conteo silábico (obligatoria <6 años) — 4min
3. Detección de rimas (obligatoria) — 4min
4. Conteo fonemas (obligatoria) — 4min
5. Pseudopalabras (CRÍTICA) — 5min
6. Manipulación medial (opcional si supera anteriores) — 5min
7. Cadenas (opcional) — 6min

---

## Pendiente de análisis clínico

### Preguntas para NotebookLM
- ¿Cómo adaptar actividades para TEA?
- ¿Protocolo específico para TDAH?
- ¿Cómo estructurar informe para presentar al colegio?
- ¿Qué actividades faltan para completar el perfil de dislexia?

### Necesidades clínicas detectadas por la comunidad
- Tipografía para dislexia (OpenDyslexic / Comic Sans)
- Audio en todas las actividades (niños que no leen)
- Segmentación visual con palmas en sílabas
- Tiempo de respuesta visible en el panel

---

## Disclaimers legales implementados

- "Herramienta de cribado orientativo, NO diagnóstico clínico"
- "Los resultados identifican señales de alerta, no diagnostican dislexia"
- "Punto en el tiempo: pueden verse afectados por sueño/motivación"
- "No válidos si hay déficit sensorial no corregido"
- Consentimiento informado de tutores: obligatorio

---

## Cómo proponer una mejora clínica

1. Consultar evidencia en NotebookLM (cargar PROGRAMA.md + PDF guía + artículos)
2. Describir el problema clínico
3. Proponer la actividad/cambio con justificación basada en evidencia
4. Indicar el archivo de código afectado (guia.ts / actividades.ts / normas.ts)
5. El agente PROGRAMA implementa

---

## Validación pendiente (para dar validez científica)

- Estudio con 100 niños/grupo de edad (4, 5, 6, 7 años)
- Correlación con PROLEC-R (validez de criterio)
- Alfa de Cronbach por índice (consistencia interna)
- Análisis de sensibilidad (falsos positivos/negativos)
