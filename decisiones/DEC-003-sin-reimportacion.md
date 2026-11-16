---
type: decision
status: accepted
date: 2026-09-14
project: tex
tags: [alcance, exportacion, retirado]
commit: c6d41fa
---

# DEC-003 — Sin reimportación: se retiran el sobre `TEX-NOTES` y `tex-import.js`

## Contexto

Hubo importación local de documentos TeX: `assets/js/tex-import.js` más un sobre
Base64 en un comentario `% TEX-NOTES:...` incrustado en el `.tex` para poder
reconstruir el estado al volver a abrirlo. Se añadió en `2ace0c6` y se retiró en
`c6d41fa`.

## Decisión

No hay camino de vuelta desde el `.tex` a la aplicación. El archivo generado es
autocontenido y no lleva metadatos de la aplicación.

## Razones

- Al fijar Overleaf como copia maestra (DEC-001), la reimportación dejó de tener
  objetivo: el documento bueno está allí, no aquí.
- El sobre viajaba a Overleaf **en cada pegado**. Un comentario de la herramienta
  dentro del documento de la asignatura, sin ninguna función ya.

## Consecuencias

- Lo vigila INV-001, con una aserción negativa: `assert.doesNotMatch(tex,
  /TEX-NOTES/)`. Es la clase de regla que un agente futuro reintroduce sin querer
  al «mejorar» la exportación, porque no hay código que la represente — solo
  código ausente.
- Si vuelve a hacer falta, esta entrada pasa a `superseded` y la nueva explica
  qué cambió en el flujo de trabajo, no solo qué se añadió al código.
