---
type: decision
status: accepted
date: 2026-11-16
project: tex
tags: [katex, accesibilidad, buzones]
commit: ""
---

# DEC-010 — Criterios durables de vista previa y tablero

## Contexto

Se promueven desde los encargos cumplidos de `agents.md` las razones que no
estaban registradas en decisiones, antes de vaciar el buzón según DEC-006.
Los contratos y controles actuales se describen en README y las guías.

## Decisión

La extracción matemática es propia, pura y con renderizador inyectado. No se
incorpora `contrib/auto-render.js`: muta el DOM y sus delimitadores por defecto
no incluyen `$…$`, que la interfaz enseña. La representación usa HTML y MathML,
`trust: false` para impedir comandos confiables que introduzcan HTML,
`throwOnError: true` para capturar fallos y `strict: false` para no llenar la
consola de avisos por Unicode. El retardo de 200 ms evita representar cada tecla.

KaTeX no valida el documento: sus fallos no bloquean la generación, pues macros
y entornos válidos en Overleaf pueden quedar fuera de su subconjunto. Tampoco
examina reservados ni llaves de la prosa. No se ofrece vista previa del documento
completo ni se presenta la tipografía como la del PDF final.

Se conserva KaTeX local con licencia MIT y sin modificar sus archivos, para
poder sustituir la distribución al actualizar. Solo se incluyen fuentes WOFF2:
los navegadores compatibles las eligen antes de las reservas WOFF/TTF, evitando
aproximadamente 900 KB de formatos redundantes. Se conserva la ruta `fonts/`.

## Razones

Los colores literales en reglas del tablero sobrevivían al cambio de tema y
volvían ilegibles panel, selección y errores. Los tokens de ambos temas y su
comprobación estructural previenen esa regresión. El desplazamiento necesita
relleno para no recortar el foco; las flechas verticales siguen las columnas
resueltas para no exigir recorrer cada símbolo de una rejilla de varias filas.
El detalle visual se oculta a tecnologías de asistencia para no duplicar el
nombre accesible del botón.

## Consecuencias

La revisión manual sigue cubriendo temas, teclado, foco y tamaños de pantalla.
Las cifras de contraste y tamaños de la revisión original son mediciones
históricas, no garantías nuevas ni resultados comprobados en esta limpieza.
