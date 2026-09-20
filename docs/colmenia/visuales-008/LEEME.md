# Material visual — Newsletter Nº 8

Se generan con HTML + Chromium, no con un modelo de imagen: así el texto sale
exacto, los colores son los de marca y se puede reeditar cambiando una línea.

    npm i playwright && node shoot.mjs      # escribe los PNG en out/

Marca: fondo #161210 · miel #E8A93A · crema #F5E6C4.
Tipografías Jost (titulares), Andika (texto), IBM Plex Mono (etiquetas),
descargadas en `fonts/` para no depender de que Google Fonts cargue.

| Archivo | Tamaño | Para qué |
|---|---|---|
| 1-portada-articulo | 1200×627 | Portada de la newsletter en LinkedIn |
| 2-portada-vertical | 1080×1920 | Historias / reels |
| 3-cita-tesis | 1080×1080 | La frase de la edición, para el feed |
| 4-quien-hay-dentro | 1080×1080 | Composición de la comunidad |
| 5-la-linea | 1080×1080 | Los 13/14 años. Lleva el aviso de que son recomendaciones |

## Decisión de color en la infografía
Una sola serie en miel: la identidad la llevan las etiquetas, no el color, así que
no hace falta leyenda ni inventar seis tonos que peleen con una marca de tres.
"Sin perfil" va en #8A7350, apagado y separado por una línea, porque no es una
profesión y no debe leerse como una categoría más. Ese tono se validó contra el
fondo: pasa contraste 3:1 y separa del miel con holgura en daltonismo
(ΔE 20,4 protan). Falla a propósito el suelo de saturación — ahí se busca
justamente que lea como apagado.
