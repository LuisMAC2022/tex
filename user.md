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
