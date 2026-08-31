# Framework RITE

Los cuatro bloques que lleva todo prompt del vault. Sirve para escribir los nuevos y para arreglar los que dan resultados flojos.

## R — Rol

Quién responde. Cuanto más concreto, menos genérica es la salida.

- Flojo: "Eres un experto en logopedia."
- Bueno: "Eres logopeda clínico con 18 años en gabinete privado, especializado en trastornos del habla en edad escolar. Escribes informes que leen familias sin formación sanitaria."

## I — Instrucciones

Qué tiene que hacer, en pasos numerados. Incluye lo que **no** debe hacer.

- Longitud exacta ("máximo 300 palabras", no "que sea breve").
- Formato exacto (tabla, lista, prosa).
- Prohibiciones ("no inventes datos que no estén en la transcripción", "no des diagnóstico").

## T — Texto de contexto

Los datos reales: transcripción, notas, edad, motivo de consulta, destinatario. Va al final del prompt, separado con `---`, para que el modelo sepa dónde empieza el material.

## E — Ejemplos

Uno o dos fragmentos de cómo quieres que suene. Es lo que más cambia la salida y lo que más gente se salta. Si tienes un informe tuyo que te gustó, pégalo abreviado como ejemplo.

## Plantilla en blanco

```
ROL
Eres [perfil concreto]. Escribes para [destinatario].

INSTRUCCIONES
1. [Acción principal]
2. [Restricción de formato]
3. [Restricción de longitud]
No hagas: [lista de prohibiciones]

SALIDA
[Estructura exacta esperada]

EJEMPLO DEL TONO
"[fragmento breve]"

---
CONTEXTO
[tus datos]
```

## Cuándo la salida no sirve

| Síntoma | Bloque que falla |
|---|---|
| Suena a folleto | Falta E, y el R es genérico |
| Se inventa datos | Faltan prohibiciones en I |
| Demasiado largo | I sin cifra de longitud |
| Formato distinto cada vez | Falta el bloque Salida |
