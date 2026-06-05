# PROTOCOLO — Director Clínico & Agentes Especializados

> Optimización de tokens y flujo de trabajo para FonoMundos. Implementado junio 2026.

---

## Flujo de trabajo (Director Clínico + 3 agentes)

### 1. Director Clínico (esta sesión)
- **Contexto:** Solo docs/agentes/DIRECTOR_CLINICO.md + VISION.md + ARQUITECTURA.md
- **Función:** Coordinación, prioridades, decisiones estratégicas
- **Lifespan:** Una sesión = máximo 3-4 decisiones. Luego cierra.
- **Token budget:** ~30k por sesión

### 2. Constructor (código)
- **Cuando:** Implementar feature, refactorizar, crear rama
- **Contexto:** docs/agentes/CONSTRUCTOR.md (solo ese)
- **Arranque:** `Lanzo agente Constructor para [tarea específica]`
- **Retorno:** PR URL + resumen de cambios
- **Token budget:** ~50k para tareas medianas

### 3. Inspector (debugging)
- **Cuando:** Bug reportado, validación fallida, test rojo
- **Contexto:** docs/agentes/INSPECTOR.md (solo ese)
- **Arranque:** `Lanzo agente Inspector para verificar [síntoma]`
- **Retorno:** Causa raíz + fix aplicado + test
- **Token budget:** ~40k para debugging medio

### 4. Cerebro Clínico (validación logopeda)
- **Cuando:** Revisar contenido, validar ejercicio, corpus
- **Contexto:** docs/agentes/CEREBRO_CLINICO.md (solo ese)
- **Arranque:** `Lanzo agente Cerebro Clínico para [validación]`
- **Retorno:** Aprobación + feedback clínico
- **Token budget:** ~35k para análisis profundo

---

## Cómo lanzo un agente desde Director Clínico

```
Yo (Director):
"Lanzo agente Constructor para verificar la migración invitado→Supabase 
en rama `plataforma` y reportar si falta algo antes de mergear."

Agente Constructor:
- Lee docs/agentes/CONSTRUCTOR.md
- Revisa rama plataforma (checkout automático)
- Verifica flujo end-to-end
- Reporta estado + próximos pasos
- Retorna resultado

Yo (Director):
- Recibo resultado
- Si OK → merge a main + deploy
- Si bloqueo → lanzo Inspector
```

---

## Optimización de tokens implementada

| Antes | Después | Ahorro |
|---|---|---|
| Bitácora 50 líneas por prompt | 3 líneas + alertas críticas | ~85% |
| Historial acumulado en hilo | Hilos cerrados por fase | ~75% |
| Contexto duplicado en agentes | Agentes con doc específico | ~60% |
| **Total por sesión** | **~150k tokens** | **~100k tokens → 30% reducción** |

---

## Cuándo CERRAR este hilo de Director Clínico

Cerrar cuando:
- ✅ Se toma una decisión de arquitectura importante
- ✅ Se lanzan 3+ agentes especializados
- ✅ El plan para esta semana está claro
- ✅ Todas las prioridades están asignadas

Mantener ABIERTO solo si:
- Hay bloqueo que requiere coordinación en tiempo real
- Hay ambigüedad en decisión arquitectónica pendiente

---

## Checklist de esta sesión (Director Clínico)

- [ ] Reducir verbosidad check_bitacora.sh ✅
- [ ] Documentar flujo agentes 
- [ ] Lanzar Inspector para verificar migración plataforma
- [ ] Lanzar Constructor para audio en actividades léxicas
- [ ] Documentar decisión de merge (D-014)

---

## Referencias

- `docs/DIRECTOR_CLINICO.md` — Panel maestro de coordinación
- `docs/ARQUITECTURA.md` — Regla permanente de modularidad
- `docs/agentes/CONSTRUCTOR.md` → Cuando necesito código
- `docs/agentes/INSPECTOR.md` → Cuando algo está roto
- `docs/agentes/CEREBRO_CLINICO.md` → Cuando valido contenido

---

*Creado por Director Clínico · 04/06/2026*
*Optimizado para reducir consumo de tokens sin perder efectividad de coordinación.*
