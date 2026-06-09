# AUDITORÍA GAPS — Inspector FonoMundos
**Fecha:** 2026-06-05  
**Rama actual:** plataforma  
**Punto de divergencia:** 4b8c404 (docs: cerebro permanente)  
**Análisis:** Qué commits faltan en `plataforma` respecto a `main`, `diseño`, `contenido`

---

## RESUMEN EJECUTIVO

**plataforma está 13 commits atrás de main.**

**Brecha crítica:** Falta la triada de accesibilidad + UI (OpenDyslexic, BotonesGlobales, PanelAccesibilidad). Estos commits están en `main` y `diseño` pero NO en `plataforma`.

- **Commits faltantes críticos:** 5 (accesibilidad + audio + admin)
- **Commits faltantes no-críticos:** 8 (documentación + herramientas)
- **Conflictos potenciales:** BAJOS (ramas divergieron limpiamente)
- **Rama `contenido`:** Está al MISMO NIVEL que `plataforma` (no hay gaps)

---

## GAPS ENCONTRADOS

### ❌ MAIN tiene estos commits que FALTAN en PLATAFORMA

#### **CRÍTICOS (BLOQUEADORES) — Hacer primero**

| Prioridad | Commit | Título | Archivos | Impacto |
|-----------|--------|--------|----------|---------|
| 🔴 1 | `fa08f96` | merge(diseño→main): OpenDyslexic + accesibilidad + BotonesGlobales | 18 archivos | **ALTO** — UI/accesibilidad completa. Botones cuenta+letra flotantes, OpenDyslexic via CDN, alto contraste |
| 🔴 2 | `665f3d4` | feat(diseño): tipografía dislexia + panel accesibilidad | 7 archivos | **ALTO** — OpenDyslexic, interletraje, line-height, PanelAccesibilidad.tsx, localStorage |
| 🔴 3 | `7196a6f` | feat(diseño): BotonesGlobales — 👤 Cuenta + 🔡 Letra | 5 archivos | **ALTO** — BotonesGlobales.tsx: 👤 (carátula/sesión) + 🔡 (tipografía), esquina inferior derecha |
| 🟠 4 | `e597edd` | feat: Admin con pestaña Sesiones — datos reales de Supabase | 1 archivo | **MEDIO-ALTO** — Tab "Sesiones": datos en vivo, nombre paciente, hora, dominio, rondas, % éxito |
| 🟠 5 | `d8c6932` + `ac34203` | feat/fix: voz Google español por defecto + test | 3 archivos | **MEDIO** — elegirVoz() prioriza Google español, test-voces.html. **Nota:** plataforma ya tiene commits similares (a146a27, 603e7a3) |

#### **SECUNDARIOS (Mejora/Doc/Mantenimiento) — Hacer después**

| Prioridad | Commit | Título | Archivos | Impacto |
|-----------|--------|--------|----------|---------|
| 🟡 6 | `71d0472` | fix: getSession() en lugar de getUser() | - | **BAJO-MEDIO** — BUG: token expirado no guardaba sesión. Seguridad. |
| 🟡 7 | `a951af4` | fix: botón Admin abre panel visual en vez de JSON | 1 archivo | **BAJO** — UX: Admin mostraba JSON crudo. |
| 🟡 8 | `54c2608` | feat: reencuadre terminológico (screening → exploración) | 7 archivos | **BAJO-MEDIO** — Cambio TerminolóGICO: cribado→exploración, riesgo→refuerzo. Necesario para mensaje oficial. |
| 🟢 9 | `4174af7` | feat: npm run salud — vigilancia arquitectónica | 3 archivos | **BAJO** — Herramienta: escanea src/, detecta archivos >300l, reporta a ARQUITECTURA.md. |
| 🟢 10 | `88ce49e` | docs: ARQUITECTURA.md — regla D-013 | - | **BAJO** — Documentación: modularidad permanente. |
| 🟢 11 | `f1a17f0` | docs: renombrar agentes (Director Clínico, Constructor, Inspector…) | - | **BAJO** — Documentación: renombramientos organizacionales. |
| 🟢 12 | `8d921a2` | chore: estado final Director Clínico v1 | - | **BAJO** — Chore: cierre de hilo. |

---

## ANÁLISIS RAMA A RAMA

### RAMA `main` (13 commits adelante de plataforma)

**Línea:**
```
4b8c404 (ancestro común)
  ↓
  +-- 7196a6f [DISEÑO → MAIN]
  +-- 665f3d4 [DISEÑO → MAIN]
  +-- f1a17f0 [agentes]
  +-- 54c2608 [terminología]
  +-- 88ce49e [docs ARQUITECTURA]
  +-- 4174af7 [npm salud]
  +-- d8c6932 [voz Google español v1]
  +-- ac34203 [voz Google español v2 - fix]
  +-- 71d0472 [getSession fix]
  +-- a951af4 [Admin UX]
  +-- e597edd [Admin Sesiones real]
  +-- 8d921a2 [chore cierre]
```

**Qué hace:** Ciclo completo de accesibilidad (diseño → main), fixes varios, Admin mejorado.

**❌ Falta en plataforma:** TODO (13 commits).

---

### RAMA `diseño` (3 commits adelante de plataforma)

**Línea:**
```
4b8c404 (ancestro común)
  ↓
  +-- 665f3d4 [tipografía dislexia]
  +-- 7196a6f [BotonesGlobales]
  +-- f1a17f0 [agentes]
```

**Qué hace:** Accesibilidad pura (OpenDyslexic, BotonesGlobales, PanelAccesibilidad).

**❌ Falta en plataforma:** 665f3d4, 7196a6f, f1a17f0.

**Nota:** Estos ya fueron mergeados en `main`, así que al hacer cherry-pick de `main`, se obtienen automáticamente.

---

### RAMA `contenido` (0 commits adelante de plataforma)

**Estado:** ESTÁ AL MISMO NIVEL que `plataforma`.

```
Ancestro común: bfb0e33
  ↓
  ← contenido (aquí está)
  ← plataforma (aquí está)
```

**Conclusión:** NO hay gaps en `contenido` que falten en `plataforma`. Ambas ramas están sincronizadas desde bfb0e33.

---

## COMMITS ÚNICOS EN `plataforma` (NO en main)

Para documentación: `plataforma` tiene 8 commits que main NO tiene. Son específicos de Codex:

| Commit | Título | Tipo |
|--------|--------|------|
| `603e7a3` | Fijar voz Google español para FonoMundos | AUDIO |
| `a146a27` | Conservar voz masculina natural | AUDIO |
| `df66b88` | Ajustar salida voz y navegación en preview | AUDIO |
| `8e34ad5` | Documentar verificación preview de feedback | DOC |
| `9c082b5` | Integrar red de seguridad global de datos | INFRA |
| `a3c8023` | Agregar scripts de backup automático para Supabase | INFRA |
| `d825c24` | Implementar reintentos paralelos (sesiones) | INFRA |
| `e606f37` | Implementar reintentos paralelos (feedback) | INFRA |

**Análisis:** Estos commits son valiosos pero ESPECÍFICOS DE PLATAFORMA (backup, reintento, red seguridad). No están en `main` porque es otra rama de desarrollo.

---

## RIESGOS Y CONFLICTOS POTENCIALES

### Riesgo de conflicto: **BAJO**

Razón: Las ramas divergieron limpiamente en arquitectura distinta:
- `plataforma` = infraestructura + estabilidad (backup, reintentos, seguridad)
- `main` = features + accesibilidad (UI, audio, admin)

Archivos que podrían tener conflictos:
- `src/lib/voz.ts` — Plataforma tiene cambios en voz (a146a27, 603e7a3), main tiene cambios similares (d8c6932, ac34203)
  - **Riesgo:** MEDIO — Ambas buscan "Google español", pero diferente estrategia. Necesita revisión.
- `src/App.tsx` — main modifica para BotonesGlobales (fa08f96), plataforma no la toca
  - **Riesgo:** BAJO — Cherry-pick debe ir limpio.

### Impacto de cherry-pick sin resolución: **ALTO**

Si se ignoran estos 13 commits:
- ❌ No hay OpenDyslexic en plataforma (usuario dislexia no puede leer)
- ❌ No hay botones Cuenta/Letra (UI incompleta)
- ❌ No hay Admin con Sesiones en vivo (logopeda no ve datos)
- ❌ La voz está desincronizada (dos estrategias distintas de selección de voz)
- ❌ Seguridad: sin getSession() fix, token expirado pierde datos

---

## ORDEN RECOMENDADO DE CHERRY-PICK

### **Fase 1: Accesibilidad (CRÍTICO)**
Hacer primero estos 3 commits (en orden):

```bash
git cherry-pick 665f3d4  # OpenDyslexic + panel base
git cherry-pick 7196a6f  # BotonesGlobales (depende de 665f3d4)
git cherry-pick fa08f96  # Merge completo (documentación + integración)
```

**Por qué:** BotonesGlobales depende de que exista la CSS de OpenDyslexic.

**Conflictos esperados:** Muy bajos (solo archivos nuevos).

### **Fase 2: Audio (MEDIO)**
Estos 2 commits:

```bash
git cherry-pick d8c6932  # voz Google español v1
git cherry-pick ac34203  # voz Google español fix v2
```

**⚠️ ATENCIÓN:** Comparar con los commits únicos de plataforma (`a146a27`, `603e7a3`, `df66b88`). Posible conflicto en `src/lib/voz.ts`.

**Solución:** Revisar ambas estrategias, elegir una, descartar la otra rama.

### **Fase 3: Seguridad + Admin (ALTO)**
Estos 2 commits:

```bash
git cherry-pick 71d0472  # BUG: getSession() en guardado
git cherry-pick a951af4  # Admin: JSON → panel visual
git cherry-pick e597edd  # Admin: tab Sesiones + datos Supabase
```

**Conflictos esperados:** Bajos (cambios localizados en Admin.tsx, voz.ts).

### **Fase 4: Terminología + Documentación (OPCIONAL)**
Si se quiere estar 100% sincronizado con main:

```bash
git cherry-pick 54c2608  # reencuadre (cribado → exploración)
git cherry-pick 88ce49e  # docs ARQUITECTURA
git cherry-pick 4174af7  # npm run salud
git cherry-pick f1a17f0  # renombramientos agentes
git cherry-pick 8d921a2  # chore cierre
```

**Impacto:** BAJO — Solo docs y herramientas, sin cambio funcional en juego.

---

## VERIFICACIÓN POST-CHERRY-PICK

Después de hacer cherry-pick, ejecutar:

```bash
# 1. Build sin errores
npm run build

# 2. Validar componentes nuevos
npm run salud  # Solo si se cherry-pickea 4174af7

# 3. Revisar conflictos manuales
git diff --name-only --diff-filter=U

# 4. Test de accesibilidad
# - Abrir panelAccesibilidad (botón ♿)
# - Activar OpenDyslexic (botón 🔡)
# - Verificar botón Cuenta (👤)

# 5. Test de audio
# - Abrir test-voces.html (public/test-voces.html)
# - Verificar que Google español es default
```

---

## TABLA RESUMEN: GAPS vs VALOR

| Rama | Total commits | Críticos | Faltantes en plataforma | Acción |
|------|---------------|----------|------------------------|--------|
| **main** | 13 | 5 | SÍ (todos) | ✅ Cherry-pick fases 1-4 |
| **diseño** | 3 | 3 | SÍ (ya en main) | ✅ Cubierto por main |
| **contenido** | 0 | 0 | NO (al mismo nivel) | ⏭️ Skip |
| **plataforma** | 8 | 2 | N/A (únicos) | 🔒 Mantener |

---

## CONCLUSIÓN

**La tarea: "Auditar qué mejoras en main/diseño/contenido faltan en plataforma"**

**Respuesta:**
- ✅ **main:** 13 commits faltantes, 5 críticos (accesibilidad, audio, admin, seguridad)
- ✅ **diseño:** 3 commits faltantes (pero ya en main via merge fa08f96)
- ✅ **contenido:** 0 commits faltantes (sincronizado con plataforma)

**Acción recomendada:** Cherry-pick de main en 4 fases (fase 1 URGENTE, fases 2-3 importante, fase 4 opcional).

**Riesgo de no hacerlo:** Codex continúa en plataforma SIN accesibilidad (OpenDyslexic), sin UI mejorada (BotonesGlobales), sin datos en vivo (Admin Sesiones).

---

## ARCHIVOS AFECTADOS POR GAPS

### Nuevos archivos en main que NO existen en plataforma:
- `src/components/BotonesGlobales.tsx` — UI crítica
- `src/components/PanelAccesibilidad.tsx` — Accesibilidad crítica
- `src/lib/accesibilidad.ts` — Lógica accesibilidad
- `public/test-voces.html` — Test audio
- Documentación: `docs/VISION.md`, `docs/ROADMAP.md`, `docs/DECISIONES.md`, `docs/ARQUITECTURA.md`

### Archivos modificados en main vs plataforma:
- `src/App.tsx` — Main añade BotonesGlobales, plataforma no
- `src/index.css` — Main añade CSS OpenDyslexic, plataforma no
- `src/main.tsx` — Main aplica accesibilidad, plataforma no
- `src/lib/voz.ts` — **Conflicto potencial** (estrategia Google español diferente)
- `src/screens/Admin.tsx` — Main tiene tab Sesiones, plataforma no
- `package.json` — Main añade `npm run salud`, plataforma no

---

**Reporte completado:** 2026-06-05 23:45 UTC
