# PANEL MAESTRO — FonoMundos Coordinación

> Documento de control del proyecto. Cualquier sesión de Claude que tome decisiones de arquitectura debe actualizar este archivo.
> Lee también: `docs/VISION.md`, `docs/ROADMAP.md`, `docs/DECISIONES.md`

---

## Estado general

| | |
|---|---|
| **URL producción** | https://fonomundos.vercel.app |
| **Repo** | https://github.com/foniafonia/fonomundos |
| **Build** | ✅ Limpio |
| **Validador** | ✅ 0 errores (`npm run validar`) |
| **Supabase** | ✅ Configurado y funcionando |
| **Feedback API** | ✅ Operativa |
| **Fase actual** | FASE 1 — Demo funcional (80%) |
| **Última actualización** | Junio 2026 |

---

## Ramas activas

| Rama | Propósito | Estado | Responsable |
|---|---|---|---|
| `main` | Producción | ✅ Estable | Todos |
| `plataforma` | Persistencia, auth, migración | 🔄 En curso | Agente PROGRAMA |
| `contenido` | Nuevas actividades, corpus | ⏸️ Esperando | Agente PROGRAMA |
| `diseño` | UI/UX, accesibilidad | ⏸️ Esperando | Agente PROGRAMA |

**Flujo de merge:**
```
rama → verificar (validar + build) → PR → main → Vercel auto-deploya
```

---

## Prioridades activas

### 🔴 Bloquea el avance (resolver esta semana)
1. Verificar que migración invitado→Supabase funciona end-to-end
2. Hacer merge de `plataforma` a `main` tras verificación
3. Confirmar que sesiones se guardan correctamente para usuarios autenticados

### 🟡 Sprint actual
4. Tipografía para dislexia (OpenDyslexic) — pedida por comunidad
5. Audio en actividades léxicas (ordenar-frase, etc.) — necesario para niños que no leen
6. Bugs activos: SOPA/SAPO par incorrecto, Cadena B irregular

### 🟢 Siguiente sprint (tras Fase 1 completa)
7. Mundo 2 Rimas — completar 6 actividades (ahora hay 2)
8. Ampliar corpus de palabras para mayor variedad
9. Panel métricas avanzado

---

## Bloqueos actuales

| Bloqueo | Tipo | Acción requerida |
|---|---|---|
| Cadena B irregular del material | Dato | Aceptado — es error del material original, no del código |
| Validación científica pendiente | Investigación | Requiere 100 niños/grupo edad — largo plazo |
| Tipografía dislexia sin implementar | Feature | Agente DISEÑO cuando esté activo |

---

## Próximos hitos

| Hito | Criterio | Fecha estimada |
|---|---|---|
| Fase 1 completa | Un logopeda externo usa sin errores graves | Julio 2026 |
| Primera validación con beta testers | 10 logopedas, 30 días de uso | Agosto 2026 |
| Mundo 2 Rimas completo | 6 actividades de rima funcionando | Agosto 2026 |
| Datos normativos propios | 50+ sesiones por grupo de edad | Fin 2026 |

---

## Decisiones recientes

| Fecha | Decisión | Referencia |
|---|---|---|
| 2026-06-04 | Documentación como cerebro permanente | D-011 |
| 2026-06-04 | Grupo de 4 agentes especializados | D-012 |
| 2026-06-03 | Pares reconstruidos desde cero | D-009 |
| 2026-06-03 | Prioridad: plataforma antes que contenido | D-010 |
| 2026-06-02 | allowOverwrite: true en Vercel Blob | D-007 |
| 2026-06-02 | No forks, solo ramas en el mismo repo | D-008 |

Ver historial completo: `docs/DECISIONES.md`

---

## Agentes del grupo

| Agente | Cuándo llamarlo | Contexto en |
|---|---|---|
| **PROGRAMA** | Implementar código, features, arquitectura | `docs/agentes/PROGRAMA.md` |
| **DEBUGEAR** | Algo está roto, analizar feedback, aplicar fixes | `docs/agentes/DEBUGEAR.md` |
| **ANALIZAR LOGOPEDA** | Validar contenido clínico, proponer actividades | `docs/agentes/LOGOPEDA.md` |
| **COORDINACIÓN** (este) | Tomar decisiones, priorizar, visión global | Este archivo |

---

## Lo que YA funciona (no rehacer)

- Auth completo (login, registro, recuperar contraseña, roles)
- 27 actividades jugables con corpus cerrado y validado
- 9 índices clínicos con normas por edad (4-7 años)
- Alerta doble déficit (dislexia en español)
- Protocolo de cribado 20-30 min
- Panel logopeda (Jugar/Evaluar/Progreso/Informes)
- Sistema feedback 🐛 → GitHub Issues 2x/día
- Cola sin repetición en todas las actividades
- Landing carátula videojuego con zonas clickables
- Grid tipo Steam/Netflix en catálogo
- RGPD: pseudonimización, disclaimers, consentimiento

---

## Métricas del sistema

```bash
# Ver reportes de la comunidad
curl https://fonomundos.vercel.app/api/feedback

# Estado del código
npm run validar    # debe dar 0 errores
npm run build      # debe compilar limpio

# Ver últimas sesiones
# Supabase → Table Editor → sesiones (order by created_at DESC)
```

---

## Cómo actualizar este archivo

Actualizar cuando:
- Cambia el estado de una rama
- Se toma una decisión de arquitectura importante
- Se completa un hito
- Aparece un bloqueo nuevo
- Cambian las prioridades

Formato: directo, sin redundancias. Este archivo es para tomar decisiones rápidas, no para leer novelas.
