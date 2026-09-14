# Notas para Codex

Restricciones del producto que el código ya cumple y que **no deben deshacerse**.
Cada una tiene una prueba que falla si se rompe; si una prueba estorba, la
decisión es discutirla, no borrarla.

## 1. Scripts clásicos, nunca módulos ES

Los apuntes se abren desde el móvil y desde computadoras de la escuela, muchas
veces por doble clic sobre `index.html`. Con `<script type="module">` el
navegador bloquea la descarga por CORS (`origin 'null'`) y **la interfaz queda
completamente inerte**: ningún botón responde. Comprobado en Chromium.

Por eso: scripts clásicos, un único global `window.TexNotes`, cargados en orden
de dependencia en `index.html`. Las pruebas corren ese mismo código en un
contexto `node:vm` (`tests/load-app.mjs`), así que no hace falta una segunda
copia en formato módulo.

## 2. Seis tipos de bloque, en una sola tabla

`text`, `equation`, `definition`, `theorem`, `example`, `note`. Ni más ni menos.
No hay `exercise` ni `solution`.

Los bloques de argumentación son el núcleo del producto, no un extra: el
profesor descuenta hasta el 60 % de una entrega que solo tenga símbolos y
números sin explicación. Por eso `note` es un tipo de primera clase.

`assets/js/block-types.js` es la única fuente de verdad. `buildTheoremDefs()`
deriva de ahí los `\newtheorem` y los agrupa por `\theoremstyle`. Añadir un tipo
= una entrada en la tabla + su `<option>` en `index.html`; una prueba compara
las dos listas y falla si divergen.

## 3. Overleaf es la copia maestra; la exportación es de ida

Se eliminó el sobre `% TEX-NOTES:...` en Base64 que se anteponía a cada `.tex`,
junto con `tex-import.js`. Servía para reimportar un documento a la aplicación,
y ese camino de vuelta ya no es un objetivo: las correcciones se hacen en
Overleaf y se quedan ahí. El sobre además viajaba a Overleaf en cada pegado.

El borrador en `localStorage` **sí se conserva**: es un borrador de trabajo del
dispositivo, no una copia maestra.

El `.tex` es autocontenido: sin `.sty` externo, para pegarlo en un proyecto
vacío de Overleaf. Cuando exista el diccionario de macros, se inserta en el
preámbulo, no en un archivo aparte.

## 4. Compilar queda fuera

La aplicación no compila `.tex`. Las pruebas comparan cadenas, nunca PDF.

## Lo que sigue (no empezado)

- Diccionario de macros: `macros.js` + `validate.js` (nombres reservados,
  aridad, renderizado real en KaTeX). Regla dura: **nunca** `\renewcommand`
  sobre algo de KaTeX/LaTeX; la única excepción es `\proofname` por el
  mecanismo de cadena de texto de amsthm. Toda macro debe expandirse igual en
  KaTeX (vista previa) y en LaTeX (exportación), desde el mismo diccionario JS.
- Vista previa con KaTeX empaquetado.
- Modelo de documento de tres niveles: Unidad → Clase → Bloques. Hoy la
  estructura es plana y `topic` produce una única `\section`.
- Módulo de apoyo al curso: botón de cita de asesoría (`mailto:` con asunto y
  cuerpo prellenados, 24 h de antelación), panel de fechas con cuenta atrás y
  descarga `.ics`, y lista de entregables por clase. Sin notificaciones push:
  evitamos depender de un servidor.

Fuera de alcance por ahora: TeX en WASM, TikZ/PGFPlots, traducción de errores
de TeX, paleta de comandos, buscar y reemplazar, historial de versiones y
sincronización.
