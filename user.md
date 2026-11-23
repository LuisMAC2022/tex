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

## 2026-11-22 — Claude

Rama `claude/ui-ux`, sin cambios de código:

- **DEC-001 queda reemplazada por DEC-021**: la aplicación es la copia maestra
  y Overleaf solo compila. DEC-003 (sin reimportar el `.tex`) e INV-001 siguen
  vigentes. El README y la guía de desarrollo ya lo reflejan.
- **`agents.md`** trae el encargo U0–U5: diagnóstico en Android, barra del
  pulgar, menús radiales, identificadores estables, versiones con archivo de
  proyecto y selección por alcance.

Cambios respecto a tu especificación de los menús radiales (el motivo de cada
uno está en el encargo):

- Los fragmentos usan `#1`–`#9` y `#0`, no `|`, porque `|` es LaTeX válido.
- La pulsación larga dentro de «Contenido» queda desactivada hasta medirla en
  tu teléfono; el botón «Menú» de la barra abre el mismo menú sin esperar.
- El enlace (`\href`) exige `hyperref`, que se cargará solo cuando se use.
- Las griegas y los tipos de bloque muestran 7 opciones y «Más…»: no caben
  más de 8 sectores por anillo con 44 px.
- El menú general suma «Ir a…».

Cuando exista `diagnostico/android.html`, ábrelo en el teléfono (sección 4 del
encargo) y pega el informe en `diagnostico/resultados-android.md`.

## Diagnóstico en tu teléfono

1. Abre esta rama en el portátil y ejecuta `python3 -m http.server 8000` en la raíz.
2. Conecta Android por USB con depuración habilitada y ejecuta `adb reverse tcp:8000 tcp:8000`.
3. Abre `http://localhost:8000/diagnostico/android.html` en Chrome y sigue las pruebas con Gboard.
4. Prueba ambas variantes de ventana, anota la selección y la posición del teclado y toca **Copiar informe**.
5. Pega el JSON en [resultados-android.md](diagnostico/resultados-android.md).

## 2026-11-23 — Claude

Rama `ccr-20873c43-32i6nb`:

- **Cinco correcciones** probadas en Chromium: `^` y `_` ya no abren llaves al
  escribir de corrido (DEC-026); copiar y descargar regeneran el `.tex`; los
  botones de las tarjetas recuperan su altura en el teléfono; `\frac` propone
  primero la fracción simple; la fecha inicial es la de hoy.
- **`agents.md` trae U3.1 y U3.2**, que se intercalan entre U3 y U4: etiquetas
  con `\ref`/`\eqref` y citas en IEEE o APA con `natbib`. Recoge tus
  decisiones: los dos estilos, la bibliografía al final, ecuaciones numeradas
  solo con etiqueta y las referencias del curso solo con botón.

Antes de que un agente empiece U0, fusiona esta rama en `claude/ui-ux`: el
encargo da por hechas las correcciones.

Sigue pendiente decidir qué hacer con `temario.md`: el repositorio es público y
ese archivo contiene la contraseña de la plataforma SEA y el correo del profesor.
