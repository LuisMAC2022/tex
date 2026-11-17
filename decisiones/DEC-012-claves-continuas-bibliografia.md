---
type: decision
status: accepted
date: 2026-11-16
project: tex
tags: [bibliografia, generacion]
commit: ""
---

# DEC-012 — Claves bibliográficas continuas por documento

## Contexto

DEC-011 conserva la aceptación inicial de claves locales, que produce
advertencias de etiquetas duplicadas con dos bloques de bibliografía.

## Decisión

Se reemplaza esa limitación con un contador por recorrido del documento,
compartido entre raíces e hijos y reiniciado en cada generación. Se reservan
primero las claves del bloque padre, antes de recorrer sus hijos, para respetar
el orden emitido incluso con estados manipulados. Las demás reglas de la
bibliografía manual documentadas en DEC-011 se mantienen.

## Razones

La advertencia procede de claves generadas por la aplicación y puede evitarse
sin controles nuevos, paquetes LaTeX ni estado global persistente. Un contador
local mantiene INV-008: la salida depende solo del estado de entrada.

## Consecuencias

Las claves cambian en el segundo bloque y posteriores. La numeración visible
de cada entorno sigue siendo responsabilidad de LaTeX; no se unifican entornos.
Una llamada aislada a `blockToLatex` empieza por `ref1`.
