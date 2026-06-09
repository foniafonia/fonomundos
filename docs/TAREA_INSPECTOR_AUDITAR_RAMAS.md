# Tarea Inspector — Auditar mejoras perdidas entre ramas

## CONTEXTO

La rama `plataforma` (donde está Codex) divergió de `main` hace poco. Hay commits valiosos en `main`, `diseño` y `contenido` que NO están en `plataforma`.

**Problema:** El usuario descubrió que faltaban:
- OpenDyslexic + botones de fuente dislexia
- Indicador tiempo en tiempo real
- Panel datos en vivo

Estos estaban en commits que no se cherry-picked.

---

## TAREA

Audita las 4 ramas y genera un **reporte de gaps**:

### 1. Comparar main vs plataforma

```bash
git log main..plataforma --oneline  # Commits EN plataforma que NO están en main
git log plataforma..main --oneline  # Commits EN main que NO están en plataforma
```

**Buscar específicamente:**
- Features en `main` que falten en `plataforma`
- Bugs que se hayan arreglado en `main` pero no en `plataforma`
- Mejoras de diseño/UX perdidas

### 2. Revisar rama `diseño` 

```bash
git log diseño --oneline | head -20
```

Buscar:
- Mejoras visuales
- Accesibilidad
- Tipografía
- Colores/temas

¿Están en `plataforma`?

### 3. Revisar rama `contenido`

```bash
git log contenido --oneline | head -20
```

Buscar:
- Nuevas actividades
- Corpus ampliado
- Mecánicas mejoradas

¿Están en `plataforma`?

### 4. Generar reporte

**Formato:**

```
## GAPS ENCONTRADOS

### ❌ Missing from plataforma (en main/diseño/contenido)

| Rama | Commit | Título | Impacto |
|------|--------|--------|---------|
| main | fa08f96 | OpenDyslexic + BotonesGlobales | ALTO — UI/accesibilidad |
| main | 665f3d4 | Panel accesibilidad | MEDIO — Feature |
| diseño | xxxxx | [título] | [impacto] |
| contenido | yyyyy | [título] | [impacto] |

### 🎯 ACCIÓN RECOMENDADA

1. Cherry-pick de main: fa08f96, 665f3d4, [otros]
2. Cherry-pick de diseño: [commits críticos]
3. Cherry-pick de contenido: [commits críticos]
4. Resolver conflictos si los hay
5. Build + validar

### ⚠️ RIESGOS

- Conflictos de merge
- Features parcialmente implementadas
- Cambios de dependencias
```

---

## ENTREGA

```bash
# 1. Genera el reporte (markdown)
# 2. Loguea qué gaps encontraste
# 3. Propón orden de cherry-pick
# 4. Avísame con el reporte completo
```

---

## CONTEXTO PARA EL INSPECTOR

**Ramas activas:**
- `main` — producción estable (https://fonomundos.vercel.app)
- `plataforma` — red de seguridad (Codex)
- `diseño` — mejoras visuales/accesibilidad
- `contenido` — nuevas actividades/corpus

**El problema:** Codex está trabajando en `plataforma` pero esa rama quedó atrás de `main` + `diseño`. Hay features valiosas que se perdieron.

**Tu rol:** Encontrar TODAS las features perdidas, no solo las obvias. Sé exhaustivo.

---

**Inicia auditoría y reporta.**
