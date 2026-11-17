---
type: decision
status: accepted
date: 2026-11-16
project: tex
tags: [pruebas, ci, navegador]
commit: ""
---

# DEC-009 — Humo en navegador separado de la suite local

## Contexto

DEC-007 excluye el DOM de la suite. La integración dejó sin comprobar el
recorrido entre app.js, KaTeX y la descarga. Un recurso local ausente puede
romper la interfaz aunque las funciones puras pasen sus pruebas.

## Decisión

Se amplía el alcance de comprobación de DEC-007 exclusivamente en CI con un
job separado de navegador real. DEC-007 se conserva sin reescribir: su regla
para `npm test` y la revisión manual sigue vigente. `ci/humo.cjs` no pertenece
al descubrimiento de `node --test`.

El runner instala una versión fija de Playwright y Chromium fuera del checkout,
en un directorio temporal. No se añaden dependencias ni manifiestos al proyecto.
El navegador abre `index.html` por `file://`, sin red, comprueba matemáticas,
bibliografía y el archivo descargado, y falla ante errores de consola o recursos.

## Razones

El navegador real verifica la carga de recursos locales y la conexión entre
controles sin simular el DOM ni cambiar la ejecución local sin instalación.
La instalación pertenece a la infraestructura de CI, como Node y las Actions;
el sitio y el proyecto conservan INV-004, INV-006 e INV-007.

## Consecuencias

CI requiere red para preparar sus herramientas; el sitio bajo prueba no.
La prueba no sustituye la revisión manual de foco, teclado, contraste ni
lectores de pantalla. Una actualización de Playwright se hace explícitamente
en el workflow. No se compila LaTeX: se verifica el contenido descargado.
