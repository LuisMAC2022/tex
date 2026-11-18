---
type: decision
status: accepted
date: 2026-11-18
project: tex
tags: [latex, comprobación, overleaf]
commit: HEAD
---

# DEC-013 — Comprobación previa a Overleaf

La aplicación señala errores probables con una ubicación dentro del bloque.
Quien escribe decide qué hacer con cada aviso y puede generar el documento en
cualquier momento. Un mismo carácter puede ser deliberado según dónde aparezca.
Corregirlo automáticamente cambiaría el LaTeX que escribió la persona y
reintroduciría los fallos de escapado descritos en [DEC-004](DEC-004-contenido-sin-escapar.md).

La comprobación busca patrones que se pueden reconocer en el contenido de un
bloque. Reutiliza los tramos de la vista previa, reconoce comentarios y escapes
y cuenta entornos abiertos en el árbol. La expansión de macros, los cambios
de categoría de caracteres y los contextos especiales como el texto verbatim
requieren interpretar TeX. Overleaf sigue a cargo de compilar el documento
completo.

Los avisos de edición se actualizan con la pausa de la vista previa en una
región sin anuncios automáticos. Al generar se ofrece un resumen navegable en
el que cada ruta corresponde a la estructura de ese momento.
