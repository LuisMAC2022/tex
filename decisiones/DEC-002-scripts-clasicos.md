---
type: decision
status: accepted
date: 2026-09-14
project: tex
tags: [arquitectura, navegador, file-protocol]
commit: c6d41fa
---

# DEC-002 — Scripts clásicos y un solo global, nunca módulos ES

## Contexto

La aplicación se abre por doble clic desde el explorador de archivos, con
`file://`, en el portátil, en el teléfono y en las máquinas de la facultad. Con
módulos ES la página quedaba **completamente inerte**: el navegador bloquea por
CORS la descarga de `app.js` con `origin: 'null'`, y el fallo no es visible sin
abrir la consola.

## Decisión

`index.html` carga scripts clásicos, en orden de dependencia, sobre un único
global `window.TexNotes`. Nada de `type="module"`.

## Consecuencias

- El orden de carga es parte del contrato y está vigilado: INV-004.
- Las pruebas no pueden `import`ar el código del navegador. `tests/load-app.mjs`
  lo ejecuta en un contexto `node:vm` en el mismo orden que `index.html`, así que
  se prueba exactamente el código que se publica sin mantener una segunda copia
  en formato módulo.
- Servir por HTTP sigue siendo válido y es lo que hace Pages; lo que no se puede
  es *depender* de que haya un servidor.

## Alternativas descartadas

- **Módulos ES y servir siempre por HTTP.** Obliga a levantar un servidor en
  cada máquina, incluidas las de la facultad, para el caso de uso más común.
- **Un empaquetador.** Introduce dependencias de construcción en un proyecto que
  no tiene ninguna (INV-006).
