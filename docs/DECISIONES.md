# DECISIONES — FonoMundos

> Memoria histórica del proyecto. Cada decisión importante se registra aquí con su fecha, motivo e impacto.
> Cualquier sesión futura de Claude debe leer esto para entender POR QUÉ el proyecto está como está.

---

## 2026-05 (inicio del proyecto)

### D-001 — Stack tecnológico
**Decisión:** React 18 + TypeScript + Vite + Tailwind v4 + Supabase + Vercel
**Motivo:** Vite + React es el stack más productivo para prototipos rápidos. TypeScript evita errores en el corpus de datos. Supabase es la única opción gratuita con auth + base de datos + RLS. Vercel integra con GitHub para deploy automático.
**Impacto:** Todo el código del proyecto sigue esta arquitectura. Cambiar de stack requeriría reescribir desde cero.

### D-002 — Corpus CERRADO (no palabras externas)
**Decisión:** El vocabulario de las actividades viene EXCLUSIVAMENTE de la guía de Sara Durán / Profe Ana / Celia Sancho. No se añaden palabras externas.
**Motivo:** Fidelidad al material clínico validado. Evitar "alucinaciones" en el contenido terapéutico. El proyecto tiene licencia Creative Commons del material base.
**Impacto:** El archivo `src/data/guia.ts` es la fuente de verdad. Cualquier actividad debe usar solo ese corpus.

---

## 2026-06-01

### D-003 — Arquitectura multi-tenant con Supabase Auth
**Decisión:** Cada profesional tiene su propia cuenta. Sus pacientes y sesiones son privados. Row Level Security en todas las tablas.
**Motivo:** RGPD/LOPDGDD requiere aislamiento de datos de salud. Un logopeda no puede ver los datos de otro.
**Impacto:** Toda la lógica de storage pasa por `storageCloud.ts`. El patrón `profesional_id = auth.uid()` está en todas las queries.

### D-004 — Pseudonimización de pacientes (Paciente 1, 2, 3...)
**Decisión:** Los perfiles de pacientes usan iniciales o códigos numéricos, nunca nombres completos.
**Motivo:** FonoMundos maneja datos de salud de menores. LOPDGDD exige minimización de datos. El logopeda mantiene la relación código-identidad en sus propios archivos.
**Impacto:** En Home y PanelProfesional, al crear paciente se pide un código (iniciales), no nombre completo.

### D-005 — Evaluación = Opción A (automática desde el juego)
**Decisión:** No hay evaluación inicial obligatoria. El perfil del niño emerge del juego libre.
**Motivo:** Una evaluación estructurada al inicio genera ansiedad y puede contaminar los datos. La evaluación ecológica (desde el juego) tiene mayor validez externa. Se ofrece protocolo opcional de 20-30 min para logopedas que lo quieran.
**Impacto:** El sistema siempre registra métricas. El panel profesional siempre muestra datos. No hay "modo evaluación obligatorio".

---

## 2026-06-02

### D-006 — Validación por secuencia, no por regla fonológica
**Decisión:** En las cadenas de sonidos/sílabas, la validación es contra la SECUENCIA del solucionario, no contra la regla "fonema_final === fonema_inicial".
**Motivo:** El solucionario visual del material incumple la regla en al menos una cadena (Cadena B). Si validáramos por regla, la Cadena B siempre sería incorrecta, aunque el material la dé por válida.
**Impacto:** `cadenaValidacion.ts` usa la secuencia como fuente de verdad. Los bordes fonéticos (ini/fin) se usan solo para la pista guiada, no para validar.

### D-007 — allowOverwrite: true en Vercel Blob
**Decisión:** El archivo de feedback en Vercel Blob se sobrescribe en cada POST.
**Motivo:** Sin `allowOverwrite: true`, cada reporte de la comunidad fallaba silenciosamente. El sistema guardaba en localStorage local pero no en la nube. Esto duró semanas sin detectarse.
**Impacto:** Todos los reportes anteriores a este fix se perdieron (solo en localStorage de los usuarios). A partir de aquí, los reportes llegan correctamente a la API.
**Lección:** Siempre testear los errores de la API explícitamente, no asumir que si no hay error es que funciona.

### D-008 — No forks separados, sino ramas en el mismo repo
**Decisión:** El proyecto usa ramas (branches) git en un único repositorio, no forks separados para cada área.
**Motivo:** Con 1 desarrollador + Claude, los forks separados generan overhead de sincronización. Las ramas son más simples: `main`, `plataforma`, `contenido`, `diseño`.
**Impacto:** Todo el código vive en `github.com/foniafonia/fonomundos`. El flujo es: rama → PR → main → Vercel auto-deploya.

---

## 2026-06-03

### D-009 — Pares de actividades construidos desde cero (no copiar guía literalmente)
**Decisión:** Los pares de `PAREJAS_SONIDO_INICIAL` y `PAREJAS_SILABA_INICIAL` fueron reconstruidos verificando que ambas palabras comparten realmente el sonido/sílaba inicial.
**Motivo:** La guía original tenía pares incorrectos (ROSA/SANDÍA: R≠S, GALLO/TACO: GA≠TA). Copiarlos literalmente provocaba que la actividad fuera imposible de resolver correctamente.
**Impacto:** Los pares ahora son: PATO/PALA, ROSA/RANA, LUNA/LAZO, etc. Si en el futuro se actualiza el material original, verificar siempre que los pares comparten el fonema/sílaba inicial antes de añadirlos.

### D-010 — Prioridad: plataforma antes que contenido
**Decisión:** La rama `plataforma` (persistencia, auth, "no se pierda nada") tiene prioridad sobre la rama `contenido` (nuevas actividades).
**Motivo:** Un logopeda que pierde los datos de un paciente no vuelve a usar la herramienta. Sin plataforma estable, el contenido no sirve de nada.
**Impacto:** El desarrollo de nuevas actividades (Mundo 2 Rimas, nuevas mecánicas) espera a que la persistencia de datos sea 100% fiable.

---

## 2026-06-04

### D-011 — Documentación como cerebro permanente del proyecto
**Decisión:** El proyecto tendrá documentación estructurada en `docs/` que actúa como fuente de verdad independiente del historial de conversaciones.
**Motivo:** Claude no tiene memoria entre sesiones. Un proyecto que depende del historial de chat es frágil. La documentación en el repo permite que cualquier sesión futura retome el trabajo sin perder contexto.
**Impacto:** Los archivos `docs/VISION.md`, `docs/ROADMAP.md`, `docs/DECISIONES.md` y `docs/agentes/*.md` son la fuente de verdad del proyecto. Deben actualizarse cuando hay cambios importantes.

### D-012 — Grupo de 4 agentes especializados en Claude Code
**Decisión:** El trabajo en FonoMundos se organiza en 4 sesiones especializadas: PROGRAMA, DEBUGEAR, ANALIZAR LOGOPEDA, COORDINACIÓN.
**Motivo:** Mezclar todos los tipos de trabajo (código, bugs, análisis clínico, coordinación) en una sola sesión genera contexto demasiado grande y confuso.
**Impacto:** Cada sesión arranca leyendo su `docs/agentes/*.md`. La sesión COORDINACIÓN actúa como master implícito.

### D-013 — Voz narrativa: Google español (es-ES)
**Decisión:** FonoMundos usa la voz `"Google español"` de la Web Speech API del navegador, idioma `es-ES` (Español España), para narración e instrucciones.
**Motivo:** Es la voz masculina natural validada como adecuada para el proyecto: clara, profesional y estable para contexto terapéutico.
**Implementación:** `src/lib/voz.ts` prioriza exactamente `"Google español"` + `es-ES`, guarda la voz elegida en `localStorage` para consistencia y aplica siempre `rate = 0.95` y `pitch = 1.0`.
**Impacto:** Todas las instrucciones orales del proyecto usan esta configuración. Si el navegador no ofrece `"Google español"`, cae a una voz española disponible de la Web Speech API, manteniendo `rate = 0.95` y `pitch = 1.0`.

---

## Plantilla para nuevas decisiones

```
## AAAA-MM-DD

### D-XXX — Título de la decisión
**Decisión:** Qué se decidió hacer (o no hacer).
**Motivo:** Por qué se tomó esta decisión. Qué problema resuelve.
**Impacto:** Qué cambia en el proyecto a partir de aquí. Qué no se puede hacer sin revertirla.
**Lección:** (Opcional) Qué aprendimos del proceso.
```
