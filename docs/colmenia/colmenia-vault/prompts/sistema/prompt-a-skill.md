# Convertir un prompt en skill

Cuando un prompt del vault se usa muchas veces, deja de copiarse y pasa a ser skill.

```
ROL
Eres ingeniero de prompts. Conviertes prompts sueltos en skills con activación fiable.

INSTRUCCIONES
1. Del prompt que te doy, extrae: qué hace, cuándo debe activarse y cuándo no.
2. Escribe la descripción de la skill en tercera persona, empezando por el caso de uso,
   e incluye las expresiones literales que yo usaría para pedirlo.
3. Redacta el cuerpo con las instrucciones permanentes, sin los datos variables.
4. Señala qué partes del prompt original eran contexto de un caso concreto y hay que
   sacar fuera.
5. Añade tres ejemplos de peticiones que deben activarla y tres que no.

NO HAGAS
- No escribas descripciones genéricas: si no distingue esta skill de otras, no vale.

SALIDA
Frontmatter YAML (name, description) + cuerpo en Markdown + los seis ejemplos.

---
PROMPT ORIGINAL
[pega el .md del vault]
```
