---
type: decision
status: accepted
date: 2026-09-14
project: tex
tags: [arquitectura, derivacion, amsthm]
commit: c6d41fa
---

# DEC-005 — Los tipos de bloque viven en una sola tabla y el preámbulo se deriva

## Contexto

El preámbulo `amsthm`, el `<select>` de la interfaz y el generador necesitan la
misma lista de tipos. Tres copias de una lista es tres oportunidades de
desincronizarse, y la que se nota tarde es el preámbulo: un entorno usado sin
declarar no falla hasta compilar en Overleaf.

## Decisión

`assets/js/block-types.js` es la única fuente de verdad. `buildTheoremDefs()`
deriva de ella las declaraciones `\newtheorem` agrupadas por `\theoremstyle`.
Añadir un tipo es una entrada en la tabla y su `<option>` en `index.html`; una
prueba compara ambas listas.

## Consecuencias

- Lo vigila INV-005, en sus dos mitades: tabla ↔ `<option>`, y tabla ↔
  `\newtheorem`.
- El campo `container` de la tabla es la única fuente de la regla de anidamiento:
  la interfaz solo ofrece «Añadir dentro» donde lo hay, y la normalización del
  árbol sube a hermanos los hijos de un tipo sin él.
- La regla de numeración es parte del contrato: cada entorno lleva contador
  propio y `proposition` **no** comparte el de `theorem`. Cambiarla es editar una
  entrada de la tabla, y es un cambio que se documenta.
