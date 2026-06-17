# INSTRUCCIONES FINALES PARA DISPATCH — FonoMundos

**SITUACIÓN:** FonoMundos está listo para lanzar a producción. Código completado, probado, sin errores. Falta último paso: mergear a main y verificar en producción.

**TÚ ESTÁS EN CASA. TIENES 5 MINUTOS LIBRES. AQUÍ ESTÁ TODO LISTO.**

---

## PASO 1 — Mergear a main (2 minutos)

```bash
cd /Users/joseaserraf/Desktop/TODO\ PROYECTO\ LOGOPED\ IA\ VICTOR\ Y\ DEMAS/fonomundos

git checkout main
git merge plataforma
git push origin main
```

**Eso es TODO.** Vercel auto-deploya automáticamente en 2-3 minutos.

No necesitas esperar. Sigue con el Paso 2 mientras Vercel trabaja.

---

## PASO 2 — Verificar en producción (3 minutos, después de deploy)

Una vez que Vercel termine (recibirás notificación en GitHub o puedes refrescar https://fonomundos.vercel.app):

### Test 1: ¿La app funciona?
- Abre: https://fonomundos.vercel.app
- Crea un perfil invitado
- Juega 1 actividad
- ¿Funciona sin errores?
  - **Sí** → ✅ Continúa Paso 3
  - **No** → 🔴 Problema crítico, reporta

### Test 2: ¿Se guardan los datos?
```bash
curl https://fonomundos.vercel.app/api/feedback | jq '.storage'
```

**Esperas ver:** `"supabase"`

- **Si responde `"supabase"`** → ✅ Perfecto. Env vars OK. Supabase funcionando.
- **Si no aparece `.storage` o es `null`** → ⚠️ Env vars server-side no llegaron. Ver **SOLUCIÓN** abajo.

---

## ⚠️ SI FALLA EL TEST 2

Si `/api/feedback` NO responde `"supabase"`, significa que las env vars **server-side** no están en Vercel runtime.

**SOLUCIÓN (5 minutos):**

1. Ir a: https://vercel.com → proyecto FonoMundos → Settings → Environment Variables

2. Añadir (si no existen):
   ```
   SUPABASE_URL = [tu URL, ej: https://xyz.supabase.co]
   SUPABASE_SERVICE_ROLE_KEY = [tu service role key]
   ```

3. **Redeploy manual:**
   - En Vercel Dashboard → Deployments → [último deploy]
   - Click "Redeploy"

4. Esperar 2-3 min y vuelve a probar:
   ```bash
   curl https://fonomundos.vercel.app/api/feedback | jq '.storage'
   # Debe responder: "supabase"
   ```

---

## RESUMEN CHECKLIST

- [ ] `git merge plataforma` en main
- [ ] `git push origin main`
- [ ] Esperar deploy Vercel (2-3 min)
- [ ] App funciona en https://fonomundos.vercel.app ✓
- [ ] `/api/feedback` responde `"storage":"supabase"` ✓
- [ ] **Si no** → Añadir env vars server-side y redeploy
- [ ] Verificar segunda vez que responde `"supabase"`

---

## HISTÓRICO DE LO QUE PASÓ

**Esta mañana/tarde:**
1. Director Clínico auditó red de seguridad → encontró riesgo env vars
2. Codex implementó cherry-picks + OpenDyslexic + BotonesGlobales
3. Inspector auditó gaps entre ramas → nada crítico faltaba
4. Todo probado localmente, sin errores
5. Código listo en rama `plataforma`

**Ahora (tú, en casa):**
- Mergear + push (automático Vercel)
- Verificar en producción
- Si env vars fallan → fix rápido (5 min)

---

## CONTACTOS

Si algo explota:
- Vercel Status: https://www.vercel.com/status
- GitHub Actions: https://github.com/foniafonia/fonomundos/actions
- Supabase status: https://status.supabase.com

---

## IMPORTANTE

**NO hay riesgo de pérdida de datos:**
- Feedback se guarda en Blob (Vercel) como fallback
- Sesiones se guardan en Supabase + localStorage
- Backup automático 2x/día a GitHub (encrypted)

Esto es **seguro**. Solo falta confirmar que Supabase es la fuente primaria, no Blob.

---

**TIEMPO TOTAL:** 10 minutos (5 merge + push, 5 verificación).

**GO.** 🚀
