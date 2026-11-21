<!-- Buzón transitorio. Puede vaciarse en cualquier momento.
     Las reglas permanentes están en PROTOCOLO.md.
     Antes de vaciar: promueve lo durable (invariante → INVARIANTES.md,
     justificación → decisiones/, rasgo del sistema → README.md). -->

# Encargo para Astra — Captura rápida en el editor

De: Claude · Fecha: 2026-11-21 · Rama base: `claude/funcionalidades-en-paralelo`

Implementa seis paquetes que aceleran la entrada de bloques. El análisis, las
mediciones y las decisiones de producto ya están hechos y acordados con la
persona usuaria; tu trabajo es implementarlos sin romper el contrato del
repositorio. Lee el encargo completo antes de escribir código: varias trampas
de un paquete afectan a otro.

---

## 0. Cómo trabajar

1. Lee `PROTOCOLO.md` e `INVARIANTES.md` antes de tocar nada. Son reglas.
2. Crea una rama desde `claude/funcionalidades-en-paralelo` (por ejemplo
   `astra/captura-rapida`), salvo que la persona te indique otra.
3. Implementa los paquetes **en orden** (P1 → P6). Cada paquete termina con
   `npm test` en verde y en uno o varios commits propios. No mezcles paquetes en
   un commit. La documentación de cada cambio va en su mismo commit (tabla
   «Qué se actualiza con qué» de `PROTOCOLO.md`).
4. Si algo de este encargo contradice una invariante, una prueba guardiana o el
   código real, **detente y escribe la duda en `claude.md`**. No resuelvas la
   contradicción reescribiendo una prueba guardiana.
5. Al terminar cada paquete, deja en `claude.md` un informe corto: qué hiciste,
   qué mediste, qué no hiciste y por qué.

## 1. Para quién

Una persona estudiante de Cálculo III que **captura en vivo durante la clase** y
después pasa en limpio con otras notas. Usa teclado **español latinoamericano**
en el salón e **inglés EE. UU.** en casa. Cada función nueva tiene que ser más
rápida que lo que reemplaza y **no estorbar al escribir prosa en español**.

## 2. Diagnóstico medido (Chromium, 1366×768, estado actual)

| Hallazgo | Dato |
| --- | --- |
| Entre «Contenido» y «Añadir bloque» | 19 paradas de Tab (13 son categorías del tablero) y 870 px |
| Atajo para añadir un bloque | no existe |
| Foco después de añadir | «Tipo de bloque», no «Contenido» |
| Intro en «Título del bloque (opcional)» | envía el formulario y genera el documento (envío implícito) |
| Insertar desde el tablero o pulsar Intro en una lista | **borra el historial de deshacer**: `insertIntoField` y `applyListEdit` asignan `field.value`. Comprobado: tras insertar `\alpha`, Ctrl+Z no deshace nada |
| `document.execCommand("insertText")` | conserva Ctrl+Z (comprobado en Chromium); dentro de un manejador de `beforeinput` no dispara un segundo `beforeinput` |
| Añadir un bloque con 60 / 100 bloques con fórmulas ya en el árbol | ~160 / ~220 ms de JS síncrono; sin fórmulas, ~17 ms |
| Memorizar solo `katex.renderToString` | baja a ~140–200 ms: el coste principal es reconstruir el DOM de todas las vistas previas en `renderBlocks()` |
| KaTeX acepta comandos que nuestro preámbulo no define | `\R`, `\N`, `\Z`, `\Reals`, `\argmax`, `\Bbb`… La vista previa muestra ℝ y Overleaf falla con «Undefined control sequence». La comprobación previa no lo detecta |
| Autoguardado | no existe; cerrar la pestaña en clase pierde todo lo no guardado a mano |

## 3. Decisiones ya tomadas (no las reabras)

- El tipo de bloque se cambia escribiendo **comandos `/`** al inicio de un
  bloque vacío: `/def`, `/teo`, `/ec`…
- La persona quiere **ambas** formas de comando personalizado: **alias** que se
  expanden al teclear y **macros** reales con `\newcommand` en el preámbulo.
- La **paleta de comandos sigue fuera** (README, «Quedan expresamente fuera»).
  El menú `/` cubre ese papel dentro del campo.
- Se añade el tipo **Demostración** (`proof`, que `amsthm` ya define).
- **No añadas combinaciones nuevas con Alt+Mayús.** En Windows con dos
  distribuciones instaladas (latinoamericana y EE. UU.), Alt+Mayús puede cambiar
  de distribución a media escritura. El único atajo nuevo con modificador es
  **Ctrl+Intro** (⌘+Intro en macOS).
- No se añade ninguna biblioteca de edición (CodeMirror, Monaco, etc.):
  INV-006 prohíbe dependencias, y DEC-002, los módulos ES. Se sigue con
  `<textarea>` y funciones puras.

## 4. Reglas transversales (valen para todos los paquetes)

- **R1 — Toda edición programática del contenido conserva el deshacer.** Usa la
  función `applyFieldEdit` de P1 en lugar de asignar `field.value`. Solo se
  permite asignar `.value` al **cargar** un bloque (Editar, restaurar) o al
  **vaciar** el formulario, porque ahí reiniciar el historial es correcto.
- **R2 — Los caracteres tecleados se leen en `beforeinput`, no en `keydown`.**
  En la distribución latinoamericana, `\` se escribe con AltGr, que Windows
  reporta como Ctrl+Alt: un `keydown` con `event.key === "\\"` llega con
  `ctrlKey` y `altKey` activos. Reacciona solo a
  `inputType === "insertText"` con `event.data` de **un solo carácter**. Las
  teclas de navegación (↑ ↓ Intro Tab Escape Retroceso) sí van en `keydown`.
- **R3 — Composición y teclas muertas.** Ignora todo evento con
  `isComposing === true` o `inputType === "insertCompositionText"`. Las tildes
  (`á`, `é`) son teclas muertas en la distribución latinoamericana y `^` puede
  serlo: si `event.data` trae más de un carácter (por ejemplo `"^2"`), no hagas
  nada. Ignora también `insertFromPaste`, `insertReplacementText` (corrector) y
  `insertFromDrop`.
- **R4 — Orden de los manejadores.** El manejador de listas (sección [C] de
  `app.js`) consume Intro en «Contenido» y se registró antes que cualquier
  sección nueva. Registra el teclado del asistente **en fase de captura sobre el
  `fieldset` del editor** (`addEventListener("keydown", h, true)`) para que
  corra primero, y llama a `preventDefault()` cuando consumas una tecla. Los
  manejadores existentes ya comprueban `event.defaultPrevented`.
- **R5 — Lógica pura y probada sin DOM** (DEC-007). Cada regla de edición es
  una función pura `{ value, selectionStart, selectionEnd } → edición | null`,
  con pruebas en `tests/`. `app.js` solo conecta eventos.
- **R6 — Scripts clásicos.** Cada archivo nuevo se añade a `index.html`, a la
  lista esperada de `tests/check-site.mjs` (mensaje «faltan scripts o el orden
  de carga es incorrecto») y a `check:js` en `package.json`, en el orden de
  dependencias. Para probarlo, pásalo en la lista de archivos de
  `loadTexNotes([...])`.
- **R7 — Solo en «Contenido».** El autocierre, las sugerencias, los alias y los
  comandos `/` actúan únicamente en `#block-content`. El título del bloque y los
  metadatos se escapan por completo (INV-003): un `\mathbb{R}` insertado allí
  saldría como texto literal.
- **R8 — El contenido sigue siendo literal** (INV-002). Todo ocurre mientras se
  teclea; ninguna función de generación transforma `content`.
- **R9 — Almacenamiento local.** Claves nuevas con versión (`…:v1`); cada
  lectura y escritura dentro de `try/catch`; la app funciona sin
  almacenamiento.
- **R10 — Accesibilidad.** Los anuncios van a `#app-status`. Ninguna tecla
  atrapa el foco: si no hay nada que completar, Tab sale del campo como
  siempre.
- **R11 — Sin texto ajeno en la interfaz.** Las cadenas visibles están en
  español y se escriben con el estilo actual. Todo rótulo citado en
  `docs/guia-de-uso.md` entre «…» debe existir en `index.html` o `app.js`
  (`tests/documentacion.test.js`).

---

## P1 — Captura sin fricción

**Objetivo:** escribir varios bloques seguidos sin ratón ni desplazamiento,
sin perder el deshacer y sin perder trabajo si se cierra la pestaña.

### P1.1 Ediciones que conservan el deshacer (`text-insertion.js`)

- `diffEdit(oldValue, newValue)` (pura): devuelve `{ start, end, text }`, el
  reemplazo mínimo de prefijo y sufijo comunes, o `null` si no hay cambio. No
  partas un par sustituto UTF-16: si un límite cae entre un sustituto alto y
  uno bajo, retrocede el inicio o avanza el final un índice.
- `applyFieldEdit(field, { value, selectionStart, selectionEnd, selectionDirection })`:
  enfoca, selecciona `[start, end]` y ejecuta
  `document.execCommand("insertText", false, text)`, o `"delete"` si
  `text === ""`. Si `execCommand` devuelve `false` o lanza una excepción,
  recurre a `field.setRangeText(text, start, end, "end")` y despacha
  `new Event("input", { bubbles: true })`. Al final aplica la selección pedida.
- Usa una bandera de reentrada (`applying = true` mientras dure) y exponla, para
  que los manejadores de `input` del asistente ignoren las ediciones propias.
- Sustituye las asignaciones `field.value = …` de `insertIntoField` y de
  `applyListEdit`. No toques las de «Editar», restaurar ni `clearBlockFields`.
- Pruebas de `diffEdit`: sin cambio, inserción, borrado, reemplazo, inserción al
  inicio y al final, y un texto con `𝔸` en el límite.

### P1.2 Ctrl+Intro añade o guarda

- En `shortcuts.js` añade
  `{ id: "block.commit", code: "Enter", ctrl: true, alt: false, shift: false, meta: false, mod: true, scope: "block-editor", label: "Añadir el bloque o guardar los cambios" }`.
  `mod: true` significa que **en macOS ⌘ sustituye a Ctrl**. Declara la
  entrada con `ctrl: true` para que las reglas actuales de
  `tests/shortcuts.test.js` sigan siendo válidas.
- Amplía `matchShortcut(event, scope, isMac = false)`: con `mod` e `isMac`, exige
  `metaKey` en lugar de `ctrlKey`. Amplía también `shortcutLabel` (⌘ en macOS) y
  `ariaKeyshortcuts`: devuelve `"Control+Enter"`, o `"Meta+Enter"` en macOS.
  El tercer parámetro es opcional, así que las llamadas existentes no cambian.
- El manejador va en el `keydown` del `fieldset` del editor, el mismo que ya
  atiende `symbols.toggle`. Funciona desde el tipo, el título, el contenido, los
  campos de imagen y el tablero. Cierra cualquier menú abierto y ejecuta la
  acción de «Añadir bloque».
- Pruebas: coincide con Ctrl sin macOS y con ⌘ en macOS; no coincide con AltGr
  (`getModifierState("AltGraph")`) ni con Alt añadido.

### P1.3 Foco después de añadir y envío implícito

- Después de añadir, el foco va a `#block-content`. Si el tipo es imagen, va a
  `#image-path`, porque «Contenido» está oculto. El tipo se conserva como ya
  ocurre. Después de «Guardar cambios», el comportamiento actual no cambia.
- Intro en `#block-title` mueve el foco a «Contenido» y **no** envía el
  formulario. Intro en los campos de texto y número de la imagen no hace nada
  (`preventDefault`). Los metadatos no cambian.

### P1.4 Orden del editor

- Mueve la fila de botones de «Añadir bloque», «Pegar bloque» y «Cancelar
  edición» justo después de los campos de imagen (`#image-fields`) y antes de
  la vista previa y del tablero. En los bloques que no son imagen, esos campos
  están ocultos y el botón queda justo debajo de «Contenido». Conserva los ids.
- Pon `#block-help` dentro de `<details class="field-help">` con el rótulo
  `<summary>Ayuda del contenido</summary>`, plegado por defecto. Conserva
  intacto el elemento `<small id="block-help">` y su texto, que
  `tests/check-site.mjs` busca con una expresión regular. `aria-describedby`
  sigue funcionando con el contenido plegado.
- Resultado esperado: una sola tabulación de «Contenido» a «Añadir bloque»
  (dos si están visibles las herramientas de lista).

### P1.5 Rendimiento de la estructura

- En `renderBlockPreview`, cuando `context.structure` es verdadero, guarda en
  caché el resultado ya dibujado. Clave:
  `JSON.stringify([type, listFormat, content, depthKey, previewVersion])`.
  `depthKey` es el contexto de profundidad de lista que hoy calcula
  `listDepthForPath(parentPath)`, **no la ruta**.
  `previewVersion` es un contador que P5 incrementa al cambiar las macros.
- Si hay acierto, haz `container.replaceChildren(nodo.cloneNode(true))`. Clonar
  nodos es mucho más barato que volver a parsear el HTML de KaTeX. Guarda
  también el `analysis` que devuelve la función.
- No uses la caché con imágenes: dependen de `imagePreviews` y de URL de
  objeto.
- Límite de 1000 entradas; al superarlo, vacía la caché.
- **Objetivo: ≤ 60 ms de JS** al añadir un bloque con 100 bloques con fórmulas.
  Mide antes y después con el script del anexo A y pon ambas cifras en el
  informe.

### P1.6 Autoguardado de la sesión

- Clave nueva `tex-notes:autosave:v1`, **distinta** de la del borrador
  explícito.
- Contenido:
  `{ version: DRAFT_VERSION, savedAt, metadata, blocks, macros, editor: { type, title, content, editingPath, parentPath, image } }`.
  `macros` entra en P5 y `image` es lo que devuelve el gancho de lectura de
  imagen. Lo más valioso en clase es **el bloque a medio escribir**.
- Momentos de guardado:
  - al final de `renderBlocks()`;
  - con `input` y `change` del formulario, con un retardo de 800 ms;
  - inmediatamente con `visibilitychange` (pestaña oculta) y con `pagehide`.
- **No guardes una sesión vacía**: sin bloques, con «Contenido» vacío y con el
  título vacío. El curso, el profesor y la fecha precargados no cuentan como
  contenido. Si lo hicieras, abrir la página borraría la sesión anterior.
- Al cargar, si existe una sesión con contenido, muestra
  `<p id="autosave-banner">` con el texto «Hay una sesión sin guardar del
  {fecha y hora} con {N} bloques.» y dos botones: «Recuperar sesión» y
  «Descartar». No la restaures sola.
- Antes de que la sesión nueva sobrescriba la anterior por primera vez, copia la
  anterior a `tex-notes:autosave:previous`. Es un nivel de respaldo.
- «Recuperar sesión» pasa los datos por `normalizeDraft` y restaura los campos
  del editor. Si `editingPath` ya no existe, el contenido se carga como bloque
  nuevo en `parentPath`, o en la raíz si tampoco existe.
- Un error de cuota se anuncia una sola vez por sesión. No toques «Guardar
  borrador», «Restaurar borrador» ni sus claves.

---

## P2 — Autocierre y contexto matemático

**Objetivo:** que las llaves, los delimitadores y los entornos se cierren solos
sin estorbar en la prosa.

### P2.1 `mathContextAt(content, index, typeId)` en `math-preview.js` (pura)

- Devuelve `"math"`, `"text"` o `"comment"` según la posición `index`.
- Los tipos con `kind: "equation"` devuelven siempre `"math"`.
- En los demás, recorre `[0, index)`:
  - Un `%` sin escapar abre un comentario hasta el fin de línea.
  - Considera los delimitadores sin escapar (`$$`, `$`, `\(`, `\)`, `\[`, `\]`)
    y `\begin{…}`/`\end{…}` de los entornos matemáticos.
  - **Un delimitador abierto y no cerrado antes de `index` cuenta como abierto**.
    `mathSegments` lo descarta; aquí no hay que descartarlo.
  - Dentro de matemáticas, el argumento de `\text{…}`, `\textbf{…}`,
    `\textit{…}`, `\mbox{…}` y `\emph{…}` es `"text"`. Lleva la cuenta de la
    profundidad de llaves.
- Exporta `isEscaped`.
- Mueve la lista `MATH_ENVIRONMENTS` de `content-check.js` a `math-preview.js`
  como `TexNotes.MATH_ENVIRONMENTS` y haz que `content-check.js` la reutilice.
  Debe existir **una sola lista**.

Pruebas mínimas (`|` marca `index`):

| Contenido | Tipo | Esperado |
| --- | --- | --- |
| `Sea $x\|` | text | math |
| `Sea $x$ y\|` | text | text |
| `Cuesta 5\$ y (\|` | text | text |
| `$\text{si \|}x$` | text | text |
| `\begin{align} a\|` | text | math |
| `% $x\|` | text | comment |
| `\\(\|` (salto de línea `\\` seguido de `(`) | text | text |
| `\(x\|` | text | math |
| cualquier posición | equation | math |

### P2.2 `autoPair(state, data, { mode, pending })` (pura, archivo nuevo `editing-assist.js`)

Devuelve `{ edit, pending }` o `null`. `|` marca el cursor.

| Tecleado | Condición | Resultado |
| --- | --- | --- |
| `{` | cualquier modo salvo comentario | `{\|}` |
| `{` tras `\` sin escapar | cualquier modo | `\{\|\}` |
| `{` tras `\left\` | math | `\left\{\|\right\}` |
| `(` o `[` | math | `(\|)` · `[\|]` |
| `(` o `[` tras `\left` | math | `\left(\|\right)` · `\left[\|\right]` |
| `\|` tras `\left` | math | `\left\|\|\right\|` |
| `(` o `[` tras `\` sin escapar | text | `\(\|\)` · `\[\|\]` |
| `$` sin escapar | text | `$\|$` |
| `$` dentro de un par `$\|$` vacío y pendiente | — | `$$\|$$` |
| `^` o `_` | math | `^{\|}` · `_{\|}` |
| `{` justo después de un `^{` o `_{` automático vacío | — | no inserta nada: la llave ya está |
| `{`, `$` (text), `(` o `[` (math) con texto seleccionado | — | envuelve la selección |
| el carácter de cierre pendiente que está justo tras el cursor | — | salta el cierre |

- **Solo cierra si el carácter siguiente** es el final del texto, un espacio o
  uno de `)]}$,.;:`. Así, escribir `$` delante de una palabra existente no
  produce `$$palabra`.
- `\\[2pt]`: las dos barras se escapan entre sí, así que el `[` no va precedido
  de una barra sin escapar. En texto no se cierra; en matemáticas se cierra como
  corchete normal y el `]` tecleado lo salta. Escribe esta prueba.
- `{}- ` es la sintaxis del guion literal en las listas. Con el autocierre,
  `{` produce `{|}`, `}` lo salta y luego `- `. Escribe esta prueba.
- **Cierres pendientes:** guárdalos como **distancia al final** del texto
  (`value.length - posición`). Lo que se escribe dentro del par no altera esa
  distancia. Antes de usar un cierre pendiente, comprueba que el carácter en esa
  posición sigue siendo el esperado; si no, descártalo. Vacía la lista cuando el
  cursor sale del par más interno, al perder el foco y al cargar otro bloque.
- **Retroceso** sin modificadores y sin selección, entre un par vacío y
  pendiente: borra los dos caracteres en una sola edición. Hazlo en `keydown`.
- **`\begin{nombre}` + Intro:** si la línea termina antes del cursor en
  `\begin{nombre}`, con argumentos opcionales `[…]` o `{…}`, y en todo el
  contenido hay más `\begin{nombre}` que `\end{nombre}`, inserta
  `\n\n\end{nombre}` y deja el cursor en la línea vacía del medio, sin añadir
  sangría. **No lo hagas en los bloques de lista ni de bibliografía**: allí cada
  línea es un elemento. Tiene prioridad sobre la continuación de listas, por
  R4.
- Preferencia «Cerrar automáticamente llaves y delimitadores»: casilla activada
  por defecto, guardada en `tex-notes:prefs:v1`. Desactivada, no hay autocierre
  ni `^{}`.
- Conexión: `beforeinput` en `#block-content` (R2, R3). Si hay una regla
  aplicable, `preventDefault()` + `applyFieldEdit`.
- Prueba cada fila de la tabla, las dos trampas anteriores y las condiciones de
  no cierre.

---

## P3 — Sugerencias al escribir `\`, huecos y alias

**Objetivo:** que los comandos frecuentes se escriban en dos o tres
pulsaciones y que los recientes aparezcan donde se escribe.

### P3.1 Sintaxis de huecos: `parseSnippet(text)` (pura, `editing-assist.js`)

- Los marcadores `#1`…`#9` son huecos en orden numérico y `#0` es la posición
  final. `\#` es un `#` literal, no un marcador.
- Sin marcadores: cada `{}` **vacío** es un hueco, en orden, y el final es el
  extremo del texto.
- Devuelve `{ text, holes: [índices], final }`.
- Una entrada del catálogo con `insert: { before, after }` equivale a
  `before + "#1" + after`.

### P3.2 Sesión de huecos

- Tras insertar un fragmento con huecos, el cursor va al primero.
- Tab salta al siguiente; tras el último, va a `final` y la sesión termina.
- Escape termina la sesión sin mover el cursor.
- Guarda los huecos como **distancia al final** del texto, igual que los
  cierres. Escribir en un hueco no desplaza los siguientes.
- Termina la sesión si el cursor sale del tramo del fragmento.

### P3.3 Motor de sugerencias (archivo nuevo `completion.js`, puro)

- Fuentes con la forma
  `{ key, kind, trigger, insert, label, detail, mode }`:
  - los símbolos de `MATH_SYMBOLS`, con modo `"math"` salvo el grupo
    `structure`, que es `"any"`;
  - las macros del documento (P5);
  - una lista corta `TEXT_COMMANDS`: `\textbf{}`, `\textit{}`, `\emph{}`,
    `\underline{}`, `\quad`, `\qquad`, `\label{}`, `\ref{}`;
  - los nombres de entorno para `\begin{`, a partir de
    `TexNotes.MATH_ENVIRONMENTS` más `center`.
- `rankCompletions(query, entries, usage, now, mode)`:
  - Normaliza los acentos (NFD y quitar las marcas) en la consulta y en las
    palabras clave.
  - Orden: prefijo exacto del comando > subcadena del comando > prefijo de una
    palabra clave en español > subcadena de una palabra clave.
  - Los empates se ordenan por la puntuación de uso y después por el orden del
    catálogo. Devuelve como máximo 8.
  - Es determinista: `now` se inyecta.
  - Escribe las pruebas con datos reales del catálogo, por ejemplo `fr` →
    primero `\frac`.
- Registro de uso en `tex-notes:usage:v1`, con la forma `{ [key]: { n, t } }`:
  - máximo 300 entradas; al superarlo, se descartan las de menor puntuación;
  - puntuación = `n / (1 + díasDesdeÚltimoUso / 7)`;
  - claves: `symbol:<id>`, `macro:<nombre>`, `alias:<disparador>`,
    `type:<id>`, `template:<id>`;
  - se registra al insertar desde el tablero, aceptar una sugerencia, expandir
    un alias, usar un comando `/` y aplicar una plantilla.
- No cambies la clave ni el formato de «Recientes» del tablero
  (`tex-notes:recent-symbols`).

### P3.4 Menú de sugerencias (componente único en `app.js`, sección nueva [F])

- **Un solo componente**, que P4 reutiliza para el menú `/`.
- Se abre después de un `input` propio de la persona (no de `applyFieldEdit`)
  cuando el texto antes del cursor termina en una barra sin escapar seguida de
  **al menos una letra**:
  `/(?:^|[^\\])(?:\\\\)*\\([A-Za-z]+)$/`. No se abre en un comentario.
  Escribir `\\` no lo abre.
- Teclas en `keydown`, fase de captura:
  - ↓ y ↑ mueven la opción activa de forma circular;
  - Intro y Tab aceptan;
  - Escape cierra con `stopPropagation()`.
- Se cierra al perder el foco, al teclear un carácter que no es letra (que se
  inserta normalmente), si el cursor sale del token y al pulsar Alt+Mayús+S.
- Ratón y táctil: `pointerdown` con `preventDefault()` en una opción la acepta
  sin quitar el foco al campo. En el teléfono no hay Tab.
- **Al aceptar en modo `"text"` un candidato de modo `"math"`**, envuélvelo en
  `$…$`: `\alpha` escrito en prosa queda `$\alpha|$`, con el `$` final
  registrado como cierre pendiente. Así no se produce el error «Missing $
  inserted».
- Los candidatos con huecos inician una sesión de huecos (P3.2).
- ARIA:
  - `<ul role="listbox" id="assist-list">` con elementos `<li role="option">` y
    un id cada uno;
  - mientras está abierto, `#block-content` lleva `aria-autocomplete="list"`,
    `aria-controls="assist-list"` y `aria-activedescendant`;
  - quítalos al cerrar y **no** pongas `aria-expanded` en el `textarea`;
  - al abrir, anuncia una sola vez «N sugerencias» en `#app-status`.
- Posición: bajo el cursor, con la técnica del div espejo (copia los estilos del
  `textarea` y mide un `<span>` en la posición del cursor), recortada al
  viewport. Con menos de 38 rem de ancho, a todo el ancho bajo el campo.
- Sin colores literales fuera de `:root`. `tests/check-site.mjs` lo exige y el
  tema oscuro tiene que redefinir los tokens nuevos.

### P3.5 Alias

- Forma: `{ trigger, expansion, mode }`, guardados en `tex-notes:aliases:v1`.
- Se expanden **solo con Tab**, nunca solos. El disparador es la secuencia
  `[\p{L}\p{N}]+` (con la bandera `u`) inmediatamente anterior al cursor. Debe
  ir al principio, tras un espacio o tras un signo que no sea letra, número ni
  `\`.
- Usar `\p{L}` en lugar de `[A-Za-z]` es lo que impide que «lím» active el alias
  `lim`.
- Si el alias es de modo `"math"` y el cursor está en prosa, envuelve el
  resultado en `$…$`, como en P3.4.
- **Prioridad de Tab en «Contenido»** (DEC-015, ver §7):
  1. aceptar la sugerencia abierta;
  2. saltar al siguiente hueco;
  3. saltar tras un cierre pendiente que esté justo después del cursor (solo
     espacios en medio);
  4. expandir un alias;
  5. Tab nativo.
  Es una excepción acotada a DEC-009, que deja Tab nativo.
- Ctrl+Z después de una expansión devuelve el disparador escrito
  (`applyFieldEdit`).

Alias predeterminados (prueba que ninguno coincida con una palabra corta del
español: `a al de del el en es ex la las lo los no o para por que se si sin su un una y ya`):

Todos son de modo `"math"`:

- `RR` → `\mathbb{R}`, `NN` → `\mathbb{N}`, `ZZ` → `\mathbb{Z}`,
  `QQ` → `\mathbb{Q}`, `CC` → `\mathbb{C}`
- `imp` → `\Rightarrow`, `sii` → `\Leftrightarrow`
- `pt` → `\forall`, `exi` → `\exists`
- `fr` → `\frac{#1}{#2}#0`
- `pd` → `\frac{\partial #1}{\partial #2}#0`
- `lim` → `\lim_{#1 \to #2} #0`
- `int` → `\int_{#1}^{#2} #3 \, d#4`, `iint` → `\iint_{#1} #2 \, dA`
- `sum` → `\sum_{#1}^{#2} #0`
- `nab` → `\nabla`, `eps` → `\varepsilon`, `ra` → `\to`
- `vec` → `\mathbf{#1}#0`
- `abs` → `\left| #1 \right|#0`
- `norm` → `\left\| #1 \right\|#0`

### P3.6 «Preferencias de escritura»

Es una sección nueva, después de «Resultado», con `<details>`.

- Casilla del autocierre (P2).
- «Mis alias»: tabla para añadir, editar y borrar, y el botón «Restablecer
  alias predeterminados».
- `validateAlias` (pura) exige:
  - disparador `^[\p{L}\p{N}]{2,12}$`u, único;
  - que el disparador no coincida con ninguna palabra corta de la lista;
  - expansión no vacía y con marcadores válidos.
- «Exportar configuración» descarga `notas-latex-configuracion.json` con
  `{ kind: "notas-latex-config", version: 1, aliases, templates, prefs, macros }`.
  `templates` llega con P4 y `macros` con P5. La persona usa máquinas distintas
  en el salón y en casa, y el almacenamiento local no viaja entre ellas.
- «Importar configuración» lee un `<input type="file">`, valida todo antes de
  aplicar y pide confirmación para reemplazar.

---

## P4 — Comandos `/`, Demostración y plantillas

### P4.1 Tipo Demostración

- Entrada en `BLOCK_TYPES`:
  `{ id: "proof", label: "Demostración", kind: "theorem", environment: "proof", heading: "Demostración", style: "plain", predefined: true, container: true }`.
  Colócala después de `proposition`. Añade su `<option>` en el mismo lugar de
  `index.html`, porque la prueba compara el orden.
- `buildTheoremDefs()` debe omitir los tipos `predefined`. `amsthm` ya define
  `proof` y `\newtheorem{proof}` fallaría en Overleaf con «Command \proof
  already defined».
- Actualiza el **cuerpo** de la prueba «el preámbulo deriva un \newtheorem por
  cada tipo declarado» para que filtre `!type.predefined`. **No cambies su
  nombre**: es el guardián literal de INV-005.
- Añade una prueba: `proof` produce `\begin{proof}[Título]…\end{proof}` y el
  preámbulo no contiene `\newtheorem{proof}`. `babel` en español ya traduce el
  encabezado como «Demostración».
- Con título, el título **sustituye** a «Demostración» en el PDF. Dilo en la
  ayuda.
- Cambiar la tabla altera el ancla de DEC-005 (`tramo:14` → `tramo:15`, más el
  campo `slash` de P4.2). Actualiza el comentario `@decision` para mencionar
  `predefined` y `slash`, ejecuta `npm run bendecir` y dilo en el commit.
- `examples/calculo-3.tex` **no debe cambiar**. Si cambia, hay un error.

### P4.2 Comandos `/`

- En `BLOCK_TYPES`, añade a cada tipo `slash: [...]`, que es la fuente única de
  verdad (DEC-005):

| Tipo | Comandos |
| --- | --- |
| text | `/txt`, `/texto` |
| equation | `/ec` |
| math-inline | `/el` |
| definition | `/def` |
| theorem | `/teo` |
| proposition | `/prop` |
| proof | `/dem` |
| example | `/ej` |
| note | `/nota` |
| itemize | `/lista`, `/vi` |
| enumerate | `/enum`, `/num` |
| bibliography | `/bib` |
| image | `/img` |

  La comparación ignora acentos: `/definición` funciona.
- El menú se abre cuando `/` se teclea en la posición 0 con «Contenido»
  **vacío**. Muestra primero los tipos y luego las plantillas (P4.3), filtrados
  por las letras escritas.
- `/teo Fubini`: tras el primer espacio, el resto de la línea es el título.
  Intro o Tab aplica; Escape cierra y deja el texto tal cual. Si la palabra no
  coincide con ningún comando al teclear el espacio, el menú se cierra.
- Al aplicar:
  - cambia `#block-type` y **despacha `new Event("change", { bubbles: true })`**.
    Asignar `.value` por código no dispara `change`; sin él no se muestran los
    campos de imagen, la vista previa queda vieja y no aparecen las
    herramientas de lista;
  - pon el título si se escribió uno y vacía «Contenido» con `applyFieldEdit`;
  - si el tipo es imagen, el foco va a `#image-path`, porque «Contenido» queda
    oculto; si no, a «Contenido»;
  - anuncia «Tipo: Teorema. Título: Fubini.».
- Con el menú `/` abierto no hay autocierre ni sugerencias.

### P4.3 Plantillas

- **Modelo:**
  `{ id, name, trigger, steps: [{ depth, block: { type, title, content, listFormat?, options? } }] }`.
  `depth` es relativo al destino. Un paso de profundidad `d + 1` va **dentro**
  del último paso de profundidad `d`. El contenido admite huecos (P3.1).
- **Validación** (`validateTemplate`, pura):
  - la primera profundidad es 0;
  - la profundidad sube como mucho 1 por paso;
  - el padre de cada paso con `depth > 0` acepta hijos (`acceptsChildren`);
  - los tipos existen;
  - el disparador cumple `^[a-z0-9]{2,16}$` y es único entre plantillas y
    comandos de tipo.
- **Aplicación como cola:**
  - Elegir una plantilla en el menú `/` carga el paso 1 en el editor (tipo,
    título y contenido sin marcadores) e inicia la sesión de huecos.
  - Cada Ctrl+Intro añade el paso actual y carga el siguiente.
  - El padre de cada paso sale de una pila con las rutas devueltas por
    `insertBlock`: profundidad 0 = destino actual; `d` = ruta del último paso
    de profundidad `d - 1`.
  - Un aviso `<p id="template-progress">` muestra «Plantilla «Nombre»: paso 1
    de 3 · Siguiente: Demostración», con dos botones: «Omitir paso» y
    «Cancelar plantilla».
- **Cualquier cambio estructural cancela la plantilla y se anuncia**: eliminar,
  mover, duplicar, pegar o restaurar. Las rutas guardadas dejarían de valer;
  sigue el mismo criterio que `cancelEditForStructuralChange`.
- **Plantillas incluidas** (archivo nuevo `templates.js`). Solo pueden usar
  comandos de `amsmath` y `amssymb`. Prueba que cada fórmula se renderiza en
  KaTeX dentro del `vm`, como hace `tests/symbols.test.js`, y que `checkBlock`
  no devuelve errores sobre cada paso una vez quitados los marcadores:

  Cada paso se escribe como «profundidad · tipo · contenido». En JavaScript,
  cada `\` se escribe `\\`.

  - `teodem` — «Teorema con demostración»
    - 0 · theorem · `#1`
    - 0 · proof · `#1`
    - Son hermanas. Una demostración **dentro** del teorema quedaría dentro de
      `\begin{theorem}`.
  - `ejres` — «Ejemplo resuelto»
    - 0 · example · `#1`
    - 1 · text · `\textit{Solución.} #1`
    - 1 · equation · `#1`
  - `limite` — «Límite (ε-δ)»
    - 0 · definition, título «Límite de una función real de un vector»:
      `Sea $f: D \subseteq \mathbb{R}^n \to \mathbb{R}$ y $\mathbf{a}$ un punto de acumulación de $D$. Decimos que $\lim_{\mathbf{x} \to \mathbf{a}} f(\mathbf{x}) = L$ si para todo $\varepsilon > 0$ existe $\delta > 0$ tal que, si $\mathbf{x} \in D$ y $0 < \|\mathbf{x} - \mathbf{a}\| < \delta$, entonces $|f(\mathbf{x}) - L| < \varepsilon$.`
  - `parcial` — «Derivada parcial»
    - 0 · definition, título «Derivada parcial»:
      `La derivada parcial de $f$ respecto de $x$ en $(a,b)$ es`
    - 1 · equation ·
      `\frac{\partial f}{\partial x}(a,b) = \lim_{h \to 0} \frac{f(a+h,b) - f(a,b)}{h}`
  - `grad` — «Gradiente y derivada direccional»
    - 0 · equation ·
      `\nabla f(a,b) = \left( \frac{\partial f}{\partial x}(a,b), \frac{\partial f}{\partial y}(a,b) \right)`
    - 0 · equation ·
      `D_{\mathbf{u}} f(a,b) = \nabla f(a,b) \cdot \mathbf{u}, \qquad \|\mathbf{u}\| = 1`
  - `lagrange` — «Multiplicadores de Lagrange»
    - 0 · text ·
      `Para optimizar $f(x,y)$ sujeta a $g(x,y) = k$ resolvemos el sistema`
    - 0 · equation ·
      `\begin{cases} \nabla f(x,y) = \lambda \nabla g(x,y) \\ g(x,y) = k \end{cases}`
  - `fubini` — «Integral iterada»
    - 0 · equation ·
      `\iint_R f(x,y)\,dA = \int_{#1}^{#2} \int_{#3}^{#4} f(x,y)\,dy\,dx`
  - `polares` — «Coordenadas polares»
    - 0 · equation ·
      `\iint_D f(x,y)\,dA = \int_{\alpha}^{\beta} \int_{r_1(\theta)}^{r_2(\theta)} f(r\cos\theta, r\sin\theta)\, r\,dr\,d\theta`
  - `esfericas` — «Coordenadas esféricas»
    - 0 · equation ·
      `\iiint_E f\,dV = \iiint f(\rho\sin\varphi\cos\theta, \rho\sin\varphi\sin\theta, \rho\cos\varphi)\,\rho^2\sin\varphi\,d\rho\,d\varphi\,d\theta`
  - `taylor` — «Taylor de orden 2 en dos variables»
    - 0 · equation ·
      `f(a+h,b+k) \approx f(a,b) + f_x(a,b)\,h + f_y(a,b)\,k + \frac{1}{2}\left( f_{xx}(a,b)\,h^2 + 2 f_{xy}(a,b)\,hk + f_{yy}(a,b)\,k^2 \right)`
  - `preclase` — «Pregunta pre-clase»
    - 0 · text, título «Pregunta»: `#1`
    - 1 · text · `\textbf{Respuesta.} #1`
- **Plantillas propias:** añade la acción «Guardar como plantilla» a cada
  bloque. Abre un `<dialog>`, como «Mover a…», con dos campos: «Nombre de la
  plantilla» y «Comando». Recorre la rama en preorden con su profundidad y la
  guarda en `tex-notes:templates:v1`. Las imágenes conservan sus `options`.
  Gestión desde «Preferencias de escritura»: lista con renombrar y borrar.
  Entran en la exportación de configuración.

---

## P5 — Macros del documento

**Objetivo:** escribir `\R` en el contenido y que el `.tex` lo defina.

- **Modelo:** `state.macros = [{ name: "R", params: 0, body: "\\mathbb{R}" }]`.
  Pertenecen **al documento**: van en el borrador y en el autoguardado.
- **Borrador v3:**
  - `DRAFT_VERSION = 3`;
  - `normalizeDraft` devuelve también `macros`, con una normalización
    estructural: nombre `^[A-Za-z]+$`, `params` entero de 0 a 9 y `body` de tipo
    cadena; descarta las entradas inválidas;
  - un borrador v1 o v2 se migra con `macros: []`;
  - un borrador v4 sigue devolviendo `null`, como hoy, y una versión antigua de
    la app rechaza el v3 en lugar de perder sus macros en silencio.
  - Pruebas: un borrador v2 se restaura con `[]`, un v3 hace el viaje de ida y
    vuelta y un v4 da `null`.
- **Generación:**
  - en `latex-generator.js`, `buildPreamble(macros = [])` y
    `generateLatex(state)` pasan `state.macros`;
  - las macros se insertan después de `\usepackage{graphicx}` y antes de «% Los
    entornos siguientes…»:
    ```tex
    % Macros personales definidas en el editor.
    \newcommand{\R}{\mathbb{R}}
    \newcommand{\abs}[1]{\left|#1\right|}
    ```
  - sin macros no se emite nada, así que el ejemplo de referencia no cambia
    (INV-008);
  - el cuerpo es literal y sin escapes, por el mismo criterio que el contenido
    (DEC-004);
  - se usa `\newcommand`, que falla con un error visible si el nombre ya existe,
    y **no** `\providecommand`, que no haría nada en silencio.
  - Pon `macrosToPreamble` dentro de `latex-generator.js`, no en otro archivo:
    `tests/load-app.mjs` carga el generador sin los módulos de interfaz.
- **Validación** (`macros.js`, pura; `validateMacro(macro, existing)`):
  - nombre `^[A-Za-z]+$`, único y no reservado;
  - `params` entre 0 y 9;
  - cuerpo no vacío, en una sola línea y con llaves equilibradas, teniendo en
    cuenta los escapes;
  - todo `#` sin escapar va seguido de un dígito entre 1 y `params`; `##` no se
    permite.
  - Los mensajes van en español y nombran el problema, por ejemplo: «\S ya
    existe en LaTeX (signo de sección). Elige otro nombre.».
- **Nombres reservados:**
  - todos los comandos que aparecen en `MATH_SYMBOLS` (extráelos de `command` e
    `insert.before`);
  - una lista `LATEX_RESERVED`: `b c d H i j k l L o O P r S t u v aa AA ae AE oe OE ss dag ddag`,
    `begin end item par label ref caption section subsection newcommand renewcommand providecommand def let relax input include usepackage documentclass maketitle title author date`,
    `text textbf textit emph mathbb mathbf mathrm mathcal frac sqrt left right`,
    `sin cos tan cot sec csc log ln exp lim sup inf max min det dim ker deg arg gcd Pr hom`;
  - los entornos de `BLOCK_TYPES`, que `\newtheorem` y `amsthm` ya definen como
    comandos.
- **KaTeX:**
  - pasa `macros` a `katex.renderToString` en `katexRender`;
  - **crea un objeto nuevo en cada llamada**: KaTeX modifica el objeto de macros
    cuando el contenido usa `\gdef`;
  - al cambiar las macros, incrementa `previewVersion` (P1.5) y vuelve a dibujar
    la estructura y la vista previa del editor.
- **Interfaz:**
  - dentro de «Datos del documento», un `<details>` «Macros del documento» con
    la lista y un formulario de tres campos: «Nombre», «Número de argumentos» y
    «Definición»;
  - vista previa de la macro (por ejemplo `\abs{x}`) y errores junto a cada
    campo;
  - el botón «Usar como mis macros predeterminadas» las guarda en
    `tex-notes:macros-default:v1`;
  - una sesión sin borrador ni autoguardado empieza con esas macros;
  - las macros aparecen las primeras en las sugerencias de P3.
- **Nueva regla de la comprobación previa, `katex-only`** (error, en
  `content-check.js`): avisa del uso de un comando que KaTeX acepta y nuestro
  preámbulo no define, si no hay una macro del documento con ese nombre.
  - `checkDocument(state)` lee `state.macros`; `checkBlock` recibe un cuarto
    parámetro opcional `{ macros }`.
  - Lista, comprobada contra la copia de KaTeX del repositorio:
    `R N Z Reals reals Complex natnums cnums Alpha Beta Epsilon Zeta Eta Iota Kappa Mu Nu Omicron Rho Tau Chi bull infin isin exist lang rang larr rarr lArr rArr Larr Rarr harr hArr Harr lrarr Lrarr uarr darr sub sube supe plusmn sdot alef alefsym image real weierp thetasym clubs diamonds hearts spades sect Dagger arcctg arctg ch cosec cotg cth sh tg ctg argmax Bbb bold`.
  - Aparte, como **aviso** porque existen con otro significado: `\empty` (en
    LaTeX no imprime nada; KaTeX dibuja ∅) y `\th` (en LaTeX es la letra þ).
  - Sugiere el reemplazo cuando exista: `\R`→`\mathbb{R}`,
    `\Complex`→`\mathbb{C}`, `\empty`→`\emptyset`, `\infin`→`\infty`,
    `\isin`→`\in`, `\exist`→`\exists`, `\lang`/`\rang`→`\langle`/`\rangle`,
    `\rArr`→`\Rightarrow`, `\sub`→`\subset`, `\sube`→`\subseteq`,
    `\plusmn`→`\pm`, `\sdot`→`\cdot`, `\alef`→`\aleph`.
  - Prueba que KaTeX renderiza cada entrada de la lista; eso mantiene la lista
    honesta.
  - Añade su sección en `docs/guia-de-uso.md`, porque `RULES` enlaza una ancla
    de esa guía y la prueba de documentación la verifica.

---

## P6 — Interfaz

- **Dos columnas** a partir de 75 rem de ancho.
  - `main` pasa a `min(100% - 2rem, 110rem)`. «Datos del documento» y
    «Resultado» ocupan todo el ancho.
  - Dentro de «Contenido», el editor va a la izquierda y «Estructura actual» a
    la derecha.
  - El editor es `position: sticky; top: .5rem` con
    `max-block-size: calc(100dvh - 1rem)` y desplazamiento propio. **Sin esa
    altura máxima, un editor fijo más alto que la ventana no deja llegar a su
    parte inferior.**
  - Por debajo de 75 rem, una sola columna como hoy.
- **Metadatos plegables:** «Datos del documento» va en un `<details>`, abierto
  si el título está vacío, con un resumen como «Título · curso · fecha».
- **Tarjetas compactas:**
  - quedan visibles «Editar» y «Añadir dentro»;
  - las demás acciones pasan a `<details class="block-more">` con el rótulo
    «Más acciones»: Duplicar, Copiar bloque, Copiar texto, Eliminar, Subir,
    Bajar, Mover a… y Guardar como plantilla;
  - pasa `more` en el contexto de `blockItemExtensions` y cambia la extensión
    [E] para que añada allí su botón;
  - **trampa: `focusAction()` hoy hace `button.focus()` sobre botones que
    quedarían dentro de un `<details>` cerrado.** El foco falla en silencio y
    acaba en `body` después de Subir, Bajar o Duplicar. Abre el `<details>` del
    destino antes de enfocar o, si no es posible, enfoca «Editar».
  - El párrafo de «Estructura actual» tiene que seguir nombrando «Duplicar»,
    «Copiar bloque», «Copiar texto» y «Pegar bloque»: `tests/check-site.mjs` lo
    exige.
- **Panel de atajos:** añade una lista fija `<ul id="editing-keys">` con:
  - Ctrl+Intro;
  - Tab y Escape en «Contenido», con su prioridad;
  - ↑ ↓ Intro en el menú;
  - Retroceso en un par vacío;
  - los comandos `/`.
  Tab e Intro sin modificador **no** entran en `SHORTCUTS`:
  `tests/shortcuts.test.js` solo admite Escape, flechas y Re Pág/Av Pág sin
  modificadores en un ámbito de widget.
- **Se conservan:** los límites del tablero (≤ 20 rem en escritorio, ≤ 25 rem
  por debajo de 38 rem), los objetivos táctiles de 44 × 44 px, la ausencia de
  desplazamiento horizontal a 320 px y el contraste en los dos temas.

---

## 5. Pruebas existentes que vas a tener que tocar (y cómo)

| Prueba | Por qué falla | Qué hacer |
| --- | --- | --- |
| `tests/check-site.mjs`, orden de scripts | archivos nuevos | añadirlos en orden de dependencia, también en `index.html` y `check:js` |
| `tests/generator.test.js`, \newtheorem | `proof` es `predefined` | filtrar `!type.predefined` sin renombrar la prueba |
| `tests/generator.test.js`, opciones contra tabla | `<option value="proof">` | mismo orden que la tabla |
| `tests/anclas.test.js` | la tabla de tipos cambia bajo DEC-005 | actualizar el comentario, `tramo` y `npm run bendecir`; decirlo en el commit |
| `tests/documentacion.test.js` | rótulos nuevos en la guía e inventario | rótulos reales en «…» y `npm run inventario` tras añadir pruebas |
| `tests/shortcuts.test.js` | campo `mod` | la entrada lleva `ctrl: true`; añade pruebas de `mod` |
| `tests/generator.test.js`, ejemplo byte a byte | **no debe fallar** | si falla, revisa: ni las macros vacías ni `proof` deben cambiar el ejemplo |

No toques las afirmaciones literales que `INVARIANTES.md` cita como guardianes.

## 6. Revisión manual (añádela a `docs/revision-manual.md`)

DEC-007 deja la interfaz sin pruebas automáticas, así que esta lista es parte
de la suite:

- [ ] Con la distribución **latinoamericana** en Windows:
  - escribir `\` (AltGr), `{`, `}`, `[`, `]`, `^`, `~`, `á` y `ñ` en prosa y en
    fórmulas;
  - confirmar que el autocierre, las sugerencias y los alias reaccionan;
  - confirmar que AltGr nunca dispara Ctrl+Intro.
- [ ] Lo mismo con la distribución **EE. UU.**
- [ ] Con las dos distribuciones instaladas en Windows, usar Alt+Mayús+S, G y Q
  y comprobar si cambia la distribución. Si cambia, anótalo en `claude.md`.
- [ ] Ctrl+Z inmediatamente después de cada acción: insertar desde el tablero,
  autocierre, salto de cierre, Retroceso en un par, sugerencia aceptada, alias
  expandido, hueco, `\begin` + Intro, Intro en una lista y sangría de lista.
  Cada Ctrl+Z deshace solo esa acción.
- [ ] Clase simulada: diez bloques seguidos solo con teclado, con `/teo Título`,
  `/ec` y `/lista`, usando Ctrl+Intro. El foco nunca sale de «Contenido».
- [ ] La plantilla `ejres` completa, una con «Omitir paso» y otra cancelada al
  mover un bloque.
- [ ] Cerrar la pestaña con un bloque a medio escribir, reabrir y recuperar la
  sesión. Abrir la página y escribir sin recuperar: la sesión anterior queda en
  `tex-notes:autosave:previous`.
- [ ] Con NVDA, abrir el menú de sugerencias: se anuncia el recuento y cada
  opción activa. Tab con el menú cerrado y sin nada pendiente sale del campo.
- [ ] Definir `\R`, usarlo, generar y compilar en Overleaf. Borrar la macro y
  confirmar el error `katex-only` en la comprobación previa.
- [ ] A 320 px: el menú es usable al tacto, sin desplazamiento horizontal.

## 7. Documentación y decisiones (en el commit de cada paquete)

- `README.md`: borrador v3 y macros en el preámbulo (contrato), tipo
  Demostración, comandos `/`, alias y plantillas. En «Pendiente», quita las
  macros y los alias de «Siguiente ronda». La paleta sigue en «fuera por
  ahora».
- `docs/guia-de-uso.md` y `docs/guia-de-desarrollo.md`: cómo se usa y cómo se
  amplía (cómo añadir una plantilla incluida, un alias predeterminado o un
  comando `/`). Las guías **no** llevan justificaciones.
- `docs/hitos.md`: un hito por paquete (16–21).
- Decisiones nuevas en `decisiones/`, con el formato de las existentes y estas
  razones:
  - **DEC-015 — Tab en «Contenido» solo cuando hay algo que completar.** Amplía
    DEC-009 sin reemplazarla.
    - En un `textarea`, Tab no tiene otro uso y es la tecla habitual de los
      fragmentos.
    - Si no hay nada pendiente, Tab es nativo, y Escape termina cualquier sesión
      de huecos. Así no hay trampa de teclado (WCAG 2.1.2).
    - Los alias predeterminados evitan las palabras cortas del español para que
      Tab no expanda «en» cuando se quiere salir del campo.
  - **DEC-016 — Las ediciones programáticas pasan por `execCommand`.**
    - Asignar `value` borraba el historial de deshacer.
    - `execCommand` está desaconsejado pero sigue siendo la única vía que
      conserva Ctrl+Z en un `textarea`.
    - El respaldo con `setRangeText` pierde el deshacer pero no el texto.
  - **DEC-017 — Alias y macros, las dos cosas.**
    - Los alias son personales, viven en el navegador y se expanden al teclear:
      el `.tex` nunca depende de ellos.
    - Las macros son del documento, viajan en el borrador v3 y en el preámbulo.
    - Se usa `\newcommand` porque falla de forma visible; `\providecommand`
      fallaría en silencio.
  - **DEC-018 — Menú `/` en lugar de atajos por tipo y de paleta.**
    - En Windows con dos distribuciones, Alt+Mayús puede cambiar de
      distribución, y Ctrl+Alt es AltGr (DEC-009).
    - `/` no depende de la distribución y se escribe sin quitar las manos de la
      fila central.
    - La paleta sigue fuera porque el menú cubre su caso dentro del campo.
  - **DEC-019 — Autoguardado separado del borrador explícito.** Guardar en la
    clave del borrador sobrescribiría con una sesión vacía al abrir la página, y
    el borrador es un punto de restauración elegido por la persona.
  - **DEC-020 — Demostración como entorno predefinido.** `amsthm` define `proof`
    y `\newtheorem{proof}` no compilaría; `predefined` lo excluye del
    preámbulo sin crear un `kind` nuevo.
- Para el código no obvio (la distancia al final, el `change` despachado, la
  fase de captura), un bloque `@decision` encima, con `ancla:nueva`, y
  `npm run bendecir`.
- Opcional, si encuentras un guardián estable: una invariante «el contenido no
  se asigna con `.value` fuera de cargar y vaciar el formulario», con una
  prueba sobre el texto de `app.js` que la vigile. Si no encuentras un guardián
  que no sea frágil, no la añadas.

## 8. Fuera de alcance

- La paleta de comandos, las bibliotecas de edición y cualquier dependencia.
- El bloque de tabla, las referencias cruzadas y la sincronización entre
  dispositivos: la exportación de configuración la sustituye.
- Cambiar el escapado de títulos o de metadatos.
- Llevar el asistente a otros campos.
- Rediseñar el tablero de símbolos. Solo pasa a usar `applyFieldEdit` y a
  registrar el uso.

## Anexo A — Medición de rendimiento (no se añade al repositorio)

Ejecútalo con un Playwright instalado aparte. No lo añadas a `package.json`
(INV-006).

```js
// node medir.cjs   (con la app en /ruta/al/repo)
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.goto("file:///ruta/al/repo/index.html");
  const content = "Sea $f:\\mathbb{R}^2 \\to \\mathbb{R}$ y $\\nabla f(x,y) = \\left(\\frac{\\partial f}{\\partial x}, \\frac{\\partial f}{\\partial y}\\right)$ con $\\lim_{(x,y)\\to(0,0)} f = 0$.";
  await page.evaluate((content) => localStorage.setItem("tex-notes:draft:v2", JSON.stringify({
    version: 2, metadata: { title: "x" },
    blocks: Array.from({ length: 100 }, (_, i) => ({ type: "text", title: "", content: `${content} ${i}`, children: [] })),
  })), content);
  await page.click("#restore-draft");
  for (let k = 0; k < 3; k++) {
    await page.fill("#block-content", content);
    console.log(await page.evaluate(() => {
      const t = performance.now();
      document.querySelector("#add-block").click();
      return `${Math.round(performance.now() - t)} ms de JS`;
    }));
  }
  await browser.close();
})();
```

Referencia antes de P1: ~200–220 ms por alta. Objetivo: ≤ 60 ms. El script
siembra un borrador v2 y sigue sirviendo después de P5, porque los borradores v2
se migran.
