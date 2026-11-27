---
type: decision
status: accepted
date: 2026-11-22
project: tex
tags: [estructura, identidad, versiones]
---

# DEC-024 — Identidad de bloques y documentos

Las rutas de [DEC-014](DEC-014-mover-bloques.md) describen una posición y cambian al mover un hermano. Un identificador persistente permite comparar versiones, restaurar el foco y reconocer el mismo bloque después de una edición. La copia de una rama recibe identificadores nuevos, también en sus hijos. Las plantillas conservan el contenido y prescinden de la identidad de su fuente.

El sobre v4 añade un identificador del documento y sanea los de sus bloques al migrar. La generación de LaTeX sigue dependiendo del contenido y la posición.
