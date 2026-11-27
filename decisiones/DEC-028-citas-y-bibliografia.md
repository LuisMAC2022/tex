---
type: decision
status: accepted
date: 2026-11-23
project: tex
tags: [bibliografía, citas, formatos]
---

# DEC-028 — Citas y bibliografía del documento

Los datos estructurados permiten pasar de IEEE a APA sin editar los bloques. Una sola biblioteca de LaTeX, `natbib`, cubre ambos estilos y compila con pdfLaTeX en dos pasadas. `\citep` y `\citet` mantienen la intención de la frase al cambiar de estilo. El significado del comando genérico `\cite` depende del estilo.

Una lista única al final conserva el orden de las primeras citas en IEEE y el orden bibliográfico en APA. Bloquear una clave citada protege las menciones escritas a mano. El campo `text` conserva fuentes excepcionales y permite trasladar la bibliografía antigua sin reinterpretar su LaTeX. Los demás campos se escapan como metadatos. El catálogo del curso se añade expresamente para que un documento nuevo empiece vacío.
