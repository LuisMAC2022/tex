# Encargo de Claude para Codex — rediseño del tablero de símbolos

Codex: este archivo se reinició a propósito. Todo lo anterior (bitácoras de
incrementos pasados) ya está en el historial de git y en el README; aquí queda
solo el encargo vivo. **El análisis es mío; la implementación es tuya.** Cuando
quieras responderme, `claude.md` sigue siendo el canal.

## 0. Qué pidió el usuario

Textual, para que no se pierda el matiz:

> «Quiero que trabajemos sobre la tabla de elementos. Es a la vez demasiado
> grande y muy poco extensa. Busco tener todo el alfabeto griego, más símbolos,
> más posibilidades enfocadas a teoría de conjuntos y el temario en general. Sin
> embargo es demasiado estorbosa y si agregamos elementos va a serlo más, por lo
> que toca hacer rediseño de su funcionamiento. Me gusta a medias, pero analiza
> cómo se pueda mejorar para que se incluyan más símbolos y ocupe menos espacio.
> Quizás no ponerla al final del bloque.»

«Tabla de elementos» = el tablero de símbolos (`.symbol-board` en `index.html`,
`assets/js/math-symbols.js`, el bloque `/* --- Tablero de símbolos --- */` de
`app.js` y las reglas `.symbol-*` de `styles.css`).

Las dos mitades del encargo se contradicen con el diseño actual: **más símbolos
y menos espacio**. Por eso no basta con añadir entradas al catálogo ni con
recortar el CSS. Hay que cambiar de qué depende la altura del tablero.

## 1. Lo que medí (esto no es opinión)

Conduje Chromium sobre `index.html` y medí el DOM real. Todo lo de abajo es
reproducible; el script está en el historial de esta sesión, no en el repo.

**Estado actual, con los 30 símbolos que hay hoy:**

| Medida | Escritorio 1280×800 | Móvil 390×844 |
|---|---|---|
| Altura del tablero abierto | **1355 px** (1,7 pantallas) | **2518 px** (3,0 pantallas) |
| Cuánto baja `#add-block` al abrirlo | **+1304 px** | **+2467 px** |
| Hueco entre el final del `textarea` y «Añadir bloque» | **1522 px** | **2925 px** |
| Crecimiento del documento entero | 3158 → 4462 px | 4207 → 6674 px |

**Extrapolación medida (no calculada a mano): cloné los botones del tablero real
hasta 200 y volví a medir.** 200 es el orden de magnitud que pide el usuario
(alfabeto griego completo ≈ 41, más conjuntos, topología, derivadas, integrales
y estructura).

| Diseño, con 200 símbolos | Escritorio | Móvil |
|---|---|---|
| **A)** El de hoy: tarjeta glifo + nombre + comando, `minmax(9rem, 1fr)` | **3933 px** (4,9 pantallas) | **11062 px** (13,1 pantallas) |
| **B)** Botón compacto solo glifo, `minmax(2.75rem, 1fr)` | 824 px (1,0) | 2216 px (2,6) |
| **C)** Compacto **y** un solo grupo visible a la vez (33 de 200) | **124 px** (0,15) | **364 px** (0,43) |

El usuario tiene razón y se puede cuantificar: con el diseño de hoy, cumplir su
petición de contenido cuesta **once pantallas de móvil** de tablero.

**Recorrido por teclado**, medido con los mismos 30 símbolos: entre
`#block-content` y `#add-block` hay **33 paradas de tabulador**. A 200 símbolos
serían unas 203 paradas entre el campo donde se escribe y el botón que añade el
bloque.

**Inserción a ciegas**, medida: para ver el último grupo del tablero en una
ventana de 800 px hay que desplazarse hasta que el `textarea` quede **706 px por
encima del borde superior**. Es decir: hoy, al pulsar un símbolo de los grupos
de abajo, no se ve dónde cae.

## 2. Las cuatro causas

No es un problema, son cuatro, y hay que atacarlos por separado.

1. **La altura del tablero es O(n).** Es *la* causa. Mientras cada símbolo
   aporte altura, cualquier catálogo grande es inusable. Todo lo demás son
   consecuencias.
2. **La tarjeta triplica la información.** Cada botón repite glifo, nombre y
   comando en tres líneas de 87 px de alto y 9 rem de ancho. Eso está bien para
   30 símbolos, que es lo que se diseñó; a 200 significa 600 cadenas de texto
   compitiendo entre sí. Y el dato repetido no se puede leer en paralelo: quien
   busca «para todo» mira un botón cada vez.
3. **La posición rompe el gesto.** El tablero vive *dentro* del `fieldset`
   «Nuevo bloque», entre el `textarea` y la fila de botones. Abierto, mete 1304
   px (escritorio) o 2467 px (móvil) entre el campo que edita y el botón que
   confirma. Esto es literalmente lo «estorboso»: no separa el tablero del resto
   de la página, separa el campo de su propia acción.
4. **El recorrido por teclado es O(n).** Cada botón es una parada de tabulador.
   El proyecto es accesible por teclado por requisito, no por adorno; 203
   paradas lo incumplen aunque todos los `aria-label` estén bien puestos.

## 3. Lo que NO está roto — no lo «arregles»

- **`insertAtSelection` está bien.** Es pura, está probada con 8 casos y maneja
  selección invertida, índices fuera de rango y UTF-16. **Amplíala, no la
  reescribas** (ver §4.7), y que sus pruebas actuales sigan pasando tal cual.
- **`filterMathSymbols` / `normalizeSearchTerm` están bien.** Escalan a 200 sin
  tocarlas. Sí hay que cambiar *cuándo* se aplica el filtro (ver §4.6).
- **El catálogo pequeño no es un defecto de código**, es una carencia de
  contenido. `math-symbols.js` documenta que es «deliberadamente pequeño»: esa
  frase caduca con este encargo, bórrala.
- **La delegación de eventos y el render desde el catálogo están bien.** Añadir
  un símbolo sigue sin tener que tocar HTML ni CSS. Consérvalo.

## 4. El rediseño que te encargo

### 4.1 La regla que gobierna todo: presupuesto de altura fijo

**La altura del tablero debe dejar de depender del número de símbolos.**

Presupuesto duro, para cualquier tamaño de catálogo:

- **≤ 20 rem (320 px) en escritorio**
- **≤ 25 rem (400 px) por debajo de 38 rem de ancho**

Con los 30 símbolos de hoy son 1355 px; con 200 serían 3933. Si al terminar el
tablero mide más que el presupuesto con 200 símbolos cargados, el rediseño no
está hecho, por bonito que haya quedado. **Mídelo, no lo estimes.**

### 4.2 Muelle pegado al campo, no sección al final del bloque

Responde a la causa 3 y a la última frase del usuario.

El tablero deja de ser una sección con su propio borde que vive al final del
formulario, y pasa a ser **una barra de herramientas del campo de contenido**:
pegada inmediatamente debajo del `textarea`, sin margen ni borde que la separe
de él, de modo que se lea como parte del campo y no como un apartado aparte.
«Añadir bloque» queda a 20 rem del `textarea` en el peor caso, no a 1522 px.

Con el presupuesto de §4.1 cumplido, el tablero puede quedarse **abierto por
defecto**: ya no estorba. Mantén el `<details>` para poder plegarlo, pero con
`open`. El `<summary>` actual envuelve un `<h3>`; si lo conservas, que el
encabezado siga siendo un `h3` real y siga habiendo un único `h1` en la página
(`check-site.mjs` lo comprueba).

No inventes ventanas flotantes, `position: fixed`, modales ni arrastre. El
proyecto no tiene ninguno de esos gestos y no es el momento de estrenarlos.

### 4.3 Botón compacto y **una sola** línea de detalle

Responde a la causa 2.

- El botón visible muestra **solo el glifo Unicode**. Tamaño mínimo
  **2.75 rem × 2.75 rem** (44 px, el mínimo táctil que ya exige el README, línea
  215). Medido a 320 px de ancho da 46×44 px en 4 columnas: cumple.
- **El nombre y el comando no desaparecen: se centralizan.** Añade una única
  línea de detalle en el muelle que muestra `nombre — comando` del símbolo que
  tiene el foco o el puntero. Pasas de 200 etiquetas repetidas a una sola, que
  además es más fácil de leer que un texto de 0,75 rem dentro de un botón.
- **Esa línea es `aria-hidden="true"`, puramente visual.** Cada botón ya lleva
  su `aria-label` completo (`symbolAccessibleName`), así que un lector de
  pantalla ya dice «Insertar cuantificador universal, comando barra invertida
  forall» al enfocarlo. Si además la línea fuese una región activa, lo diría dos
  veces. **No la hagas `role="status"`.** El contador de resultados de la
  búsqueda sí sigue siendo `role="status"`; son dos cosas distintas.
- Conserva `symbolAccessibleName` y `describeCommand` tal como están: son
  exactamente lo que hace que un botón sin texto siga siendo accesible.

### 4.4 Un grupo a la vez

Responde a la causa 1, y es lo que más altura ahorra (columna C de la tabla).

- Un selector de categoría por encima de la rejilla: una fila de `<button>`
  nativos con `aria-pressed="true|false"`, uno por grupo. Sin `role="tablist"`:
  es un filtro, no un panel de pestañas, y no hace falta el patrón ARIA
  completo. Diez o doce chips son diez o doce paradas de tabulador, que es un
  coste aceptable; doscientos botones no lo era.
- Solo se renderiza o se muestra el grupo activo. Si eliges renderizar el
  catálogo entero y ocultar lo demás, comprueba que el coste de arranque con 200
  símbolos sigue siendo imperceptible al abrir por `file://`; si no, renderiza
  solo el grupo activo.
- La rejilla lleva además `max-block-size` (≈ 8.5 rem en escritorio, ≈ 14 rem en
  móvil) con `overflow-y: auto`, para que ni el grupo más largo pueda romper el
  presupuesto de §4.1. Enfocar un botón lo desplaza a la vista solo; no
  programes desplazamiento a mano.

### 4.5 Una sola parada de tabulador en la rejilla

Responde a la causa 4. Patrón de barra de herramientas con `tabindex` móvil:

- La rejilla es `role="toolbar"` con `aria-orientation="horizontal"` y un
  nombre accesible (el del grupo activo).
- Un único botón tiene `tabindex="0"`; el resto, `tabindex="-1"`. Tabular entra
  en la rejilla y vuelve a salir a la siguiente parada del formulario.
- **Flecha izquierda / derecha** mueven el foco al botón visible anterior o
  siguiente, con ajuste circular. **Inicio / Fin** van al primero y al último.
  **Enter** y **Espacio** insertan (comportamiento nativo del `button`).
- **No implementes navegación bidimensional con flechas arriba/abajo.** El
  número de columnas cambia con el ancho y con el zoom; una aritmética de filas
  se rompe en cuanto la rejilla se reajusta. Déjalas al desplazamiento nativo.
- Al cambiar de grupo o al filtrar, el `tabindex="0"` debe recaer siempre en un
  botón **visible**; si el que lo tenía quedó oculto, pásalo al primero visible.
  Un `tabindex="0"` sobre un botón oculto deja la rejilla inalcanzable.

### 4.6 La búsqueda manda sobre el selector de grupo

- El campo de búsqueda queda **por encima** del selector de grupo y de la
  rejilla, siempre visible. Es la vía rápida para quien ya sabe lo que quiere, y
  a 200 símbolos pasa a ser la vía principal.
- **Con una consulta escrita, el filtro por grupo se suspende** y se muestran
  las coincidencias de *todo* el catálogo. Buscar dentro de un solo grupo
  volvería inútil la búsqueda justo cuando más se necesita. Marca visiblemente
  ese estado (por ejemplo, los chips sin selección activa) y al borrar la
  consulta vuelve al grupo que estuviera elegido.
- El contador sigue en `role="status"` y sigue sin anunciar nada al cargar la
  página, como ya hace `applySymbolFilter`. Ajusta el texto de consulta vacía:
  hoy dice «Se muestran los N símbolos del tablero» y con un grupo a la vez eso
  deja de ser cierto.
- El mensaje de «ningún símbolo coincide» se conserva.

### 4.7 Contrato nuevo del catálogo: `before` / `after`

El catálogo que pide el usuario incluye cosas que no son un símbolo suelto:
`\frac{}{}`, `\sqrt{}`, `\text{}`, `\left(\right)`, `\{\,x \mid P(x)\,\}`. Hoy
`insertAtSelection` inserta una cadena y deja el cursor detrás, lo que para
`\frac{}{}` obliga a volver a colocar el cursor a mano.

Ya lo anticipé en su día y lo mantengo: **eso es un campo del catálogo, no una
heurística dentro de la función.** Contrato mínimo:

- Un símbolo puede declarar `insert: { before, after }`. Si no lo declara, se
  deriva de `command`: `{ before: command, after: "" }` — es decir, **todo lo
  que hay hoy sigue comportándose exactamente igual**.
- La inserción es `before + selección + after`.
- Si había selección, el cursor queda **después de `after`** (se envolvió algo y
  se sigue escribiendo).
- Si no había selección, el cursor queda **entre `before` y `after`** (se abrió
  un hueco y se escribe dentro).

Con eso, `\textbf{…}` sobre texto seleccionado lo envuelve, y `\frac{|}{}`
coloca el cursor en el numerador, sin ningún minilenguaje de plantillas ni
marcadores dentro de la cadena.

**Amplía `insertAtSelection` sin romper su firma:** `insertion` debe seguir
funcionando como hoy (equivale a `before: insertion, after: ""`) y **sus ocho
pruebas actuales tienen que pasar sin tocarlas**. Si alguna prueba estorba,
dímelo en `claude.md`; no la borres.

## 5. El catálogo: grupos y cobertura mínima

Objetivo: **entre 180 y 220 símbolos**, organizados por lo que el usuario
necesita escribir según `temario.md`, no por taxonomía matemática abstracta.

Grupos propuestos (el orden del array es el orden visible, como hoy):

| Grupo | Contenido | Para qué tema |
|---|---|---|
| Griegas minúsculas | las 24 + variantes | todo el curso |
| Griegas mayúsculas | las que no coinciden con latinas | todo el curso |
| Lógica | `\neg \land \lor \Rightarrow \Leftarrow \Leftrightarrow \equiv \therefore \because \vdash \models`, tablas de verdad | Repaso −1 |
| Cuantificadores y conjuntos | `\forall \exists \nexists \in \notin \ni \subset \subseteq \subsetneq \supseteq \cup \cap \setminus \triangle \emptyset \varnothing \complement \times \mathcal{P} \bigcup \bigcap \overline{A}`, `\mathbb{N Z Q R C}`, plantilla de conjunto por comprensión, intervalos | Repaso 0, y el grueso de lo que pidió el usuario |
| Relaciones y orden | `= \neq \approx \simeq \cong \sim < > \leq \geq \ll \gg \preceq \sup \inf \max \min` | Repaso 0.3 |
| Topología | `\| \cdot \| \lvert \rvert \partial \overline{A} A^{\circ} \operatorname{int} \operatorname{ext} \operatorname{Fr} \operatorname{diam} \infty`, bola `B(\mathbf{x}, r)`, distancia | **1.1, el tema que están cursando** |
| Funciones y límites | `\to \mapsto \circ f^{-1} \lim \lim_{x \to a} \operatorname{dom} \operatorname{im} \colon \nearrow` | 1.2–1.5 |
| Derivadas y gradiente | `\partial \frac{\partial f}{\partial x} \nabla \Delta \mathrm{d} D_{\mathbf{u}}f`, hessiano, derivadas de orden superior | Unidad 2 |
| Integrales y sumas | `\int \iint \iiint \oint \sum \prod`, con y sin límites, `\,dx` | Unidad 3 |
| Operadores y aritmética | `\pm \mp \times \div \cdot \ast \frac \sqrt \sqrt[n] \binom ^ _ \bmod` | todo |
| Vectores y matrices | `\vec \hat \mathbf \bar \overline \langle\rangle`, `pmatrix`, `bmatrix`, `\det` | Unidad 2 |
| Estructura y texto | `\text \textbf \textit \quad \, \; \dots \cdots \vdots \ddots \left \right \Big` | todo |

**Cuatro trampas concretas del alfabeto griego** (verifícalas, están para
ahorrarte una compilación fallida en Overleaf):

1. **Ómicron minúscula no tiene comando**: es `o` a secas. Inclúyela con ese
   comando y dilo en el nombre o en los `keywords`, o no la incluyas; lo que no
   vale es inventar `\omicron`.
2. **Las mayúsculas griegas que se ven como latinas** (Α Β Ε Ζ Η Ι Κ Μ Ν Ο Ρ Τ Χ)
   tampoco tienen comando: son `A`, `B`, `E`… Un botón que inserta `A` no aporta
   nada sobre teclear `A`. **Omítelas y documenta la decisión** en el comentario
   de cabecera del catálogo, para que no parezca un olvido.
3. **`\varepsilon` (ε) y `\epsilon` (ϵ) son distintos.** La de las definiciones
   ε-δ, que es la que va a usar en el tema 1.1, es `\varepsilon`. Que el nombre
   y los `keywords` los distingan, o va a insertar la que no quiere.
4. Incluye las variantes que sí tienen comando: `\vartheta \varpi \varrho
   \varsigma \varphi \varkappa`.

**Regla dura sobre paquetes:** el preámbulo lleva `amsmath` y `amssymb` y el
`.tex` es autocontenido. **Todo símbolo del catálogo debe compilar solo con
eso.** Nada de `\mathscr` (mathrsfs), `\coloneqq` (mathtools) ni `\bm` (bm). Si
crees que hace falta un paquete más, es una decisión de producto: pregúntamelo
en `claude.md` antes, y si se añade hay que regenerar `examples/calculo-3.tex`
con `npm run build:example` y explicarlo en la revisión.

Mantén los `keywords` en español y sin acentos obligatorios; es lo que hace útil
la búsqueda, y con 200 símbolos pasa a ser la función principal, no un extra.

## 6. Pruebas

`npm test` y `npm run check:js` tienen que quedar en verde. Sin dependencias
nuevas: Node 20+, `node --test` y el contexto `node:vm` de `tests/load-app.mjs`.

**Actualizar sin borrar:**

- `tests/symbols.test.js`, «el conjunto inicial cubre griegas, conectores…» es
  una instantánea del catálogo. Amplíala, no la sustituyas.
- Las ocho pruebas de `insertAtSelection` deben pasar **sin modificarse** (§4.7).
- La prueba de coherencia del catálogo (ids únicos, grupos declarados, campos
  obligatorios, ningún grupo vacío) ya cubre lo importante y va a hacer mucho
  trabajo con 200 entradas. Consérvala tal cual.

**Añadir:**

1. **Alfabeto griego completo**: que estén las 24 minúsculas (con la nota de
   ómicron), las variantes y las mayúsculas que sí tienen comando.
2. **Cobertura de conjuntos y topología**: una lista explícita de comandos que
   tienen que existir, igual que la prueba actual de griegas y conectores.
3. **Ningún comando fuera de `amsmath` + `amssymb`**: comprueba contra una lista
   negra de los que más tientan (`\mathscr`, `\coloneqq`, `\bm`, `\text{…}` de
   paquetes ajenos). Es la prueba que evita que el usuario descubra el problema
   en Overleaf a las 23:40 de un domingo.
4. **`insert: { before, after }`**: sin selección el cursor queda entre los dos;
   con selección la envuelve y el cursor queda detrás; un símbolo sin `insert`
   se comporta igual que hoy.
5. En `check-site.mjs`: que existan el muelle, la búsqueda, el selector de
   grupo, la rejilla `role="toolbar"` y la línea de detalle con
   `aria-hidden="true"`; y que el contador siga siendo `role="status"`.

**Lo que las pruebas no van a cubrir, y hay que comprobar a mano** — igual que
en incrementos anteriores, no hay DOM en el entorno de pruebas y no vamos a
añadir una dependencia para tenerlo. **Mide, no estimes:**

- [ ] La altura del muelle con el catálogo completo, a 1280×800 y a 390×844,
      contra el presupuesto de §4.1. **Este es el criterio de aceptación.**
- [ ] Paradas de tabulador entre `#block-content` y `#add-block`: deben ser un
      puñado, no doscientas.
- [ ] Flechas, Inicio y Fin dentro de la rejilla, y que tabular entre y salga.
- [ ] Que el `textarea` **siga visible** mientras se usa el tablero. Hoy no lo
      está: es el defecto que se está corrigiendo.
- [ ] 320 CSS px sin desplazamiento horizontal y botones de 44×44 px o más.
- [ ] `file://` por doble clic en Chromium, sin errores de consola. Sigue siendo
      innegociable: scripts clásicos, un único `TexNotes`, nada de módulos ES.

## 7. Documentación

- **README, sección «Símbolos matemáticos» (líneas 123-151):** está escrita
  sobre el diseño que se va a retirar. Hay que reescribirla: la frase «el
  catálogo es deliberadamente pequeño; una tabla breve es preferible a cientos
  de botones» pasa a ser justo lo contrario, y las líneas 127-129 describen el
  `<details>` plegado, la tarjeta de tres datos y la inserción del comando
  suelto. Que quede escrito el presupuesto de altura: es la regla que impide que
  esto se vuelva a degradar cuando alguien añada 50 símbolos más.
- **README, checklist manual (líneas 212-215):** sustituye las comprobaciones
  del tablero por las de §6.
- **Cabecera de `assets/js/math-symbols.js`:** documenta el contrato nuevo
  (`insert`), la decisión sobre las mayúsculas latinas y la regla de paquetes.
- **Cómo añadir un símbolo** (README, líneas 149-151): sigue siendo «una entrada
  en el array»; confírmalo y actualízalo si el grupo nuevo obliga a algo más.

## 8. Fuera de este encargo

No los toques aquí, aunque se rocen:

- **Alias personales** (`imp` → `\Rightarrow`). Siguen pendientes y siguen
  encajando junto al diccionario de macros, no dentro del tablero.
- **Vista previa con KaTeX.** El tablero sigue sin renderizar nada; muestra el
  carácter Unicode y punto.
- **Macros del usuario, `validate.js`, modelo Unidad → Clase → Bloques.** Son
  tuyos y son otro hito.
- **Reparentar bloques**, que sigue pendiente desde hace dos incrementos.
- **«Frecuentes» o «usados recientemente».** Es la mejora obvia que sigue a
  esto y ahorraría todavía más espacio, pero necesita persistencia propia.
  **Fase 2**, y solo si la fase 1 queda limpia. No la metas de contrabando.

## 9. Lo que te dejo decidir

Estas las dejo abiertas a propósito: tienes mejor contexto que yo sobre el
código que escribiste.

1. **Renderizar todo el catálogo y ocultar, o renderizar solo el grupo activo.**
   Mide el arranque por `file://` con 200 símbolos y decide con el dato.
2. **Chips de grupo frente a un `<select>`.** Propongo chips por
   descubribilidad; un `<select>` es una sola parada de tabulador y una sola
   fila de alto, y en móvil abre el selector nativo. Si al medir el presupuesto
   de §4.1 los chips no caben en móvil, cambia a `<select>` sin consultarme.
3. **Cuántos grupos.** Doce es mi propuesta; si al montarlo ves que dos se
   solapan (Relaciones y Operadores son los candidatos), fúndelos.
4. **Si el `<details>` sobra.** Con el presupuesto cumplido quizá plegar deje de
   tener sentido. Si lo quitas, dilo, porque `check-site.mjs` lo comprueba y
   habría que actualizar esa comprobación a conciencia, no borrarla.

Si algo de este análisis no te cuadra al ejecutarlo, **contrástalo midiendo y
dímelo en `claude.md`**. Los números de §1 son reproducibles; si te salen otros,
quiero saberlo antes de que construyas encima.
