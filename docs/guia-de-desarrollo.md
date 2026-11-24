<!--
  Convención de este archivo, para quien lo mantenga:

  Esta guía describe CÓMO se hace algo. No explica POR QUÉ: para eso están
  decisiones/ e INVARIANTES.md, y aquí se enlazan. Si escribes una frase que
  empieza “se hizo así porque…”, su sitio es otro archivo.

  «Guillemets» sigue significando un rótulo literal de la interfaz, igual que en
  la guía de uso, y tests/documentacion.test.js lo comprueba también aquí.

  Las recetas se verificaron ejecutándolas. Si cambias una, vuelve a ejecutarla:
  la de “añadir un tipo de bloque” tiene dos pasos que no se deducen leyendo el
  código y que solo aparecieron al hacerla.
-->

# Guía de desarrollo

Para quien vaya a entender o extender esta aplicación. Da por sabido JavaScript;
no da por sabido nada de este repositorio.

**Antes de tocar nada, lee [`INVARIANTES.md`](../INVARIANTES.md).** Son reglas
con guardián real: violarlas no rompe el estilo, rompe `npm test`.

---

## Índice

1. [Puesta en marcha](#1-puesta-en-marcha)
2. [Mapa del código](#2-mapa-del-código)
3. [El estado y su forma](#3-el-estado-y-su-forma)
4. [Del estado al `.tex`](#4-del-estado-al-tex)
5. [Recetas](#5-recetas)
6. [Las pruebas](#6-las-pruebas)
7. [El sistema de documentación](#7-el-sistema-de-documentación)
8. [Publicación](#8-publicación)

---

## 1. Puesta en marcha

Node 20 o posterior. **No hay nada que instalar**: el proyecto no tiene ni una
dependencia, ni de ejecución ni de desarrollo, y eso es INV-006 con prueba propia.

```sh
npm test            # todo: node:test + la comprobación estructural
npm run check:js    # sintaxis de los scripts propios del navegador
python3 -m http.server 8000     # o abre index.html con doble clic
```

Los cinco comandos del repositorio:

| Comando | Qué hace |
| --- | --- |
| `npm test` | la suite entera, incluidas invariantes, anclas y documentación |
| `npm run check:js` | comprueba la sintaxis de los scripts propios del navegador |
| `npm run build:example` | regenera `examples/calculo-3.tex`, el archivo de referencia |
| `npm run bendecir` | recalcula las anclas `@decision` tras revisar su justificación |
| `npm run inventario` | regenera `docs/pruebas.md` desde la suite |

Los tres últimos escriben archivos que **hay prueba que vigila**: si los dejas sin
ejecutar cuando tocaba, `npm test` se pone rojo.

---

## 2. Mapa del código

Los scripts se cargan como clásicos **en este orden**. La aplicación usa
`window.TexNotes` y la biblioteca local expone `window.katex`.

| Orden | Archivo | Qué posee | Toca el DOM |
| --- | --- | --- | --- |
| 0 | `katex.min.js` | composición matemática local | biblioteca |
| 1 | `block-types.js` | la tabla de tipos de bloque | no |
| 2 | `block-tree.js` | el árbol: rutas y operaciones puras | no |
| 3 | `latex-generator.js` | el estado → la cadena `.tex` | no |
| 4 | `file-download.js` | nombre de archivo y descarga | sí |
| 5 | `math-symbols.js` | catálogo de símbolos, búsqueda y navegación del tablero | no |
| 6 | `text-insertion.js` | insertar en la posición del cursor | apenas |
| 7 | `math-preview.js` | extracción y análisis de tramos | no |
| 8 | `shortcuts.js` | registro de atajos y sus nombres | no |
| 9 | `image-options.js` | opciones de imagen y avisos de ruta | no |
| 10 | `list-outline.js` | análisis, límites, exportación y edición de listas | no |
| 11 | `cross-references.js` | etiquetas, destinos numerados y comandos emitidos | no |
| 12 | `references.js` | fuentes, citas y bibliografía IEEE o APA | no |
| 13 | `content-check.js` | comprobación del contenido | no |
| 14 | `editing-assist.js` | pares, fragmentos y sesiones de huecos | no |
| 15 | `completion.js` | sugerencias, uso, alias, configuración y colocación de la lista | no |
| 16 | `templates.js` | plantillas por pasos y comandos / | no |
| 17 | `macros.js` | validación y adaptación de macros a KaTeX | no |
| 18 | `menus.js` | datos de los menús radiales | no |
| 19 | `radial.js` | geometría, máquina de estados y vista de los menús radiales | solo su fábrica, al llamarla |
| 20 | `versions.js` | instantáneas, versiones, diferencias y proyecto JSON | no |
| 21 | `version-storage.js` | IndexedDB con respaldo en localStorage | almacenamiento |
| 22 | `selection-scope.js` | selección por alcance en prosa y matemáticas | no |
| 23 | `app.js` | cableado de la interfaz | sí |

Las pruebas de Node ejecutan las funciones puras con `node:vm`. La interacción
de `app.js` se prueba en Chromium con Playwright cuando está instalado
([DEC-029](../decisiones/DEC-029-pruebas-de-interfaz-en-chromium.md)).

> **Nunca los conviertas en módulos ES.** Con `file://` el navegador bloquea por CORS
> la descarga de un módulo y la interfaz queda inerte. Es INV-004 y
> [DEC-002](../decisiones/DEC-002-scripts-clasicos.md); `tests/check-site.mjs` vigila
> tanto la ausencia de `type="module"` como el orden de carga.

Qué exporta cada uno, si necesitas buscar una función:

- **`block-tree.js`**: `normalizeBlock`, `normalizeBlocks`, `normalizeDraft`,
  `blockAtPath`, `siblingsAtPath`, `insertBlock`, `duplicateBlock`, `updateBlock`,
  `removeBlock`, `moveBlock`, `moveBlockTo`, `cloneBlock`, `cloneBlocks`, `countBlocks`,
  `flattenBlocks`, `pathToKey`, `keyToPath`, `pathLabel`, `DRAFT_VERSION`.
- **`latex-generator.js`**: `generateLatex`, `blockToLatex`, `contentToLatex`,
  `escapeMetadata`, `buildPreamble`, `buildTheoremDefs`, `buildMetadata`, `buildBody`,
  `normalizeLineBreaks`, `METADATA_KEYS`.
- **`math-symbols.js`**: `MATH_SYMBOLS`, `MATH_SYMBOL_GROUPS`, `filterMathSymbols`,
  `symbolsByGroup`, `normalizeSearchTerm`, `describeCommand`, `symbolAccessibleName`.
  `SYMBOL_BOARD_GROUPS` comienza por `RECENT_SYMBOL_GROUP`. `symbolGridTarget` y
  `adjacentGroup` resuelven la navegación. `recentSymbolIds` filtra el historial que
  `app.js` lee y escribe en `tex-notes:recent-symbols`.
- **`text-insertion.js`**: `insertAtSelection` (pura), `insertIntoField`.
- **`math-preview.js`**: `mathSegments`, `analyzeContent` con un renderizador inyectado.
- **`image-options.js`**: `normalizeImageOptions`, `imagePathWarnings`. El árbol y el generador consultan las opciones en `TexNotes` al ejecutar sus funciones.
- **`list-outline.js`**: `parseListOutline` crea el árbol de elementos. `limitListOutline`
  aplica los límites de entornos y devuelve los datos para la vista previa.
  `outlineToLatex` aplica los mismos límites al exportar. `shiftLines` y `continueListLine`
  reciben el texto y la selección en índices UTF-16 y devuelven el nuevo estado del campo.
- **`content-check.js`**: `checkContent` para una cadena, `checkBlock` para
  incluir el contexto de sus bloques padre y `checkDocument` para agrupar los
  avisos por ruta. La sección D de `app.js` los presenta mediante
  `editorPreviewHooks`, `blockItemExtensions` y `beforeGenerateHooks`.
- **`file-download.js`**: `sanitizeFilename`, `downloadTex`.


### Dentro de `app.js`

`app.js` es un único cierre. Sus secciones no se llaman por un contrato: leen y
escriben variables del cierre. El mapa siguiente dice dónde está cada parte. Busca
el marcador literal; los números de línea cambian.

| Marcador | Qué contiene | Estado propio | Puntos de enganche |
| --- | --- | --- | --- |
| inicio del archivo | estado del documento, vista previa del editor | `blocks`, `history`, `macros`, `references`, `documentId` | declara los cinco ganchos |
| `Nombres de cada nodo` y `Editor: a qué nodo apunta` | rótulos de los nodos y destino del formulario | — | — |
| `Lista anidada` | tarjetas de la estructura | `blockTargets` | `blockItemExtensions`, `previewRenderers` |
| `Bandeja de copia` | bandeja, portapapeles, validar y confirmar el bloque, generar | `tray` | `blockFieldHooks`, `beforeGenerateHooks` |
| `[A] Atajos del tablero` | tablero de símbolos | `recentSymbols`, `symbolOrigin` | — |
| `[B] Imagen` | campos de imagen y etiqueta del bloque | — | los tres ganchos de bloque |
| `[C] Listas` | sangría y vista de listas | `loadedListBlock` | `blockFieldHooks`, `previewRenderers`, `editorPreviewHooks` |
| `[D] Comprobación` | avisos previos a Overleaf | `issuesByPath` | `editorPreviewHooks`, `blockItemExtensions`, `beforeGenerateHooks` |
| `[E] Mover` | conecta el diálogo de traslado en `move-dialog.js` | el controlador conserva el bloque de origen | `changeTree` |
| `[F] Asistente de escritura` | autocierre, sugerencias de `\`, huecos, alias, configuración portátil | `prefs`, `usage`, `snippetSession` | conecta la lista con su registro de fuentes |
| `[G] Comandos / y plantillas` | `/` y plantillas por pasos | `slashSession`, `templateSession` | aplica los tipos y plantillas y se suscribe al cierre de la lista |
| `[H] Macros del documento` | macros | `defaultMacros` | expone `setConfigMacros` para la configuración portátil |
| `Referencias del documento y del curso` | fuentes y citas | `courseReferences` | `blockItemExtensions` |
| `createThumbBar` | conecta la barra y la hoja de símbolos en `thumb-bar.js` | el controlador conserva el alcance | `blockFieldHooks` |
| `createRadialController` | conecta el editor a los gestos y al teclado de `radial-controller.js` | el controlador conserva el anillo y los punteros | `runAction` |
| `Autoguardado separado` | sesión sin guardar y su recuperación | `pendingSession` | — |
| `function selectDocument` hasta el final | historial estructural, versiones, proyecto JSON y arranque | `knownVersions` | — |

El registro de `suggestion-sources.js` consulta, por orden, las fuentes de comandos de barra diagonal, referencias y citas, y comandos y entornos LaTeX. Cada token identifica la fuente que acepta su opción. El cierre pertenece a `suggestion-list.js`. La sesión de barra diagonal se suscribe a ese cierre. Las preferencias leen las macros predeterminadas y aplican el cambio mediante una función declarada en [H].

La lista, su posición y el foco de las sugerencias viven en `suggestion-list.js`. El formulario y la persistencia de alias se conectan mediante `alias-editor.js`. La lectura y el intercambio del JSON se conectan desde `portable-config.js`. Los destinos de navegación y el resumen de los datos viven en `mobile-panels.js`. La lista anidada y la restauración de foco viven en `structure-view.js`. El destino del formulario, el vaciado de sus campos y el cambio de tipo viven en `block-form.js`. Las operaciones de tarjeta y la recuperación del foco viven en `block-actions.js`. La aplicación aporta el árbol actual y las funciones que aplican los cambios.

### Dónde va el código nuevo

`app.js` tiene un presupuesto de bytes que solo baja (INV-012,
[DEC-030](../decisiones/DEC-030-app-js-solo-cableado.md)). Antes de escribir:

| Si lo nuevo es… | …va en | y se prueba con |
| --- | --- | --- |
| una regla: calcular, validar, transformar texto o árbol | un script clásico propio o uno existente con ese dueño | `tests/*.test.js` y `load-app.mjs` |
| un dato: catálogo, menú, plantilla | el catálogo que ya existe (`menus.js`, `math-symbols.js`, `block-types.js`…) | la prueba de coherencia de ese catálogo |
| una interacción que lee el DOM y aplica una regla | el mínimo cableado en `app.js`, compensando bytes | `tests/interfaz.test.js` |
| una interacción con estado propio | un controlador propio, cuando exista su patrón (encargo vigente en `agents.md`) | `tests/interfaz.test.js` |

Un script nuevo exige cuatro listas al día: `index.html`, `tests/check-site.mjs`,
`check:js` de `package.json` y el cargador de sus pruebas. `tests/arquitectura.test.js`
comprueba las dos primeras contra `assets/js/`.

---

## 3. El estado y su forma

Un solo objeto, sin clases y sin framework:

```js
{
  metadata: { title, author, course, teacher, date, topic },
  blocks: [ { type, title, content, children: [ /* recursivo */ ] } ]
}
```

Tres reglas del árbol que conviene tener presentes:

- **Un bloque se identifica por su ruta**, un array de índices: `[2, 0]` es el primer
  hijo del tercer bloque de la raíz. Nunca por su texto ni por un identificador, así
  que mover o borrar un hermano **sí** cambia las rutas de los que van detrás. Por eso
  `app.js` vuelve a dibujar la lista después de cada operación.
- **Todas las operaciones son puras.** Devuelven un árbol nuevo y no tocan el que
  reciben. Una ruta inválida devuelve `null`, y quien llamó conserva el estado
  anterior y lo anuncia, en vez de trabajar sobre un árbol corrupto.
- **`children` ausente equivale a `children: []`.** Un borrador plano de la versión
  anterior sigue siendo válido; `normalizeDraft` lo migra y lo dice.

Las versiones se almacenan en IndexedDB, base `tex-notes`, almacén `versions`. La clave histórica de localStorage `tex-notes:draft:v2` se migra una vez, después se retira. `normalizeDraft`
tolera datos ausentes, corruptos o mal anidados **a cualquier profundidad y nunca
lanza**: es entrada no confiable, viene del navegador de alguien.

`listFormat` pertenece a los bloques de lista. Al restaurar un borrador anterior
sin ese campo, se conserva el modo plano. Un cambio de contenido activa el modo
por sangría, que se guarda en la misma versión del borrador.

---

## 4. Del estado al `.tex`

```
generateLatex(state)
├── buildPreamble()          documentclass, paquetes y…
│   └── buildTheoremDefs()   …un \newtheorem DERIVADO de la tabla de tipos
├── buildMetadata(metadata)  \title \author \date   ← escapeMetadata()
├── buildBody(state)         \section del tema + los bloques de la raíz
│   └── blockToLatex(block)  recursivo    ← contentToLatex()
└── "\end{document}"
```

**Las dos funciones de texto son distintas a propósito y se rompen en direcciones
opuestas.** Es lo más importante de este módulo:

| | Qué recibe | Qué hace |
| --- | --- | --- |
| `escapeMetadata()` | títulos y metadatos | escapa **todo**: `\ # $ % & _ { } ~ ^` |
| `contentToLatex()` | el contenido de un bloque | **ni un solo escape** |

El contenido no se escapa porque **es LaTeX**, no prosa: el tablero de símbolos
inserta `\mathbb{R}` en ese mismo campo. Los metadatos sí, porque la aplicación los
interpola dentro de un argumento que ella misma genera. Lo vigilan INV-002 e INV-003,
uno en cada dirección, y el porqué completo está en
[DEC-004](../decisiones/DEC-004-contenido-sin-escapar.md).

`contentToLatex()` lleva un bloque `@decision` anclado: **si cambias su cuerpo,
`npm test` te obliga a mirar la justificación**. Ver [Recetas](#5-recetas).

Dos detalles del recorrido:

- Los hijos de un bloque que **abre un entorno** se emiten antes de su `\end{…}`;
  los de un bloque de **texto**, después de su propio contenido. Nunca se concatenan
  dentro de `content`.
- `blockToLatex(block, context)` propaga el entorno LaTeX abierto para decidir
  si una imagen puede flotar. Un bloque de texto transmite ese contexto a sus
  hijos.
- La generación es **determinista**: el mismo estado da la misma cadena, byte a byte.
  Eso es lo que hace posible `examples/calculo-3.tex` como archivo de referencia
  (INV-008).

---

## 5. Recetas

Cada una termina en `npm test`. Las dos primeras están **ejecutadas**, no deducidas.

### Añadir una acción

Declara su identificador, nombre, icono y contextos en `actions.js`. La disponibilidad depende de los datos que recibe `enabled`. Registra la operación en `createActionBindings`. Los botones usan `data-action-id` y los sectores usan el mismo identificador en `action`. Los atajos conservan su ámbito en `shortcuts.js` y llaman a `runAction`. Comprueba el registro tanto en Node como en Chromium.

### Añadir un tipo de bloque

Es el cambio más probable, y tiene **cinco** pasos, no dos. Los pasos 3 y 4 no se
deducen leyendo el código: aparecieron al hacerlo.

1. **La entrada en la tabla**, en `assets/js/block-types.js`:

   ```js
   { id: "lemma", label: "Lema", kind: "theorem", environment: "lemma",
     heading: "Lema", style: "plain", container: true },
   ```

   `kind` es `"text" | "equation" | "theorem" | "list" | "bibliography" | "image"`. `container` decide si admite
   hijos, y lo aplican por igual la interfaz y el generador.

2. **Su `<option>` en `index.html`**, en la misma posición que en la tabla. Una prueba
   compara ambas listas (INV-005).

3. **Amplía el `tramo` del bloque `@decision`** que encabeza `BLOCK_TYPES` para
   incluir la nueva línea y ejecuta:

   ```sh
   npm run bendecir
   ```

4. **Actualiza la lista literal** de `tests/generator.test.js`, en la prueba «la tabla
   declara los tipos del temario en el orden de la interfaz». Es deliberadamente una
   lista escrita a mano: obliga a que añadir un tipo sea un acto consciente.

5. **Regenera el archivo de referencia**, porque el preámbulo gana un `\newtheorem`:

   ```sh
   npm run build:example
   ```

   **El diff del `.tex` es la revisión.** Para el ejemplo de arriba es exactamente una
   línea, `+\newtheorem{lemma}{Lema}`. Si salen más, tu cambio hizo algo que no creías.

Para un `kind` existente, el preámbulo, la interfaz básica y la numeración se
rigen por la tabla. Un `kind` nuevo puede necesitar generación y controles
propios. Por ejemplo, `image` registra `blockFieldHooks` para leer, rellenar,
limpiar y validar sus campos. También registra `previewRenderers` para la
miniatura y `blockItemExtensions` para el resumen visible en la estructura.

### Añadir un símbolo al tablero

1. Una entrada en `MATH_SYMBOLS`, en `assets/js/math-symbols.js`:

   ```js
   { id: 'nabla', group: 'derivatives', symbol: '∇', command: '\\nabla',
     name: 'nabla', keywords: ['nabla', 'gradiente', 'derivatives'] },
   ```

   - `id` único; `group` tiene que ser uno de los declarados en `MATH_SYMBOL_GROUPS`.
     Hay una prueba de coherencia para ambas cosas.
   - **`keywords` en castellano y sin miedo a repetir**: es lo único por lo que alguien
     va a encontrarlo. La búsqueda ignora acentos y mayúsculas y acepta también el
     comando.
   - Para envolver una selección en vez de insertar en el cursor, usa
     `insert: { before, after }` en vez de apoyarte en `command`.
2. **El comando debe existir en `amsmath` o `amssymb`.** El documento no carga ningún
   otro paquete y no se van a añadir por un símbolo.
3. `npm test`.

### Cambiar el formato del `.tex` que se genera

1. Toca `latex-generator.js`.
2. `npm run build:example` y **lee el diff de `examples/calculo-3.tex`**: ése es el
   cambio real, expresado en el formato que le importa a quien usa la aplicación.
3. Si tocaste el cuerpo de `contentToLatex()`, ve a la receta siguiente.
4. `npm test`.

### Resolver un fallo de ancla

```
assets/js/latex-generator.js:27 DEC-004 — declara 03f12fa0, el código da d47a4b4a
```

No dice que haya un error. Dice que **cambiaste código bajo una justificación escrita
sin mirarla**. Ábrela y elige, por orden de preferencia:

1. La justificación ya no describe lo que hace el código → **reescribe el texto del
   bloque** y luego `npm run bendecir`.
2. La justificación sigue vigente y el cambio es compatible → `npm run bendecir`, y
   **dilo en el mensaje del commit**.
3. El cambio contradice la decisión → el que está mal es el código.

Dos fallos que no son deriva real:

- `tramo:N excede el final del archivo` → acortaste la función; ajusta `tramo`.
- `el comentario no cierra (*/ o -->)` → pusiste el marcador en un comentario de línea.
  El formato exige bloque, para saber dónde empieza el código.

Y uno que sí lo es y se ve poco: **la función creció y el `tramo` declarado ahora tapa
solo su primera mitad.** El mensaje es el normal, pero la corrección es ampliar
`tramo`, no bendecir.

> `bendecir` puede usarse como trámite, y es lo único de este sistema que ninguna
> prueba vigila. Si un commit reescribe varias anclas a la vez, nadie leyó nada.

### Declarar una invariante

Solo si puedes responder que sí a **“¿puedo nombrar el archivo y la afirmación que
fallan cuando esto se viola?”**. Si no, lo que tienes es una justificación y va a
`decisiones/`, o un rasgo del sistema y va al `README.md`.

1. Escribe la prueba primero, o identifica la que ya lo vigila.
2. Añade la entrada a [`INVARIANTES.md`](../INVARIANTES.md), **copiando la afirmación
   literalmente** del archivo fuente, con sus barras invertidas dobles si las tiene:

   ```
   ### INV-009 — enunciado en una línea
   Guardián: `tests/loquesea.test.js` → "la afirmación, copiada literalmente"
   ```

3. `npm test`. Una invariante sin guardián se rechaza; es la única puerta del sistema
   y está ahí a propósito.

### Añadir una prueba

1. `tests/*.test.js`; `node --test` la descubre sola.
2. Si necesitas el código del navegador, impórtalo con `tests/load-app.mjs`: lo ejecuta
   en un contexto `node:vm` en el mismo orden que `index.html`.
3. `npm run inventario`, porque `docs/pruebas.md` se deriva de la suite y hay prueba
   que exige que esté al día.

### Cambiar un rótulo de la interfaz

Renombrar un botón **rompe `npm test`** si la guía de uso lo menciona, y eso es lo que
se quiere. Actualiza `docs/guia-de-uso.md` en el mismo commit. El mensaje te dice cuál:

```
docs/guia-de-uso.md cita «Generar documento», que ya no es ninguna etiqueta
de la interfaz
```

---

## 6. Las pruebas

El inventario completo, con el número y el nombre de cada prueba, está en
[`docs/pruebas.md`](pruebas.md). Es un archivo **generado** desde la suite: no lo
edites, regenéralo con `npm run inventario`.

Cómo se reparten:

| Archivo | Qué vigila |
| --- | --- |
| `generator.test.js` | el contrato del `.tex`: preámbulo, entornos, el ejemplo byte a byte |
| `content-literal.test.js` | que el contenido no se escape y los metadatos sí |
| `block-tree.test.js` | el árbol: rutas, pureza, duplicar, copiar, migrar borradores |
| `symbols.test.js` | catálogo, búsqueda e inserción en el cursor |
| `invariantes.test.js` | que cada invariante siga teniendo guardián |
| `anclas.test.js` | que ningún bloque `@decision` haya derivado |
| `documentacion.test.js` | enlaces, anclas de índice, rótulos y el inventario |
| `interfaz.test.js` | el cableado de `app.js` en Chromium: foco, gestos, menús; se omite sin Playwright |
| `check-site.mjs` | lo estructural del HTML; **no** usa `node:test` |

Dos cosas que conviene saber antes de escribir la primera:

**Las pruebas puras no tienen DOM.** `tests/load-app.mjs` ejecuta los scripts del navegador en un contexto
`node:vm`, en el mismo orden que `index.html`, y clona los datos al realm de la prueba.
Así se prueba exactamente el código que se publica, sin mantener una segunda copia en
formato módulo — y sin añadir una dependencia, que sería violar INV-006 para poder
vigilarlo.

Los recorridos por área están en `tests/interfaz-editor.test.js`, `tests/interfaz-estructura.test.js`, `tests/interfaz-menus.test.js`, `tests/interfaz-escritura.test.js` y `tests/interfaz-versiones.test.js`. Cada prueba abre un contexto limpio. `mantener` deja el dedo apoyado, `arrastrar` recorre los puntos y lo levanta, `codigo` genera el documento y `foco` devuelve el identificador activo.

**La interfaz se prueba en un navegador real, no en un DOM simulado.**
`tests/interfaz.test.js` usa el arnés `tests/navegador.mjs`, que abre `index.html` por
`file://` en Chromium, en escritorio o con un teléfono emulado (`abrir("Pixel 7")`), y
recoge los errores de la página. Playwright **no** está en `package.json` (INV-006): el
arnés lo usa si está instalado y, si no, las pruebas se omiten con motivo. Para
ejecutarlas en local:

```sh
npm install --no-save --no-package-lock playwright@1.63.0
npx playwright install chromium
TEX_UI_TESTS=required npm test   # falla, en vez de omitir, si falta Playwright
```

CI (`.github/workflows/pruebas.yml`) las ejecuta en cada rama y PR con
`TEX_UI_TESTS=required`. Para deslizar un dedo, `deslizar()` envía eventos táctiles por
CDP. El porqué está en [DEC-029](../decisiones/DEC-029-pruebas-de-interfaz-en-chromium.md).
Las reglas siguen fuera de `app.js` siempre que se pueda: una prueba pura es más
rápida y determinista que una de interfaz. Lo que Chromium emulado no reproduce
(Android físico, Gboard, TalkBack, NVDA, Overleaf) sigue en la
[revisión manual](revision-manual.md).

Las pruebas comparan el archivo de referencia byte a byte. Si está instalado, `pdflatex` compila también los fragmentos radiales en un directorio temporal con `-no-shell-escape`. Overleaf se revisa manualmente.

Los sectores se definen en `assets/js/menus.js`. Se puede añadir un fragmento, referenciar un símbolo por id, crear un submenú o invocar un comando existente editando ese archivo. Para un comando nuevo hay que registrar su función en `runAction` de `app.js`. Los rótulos de tipos y símbolos se resuelven desde sus catálogos. La geometría y las transiciones se prueban en `tests/radial.test.js`.

---

## 7. El sistema de documentación

Seis documentos, seis vidas medias. Las reglas completas están en
[`PROTOCOLO.md`](../PROTOCOLO.md); esto es el resumen.

| Documento | Qué contiene | Cómo cambia |
| --- | --- | --- |
| [`INVARIANTES.md`](../INVARIANTES.md) | reglas con guardián | se lee siempre |
| [`decisiones/`](../decisiones/) | el porqué | **solo se añade**, nunca se reescribe |
| bloques `@decision` | el porqué de un tramo concreto | anclados al código |
| `README.md` | el estado actual del sistema | se sobrescribe |
| [`guia-de-uso.md`](guia-de-uso.md) | cómo usarla | se sobrescribe |
| esta guía | cómo extenderla | se sobrescribe |

**Dónde va lo que aprendas.** La pregunta no es “¿esto es importante?” sino
**“¿puedo escribir una prueba que falle si se viola?”**:

1. Sí, y vale para todo el repositorio → `INVARIANTES.md` **más su guardián**.
2. No es comprobable, pero vale para todo el repositorio, o gobierna algo que se
   rechazó y por tanto no tiene código → entrada nueva en `decisiones/`.
3. En cualquier otro caso → un bloque `@decision` sobre el código que gobierna.

Un rasgo que simplemente *describe* cómo funciona hoy no es ninguna de las tres: va al
`README.md`, que se sobrescribe.

**Para invalidar una decisión** no se borra: se le pone `status: superseded` y
`superseded-by: DEC-NNN`, y la nueva se escribe aparte. El texto viejo explica por qué
se intentó algo, que es justo lo que evita repetirlo.

`agents.md` y `claude.md` son **buzones transitorios**: pizarras entre agentes, se
vacían sin aviso y no son fuente de reglas
([DEC-006](../decisiones/DEC-006-buzones-transitorios.md)). Antes de vaciar uno,
promueve lo durable.

---

## 8. Publicación

`.github/workflows/pages.yml` ejecuta `npm test` y publica el sitio estático al recibir
cambios en `main`, con acciones oficiales y nada más. En **Settings → Pages → Build and
deployment**, elige **GitHub Actions**.

Todas las rutas del sitio son relativas (INV-007), así que funciona igual en un dominio
raíz que en una subruta de proyecto. Y como no carga nada remoto (INV-006), funciona
igual abierto por doble clic y sin red.

## Edición y autoguardado

`diffEdit` calcula el reemplazo mínimo sin dividir pares UTF-16.
`applyFieldEdit` aplica cualquier edición del contenido y conserva la selección;
`isApplyingFieldEdit()` permite ignorar los eventos que produce la propia app.
Solo cargar y vaciar el editor asignan directamente su valor. Véase DEC-016.

`renderBlockPreview` memoriza nodos de estructura por tipo, formato, contenido,
contexto de profundidad y versión de vista previa; las imágenes quedan fuera.
El autoguardado usa `tex-notes:autosave:v1`, con una copia anterior en
`tex-notes:autosave:previous`. Los eventos input/change tienen retardo de 800 ms;
pagehide y visibilitychange guardan de inmediato. Véase DEC-019.

## Contexto y autocierre

`math-preview.js` mantiene la única lista `MATH_ENVIRONMENTS` y expone
`mathContextAt` e `isEscaped`. `editing-assist.js` contiene `autoPair`,
`activePairs`, `deleteEmptyPair` y `completeEnvironment`, todas puras.
Los cierres se guardan por distancia al final y se validan contra el texto.
`app.js` atiende caracteres en beforeinput y navegación en captura del fieldset.
La preferencia se guarda en `tex-notes:prefs:v1`; puede funcionar sin almacenamiento.

## Ampliar sugerencias y alias

Añade un alias predeterminado a `DEFAULT_ALIASES` de `completion.js` con
trigger, expansion y mode; ejecuta `validateAlias` y las pruebas. Evita las
palabras de `SHORT_WORDS`. Los comandos de texto viven en `TEXT_COMMANDS`; los
símbolos se derivan del catálogo y los entornos de `MATH_ENVIRONMENTS`.
`rankCompletions` recibe el instante y el historial para ser determinista. Ordena
por nivel de coincidencia, uso, longitud del comando y posición en el catálogo.
`parseSnippet` acepta texto o before/after, y `snippetEdit` devuelve la edición,
los huecos y los cierres. Su sesión almacena distancias al final, no índices
que se desplacen al escribir. La navegación condicional se rige por DEC-015.

`validateConfiguration` valida el sobre y todos sus elementos antes de cualquier
reemplazo. Alias, uso y preferencias tienen claves separadas con sufijo v1.
La exportación es JSON; no modifica el borrador ni el contenido del documento.

## Tipos con comandos y plantillas

Cada entrada de `BLOCK_TYPES` declara `slash`, un array de comandos sin barra.
Añadir un comando es editar esa tabla, no el menú. `predefined: true` omite
entornos como proof de `buildTheoremDefs`; su generación sigue el kind theorem.
Actualiza las opciones HTML, la prueba del orden, ambas guías, el tramo y el
ancla de DEC-005. Regenera el ejemplo y comprueba su diff.

Añade una plantilla incluida a `BUILTIN_TEMPLATES` en `templates.js`, con id,
name, trigger y steps. Cada paso tiene depth y block; empieza en profundidad 0
y solo puede subir un nivel, con un padre que admita hijos. `validateTemplate`
comprueba también comandos duplicados. El contenido usa la sintaxis de huecos.
`templateParent` y `advanceTemplate` resuelven rutas desde los resultados de
`insertBlock`; omitir un padre omite su descendencia. `templateFromBranch`
recorre una copia de la rama en preorden y conserva las opciones. La interfaz
cancela la cola ante cambios estructurales y guarda las propias en
`tex-notes:templates:v1`. Véanse DEC-018 y DEC-020.

## Macros y versiones del borrador

`normalizeMacros` aplica el saneado estructural del borrador: nombre latino,
params entero entre 0 y 9 y body cadena. `normalizeDraft` migra v1/v2 con macros
vacías y conserva las macros de v3. Desde v4 cada bloque tiene un id estable y cada documento su `documentId`. La versión 5 incorporó las etiquetas y la 6 añade el catálogo bibliográfico. Se rechaza un número de versión superior a `DRAFT_VERSION`. Tras incorporar el borrador histórico como versión manual, se retira su clave de localStorage. `macrosToPreamble` vive en el generador, sin depender de la
interfaz, y emite newcommand con cuerpo literal. Sin macros no añade líneas.

`macros.js` valida nombres de catálogo, lista reservada y entornos, unicidad,
argumentos, llaves y parámetros. La vista previa recibe un objeto de macros
nuevo por llamada; las definiciones explícitas consumen incluso argumentos
no usados en el cuerpo. `setDocumentMacros` incrementa previewVersion y vuelve
a calcular vistas y avisos. `checkBlock` acepta opciones en el cuarto argumento
para reconocer macros, y checkDocument las toma del estado. El historial de uso
identifica sugerencias personales por macro:nombre. Véase DEC-017.

## Interfaz adaptable

`.editor-workspace` organiza editor y estructura a partir de 75 rem. El
fieldset `.block-editor` limita su altura al viewport antes de aplicar sticky;
ambas columnas usan mínimos cero. El resumen de metadatos se actualiza sin
plegar los campos mientras se escriben. Una restauración ajusta su apertura
según el título y enfoca un control visible.

`blockItemExtensions` recibe article, actions, more y subject. Añade acciones
secundarias a more. `focusAction` abre los details antecesores antes de enfocar
y recurre a Editar si falla. `editing-keys` describe teclas de edición sin
registrar Tab ni Intro sin modificadores en SHORTCUTS.

Al sustituir un token por un fragmento, `pairsAfterReplacement` conserva solo
los pares exteriores. Los cierres consumidos por la sustitución se descartan,
incluso si el nuevo texto termina casualmente en el mismo carácter.

El gancho de carga de listas conserva el bloque fuente al cargar un paso de
plantilla. `listFormatAfterEdit` mantiene flat si el contenido sigue igual y
activa outline cuando se modifica, como al editar un bloque del árbol.

El título de la nota y el del bloque cuentan como trabajo para autoguardar,
aunque aún no haya bloques incorporados. Los metadatos precargados de curso,
profesor y fecha no convierten una sesión vacía en una sesión recuperable.

## Versiones y archivo de proyecto

`versions.js` normaliza proyectos, compara árboles por id, calcula diferencias de líneas acotadas, administra la retención y las dos pilas del historial. El adaptador de interfaz `version-storage.js` ofrece `read()` y `update(transform)`. IndexedDB ejecuta la lectura, los cambios y la poda en una transacción. El respaldo alternativo usa una clave local y limita las automáticas a ocho. [DEC-025](../decisiones/DEC-025-versiones-y-proyecto.md) documenta la relación con el autoguardado y el formato de intercambio.

## Selección por alcance

`selection-scope.js` calcula rangos sobre la cadena UTF-16 original. La prosa usa segmentación española. El analizador matemático conserva comentarios y escapes como unidades, empareja grupos y entornos y reconoce argumentos de fracciones, raíces, índices, relaciones y separadores de matriz. `expandScope` y `shrinkScope` conservan una pila de rangos. Ninguna de estas funciones escribe en el campo.

## Destinos y contadores del documento

`labelPrefix` en `block-types.js` habilita la etiqueta. El formato v5 migra la etiqueta histórica de imagen y conserva la primera ocurrencia en preorden. `blockIsEmitted` y `emissionContext` se comparten entre generador y recorrido de destinos. `cross-references.js` calcula los contadores y analiza los comandos manuales. `checkDocument` combina los diagnósticos con ruta, línea y columna. Las instantáneas y `diffDocuments` incluyen el campo del bloque. [DEC-027](../decisiones/DEC-027-etiquetas-de-bloque.md)

## Catálogo bibliográfico

`references.js` contiene las ocho referencias de `temario.md`, la validación por campo, la asignación de claves y la ordenación de fichas. `citationInfo` recorre los bloques emitidos en preorden y reúne los usos, las claves citadas y las bibliografías manuales. El generador lo comparte para seleccionar `natbib` e imprimir una sola lista al final. `printedReferences` calcula los sufijos por título entre las entradas que se imprimirán.

`normalizeDraft` migra v1–v5 a v6. Cada instantánea contiene una copia de los autores y las opciones. La configuración v2 registra `references` como parte y acepta también el archivo plano v1. `convertBibliography` valida todas las claves antes de retirar el bloque. La interfaz registra la conversión como un solo cambio en el historial. [DEC-028](../decisiones/DEC-028-citas-y-bibliografia.md)

### Registrar una parte de configuración

Registra `key`, `version`, `defaults` y `validate` con `registerConfigPart`. Si cambia la versión de la parte, añade su migración. La aplicación aporta un lector y un aplicador para esa clave. La envoltura v2 guarda cada parte como `{version, value}` dentro de `parts`. El archivo plano v1 se migra antes de validar. Solo se aplican las partes presentes y se informa de las desconocidas.

`menu-config.js` registra la parte portátil `menus`, valida los enlaces y resuelve cada posición sobre las ocho del contexto. Mi botón guarda un id de acción o `ring:<id>`. El controlador de `menu-editor.js` conserva la edición hasta guardar y usa la geometría de `radial.js` para el dibujo estático y el anillo flotante.
