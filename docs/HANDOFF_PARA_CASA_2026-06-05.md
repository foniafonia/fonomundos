# Handoff para Casa — FonoMundos Deploy Ready

**Fecha:** 05/06/2026  
**Estado:** A punto de lanzar  
**Ubicación código:** `/Users/joseaserraf/Desktop/TODO PROYECTO LOGOPED IA VICTOR Y DEMAS/fonomundos`

---

## CONTEXTO RÁPIDO

- **Branch actual:** `plataforma` (red de seguridad implementada)
- **Servidor local:** http://localhost:5173 (corre en background)
- **Producción:** https://fonomundos.vercel.app

---

## ESTADO ACTUAL (5 de junio)

✅ **Red de seguridad:** syncQueue + SessionSafetyNet implementadas  
✅ **OpenDyslexic:** Cherry-picked + aplicado de base  
✅ **Botones globales:** 👤 Cuenta + 🔡 Letra visibles  
✅ **Admin:** Sesiones en vivo funcionando  
✅ **Env vars Supabase:** Configuradas en Vercel  
✅ **Build:** Limpio, validador OK  

---

## SIGUIENTE PASO

**Cuando llegues a casa:**

1. Abre Dispatch → Claude Code
2. Continúa con Codex (agente que está trabajando)
3. Pregunta: **¿Qué queda antes de mergear a main y deploy?**

**Si todo está OK:**
```bash
git checkout main
git merge plataforma
git push origin main
# → Vercel auto-deploya a https://fonomundos.vercel.app
```

---

## DOCUMENTACIÓN DE REFERENCIA

Leer EN ORDEN:

1. **`docs/VISION.md`** — Qué es FonoMundos y hacia dónde va
2. **`docs/ARQUITECTURA.md`** — Cómo está organizado el código (módulos)
3. **`docs/DECISIONES.md`** — Decisiones importantes (D-001 a D-013)
4. **`docs/ROADMAP.md`** — Fases del proyecto (estamos en FASE 1 — 80%)
5. **`docs/agentes/DIRECTOR_CLINICO.md`** — Tu rol y estado
6. **`docs/PROTOCOLO_DIRECTOR_CLINICO.md`** — Cómo coordinar agentes
7. **`docs/HANDOFF_DIRECTOR_2026-06-05.md`** — Qué hizo Codex con red de seguridad
8. **`docs/AUDITORIA_GAPS_RAMAS.md`** — Qué mejoras se cherry-pickeron
9. **`docs/PROMPT_CODEX_RECUPERAR_MEJORAS.md`** — Por qué cherry-pick fue necesario

---

## AGENTES DISPONIBLES

- **Codex** — Implementación código, fixes, cherry-picks (sigue en rama `plataforma`)
- **Inspector** — Auditoría, bugs, validación (ya completó auditoria de gaps)
- **Constructor** — Nuevas features (esperando Fase 1 completada)
- **Cerebro Clínico** — Validación contenido clínico

---

## CRÍTICO ANTES DE DEPLOY

- [ ] Env vars SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en Vercel ✓ (ya hecho)
- [ ] /api/feedback responde `{"ok":true,"storage":"supabase"}` ← **VERIFICAR POST-DEPLOY**
- [ ] OpenDyslexic visible de base en toda la UI
- [ ] Botones globales visibles
- [ ] Red de seguridad (SessionSafetyNet) funciona
- [ ] Build limpio, validador 0 errores

---

## COMANDOS ÚTILES

```bash
cd /Users/joseaserraf/Desktop/TODO\ PROYECTO\ LOGOPED\ IA\ VICTOR\ Y\ DEMAS/fonomundos

# Ver estado
git status
git branch -a

# Verificar red de seguridad
npm run build
npm run validar

# Mergear a main (cuando esté listo)
git checkout main
git merge plataforma
git push origin main

# Loguear cambios
git log --oneline plataforma..main  # Qué hay en plataforma que no en main
```

---

## URL IMPORTANTE

**Servidor local:** http://localhost:5173  
**Comparador voces:** http://localhost:5173/comparador-voces.html  
**App completa:** http://localhost:5173

---

## NOTAS

- No hagas deploy manual a Vercel. Git push a main → Vercel auto-deploya.
- Si algo falla en deploy, revisar GitHub Actions (CI/CD).
- Backup de datos en Supabase cada 2x/día (workflow configurado).
- Token presupuesto Haiku agotado — rotado a Sonnet cuando sea necesario.

---

**RESUMEN:** Todo listo. Codex terminó cherry-picks. Verificar que funciona y mergear a main. Vercel se encarga del deploy automático.

**Cuando llegues a casa, continúa desde aquí. 🚀**
