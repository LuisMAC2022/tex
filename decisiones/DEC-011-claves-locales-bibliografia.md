---
type: decision
status: accepted
date: 2026-11-16
project: tex
tags: [bibliografia, buzones]
commit: ""
---

# DEC-011 — Alcance inicial de la bibliografía manual

## Contexto

Esta entrada conserva la justificación del encargo cumplido de bibliografía
antes de retirarlo de `agents.md`, según DEC-006.

## Decisión

Se usa `thebibliography` del núcleo de LaTeX para obtener referencias numeradas
entre corchetes sin BibTeX, natbib, IEEEtran ni paquetes nuevos. El título se
omite, como en las listas, y el bloque no contiene hijos: un bloque arbitrario
dentro del entorno fuera de un bibitem produciría LaTeX inválido.

Inicialmente las claves `refN` se numeran dentro de cada bloque. Se aceptó la
advertencia de duplicados entre bloques para limitar el alcance del encargo,
ya que la interfaz no genera comandos de cita.

## Consecuencias

La decisión inicial deja advertencias si se utilizan varias bibliografías.
Cambiar esa limitación requiere documentar el nuevo contrato y comprobar la
numeración entre bloques; no exige añadir controles ni paquetes a la aplicación.
