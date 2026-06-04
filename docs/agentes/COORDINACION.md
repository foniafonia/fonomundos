# CONTEXTO: FonoMundos — Hilo de COORDINACIÓN

> Este es el hilo maestro. Toma decisiones de arquitectura, prioriza trabajo entre agentes y mantiene la visión global del proyecto.

---

## Estado del proyecto (actualizado: junio 2026)

**URL producción:** https://fonomundos.vercel.app
**Repo:** https://github.com/foniafonia/fonomundos
**Build:** ✅ limpio | **Validador:** ✅ 0 errores | **Supabase:** ✅ configurado

---

## El grupo de trabajo

| Agente | Responsabilidad | Cuándo llamarlo |
|---|---|---|
| **PROGRAMA** | Código, features, arquitectura | Implementar algo nuevo |
| **DEBUGEAR** | Bugs, fixes, calidad | Algo está roto o el feedback dice que falla |
| **ANALIZAR LOGOPEDA** | Contenido clínico, evidencia | Validar algo con la guía, proponer actividades |
| **COORDINACIÓN** (este) | Visión global, prioridades, decisiones | Antes de empezar una tanda de trabajo |

---

## Ramas activas

```
main       → producción (siempre estable)
plataforma → persistencia de datos, auth (EN CURSO)
contenido  → nuevas actividades, corpus (PENDIENTE)
diseño     → UI/UX, accesibilidad (PENDIENTE)
```

**Flujo:** trabajar en rama → verificar → merge a main → Vercel deploya

---

## Prioridades actuales

### 🔴 Urgente
1. Mergear rama `plataforma` a main (migración invitado→cuenta lista)
2. Verificar que sesiones se guardan bien en Supabase para todos los usuarios

### 🟡 Siguiente sprint
3. Tipografía para dislexia (OpenDyslexic) — pedida por comunidad
4. Audio en ordenar-frase y otras actividades léxicas
5. Mundo 2 Rimas completo (ahora solo 2 actividades de 6)

### 🟢 Más adelante
6. Validación científica (100 niños/grupo de edad)
7. Mundos 3-5 (Lectura, Vocabulario, Morfosintaxis)
8. App nativa (React Native)

---

## Lo que YA funciona (no rehacer)

- Auth completo con Supabase
- 27 actividades jugables con corpus fiel al material
- Panel logopeda con 9 índices clínicos + normas por edad
- Protocolo de cribado 20-30 min
- Sistema de feedback de comunidad (🐛 en todas las pantallas)
- GitHub Actions: issues automáticos 2x/día con reportes
- Landing interactiva con imagen carátula
- Grid tipo Steam/Netflix en catálogo
- Datos normativos por edad (4-7 años)
- Alerta doble déficit (dislexia)
- Cola sin repetición en todas las actividades

---

## Decisiones de arquitectura tomadas

| Decisión | Razón |
|---|---|
| 1 repo con ramas (no forks separados) | Menos sincronización, más sencillo |
| Corpus CERRADO (no palabras externas) | Fidelidad al material original |
| localStorage + Supabase dual | Funciona offline, guarda en nube si hay cuenta |
| Validación por secuencia (no por regla) | La cadena B del material incumple la regla |
| Evaluación = Opción A (juego → datos automáticos) | Menos ansiedad, más validez ecológica |
| Pseudonimización (Paciente 1, 2...) | Cumplimiento RGPD/LOPDGDD |

---

## Filosofía del proyecto

> "FonoMundos no está terminado. Se construye con la comunidad."

- La herramienta es transparente sobre sus limitaciones
- El feedback de los usuarios define las prioridades
- La comunidad de Telegram @LOGOPED_IA es parte del desarrollo
- Cada reporte mejora la herramienta

---

## Cómo sincronizar los agentes

1. **Antes de empezar** → leer este archivo + el archivo del agente correspondiente
2. **Al terminar** → commit en la rama + push + actualizar este archivo si hay cambios de prioridad
3. **Para mergear a main** → pasar por este hilo para decisión

---

## Contacto externo

- Telegram comunidad: https://t.me/logoped_ia
- Feedback API: https://fonomundos.vercel.app/api/feedback
- Panel Admin: fonomundos.vercel.app → 5 clics en 🦉 → PIN logoped49
