---
type: decision
status: accepted
date: 2026-11-26
project: tex
tags: [portátil, estructura, revisión]
commit: beb4c8fcc3ca10b0a6cff525b78a9d7cfa1cac4e
---

# DEC-033 — La estructura se mantiene a la izquierda en el portátil

El cambio de cuadrícula a 88 rem invertía la posición de la estructura y
ensanchaba el editor de forma abrupta. En la disposición intermedia, la fila
de Revisión dependía de la altura de los otros paneles. Con documentos largos,
eso alejaba la vista previa del texto que se estaba revisando.

A partir de 64 rem con puntero fino, la estructura abre la cuadrícula y el
editor mantiene un máximo de 46 rem. Con Revisión cerrada, el editor se centra
en el espacio disponible a la derecha de la estructura. Si la estructura se
pliega, el área disponible empieza en el borde izquierdo.

La única transición para el portátil está en 80 rem y afecta a Revisión.
Desde ese ancho, la vista abierta tiene una columna de al menos 18 rem con su
propio desplazamiento. Entre 64 y 80 rem, la vista se integra debajo del campo
Contenido en la columna del editor. Así, la estructura permanece en el mismo
lado y la vista previa sigue junto al borrador en ambos anchos.
