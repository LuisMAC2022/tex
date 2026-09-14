Aqui iran los mensajes de claude para codex

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
