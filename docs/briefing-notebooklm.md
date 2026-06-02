# FonoMundos — Briefing completo para investigación y mejora

## Qué es FonoMundos

Plataforma terapéutica digital interactiva para el desarrollo de la **conciencia fonológica** en niños de Educación Infantil y Primaria. Desarrollada por un logopeda clínico con experiencia real, basada fielmente en el material impreso "Guía de Conciencia Fonológica y Léxica" de Sara Durán (@recursosdept), Profe Ana (@profeana_al) y Celia Sancho (@celiasanchopsicopedagoga).

**URL en producción:** https://fonomundos.vercel.app  
**Stack:** React 18 + TypeScript + Vite + Tailwind CSS  
**Repositorio:** https://github.com/foniafonia/fonomundos

---

## Marco teórico que sustenta el proyecto

### Los 3 niveles de conciencia fonológica trabajados

**1. Conciencia Fonémica** (nivel fonema — unidad mínima de sonido)
- Segmentación fonema a fonema (método policubos)
- Identificación de fonema inicial y final
- Conteo de fonemas
- Detección del intruso fonémico
- Cadenas de sonidos: el fonema final de una palabra = fonema inicial de la siguiente
- Búsqueda de fonemas /m/, /s/, /p/, /r/

**2. Conciencia Silábica** (nivel sílaba)
- Segmentación silábica (método policubos PA-TO)
- Identificación de sílaba inicial
- Clasificación por número de sílabas (1-4)
- Cadenas silábicas: sílaba final = sílaba inicial siguiente
- Creación de palabras con banco de sílabas

**3. Conciencia Léxica** (nivel palabra/frase)
- Conteo de palabras en frases
- Ordenar frases desordenadas
- Emparejar oración con imagen
- Dictado de frases (88 frases, 4 niveles de dificultad)

---

## Actividades implementadas (21 en total)

### Actividades de opción múltiple (motor genérico)
1. **Fonema inicial** — ¿Con qué sonido empieza? (elige entre 4 opciones)
2. **Conteo de fonemas** — ¿Cuántos sonidos tiene? (elige número)
3. **Conteo silábico** — ¿Cuántas sílabas tiene? (elige número)
4. **Sílaba intrusa** — ¿Cuál empieza diferente? (4 palabras, 1 intrusa)
5. **Fonema intruso** — ¿Cuál empieza por sonido diferente?
6. **Sonido modelo** — ¿Cuál empieza como la palabra modelo?
7. **Sonido final** — ¿Cuál termina igual que el modelo?
8. **Cuenta las palabras** — ¿Cuántas palabras tiene la frase?

### Actividades con mecánica propia
9. **Policubos fonémico** — Coloca un cubo por cada sonido (PATO = 4 cubos → P-A-T-O)
10. **Policubos silábico** — Coloca un cubo por cada sílaba (PA-TO = 2 cubos)
11. **Cadena de sonidos** — Dominó: arrastra fichas en orden fonémico (5 cadenas A-E)
12. **Cadena de sílabas** — Dominó: arrastra fichas en orden silábico (4 cadenas)
13. **Caza del sonido** — Encuentra todos los dibujos que empiezan por /m/ /s/ /p/ /r/
14. **Clasifica por sílabas** — Arrastra cada palabra al grupo correcto (1, 2, 3 o 4 sílabas)
15. **Une por sonido** — Arrastra para unir parejas que empiezan igual (fonémica)
16. **Une por sílaba** — Arrastra para unir parejas que empiezan igual (silábica)
17. **Crea palabras** — Forma palabras con el banco de sílabas recortables
18. **Frase y dibujo** — Empareja cada oración con su imagen (12 oraciones)
19. **Frase y dibujo (ordena)** — Ordena la frase que corresponde al dibujo
20. **Ordena la frase** — Coloca las palabras en el orden correcto (6 frases del material)
21. **Cuenta las palabras** — Escucha y cuenta cuántas palabras tiene la frase

---

## Sistema de evaluación y medición clínica

### 6 índices calculados automáticamente (0-100)

| Índice | Descripción |
|--------|-------------|
| Fonológico Global | % éxito en actividades fonémicas |
| Silábico Global | % éxito en actividades silábicas |
| Coherencia Léxica | % éxito en actividades léxicas |
| Automatización | Aciertos a la primera sin ayuda |
| Velocidad de Procesamiento | Rapidez de respuesta (< 6s = 100) |
| Riesgo de Dificultad Lectora | Combinación de error + lentitud + ayuda |

### Por cada ronda se registra:
- Acierto/error
- Nº de intentos
- Tiempo de respuesta (ms)
- Ayuda utilizada (sí/no)
- Dificultad del ítem
- Actividad e ítem concreto

### Visualización en Panel Logopeda:
- Radar chart de 7 ejes (todos los índices)
- Gráfica de evolución temporal (líneas por sesión)
- Tabla de índices con semáforo (verde/amarillo/rojo)

---

## Motor de adaptación automática

El sistema ajusta la dificultad automáticamente:
- **3 aciertos limpios seguidos** → sube dificultad
- **2 fallos en las últimas 3** → baja dificultad

Variables que cambia según dificultad (1-5):
- Longitud de palabras (nº de sílabas/fonemas)
- Número de distractores en las opciones
- Velocidad requerida (futuro)

---

## Detección automática de patrones clínicos

El sistema genera alertas para el logopeda si detecta:
- Dificultad de segmentación silábica (silábico < 60%)
- Dificultad de análisis auditivo (fonológico < 60%)
- Dificultad de conciencia léxica (léxico < 60%)
- Velocidad de procesamiento fonológico baja (< 45/100)
- Baja automatización (< 50/100)
- Indicador de riesgo lector elevado (> 60/100)

---

## Panel del Logopeda (Modo Profesional)

- Ficha de paciente (nombre, edad, curso, diagnóstico, objetivos, observaciones)
- Historial de sesiones (nº sesiones, tiempo total, XP)
- Perfil clínico con radar de índices
- Evolución temporal entre sesiones
- Análisis automático + recomendaciones
- Exportación CSV/Excel de todas las sesiones
- Exportación PDF del informe (print)

---

## Gamificación

- Monedas (🪙 +5 por acierto)
- XP (⭐ +10 por acierto)
- Refuerzo positivo: Pato amarillo 🦆 y Rana Gustavo 🐸

---

## Sistema de feedback de la comunidad

Botón 🐛 en cada actividad → usuarios reportan:
- Se repite mucho
- Icono/dibujo incorrecto
- Contenido erróneo
- La actividad no funciona
- Se queda bloqueado
- Otro

Los reportes se almacenan en: https://fonomundos.vercel.app/api/feedback

---

## Corpus lingüístico utilizado (cerrado, fiel al material)

### Palabras con segmentación fonémica (20):
PATO, ROSA, RANA, PALA, LUNA, FOCA, LAZO, VELA, NUBE, PIANO, CUNA, PINO, OLA, PIÑA, TARTA, TORO, ELFO, MESA, MIEL, PEZ

### Palabras con segmentación silábica (18):
PATO, ROSA, RANA, PALA, LUNA, FOCA, LAZO, VELA, NUBE, PIANO, CUNA, PINO, OLA, PIÑA, TARTA, TORO, ELFO, MESA

### Cadenas fonémicas (solucionario pág. 21 del material):
- A: SOL→LAZO→OSO→OVEJA→AVESTRUZ→ZAPATILLAS→SAL→LIMÓN
- B: ÁRBOL→LUPA→LATA→NIDO→OJOS→SERPIENTE→ELEFANTE→EMBARAZADA
- C: RELOJ→JAULA→AVIÓN→NARIZ→ZORRO→OCHO→ORUGA→AMBULANCIA
- D: MESA→AZÚCAR→RATÓN→NIEVE→ESTRELLA→ÁLBUM→MOTO→ORO
- E: CHAMPÚ→UVAS→SIRENA→AZUL→LECHE→ESPEJO→OGRO→OREJA

---

## Lo que necesita mejorar / investigar

### Áreas pendientes de desarrollo
1. **Más palabras en el corpus** — actualmente solo 20 palabras fonémicas; con 50+ la variedad mejoraría mucho
2. **Actividades de rima** — completamente ausentes, fundamentales para la CF
3. **Conciencia intrasilábica** — onset/rima (no implementado)
4. **Velocidad lectora** — no hay ninguna actividad
5. **Pares mínimos** — discriminación M/N, P/B, D/T, G/K (detectados en el motor analítico pero sin actividad específica)
6. **Memoria fonológica** — secuencias de sonidos, repetición de pseudopalabras
7. **Integración audiovisual** — el texto escrito aparece con el estímulo (podría suprimirse para actividades de discriminación auditiva pura)
8. **Locuciones profesionales** — actualmente usa SpeechSynthesis del navegador; voces de logopeda real mejorarían el impacto clínico

### Preguntas de investigación para NotebookLM
1. ¿Qué secuencia de actividades es más eficaz para niños con riesgo de dislexia?
2. ¿Cuál es el orden pedagógico óptimo: ¿fonema → sílaba → léxico? ¿O sílaba → fonema?
3. ¿Qué índices tienen mayor valor predictivo del rendimiento lector?
4. ¿Qué duración y frecuencia de sesión maximiza la consolidación?
5. ¿Cómo adaptar las actividades para TEA, TDAH y baja visión?
6. ¿Qué pares mínimos son más discriminativos clínicamente en español?

---

## Futuro: Arquitectura modular (NeuronUP de logopedia)

El plan es que FonoMundos sea solo el "Mundo 1" de una plataforma más amplia:

| Mundo | Área |
|-------|------|
| Mundo 1 | Conciencia fonológica y silábica ← (actual) |
| Mundo 2 | Rimas |
| Mundo 3 | Velocidad lectora |
| Mundo 4 | Vocabulario |
| Mundo 5 | Morfosintaxis |
| Mundo 6 | Articulación |
| Mundo 7 | Comprensión lectora |
| Mundo 8 | Dislexia |
