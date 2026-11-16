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

**Antes de tocar nada, lee [`INVARIANTES.md`](../INVARIANTES.md).** Son ocho reglas
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
npm run check:js    # sintaxis de los siete archivos del navegador
python3 -m http.server 8000     # o abre index.html con doble clic
```

Los cinco comandos del repositorio:

| Comando | Qué hace |
| --- | --- |
| `npm test` | la suite entera, incluidas invariantes, anclas y documentación |
| `npm run check:js` | comprueba la sintaxis de los siete archivos del navegador |
| `npm run build:example` | regenera `examples/calculo-3.tex`, el archivo de referencia |
| `npm run bendecir` | recalcula las anclas `@decision` tras revisar su justificación |
| `npm run inventario` | regenera `docs/pruebas.md` desde la suite |

Los tres últimos escriben archivos que **hay prueba que vigila**: si los dejas sin
ejecutar cuando tocaba, `npm test` se pone rojo.

---

## 2. Mapa del código

Siete archivos, cargados **en este orden** como scripts clásicos, nunca módulos ES.
Todos cuelgan de un único global, `window.TexNotes`.

| Orden | Archivo | Qué posee | Toca el DOM |
| --- | --- | --- | --- |
| 1 | `block-types.js` | la tabla de tipos de bloque | no |
| 2 | `block-tree.js` | el árbol: rutas y operaciones puras | no |
| 3 | `latex-generator.js` | el estado → la cadena `.tex` | no |
| 4 | `file-download.js` | nombre de archivo y descarga | sí |
| 5 | `math-symbols.js` | catálogo de símbolos y su búsqueda | no |
| 6 | `text-insertion.js` | insertar en la posición del cursor | apenas |
| 7 | `app.js` | toda la interfaz | sí, en exclusiva |

**La frontera importante es la última fila.** Los seis primeros son funciones puras
sobre datos; `app.js` es el único que sabe que existe una pantalla. Por eso los seis
tienen pruebas y `app.js` no ([DEC-007](../decisiones/DEC-007-sin-dom-en-pruebas.md)).
Si te ves escribiendo lógica dentro de `app.js`, casi siempre pertenece a uno de los
otros seis, donde sí se puede probar.

> **Nunca los conviertas en módulos ES.** Con `file://` el navegador bloquea por CORS
> la descarga de un módulo y la interfaz queda inerte. Es INV-004 y
> [DEC-002](../decisiones/DEC-002-scripts-clasicos.md); `tests/check-site.mjs` vigila
> tanto la ausencia de `type="module"` como el orden de carga.

Qué exporta cada uno, si necesitas buscar una función:

- **`block-tree.js`**: `normalizeBlock`, `normalizeBlocks`, `normalizeDraft`,
  `blockAtPath`, `siblingsAtPath`, `insertBlock`, `duplicateBlock`, `updateBlock`,
  `removeBlock`, `moveBlock`, `cloneBlock`, `cloneBlocks`, `countBlocks`,
  `flattenBlocks`, `pathToKey`, `keyToPath`, `pathLabel`, `DRAFT_VERSION`.
- **`latex-generator.js`**: `generateLatex`, `blockToLatex`, `contentToLatex`,
  `escapeMetadata`, `buildPreamble`, `buildTheoremDefs`, `buildMetadata`, `buildBody`,
  `normalizeLineBreaks`, `METADATA_KEYS`.
- **`math-symbols.js`**: `MATH_SYMBOLS`, `MATH_SYMBOL_GROUPS`, `filterMathSymbols`,
  `symbolsByGroup`, `normalizeSearchTerm`, `describeCommand`, `symbolAccessibleName`.
- **`text-insertion.js`**: `insertAtSelection` (pura), `insertIntoField`.
- **`file-download.js`**: `sanitizeFilename`, `downloadTex`.

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

El borrador se guarda bajo demanda en `localStorage`, con la clave
`tex-notes:draft:v2` y la forma `{ version: 2, metadata, blocks }`. `normalizeDraft`
tolera datos ausentes, corruptos o mal anidados **a cualquier profundidad y nunca
lanza**: es entrada no confiable, viene del navegador de alguien.

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
- La generación es **determinista**: el mismo estado da la misma cadena, byte a byte.
  Eso es lo que hace posible `examples/calculo-3.tex` como archivo de referencia
  (INV-008).

---

## 5. Recetas

Cada una termina en `npm test`. Las dos primeras están **ejecutadas**, no deducidas.

### Añadir un tipo de bloque

Es el cambio más probable, y tiene **cinco** pasos, no dos. Los pasos 3 y 4 no se
deducen leyendo el código: aparecieron al hacerlo.

1. **La entrada en la tabla**, en `assets/js/block-types.js`:

   ```js
   { id: "lemma", label: "Lema", kind: "theorem", environment: "lemma",
     heading: "Lema", style: "plain", container: true },
   ```

   `kind` es `"text" | "equation" | "theorem" | "list"`. `container` decide si admite
   hijos, y lo aplican por igual la interfaz y el generador.

2. **Su `<option>` en `index.html`**, en la misma posición que en la tabla. Una prueba
   compara ambas listas (INV-005).

3. **Amplía el `tramo` del bloque `@decision`** que encabeza `BLOCK_TYPES` —la tabla
   ganó una línea, así que `tramo:12` pasa a `tramo:13`— y ejecuta:

   ```sh
   npm run bendecir
   ```

   Sin esto: `block-types.js:11 DEC-005 — declara fe5dadc4, el código da 6bbe8d97`.

4. **Actualiza la lista literal** de `tests/generator.test.js`, en la prueba «la tabla
   declara los tipos del temario en el orden de la interfaz». Es deliberadamente una
   lista escrita a mano: obliga a que añadir un tipo sea un acto consciente.

5. **Regenera el archivo de referencia**, porque el preámbulo gana un `\newtheorem`:

   ```sh
   npm run build:example
   ```

   **El diff del `.tex` es la revisión.** Para el ejemplo de arriba es exactamente una
   línea, `+\newtheorem{lemma}{Lema}`. Si salen más, tu cambio hizo algo que no creías.

Nada más: el preámbulo, la interfaz y la numeración se derivan solos de la tabla.

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
| `check-site.mjs` | lo estructural del HTML; **no** usa `node:test` |

Dos cosas que conviene saber antes de escribir la primera:

**No hay DOM.** `tests/load-app.mjs` ejecuta los scripts del navegador en un contexto
`node:vm`, en el mismo orden que `index.html`, y clona los datos al realm de la prueba.
Así se prueba exactamente el código que se publica, sin mantener una segunda copia en
formato módulo — y sin añadir una dependencia, que sería violar INV-006 para poder
vigilarlo.

**Por eso `app.js` no tiene pruebas automatizadas.** Los botones por bloque, el foco y
los anuncios se comprueban a mano, con la lista de
[revisión manual](../README.md#revisión-manual). No es un descuido: es
[DEC-007](../decisiones/DEC-007-sin-dom-en-pruebas.md), y la contrapartida es que la
lógica debe vivir fuera de `app.js` siempre que se pueda.

**No se compila LaTeX en ninguna prueba.** Se comparan cadenas `.tex`, nunca PDF. La
compilación es de Overleaf ([DEC-001](../decisiones/DEC-001-overleaf-copia-maestra.md)).

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
