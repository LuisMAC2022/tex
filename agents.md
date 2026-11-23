<!-- Buzón transitorio. Puede vaciarse en cualquier momento.
     Las reglas permanentes están en PROTOCOLO.md.
     Antes de vaciar: promueve lo durable (invariante → INVARIANTES.md,
     justificación → decisiones/, rasgo del sistema → README.md). -->

# Encargo: el teléfono primero (barra del pulgar, menús radiales, identificadores y versiones)

De: Claude · Fecha: 2026-11-22 · Rama base: `claude/ui-ux`
Para: el agente que lo implemente (Astra, Codex u otro)

Son seis paquetes, U0–U5, y se hacen en orden. Entre U3 y U4 se intercalan
U3.1 y U3.2 (etiquetas y citas), descritos al final de este archivo. Las
decisiones de producto ya están tomadas con la persona usuaria. Tu trabajo es implementarlas sin romper el
contrato del repositorio. Lee el encargo completo antes de escribir código:
varias trampas de un paquete afectan a otro.

El encargo anterior (captura rápida, P1–P6) está terminado. Sus informes siguen
en `claude.md` y sus reglas R1 y R2 siguen vigentes; se repiten abajo.

---

## 0. Cómo trabajar

1. Lee `PROTOCOLO.md` e `INVARIANTES.md` antes de tocar nada. Son reglas.
2. Crea una rama desde `claude/ui-ux`, por ejemplo `astra/ui-ux`, salvo que la
   persona te indique otra.
3. Implementa los paquetes **en orden** (U0 → U5). Cada paquete termina con
   `npm test` en verde y en uno o varios commits propios. No mezcles paquetes en
   un commit. La documentación de cada cambio va en su mismo commit (tabla
   «Qué se actualiza con qué» de `PROTOCOLO.md`).
4. Si algo de este encargo contradice una invariante, una prueba guardiana o el
   código real, **detente y escribe la duda en `claude.md`**. No resuelvas la
   contradicción reescribiendo una prueba guardiana.
5. Al terminar cada paquete, deja en `claude.md` un informe corto: qué hiciste,
   qué mediste, **qué no pudiste verificar** y por qué. Tu entorno no tiene un
   teléfono Android y probablemente tampoco `pdflatex`. No afirmes nada que no
   hayas visto funcionar: escribe «no verificado» y añade el punto a
   `docs/revision-manual.md`.
6. Las decisiones nuevas toman el **siguiente número libre** de `decisiones/`.
   DEC-021 ya existe y reemplaza a DEC-001.

## 1. Para quién y en qué condiciones

- **Herramienta personal** de una sola persona. No es un producto, ni un estudio
  con participantes, ni compite con Overleaf.
- **Dispositivo principal: teléfono Android con Chrome y Gboard**, a menudo con
  una sola mano y en clase, con red inestable. El portátil sigue en uso, con
  teclado español latinoamericano en el salón e inglés EE. UU. en casa. Todo lo
  decidido para escritorio en P1–P6 se conserva.
- **El documento vive en la aplicación** (DEC-021). Overleaf solo compila. El
  `.tex` es un producto derivado.

### Medición de partida

Emulación de Pixel 7 (412×839 px CSS, sin teclado virtual) con el estado de
`claude/ui-ux`. El guion está en el anexo A.

| Elemento | Posición vertical |
| --- | --- |
| Etiqueta «Contenido» | ~1 970 px (unas 2,3 pantallas de desplazamiento) |
| Botón «Añadir bloque» | ~2 210 px |
| Tablero de símbolos | ~2 730 px, **debajo** de «Añadir bloque» y lejos del campo |
| «Estructura actual» | ~3 100 px |
| Altura total | ~4 800 px; «Datos del documento» abierto ocupa ~700 px |

Objetivos táctiles por debajo de 44 px: la casilla del autocierre (22 px de
ancho) y los `summary` de 24 px de alto de «Macros del documento», «Vista
previa de las matemáticas», «Preferencias de escritura» y «Atajos de teclado».

Toda la captura de P1–P6 se apoya en teclas que un teclado virtual no tiene:
Ctrl+Intro, Tab para huecos y alias, y Escape.

### Lo que nadie ha comprobado todavía

- Con Gboard gran parte del texto llega como **composición**. El autocierre y
  las sugerencias exigen `inputType === "insertText"` y `!isComposing`
  (`assets/js/app.js`, manejadores de `beforeinput`). Es probable que no se
  activen en Android. U0 lo mide; **no lo «arregles» sin esos datos**.
- Qué ocurre en Chrome Android con una pulsación larga **dentro** de un
  `textarea` si la aplicación la intercepta: selección nativa, tiradores, menú
  contextual y cancelación del puntero.

## 2. Decisiones ya tomadas (no las reabras)

- **DEC-021:** la aplicación es la copia maestra. DEC-003 e INV-001 siguen
  vigentes: no hay reimportación desde el `.tex`. La ida y vuelta es con el
  archivo de proyecto JSON de U4.
- **Sin Python en este encargo.** No crees tipos de bloque de código ni
  reserves campos para ejecución. Está sin decidir.
- **Sin bibliotecas, sin módulos ES y sin paso de construcción** (INV-006,
  DEC-002). Scripts clásicos sobre `window.TexNotes`.
- **Los gestos son aceleradores, nunca la única vía.** Todo lo que hace un menú
  radial se puede hacer también con toques visibles y con teclado. Ninguna
  acción esencial depende de una pulsación larga, de un arrastre ni de recordar
  un gesto (WCAG 2.2, criterio 2.5.7). En los estudios con *marking menus*,
  incluso las personas expertas volvían al menú visible para recordar.
- **Posiciones estables.** Un sector no cambia de sitio por frecuencia de uso.
  Prohibido reordenar menús por uso: el gesto se aprende por dirección.
- **Fragmentos con la sintaxis existente, no con `|`.** La especificación
  original marcaba el cursor final con `|`. Pero `|` es un carácter válido de
  LaTeX (`\left| x \right|`, `\|`, `|x|`), y el repositorio ya tiene una
  sintaxis probada y sin ambigüedad: huecos `#1`–`#9`, posición final `#0` y
  `\#` para un signo literal (`parseSnippet`, en `assets/js/editing-assist.js`).
  Además, los huecos permiten recorrer los argumentos restantes con los botones
  de la barra, que es lo que en el teléfono ahorra tiempo.
- **Como máximo 8 sectores por anillo**, y cada sector mide al menos 44 px de
  arco en su radio medio y 44 px de grosor.
- **Atajos de teclado:** nada nuevo con Alt+Mayús (en Windows cambia de
  distribución de teclado). Solo se permite la convención de plataforma para
  menús contextuales: tecla Menú o Mayús+F10, registrada en `shortcuts.js`.
- **«Versiones» son versiones del documento**, no de la aplicación. Las
  versiones sustituyen al borrador único (U4).

## 3. Reglas transversales (valen para todos los paquetes)

- **R1 — Toda edición programática del contenido conserva el deshacer.** Usa
  `applyFieldEdit` (DEC-016). Solo se asigna `.value` al cargar un bloque o al
  vaciar el formulario.
- **R2 — Los caracteres tecleados se leen en `beforeinput`, no en `keydown`.**
- **R3 — Los botones de la barra y los sectores no le quitan el foco al campo.**
  Haz `preventDefault()` en `pointerdown` y actúa en `click`, con el mismo
  patrón que las opciones del menú de sugerencias en `app.js`. Guarda la
  selección al abrir y restáurala al aplicar. Si el campo pierde el foco, Gboard
  se cierra, la página salta y la selección se pierde. Si el foco llega a la
  barra con teclado o TalkBack, el resultado se aplica al campo y el foco
  vuelve a él.
- **R4 — La lógica es pura y vive fuera de `app.js`.** No toca el DOM al cargar
  y se prueba con `tests/load-app.mjs` (DEC-007). Cada script nuevo va en
  `index.html` en orden de dependencia, en la lista de `tests/check-site.mjs`
  (INV-004), en `check:js` de `package.json` y en el cargador de sus pruebas.
- **R5 — Una sola fuente de verdad.** Los tipos de bloque están en
  `block-types.js` (INV-005), los símbolos en `math-symbols.js` y los atajos en
  `shortcuts.js` (DEC-009). `menus.js` los **referencia por id**, nunca los
  copia.
- **R6 — Accesibilidad.** Roles y nombres accesibles, foco previsible, anuncios
  en la región `aria-live`, objetivos de 44 px y nada que dependa solo del
  color. TalkBack entra en la revisión manual.
- **R7 — El archivo de referencia no cambia.** `examples/calculo-3.tex` queda
  idéntico byte a byte en todos los paquetes (INV-008). Si un cambio lo altera
  sin que este encargo lo diga, detente.

---

## U0 — Diagnóstico en el teléfono real

**Objetivo:** obtener los datos que ningún entorno de agente puede obtener.
Con ellos se decide si la pulsación larga puede usarse dentro de «Contenido» y
cómo se coloca la barra sobre el teclado.

**Entregable:** `diagnostico/android.html`. Es una página autocontenida, con CSS
y JS en línea, scripts clásicos, nada remoto y rutas relativas. No se enlaza
desde la interfaz. Tiene cuatro pruebas guiadas y un botón «Copiar informe».

1. **Escritura.** Un `textarea` que registra `keydown` (`key`, `code`,
   `keyCode`), `beforeinput` (`inputType`, `data`, `isComposing`),
   `compositionstart`, `compositionupdate`, `compositionend` e `input`. El guion
   en pantalla pide escribir `\frac`, `(`, `{`, `$`, `^`, `á`, aceptar una
   palabra de la barra de sugerencias de Gboard y borrar con Retroceso.
2. **Pulsación larga.** Sobre un `textarea` y sobre una tarjeta no editable,
   registra los eventos `pointer*`, `touch*`, `contextmenu` y `selectionchange`
   con su tiempo. Tiene interruptores para:
   - `preventDefault` en `contextmenu`;
   - `user-select: none` y `-webkit-touch-callout: none` en la tarjeta;
   - un `touchmove` registrado **desde el principio** con `{ passive: false }`
     que hace `preventDefault()` solo después de 400 ms.

   La pregunta es: ¿se puede abrir un menú a los 400 ms y seguir recibiendo
   `pointermove` hasta soltar, sin `pointercancel` ni selección nativa?
3. **Teclado y ventana.** Registra `visualViewport.height`,
   `visualViewport.offsetTop` e `innerHeight` al abrir y cerrar el teclado, en
   dos variantes de la meta viewport: con y sin
   `interactive-widget=resizes-content` (por ejemplo, `?resize=1`). Un elemento
   `position: fixed; bottom: 0` muestra si queda sobre el teclado.
4. **Capacidades.** Comprueba:
   - `navigator.vibrate`: si existe y qué devuelve;
   - `navigator.storage.persisted()`, `persist()` y `estimate()`;
   - `indexedDB.open`;
   - `matchMedia("(pointer: coarse)")`, `devicePixelRatio` y tamaño de pantalla.

«Copiar informe» copia un JSON al portapapeles, con un `textarea`
seleccionable como alternativa. La página no envía nada a ninguna parte.

**Pruebas:** extiende la vigilancia de INV-006 e INV-007 a `diagnostico/*.html`:
nada remoto y nada que parta de la raíz. Ajusta el texto de INV-006 si su
guardián cambia.

**Después:** escribe en `user.md` cinco líneas para la persona: cómo abrir la
página (sección 4 de este encargo), qué hacer y dónde pegar el informe
(`diagnostico/resultados-android.md`). **No esperes el resultado.** Sigue con
U1 y U2 con la opción conservadora (sin pulsación larga dentro del campo) y deja
la otra detrás de una constante.

---

## U1 — Distribución para el teléfono y barra del pulgar

**Objetivo:** en pantallas táctiles estrechas, «Contenido» queda a la vista y
las acciones frecuentes quedan al alcance del pulgar, con el teclado abierto.

1. **Compactar sin reordenar el DOM.** El README exige que el orden del DOM
   coincida con el visual: **no uses `order` de CSS**.
   - «Datos del documento» empieza plegado si el título ya tiene valor, y
     abierto si está vacío, porque el título es obligatorio.
   - Al enfocar «Contenido», el campo se desplaza para quedar visible por
     encima de la barra y del teclado. Usa `scroll-padding-block-end` con la
     altura de la barra.
2. **Barra del pulgar** (`#thumb-bar`). Es un `role="toolbar"` con
   `aria-label="Acciones de escritura"`: una sola parada de Tab y flechas entre
   sus botones. Fija abajo y visible con `(pointer: coarse)`; el escritorio no
   cambia. Cada botón mide al menos 48×48 px, con texto visible e icono. Orden
   final, fijo:

   | 1 | 2 | 3 | 4 | 5 | 6 |
   | --- | --- | --- | --- | --- | --- |
   | «Menú» (U2) | «Anterior» | «Siguiente» | «Selección» (U5) | «Símbolos» | «Añadir» |

   Los botones de paquetes posteriores se añaden en su paquete.
   - **«Anterior» y «Siguiente»:**
     - Con un fragmento activo, recorren los huecos. Hoy solo existe
       `nextSnippetHole`; añade `previousSnippetHole`, que es pura.
     - Sin fragmento, mueven el cursor **una unidad LaTeX**: un `\comando`
       entero, `\\`, un escape como `\{` o un grafema. Usa `Intl.Segmenter`
       para no partir acentos ni pares sustitutos. Hazlo con una función pura
       `tokenBoundary(value, index, direction)`.
     - Los rótulos son estáticos. El comportamiento actual se anuncia
       («Hueco 2 de 3»).
   - **«Símbolos»** abre el tablero existente como hoja inferior sobre la
     barra: es el mismo elemento del DOM, con una altura de como mucho el 40 %
     de `visualViewport.height`. Escape o «Cerrar» devuelven al campo con su
     selección. Trampa: los botones de símbolo le quitan el foco al campo y
     cierran el teclado, así que aplica R3 mientras el tablero esté abierto como
     hoja. El buscador sí recibe foco.
   - **«Añadir»** hace lo mismo que «Añadir bloque» o «Guardar cambios»
     (Ctrl+Intro).
3. **Sobre el teclado.** Coloca la barra con `visualViewport` (eventos `resize`
   y `scroll`): `bottom = innerHeight − (offsetTop + height)`. Funciona se use o
   no `interactive-widget`. Si U0 confirma que esa meta viewport basta, puedes
   añadirla. Reserva `padding-block-end` en `body` para que la barra no tape lo
   último.
4. **Objetivos de menos de 44 px:** corrige la casilla del autocierre y los
   cuatro `summary` de la medición de partida.

**Pruebas:**
- Puras: `previousSnippetHole`, y `tokenBoundary` con comandos, `\\`, `\{`,
  acentos, emoji (pares sustitutos), comentarios y los extremos del texto.
- Estructurales en `check-site.mjs`: la barra existe con su `aria-label`, sus
  botones son `type="button"` y sus rótulos están en `index.html`.

**Revisión manual:** en Android, la barra queda sobre el teclado; tocar
«Anterior», «Siguiente» o «Añadir» no cierra el teclado; TalkBack lee la barra
como barra de herramientas.

---

## U2 — Menús radiales contextuales

**Objetivo:** acciones por dirección, con una mano, según lo que hay bajo el
dedo o en el cursor. Dos archivos:
- `assets/js/menus.js`: solo datos;
- `assets/js/radial.js`: geometría, máquina de estados, aplicación de acciones
  y una fábrica de DOM que solo llama `app.js`.

`radial.js` no toca el DOM al cargar (R4).

### Formato de `menus.js`

```js
TexNotes.RADIAL_MENUS = [
  { context: "formula", slices: [
    { id: "frac", label: "Fracción", icon: "a⁄b", action: { type: "insert", snippet: "\\frac{#1}{#2}#0" } },
    { id: "greek", label: "Griegas", icon: "αβ", action: { type: "submenu", slices: [
      { id: "alpha", label: "alfa", action: { type: "symbol", symbol: "alpha" } },
      // …
    ] } },
  ] },
];
```

Tipos de acción:

| Tipo | Qué hace |
| --- | --- |
| `insert` | Inserta un fragmento con la sintaxis `#N` |
| `symbol` | Inserta una entrada de `MATH_SYMBOLS` por id y registra el uso como el tablero |
| `command` | Llama por nombre a una función de un registro, con `args` opcional |
| `submenu` | Abre un segundo anillo con sus propios `slices` |
| `blockTypes` | Submenú derivado de una lista de ids de `BLOCK_TYPES`, con los rótulos de `blockLabel()` |

**Qué se puede hacer solo editando `menus.js`:** un fragmento nuevo, un símbolo,
un submenú o un comando que ya exista. Un comando nuevo exige además su función
en el registro de `app.js`. Dilo así en la guía de desarrollo, sin prometer más.

### Menús iniciales

| Contexto | Sectores (en este orden, el 1 arriba y en sentido horario) |
| --- | --- |
| `formula` | Fracción `\frac{#1}{#2}#0` · Raíz `\sqrt{#1}#0` · Integral `\int_{#1}^{#2} #3 \, d#4#0` · Suma `\sum_{#1}^{#2} #0` · Superíndice `^{#1}#0` · Subíndice `_{#1}#0` · Matriz `\begin{pmatrix}`⏎`#1 & #2 \\`⏎`#3 & #4`⏎`\end{pmatrix}#0` · Griegas (submenú) |
| `text` | Negrita `\textbf{#1}#0` · Cursiva `\textit{#1}#0` · Lista (comando `insertList`) · Título (comando `focusTitle`) · Enlace `\href{#1}{#2}#0` · Fórmula en línea `$#1$#0` |
| `image` | Tamaño (submenú: 40 %, 60 %, 80 %, 100 % con `setImageWidth`) · Pie (comando `focusTitle`) · Alineación (submenú: izquierda, centro y derecha con `setImageAlign`) · Reemplazar (`chooseImageFile`) · Eliminar (`deleteBlock`, con la confirmación existente) |
| `global` | Nuevo bloque (`blockTypes`) · Deshacer (`undo`) · Rehacer (`redo`) · Ir a… (submenú con `goTo`) · Ajustes (`openPreferences`) |

Notas de diseño de estos menús:

- **Griegas:** 7 letras + «Más…», que hace `openSymbols("greek-lower")`. Hay
  más de 30 griegas y no caben en un anillo. Propuesta inicial: α, β, δ, ε
  (`varepsilon`, como el alias `eps`), θ, λ y π. La persona puede cambiarla en
  `menus.js`.
- **Nuevo bloque:** 7 tipos + «Más…», que enfoca «Tipo de bloque». Propuesta:
  texto, ecuación, en línea, definición, teorema, demostración y ejemplo.
- **Lista** es un comando y no un fragmento. En un bloque de texto o de teorema
  inserta `\begin{itemize}`⏎`\item #1`⏎`\end{itemize}#0`. En un bloque de lista
  cada línea ya es un `\item`, así que ese fragmento rompería el documento: ahí
  la acción es «Sangrar».
- **Título** enfoca «Título del bloque (opcional)», que el generador convierte
  en `\subsection` o en el título del entorno. No insertes `\subsection` dentro
  del contenido: la estructura la gobierna el árbol.
- **Enlace:** `\href` necesita `hyperref`, que **no está** en la lista blanca
  del preámbulo (INV-009). Añádelo a la lista blanca y emítelo **solo si algún
  contenido usa `\href` o `\url`**, como `\usepackage[hidelinks]{hyperref}` y
  después de todos los demás paquetes. Así el ejemplo de referencia no cambia
  (R7). Prueba los dos casos en `generator.test.js`, documenta el preámbulo en
  el README y registra la decisión.
- **Ir a…** no estaba en la especificación de la persona. Se añade porque la
  página mide unas 6 pantallas en el teléfono. Destinos: «Contenido»,
  «Estructura», «Resultado», «Preferencias» y, desde U4, «Versiones».
  Menciónalo en el informe.

### Dónde y cómo se abre

| Dónde | Cómo | Contexto |
| --- | --- | --- |
| Botón «Menú» de la barra | Tocar abre en modo toque. Tocar y arrastrar abre en modo arrastre, **sin esperar**. | Según el editor: `formula` si el tipo es una fórmula o si `mathContextAt(...) === "math"`; `image` si el bloque es una imagen; `text` en otro caso |
| Pulsación larga (400 ms) sobre una tarjeta de la estructura | Arrastre | Según el tipo de la tarjeta: imagen → `image`; fórmula → `formula`; resto → `text`. Para `formula` y `text`, primero se abre el bloque en el editor como con «Editar», con el cursor al final |
| Pulsación larga en zona vacía, fuera de campos y controles | Arrastre | `global` |
| Pulsación larga dentro de «Contenido» | **Desactivada** (`LONG_PRESS_IN_FIELD = false`) hasta conocer U0 | Como el botón «Menú» |
| Clic derecho con ratón | Modo toque | Como la pulsación larga en ese lugar |
| Tecla Menú o Mayús+F10 en «Contenido» | Modo toque, con foco en el primer sector | Como el botón «Menú» |

### Geometría

Constantes en `radial.js` (no en `menus.js`):
- espera de la pulsación larga: 400 ms;
- tolerancia de movimiento durante la espera: 10 px; si se supera, era un
  desplazamiento y no se abre nada;
- zona muerta: 20 px.

Ángulo con `Math.atan2` desde el punto de presión, en coordenadas de pantalla
(la *y* crece hacia abajo): `θ = atan2(dx, −dy)`, normalizado a `[0, 2π)`. Así 0
queda arriba y crece en sentido horario.
- **Anillo completo:** el sector *i* de *n* está centrado en `i·2π/n`.
- **Abanico de amplitud `span` desde `start`:** sectores iguales en
  `[start, start + span)`. Fuera del abanico no se resalta nada.
- Los bordes entre sectores pertenecen siempre al sector siguiente en sentido
  horario.

**Restricción de 44 px:** `span · r_medio / n ≥ 44` y `r_ext − r_int ≥ 44`. Las
cuentas, para no descubrirlo tarde:

| Disposición | Requisito con 8 sectores | Valores iniciales |
| --- | --- | --- |
| Anillo completo | `r_medio ≥ 56` | 32–104 px (r_medio 68, arco ≈ 53 px) |
| Medio anillo (desde la barra, junto al borde inferior) | `r_medio ≥ 112` | 84–140 px |
| Submenú en abanico alrededor del sector padre | Con 112–176 px, `span ≥ 140°` | 150° |

Un **segundo anillo completo no cabe** en un teléfono de 412 px. El submenú es
un abanico centrado en la dirección del sector padre. Si el abanico no cabe en
la ventana, el submenú **sustituye** al primer anillo en el mismo centro. Escribe
una función pura `fitMenu(origin, viewport, n)` que elija entre anillo completo,
medio anillo, abanico y sustitución.

En modo arrastre, el origen del ángulo es siempre el punto de presión, aunque
parte del dibujo quede fuera de pantalla. En modo toque, el dibujo se desplaza
para caber entero.

### Máquina de estados

La máquina es pura: `radialReduce(state, event, layout) → state`, y su salida
incluye `highlight`, `action`, `cancelled` y `haptic`.

- **Espera:** `down` + movimiento mayor que la tolerancia → reposo (era un
  desplazamiento). `down` + 400 ms → abierto en arrastre.
- **Arrastre en el primer anillo:**
  - dentro de la zona muerta, nada resaltado;
  - fuera de ella, el sector por ángulo;
  - si ese sector es un submenú y la distancia supera `r_ext` del primer
    anillo, se abre el submenú;
  - al volver por debajo de `r_ext`, se cierra el submenú.
- **Soltar en arrastre:**
  - en la zona muerta, se cancela;
  - sobre una hoja, se ejecuta su acción;
  - sobre un submenú sin haber salido del anillo, el submenú queda abierto en
    modo toque;
  - sobre un elemento del submenú, se ejecuta su acción.
- **Modo toque:**
  - tocar un elemento lo ejecuta o abre su submenú;
  - tocar fuera o Escape cierra;
  - en un submenú, Escape vuelve al primer anillo.
- **Teclado:** flechas en círculo, Inicio y Fin, Intro o Espacio para activar,
  flecha hacia fuera o Intro sobre un submenú para abrirlo, Escape para volver
  o cerrar. Al cerrar, el foco vuelve al campo con su selección.
- **Cancelaciones:** `pointercancel`, un segundo puntero (el zoom con dos dedos
  debe seguir funcionando; ignora `isPrimary === false` y cancela), pérdida de
  visibilidad de la página y desplazamiento.
- **Vibración:** `haptic` es `true` solo cuando cambia el resaltado en modo
  arrastre. La vista llama a `navigator.vibrate?.(10)` si la preferencia
  «Vibración» está activa (activada por defecto, en «Preferencias de
  escritura»).

### Dibujo y accesibilidad

- Una capa fija sobre la ventana, con `touch-action: none`.
- Un `svg` con `aria-hidden="true"` para los sectores, con trazos de arco.
- Encima, un contenedor `role="menu"` con un `button role="menuitem"` por
  sector, situado en el centro del sector, de al menos 44×44 px, con rótulo e
  icono. El SVG es decoración; la interacción accesible son los botones.
- El resaltado no depende solo del color: borde más grueso y fondo.
- Al abrir se anuncia, por ejemplo, «Menú de fórmula, 8 opciones».
- Sin animación con `prefers-reduced-motion`. Tokens de los dos temas.

### Trampas de Android (confírmalas con U0)

- Registra `touchmove` con `{ passive: false }` **antes** de que empiece el
  toque, en el panel de estructura y en la barra, y llama a `preventDefault()`
  solo con el menú abierto. Si no, Chrome empieza a desplazar y emite
  `pointercancel`. No lo registres en toda la página: los oyentes no pasivos
  grandes ralentizan el desplazamiento.
- Llama a `setPointerCapture` al abrir.
- `contextmenu` con `preventDefault` en tarjetas y zonas vacías. Pon
  `-webkit-touch-callout: none` en las miniaturas de imagen y
  `user-select: none` en las tarjetas con `(pointer: coarse)`. Copiar texto se
  sigue haciendo con «Copiar texto».
- Aplica R3 al abrir desde la barra: abrir el menú no debe cerrar el teclado.

### Aplicar un fragmento

Escribe una función pura `applyRadialSnippet(state, snippet) → { edit, session }`
sobre `parseSnippet`:
- **Sin selección:** el cursor va al primer hueco, o a `#0`, o al final si no
  hay marcadores.
- **Con selección:** el texto seleccionado ocupa `#1` y el cursor va al
  siguiente hueco.

La sesión de huecos es la misma que recorren «Anterior» y «Siguiente».
`app.js` aplica el resultado con `applyFieldEdit` (R1).

### Pruebas (`tests/radial.test.js`, puras)

- **Sector por ángulo:** arriba, derecha, abajo e izquierda con 4 y 8 sectores;
  bordes exactos; abanicos; fuera del abanico.
- **Zona muerta:** soltar a menos de 20 px cancela; moverse dentro de ella no
  resalta nada.
- **Pulsación larga:** movimiento antes de 400 ms → no se abre; un segundo
  puntero cancela.
- **Submenú:** salir del anillo sobre un sector de submenú lo abre; volver
  adentro lo cierra; soltar sobre un elemento devuelve su acción; soltar sobre
  el padre lo deja abierto en modo toque.
- **Fragmentos:** con y sin selección; solo `#0`; sin marcadores; `\#` literal;
  `$#1$#0`.
- **Validación de `menus.js`:**
  - existen los cuatro contextos;
  - como máximo 8 sectores por anillo;
  - ids únicos y tipos de acción conocidos;
  - los fragmentos pasan `validSnippetMarkers`;
  - los símbolos y los tipos de bloque existen;
  - los comandos están en la lista de nombres declarada;
  - `fitMenu` cumple 44 px en la peor disposición de cada menú.
- **Representación:** cada fragmento de `formula` y de `text`, con los huecos
  rellenos con `x`, se representa con el KaTeX incluido y pasa `checkBlock` sin
  errores. Sigue el patrón de `templates.test.js`.
- **Estructural en `check-site.mjs`:** cada comando declarado se registra en
  `app.js`.
- **`pdflatex`, opcional (`tests/pdflatex.test.js`):** genera un documento con
  todos los fragmentos y el enlace, y lo compila con
  `-interaction=nonstopmode -halt-on-error -no-shell-escape` en un directorio
  temporal. Se **omite** con `{ skip: "pdflatex no está instalado" }` si no está
  instalado. Actualiza la frase «No se compila LaTeX en ninguna prueba» de
  `docs/guia-de-desarrollo.md` y regenera el inventario. En el informe di si se
  ejecutó o se omitió.

### Criterio de terminado

1. Los cuatro contextos abren su menú:
   - en escritorio, verificado por ti si tu navegador arranca; si no, dilo;
   - en el Android real, lo verifica la persona con `docs/revision-manual.md`.
     **Tú no lo puedes afirmar.**
2. Los fragmentos pasan KaTeX y `checkBlock` en la suite y compilan con
   `pdflatex` si está disponible. Overleaf queda en la revisión manual.
3. Las pruebas puras pasan.
4. Hay informe en `claude.md`.

---

## U3 — Identificadores estables (borrador v4)

**Objetivo:** cada bloque tiene un `id` que sobrevive a mover, editar, deshacer
y restaurar. Es un requisito de U4 (comparar versiones) y de las futuras
referencias cruzadas. Hoy los bloques se identifican por su posición
(`keyToPath`), que cambia al mover (DEC-014).

- **Formato:** `b` + 8 caracteres base36 a partir de `crypto.getRandomValues`,
  con un respaldo sin `crypto`. Las funciones puras reciben el generador
  inyectado para que las pruebas sean deterministas. El estado lleva además un
  `documentId`.
- **Copias con id nuevo** (para no duplicar ids): «Duplicar», «Pegar bloque»
  desde la bandeja y cada aplicación de plantilla. `templateFromBranch` quita
  los ids. Mover conserva el id.
- **Normalización:** `normalizeDraft` asigna ids a los bloques que no lo tienen
  y reasigna los duplicados o inválidos. Nunca lanza.
- **Versión del borrador:** `DRAFT_VERSION = 4`. Las versiones 1 a 3 migran;
  las posteriores se rechazan. La clave se mantiene, como hizo P5.
- **El generador ignora los ids.** El `.tex` de referencia no cambia (R7).
  Prueba que añadir ids al estado de ejemplo no altera la salida.
- **Foco:** donde hoy se recalcula la ruta para devolver el foco después de un
  cambio estructural, busca por id (`pathOfId`).
- **Invariante nueva**, con guardián: «Los identificadores de bloque son únicos
  en todo el árbol». Escribe una decisión con el porqué de los ids frente a las
  rutas.

**Pruebas:**
- unicidad después de duplicar, pegar, aplicar plantilla y migrar;
- conservación al mover;
- normalización de ids ausentes, duplicados y con otros tipos;
- migración v1, v2 y v3 → v4;
- salida `.tex` idéntica.

---

## U4 — Versiones y archivo de proyecto

**Objetivo:** que el documento pueda vivir en la aplicación (DEC-021) sin
miedo a perderlo. Hay tres capas.

### 1. Deshacer y rehacer de la estructura (solo en la sesión)

- Antes de cada cambio estructural se guarda una instantánea de
  `{ metadata, blocks, macros }`, hasta un máximo de 100. Cuentan como cambio:
  añadir, guardar una edición, eliminar, subir, bajar, «Mover a…», duplicar,
  pegar, cada paso de plantilla, los cambios de macros y los metadatos al
  confirmarlos.
- Deshacer restaura la instantánea, cancela la edición en curso como hace
  cualquier cambio estructural, lo anuncia y devuelve el foco por id.
- Hay botones visibles «Deshacer cambio» y «Rehacer cambio» en la estructura.
- Los comandos `undo` y `redo` de U2 distinguen el origen:
  - abiertos desde el editor, deshacen el texto con el historial nativo
    (`execCommand("undo")`, DEC-016);
  - abiertos desde `global`, deshacen la estructura.
- Sin atajos de teclado nuevos.

### 2. Versiones guardadas (persistentes)

- **Almacén:** IndexedDB (base `tex-notes`, almacén `versions`). Cada registro
  tiene esta forma:

  ```js
  {
    id, documentId,
    createdAt,   // ISO
    label,
    origin,      // "manual" | "exportación" | "respaldo"
    state,       // { version: 4, metadata, blocks, macros }
    summary,     // { title, blocks }
  }
  ```

  Si IndexedDB no abre (por ejemplo, en algún navegador con `file://`), se usa
  `localStorage` con menos retención y se avisa.
- **Lógica pura en `assets/js/versions.js`**, probada con un almacén en memoria
  que tiene la misma interfaz que el de IndexedDB. El adaptador de IndexedDB
  vive en la capa de interfaz.
- **Creación:**
  - «Guardar versión», con nombre opcional;
  - automática al «Generar documento», copiar o descargar el `.tex`, si el
    estado cambió desde la última versión. Responde a «¿qué fue lo último que
    compilé?»;
  - automática **antes** de restaurar o importar, con origen `respaldo`.
- **Retención:** las manuales se conservan todas. De las automáticas, las 30
  últimas por documento. Hazlo con una función pura `pruneVersions`.
- **Lista** con fecha, nombre, origen y número de bloques. Acciones:
  - «Ver cambios»: diferencias con el estado actual;
  - «Restaurar»: crea antes un respaldo y se puede deshacer;
  - «Renombrar»;
  - «Eliminar», con confirmación.
- **Diferencias:** una función pura `diffDocuments(a, b)` que compara por id y
  da bloques añadidos, eliminados, movidos (padre o posición) y modificados
  (tipo, título, contenido, opciones, formato de lista), además de los cambios
  de metadatos y macros. Para el contenido modificado, una diferencia por
  líneas, con un límite de tamaño.
- **Almacenamiento persistente:** al guardar la primera versión o al exportar,
  pide `navigator.storage.persist()`. Muestra el resultado y el uso
  (`estimate()`). Si no se concede, recomienda exportar el proyecto con
  regularidad.

### 3. Archivo de proyecto

- «Exportar proyecto» descarga un `.json` con esta forma:

  ```js
  {
    kind: "notas-latex-proyecto", version: 1, exportedAt, documentId,
    current,     // { version: 4, metadata, blocks, macros }
    versions,    // [...]
    config,      // opcional: la configuración portátil existente
  }
  ```

  Usa `file-download.js`.
- «Importar proyecto» valida con una función pura `validateProject`:
  - los estados pasan por `normalizeDraft`;
  - las versiones inválidas se omiten y se informa de cuáles;
  - nunca lanza;
  - **nunca sobrescribe sin respaldo**: primero crea una versión de respaldo y
    después carga;
  - las versiones se combinan por id, sin duplicados.

  Es la ida y vuelta del formato propio; el `.tex` nunca se importa (DEC-003).
- El archivo es la copia de seguridad y el traslado entre teléfono y portátil.
  La guía de uso recomienda guardarlo en Drive o en un repositorio privado.

### Sustituye al borrador único

«Guardar borrador», «Restaurar» y «Borrar» se sustituyen por las versiones.
Tres conceptos de persistencia confundirían. Al primer arranque, el borrador
guardado en la clave actual se migra **una vez** a una versión llamada
«Borrador guardado (migrado)». El autoguardado de la sesión (DEC-019) se queda:
sirve para recuperar después de un cierre, no es una versión.

Actualiza todo lo que nombra esos rótulos: `docs/guia-de-uso.md` (la prueba
de documentación lo exige), el README y la revisión manual. Registra la
decisión y su relación con DEC-019, DEC-003 y DEC-021.

### Pruebas

- historial: límite, deshacer y rehacer, y que una acción nueva vacíe lo
  rehecho;
- `diffDocuments` en todos los casos, incluidos metadatos y macros;
- diferencia por líneas;
- `pruneVersions`;
- `validateProject` con archivos corruptos, de otra versión y con versiones
  duplicadas;
- combinación por id;
- migración del borrador único;
- la versión automática solo se crea si hubo cambios.

---

## U5 — Selección por alcance

**Objetivo:** seleccionar sin arrastrar tiradores. Es el núcleo de la propuesta
de diseño que motivó este encargo: elegir un objeto, ampliar o reducir su
alcance y aplicarle una operación del menú radial.

- **Funciones puras** en `assets/js/selection-scope.js`:
  - `scopeLevels(value, range, mode)` devuelve los rangos que contienen la
    selección, de menor a mayor y estrictamente crecientes, cada uno con el
    nombre de su nivel;
  - `expandScope` y `shrinkScope` trabajan sobre una pila: reducir vuelve
    exactamente al rango anterior.
- **Prosa:** palabra → oración → párrafo (separado por líneas vacías) → bloque.
  Usa `Intl.Segmenter("es")`.
- **Matemáticas**, en el subconjunto declarado: símbolo o comando →
  argumento o grupo `{…}` → término (entre `+` y `−` al mismo nivel) → miembro
  (entre relaciones: `=`, `<`, `>`, `\le`, `\ge`, `\in`, `\subset`, `\to`…) →
  fórmula → fórmula con delimitadores.
  - Reconoce `\frac` y `\sqrt[…]{…}` con sus argumentos, `^` y `_`,
    `\left … \right`, `\begin … \end`, y `&` y `\\` en matrices.
  - Lo que no se reconoce es atómico.
  - **Solo se selecciona: nunca se modifica el texto** (INV-002).
- **Interfaz:** el botón «Selección» de la barra alterna el modo
  (`aria-pressed`). En ese modo, «Anterior» reduce y «Siguiente» amplía, y se
  anuncia el nivel («Término: `\frac{a}{b}`»). Las posiciones de los botones
  no cambian. Con la selección hecha, «Menú» → «Fracción» la envuelve (U2).
- **Pruebas:** fracciones anidadas, raíz con índice, subíndices compuestos,
  `\left( \right)`, `\{ \}` escapados, comentarios, `\text{…}` dentro de una
  fórmula, matrices, oraciones en español con acentos, y los extremos del
  texto. No dependas de casos finos de ICU.

---

## 4. Cómo probar en el teléfono (para la persona y para el informe)

GitHub Pages publica solo `main`, así que una rama no se ve en Pages. Hay tres
opciones:

1. **USB, la recomendada.** En el portátil: `python3 -m http.server 8000` y
   `adb reverse tcp:8000 tcp:8000`. En el teléfono, abre
   `http://localhost:8000/` en Chrome. `localhost` es un contexto seguro, así
   que el portapapeles, `persist()` y la vibración se comportan como en Pages.
   `chrome://inspect` en el portátil da la consola del teléfono.
2. **Misma red Wi-Fi:** `http://IP-del-portátil:8000/`. No es un contexto
   seguro: el portapapeles moderno y `persist()` pueden fallar.
3. **Fusionar en `main`** y abrir Pages.

Añade estas instrucciones a `docs/revision-manual.md`, junto con una sección
«Android» que incluya:
- Gboard: autocierre y sugerencias;
- la barra sobre el teclado;
- que el teclado no se cierre;
- pulsación larga en tarjetas y en zona vacía;
- arrastre con una mano;
- vibración;
- TalkBack;
- persistencia de las versiones tras cerrar Chrome;
- exportar e importar el proyecto.

## 5. Fuera de este encargo

- **Python, ejecución y notebooks.** Sin decidir.
- ~~Referencias cruzadas `\label` / `\ref`.~~ Ya no queda fuera: son U3.1 y
  U3.2, al final de este archivo.
- **Varios documentos en una biblioteca.** U4 deja preparado `documentId`.
- **Pasar de «línea N del `.tex`» al bloque que la produjo.** Mencionado en
  DEC-021.
- **Instalación sin conexión** (manifest y service worker, solo bajo https;
  `file://` no cambia). Es el siguiente paquete recomendado para usar el
  teléfono en clase con mala red.
- **Sincronización, edición visual de fórmulas (MathLive) y reconocimiento de
  escritura a mano.**

## 6. Informe final

Al terminar U5, deja en `claude.md`:
- qué hiciste en cada paquete;
- qué decisiones e invariantes nuevas registraste;
- qué mediste;
- **la lista exacta de lo no verificado**: Android real, TalkBack, `pdflatex`,
  Overleaf y los navegadores que no arrancaron;
- si algo de este encargo resultó equivocado al contrastarlo con el código.

---

## Anexo A — Medición de partida (Playwright)

Requiere Chromium. Si no arranca en tu entorno, dilo y no inventes cifras.

```js
const { chromium, devices } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices["Pixel 7"] });
  const page = await ctx.newPage();
  await page.goto("file://" + process.cwd() + "/index.html");
  const top = (s) => page.evaluate((s) => {
    const b = document.querySelector(s)?.getBoundingClientRect();
    return b && Math.round(b.top + scrollY);
  }, s);
  console.log({
    contenido: await top("#block-content"),
    añadir: await top("#add-block"),
    tablero: await top(".symbol-board"),
    estructura: await top(".structure-panel"),
    alto: await page.evaluate(() => document.documentElement.scrollHeight),
  });
  await browser.close();
})();
```

---

# Encargo complementario: etiquetas y citas (U3.1 y U3.2)

De: Claude · Fecha: 2026-11-23 · Se intercala **después de U3 y antes de U4**
Para: el mismo agente que implemente U0–U5

Son dos paquetes que se entregan por separado, en orden. Todo lo de las
secciones 0 a 3 del encargo anterior sigue vigente aquí, incluidas R1–R7: el
archivo `examples/calculo-3.tex` no cambia en ninguno de los dos paquetes.

**Rama base:** la de U3. Antes de empezar U0, la rama
`ccr-20873c43-32i6nb` debe estar fusionada en `claude/ui-ux`: trae cinco
correcciones que este encargo da por hechas (autocierre de `^`/`_` según
DEC-022, exportación siempre regenerada, fecha de hoy, orden de sugerencias y
tarjetas en el teléfono). Si no lo está, detente y pregúntalo en `claude.md`.

## Decisiones ya tomadas (no las reabras)

- **Dos estilos de cita por documento:** IEEE (predeterminado) y APA 7.ª ed.
  El contenido es el mismo en los dos: se cita con `\citep` y `\citet` de
  `natbib`, y cambiar de estilo no obliga a tocar ninguna cita.
- **La bibliografía generada va siempre al final del documento.**
- **Una ecuación destacada se numera si y solo si tiene etiqueta.**
- **Las ocho referencias del temario se cargan solo con un botón.** Nunca se
  precargan en un documento nuevo.
- **Sin BibTeX ni `biblatex`, sin `cleveref`, sin red.** La aplicación escribe
  la palabra «Teorema» porque conoce el tipo del bloque.

## Lo que ya está comprobado con `pdflatex`

Con TeX Live 2023 y el preámbulo actual de la aplicación, en este orden de
paquetes más `natbib` tras `graphicx`:

| Se escribe | IEEE `[numbers,square,sort&compress]` | APA `[round,authoryear]` |
| --- | --- | --- |
| `\citep[p.~912]{stewart1994}` | [1, p. 912] | (Stewart, 1994, p. 912) |
| `\citet{larson1995}` | Larson y Hostetler [2] | Larson y Hostetler (1995) |
| `\citep{spivak1993,stewart1994}` | [1, 3] | (Spivak, 1993; Stewart, 1994) |
| `\cite{stewart1994}` | [1] | Stewart (1994): **cambia de sentido** |
| `\citep{noexiste}` | [?], solo un aviso | (?), solo un aviso |

Trampas comprobadas, que el diseño de abajo ya resuelve:

- **El bloque «Bibliografía (IEEE)» antiguo con APA no compila:**
  `natbib` rechaza un `\bibitem{ref1}` sin autor y año («Bibliography not
  compatible with author-year citations») y todas las citas salen «?».
- **El bloque antiguo junto a la bibliografía generada, en IEEE, compila mal:**
  dos listas «Referencias», ambas empezando en [1], y las citas son ambiguas.
- `\bibitem[Stewart(1994)]{clave}` sirve para los dos estilos: APA usa el
  autor y el año; IEEE los ignora y numera.
- `babel` en español titula `thebibliography` «Referencias» y las figuras
  «Figura»; los nombres «Teorema», «Definición»… ya los declara el preámbulo con
  `\newtheorem`. No hay que traducir nada.

---

## U3.1 — Etiquetas y referencias cruzadas

**Objetivo:** remitir a teoremas, ecuaciones y figuras con `\ref`/`\eqref`,
con el número correcto en el menú, sin inventar claves y con un error visible
si una referencia queda rota (en Overleaf solo sale «??»).

### Modelo

- Campo opcional `label` (cadena) **en el bloque**, no en `content`. Así
  sobrevive a mover, reordenar y deshacer.
- Qué tipos lo admiten se declara en `block-types.js` (INV-005) con una
  propiedad `labelPrefix`: `theorem` → `teo`, `proposition` → `prop`,
  `definition` → `def`, `example` → `ej`, `note` → `nota`, `equation` → `ec`,
  `image` → `fig`. Sin `labelPrefix` no hay etiqueta: `proof` (no lleva número),
  `math-inline`, `text`, las listas y la bibliografía. `normalizeDraft` descarta
  la etiqueta de un tipo que no la admite.
- **Formato:** `<prefijo>:<resto>`, con `resto` en `[a-z0-9:-]+`. Generaliza la
  regla que hoy está en `normalizeImageOptions` (NFD, minúsculas, quitar lo no
  válido, reponer el prefijo) a una función pura `normalizeLabel(value, prefix)`
  y úsala también para las imágenes.
- `options.label` de las imágenes migra a `label` al normalizar. La salida es
  idéntica: pruébalo.
- **Unicidad:** las etiquetas son únicas en todo el árbol. `normalizeDraft`
  conserva la primera y vacía las repetidas. «Duplicar», «Pegar bloque» y cada
  aplicación de plantilla **vacían** la etiqueta de la copia, y
  `templateFromBranch` la quita. Mover la conserva. Es una invariante nueva con
  guardián en `INVARIANTES.md` (siguiente número libre).
- `labelFromTitle(title, prefix, existing)`, pura: slug del título sin
  diacríticos, palabras separadas por `-`, y sufijo `-2`, `-3`… si ya existe.
  Sin título propone `<prefijo>:1`, `<prefijo>:2`…
- `DRAFT_VERSION = 5`; las versiones 1 a 4 migran y las posteriores se
  rechazan, como hizo P5. La clave de almacenamiento no cambia.

### Generador

- Teorema y afines: `\begin{theorem}[Clairaut]\label{teo:clairaut}`, la
  etiqueta en la misma línea, tras el título opcional.
- Ecuación con etiqueta:

  ```tex
  \begin{equation}\label{ec:clairaut}
  f_{xy}(a,b) = f_{yx}(a,b)
  \end{equation}
  ```

  Sin etiqueta, exactamente el `\[ … \]` de hoy.
- Imagen: la salida de hoy, leyendo `block.label`.
- Sin etiquetas, la salida no cambia en un solo byte (R7).

### Números que muestra el menú

`referenceTargets(state)`, pura, devuelve en orden de emisión
`{ label, typeId, word, number, path, title }`:

- Cada entorno tipo teorema tiene su contador, continuo en todo el documento
  (regla de numeración del README).
- El contador de ecuaciones solo avanza con ecuaciones etiquetadas.
- El de figuras avanza con una imagen de ruta no vacía que, o bien es flotante
  (raíz o dentro de texto) y tiene pie, o bien tiene etiqueta. Es lo que hace hoy
  `blockToLatex` con `\caption` y `\refstepcounter{figure}`.
- Un bloque que el generador no emite (vacío y sin hijos) no cuenta. **No
  copies esa condición:** extrae de `blockToLatex` una función compartida que
  diga si un bloque se emite, para que no diverjan.
- Si algún contenido abre a mano un entorno que avanza ese contador (un
  `\begin{theorem}`, un `equation`/`align`/`gather`/`multline`/`flalign`/
  `alignat` sin asterisco, o un `\caption`), fuera de comentarios, ese tipo
  sale con `number: null`. Se muestra sin número, nunca con uno equivocado.

### Insertar una referencia

- `completionToken` reconoce `\ref{` y `\eqref{` (consulta: lo escrito tras
  `{`). Cada opción se rotula «Teorema 2 · Clairaut», o «Teorema · Clairaut»
  si `number` es `null`.
- **En prosa**, aceptar reemplaza lo tecleado por `Teorema~\ref{teo:clairaut}`,
  `Figura~\ref{fig:…}` o `\eqref{ec:…}`; para una ecuación usa siempre
  `\eqref`, aunque se tecleara `\ref{`. Si justo antes ya pone la palabra («el
  Teorema~» o «el teorema »), inserta solo el comando.
- **En matemáticas**, solo el comando, sin palabra.
- Todo con `applyFieldEdit` (R1).
- Editor: campo «Etiqueta» (solo en los tipos con prefijo, con el prefijo
  visible), botón «Proponer desde el título», errores junto al campo. La etiqueta
  de imagen de hoy pasa a ser este campo.
- Estructura: cada tarjeta etiquetada muestra «Teorema 2 · teo:clairaut».
- Tras U2: en `menus.js`, el contexto `text` suma el sector «Referir»
  (`\ref{#1}#0`, que abre este mismo menú). Siguen siendo como mucho 8 sectores.

### Comprobación previa del documento

Hoy `checkBlock` mira cada bloque. Añade a `content-check.js` una pasada pura
`checkDocument(state)` cuyos avisos llevan ruta, línea y columna y se suman al
resumen de «Resultado» con el mismo «Ir al bloque»:

| Caso | Severidad |
| --- | --- |
| `\ref{x}` o `\eqref{x}` sin destino (etiqueta de bloque o `\label` escrito en el contenido) | Error |
| Etiqueta repetida, de bloque o escrita a mano | Error |
| `\eqref` hacia algo que no es una ecuación | Aviso |
| `\label` escrito a mano en un bloque de texto o lista, fuera de un entorno matemático | Aviso: remitiría a la sección |

Ignora lo comentado con `%` usando `mathContextAt`.

### Pruebas

- `normalizeLabel`, `labelFromTitle`, migración v1–v4 → v5 y traslado de la
  etiqueta de imagen.
- Copias sin etiqueta: duplicar, pegar, plantilla y `templateFromBranch`.
- Generador: cadenas exactas con y sin etiqueta; ejemplo idéntico.
- `referenceTargets`: contadores separados, demostración sin número, bloque
  vacío que no cuenta, figura flotante con y sin pie frente a figura dentro de
  un teorema, y `null` ante entornos escritos a mano.
- Menú: token, rótulos y texto insertado en prosa, en matemáticas y con la
  palabra ya escrita.
- `checkDocument`: cada fila de la tabla.
- **`pdflatex`** (en `tests/pdflatex.test.js` de U2; omitida si no está
  instalado): compila dos veces un documento con todos los destinos y
  referencias, comprueba que el registro no tiene «undefined references» y que
  cada `\newlabel` del `.aux` tiene el número de `referenceTargets`.

**Documentación:** README (contrato: `label`, ecuación numerada), las dos
guías, la invariante nueva y una decisión con el porqué: etiqueta en el bloque y
no en el contenido, numerar solo con etiqueta, palabra escrita por la aplicación
en vez de `cleveref`, y `number: null` antes que un número falso.

---

## U3.2 — Citas bibliográficas

**Objetivo:** citar libros con `\citep`/`\citet` en IEEE o APA, generar la
bibliografía sola y detectar cualquier cita rota antes de Overleaf.

### Modelo

- Estado: `references` (array) y `bibliography: { style: "ieee" | "apa",
  includeUncited: false }`. `DRAFT_VERSION = 6`; migra v1–v5 con
  `references: []` y el estilo `ieee`.
- Cada entrada:

  ```js
  {
    key: "stewart1994",
    authors: ["Stewart, J."], // uno por elemento: «Apellido, Iniciales»; iniciales opcionales
    year: "1994",
    title: "Cálculo",
    edition: "",               // entero ≥ 2 como texto, o vacío
    publisher: "Iberoamérica",
    place: "México",           // solo lo usa IEEE: APA 7 omite el lugar
    url: "",
    text: "",                  // texto libre: sustituye al formato de los campos
  }
  ```

- `validateReference(entry, existing)`, pura y con mensajes por campo:
  - `key` en `^[a-z0-9][a-z0-9-]*$`, única;
  - o `text` no vacío, o al menos un autor, título y año de cuatro cifras;
  - con estilo APA, una entrada de solo `text` necesita igualmente autor y año,
    porque la cita los imprime.
- `suggestReferenceKey(entry, existing)`: apellido del primer autor sin
  diacríticos y en minúsculas, más el año: `stewart1994`; si existe,
  `stewart1994b`, `stewart1994c`…
- **La clave no se edita mientras algún contenido la cite.** El campo se
  desactiva y dice por qué. Renombrar queda fuera de este paquete.
- **Escape:** los campos estructurados pasan por `escapeMetadata`, como los
  metadatos (INV-003). `text` llega **literal**, como el contenido (INV-002):
  es la salida para fuentes raras y es lo que hoy hace el bloque antiguo con
  cada línea, que la conversión traslada ahí. Escríbelo en la tabla de contrato
  del README.

### Generador

- **`natbib` se carga si hay alguna referencia o si algún contenido usa un
  comando de `natbib`** (`\citep`, `\citet`, `\citealt`, `\citealp`,
  `\citeauthor`, `\citeyear`, con o sin `*`). Sin eso, `\citep` sería un
  comando indefinido y el documento no compilaría. El `\cite` simple no basta
  para cargarlo: es del núcleo de LaTeX.
- Va justo después de `graphicx`, con su línea de comentario como los demás
  paquetes, y antes de las macros. Si U2 ya añadió `hyperref`, ese sigue
  siendo el último.
- Opciones: IEEE `[numbers,square,sort&compress]`; APA `[round,authoryear]`.
- Añade `natbib` a la lista blanca de INV-009 y a la prueba
  «el preámbulo solo carga paquetes de la lista blanca», con el caso condicional,
  igual que se hizo con `hyperref`. No cambia el porqué de la invariante.
- **Bibliografía:** antes de `\end{document}`, tras una línea en blanco, solo
  si hay entradas que imprimir (las citadas, o todas con `includeUncited`):

  ```tex
  \begin{thebibliography}{9}
  \bibitem[Stewart(1994)]{stewart1994} J.~Stewart, \emph{Cálculo}. México: Iberoamérica, 1994.
  \end{thebibliography}
  ```

  El argumento de `thebibliography` son tantos `9` como cifras tenga el número
  de entradas, como hoy.
- **Orden:** IEEE, por primera cita en orden de emisión (los comandos de cita,
  `\cite` incluido, de cada bloque y luego sus hijos), y después las no citadas
  en el orden del panel. APA: por apellido del primer autor
  (`localeCompare` con `es`, sensibilidad `base`), año y título.
- **Etiqueta de `\bibitem`:** un autor, «Stewart»; dos, «Larson y Hostetler»;
  tres o más, «Zill et~al.». Si dos entradas impresas comparten etiqueta y año,
  el año lleva `a`, `b`… por orden de título, en la etiqueta y en el texto APA.
- **Formato IEEE** (libro):
  `J.~Stewart, \emph{Cálculo}, 2.ª ed. México: Iberoamérica, 1994.`
  - Autores: «J.~Stewart»; dos, «R.~Larson y R.~Hostetler»; de tres a seis,
    «A, B y C»; más de seis, el primero seguido de `\emph{et al.}`.
  - Sin edición se omite «, 2.ª ed.»; sin lugar, «Iberoamérica, 1994.».
- **Formato APA 7** (libro):
  `Stewart, J. (1994). \emph{Cálculo} (2.ª ed.). Iberoamérica.`
  - Autores: «Larson, R. y Hostetler, R.»; de tres a veinte,
    «A, B, C y D», sin coma antes de la «y».
- Sin iniciales se escribe solo el apellido. `url`, si existe, se añade como
  ` \texttt{<url escapada>}`. Una entrada con `text` imprime ese texto tal cual
  tras su `\bibitem`.
- Sin referencias ni comandos de `natbib`, la salida no cambia en un solo
  byte. Esto incluye un documento con el bloque antiguo, que sigue generando lo
  mismo que hoy.

### Citar

- `completionToken` reconoce el argumento de `\cite`, `\citep`, `\citet` y
  demás, también tras un opcional (`\citep[p.~912]{`). La consulta es lo escrito
  tras el último `{` o `,`, para citar varias claves. Rótulo de cada opción:
  «Stewart (1994) · Cálculo». Aceptar inserta solo la clave.
- `TEXT_COMMANDS` suma `\citep{}` («Cita entre paréntesis») y `\citet{}`
  («Cita en la frase»). No sumes `\cite`: cambia de sentido con el estilo.
- Tras U2: el contexto `text` de `menus.js` suma «Citar», un submenú con «Entre
  paréntesis» (`\citep{#1}#0`) y «En la frase» (`\citet{#1}#0`). Con «Referir»
  de U3.1 son 8 sectores: no añadas más.

### Interfaz

Panel plegable «Referencias del documento» dentro de «Datos del documento»,
junto a «Macros del documento» y con su mismo patrón:

- Lista con «Editar referencia» y «Eliminar referencia»; eliminar una
  referencia citada pide confirmación y dice cuántas citas quedarán rotas.
- Campos: «Clave», «Autores» (uno por línea, «Apellido, Iniciales»), «Año»,
  «Título», «Edición», «Editorial», «Lugar», «Enlace» y «Texto libre»; botones
  «Guardar referencia» y «Cancelar referencia». La clave se propone al escribir
  el primer autor y el año, y se puede cambiar mientras no esté citada.
- «Estilo de citas» con dos opciones, IEEE y APA, y la casilla «Incluir
  también las no citadas».
- «Añadir las referencias del curso» añade las del temario y omite las claves
  que ya existan. «Guardar como referencias del curso» sustituye esa lista por
  las del documento actual, en `tex-notes:references-default:v1`, y la
  configuración portátil la exporta e importa. Un archivo de configuración sin
  ese campo sigue siendo válido.
- En la tarjeta de un bloque «Bibliografía (IEEE)» antiguo, «Convertir en
  referencias del documento»:
  - cada línea no vacía pasa a `{ key: "refN", text: <línea> }`, con la N de
    su posición, para que un `\cite{ref1}` escrito a mano siga valiendo;
  - si alguna clave ya existe, no cambia nada y lo explica;
  - el bloque se elimina con las reglas de cualquier cambio estructural:
    confirmación, cancelar la edición en curso, anunciar y devolver el foco.

### Referencias del curso

Constante `COURSE_REFERENCES` en un archivo nuevo, `assets/js/references.js`,
junto con las funciones puras de formato y orden. Cópialas de `temario.md`
**tal como están**; no completes datos de memoria. En particular, «Larson y
Hostetler» no trae iniciales y se queda sin ellas.

| Clave | Autores | Año | Título | Editorial | Lugar |
| --- | --- | --- | --- | --- | --- |
| `leithold1992` | Leithold, L. | 1992 | El cálculo con geometría | Harla | México |
| `spivak1993` | Spivak, M. | 1993 | Cálculo infinitesimal | Reverté | México |
| `stein1995` | Stein, S. | 1995 | Cálculo y geometría analítica | McGraw Hill | México |
| `stewart1994` | Stewart, J. | 1994 | Cálculo | Iberoamérica | México |
| `boyce1994` | Boyce, D. | 1994 | Cálculo | CECSA | México |
| `larson1995` | Larson; Hostetler | 1995 | Cálculo y geometría analítica | McGraw Hill | México |
| `swokowski1989` | Swokowski, E. | 1989 | Cálculo con geometría analítica | Iberoamérica | México |
| `zill1996` | Zill, D. | 1996 | Cálculo con geometría analítica | Iberoamérica | México |

### Comprobación previa

Amplía `checkDocument`:

| Caso | Severidad |
| --- | --- |
| Clave citada sin referencia | Error: el PDF mostraría «[?]» o «(?)» |
| Bloque de bibliografía antiguo con el estilo APA | Error: no compila |
| Bloque de bibliografía antiguo y bibliografía generada a la vez | Error: dos listas que empiezan en [1] |
| Entrada impresa sin autor o año con el estilo APA | Error |
| Referencia que nadie cita, sin «Incluir también las no citadas» | Aviso |

Los dos errores del bloque antiguo ofrecen la conversión.

### Pruebas

- `validateReference`, `suggestReferenceKey` y la clave bloqueada si está
  citada.
- Formato exacto en los dos estilos con 1, 2, 3 y 7 autores, sin iniciales, con
  edición, con enlace, con `&` o `_` en la editorial (se escapan) y con `text`
  (literal).
- Orden IEEE con citas en hijos y citas de varias claves; orden APA con acentos
  («Álvarez» antes que «Boyce»); letras de año.
- Condición de `natbib`: sin referencias ni comandos, preámbulo y ejemplo
  idénticos; con `\citep` y sin referencias, se carga.
- Migración v5 → v6; configuración con y sin referencias.
- Conversión del bloque antiguo, incluida la colisión de claves.
- Cada fila de la comprobación previa.
- **`pdflatex`** (omitida si no está): las ocho referencias del curso citadas
  en ambos estilos compilan sin «Citation undefined», y el orden de los
  `\bibcite` del `.aux` coincide con el calculado.

**Documentación:** README (contrato de `references` y `bibliography`, escape
de los campos frente a `text`, preámbulo condicional), las dos guías (todos los
rótulos nuevos en `docs/guia-de-uso.md`) y una decisión: datos estructurados,
`natbib` para los dos estilos, `\citep`/`\citet` en vez de `\cite`, bibliografía
al final, clave inmutable mientras esté citada y `text` literal.

---

## Ajustes que esto impone a U4

- Las instantáneas, las versiones y el archivo de proyecto guardan también
  `references` y `bibliography`, con el `DRAFT_VERSION` vigente (6 tras U3.2),
  no con el 4 que cita U4.
- `diffDocuments` compara las referencias por `key` (añadidas, eliminadas y
  modificadas), el estilo y la etiqueta de cada bloque.

## Revisión manual (añádela a `docs/revision-manual.md`)

- Compilar en Overleaf un documento con teoremas, ecuaciones y figuras
  etiquetados y las ocho referencias del curso, en IEEE y en APA; comparar cada
  número del menú con el PDF.
- Cambiar de estilo sin tocar el contenido y volver a compilar.
- En Android, que `\citep{` y `\ref{` abran el menú con Gboard. Si U0 confirmó
  que la composición bloquea las sugerencias, «Citar» y «Referir» del menú
  radial son la vía.
- Con TalkBack y con NVDA, recorrer el panel de referencias y sus errores.

## Informe

Uno por paquete en `claude.md`, como en U0–U5: qué hiciste, qué mediste, qué
decisiones e invariantes registraste y **qué no pudiste verificar**, en
particular si `pdflatex` se ejecutó o se omitió.
