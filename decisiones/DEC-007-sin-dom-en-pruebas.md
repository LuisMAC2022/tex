---
type: decision
status: accepted
date: 2026-09-14
project: tex
tags: [pruebas, dependencias, dom]
commit: c6d41fa
---

# DEC-007 — La interfaz no tiene pruebas automatizadas, y es deliberado

## Contexto

`assets/js/app.js` es el archivo más grande del proyecto y el que más ha
cambiado (650 líneas añadidas en 7 commits sobre `development`). No tiene
ninguna prueba automatizada. Eso parece un descuido y no lo es.

## Decisión

No se añade un DOM al entorno de pruebas —ni `jsdom`, ni `happy-dom`, ni un
navegador sin cabeza— para probar `app.js`. Los botones por bloque, el foco y
los anuncios se comprueban en la lista de revisión manual
(`docs/revision-manual.md`).

## Razones

- Cualquiera de esas opciones es una dependencia de desarrollo, y el proyecto no
  tiene ninguna (INV-006). Node 20+ y nada más: eso es lo que hace que la suite
  corra igual en el portátil, en Pages y en una máquina de la facultad.
- Lo que de verdad hay que verificar en la interfaz —dónde queda el foco, qué
  anuncia el lector de pantalla, si la sangría es la única señal de nivel— es
  justo lo que un DOM simulado verifica mal. Una prueba que pasa con `jsdom` no
  dice que un lector de pantalla anuncie el nivel.

## Consecuencias

- `tests/check-site.mjs` cubre lo estructural del HTML, que sí es texto:
  doctype, un solo `main` y `h1`, orden de los scripts, etiquetas asociadas,
  rutas relativas, y que las ayudas visibles no prometan un escapado que ya no
  ocurre (DEC-004).
- Como el navegador carga scripts clásicos (DEC-002), las pruebas no pueden
  importar el código. `tests/load-app.mjs` lo ejecuta en un contexto `node:vm`
  en el mismo orden que `index.html` y clona los datos al realm de la prueba:
  se prueba exactamente el código que se publica, sin una segunda copia en
  formato módulo.
- La lista de revisión manual es, por tanto, **parte de la suite**, no un
  apéndice. Si crece hasta no ejecutarse nunca, esta decisión hay que
  reconsiderarla y reemplazarla, no ignorarla.
