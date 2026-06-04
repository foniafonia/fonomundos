# ARQUITECTURA — FonoMundos

> Documento vivo. Actualizar cuando cambia la estructura, aparece un módulo nuevo o se toma una decisión arquitectónica.
> Esta arquitectura es la REGLA PERMANENTE del proyecto. Ver también: `docs/DECISIONES.md` → D-013.

---

## Principio rector

> FonoMundos no debe crecer como un único videojuego.
> Debe crecer como una plataforma formada por módulos independientes.

Cada módulo tiene **una responsabilidad**, puede evolucionar **de forma independiente** y no debe depender de los detalles internos de otro módulo.

---

## Mapa de módulos

### `plataforma/`
**Responsabilidad:** Todo lo que hace que nada se pierda y que los datos estén seguros.

| Archivo actual | Estado |
|---|---|
| `src/lib/supabase.ts` | ✅ Correcto |
| `src/lib/storageCloud.ts` | ✅ Correcto |
| `src/lib/storage.ts` | ✅ Correcto (fallback local) |
| `src/lib/useSesion.ts` | ✅ Correcto |
| `src/lib/id.ts` | ✅ Correcto |
| `src/screens/AuthScreen.tsx` | ✅ Correcto |
| `src/screens/PanelProfesional.tsx` | ⚠️ Mezcla plataforma + métricas (candidato a dividir) |
| `api/feedback.ts` | ✅ Correcto (serverless) |

**Crece cuando:** login, roles, permisos, multi-tenant, sync, recovery, seguridad.

---

### `contenido/`
**Responsabilidad:** Todo lo terapéutico. Actividades, corpus, mundos, mecánicas.

| Archivo actual | Estado |
|---|---|
| `src/data/guia.ts` | ✅ Correcto (corpus cerrado) |
| `src/data/actividades.ts` | ✅ Correcto |
| `src/data/palabras.ts` | ✅ Correcto |
| `src/components/Policubos.tsx` | ✅ Correcto |
| `src/components/CadenaDomino.tsx` | ✅ Correcto |
| `src/components/JugarActividad.tsx` | ✅ Correcto |
| `src/components/DetectarRima.tsx` | ✅ Correcto |
| `src/components/RAN.tsx` | ✅ Correcto |
| `src/components/Pseudopalabras.tsx` | ✅ Correcto |
| `src/components/ManipulacionMedial.tsx` | ✅ Correcto |
| `src/components/UnirParejas.tsx` | ✅ Correcto |
| `src/components/ClasificarSilabas.tsx` | ✅ Correcto |
| `src/components/BuscaSonido.tsx` | ✅ Correcto |
| `src/components/CrearPalabras.tsx` | ✅ Correcto |
| `src/components/OrdenarFrase.tsx` | ✅ Correcto |
| `src/components/EmparejarOracion.tsx` | ✅ Correcto |
| `src/screens/Mundo1.tsx` | ✅ Correcto |
| `src/screens/Mundo2Rimas.tsx` | ✅ Correcto |
| `src/lib/cadenaValidacion.ts` | ✅ Correcto |
| `src/lib/adaptacion.ts` | ✅ Correcto |

**Crece cuando:** nuevo mundo, nueva actividad, nuevo corpus, nueva mecánica clínica.

---

### `metricas/`
**Responsabilidad:** Medir, analizar, reportar. Todo lo que ayuda al logopeda a entender el progreso.

| Archivo actual | Estado |
|---|---|
| `src/lib/scoring.ts` | ✅ Correcto (9 índices) |
| `src/lib/normas.ts` | ✅ Correcto (datos normativos) |
| `src/components/RadarIndices.tsx` | ✅ Correcto |
| `src/screens/Logopeda.tsx` | ⚠️ Mezcla métricas + plataforma (candidato a dividir) |
| `src/screens/PanelProfesional.tsx` | ⚠️ Tab Progreso pertenece a métricas |

**Crece cuando:** nuevos índices, dashboard avanzado, comparativa entre pacientes, análisis de errores por tipo.

---

### `ui/`
**Responsabilidad:** Cómo se ve y se siente el producto. Sin lógica de negocio.

| Archivo actual | Estado |
|---|---|
| `src/index.css` | ✅ Correcto (tokens, crayon, OpenDyslexic) |
| `src/components/NavBar.tsx` | ✅ Correcto |
| `src/components/FeedbackBtn.tsx` | ⚠️ Mezcla UI + comunidad |
| `src/components/Disclaimer.tsx` | ✅ Correcto |
| `src/components/Personaje.tsx` | ✅ Correcto |
| `src/lib/voz.ts` | ✅ Correcto |
| `src/lib/modoEvaluacion.ts` | ✅ Correcto |
| `src/lib/accesibilidad.ts` | ✅ Correcto |
| `src/screens/Landing.tsx` | ✅ Correcto |
| `src/screens/QueesFonomundos.tsx` | ✅ Correcto |

**Crece cuando:** nuevo tema visual, modo dislexia, alto contraste, animaciones, nuevos patrones de diseño.

---

### `comunidad/`
**Responsabilidad:** Todo lo relacionado con la construcción colaborativa del producto.

| Archivo actual | Estado |
|---|---|
| `src/lib/feedback.ts` | ✅ Correcto |
| `src/screens/Comunidad.tsx` | ✅ Correcto |
| `src/screens/Admin.tsx` | ✅ Correcto |
| `api/feedback.ts` | ✅ Correcto |
| `.github/workflows/auditoria-feedback.yml` | ✅ Correcto |
| `src/components/FeedbackBtn.tsx` | ⚠️ Debería estar aquí, no en ui/ |
| `src/components/FeedbackLogopeda.tsx` | ✅ Correcto |

**Crece cuando:** sistema de votaciones, changelog público, propuestas estructuradas, integración con Telegram.

---

### `ia/`
**Responsabilidad:** Inteligencia artificial, adaptación, personalización. Aún en fase embrionaria.

| Archivo actual | Estado |
|---|---|
| `src/lib/adaptacion.ts` | ✅ Único archivo actual |

**Crece cuando:** itinerario adaptativo, generación de actividades, predicción de riesgo, recomendaciones personalizadas.

---

## Estado de la arquitectura

### ✅ Bien separado
- El corpus (`guia.ts`) es completamente independiente
- Las actividades de contenido no conocen la lógica de plataforma
- Los índices clínicos (`scoring.ts`) son funciones puras sin dependencias de UI

### ⚠️ Candidatos a refactorizar (cuando crezcan demasiado)

| Archivo | Problema | Acción futura |
|---|---|---|
| `PanelProfesional.tsx` | Mezcla plataforma + métricas + UI | Dividir en PanelJugar, PanelEvaluar, PanelProgreso, PanelInformes |
| `Logopeda.tsx` | Mezcla métricas + plataforma (feedback) | Separar FeedbackSection y MetricasSection |
| `FeedbackBtn.tsx` | Mezcla UI + comunidad | Mover lógica a `comunidad/`, dejar solo presentación en `ui/` |

### 🔴 Zonas de alto acoplamiento (vigilar)
- `App.tsx` coordina todo el routing — normal para ahora, revisar si supera 400 líneas
- `guia.ts` es la fuente de verdad del corpus — no dividir, es intencional

---

## Reglas permanentes

### Antes de añadir código nuevo

```
1. ¿A qué módulo pertenece?
2. Si existe el módulo → ampliar ese módulo
3. Si no existe → crear módulo nuevo
4. Documentar en este archivo si es nuevo
5. NUNCA añadir a un archivo genérico por comodidad
```

### Al trabajar en una funcionalidad

```
Rimas       → revisar contenido/ primero
Login       → revisar plataforma/ primero
Estadísticas → revisar metricas/ primero
Diseño      → revisar ui/ primero
```

### Señales de alarma

- Archivo > 400 líneas → candidato a división
- Componente con más de 3 responsabilidades → refactorizar
- `import` cruzados entre módulos no relacionados → revisar dependencias
- `App.tsx` > 400 líneas → separar rutas por módulo

---

## Decisiones arquitectónicas

| Decisión | Fecha | Referencia |
|---|---|---|
| Corpus CERRADO en guia.ts | Mayo 2026 | D-002 |
| Fallback localStorage + Supabase | Junio 2026 | D-003 |
| Modularidad como regla permanente | Junio 2026 | D-013 |

---

## Módulos previstos para el futuro

| Módulo | Cuándo crearlo |
|---|---|
| `ia/` (completo) | Cuando la adaptación supere 3 archivos |
| `mundos/` | Cuando haya Mundo 3+ con lógica propia |
| `integraciones/` | Si se conecta con ClinicCloud, Telegram API, etc. |
| `admin/` | Cuando el panel de administración crezca |
