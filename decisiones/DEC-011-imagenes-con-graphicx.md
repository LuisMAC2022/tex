---
type: decision
status: accepted
date: 2026-11-18
project: tex
tags: [latex, imagen, borrador]
---

# DEC-011 — Imágenes con graphicx y vista previa local

## Contexto

La exportación a Overleaf usa rutas LaTeX y el borrador es JSON. Una imagen puede
pertenecer a un teorema o al contenido de un elemento de lista. Los flotantes de
LaTeX requieren modo de párrafo exterior y en otros contextos pueden fallar
con «Not in outer par mode».

## Decisión

`graphicx` forma parte del preámbulo. Los controles pasan la ruta por el mismo
canal literal que cualquier `content` y reservan `title` para el pie. Las
opciones son datos opcionales de la versión 2 del borrador. El selector de
archivos enlaza una URL temporal del navegador y Overleaf recibe la ruta. Así
el borrador sigue siendo pequeño y el proyecto de Overleaf posee la imagen.

El generador distingue si hay un entorno abierto. En ese caso deja la imagen
dentro del cuerpo y compone su pie como párrafo. Elige `center` o un grupo con
alineación lateral para poder continuar la prosa con su alineación original.
Para las imágenes etiquetadas que carecen de `\caption`, el núcleo de LaTeX
proporciona `\refstepcounter{figure}` y `\label`.

## Consecuencias

- La miniatura de un archivo seleccionado se conserva por ruta durante la
  sesión. La vista de un PDF depende del visor integrado del navegador.
- `figure` gestiona la posición de las imágenes flotantes. Una imagen dentro
  de un teorema o lista permanece en el lugar del bloque y su pie es prosa.
- Los avisos de ruta orientan sobre pdfLaTeX. El archivo se sube manualmente al
  proyecto de Overleaf.
