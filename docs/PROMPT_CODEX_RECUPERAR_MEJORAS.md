# Prompt para Codex — Recuperar mejoras de diseño/dislexia

## CONTEXTO

Estás en rama `plataforma` (red de seguridad). Esa rama divergió de `main` hace poco.

En `main` existen mejoras que no están en `plataforma`:

### ✅ Commits a recuperar

| Commit | Título | Descripción |
|--------|--------|-------------|
| `fa08f96` | OpenDyslexic + accesibilidad + BotonesGlobales | Botones 👤 Cuenta + 🔡 Letra siempre visibles; panel selector de fuente |
| `665f3d4` | Tipografía dislexia + panel accesibilidad | Cambiar entre fuente normal y OpenDyslexic en tiempo real |
| `7196a6f` | BotonesGlobales | Botones globales siempre visibles |

### ❌ Mejoras QUE FALTAN ahora en `plataforma`

1. **Botones de tipo de fuente para dislexia** (OpenDyslexic vs. normal)
   - Selector visual en la interfaz
   - Aplicar fuente en tiempo real a todo el juego

2. **Franja/indicador de tiempo** 
   - Mostrar tiempo transcurrido mientras juega
   - Datos en tiempo real (puntos, intentos, tiempo)

3. **Panel de datos en vivo durante sesión**
   - Metrics reales mientras juega
   - Visualización de progreso

---

## TAREA PARA CODEX

**Opción A (recomendada):** Cherry-pick los commits de main
```bash
git cherry-pick fa08f96 665f3d4 7196a6f
```

Esto traería las mejoras a `plataforma` sin perder tu trabajo de red de seguridad.

**Opción B:** Reimplementar manualmente
- Leer los cambios en esos commits
- Implementar en `plataforma` de nuevo
- Asegurar que no rompan la red de seguridad

---

## VERIFICACIÓN post-fix

```bash
npm run build
npm run validar
```

- [ ] Build limpio
- [ ] Validador 0 errores
- [ ] Los botones de fuente dislexia aparecen
- [ ] El indicador de tiempo funciona
- [ ] Los datos en vivo se actualizan durante juego

---

## COMMIT MESSAGE

```
feat(diseño): recuperar OpenDyslexic + botones globales + datos en tiempo real

Cherry-pick fa08f96, 665f3d4, 7196a6f desde main.
Restaura:
- Selector OpenDyslexic/fuente normal
- Botones 👤 Cuenta + 🔡 Letra visibles siempre
- Panel accesibilidad
- Indicador tiempo en tiempo real
```

---

**Avísame cuando termines. Luego hacemos merge a main + deploy.**
