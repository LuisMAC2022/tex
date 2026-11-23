---
type: decision
status: accepted
date: 2026-11-23
project: tex
tags: [pruebas, dependencias, dom, navegador, ci]
---

# DEC-029 — Pruebas de interfaz en Chromium, opcionales en local y obligatorias en CI

Reemplaza a [DEC-007](DEC-007-sin-dom-en-pruebas.md).

## Contexto

DEC-007 dejó `app.js` sin pruebas automatizadas para no añadir dependencias y
porque un DOM simulado verifica mal el foco y los anuncios. Su propia cláusula
de salida decía que había que reconsiderarla si la revisión manual crecía
hasta no ejecutarse nunca. Eso ocurrió:

- `app.js` llegó a unas 2 500 líneas y 136 KB, y es el archivo que más cambia.
- Cada informe de U0–U5 y U3.1–U3.2 termina con «no verificado en un
  navegador». La lista manual acumula casos que nadie recorre en cada cambio.
- Las sugerencias de la barra invertida aceptaban la opción en `pointerdown`.
  Con el dedo no se podía desplazar la lista: el primer toque del gesto
  insertaba la opción que estuviera debajo. El fallo existía desde P3 y
  ninguna prueba podía detectarlo, porque vivía en el cableado de `app.js`.

Mientras tanto, Chromium sin cabeza con Playwright está disponible en el
entorno de los agentes y en GitHub Actions, y abre la aplicación por `file://`.

## Decisión

- Las pruebas de interfaz viven en `tests/interfaz*.test.js` y usan el arnés
  `tests/navegador.mjs`. Abren `index.html` por `file://`, el mismo modo en que
  se usa la aplicación (DEC-002), en escritorio y con un teléfono emulado.
- **Playwright no entra en `package.json`.** INV-006 sigue vigente. El arnés lo
  resuelve si está instalado, ya sea global, por `NODE_PATH` o con
  `npm install --no-save`. Si no está, las pruebas se omiten con un motivo
  visible, igual que las de `pdflatex`.
- Con `TEX_UI_TESTS=required` la ausencia de Playwright es un fallo. CI lo
  activa en `.github/workflows/pruebas.yml` para que una rama no parezca
  probada cuando sus pruebas de interfaz se omitieron.
- No se añade `jsdom` ni `happy-dom`. El argumento de DEC-007 contra un DOM
  simulado sigue valiendo. Un navegador real sí mide foco, geometría, eventos de
  puntero y desplazamiento.

## Lo que sigue siendo manual

Android físico, la composición de Gboard, TalkBack, NVDA, Overleaf, Firefox y
Safari. Un Chromium emulado no los reproduce, y
`docs/revision-manual.md` los conserva.

## Consecuencias

- La lógica sigue fuera de `app.js` siempre que se pueda: las pruebas puras son
  más rápidas y deterministas. Las de interfaz cubren el cableado, no las
  reglas.
- Un fallo de interfaz se corrige con una prueba que falla antes del arreglo.
- `npm test` sin Playwright pasa, pero no prueba la interfaz. Un informe que se
  apoye en esa ejecución debe decirlo.
