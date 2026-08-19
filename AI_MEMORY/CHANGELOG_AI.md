# CHANGELOG_AI

- 2026-06-12: Se crea AI_MEMORY inicial para FonoMundos.
  - Archivos afectados: PROJECT_CONTEXT.md, PROJECT_STATUS.md, ROADMAP.md, DECISIONS.md, CHANGELOG_AI.md
  - Motivo: permitir continuidad inmediata desde cualquier dispositivo.

## 2026-06-13: Revision de continuidad
- AI_MEMORY verificada sin borrar informacion previa.

## 2026-06-15: Revision de continuidad
- AI_MEMORY verificada sin borrar informacion previa.

## 2026-06-17: Revision de continuidad
- AI_MEMORY verificada sin borrar informacion previa.

## 2026-08-18: Modo "Solo sonido" (feedback de comunidad)
- Nuevo ajuste de accesibilidad `ocultarTexto`: oculta la palabra escrita del estimulo en las actividades; se revela con la pista o al fallar. El audio sigue siempre disponible.
- Origen: feedback de comunidad (fonema-inicial, policubos) — "no des la palabra escrita junto a la imagen".
- Archivos: src/lib/accesibilidad.ts, src/components/JugarActividad.tsx, src/components/PanelAccesibilidad.tsx, src/data/mejorasComunidad.ts
- No toca Bingo.tsx (lo lleva otro hilo).
