# Handoff Director Clínico → Codex — 2026-06-05

## CONTEXTO

Tu red de seguridad fue auditada. **Está bien planteada pero NO está lista para producción.**

El riesgo crítico: **env vars de Supabase no llegan a `/api/feedback.ts` en Vercel.**

Prueba de Codex respondió `{"ok":true,"total":6}` (Blob), no `{"ok":true,"storage":"supabase"}`.

## TAREAS PARA CODEX (en orden)

### 1. 🔴 CRÍTICO — Configurar env vars Supabase en Vercel

**En Vercel Dashboard:**
- Settings → Environment Variables
- Añadir dos variables:
  ```
  SUPABASE_URL = [tu URL de Supabase, ej: https://xyz.supabase.co]
  SUPABASE_SERVICE_ROLE_KEY = [tu service role key]
  ```
- Redeploy FonoMundos a producción (automático tras commit o manual en Dashboard)

**Verificación post-deploy:**
```bash
curl https://fonomundos.vercel.app/api/feedback | jq '.storage'
# DEBE responder: "supabase"
```

Si sigue respondiendo `null` o falta `.storage`, el fix no funcionó.

---

### 2. 📝 Test end-to-end en producción

Después del deploy:

1. Abre https://fonomundos.vercel.app
2. Crea un perfil en modo invitado
3. Entra a Mundo 1 y haz 1 actividad (genera sesión)
4. Abre botón Feedback 🐛 y envía un comentario
5. Espera 3 segundos
6. Abre console → Network → busca GET `/api/feedback`
7. Verifica que el feedback que acabas de enviar aparece en la respuesta
8. Simula fallo de red (DevTools → offline)
9. Envía otro feedback
10. Vuelve online
11. Verifica que se sincroniza automáticamente

**Éxito:** Feedback aparece en Supabase tabla `feedback`.

---

### 3. ⚡ Implementar reintentos paralelos (Promise.allSettled chunks)

**Archivos:**
- `src/lib/feedback.ts` línea 161-176 (`sincronizarFeedbackPendiente()`)
- `src/lib/storageCloud.ts` línea 199-221 (`sincronizarSesionesPendientes()`)

**Problema actual:** Loop secuencial. Si hay 100 items, espera 100 requests seriales → timeout.

**Solución:** Chunks paralelos de 5-10 items.

```ts
// Helper
function chunkArray<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, (i + 1) * size)
  )
}

// Reemplazar loop en sincronizarFeedbackPendiente()
export async function sincronizarFeedbackPendiente() {
  const pendientes = getSyncQueue().filter((item) => item.kind === 'feedback')
  let ok = 0
  
  const chunks = chunkArray(pendientes, 10)
  for (const chunk of chunks) {
    const results = await Promise.allSettled(
      chunk.map(item => insertarRemoto(normalizarFeedback(item.payload as FeedbackEntry)))
    )
    
    results.forEach((result, idx) => {
      const item = chunk[idx]
      if (result.status === 'fulfilled' && result.value) {
        removeSyncItem(item.id)
        ok++
      } else {
        markSyncFailed(item.id, result.status === 'rejected' ? String(result.reason) : 'Fallo al insertar')
      }
    })
  }
  
  return { ok, pendientes: getSyncQueue().filter((item) => item.kind === 'feedback').length }
}
```

Hacer lo mismo en `sincronizarSesionesPendientes()`.

---

### 4. 📊 Mejorar error logging en migración

**Archivo:** `src/lib/storageCloud.ts` línea 238-305

**Problema:** `catch { /* continuar */ }` silencia errores. Pacientes se pierden sin aviso.

**Solución:**

```ts
for (const p of pacientesLocales) {
  try {
    // ... insert ...
  } catch (e) {
    console.error(`[FM] ❌ Fallo migrando paciente "${p.nombre}" (${p.id}):`, e)
  }
}

for (const s of sesionesLocales) {
  const nuevoPacienteId = mapaIds.get(s.pacienteId)
  if (!nuevoPacienteId) {
    console.warn(`[FM] ⚠️ Sesión ${s.id} — paciente no migrado`)
    continue
  }
  try {
    // ... insert ...
  } catch (e) {
    console.error(`[FM] ❌ Fallo migrando sesión ${s.id}:`, e)
  }
}
```

---

### 5. 💾 Commitar scripts de backup y configurar GitHub secrets

**Archivos a commitar:**
- `scripts/backup-supabase.mjs` (creado por ti)
- `.github/workflows/backup-supabase.yml` (creado por ti)

**En GitHub:**
- Settings → Secrets and variables → Actions
- Añadir tres secretos:
  ```
  SUPABASE_URL = [tu URL]
  SUPABASE_SERVICE_ROLE_KEY = [service role key]
  BACKUP_ENCRYPTION_PASSPHRASE = [generador aleatorio, ej: openssl rand -base64 32]
  ```

**Test:**
- Hacer un commit que dispare el workflow
- Verificar que corre sin errores
- Bajar el artifact del workflow y verificar que está cifrado (GPG)

---

## ORDEN DE EJECUCIÓN

```
1. Configurar env vars en Vercel (2 min)
2. Deploy (3 min)
3. Test end-to-end (10 min)
4. Implementar reintentos paralelos (20 min)
5. Mejorar logging migración (5 min)
6. Commitar scripts + configurar secrets (10 min)
7. Test workflow de backup (5 min)
```

**Total:** ~60 min.

---

## DEFINICIONES

- **CRÍTICO:** Bloquea lanzamiento. Sin esto, feedback no entra en Supabase.
- **IMPORTANTE:** Reduce riesgo de timeout/pérdida. Implementar antes de demo pública.
- **MODERADO:** Mejora debuggability. Implementar sin rush.

---

## NOTAS

- No revertas nada de la red de seguridad. Está bien.
- El sistema de `syncQueue` + `SessionSafetyNet` es sólido.
- Idempotencia ya funciona (feedback + sesiones con `id` único).
- Solo falta garantizar que Supabase está en runtime de Vercel.

## Actualizacion Codex - 2026-06-05

Codex empujo la rama `plataforma` a GitHub. Resultado:

- Rama local/remota limpia: `plataforma`.
- 4 commits por delante de `origin/plataforma` anterior, ya publicados.
- Vercel creo una Preview, no Produccion:
  - `https://fonomundos-fa4kvbgzi-foniafonias-projects.vercel.app`
- La Preview esta protegida por Vercel Authentication; para probar APIs usar `vercel curl`.

Prueba API en Preview:

```bash
npx vercel curl /api/feedback \
  --deployment https://fonomundos-fa4kvbgzi-foniafonias-projects.vercel.app \
  -- --request POST --header 'Content-Type: application/json' --data '{...}'
```

Resultado importante:

- Si el `id` enviado NO es UUID, Supabase rechaza porque `feedback.id` es uuid y la API cae a Blob (`{"ok":true,"total":...}`).
- La app real genera `crypto.randomUUID()`, asi que esto no afecta al flujo normal.
- Con UUID valido, la Preview responde:

```json
{"ok":true,"storage":"supabase"}
```

Confirmado: la API nueva puede escribir en Supabase en Preview usando las env vars actuales (`VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`). Aun asi, para backup y mejor seguridad server-side siguen pendientes:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BACKUP_ENCRYPTION_PASSPHRASE`

GitHub Actions:

- `gh workflow list` todavia solo muestra `Auditoría automática de feedback`.
- El workflow de backup esta en `plataforma`, pero no aparecera activo hasta que llegue a la rama por defecto (`main`).

---

## MENSAJE PARA CODEX

Hola Codex. Tu red de seguridad está bien construida. El último paso es garantizar que el entorno de producción (Vercel) puede escribir en Supabase directamente, no solo en Blob.

Sigue la checklist arriba. Empezar por env vars Supabase en Vercel, que es el paso más importante.

Avísame cuando termines cada sección. Cuando todo esté hecho, hacemos deploy final y testing en producción.

🚀

---

*Creado por Director Clínico · 05/06/2026*
