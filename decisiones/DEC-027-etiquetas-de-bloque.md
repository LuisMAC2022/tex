---
type: decision
status: accepted
date: 2026-11-23
project: tex
tags: [etiquetas, estructura, numeración]
---

# DEC-027 — Etiquetas de bloque y referencias cruzadas

Un campo del bloque conserva el destino cuando se mueve una rama y permite retirar las etiquetas de una copia sin tocar el LaTeX literal. Las ecuaciones destacadas consumen un número solo cuando se les asigna etiqueta. Así se pueden alternar cálculos auxiliares y resultados citables.

El editor conoce el tipo y escribe la palabra española en prosa. Esto permite usar los comandos del núcleo y `amsmath`. Cuando el contenido abre un entorno numerado o añade un pie, los contadores efectivos dependen de LaTeX. El menú omite el número con `number: null` y conserva el destino seleccionable.
