---
type: decision
status: accepted
date: 2026-09-14
project: tex
tags: [alcance, latex, overleaf]
commit: c6d41fa
---

# DEC-001 — Overleaf es la copia maestra

## Contexto

La aplicación consolida apuntes tomados a mano, en el portátil y en el teléfono
en sesiones distintas. La compilación de LaTeX ocurre fuera: Overleaf en el
teléfono, instalación local en el portátil. Existía la tentación de que la
aplicación fuera el repositorio del documento: persistencia completa en
`manual.json`, ida y vuelta con el `.tex`.

## Decisión

La aplicación es un **frente de redacción de ida**. El `.tex` se copia o se
descarga y se pega en Overleaf, donde se corrige y se compila. Las correcciones
hechas allí no vuelven. El borrador de `localStorage` es del dispositivo, no una
copia maestra.

## Consecuencias

- No hay reimportación ni sobre de ida y vuelta: ver DEC-003.
- No hay sincronización, ni historial de versiones, ni servidor.
- Un error de LaTeX se ve y se corrige en Overleaf, que es donde ya se trabaja.
  Eso es lo que hace tolerable DEC-004.
- Si algún día el documento vive en la aplicación, esta decisión se reemplaza
  primero y arrastra a DEC-003 y DEC-004.
