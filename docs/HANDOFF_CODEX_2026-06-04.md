# Handoff Codex - 2026-06-04

## LEER PRIMERO - Claude / Dispatch

Este es el archivo que debe leer Claude manana para continuar FonoMundos sin perder contexto.

Ruta local:

`/Users/joseaserraf/Desktop/TODO PROYECTO LOGOPED IA VICTOR Y DEMAS/fonomundos/docs/HANDOFF_CODEX_2026-06-04.md`

Estado:

- Todo lo descrito aqui esta en local, no desplegado.
- No rehacer la red de seguridad desde cero.
- Continuar desde los archivos:
  - `src/lib/syncQueue.ts`
  - `src/components/SessionSafetyNet.tsx`
  - `src/lib/feedback.ts`
  - `api/feedback.ts`
  - `src/lib/storageCloud.ts`
  - `src/lib/useSesion.ts`
  - `src/components/JugarActividad.tsx`
- Prioridad manana:
  1. Revisar diff local.
  2. Probar flujo local.
  3. Avisar antes de hacer deploy.
  4. Desplegar a Vercel solo con confirmacion.
  5. Probar feedback y sesiones en produccion.
  6. Confirmar que `/api/feedback` responde `{"ok":true,"storage":"supabase"}` tras deploy.

Nota importante:

- Codex no puede avisar directamente a Claude externo desde este entorno.
- La notificacion operativa queda guardada en este documento dentro del repo.
- Si se abre Claude Code manana, copiarle o indicarle esta ruta antes de pedirle continuar.

## Contexto

El usuario continuo con Codex tras quedarse sin tokens en Claude. La preocupacion principal era el lanzamiento a redes: cada sesion, comentario profesional y propuesta de mejora vale mucho para el embudo comercial, pero la infraestructura free puede fallar o llegar a limites.

Objetivo de este bloque: reducir perdida de datos sin pagar infraestructura todavia.

## Implementado por Codex

### Red de seguridad local

Nuevo archivo:

- `src/lib/syncQueue.ts`

Guarda una cola local en `localStorage` con eventos pendientes de sincronizar:

- `feedback`
- `session`

La cola registra intentos, errores y emite un evento para que la UI se actualice.

### Feedback mas resistente

Archivo tocado:

- `src/lib/feedback.ts`

Cambios:

- El feedback se guarda localmente como antes.
- Ahora intenta insertar primero en la tabla `feedback` de Supabase.
- Si Supabase falla, intenta `/api/feedback`.
- Si tambien falla, deja el comentario en `syncQueue`.
- Se anadio `sincronizarFeedbackPendiente()`.

### API de feedback con Supabase primero

Archivo tocado:

- `api/feedback.ts`

Cambios:

- `/api/feedback` ahora usa Supabase si existen `SUPABASE_URL`/`VITE_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`/`VITE_SUPABASE_ANON_KEY`.
- Si Supabase no esta disponible, mantiene fallback a Vercel Blob.
- Esto reduce el riesgo del JSON unico en Blob, aunque conviene verificar en produccion que las env vars de runtime existen.

### Sesiones pendientes

Archivos tocados:

- `src/lib/storageCloud.ts`
- `src/lib/useSesion.ts`
- `src/components/JugarActividad.tsx`

Cambios:

- `guardarSesionCloud()` ahora lanza error si Supabase devuelve error.
- Si una sesion no sube a Supabase, se queda en `syncQueue`.
- Se anadio `sincronizarSesionesPendientes()`.
- Las sesiones siguen guardandose localmente siempre como fallback.

### Componente global de seguridad

Nuevo archivo:

- `src/components/SessionSafetyNet.tsx`

Montado en:

- `src/main.tsx`

Comportamiento:

- Indicador flotante abajo a la derecha.
- Muestra si todo esta guardado o si hay datos pendientes.
- Reintenta sincronizar cada 20 segundos.
- Reintenta al recuperar conexion.
- Reintenta en `pagehide`.
- Si el usuario intenta cerrar con pendientes, activa el aviso nativo del navegador.
- Detecta intento de salida con el raton y muestra modal de "Antes de salir".
- Permite dejar una ultima observacion antes de irse.

## Verificacion

Ejecutado:

```bash
npm run build
```

Resultado: build correcto.

Warnings no bloqueantes:

- `@import` CSS deberia ir antes de otras reglas.
- bundle grande > 500 kB.

## Riesgos que siguen abiertos

- Supabase Free no tiene backups automaticos.
- Si Supabase llega a limite de 500 MB puede entrar en modo solo lectura.
- Falta un backup automatico 2 veces al dia a GitHub/Drive/repo privado.
- Falta probar en produccion que `/api/feedback` tiene acceso a las env vars de Supabase en runtime.
- La cola local no es "infinita"; depende del navegador del usuario, pero evita perder datos en fallos normales de red/API.

## Siguiente paso recomendado

1. Deploy a produccion.
2. Probar feedback desde la app.
3. Confirmar que aparece en Supabase `feedback`.
4. Probar simulacion de fallo de red y ver indicador de pendientes.
5. Implementar GitHub Action 2 veces al dia:
   - export Supabase a CSV/JSON/Markdown
   - guardar artifact o subir a repo privado `fonomundos-data`
   - opcional: subir resumen a Drive

## Mensaje para Claude/Dispatch

No rehacer esta pieza desde cero. Continuar desde:

- `src/lib/syncQueue.ts`
- `src/components/SessionSafetyNet.tsx`
- `src/lib/feedback.ts`
- `api/feedback.ts`
- `src/lib/storageCloud.ts`

Prioridad tecnica: verificar produccion y luego crear backup automatico. No usar Drive como base de datos en tiempo real; usarlo como espejo/archivo.

## Continuacion Codex - 2026-06-04

Objetivo del segundo pase: estabilizar la red de seguridad sin hacer deploy.

Cambios anadidos:

- `SessionSafetyNet` ahora evita reintentos solapados con una referencia interna.
- Los reintentos usan `Promise.allSettled`, asi el estado visual no se queda congelado si una rama falla.
- `App` informa a la red de seguridad si el usuario esta en contexto terapeutico activo (`mundo`, `jugar`, `especial`, `resultado`).
- El modal personalizado de "Antes de salir" solo puede aparecer si hay datos pendientes o si el usuario esta en contexto terapeutico activo con actividad reciente.
- Navegar internamente a `Perfiles` no abre el modal.
- Feedback ahora tiene `id` estable desde cliente para que los reintentos sean idempotentes.
- La API `/api/feedback` acepta ese `id` y trata duplicado Supabase (`23505`) como exito.
- Las sesiones pendientes tambien tratan duplicado Supabase (`23505`) como exito.
- Si Supabase no esta configurado, reintentar sesiones pendientes no las duplica en local; se marca el intento como fallido.
- `syncQueue` evita encolar dos veces el mismo feedback o la misma sesion.

Backup:

- Anadido `scripts/backup-supabase.mjs`.
- Anadido `.github/workflows/backup-supabase.yml`.
- El workflow corre 2 veces al dia (`07:00` y `19:00` UTC) y tambien manualmente.
- Exporta `profesionales`, `pacientes`, `sesiones` y `feedback` desde Supabase.
- Sube a GitHub Actions un artefacto cifrado con GPG.
- Requiere secretos:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `BACKUP_ENCRYPTION_PASSPHRASE`
- No sube datos clinicos sin cifrar.

Verificacion ejecutada:

```bash
npm run build
npm run validar
```

Resultado:

- Build correcto.
- Validacion propia correcta: 0 errores, 1 aviso conocido en Cadena B.
- Avisos no bloqueantes: `@import` CSS fuera de orden y bundle > 500 kB.

Prueba local con navegador:

- `http://localhost:5173/` carga correctamente.
- Se creo un perfil local de prueba en modo invitado.
- Al entrar a mundo y volver con `Perfiles`, no aparece el modal "Antes de salir".
- El indicador de seguridad permanece abajo a la izquierda y no pisa el feedback.

Prueba produccion sin deploy:

- Se envio feedback tecnico marcado con id `codex-smoke-feedback-2026-06-04-1735`.
- Produccion respondio `{"ok":true,"total":6}` y el GET posterior muestra la entrada.
- Esa respuesta indica que produccion todavia esta usando la API anterior/fallback Blob, no la respuesta nueva `storage: "supabase"`.
- Por tanto, sin deploy no se puede confirmar que feedback entra en Supabase en produccion. Siguiente paso: desplegar avisando antes y repetir prueba esperando `{"ok":true,"storage":"supabase"}`.
