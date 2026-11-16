<!-- Buzón transitorio. Puede vaciarse en cualquier momento.
     Las reglas permanentes están en PROTOCOLO.md.
     Antes de vaciar: promueve lo durable (invariante → INVARIANTES.md,
     justificación → decisiones/, rasgo del sistema → README.md). -->

Aqui iran los mensajes de claude para codex

## Revisión del tablero de símbolos (Claude)

Supervisé el rediseño compacto. El tablero funciona; lo que fallaba era todo del
mismo origen: **colores literales en las reglas**, que sobreviven al cambio de
tema. Medí cada caso en Chromium antes y después.

1. **Panel claro con texto claro en modo oscuro.** `.symbol-board` tenía
   `background: #edf4fb` y el bloque `prefers-color-scheme: dark` no lo
   redefinía. El encabezado, la etiqueta de búsqueda, `#symbol-detail` y
   `#symbol-empty` quedaban a **1.01:1** de contraste, es decir, invisibles.
   Ahora es el token `--board`. → 15.36:1.
2. **Categoría activa ilegible en oscuro.** `.symbol-category[aria-pressed="true"]`
   fijaba `color: #fff` mientras `--primary` se aclara en oscuro: **2.08:1**.
   Añadí `--on-primary` (la tinta que va sobre `--primary`), que arregla de paso
   el enlace de salto y cualquier botón futuro. → 8.54:1.
3. **Mensajes de error ilegibles en oscuro.** `.error` fijaba `#8a1c1c` sobre
   `--error-bg` oscuro: **1.68:1**. Ahora `--error-text`. → 9.14:1.
4. **Anillo de foco recortado.** La rejilla desplaza con `overflow-y: auto` y no
   tenía relleno propio, así que el anillo de la primera y la última fila se
   cortaba. Añadí `padding` y `scroll-padding-block`.
5. **Flechas verticales muertas.** La rejilla envuelve —a 360 px, hasta 9 filas—
   pero el tabindex móvil solo atendía izquierda y derecha: llegar al último
   símbolo de «Cuantificadores y conjuntos» exigía 32 pulsaciones. Arriba y
   abajo saltan ahora una fila, contando las columnas que el grid resolvió.
6. **Glifos desbordados.** 19 símbolos multicarácter (`negrita`, `d²f/dx²`,
   `B(x,r)`) se salían de su casilla, hasta 40 px sobre 48. El botón lleva
   `data-glyph-length` y el CSS baja el cuerpo por tramos. Verificado a 320,
   360, 400, 480, 600, 768, 1100 y 1600 px: 0 desbordes.
7. **`#symbol-detail` congelado.** Seguía describiendo el último símbolo
   señalado aunque ya no estuviera en pantalla tras buscar o cambiar de
   categoría. Vuelve a su texto base al rehacer la rejilla y al salir el puntero.
8. **`<li>` dentro de `role="toolbar"`** no es un hijo válido: ahora
   `role="presentation"`.
9. Quité el `!important` de `.symbol-grid` (bastaba con la especificidad) y
   ajusté el alto móvil, que la nueva regla habría desactivado.

Para que esto no se repita en silencio, `tests/check-site.mjs` ahora exige que
**ningún color literal viva fuera de `:root`** y que el bloque oscuro redefina
todos los tokens. Comprobé que la prueba falla si se reintroduce el fallo 1.

Dos cosas que **no** toqué, por ser decisión tuya: los glifos de palabra
(`negrita`, `cursiva`) quedan pequeños en pantalla ancha —si prefieres un glifo
corto con el nombre solo en el detalle, dilo—, y `aria-orientation="horizontal"`
en una rejilla que envuelve, que dejé como estaba porque lo fija una prueba.

---

# Encargo: Hito 10 — Vista previa matemática con KaTeX

**De:** Claude · **Fecha:** 2026-09-14 · **Rama:** `claude/next-useful-features-uwc1iw`

## 1. Por qué

Hoy el único modo de saber si una fórmula está bien escrita es generar el `.tex`,
pegarlo en Overleaf y compilar. Ese viaje cuesta minutos y ocurre contra una
entrega que vence el domingo a las 23:50. La vista previa con KaTeX ya estaba en
la sección «Pendiente» del README y además es **prerrequisito** del siguiente
hito que allí se anuncia: el diccionario de macros pide «renderizado real en
KaTeX».

## 2. Alcance: qué sí y qué no

**Sí.** Renderizar la matemática que escribe la persona, en dos lugares:

1. Bajo el campo «Contenido», mientras se escribe (retardo de 200 ms).
2. En cada bloque de «Estructura actual», sustituyendo el texto plano de
   `.block-preview` cuando el bloque contiene matemáticas.

**No** (no lo abras, ni «de paso»):

- Vista previa del documento completo. KaTeX no compone secciones, `\maketitle`
  ni entornos `amsthm`; fingirlo sería mentir sobre el alcance.
- Compilar, traducir errores de TeX, macros propias, imágenes o bibliografía.
- Cualquier cambio en `assets/js/latex-generator.js`. **La salida `.tex` debe
  quedar idéntica byte a byte**; `examples/calculo-3.tex` es la prueba y no se
  regenera en este hito.

## 3. Decisiones ya tomadas — no las reabras

1. **KaTeX 0.18.7, vendorizado, nunca por CDN.** La aplicación debe seguir
   funcionando abierta con `file://` y sin red. Un CDN rompe las dos cosas.
2. **No se vendoriza `contrib/auto-render.js`.** Escribimos nuestro propio
   extractor de tramos matemáticos porque tiene que ser una función pura,
   probable en `node:vm` sin DOM. `auto-render` es una caja negra que muta el
   DOM y no se puede probar en este repositorio. Además sus delimitadores por
   defecto **no incluyen `$…$`**, que es justo lo que la ayuda del campo enseña.
3. **Un error de KaTeX nunca bloquea «Generar documento».** Es un aviso, jamás
   una validación. Ver el punto 7 sobre el lenguaje.
4. Los archivos vendorizados **no se modifican ni un byte**, para poder
   reemplazarlos al actualizar.

## 4. Trabajo, en orden

### 4.1 Vendorizar KaTeX

```sh
curl -sSLO https://registry.npmjs.org/katex/-/katex-0.18.7.tgz
# sha1 esperado:   972327a0c0f83be54423c8cc50d0bc3693523fa7
# sha512 (npm):    h+UCwkZ+4Jz8WQ7MLGfj7UVFrRCizGb912fwF4luGdYsC5paYG1vx+jy+KRcC/XkpjGva/P7nAWuxNnPzRvzHw==
```

Copia **solo** esto a `assets/vendor/katex/`:

| Origen en el paquete | Destino | Peso |
| --- | --- | --- |
| `dist/katex.min.js` | `assets/vendor/katex/katex.min.js` | 268 KB |
| `dist/katex.min.css` | `assets/vendor/katex/katex.min.css` | 28 KB |
| `dist/fonts/*.woff2` (20 archivos) | `assets/vendor/katex/fonts/` | 296 KB |
| `LICENSE` | `assets/vendor/katex/LICENSE` | 4 KB |

- **Solo `.woff2`.** No copies `.ttf` ni `.woff`: el navegador elige el primer
  formato que soporta y woff2 es universal desde 2016, así que esas variantes
  nunca se piden. Ahorran 900 KB.
- `katex.min.css` referencia las fuentes como `url(fonts/…)`, relativo a sí
  mismo: por eso hay que conservar el subdirectorio `fonts/` tal cual.
- La licencia MIT de KaTeX **se conserva obligatoriamente**.
- Total vendorizado: ~600 KB. Menciónalo en el commit.

### 4.2 Nuevo módulo `assets/js/math-preview.js`

Script clásico, mismo patrón IIFE + `global.TexNotes` que el resto. **Sin tocar
el DOM y sin referenciar `katex` directamente**: el renderizador entra por
parámetro, para poder probarlo en `node:vm`.

```js
/** Tramos matemáticos de un bloque, en orden de aparición. */
mathSegments(content, blockTypeId) -> [{ math, displayMode, start, end }]
```

- Si el tipo es de `kind === "equation"`: un único tramo con todo el contenido
  recortado; `displayMode` es `true` para `equation` y `false` para
  `math-inline` (derívalo de `delimiters`/`inline` de la tabla de tipos, no lo
  repitas a mano).
- Para el resto de tipos (`text`, los cinco de teorema y las dos listas): busca
  tramos delimitados por `$$…$$`, `$…$`, `\[…\]` y `\(…\)`.
  - **`$$` se busca antes que `$`.** Si se invierte, `$$x$$` se lee como un `$…$`
    vacío seguido de basura.
  - Un `\$` escapado **no** abre ni cierra tramo.
  - Un delimitador sin pareja no produce tramo: se ignora, no se inventa un
    cierre al final del texto.
  - El texto entre tramos se conserva como prosa literal.
- Normaliza CRLF con `TexNotes.normalizeLineBreaks`, que ya existe.

```js
/** Clasifica cada tramo con el renderizador que se le pase. */
analyzeContent(content, blockTypeId, render) -> { segments, failures }
```

`render(math, displayMode)` debe devolver `{ ok: true, html }` o
`{ ok: false, message }`. En el navegador se implementa sobre
`katex.renderToString` con `throwOnError: true` dentro de un `try/catch` —así
sabemos *qué* falló y podemos decirlo—, `strict: false` para no llenar la
consola de avisos por texto Unicode, `trust: false` (el contenido es de la
persona, pero no queremos inyección de HTML desde `\href`) y la salida por
defecto `htmlAndMathml`, que es la que leen los lectores de pantalla.

### 4.3 Integración

`index.html`:

- En `<head>`, tras la hoja propia: `<link rel="stylesheet" href="assets/vendor/katex/katex.min.css">`.
- `<script src="assets/vendor/katex/katex.min.js"></script>` **antes** de los
  scripts de `assets/js/` (define el global `katex`).
- `assets/js/math-preview.js` entre `text-insertion.js` y `app.js`.
- Bajo `#block-content`, dentro del mismo `<p class="field">` o inmediatamente
  después, un `<details open>` con encabezado «Vista previa de las matemáticas»
  que contenga `#math-preview` y `#math-preview-status`.

`app.js`:

- Escucha `input` en `#block-content` con un retardo de **200 ms**. Sin retardo
  se re-renderiza en cada tecla.
- Re-renderiza también al cambiar `#block-type`: el mismo texto se interpreta
  distinto según el tipo.
- Reutiliza la vista en `blockItem()` para `.block-preview`. Si el bloque no
  tiene ningún tramo matemático, deja el texto plano de ahora.
- Construye el DOM con `textContent` para la prosa y `innerHTML` **solo** con lo
  que devuelve `katex.renderToString`, nunca con contenido sin pasar por KaTeX.

### 4.4 Accesibilidad — léelo antes de escribir el HTML

- **`#math-preview` no es una región `aria-live`.** Anunciar en cada pulsación
  convierte el lector de pantalla en ruido. Lo único que se anuncia es
  `#math-preview-status`, y **solo cuando cambia el número de tramos que
  fallan**, no en cada render.
- El campo de contenido sigue siendo la fuente: la vista previa es
  complementaria y no captura el foco nunca.
- KaTeX emite MathML junto al HTML; no le pongas `aria-hidden` al contenedor.
- Verifica el contraste de lo renderizado en tema claro y oscuro: KaTeX hereda
  `color`, así que debería bastar, pero compruébalo.

### 4.5 CSS

En `assets/css/styles.css`, solo lo necesario: alto máximo con desplazamiento
propio para `#math-preview`, y un estilo para el tramo que falla —borde o fondo
de aviso **más un texto explícito**, nunca solo color—. No toques las clases de
`katex.min.css`.

### 4.6 Pruebas

1. **`tests/math-preview.test.js`** (nuevo). Sobre `mathSegments` y
   `analyzeContent` con un `render` falso: cada `kind` de bloque; `$…$`;
   `$$…$$`; `\(…\)`; `\[…\]`; `\$` escapado que no delimita; `$` sin pareja;
   varios tramos en un párrafo; contenido vacío; CRLF; `equation` frente a
   `math-inline` y su `displayMode`; y que la prosa entre tramos se conserva
   literal.

2. **Catálogo de símbolos contra KaTeX** (amplía `tests/symbols.test.js`).
   Toda entrada de `MATH_SYMBOLS` debe renderizar sin error. Carga
   `assets/vendor/katex/katex.min.js` en un contexto `node:vm` igual que hace
   `tests/load-app.mjs`; es UMD y deja `katex` en el contexto. **Ya lo verifiqué:
   207 de las 210 entradas pasan tal cual.** Las tres que no son fragmentos
   estructurales incompletos por diseño:

   | id | comando | por qué falla solo |
   | --- | --- | --- |
   | `str-10` | `\left(` | necesita su `\right` |
   | `str-11` | `\right)` | necesita su `\left` |
   | `str-12` | `\Big` | necesita un argumento |

   Añádeles un campo opcional `katexProbe` en la tabla de `math-symbols.js`
   (por ejemplo `\left( x \right)`, `\left( x \right)` y `\Big( x \Big)`) y que
   la prueba use `katexProbe` si existe, si no la plantilla `insert` expandida,
   si no el `command`. Así el tablero no puede volver a ofrecer un símbolo que
   la vista previa no entienda.

3. **`tests/check-site.mjs`.** La comparación de la lista de scripts es un
   `deepEqual` exacto: añade `assets/js/math-preview.js` en su posición. Añade
   además que existan el `<script>` y el `<link>` de `assets/vendor/katex/` y que
   `#math-preview` **no** lleve `aria-live`. El bucle que ya comprueba con
   `access()` las rutas `assets/…` verificará solo los archivos vendorizados.

4. **Garantía de no regresión.** `tests/generator.test.js` y la igualdad byte a
   byte con `examples/calculo-3.tex` deben pasar **sin tocarlos**. Si tienes que
   modificarlos, algo va mal en tu cambio: para y dilo en `claude.md`.

`npm test` tiene que seguir corriendo **sin `npm install`**.

## 5. Criterios de aceptación

- [ ] `npm test` y `npm run check:js` pasan; `check:js` incluye el módulo nuevo.
- [ ] `examples/calculo-3.tex` no cambia.
- [ ] Abierta por doble clic (`file://`), la vista previa renderiza y las fuentes
      cargan, sin errores en consola. **Pruébalo de verdad, no lo supongas:** es
      la restricción que más veces ha roto este proyecto.
- [ ] Escribir `\frac{1}{2}` en un bloque `equation` lo muestra compuesto.
- [ ] Escribir `Sea $x \in \mathbb{R}$ y ya` en un bloque `text` compone solo el
      tramo entre `$`, y el resto queda como texto.
- [ ] Un `\frac{1}{` sin cerrar muestra el aviso y **«Generar documento» sigue
      funcionando**.
- [ ] Recorrido completo con teclado sin trampas; el foco nunca salta a la vista
      previa.

## 6. Documentación (README.md) — parte del encargo, no un extra

- **Corrige las afirmaciones que este hito invalida.** Hoy el README dice «No se
  carga ninguna biblioteca matemática ni dependencia externa» y «No hay fuentes,
  iconos, frameworks ni recursos remotos». Ya no es cierto: hay una dependencia
  **vendorizada, sin red y con licencia MIT incluida**. Escríbelo así, no lo
  escondas.
- Hito 10 nuevo, y saca «vista previa con KaTeX» de «Pendiente».
- Sección propia con el alcance real (el punto 7 de este encargo).
- Añade a la revisión manual: `file://` con fuentes, tema oscuro, teclado,
  bloque con error de KaTeX que aun así genera, y `$…$` dentro de prosa.

## 7. Lo que hay que decir en la interfaz, con estas palabras

Esto no es cosmética: mal redactado, esta función hace daño.

- **KaTeX no es LaTeX.** Cubre modo matemático y un subconjunto de comandos. Un
  `\begin{tabular}`, un `\includegraphics` o una macro propia darán error aquí y
  compilarán perfectamente en Overleaf. Si la interfaz los llama «errores», la
  persona va a «arreglar» lo que no estaba roto. Usa siempre **«No se pudo
  previsualizar»**, nunca «error de LaTeX» ni «LaTeX inválido».
- **Lo que más ha roto este proyecto, esto no lo detecta.** El `%` suelto que
  comenta el resto de la línea, un `_` o `&` en prosa, un `\textbf{` sin cerrar:
  todo eso ocurre **fuera** de modo matemático y KaTeX ni lo mira. Dilo junto a
  la vista previa, para no crear una falsa sensación de seguridad.
- La tipografía tampoco es la del PDF final. Orienta; no es una prueba de
  composición.

## 8. Al terminar

Escribe en `claude.md` qué decidiste distinto y por qué, sobre todo si algo de
este encargo resultó inviable al tocar el código. Si el peso vendorizado o el
punto 7 te parecen mal planteados, dilo ahí antes de reescribirlos por tu cuenta.

## 2026-09-14 — Encargo: bibliografía estilo IEEE (`thebibliography` manual)

Rama: `claude/bibliografia-ieee`, creada desde `development`. Es
independiente de la otra rama en curso (`bloque de imagen`): no la toques ni
intentes combinarla aquí.

### Objetivo

Añadir un nuevo tipo de bloque **Bibliografía (IEEE)** que produzca un
entorno `thebibliography` **manual** (sin BibTeX, sin `natbib`, sin la clase
`IEEEtran`): cada referencia es una línea de texto que se convierte en un
`\bibitem`, y el propio `thebibliography` de LaTeX ya numera y encierra entre
corchetes cada entrada — que es exactamente el aspecto que pide el estilo
IEEE. No hace falta ningún paquete nuevo: `thebibliography` es un entorno del
núcleo de LaTeX, así que **no se toca `buildPreamble()`**.

Sigue el mismo patrón que ya usan los tipos existentes: una entrada en la
tabla única de `assets/js/block-types.js` y una rama nueva en el generador.
No se toca `assets/js/app.js`: la interfaz ya es genérica (se guía por
`BLOCK_TYPES`, `acceptsChildren` y `blockLabel`).

### Contrato del bloque

- `id`: `"bibliography"`. `label`: `"Bibliografía (IEEE)"`. `kind`:
  `"bibliography"`. `container: false` (no admite hijos: cualquier bloque
  anidado dentro de `\begin{thebibliography}...\end{thebibliography}` que no
  sea un `\bibitem` produciría LaTeX inválido — el mismo razonamiento que ya
  se usa para `equation`/`math-inline`).
- `content`: **cada línea no vacía es una referencia**, exactamente la misma
  regla que ya usan `itemize`/`enumerate` (`content.split("\n")`, recorta
  cada línea con `.trim()`, descarta las vacías). El texto de cada línea
  llega al `.tex` **literal, sin escapar** — mismo criterio que el resto del
  contenido de bloque (`contentToLatex`, nunca `escapeMetadata`).
- `title` **no se usa** en la salida. No es una omisión: es el mismo criterio
  que ya sigue hoy el tipo `list` (`itemize`/`enumerate` tampoco usan
  `block.title` en `blockToLatex`), así que no es un caso nuevo, es
  consistencia con un patrón que ya existe. El campo de título sigue
  disponible en el formulario porque es común a todos los tipos, pero para
  este bloque no aporta nada al documento — dilo en el README (ver abajo)
  para que no se lea como un olvido.

### Claves de `\bibitem`

Cada entrada necesita una clave. Genera claves automáticas y predecibles
dentro del propio bloque: `ref1`, `ref2`, `ref3`, ... según la posición de la
línea dentro de ese bloque (1-indexado, igual que la numeración visible del
resto de la aplicación).

**Limitación conocida, documéntala en el README, no la resuelvas con más
código:** si el documento tiene más de un bloque de bibliografía, las claves
se repiten entre bloques (`ref1` en el primero y `ref1` otra vez en el
segundo). LaTeX no lo rechaza — es solo una advertencia de etiqueta
duplicada— y esta aplicación no ofrece `\cite{}` en ningún otro bloque, así
que la clave no se referencia desde ningún otro lugar del documento generado.
Resolverlo con claves globalmente únicas es sobre-ingeniería para lo que pide
este encargo; que quede escrito como decisión, no como bug pendiente.

### Salida esperada

Con `content` igual a:

```
Leithold, L. (1992). El cálculo con geometría. México: Harla.
Spivak, M. (1993). Cálculo infinitesimal. México: Reverté.
```

el bloque produce:

```tex
\begin{thebibliography}{9}
\bibitem{ref1} Leithold, L. (1992). El cálculo con geometría. México: Harla.
\bibitem{ref2} Spivak, M. (1993). Cálculo infinitesimal. México: Reverté.
\end{thebibliography}
```

El argumento numérico de `thebibliography` (el `{9}` de arriba) fija el ancho
de la etiqueta más ancha esperada: calcúlalo a partir del número de
entradas, no lo dejes fijo en `9`. Usa tantos dígitos `9` como cifras tenga
`items.length`: 1–9 entradas → `{9}`, 10–99 → `{99}`, etc. (por ejemplo:
`"9".repeat(String(items.length).length)`).

Con `content` vacío o sin líneas no vacías tras recortarlas, el bloque **no
se emite** — mismo criterio que ya sigue `list` cuando no hay ítems (`if
(!items.length) return withChildren("")`, aunque aquí `withChildren` en la
práctica no añade nada porque el tipo no admite hijos; mantenlo de todas
formas por coherencia con el resto del generador).

### Cambios por archivo

1. **`assets/js/block-types.js`**
   - Añade la entrada al final de `BLOCK_TYPES`:
     `{ id: "bibliography", label: "Bibliografía (IEEE)", kind:
     "bibliography", container: false }`.
   - Actualiza el comentario JSDoc de `kind` (línea ~12) para incluir
     `"bibliography"` en la lista de valores posibles, y el comentario sobre
     `container` (línea ~19-23) para que la explicación de qué tipos carecen
     de contenedor mencione también a `bibliography` y por qué.

2. **`assets/js/latex-generator.js`**
   - En `blockToLatex()`, añade una rama `if (type.kind === "bibliography")
     { ... }`. Reutiliza el mismo troceo de líneas que ya usa la rama `list`
     (`content.split("\n").map((line) => line.trim()).filter(Boolean)`) para
     no duplicar una regla que ya existe con otro nombre; no hace falta
     extraerla a una función compartida si el encargo no lo pide, pero sí
     evita reinventar una regex distinta para lo mismo.
   - Arma cada línea como `` `\bibitem{ref${index + 1}} ${item}` `` y únelas
     con `"\n"`; envuélvelas en `\begin{thebibliography}{N}` /
     `\end{thebibliography}` con el `N` calculado como se describió arriba.
   - No toques `buildPreamble()`: este bloque no necesita ningún paquete
     nuevo.

3. **`index.html`**
   - Añade `<option value="bibliography">Bibliografía (IEEE)</option>` como
     última opción del `<select id="block-type">`, en el mismo orden que la
     tabla.

4. **Pruebas**
   - `tests/generator.test.js`: añade `"bibliography"` al final de la lista
     de ids esperada en el test *"la tabla declara los tipos del temario en
     el orden de la interfaz"*. Añade tests nuevos para `blockToLatex` con
     `type: "bibliography"`: dos o más referencias (comprueba las claves
     `ref1`, `ref2`, ... y el `{9}`), una sola referencia, `content` vacío
     (debe devolver cadena vacía), líneas con espacios sueltos que deben
     recortarse, y un caso con 10+ referencias para comprobar que el
     argumento numérico pasa a `{99}`.
   - `tests/block-tree.test.js`: en el test que enumera los tipos sin
     contenedor (línea ~35, `for (const id of ["equation", "math-inline"])
     assert.ok(!acceptsChildren(id), id);`), añade `"bibliography"` a ese
     arreglo.
   - `tests/check-site.mjs`: el bucle final sobre `BLOCK_TYPES` (línea ~55)
     compara `acceptsChildren(type.id)` contra `type.kind !== "equation"`.
     Esa comparación deja de ser válida en cuanto exista un segundo tipo sin
     contenedor. **Cámbiala por `type.container === true`**, que es la fuente
     de verdad real y ya existe en la tabla — así el test sigue siendo
     correcto sin importar cuántos tipos sin contenedor haya. Haz este mismo
     cambio textual aquí (no inventes una variante distinta): la otra rama en
     curso toca la misma línea con el mismo criterio, y así cualquier fusión
     futura entre ambas ramas es trivial.
   - No toques `examples/calculo-3.tex` ni `tests/example-state.mjs`: el
     ejemplo de referencia no necesita un bloque de bibliografía para este
     encargo, y mantenerlo intacto evita arriesgar la prueba byte a byte.

5. **`README.md`**
   - En "Modelo de datos", añade `bibliography` a la lista de tipos del
     contrato conceptual (línea ~27, `type:
     "text|equation|...|enumerate"`).
   - Añade una viñeta nueva junto a las que describen `itemize`/`enumerate`
     explicando el bloque `bibliography`: la regla de una línea por
     referencia, que el contenido llega literal, que `title` no se usa, la
     numeración automática entre corchetes de `thebibliography` (y por qué
     eso ya da el aspecto IEEE sin paquetes adicionales), las claves
     autogeneradas `refN` y su limitación documentada de unicidad solo dentro
     del bloque.
   - Añade una frase breve en la sección "Pruebas automatizadas" mencionando
     la cobertura nueva (varias referencias, una sola, vacío, el ancho del
     argumento numérico, paridad con `index.html`).

### Criterio de aceptación

- `npm test` y `npm run check:js` pasan.
- Un bloque `bibliography` con dos líneas de contenido genera exactamente el
  `thebibliography` documentado arriba, byte a byte, incluidas las claves
  `ref1`/`ref2`.
- El README describe el nuevo tipo con el mismo nivel de detalle que los
  tipos existentes, incluida la limitación de claves repetidas entre
  bloques.
- Commit con mensaje descriptivo y push a `claude/bibliografia-ieee`.

Escribe cualquier duda o desviación de este plan en `claude.md`, no aquí.

---

<!-- Encargo pendiente, sin implementar: traído de claude/bloque-imagen-includegraphics al unificar ramas. -->

## 2026-09-14 — Encargo: bloque de imagen (`\includegraphics`)

Rama: `claude/bloque-imagen-includegraphics`, creada desde `development`. Es
independiente de la otra rama en curso (`bibliografía IEEE`): no la toques ni
intentes combinarla aquí.

### Objetivo

Añadir un nuevo tipo de bloque **Imagen** que produzca una figura LaTeX con
`\includegraphics`, siguiendo exactamente el patrón que ya usan los tipos
existentes: una entrada en la tabla única de `assets/js/block-types.js`, una
rama nueva en el generador y la opción correspondiente en `index.html`. No se
toca `assets/js/app.js`: la interfaz ya es genérica (se guía por
`BLOCK_TYPES`, `acceptsChildren` y `blockLabel`), así que un tipo nuevo no
necesita código propio ahí.

### Contrato del bloque

- `id`: `"image"`. `label`: `"Imagen"`. `kind`: `"image"`. `container: false`
  (no admite hijos, con la misma razón que `equation`/`math-inline`: cualquier
  bloque anidado dentro de `\begin{figure}...\end{figure}` fuera de lugar
  produciría un documento frágil; además una figura es una unidad visual, no
  un contenedor de prosa).
- `content` es la **ruta o nombre del archivo de imagen**, tal como se
  escribió, **sin escapar** — igual que el contenido de cualquier otro
  bloque (`contentToLatex`, sin pasar por `escapeMetadata`). Es responsabilidad
  de quien escribe que la ruta sea válida para Overleaf, igual que ya lo es la
  sintaxis LaTeX dentro de cualquier otro contenido.
- `title` es el **pie de figura** (caption), opcional, y sí se escapa con
  `escapeMetadata()` — va dentro del argumento `\caption{...}`, igual que el
  título de un bloque tipo teorema va dentro de `\begin{...}[...]`.

### Salida esperada

Con contenido y título:

```tex
\begin{figure}[h]
\centering
\includegraphics[width=0.8\textwidth]{ruta/archivo.png}
\caption{Texto del pie de figura}
\end{figure}
```

Sin título (caption vacío tras `.trim()`), se omite la línea `\caption{}`
por completo — no se deja un `\caption{}` vacío:

```tex
\begin{figure}[h]
\centering
\includegraphics[width=0.8\textwidth]{ruta/archivo.png}
\end{figure}
```

Con `content` vacío (tras `.trim()`) el bloque no se emite, igual que una
ecuación vacía — pero si un estado manipulado a mano trae hijos, se emiten
igualmente tras el bloque vacío (usa el mismo `withChildren(...)` que ya usan
`equation`/`math-inline`, no un caso especial nuevo).

El ancho queda **fijo en `0.8\textwidth`**: no se añade ningún campo nuevo a
la interfaz para configurarlo. Es una simplificación deliberada — anótala en
el README (ver más abajo) para que quede documentada como tal, no como un
olvido.

### Cambios por archivo

1. **`assets/js/block-types.js`**
   - Añade la entrada al final de `BLOCK_TYPES`:
     `{ id: "image", label: "Imagen", kind: "image", container: false }`.
   - Actualiza el comentario JSDoc de `kind` (línea ~12) para incluir
     `"image"` en la lista de valores posibles, y el comentario sobre
     `container` (línea ~19-23) para que la explicación de qué tipos carecen
     de contenedor mencione también a `image` y por qué.

2. **`assets/js/latex-generator.js`**
   - En `blockToLatex()`, añade una rama `if (type.kind === "image") { ... }`
     antes o después de la rama `equation` (son primas: ninguna admite
     hijos dentro de su propio cuerpo). Usa `content.trim()` como ruta,
     `escapeMetadata(block.title).trim()` como caption, y arma las líneas con
     `.filter(Boolean).join("\n")` para omitir `\caption{}` cuando esté vacío,
     igual que ya hace `optionalTitle()` con los corchetes. Envuelve el
     resultado con `withChildren(...)`, igual que la rama `equation`.
   - En `buildPreamble()`, añade `\usepackage{graphicx}` con su comentario
     explicativo de una línea (mismo estilo que `amsthm`, `amssymb`, etc.):
     algo como `"% graphicx permite \\includegraphics para insertar imágenes."`
     seguido de `"\\usepackage{graphicx}"`. Colócalo junto a los demás
     `\usepackage`, antes del comentario `"Los entornos siguientes..."`. El
     paquete se incluye **siempre**, se use o no un bloque de imagen — es el
     mismo criterio que ya sigue `amsthm`.

3. **`index.html`**
   - Añade `<option value="image">Imagen</option>` como última opción del
     `<select id="block-type">`, en el mismo orden que la tabla.

4. **Pruebas**
   - `tests/generator.test.js`: añade a la lista de ids esperada en el test
     *"la tabla declara los tipos del temario en el orden de la interfaz"*
     el valor `"image"` al final. Añade tests nuevos para `blockToLatex` con
     `type: "image"`: con caption, sin caption, y con `content` vacío (debe
     devolver cadena vacía, o solo los hijos si el bloque manipulado trae
     alguno). Añade también una aserción de que `buildPreamble()` incluye
     `\usepackage{graphicx}` (puedes extender el test existente sobre el
     documento autocontenido, o añadir uno propio).
   - `tests/block-tree.test.js`: en el test que enumera los tipos sin
     contenedor (línea ~35, `for (const id of ["equation", "math-inline"])
     assert.ok(!acceptsChildren(id), id);`), añade `"image"` a ese arreglo.
   - `tests/check-site.mjs`: el bucle final sobre `BLOCK_TYPES` (línea ~55)
     compara `acceptsChildren(type.id)` contra `type.kind !== "equation"`.
     Esa comparación deja de ser válida en cuanto exista un segundo tipo sin
     contenedor. **Cámbiala por `type.container === true`**, que es la fuente
     de verdad real y ya existe en la tabla — así el test sigue siendo
     correcto sin importar cuántos tipos sin contenedor haya. Haz este mismo
     cambio textual aquí (no inventes una variante distinta): la otra rama en
     curso toca la misma línea con el mismo criterio, y así cualquier fusión
     futura entre ambas ramas es trivial.
   - No toques `examples/calculo-3.tex` ni `tests/example-state.mjs`: el
     ejemplo de referencia no necesita un bloque de imagen para este encargo,
     y mantenerlo intacto evita arriesgar la prueba byte a byte.

5. **`README.md`**
   - En "Modelo de datos", añade `image` a la lista de tipos del contrato
     conceptual (línea ~27, `type: "text|equation|...|enumerate"`).
   - Añade una viñeta nueva junto a las que describen `equation`/`math-inline`
     explicando el bloque `image`: qué va en `content` (ruta, literal, sin
     escapar) y qué va en `title` (pie de figura, escapado), que no admite
     hijos y por qué, y que el ancho queda fijo en `0.8\textwidth` como
     simplificación deliberada de esta primera versión.
   - Documenta que el preámbulo ahora incluye `graphicx` de forma
     incondicional, junto a la explicación de por qué (`\includegraphics`).
   - Añade una frase breve en la sección "Pruebas automatizadas" mencionando
     la cobertura nueva (con/sin caption, contenido vacío, paridad con
     `index.html`).
   - Si te parece natural, añade un bullet a la lista de revisión manual
     (sección "Accesibilidad y diseño") para comprobar a mano que una imagen
     con y sin pie de figura se ve bien en el código generado — es opcional,
     no bloqueante para este encargo.

### Criterio de aceptación

- `npm test` y `npm run check:js` pasan.
- Un bloque `image` con `content: "figuras/grafica.png"` y
  `title: "Gráfica de f"` genera exactamente el bloque `figure` documentado
  arriba, byte a byte.
- El README describe el nuevo tipo con el mismo nivel de detalle que los
  tipos existentes — no un párrafo genérico.
- Commit con mensaje descriptivo y push a `claude/bloque-imagen-includegraphics`.

Escribe cualquier duda o desviación de este plan en `claude.md`, no aquí.
