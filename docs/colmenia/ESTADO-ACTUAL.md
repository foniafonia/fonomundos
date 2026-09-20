# ESTADO ACTUAL — traspaso a una sesión local

> Escrito el 20/9/2026 al cerrar la sesión en la nube. Si abres Claude Code en local,
> empieza leyendo esto y luego `CLAUDE.md` en la raíz.

## Dónde está todo

Repositorio **foniafonia/fonomundos**, rama **`claude/newsletter-linkedin-definition-qx7qgu`**.
Todo lo de abajo está commiteado y subido. Nada vive solo en el chat.

```
docs/colmenia/
├── CLAUDE.md (en la raíz del repo)   Contexto obligatorio. Leerlo antes de proponer nada.
├── ESTADO-ACTUAL.md                  Este archivo.
├── agenda-eventos.md                 Hitos: COLOGEX, Logopedia Mail, AELFA, Skool.
├── banco-ideas.md                    IDEAs 001–020 con su estado.
├── brief-colmenia-para-skool.md      Qué es COLMENIA, para quien monte la comunidad.
├── linea-editorial.md                Cómo se escribe la newsletter.
├── estrategia-linkedin.md
├── ediciones-anteriores-referencia.md Textos publicados nº1/4/5/6 + patrones.
├── colmenia-vault/                   23 prompts (framework RITE) + manual de voz.
├── contexto/                         Capas antiguas. Reconstruir modelo mental, no obedecer.
├── newsletter-001 … newsletter-008   Una por edición, con notas de producción.
└── visuales-008/                     Material gráfico de la nº8 + su código fuente.

colmenia-landing/                     Portada 3D interactiva de COLMENIA (React+R3F).
```

## Lo que está cerrado

**Newsletter Nº 8** — `docs/colmenia/newsletter-008-el-gesto-que-no-encuentras.md`.
Texto final entregado a José el 20/9 para pegar en LinkedIn. Eje: el buscador de
gestos de Schaeffer que pidió Virginia, y la línea de los 13/14 años. Confirmado
por José: Virginia dio el OK para su nombre de pila; los 400 € se pueden usar
(se lo regaló porque participa mucho); AELFA, Granada y Alicante entran; Comunica
va como "en pruebas" citando ARASAAC; la caja de regalo solo se anuncia.

**Material visual de la nº8** — `docs/colmenia/visuales-008/`. Cinco piezas en
`out/`, generadas con `python3 build.py && node shoot.mjs`. Se rehacen solas si
cambia una cifra. Las fuentes de marca están descargadas en `fonts/`.

**Portada interactiva** — `colmenia-landing/`. Funciona, con segunda pasada de
dirección artística hecha. `npm install && npm run dev`. Sin desplegar.

## Lo que queda abierto

| Qué | Estado |
|---|---|
| Publicar la nº 8 | El texto está listo. Lo pega José. |
| Post de anuncio en el perfil | No escrito. Es distinto del texto de la newsletter. |
| Miembros de Skool | **No hay ni un nombre registrado.** Ver abajo. |
| Mensaje de bienvenida | Borrador dado el 20/9 en chat, sin usar todavía ni guardar. |
| Nº 9 | Candidata: IDEA 018 (la IA aprueba el examen y suspende con el paciente). **Sus datos citados están sin verificar**: SB 903, The Path 14,3 M$, VERA-MH, Stanford, DPA neerlandesa, FTC/DoNotPay, FDA. Verificar antes de escribir. |
| Numeria | `https://foniafonia.github.io/numeria-prototipo/` — José nunca dijo qué hace. |
| Rutina de investigación cada 2 días | Bloqueada: `create_trigger` pide una aprobación que José no encuentra en la app de escritorio. |
| Caja de regalo | Cuando abra, tiene edición propia. |

## Lo que una sesión en la nube NO pudo hacer

El entorno remoto sale a internet por un proxy de política que devuelve **403** para:

- `www.linkedin.com`
- `www.skool.com`
- `t.me`
- `foniafonia.github.io`
- `www.opossum.es`

No es un fallo ni algo que se pueda sortear: el propio manual del entorno dice
que un 403 de política no se reintenta, se reporta. **Consecuencia práctica: nunca
he visto LinkedIn ni Skool por dentro.** Todo lo que sé de la comunidad me lo ha
contado José o son capturas que ha pegado.

**En local esto desaparece**, porque la sesión usa la red de su Mac. Lo primero que
conviene hacer en la sesión local:

1. Abrir la lista de miembros de Skool y crear `docs/colmenia/skool-miembros.md`
   con nombre, fecha de alta, perfil, si está contestado y qué respondió. Sin eso
   no se puede responder a "quién ha entrado y no he contestado".
2. Guardar la analítica de la newsletter en el repo en vez de por capturas sueltas.

## Lo que hay que saber del proyecto, en corto

Lo largo está en `CLAUDE.md`. Lo que más se ha incumplido y más caro sale:

- **La newsletter no es un boletín de novedades.** Una idea por edición, con relato
  y criterio. Fallamos en esto en la nº7 y José lo paró a tiempo.
- **Si una edición va dirigida a un colectivo, el título y el gancho le hablan a
  ese colectivo primero.** Regla fija tras el fallo real de la nº5.
- **Los números de comunidad no van de titular.** La métrica es si el profesional
  trabaja mejor, no el contador de miembros.
- **Nunca inventar datos.** Ni clínicos, ni de miembros, ni cifras. Si no consta,
  se dice que no consta.
- **Voz:** `colmenia-vault/manual-voz-colmenia.md`. Sin verbos de epopeya, sin
  "no es solo X, es Y", sin cierres motivacionales, sin emojis, sin anglicismos
  evitables. Lenguaje inclusivo en ejemplos con menores.
- **Enlaces en texto plano y completos**, que en markdown no se copian bien a
  LinkedIn.

## Diagnóstico que conviene no perder

La newsletter tiene 1.091 suscriptores en LinkedIn, 15 % de apertura y prácticamente
cero conversión desde el principio. El único post que movió tráfico de verdad
(8 clics a Telegram) fue el más simple y con una sola llamada. El número de
suscriptores es real pero es una métrica de vanidad: su valor es servir de embudo
hacia Telegram y Skool. La nº7 fue la primera que metió gente dentro de Skool —
ese es el dato bueno, y el riesgo ahora es que la sala esté vacía mientras la
comunidad sigue cerrada.
