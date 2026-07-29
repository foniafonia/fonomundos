# 🐝 COLMENIA · Cuaderno de laboratorio — Nº 4
**Título:** La parte de la consulta que llevo años dando de más
**Estado:** cerrada, lista para publicar. Enlace de la demo confirmado por José:
https://claude.ai/code/artifact/7ca48a01-2f56-4e21-a9d2-1c3343747d29
(Nota: este enlace devolvió 403 en todas mis pruebas de acceso durante la sesión — José
debe verificarlo él mismo en una ventana de incógnito antes de publicar, para confirmar que
carga sin pedir login a un desconocido.)
**Portada:** captura real de la propia herramienta "Antes de consultar", puesta por José.

**Historial de la edición (por qué cambió tanto):**
1. 1ª versión: "he sido la hermana de la caridad muchos años" (Fönia) + framework de reparto
   becas/privados como regalo. Descartada — José: "te has metido demasiado en mi clínica, no
   hace falta mojarse tanto, no hay que hablar de becas."
2. 2ª versión: pivote a "la primera revolución de la IA en logopedia será administrativa"
   (evidencia real: revisión IA educación/INTEF + guías de automatización), regalo = checklist
   de 4 preguntas de protección de datos. Buena pero se quedó en la nevera al aparecer algo mejor.
3. 3ª versión (ESTA, final): lanzamiento real de la herramienta **"Antes de consultar"**
   (proyecto Colmenia, antes "Fönia" — renombrado global confirmado por José, código Next.js
   verificado directamente por fragmento de `layout.tsx` pegado en el chat). Fusiona el hilo
   emocional de "hermana de la caridad" (el rato regalado explicando lo básico antes de la
   consulta) con un regalo real y probable: la herramienta en beta. Ampliada a petición de
   José para hablar también a padres/familias, no solo a profesionales, y para ser una
   edición "muy completa" — decisión explícita suya de salirse del formato breve para este
   lanzamiento concreto.

**Nota de verificación:** no pude comprobar el repo/código directamente (vive en un proyecto
fuera del scope de esta sesión; el enlace de demo en claude.ai/code/artifact/... devuelve 403
para mis herramientas). Verificado solo por el fragmento de código pegado por José
(`app/layout.tsx`, metadata "ANTES DE CONSULTAR — Colmenia") y su propio informe de la sesión
donde hizo el renombrado (27 ficheros, 23 tests, build en verde). Coherente y creíble, no
verificado al 100% por mí.

---

🐝 COLMENIA · Cuaderno de laboratorio · Entrada nº 4

La parte de la consulta que llevo años dando de más

Cada primera consulta empieza igual: alguien intentando explicarme, con las palabras que tiene, lo que le pasa a su hijo o hija, o lo que le pasa a ella o él mismo. "No habla bien." "No lee." "Se atraganta." Y antes de poder hacer mi trabajo de verdad, hago otro: explicar qué es la logopedia, traducir la jerga que va a oír, ayudar a poner en palabras algo que llevan meses notando pero no sabían cómo contar.

Nunca me ha importado no cobrar ese rato — es la parte de mi trabajo que más valoro, la que me hizo elegir esta profesión. El problema no es el dinero. El problema es que, hecho a mano, sesión tras sesión, no escala: cuantas más familias llegan, menos tiempo me queda para la parte que de verdad solo puedo hacer yo — estar delante de la persona con criterio.

Y esto no es solo mío. Si eres maestro y te toca explicarle a una familia por primera vez por qué pides una evaluación psicopedagógica, si eres psicólogo y ves esa misma cara de "no sé por dónde empezar" en la primera cita, si eres orientador mediando entre el centro y la familia — es el mismo cariño, dado de la misma forma, sin que escale.

Y si eres tú quien va a llevar a tu hijo o hija (o a ti mismo) a una primera consulta: seguramente también reconoces la otra cara de ese momento — llegar sin saber qué es relevante decir, con miedo a no explicarte bien, a que se te olvide lo importante delante del profesional.

Así que llevo semanas construyendo algo para automatizar esa parte, sin perder lo que tiene de bueno.

**Qué es exactamente**

Se llama "Antes de consultar". No diagnostica ni sustituye a nadie — hace lo contrario: acompaña, una pregunta cada vez, a mirar con calma y poner en palabras lo que se ve.

Empieza explicando, con calma, qué es la logopedia y qué suele pasar en una primera consulta. Traduce la jerga que probablemente vas a oír, para que no te pille de nuevas. Luego pregunta qué es lo que más preocupa ahora mismo — con tus propias palabras, "como se lo contarías a alguien de confianza" — y con qué área tiene que ver, sobre todo, eligiendo entre pronunciación y habla, comprensión y lenguaje, fluidez (tartamudez), voz, deglución y alimentación, lectura y escritura, comunicación y desarrollo, u otra cosa si no estás seguro. No es una etiqueta — solo ajusta las siguientes preguntas.

Al final, prepara un resumen para llevar a la consulta, y hasta la frase para pedir la cita.

Y algo que no es un detalle menor: nada de esto sale de tu navegador. No hay cuenta, no hay servidor guardando datos de un menor ni de nadie — puedes borrar la sesión cuando quieras. Y si en algún momento hay una señal de urgencia real (dificultad para respirar, atragantamiento grave, pérdida brusca del habla o del conocimiento), la herramienta lo dice claro: eso no espera a una consulta, eso es urgencias ya.

**Si no la pruebas ahora mismo, quédate con esto**

Tanto si eres profesional derivando a una familia como si eres tú quien va a la consulta, estas tres preguntas valen para cualquier primera cita, con o sin herramienta:
1. ¿Qué es exactamente lo que más te preocupa, en tus propias palabras, sin usar términos que no dominas?
2. ¿Desde cuándo lo notas, y ha cambiado (a mejor o a peor) en ese tiempo?
3. ¿Qué has probado ya, y qué pasó cuando lo probaste?

Con esas tres respuestas preparadas, la primera consulta rinde el doble — se lo dice cualquier profesional que la haya vivido desde el otro lado de la mesa.

**En qué punto está esto, sin adornarlo**

Este cuaderno es de laboratorio, no escaparate. Es una primera versión, en pruebas. Falta validación clínica real de las preguntas y las referencias por edad. Falta revisión legal de los textos. Y todavía vive en un enlace de pruebas, no en su propia web. Pero funciona, y prefiero enseñártelo ahora que esperar a que esté "perfecto" — esto lo vamos a construir juntos, edición a edición, en partes.

👉 Pruébala aquí (funciona en el móvil):
https://claude.ai/code/artifact/7ca48a01-2f56-4e21-a9d2-1c3343747d29

¿Te habría ahorrado ese primer rato regalado, a ti o a una familia tuya? ¿Qué le añadirías o le quitarías? Cuéntamelo — de aquí sale la siguiente versión.

—

🐝 Y además, esta semana en la colmena

- El asistente "Adapta con criterio" — adapta cualquier actividad al alumno real, con PDF listo:
https://www.linkedin.com/posts/joseaserraf_esto-no-es-solo-para-logopedas-es-para-ugcPost-7482745662296694784-eTqM

- Un prototipo real de ecografía lingual + IA que puede abrir una nueva vía de acceso a SAAC:
https://www.linkedin.com/posts/joseaserraf_logopedia-saac-inteligenciaartificial-share-7483874466662420481-IAdN/

- "Criteropenia": qué parte de tu criterio dejas de entrenar cada vez que le preguntas a la IA antes que a ti mismo:
https://www.linkedin.com/posts/joseaserraf_fue-con-un-caso-de-rotacismo-antes-de-preguntarle-activity-7483460861966245888-_Np8

- Evidencia real, no humo: la Revista de Investigación en Logopedia publicó un estudio sobre un programa de intervención lectora en TEA que combina tecnología, método fonético y entrenamiento de denominación rápida (RAN), individualizado. La tecnología no mejora la intervención — mejora la intervención bien diseñada.

Esto lo sigo construyendo en abierto, con quien quiera verlo de cerca — está en Telegram: t.me/logoped_ia. Y para quien quiera ir más allá de mirar, algo más grande está a punto de abrir sus puertas.

---

## Notas de producción

**Feedback real recibido y aplicado (20/07/2026):** una suscriptora (de permiso de
maternidad) señaló que el texto hablaba en masculino por defecto ("su hijo", "el
profesional"), y que eso hace que algunas familias no se sientan identificadas. Corregido
en el texto de esta newsletter ("su hijo o hija", "ella o él mismo"). **Pendiente:** aplicar
el mismo criterio dentro del propio código de la herramienta "Antes de consultar" (fuera del
scope de esta sesión) — José debe trasladarlo a ese proyecto directamente.


**Pendiente único antes de publicar:** José debe verificar en incógnito que
`claude.ai/code/artifact/7ca48a01-2f56-4e21-a9d2-1c3343747d29` carga sin pedir login a un
desconocido — para mí, con mis herramientas, dio 403 en cada intento durante la sesión. Si
no carga para terceros, desplegar en hosting propio antes de anunciarlo.

**Carrusel complementario — versión final (v2), sustituye a las dos anteriores**
("3 cosas que automaticé..." con la tarjeta de becas, y la v1 de "Antes de consultar" que
José vio "sin impacto, mucha página para poco texto"):
"Antes de consultar" v2 — 10 diapositivas, estilo cartel (fondo negro/crema alternado,
frases grandes, poco texto por diapositiva), incluye también las 3 piezas de "además esta
semana en la colmena" (GPT, ecografía/SAAC, criteropenia) —
`/tmp/claude-0/-home-user/ca721641-29c6-5ae9-aea5-6294a5822772/scratchpad/COLMENIA_antes_de_consultar_v2.pdf`

**Decisión de formato (explícita, a petición de José):** esta edición rompe a propósito la
convención habitual de "una idea potente, breve" — es el anuncio de un lanzamiento real, no
una reflexión de rutina, y José pidió explícitamente ir a fondo, incluir enlaces y hablar
también a familias. El hilo de "dejar de vivir de tiempo x dinero" (más profundo, sobre su
propia clínica) se deja para desarrollarse por partes en futuras ediciones, no se agota aquí.

**Aviso de atribución (heredado, sigue vigente):** el "sesgo del precio / ejemplo del tomate"
NO es de José, es de otro participante del grupo de WhatsApp. No usar sin permiso explícito.

**IDEA 005 usada** (lectura + RAN en TEA, Revista de Investigación en Logopedia) — añadida
como 4º punto de la posdata a petición de José ("nos falta también la noticia, nombrada").
Actualizar su estado en banco-ideas.md.

**Guardadas para el futuro, sin usar en esta edición** (ver banco-ideas.md IDEA 006-008):
datos/diversidad en IA para afasia, implicación de familias vs. automatización sola, debate
regulatorio CMS/CPT en EE. UU. También queda en la nevera la idea de "la primera revolución
de la IA en logopedia será administrativa" + el checklist de datos, por si se quiere retomar
en una futura edición.
