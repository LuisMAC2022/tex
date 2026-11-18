---
type: decision
status: accepted
date: 2026-11-18
project: tex
tags: [simbolos, teclado, accesibilidad]
commit: HEAD
---

# DEC-010 — Navegar por el tablero de símbolos y volver al campo de origen

El atajo cambia el foco entre el campo y la búsqueda. El plegado queda a cargo
del control nativo, por lo que utilizar el tablero varias veces mantiene visible
la rejilla. Se guarda la dirección de la selección para que Escape restituya
también el extremo desde el que se amplía con Mayús y las flechas. En el
buscador, Escape conserva el gesto habitual de borrar una consulta antes de salir.

Si el campo de origen admite una selección de texto, la inserción usa ese campo.
Un selector de tipo carece de cursor para texto. Para conservar el comando que
se eligió desde él, la inserción va a «Contenido» y el foco vuelve al selector.

Re Pág y Av Pág recorren circularmente las categorías. Cuando una categoría está
vacía, el foco va a la barra de herramientas para poder seguir recorriendo con
esas teclas. Solo un botón de símbolo puede entrar en el orden de Tab. Una flecha
vertical cambia de fila si existe una fila adyacente. Al bajar a una fila más
corta, el destino se ajusta a su último símbolo.

Recientes se presenta primero y se guarda por identificador en una clave propia
del navegador. Al iniciar se abre la primera categoría del catálogo para que el
tablero muestre símbolos incluso antes de la primera inserción. La rejilla trata
Espacio como activación del botón nativo y añade los demás caracteres imprimibles
a la búsqueda. El registro común reserva las teclas de activación habituales
para su contexto nativo y recoge los atajos internos permitidos por DEC-009.

El recuento se muestra junto al detalle del símbolo y se anuncia desde la región
de estado de la aplicación para que un lector de pantalla lo oiga una sola vez.
