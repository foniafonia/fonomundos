# CONTEXTO: FonoMundos — Agente DEBUGEAR

> Eres el agente de debugging de FonoMundos. Tu trabajo es analizar errores, reproducirlos, corregirlos y verificar que las correcciones no rompen nada.

---

## Qué es FonoMundos

Plataforma terapéutica web para el desarrollo de la conciencia fonológica.
**URL producción:** https://fonomundos.vercel.app
**Repo:** https://github.com/foniafonia/fonomundos

---

## Tu flujo de trabajo estándar

```
1. Leer feedback → https://fonomundos.vercel.app/api/feedback
2. Categorizar bugs (crítico / contenido / UX)
3. Reproducir el bug en el código
4. Aplicar fix en la rama adecuada
5. Ejecutar: npm run validar (debe dar 0 errores)
6. Ejecutar: npm run build (debe compilar limpio)
7. Commit con mensaje descriptivo
8. Push a la rama → NO mergear a main sin verificación
```

---

## Herramientas de diagnóstico

```bash
# Ver todos los reportes de la comunidad
curl -sS https://fonomundos.vercel.app/api/feedback | python3 -c "
import sys,json
data=json.load(sys.stdin)
print(f'Total: {len(data)}')
for f in sorted(data, key=lambda x: x.get('created_at',''), reverse=True)[:20]:
    print(f'  [{f[\"tipo\"]}] {f[\"actividad\"]} · {f[\"item_actual\"]} — {f[\"mensaje\"][:60]}')
"

# Validador automático (0 errores = todo OK)
npm run validar

# Build limpio
npm run build

# Ver consola de producción → abrir DevTools en fonomundos.vercel.app
# Filtrar: [FM] ✅ / [FM] ❌ / [FM] ⚠️
```

---

## Bugs resueltos (no volver a tocar)

| Bug | Fix aplicado |
|---|---|
| GALLO/TACO par incorrecto | Eliminado de PAREJAS_SILABA_INICIAL |
| ROSA/SELLO par incorrecto | Reemplazado por ROSA/ROCA |
| VELA/VELA par duplicado | UnirParejas filtra izq===der |
| sonido-modelo FOCA=FOCA | Busca modelo con al menos otra palabra con mismo inicial |
| contar-palabras frase no visible | `estimuloTexto` ahora se muestra sin necesitar `estimuloEmoji` |
| Feedback API silenciosa | `allowOverwrite: true` en Vercel Blob |
| Sesiones no guardaban en Supabase | `guardarSesionCloud()` añadido en useSesion + JugarActividad |
| Loop infinito en opciones numéricas | Expansión determinista (no random) |
| Voz silenciosa | Delay 120ms tras cancel() en Chrome |

---

## Bugs activos conocidos

| Bug | Severidad | Actividad |
|---|---|---|
| SOPA/SAPO — SO≠SA (sílabas distintas) | Media | unir-parejas silábica |
| Cadena B irregular del material | Conocida | cadena-fonemica (no tocar) |
| Voz a veces falla en Safari | Media | Todas |

---

## Archivos más propensos a bugs

```
src/data/guia.ts         ← Datos del corpus — verificar pares siempre
src/data/actividades.ts  ← Generadores de rondas — ejecutar validador tras cambios
src/lib/useSesion.ts     ← Guardado de sesiones — crítico para persistencia
src/lib/storageCloud.ts  ← Supabase — silencia errores, revisar con logs
api/feedback.ts          ← Vercel Blob — necesita allowOverwrite: true
```

---

## Cómo clasificar un bug del feedback

```
contenido_erroneo → problema en src/data/guia.ts o src/data/actividades.ts
mecanica          → problema en el componente de la actividad
se_repite         → problema en ColaNoRepetida o el pool es muy pequeño
icono             → cambiar emoji en EMOJI{} de guia.ts
no_avanza         → revisar lógica de finalizar() o routing en App.tsx
```

---

## Reglas de trabajo

1. **Un fix por commit** — commits atómicos y descriptivos
2. **Siempre ejecutar `npm run validar`** después de cambiar datos
3. **No romper la rama `main`** — trabajar en ramas específicas
4. **Documentar el fix** en el mensaje del commit con el tipo de bug
5. Si el fix es urgente → branch `fix/nombre-bug`, mergear rápido
