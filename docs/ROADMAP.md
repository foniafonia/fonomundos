# ROADMAP — FonoMundos

> Hoja de ruta del proyecto. Actualizar cuando una fase cambia de estado.
> Última actualización: junio 2026

---

## FASE 1 — Demo funcional y estable
### Estado: 🟡 EN CURSO (80% completado)

**Objetivo:** Que cualquier logopeda pueda usar la herramienta con pacientes reales sin encontrar errores graves.

### Completado ✅
- 27 actividades jugables (3 bloques: fonémica, silábica, léxica)
- Corpus fiel a la guía de Sara Durán / Profe Ana / Celia Sancho
- Motor de medición: aciertos, errores, tiempo, intentos, ayudas
- 9 índices clínicos automáticos
- Datos normativos por edad (4-7 años)
- Alerta doble déficit (dislexia en español)
- Protocolo de cribado 20-30 min
- Panel logopeda con 4 modos (Jugar/Evaluar/Progreso/Informes)
- Auth con Supabase (multi-tenant)
- Sistema de feedback 🐛 con GitHub Issues automáticos
- Landing interactiva tipo carátula videojuego
- Deploy en Vercel (https://fonomundos.vercel.app)
- Validador automático: 0 errores

### Pendiente 🔄
- [ ] Migración datos invitado → cuenta (en rama `plataforma`)
- [ ] Indicador visual "guardado en la nube"
- [ ] Verificación end-to-end: jugar → guardar → ver en panel
- [ ] Resolver bugs activos del feedback de comunidad
- [ ] Tipografía para dislexia (OpenDyslexic)
- [ ] Audio en todas las actividades léxicas

### Criterio de finalización
> Un logopeda real puede: crear cuenta, crear paciente, jugar 3 sesiones, ver evolución, exportar informe. Sin encontrar ningún error grave.

### Dependencias
- Supabase estable ✅
- Vercel deploy ✅
- Al menos 2 logopedas beta testers

---

## FASE 2 — Herramienta profesional para logopedas
### Estado: ⏸️ PENDIENTE

**Objetivo:** Que FonoMundos sea la herramienta que un logopeda abre todos los días en consulta.

### Objetivos
- Mundo 2 (Rimas) completo con todas sus actividades
- Datos normativos validados con muestra real española
- Informe PDF clínico con formato presentable para familias/colegios
- Panel de métricas avanzado: fonemas más difíciles, actividades más usadas, tiempo medio
- Notificaciones: "el Paciente X no ha trabajado en 7 días"
- Modo familia: versión simplificada para práctica en casa
- Soporte para múltiples idiomas (catalán, euskera, gallego)

### Prioridades
1. Completar Mundo 2 (Rimas) — crítico para secuencia pedagógica
2. Informe PDF mejorado — necesario para comunicar con colegios
3. Datos normativos — para que los índices sean clínicamente válidos
4. Panel métricas — para que el logopeda entienda patrones de uso

### Dependencias
- Fase 1 completada y estable
- Comunidad beta de al menos 20 logopedas activos
- Datos de al menos 200 sesiones reales para normas

### Criterio de finalización
> Un logopeda externo (que no conoce el proyecto) puede usar FonoMundos durante 1 mes con pacientes reales y afirmar que es más útil que sus materiales actuales.

---

## FASE 3 — Integración en membresía Logoped-IA
### Estado: ⏸️ PENDIENTE

**Objetivo:** FonoMundos como herramienta premium del ecosistema Logoped-IA.

### Objetivos
- Integración con cuenta Logoped-IA (SSO)
- Acceso por niveles: Free (limitado) / Pro (completo) / Clínica (multi-profesional)
- Facturación y gestión de suscripciones
- API para integradores (colegios, centros)
- White-label para centros terapéuticos
- Modo "clase": un maestro gestiona 25 alumnos simultáneamente

### Prioridades
1. Definir modelo de negocio (freemium, suscripción mensual, por centro)
2. Implementar roles: admin / profesional / familia
3. Integrar con sistema de membresía existente

### Dependencias
- Fase 2 completada
- Modelo de negocio definido
- Base de usuarios activos: 50+ profesionales

### Criterio de finalización
> FonoMundos genera ingresos recurrentes suficientes para ser sostenible sin depender de la disponibilidad personal del autor.

---

## FASE 4 — Escalabilidad
### Estado: ⏸️ FUTURO

**Objetivo:** FonoMundos puede crecer sin que el autor tenga que intervenir en cada mejora.

### Objetivos
- Generador automático de actividades a partir del corpus
- Panel de administración para que la comunidad proponga y vote contenido
- Sistema de contribuciones clínicas verificadas
- Expansión a América Latina (normativas por país)
- Integración con sistemas de gestión clínica (ClinicCloud, etc.)
- Validación científica publicada en revista especializada

### Dependencias
- Fase 3 estable
- Comunidad activa de contribuidores clínicos
- Recursos para estudio de validación

---

## FASE 5 — IA adaptativa y personalización
### Estado: ⏸️ FUTURO LEJANO

**Objetivo:** FonoMundos aprende de cada niño y personaliza el tratamiento.

### Objetivos
- Itinerario terapéutico adaptativo basado en el perfil individual
- Reconocimiento de voz para validar producción oral
- Predicción de riesgo lector con 3 sesiones de datos
- Recomendaciones automáticas al logopeda basadas en patrones
- Generación de actividades personalizadas mediante LLM
- Integración con historia clínica electrónica

### Dependencias
- Base de datos con 10,000+ sesiones reales
- Validación científica completada
- Equipo técnico dedicado (no solo Claude + 1 persona)

---

## Métricas de éxito global

| Métrica | Fase 1 | Fase 2 | Fase 3 | Fase 4 |
|---|---|---|---|---|
| Logopedas activos | 10 | 100 | 500 | 2000 |
| Sesiones/mes | 50 | 500 | 5000 | 50000 |
| NPS (satisfacción) | >40 | >60 | >70 | >75 |
| Errores críticos | <5 | 0 | 0 | 0 |
| Ingresos mensuales | 0 | 0 | sostenible | crecimiento |
