# CONTEXTO: FonoMundos — Agente PROGRAMA

> Eres el agente de desarrollo de FonoMundos. Tu trabajo es escribir código, implementar features y mantener la arquitectura.

---

## Qué es FonoMundos

Plataforma terapéutica web para el desarrollo de la conciencia fonológica.
Usada por logopedas, maestros, PT y familias.
**URL producción:** https://fonomundos.vercel.app
**Repo:** https://github.com/foniafonia/fonomundos

## Stack

- React 18 + TypeScript + Vite + Tailwind v4
- Supabase (auth + base de datos)
- Vercel (deploy automático desde `main`)
- `@vercel/blob` para el feedback de la comunidad

---

## Arquitectura de archivos clave

```
src/
  App.tsx              ← Router principal (switch de vistas)
  types.ts             ← Tipos globales (Paciente, Sesion, Dominio...)
  lib/
    supabase.ts        ← Cliente Supabase
    storageCloud.ts    ← CRUD Supabase + fallback localStorage
    useSesion.ts       ← Hook: registra y guarda sesiones
    scoring.ts         ← 9 índices clínicos + alertas
    normas.ts          ← Datos normativos por edad (4-7 años)
    feedback.ts        ← Sistema 🐛 de reportes
    voz.ts             ← SpeechSynthesis wrapper
  data/
    guia.ts            ← CORPUS CERRADO de la guía (fuente de verdad)
    actividades.ts     ← 8 actividades genéricas + colas sin repetición
    palabras.ts        ← ColaNoRepetida + helpers
  screens/
    Landing.tsx        ← Carátula interactiva (imagen con zonas clickables)
    AuthScreen.tsx     ← Login / registro
    PanelProfesional.tsx ← Panel logopeda (4 modos: Jugar/Evaluar/Progreso/Informes)
    Mundo1.tsx         ← Catálogo de actividades
    QueesFonomundos.tsx ← Página informativa
  components/
    JugarActividad.tsx ← Motor genérico de rondas
    Policubos.tsx      ← Contar cubos por sonido/sílaba
    CadenaDomino.tsx   ← Cadena fonémica/silábica con drag&drop
    NavBar.tsx         ← Barra de navegación global
    FeedbackBtn.tsx    ← Botón 🐛 (modo compact + floating)
api/
  feedback.ts          ← Serverless: guarda/lee reportes en Vercel Blob
```

---

## Ramas activas

| Rama | Propósito | Estado |
|---|---|---|
| `main` | Producción | ✅ Estable |
| `plataforma` | Login, datos, persistencia | 🔄 En curso |
| `contenido` | Actividades, corpus, mundos | ⏸️ Pendiente |
| `diseño` | UI/UX, accesibilidad | ⏸️ Pendiente |

**Flujo:** rama → PR → main → Vercel auto-deploya

---

## Estado actual (main)

- 27 actividades jugables
- Validador: **0 errores** (`npm run validar`)
- Build: limpio
- Supabase: configurado en Vercel (env vars presentes)

### Lo que funciona
- Auth completo (login, registro, recuperar contraseña)
- Multi-tenant: cada profesional ve solo sus pacientes
- Sesiones se guardan en Supabase + localStorage como fallback
- Panel logopeda: 4 modos, índices clínicos, evolución, informes
- Feedback de comunidad → `/api/feedback`
- Cola sin repetición en todas las actividades

### Pendiente en rama `plataforma`
- Banner modo invitado ✅ (ya en rama)
- Migración localStorage → Supabase al hacer login ✅ (ya en rama)
- Indicador "☁️ Guardado en la nube" ✅ (ya en rama)
- Falta: mergear a main cuando esté verificado

---

## Comandos útiles

```bash
# Desarrollo
npm run dev

# Verificar que todo está bien
npm run validar

# Build
npm run build

# Deploy a producción
git push origin main
npx vercel deploy --prod --yes

# Ver feedback de la comunidad
curl https://fonomundos.vercel.app/api/feedback | python3 -m json.tool
```

---

## Reglas de trabajo

1. **Nunca tocar `main` directamente** — siempre desde una rama
2. **Ejecutar `npm run validar` antes de cualquier merge** — debe dar 0 errores
3. **Corpus de palabras es CERRADO** — no añadir palabras externas a `guia.ts`
4. **Cada actividad debe pasar 400 rondas** sin errores (lo verifica el validador)
5. Al terminar: commit en la rama correspondiente + push
