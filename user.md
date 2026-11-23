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

## 2026-11-23 — Claude (navegación móvil y arquitectura)

Rama `ccr-fd83b476-6mra7f`.

**Ya puedes probarlo en el teléfono:** escribe `\` y unas letras. La lista se
desplaza con el dedo sin elegir nada. Antes, el primer toque del gesto insertaba
la opción que quedaba debajo. Con la lista abierta, **Anterior** y **Siguiente**
de la barra recorren las opciones, y la lista ya no queda bajo la barra ni bajo
el teclado.

**Para que el código deje de ser una caja negra:**

- La interfaz se prueba ahora en Chromium (DEC-029, reemplaza a DEC-007). En
  cada rama y PR, GitHub ejecuta la suite completa, con la interfaz.
- `app.js` tiene un presupuesto de tamaño que solo baja (INV-012, DEC-030).
- La guía de desarrollo trae el mapa de sus secciones y dónde va el código nuevo.

**El plan completo está en `agents.md`.** Lo implementa otro agente en este
orden:

1. Pruebas que fijan lo que hay.
2. Registro único de acciones.
3. Barra compacta: «Selección» pasa a ser un modo junto a las flechas y queda
   sitio para **Mi botón**.
4. «Tipo de bloque» como chip con menú radial.
5. Tarjetas de 275 a ≤140 px con un menú radial del bloque.
6. Paneles en el teléfono.
7. Menús personales, con editor y JSON.
8. Listas táctiles en todas partes.
9. Informe de errores sin consola.

**Necesito tres cosas de ti:**

1. **¿Paneles o una sola página?** En el teléfono la página mide unas 7
   pantallas. Propongo cuatro pestañas arriba: Escribir, Estructura, Documento
   y Más. La alternativa es seguir con una sola página y solo compactarla.
   Contesta aquí o en `claude.md` antes de N4.
2. **El diagnóstico del teléfono sigue vacío**
   ([resultados-android.md](diagnostico/resultados-android.md)). Lo necesito
   para dos cosas: decidir si las sugerencias funcionan con la composición de
   Gboard y si la pulsación larga dentro de «Contenido» puede activarse. El
   procedimiento está más arriba, en «Diagnóstico en tu teléfono».
3. **`temario.md` sigue teniendo la contraseña de SEA** en un repositorio
   público. Borrarlo del archivo no la saca del historial de Git: lo seguro es
   cambiar la contraseña.

### Respuestas del 2026-11-23

- **Paneles:** confirmado. N4 queda así en `agents.md`.
- **Contraseña de SEA:** se cambiará.
- **Diagnóstico del teléfono:** pendiente. Lo más sencillo es publicar esta rama
  en `main`; así la página de diagnóstico queda en GitHub Pages y se abre
  directamente en el teléfono, sin portátil ni cable.
- **Pulsación larga dentro de «Contenido»:** se queda como está, sin informe
  (DEC-031). El menú se abre con el botón «Menú» de la barra.
