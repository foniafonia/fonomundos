# Material visual — Newsletter Nº 8

Generado con HTML + Chromium, no con un modelo de imagen: el texto sale exacto,
los colores son los de marca y se reedita cambiando una línea.

    python3 build.py && node shoot.mjs      # escribe los PNG en out/

Marca: fondo #161210 · miel #E8A93A · crema #F5E6C4.
Jost (titulares), Andika (texto), IBM Plex Mono (etiquetas), descargadas en
`fonts/` para no depender de que Google Fonts cargue.

| Archivo | Tamaño | Para qué |
|---|---|---|
| 1-portada-articulo | 1200×627 | Portada de la newsletter en LinkedIn |
| 2-portada-vertical | 1080×1920 | Historias y reels |
| 3-cita-tesis | 1080×1080 | La frase de la edición. Va en crema, invertida |
| 4-quien-hay-dentro | 1080×1080 | Composición de la comunidad |
| 5-la-linea | 1080×1080 | Los 13/14 años. Lleva el aviso incorporado |

Las cinco llevan el sello hexagonal con el número de edición.

## Por qué el gráfico es un panal y no barras
Cada hexágono es una persona. Con cuatro grupos hacían falta cuatro colores
categóricos, y una marca de tres tonos cálidos no los separa: el validador dio
ΔE por debajo del suelo incluso con visión normal (los cuatro tonos caen en la
misma familia de color). La solución no es forzar la paleta, es cambiar la
codificación: **la posición del grupo y su etiqueta llevan la identidad**, y el
color solo distingue perfil conocido (miel) de sin rellenar (#8A7350, validado:
pasa contraste 3:1 y separa del miel con ΔE 20,4 en protanopía).

De paso, el panal es la marca. El gráfico y el logotipo dicen lo mismo.

## Por qué la nº3 va en crema
Cinco piezas negras seguidas se funden entre sí en el feed. Invertir una da
ritmo a la serie y destaca en una línea de tiempo oscura.
