<!-- Buzón transitorio. Puede vaciarse en cualquier momento.
     Las reglas permanentes están en PROTOCOLO.md.
     Antes de vaciar: promueve lo durable (invariante → INVARIANTES.md,
     justificación → decisiones/, rasgo del sistema → README.md). -->

# Encargo: navegación móvil con menús radiales y una arquitectura sin cajas negras

De: Claude · Fecha: 2026-11-23 · Rama base: `ccr-fd83b476-6mra7f`
Para: el agente que lo implemente (Codex, Astra u otro)

Dos frentes en un solo orden. Los paquetes **A** preparan el código para cambiar
sin miedo. Los paquetes **N** cambian la interfaz del teléfono. Se intercalan
porque cada N necesita algo de un A anterior. Las decisiones de producto ya
están tomadas con la persona usuaria. Lee todo el encargo antes de empezar: una
trampa de un paquete suele afectar a otro.

El encargo anterior (U0–U5, U3.1 y U3.2) está terminado. Su texto sigue en Git:
`git show dde3098:agents.md`. Sus informes están en `claude.md`.

---

## 0. Cómo trabajar

1. Lee `PROTOCOLO.md` e `INVARIANTES.md` antes de tocar nada. Hay dos reglas
   nuevas desde esta rama: INV-012 (el presupuesto de `app.js`) y DEC-029 (las
   pruebas de interfaz en Chromium).
2. Implementa los paquetes **en el orden de la sección 4**. Cada paquete termina
   con `npm test` en verde **con las pruebas de interfaz ejecutadas, no
   omitidas** (`TEX_UI_TESTS=required npm test`), en uno o varios commits
   propios. No mezcles paquetes en un commit.
3. Si algo del encargo contradice una invariante, una prueba guardiana o el
   código real, **detente y escribe la duda en `claude.md`**. No resuelvas la
   contradicción reescribiendo una prueba guardiana.
4. Si Chromium no arranca en tu entorno, dilo en el informe. Empuja la rama y
   toma como referencia el resultado de `.github/workflows/pruebas.yml`. No
   afirmes nada que no hayas visto funcionar.
5. Al terminar cada paquete, deja en `claude.md` un informe corto:
   - qué hiciste;
   - qué mediste, antes y después;
   - el tamaño de `app.js` antes y después;
   - **qué no pudiste verificar** y por qué.
6. Las decisiones nuevas toman el **siguiente número libre** de `decisiones/`.
   La última es DEC-031.

## 1. Lo que ya está hecho (no lo repitas)

| Commit | Qué |
| --- | --- |
| `79e1098` | Las sugerencias de `\` se desplazan con el dedo: la opción se acepta en `click`, no en `pointerdown`. Con la lista abierta, Anterior y Siguiente recorren las opciones. `placeSuggestions` coloca la lista por encima de la barra y del teclado. |
| `32a8862` | [DEC-029](decisiones/DEC-029-pruebas-de-interfaz-en-chromium.md): arnés `tests/navegador.mjs`, seis pruebas en `tests/interfaz.test.js` y CI en cada rama y PR con las pruebas de interfaz obligatorias. Reemplaza a DEC-007. |
| `dbac68d` | [DEC-030](decisiones/DEC-030-app-js-solo-cableado.md) e INV-012: el presupuesto en bytes de `app.js` solo baja. Mapa de secciones de `app.js` y tabla «Dónde va el código nuevo» en la [guía de desarrollo](docs/guia-de-desarrollo.md). |

## 2. Medición de partida

Chromium sin cabeza, Pixel 7 emulado (412 × 839 px CSS, sin teclado virtual),
título relleno y tres bloques de una línea: texto, definición y ecuación.

| Elemento | Medida |
| --- | --- |
| Altura total de la página | 6 093 px, unas 7,3 pantallas |
| Cabecera del sitio | 183 px |
| Inicio del editor / campo «Contenido» | 1 502 px / 2 054 px (2,4 pantallas) |
| Fila «Tipo de bloque» | 74 px a todo el ancho, más 74 px de «Título del bloque» |
| Vista previa de las matemáticas, abierta | 379 px bajo el editor |
| Párrafo de ayuda de «Estructura actual» | 264 px |
| Una tarjeta con una línea de contenido | 275 px: botones «Editar» y «Añadir dentro» a todo el ancho, más «Más acciones» |
| «Generar documento» / «Versiones» / «Preferencias de escritura» | 4 305 / 5 060 / 5 697 px |
| Barra del pulgar | 6 botones de unos 69 × 48 px: Menú, Anterior, Siguiente, Selección, Símbolos, Añadir |

Repite la medición con el guion del anexo A, al final de este archivo, al
terminar N1, N2, N3 y N4.

## 3. Decisiones ya tomadas (no las reabras)

**Tomadas hoy con la persona:**

- **Más menús radiales, dependientes del contexto.**
- **Se comprimen tres cosas:** el botón «Selección» de la barra, el campo
  «Tipo de bloque» y las acciones de las tarjetas de la estructura.
- **Menús personales** con editor dentro de la aplicación, que viajan también
  en el archivo de configuración JSON.
- **La navegación táctil no se limita a los menús.** Toda lista que se abre al
  escribir (`\`, `/`, `\ref{`, `\citep{`) se recorre con el dedo y con la barra.
- **Pruebas de interfaz con Playwright opcional** (DEC-029). Playwright no entra
  en `package.json`.

**Siguen vigentes desde U2:**

- Los gestos son aceleradores, nunca la única vía (WCAG 2.2, 2.5.7). Todo
  gesto nuevo tiene una ruta con toques visibles y otra con teclado.
- **Posiciones estables.** Ningún sector cambia de sitio por frecuencia de uso.
  Un sector **no disponible se muestra deshabilitado, no desaparece**, para que
  los demás no se muevan. Esta precisión es nueva y aplica a todos los menús.
- Como máximo 8 sectores por anillo, 44 px de arco en el radio medio y 44 px de
  grosor. Fragmentos con `#1`–`#9`, `#0` y `\#`.
- Atajos: nada con Alt+Mayús. La tecla Menú solo en «Contenido» (DEC-022).
- La pulsación larga dentro de «Contenido» queda para la selección de Android y
  no abre menús ([DEC-031](decisiones/DEC-031-pulsacion-larga-en-contenido.md)).
  Lo observado en el teléfono está en
  [resultados-android.md](diagnostico/resultados-android.md).

**Cambio respecto a U2.** Hoy la pulsación larga sobre una tarjeta carga el
bloque en el editor y abre el menú de su contenido. Desde N3 abre el **menú del
bloque**, con las acciones de la tarjeta. El menú del contenido se abre desde el
editor, igual que ahora. Razón: la persona pidió comprimir las acciones de la
tarjeta, y mezclar acciones de bloque y de contenido en un anillo de 8 no cabe.
Regístralo como decisión nueva en N3.

## 4. Orden

```
A1 → A2 → N1 → N2 → N3 → N4 → A3 → N5 → A5+N6 → A4
```

| Paquete | Qué | Necesita |
| --- | --- | --- |
| A1 | Pruebas de caracterización de la interfaz | — |
| A2 | Registro único de acciones y contexto puro | A1 |
| N1 | Barra del pulgar compacta: «Selección» pasa a ser un modo | A2 |
| N2 | «Tipo de bloque» como chip con menú radial | A2 |
| N3 | Tarjetas compactas y menú radial del bloque | A2 |
| N4 | Paneles en el teléfono (confirmado) | N1–N3 |
| A3 | Configuración portátil por partes | A1 |
| N5 | Menús personales | A2, A3, N1 |
| A5+N6 | Fuentes de sugerencias explícitas y listas táctiles en todas partes | A1; los datos del teléfono para la parte de Gboard |
| A4 | Informe local de errores | A1 |

## 5. Reglas transversales

R1–R7 del encargo anterior siguen vigentes. Este es su resumen. R8–R11 son
nuevas.

- **R1** — Toda edición programática del contenido conserva el deshacer
  (`applyFieldEdit`, DEC-016).
- **R2** — Los caracteres tecleados se leen en `beforeinput`, no en `keydown`.
- **R3** — Los botones de la barra, los sectores y las opciones de una lista no
  le quitan el foco al campo. Haz `preventDefault()` en `pointerdown` y actúa
  en `click`.
- **R4** — La lógica es pura, vive fuera de `app.js` y se prueba con
  `tests/load-app.mjs`.
- **R5** — Una sola fuente de verdad por catálogo. Desde A2, las acciones
  viven en `actions.js`.
- **R6** — Accesibilidad: roles, nombres, foco previsible, anuncios, 44 px y
  nada que dependa solo del color.
- **R7** — `examples/calculo-3.tex` no cambia ni un byte en todo el encargo.
- **R8 — Primero la prueba que falla.** Cada cambio de interacción llega con una
  prueba de interfaz. Si corrige un fallo, la prueba falla antes del arreglo:
  compruébalo como se hizo en `32a8862`.
- **R9 — Extraer antes de cambiar.** El paquete que toca una sección de
  `app.js` la saca primero a su propio script, **sin cambiar el
  comportamiento**: las pruebas de A1 siguen verdes. Después la modifica. En el
  commit de la extracción se rebaja el presupuesto de
  `tests/arquitectura.test.js` y se actualiza el mapa de la guía de desarrollo.
- **R10 — Controladores.** Un controlador es un script clásico que expone una
  fábrica:

  ```js
  T.createThumbBar(doc, deps) → { refresh(), dispose() }
  ```

  Recibe por `deps` todo lo que usa: campo, `announce`, `runAction` y lectores
  del estado. **No lee variables del cierre de `app.js`.** Solo toca el DOM al
  llamarse, nunca al cargar, así que el cargador de pruebas puras puede seguir
  cargándolo. Su lógica pura va en funciones aparte del mismo archivo o de
  otro, con prueba en Node.
- **R11 — Todo gesto está escrito.** Cada gesto nuevo aparece en
  `docs/guia-de-uso.md` junto a su ruta visible. Si no tiene ruta visible, no
  se implementa.

---

## A1 — Pruebas de caracterización

**Objetivo:** fijar el comportamiento actual de todo lo que N1–N6 van a tocar,
antes de mover una línea. Si una extracción cambia algo, una de estas pruebas
lo dice.

Archivos, uno por área y cada uno con menos de 12 pruebas:
`tests/interfaz-editor.test.js`, `tests/interfaz-estructura.test.js`,
`tests/interfaz-menus.test.js`, `tests/interfaz-escritura.test.js` y
`tests/interfaz-versiones.test.js`. El inventario los recoge solo porque están
en `tests/`.

Amplía `tests/navegador.mjs` con:

- `mantener(sesion, punto, ms)`: pulsación larga táctil;
- `arrastrar(sesion, puntos)`: un dedo que recorre una lista de puntos;
- `codigo(pagina)`: pulsa «Generar documento» y devuelve el `.tex`;
- `foco(pagina)`: el `id` del elemento activo.

Casos mínimos:

| Área | Casos |
| --- | --- |
| Editor | Añadir con el botón y con Ctrl+Intro; editar y cancelar; el foco tras añadir; cambiar de tipo actualiza las ayudas; imagen con sus campos |
| Estructura | Editar, Añadir dentro, Duplicar, Subir, Bajar, Eliminar con confirmación, Copiar bloque y Pegar bloque; dónde queda el foco tras cada uno; Deshacer cambio y Rehacer cambio |
| Menús | Los cuatro contextos desde el botón de la barra, la pulsación larga en tarjeta y en zona vacía, el clic derecho y Mayús+F10; arrastre desde la barra hasta un sector; fragmento con selección (la selección ocupa `#1`); submenú Griegas; cancelación por segundo dedo |
| Escritura | Autocierre; Tab entre huecos; alias; `/` con un tipo; `\ref{` y `\citep{` ofrecen destinos; selección por alcance: activar, ampliar y reducir; hoja de símbolos |
| Versiones | Guardar, comparar y restaurar; exportar e importar el proyecto; recuperar la sesión tras recargar |

Reglas de estas pruebas:

- Comprueban lo visible y el `.tex` generado. **No leen el estado interno de
  `app.js`**: si la prueba necesita un dato que no se ve, la interfaz tiene un
  problema de accesibilidad.
- Cada prueba abre un contexto nuevo, con almacenamiento vacío.
- Nada de `waitForTimeout` salvo para los 400 ms de la pulsación larga. Espera
  con `locator.waitFor()` o `expect.poll` sobre el estado visible.
- La suite de interfaz completa debe tardar menos de 60 s.

CI: añade a `pages.yml` la misma instalación de Playwright que tiene
`pruebas.yml` y `TEX_UI_TESTS: required`. Así `main` no se publica con las
pruebas de interfaz omitidas.

**Trampas:**

- IndexedDB funciona por `file://` en Chromium (lo verificó U4).
- `navigator.vibrate` no existe sin cabeza. La llamada ya es opcional.
- El portapapeles por `file://` puede rechazar los permisos. Si
  `grantPermissions` no basta, prueba «Copiar texto» por su anuncio y dilo en
  el informe.
- El arrastre desde la barra abre el menú **sin esperar** y la pulsación larga
  en una tarjeta espera 400 ms. No las confundas en `mantener`.

**Terminado:** las cinco áreas cubiertas, verdes en local y en CI, la guía de
desarrollo lista los archivos de interfaz y el inventario está regenerado.

---

## A2 — Registro único de acciones y contexto puro

**Problema:** una acción se define hoy en cuatro sitios que no se conocen:

- `RADIAL_COMMANDS` en `menus.js` con su implementación en `radialCommands`, en
  `app.js`;
- los oyentes de cada botón de la barra;
- los manejadores de `SHORTCUTS`, repartidos por `app.js`;
- los `data-action` de las tarjetas.

Los menús personales (N5) necesitan un catálogo del que elegir. El menú del
bloque (N3) necesita llamar por id a las acciones de la tarjeta.

**Diseño:**

- `assets/js/actions.js`, puro, después de `shortcuts.js` y antes de `menus.js`:

  ```js
  T.ACTIONS = [
    { id: "block.duplicate", label: "Duplicar", icon: "⧉", contexts: ["card"] },
    { id: "block.up", label: "Subir", icon: "↑", contexts: ["card"], enabled: c => c.position > 0 },
    { id: "write.list", label: "Lista", icon: "•", contexts: ["text"] },
    { id: "edit.undo", label: "Deshacer", icon: "↶", contexts: ["text", "formula", "image"] },
    // …
  ];
  T.actionById(id); T.actionsFor(context);
  T.actionContext({ source, blockKind, mathMode, scopeMode }) // → "formula" | "text" | "image" | "card" | "global"
  ```

- `enabled(c)` es una función pura sobre un resumen del contexto
  (`{ position, siblings, container, hasTray, hasSelection… }`). Decide si el
  sector o el botón se deshabilita, nunca si desaparece.
- `actionContext` saca de `openRadial` la decisión de qué menú abrir, que hoy
  vive en `app.js`, y la prueba. Por ejemplo: una ecuación da `formula`; un
  texto con el cursor en matemáticas, también; una imagen da `image`.
- `menus.js` referencia comandos por id (`{ action: "block.duplicate" }`). Los
  tipos `insert`, `symbol` y `submenu` siguen igual. `RADIAL_COMMANDS`
  desaparece.
- `app.js` registra las implementaciones con
  `T.registerActionHandlers({ "block.duplicate": (args, origen) => … })`. La
  barra, los menús, las tarjetas y los atajos llaman a una sola función,
  `T.runAction(id, args, origen)`. Cada manejador es cableado: si tiene una
  regla, la regla va a un script puro.

**Pruebas:**

- Coherencia, en Node: ids únicos; cada id referido por menús, barra y atajos
  existe; contextos conocidos; `actionContext` con su tabla de casos.
- Interfaz: en la página, cada `ACTIONS[i].id` tiene manejador
  (`Object.keys(TexNotes.actionHandlers)`).
- Las pruebas de A1 siguen verdes sin tocarlas.

**Terminado:** comportamiento idéntico, presupuesto rebajado y la receta
«Añadir una acción» en la guía de desarrollo. Esa receta sustituye al párrafo
sobre `radialCommands`.

---

## N1 — Barra del pulgar compacta

**Antes:** seis huecos iguales de unos 69 px con rótulo. «Selección» ocupa uno
entero y casi no se usa.

**Después:**

```
[✥ Menú] [◀][⌶][▶] [Ω Símbolos] [★ Mi botón] [＋ Añadir]
```

- **Grupo de navegación:** tres botones de 48 px, solo con icono y con nombre
  accesible («Anterior», «Siguiente» y el del modo). Ocupa unos 150 px, frente a
  los 207 de hoy.
- **Botón de modo**, en lugar de «Selección». Muestra qué harán ◀ y ▶:

  | Icono | Modo | Cuándo |
  | --- | --- | --- |
  | `⌶` | Cursor: huecos y luego unidades LaTeX | por defecto |
  | `↔` | Selección por alcance | al tocar el botón de modo (`aria-pressed`) |
  | `≡` | Sugerencias | solo mientras hay una lista abierta. Tocar el botón cierra la lista: es el Escape táctil |

  La regla es pura: `thumbMode({ listOpen, scopeMode })`. Cada cambio de modo se
  anuncia.
- **Mi botón:** ejecuta una acción asignada (A2). Por defecto, `edit.undo`, el
  deshacer del contenido, porque el teclado del teléfono no tiene Ctrl+Z. N5
  permite cambiarlo.
- **Símbolos:** tocar abre la hoja como hoy. Arrastrar abre un anillo de
  categorías (Recientes, cinco grupos frecuentes y «Más…») y soltar abre la
  hoja en esa categoría. Es un acelerador.
- **Aceleradores del grupo de navegación:**
  - arrastrar en horizontal avanza o retrocede una unidad cada 28 px, con
    vibración en cada paso. `scrubSteps(dx, paso)` es pura;
  - mantener ▶ activa la selección y amplía una vez.

  Escríbelos en la guía de uso (R11).
- **A 320 px:** `44 + 3·48 + 3·44 = 320`. Por debajo de 360 px los rótulos se
  ocultan y queda solo el icono, con su nombre accesible.

**R9:** primero extrae la sección `const thumbBar` y la selección por alcance a
`assets/js/thumb-bar.js`, con la fábrica de R10.

**Trampas:**

- R3. El arrastre horizontal no debe desplazar la página: pon
  `touch-action: none` solo en el grupo de navegación.
- La selección por alcance y los tiradores nativos de Gboard pueden pelear.
  Anótalo para la revisión manual.

**Pruebas:**

- Puras: `thumbMode` y `scrubSteps`.
- Interfaz:
  - el ciclo de modos;
  - ◀ y ▶ en cada modo;
  - el botón de modo cierra la lista de sugerencias;
  - Mi botón deshace;
  - a 320 px no hay desbordamiento y todo objetivo mide al menos 44 px;
  - el foco sigue en «Contenido».

---

## N2 — «Tipo de bloque» como chip

**Antes:** etiqueta y `<select>` a todo el ancho (74 px), más «Título del bloque
(opcional)» (otros 74 px).

**Después, solo con `(pointer: coarse)`:** una fila en la cabecera del editor:

```
Nuevo bloque · [¶ Texto ▾] [＋ Título]
```

- **El chip de tipo** abre el anillo «Tipo» al tocarlo. El anillo tiene 7 tipos
  más «Más…». Arrastrar desde el chip elige por dirección.
- **«Más…»** llama a `select.showPicker()` y, si no existe, enfoca el
  `<select>`.
- El anillo de tipos es **uno solo**: el submenú «Nuevo bloque» del menú
  general y el chip usan la misma definición en `menus.js`.
- **El `<select>` se queda en el DOM.** INV-005 compara sus opciones con la
  tabla de tipos. En el teléfono se oculta recortado, no con `display: none`,
  porque `showPicker()` exige que el elemento esté dibujado. Lleva
  `tabindex="-1"` y `aria-hidden="true"`. El chip es el control accesible:
  `aria-haspopup="menu"` y nombre «Tipo de bloque: Texto».
- **El título vacío se pliega** en el chip «＋ Título», o «＋ Pie» en una imagen.
  Al tocarlo aparece el campo y recibe el foco. El sector «Título» del menú de
  texto hace lo mismo.
- El escritorio no cambia.

**R9:** las partes del formulario que toca, al script que les corresponda.

**Trampas:**

- `tests/documentacion.test.js` exige que «Tipo de bloque» y «Título del
  bloque (opcional)» sigan siendo rótulos reales.
- `showPicker()` necesita una activación del usuario. Desde un sector
  radial la hay; desde el teclado, compruébalo.

**Pruebas (interfaz):**

- el chip muestra el tipo actual;
- elegir «Definición» en el anillo cambia el tipo, las ayudas y la vista previa;
- la ruta «Más…»;
- el chip de título;
- el escritorio conserva el `<select>`;
- el campo «Contenido» sube al menos 140 px en el teléfono.

---

## N3 — Tarjetas compactas y menú del bloque

**Antes:** 275 px por tarjeta de una línea. **Objetivo:** como mucho 140 px.

- **Cabecera en una línea:** `1 · Texto` y el nivel abreviado («N1 · raíz»),
  siempre con texto.
- **Vista previa** limitada a 3 líneas. Si no cabe, aparece «Ver todo».
- **Fila de acciones** con tres botones de icono de 44 px:
  - `✎` Editar;
  - `↳` Añadir dentro, solo en contenedores;
  - `⋯` Acciones, que abre el menú del bloque en modo toque.

  Conservan los nombres accesibles largos de hoy, los que incluyen el sujeto.
- **Menú del bloque** (contexto `card`, 8 sectores fijos, en sentido horario
  desde arriba):

  ```
  Subir · Duplicar · Copiar bloque · Copiar texto · Bajar · Mover… · Eliminar · Pegar dentro
  ```

  «Subir» arriba y «Bajar» abajo, como en el espacio. Un sector no disponible
  se deshabilita y no desaparece: «Subir» en el primero, «Pegar dentro» sin
  bandeja o en una hoja.
- La **pulsación larga** sobre la tarjeta abre este menú en modo arrastre
  (cambio respecto a U2; regístralo como decisión).
- En el teléfono, `⋯` sustituye a «Más acciones». En el escritorio
  «Más acciones» se queda.
- **La ayuda de «Estructura actual»** pasa a un `<details>` cerrado,
  «Cómo funciona la estructura». `tests/check-site.mjs` busca hoy el `<p>` justo
  después del `<h3>`. Ajusta esa comprobación estructural, que no es guardiana
  de ninguna invariante, y dilo en el commit.
- «Menú general», «Deshacer cambio» y «Rehacer cambio» quedan en una sola fila.

**R9:** extrae «Lista anidada» a `assets/js/structure-view.js`. Los
`blockItemExtensions` que hoy añaden botones a «Más acciones» se convierten en
**acciones de A2** con su `enabled`:

- Mover, de [E];
- convertir la bibliografía, de Referencias;
- guardar como plantilla, de [G].

Los que decoran el `article` siguen siendo extensiones: los avisos de [D] y el
resumen de imagen de [B].

**Pruebas (interfaz):**

- una tarjeta de una línea mide como mucho 140 px a 412 px de ancho;
- `⋯` abre 8 sectores con sus estados deshabilitados;
- Duplicar y Eliminar dejan el foco donde hoy;
- la pulsación larga abre el menú del bloque;
- con teclado, Intro sobre `⋯` abre el menú con el foco en el primer sector;
- las pruebas de estructura de A1 siguen verdes.

---

## N4 — Paneles en el teléfono

**Confirmado por la persona el 2026-11-23: paneles, no una sola página.** Los
puntos marcados con ◆ se hacen igualmente.

- Con `(pointer: coarse) and (max-width: 47.99rem)`, la página pasa a cuatro
  paneles. Una barra de pestañas fija arriba, de 48 px, los selecciona:

  | Pestaña | Contenido |
  | --- | --- |
  | **Escribir** | el editor |
  | **Estructura** | las tarjetas |
  | **Documento** | datos, referencias, macros, generar y código |
  | **Más** | versiones, preferencias y atajos |

  Se marca como `role="tablist"`, con flechas, Inicio y Fin. Solo se ve un
  panel; los demás llevan `hidden`.
- Los destinos de «Ir a…» y el botón `✎` de una tarjeta cambian de panel antes
  de enfocar.
- La barra del pulgar solo aparece en «Escribir». En los otros paneles, un
  botón `✥` en la barra de pestañas abre el menú general.
- ◆ La cabecera del sitio se reduce al `h1` en una línea.
- ◆ «Vista previa de las matemáticas» empieza cerrada en el teléfono. Recuerda
  la última elección del dispositivo en `localStorage`.
- ◆ «Datos del documento» se pliega cuando ya hay título. Ya existe: verifica.
- El escritorio conserva sus dos columnas.

**Trampas:**

- El foco al cambiar de panel.
- El enlace de salto.
- La posición de desplazamiento de cada panel.
- Las funciones que usan `scrollIntoView`, como `goTo` y `revealThumbField`.
- Los anuncios: «Panel Estructura, 3 bloques».
- Un aviso de la comprobación previa debe llevar a su bloque aunque esté en otro
  panel.

**Pruebas:** cada destino de «Ir a…»; `✎` desde Estructura; el teclado en las
pestañas; ningún panel mide más de dos pantallas con 5 bloques de una línea.

---

## A3 — Configuración portátil por partes

**Problema:** `portableConfig`, `applyPortableConfig` y `validateConfiguration`
enumeran a mano alias, plantillas, preferencias, macros y referencias. N5 añade
menús, y cada función futura añadirá otra parte a tres sitios a la vez.

**Diseño:**

- `assets/js/config-parts.js`, puro, con:
  - `T.registerConfigPart({ key, version, defaults, validate, migrate })`;
  - `T.buildConfig(values)`;
  - `T.validateConfig(data)`;
  - `T.migrateConfig(data)`.
- El archivo pasa a `version: 2` y migra desde la 1 sin pérdida.
- Una parte desconocida se ignora y se avisa. Una que falta conserva el valor
  actual.
- `app.js` solo aporta, por parte, cómo leerla y cómo aplicarla.

**Pruebas:**

- un archivo v1 real, exportado hoy y guardado en
  `tests/fixtures/config-v1.json`, se importa idéntico;
- ida y vuelta;
- errores por campo;
- una parte desconocida.

---

## N5 — Menús personales

**Modelo**, en `assets/js/menu-config.js`, puro:

```js
{ kind: "notas-latex-menus", version: 1,
  rings: [ { id: "m-calculo", label: "Cálculo", replaces: "formula" | null,
             slices: [ /* 8 posiciones; null = la predeterminada o vacía */ ] } ],
  button: "edit.undo" }  // acción de «Mi botón»
```

**Qué puede ser cada sector:**

- `{ action: id }`: una acción de A2;
- `{ symbol: id }`: un símbolo del tablero;
- `{ snippet, label, icon }`: un fragmento con `#N`;
- `{ submenu: [...] }`: un submenú de un solo nivel, como en los predeterminados;
- `{ ring: id }`: un enlace a otro anillo personal.

**Contexto:**

- `replaces: "formula"` hace que ese anillo **sustituya** al predeterminado de
  fórmula. Las posiciones las fija la persona y la aplicación no las reordena
  nunca.
- Con `replaces: null`, el anillo se abre desde Mi botón o desde un sector
  `{ ring }`.
- Dos anillos no pueden sustituir el mismo contexto.

**Validación pura**, con un error por campo:

- como mucho 8 sectores, y `fitMenu` cumple 44 px;
- ids únicos;
- acciones y símbolos existentes;
- fragmentos que pasan `validSnippetMarkers`;
- sin ciclos entre enlaces;
- como mucho 6 anillos;
- rótulo de 1 a 24 caracteres e icono de 1 a 3.

Un fragmento de fórmula o de texto que KaTeX no representa da un aviso, sin
bloquear el guardado.

**Editor**, en Preferencias de escritura, sección «Mis menús»:

1. Eliges un anillo: uno de los predeterminados (para sustituirlo) o uno nuevo.
2. Ves el anillo dibujado en estático, con la vista de `radial.js` fuera de la
   capa flotante. Las 8 posiciones tienen nombre: «Arriba», «Arriba a la
   derecha», etc.
3. Tocar una posición abre una hoja con cinco pestañas:
   - Fragmento: área de texto, vista previa con KaTeX y validación;
   - Símbolo: la búsqueda del tablero;
   - Acción: la lista de A2 filtrada por contexto;
   - Submenú;
   - Vacío.
4. «Intercambiar con…» mueve un sector sin arrastrar. El arrastre es solo un
   acelerador.
5. «Restaurar esta posición» y «Restaurar el menú».

**Persistencia:** `tex-notes:menus:v1`, como parte de la configuración portátil
(A3). Importar valida antes de pedir confirmación, igual que hoy.

**Pruebas:**

- Puras: validación, resolución (predeterminado más personal según el
  contexto), ciclos y migración.
- Interfaz:
  - crear en Preferencias un anillo con dos sectores que sustituye al de
    fórmula;
  - abrirlo con Menú en una ecuación y aplicar el fragmento;
  - asignar Mi botón;
  - exportar e importar la configuración.

---

## A5 + N6 — Fuentes de sugerencias explícitas y listas táctiles en todas partes

**A5. Cerrar las ranuras tardías** (las dos trampas del mapa de la guía).

- Crea `T.createSuggestionSources()`. Se registran por orden:
  - `/` (de [G]);
  - referencias y citas;
  - comandos y entornos.

  Cada fuente define:

  ```js
  { id, match(estado, evento, modo) → token | null, entries(token), accept(entrada, token) → edición | false }
  ```

- `specialCompletions` y `acceptSpecialCompletion` desaparecen.
- `closeAssistMenu` tiene **un solo dueño**. [G] se suscribe al cierre en vez
  de envolverlo.
- Extrae la lista a `assets/js/suggestion-list.js`, un controlador que usan
  todas las fuentes.

**N6. Listas táctiles en todas partes.**

- Prueba en la interfaz que `/`, `\ref{` y `\citep{` heredan el arreglo de
  `79e1098`: se desplazan con el dedo, ◀ y ▶ las recorren y `≡` las cierra.
- Comprueba con `deslizar` que la lista de destinos de «Mover bloque» se
  desplaza con el dedo.
- **Gboard.** La persona comprobó el 2026-11-23 en su teléfono que las
  sugerencias de `\` y los menús funcionan con Gboard, y que la barra queda
  sobre el teclado. **No cambies el manejo de la composición.**
  - `LONG_PRESS_IN_FIELD` queda en `false` por decisión (DEC-031). No lo
    toques.

---

## A4 — Informe local de errores

En el teléfono no hay consola. Escucha `error` y `unhandledrejection` y guarda
los 20 últimos errores en `tex-notes:errors:v1`, con:

- mensaje;
- las 3 primeras líneas de la pila;
- fecha;
- qué estaba abierto.

Al primer error de la sesión aparece un aviso discreto con «Copiar informe».
En «Más» queda «Informe de errores», con «Copiar informe» y «Borrar informe».
No se envía nada a ningún sitio (INV-006). El formato es puro, en
`error-report.js`.

**Prueba de interfaz:** un error lanzado en la página muestra el aviso, y el
informe contiene el mensaje.

---

## 6. Cómo probar

```sh
npm install --no-save --no-package-lock playwright@1.63.0
npx playwright install chromium
TEX_UI_TESTS=required npm test
npm run check:js
```

En el teléfono, con USB: `python3 -m http.server 8000` y
`adb reverse tcp:8000 tcp:8000`; abre `http://localhost:8000/` en Chrome. La
lista de revisión manual está en [docs/revision-manual.md](docs/revision-manual.md).
Añade allí, por paquete, lo que el Chromium emulado no prueba:

- la barra con Gboard abierto;
- el arrastre con una mano;
- TalkBack en el chip, el modo y el menú del bloque;
- los paneles con el teclado virtual.

## 7. Fuera de este encargo

- **Instalación sin conexión** (manifest y service worker bajo https). Sigue
  siendo el siguiente paquete recomendado para la clase con mala red.
- **Reordenar menús por uso.** Prohibido, no aplazado.
- **Varios documentos en una biblioteca**, **edición visual de fórmulas** y
  **Python**. Sin decidir.

## 8. Informe final

Al terminar A4, deja en `claude.md`:

- una tabla por paquete;
- la medición del anexo A antes y después de N1–N4;
- el presupuesto de `app.js` al empezar y al terminar;
- las decisiones e invariantes nuevas;
- **la lista exacta de lo no verificado**;
- si algo de este encargo resultó equivocado al contrastarlo con el código.

---

## Anexo A — Medición con Playwright

```js
const { chromium, devices } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ ...devices["Pixel 7"] })).newPage();
  await page.goto("file://" + process.cwd() + "/index.html");
  await page.fill("#note-title", "Prueba");
  for (const [type, text] of [["text", "Sea $f$ una función."], ["definition", "Una función es continua si..."], ["equation", "\\int_a^b f(x)\\,dx"]]) {
    await page.selectOption("#block-type", type);
    await page.fill("#block-content", text);
    await page.tap("#thumb-add");
  }
  console.log(await page.evaluate(() => {
    const top = s => { const b = document.querySelector(s)?.getBoundingClientRect(); return b && Math.round(b.top + scrollY); };
    return {
      alto: document.documentElement.scrollHeight,
      contenido: top("#block-content"),
      estructura: top(".structure-panel"),
      generar: top("#generate"),
      tarjetas: [...document.querySelectorAll("#block-list article")].map(a => Math.round(a.getBoundingClientRect().height)),
    };
  }));
  await browser.close();
})();
```

Con N2, `selectOption` sobre un `<select>` oculto sigue funcionando. Con N4,
mide cada panel por separado.
