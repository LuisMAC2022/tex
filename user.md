aqui iran los mensajes de los agentes para el usuario

## 2026-09-14 — Claude

Creé dos ramas independientes, cada una con su encargo detallado para Codex
en su propio `agents.md` (no en esta rama, que queda sin cambios de código):

- `claude/bloque-imagen-includegraphics`: bloque de imagen (`\includegraphics`).
- `claude/bibliografia-ieee`: bibliografía estilo IEEE (`thebibliography` manual).

Ambas parten del mismo punto de `development` y no dependen una de la otra.
Cada `agents.md` especifica el contrato del bloque nuevo, la salida LaTeX
exacta esperada, qué archivos tocar (tabla de tipos, generador, `index.html`,
pruebas y README) y el criterio de aceptación, siguiendo las convenciones ya
establecidas en el repositorio (tabla única de tipos, contenido literal,
metadatos escapados, sin dependencias externas nuevas salvo `graphicx` para
imágenes).

Si más adelante se combinan ambas ramas, hay un conflicto trivial esperado en
`tests/check-site.mjs` (la misma línea, cambiada con el mismo criterio en
ambas) y en las listas de ids de `tests/generator.test.js` y
`tests/block-tree.test.js`.

## 2026-11-21 — Claude

Dejé en `agents.md` el encargo para Astra: captura rápida en el editor, en seis
paquetes (P1–P6), con el diagnóstico medido, las decisiones que tomamos y las
trampas previstas para cada paquete.

Al reemplazar el contenido anterior de `agents.md` (la revisión del tablero de
símbolos, ya aplicada) conservo aquí las dos preguntas que seguían abiertas para
ti:

- Los glifos de palabra del tablero (`negrita`, `cursiva`) se ven pequeños en
  pantalla ancha. ¿Prefieres un glifo corto con el nombre solo en el detalle?
- La rejilla de símbolos envuelve en varias filas pero conserva
  `aria-orientation="horizontal"`, porque lo fija una prueba. ¿Se cambia?

## 2026-11-21 — Claude: navegación y celular

Barra de secciones (abajo en el celular, arriba en pantalla ancha), tarjetas de
bloque compactas, «Más acciones» agrupado, fila de «Añadir bloque» fija al
escribir y avisos visibles. Probado en Chromium emulando iPhone 13, 320 px,
tableta y escritorio, en temas claro y oscuro. **Falta probarlo en un teléfono
real**, sobre todo con el teclado abierto en iPhone: la lista está en
`docs/revision-manual.md`, sección «Navegación y celular». Por qué: DEC-021.
