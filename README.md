# Notas LaTeX

Aplicación web estática, sin dependencias de ejecución, para consolidar apuntes de clase y exportarlos como un archivo LaTeX autocontenido. Todo el trabajo —incluido el borrador— permanece en el navegador del dispositivo; la aplicación no envía información a un servidor.

> **Overleaf es la copia maestra.** Esta aplicación es un frente de redacción **de ida**: el `.tex` generado se copia o se descarga y se pega en Overleaf, donde se corrige y se compila. Las correcciones hechas allí no vuelven a la aplicación.

> **Alcance de la primera versión:** no interpreta, valida ni compila las matemáticas. Una ecuación se copia literalmente al `.tex`; la prueba automatizada compara cadenas `.tex`, no genera ni compara PDF. La compilación queda deliberadamente fuera: se hace en Overleaf.

## Especificación del documento generado

### Modelo de datos

El generador recibe un objeto con este contrato conceptual:

```js
{
  metadata: {
    title: "Título obligatorio",
    author: "opcional",
    course: "opcional",
    teacher: "opcional",
    date: "AAAA-MM-DD, opcional",
    topic: "Tema o unidad, opcional"
  },
  blocks: [
    {
      type: "text|equation|math-inline|definition|theorem|proposition|example|note|itemize|enumerate|bibliography",
      title: "opcional",
      content: "texto",
      children: [ /* bloques con la misma forma, sin profundidad máxima */ ]
    }
  ]
}
```

- El **título de la nota** es el único campo obligatorio en la interfaz. Autor, curso, profesor y fecha son opcionales. Para acelerar las entregas actuales, la interfaz inicia con el curso **Cálculo III (1352)**, el profesor **Guzmán Fuentes Ricardo** y la fecha **2026-09-13** ya escritos; siguen siendo campos editables y un borrador restaurado puede reemplazarlos.
- El **tema o unidad** produce una `\section` cuando no está vacío.
- `blocks` es una lista ordenada **de árboles**. Su orden determina exactamente el orden del cuerpo del documento, y el de `children` el de cada rama.
- `children` es opcional: **su ausencia equivale a `children: []`**, así que un estado plano escrito para la versión anterior sigue siendo válido y no hay que reescribirlo.
- Los tipos de bloque viven en una sola tabla, [`assets/js/block-types.js`](assets/js/block-types.js). Los bloques `definition`, `theorem`, `proposition`, `example` y `note` se convierten en sus entornos homónimos; `text` es texto normal y, si tiene título, comienza con `\subsection`.
- Hay **dos tipos de contenido matemático**, deliberadamente separados del texto: `equation` queda delimitado por `\[` y `\]` en líneas propias, y `math-inline` por `\(` y `\)` en una sola línea. Ambos conservan literalmente lo escrito y solo se diferencian por sus delimitadores en la tabla.
- `itemize` y `enumerate` producen listas: **cada línea no vacía del contenido es un `\item`**, con su texto tal cual se escribió.
- `bibliography` produce una **bibliografía manual con aspecto IEEE**: cada línea no vacía y recortada del contenido se conserva literalmente y se convierte en un `\bibitem{refN}` dentro de `thebibliography`. Este entorno del núcleo de LaTeX aporta por sí mismo la numeración entre corchetes, sin BibTeX, `natbib`, `IEEEtran` ni paquetes adicionales. El campo `title` no se usa, igual que en las listas. Las claves `ref1`, `ref2`, etc. son predecibles y únicas solo dentro de cada bloque; dos bloques de bibliografía repetirán claves y LaTeX mostrará una advertencia de etiqueta duplicada, una limitación aceptada porque la aplicación no genera `\cite{}`.
- `buildTheoremDefs()` deriva las declaraciones `\newtheorem` de esa misma tabla y agrupa los entornos por `\theoremstyle`, de modo que el preámbulo no puede desincronizarse de los tipos disponibles: añadir un tipo es una entrada en la tabla y su `<option>` en `index.html`, y una prueba compara ambas listas.
- **Regla de numeración:** cada entorno declarado con `\newtheorem` mantiene un contador propio, independiente y continuo en todo el documento. `proposition` comparte `\theoremstyle{plain}` con `theorem`, pero **no comparte contador** ni se reinicia por sección. Cambiar esa regla es editar una sola entrada de la tabla, y es un cambio de contrato que debe documentarse aquí.
- **El contenido de un bloque llega al `.tex` tal cual se escribió.** La aplicación no inserta ningún carácter de escape en `content`: ni en prosa, ni en los entornos tipo teorema, ni en los elementos de lista, ni por supuesto en los bloques matemáticos. Escribir `\forall x \in \mathbb{R}` produce exactamente eso, y un fragmento de LaTeX pegado desde otro documento —un `align`, un `tabular`— llega intacto.
- **Los metadatos y los títulos sí se escapan por completo** (`#`, `$`, `%`, `&`, `_`, `{`, `}`, `~`, `^` y `\`). Son valores que la aplicación interpola dentro de un argumento que ella misma genera —`\title{}`, `\section{}`, `\begin{theorem}[…]`—, donde un carácter reservado rompe el argumento y quien escribe no tiene forma de repararlo desde la interfaz. Son dos funciones distintas y con nombres distintos: `contentToLatex()` y `escapeMetadata()`.
- Una **proposición** puede escribirse ya como un solo bloque de prosa con sus fórmulas intercaladas, o bien, si se prefiere destacarlas, como un bloque `proposition` seguido de bloques matemáticos adyacentes. Ambas formas son válidas.

### Por qué el contenido no se escapa

La versión anterior escapaba la prosa y respetaba solo los tramos entre `$…$`. Ese escapado se retiró por completo, a petición de quien usa la aplicación. El motivo queda escrito aquí porque es un cambio de contrato:

- El contenido de un bloque **es LaTeX**, no prosa mecanografiada. La propia aplicación invita a escribirlo: el tablero de símbolos inserta `\forall` y `\mathbb{R}` en ese mismo campo.
- Escapar «solo algunos» reservados rompe justo lo que se invita a escribir. Con la regla anterior, un `\begin{align}` pegado desde otro documento salía con sus `&` escapados (`a \&= b`) y dejaba de compilar. Media transparencia es peor que ninguna: falla precisamente en el caso que promete resolver.
- **Overleaf es la copia maestra.** Un error de LaTeX se ve y se corrige allí, que es donde ya se trabaja el documento.

A cambio, los caracteres reservados son responsabilidad de quien escribe, igual que en cualquier editor de LaTeX:

| Se escribe en el contenido | Se obtiene en el `.tex` |
| --- | --- |
| `Usa \textbf{este término}.` | `Usa \textbf{este término}.` |
| `Sea A = {1, 2}.` | `Sea A = {1, 2}.` |
| `\forall x \in \mathbb{R}` | `\forall x \in \mathbb{R}` |
| `El 50\% \& el resto` | `El 50\% \& el resto` |
| `El 50% del total` | `El 50% del total` — el `%` **comenta el resto de su línea** |
| `Sea $x_1 \in A$.` | `Sea $x_1 \in A$.` |
| `Cuesta 5$ en total_1` | el mismo texto; el `$` sin pareja abrirá modo matemático al compilar |

El único caso que falla en silencio es `%`: no da error, simplemente hace desaparecer del PDF lo que le sigue en esa línea. Los demás (`_`, `&`, `#`, `^` sueltos fuera de matemáticas) fallan de forma ruidosa al compilar en Overleaf. La ayuda visible del campo lo explica, y ni la documentación ni las pruebas pueden volver a afirmar que el contenido se escapa.

### Bloques anidados

- Cada bloque puede contener otros mediante `children`, sin profundidad máxima. Los hijos **nunca se concatenan dentro de `content`**: siguen siendo nodos editables e independientes.
- **Qué tipos admiten hijos** lo declara el campo `container` de la tabla de tipos, y lo aplican por igual la interfaz y el generador. Los admiten `text`, los cinco entornos tipo teorema y las dos listas. **No los admiten `equation` ni `math-inline`**, porque cualquier bloque dentro de `\[…\]` o `\(…\)` produciría LaTeX inválido. Si un borrador manipulado a mano trae hijos en una fórmula, se conservan como hermanos posteriores en vez de perderse.
- Los hijos de un bloque que **abre un entorno** se emiten antes de su `\end{...}`, en orden. Los de un bloque de **texto**, después de su propio contenido.
- Separación determinista: un hijo de prosa abre párrafo y va precedido de una línea en blanco; un hijo que abre entorno o fórmula se pega a la línea anterior. En la raíz, los bloques siempre se separan por una línea en blanco.
- Un entorno de lista sin ningún `\item` no se emite —no compilaría—: en ese caso sus hijos se emiten por sí solos.

```tex
\begin{theorem}[Fubini]
Bajo las hipótesis del curso, ... se cumple $\iint_A f = \int \! \int f \, dx \, dy$ siempre que
\begin{itemize}
\item $f$ sea continua en el rectángulo $[a,b] \times [c,d]$
\end{itemize}
\end{theorem}
```

- Los saltos CRLF y CR se normalizan a LF. Las líneas vacías de un bloque textual conservan los párrafos. Un bloque sin contenido no se emite, salvo que tenga hijos: entonces se emiten ellos.
- La plantilla `article` incluye solamente `fontenc` (salida latina copiable), `inputenc` (fuente UTF-8), `babel` (español), `amsmath` (matemáticas), `amssymb` (los conjuntos `\mathbb` del tablero de símbolos) y `amsthm` (entornos). El propio preámbulo documenta el motivo. El archivo es **autocontenido**: no depende de ningún `.sty` externo, así que basta pegarlo en un proyecto vacío de Overleaf.
- El resultado termina siempre con un salto de línea y es determinista: el mismo estado produce exactamente la misma cadena.
- El nombre sugerido se deriva del título: minúsculas, sin diacríticos, grupos no alfanuméricos convertidos en guiones y extensión `.tex`. Si queda vacío, se usa **`notas-calculo-3.tex`**.

### Ejemplo completo de entrada

```json
{
  "metadata": {
    "title": "Notas de Cálculo III",
    "author": "Ana Pérez",
    "course": "Cálculo III",
    "teacher": "Dr. Ruiz",
    "date": "2026-09-11",
    "topic": "Integrales múltiples"
  },
  "blocks": [
    { "type": "definition", "title": "Integral doble", "content": "Sea $f: A \\to \\mathbb{R}$ acotada en $A \\subseteq \\mathbb{R}^2$. La integral sobre $A$ se escribe en la ecuación siguiente." },
    { "type": "equation", "title": "", "content": "\\iint_A f(x,y) \\, dx \\, dy" },
    {
      "type": "theorem", "title": "Fubini",
      "content": "Bajo las hipótesis del curso, el orden de integración no altera el resultado: se cumple $\\iint_A f = \\int \\! \\int f \\, dx \\, dy$ siempre que",
      "children": [
        { "type": "itemize", "title": "", "content": "$f$ sea continua en el rectángulo $[a,b] \\times [c,d]$\\nel 100\\\\% del recinto quede dentro de $A$ \\\\& sin cortes" }
      ]
    },
    { "type": "example", "title": "Rectángulo", "content": "Para $f(x,y)=x+y$ en $[0,1] \\times [0,2]$, calculamos el valor por iteración con \\textbf{el orden natural}.\n\nEste bloque tiene dos párrafos y llega al .tex tal cual se escribió." },
    { "type": "note", "title": "", "content": "La argumentación escrita cuenta para la calificación: no basta con el símbolo." }
  ]
}
```

El archivo exacto producido y comprobado byte a byte es [`examples/calculo-3.tex`](examples/calculo-3.tex). Ese estado vive en [`tests/example-state.mjs`](tests/example-state.mjs) y lo comparten la prueba y `npm run build:example`, que regenera el archivo cuando el formato cambia a propósito.

## Símbolos matemáticos

El tablero es un **muelle compacto** unido al campo de contenido y abierto por defecto. Su altura no depende del tamaño del catálogo: no debe superar **20 rem (320 px) en escritorio** ni **25 rem (400 px) bajo 38 rem de ancho**. La rejilla tiene desplazamiento propio y solo muestra una categoría a la vez; una búsqueda suspende esa categoría y consulta el catálogo completo.

- El buscador permanece visible y los botones de categoría indican su estado con `aria-pressed`.
- Cada botón nativo mide al menos 44 × 44 px y muestra solo el glifo. Una única línea visual presenta `nombre — comando`; está oculta a lectores de pantalla porque el `aria-label` completo del botón ya comunica ambos datos.
- La rejilla usa el patrón de barra de herramientas: una sola parada de tabulación, flechas izquierda/derecha con ajuste circular e Inicio/Fin. Esto evita atravesar cientos de controles para llegar a «Añadir bloque».
- No se carga ninguna biblioteca matemática ni dependencia externa. El catálogo compatible con `amsmath` y `amssymb` contiene 210 entradas para griegas, lógica, conjuntos, topología, funciones, cálculo, vectores y estructura.
- Un símbolo sencillo inserta `command`. Una plantilla puede declarar `insert: { before, after }`: envuelve una selección o, si no existe, deja el cursor entre ambas partes.

### Cómo ampliarlo

1. Añade una entrada a `MATH_SYMBOLS` con `id` único, `group`, `symbol`, `command`, `name` y `keywords` en español. Si es una plantilla, añade opcionalmente `insert: { before, after }`.
2. Si hace falta una categoría nueva, declárala en `MATH_SYMBOL_GROUPS`; el selector y la rejilla se generan desde esos arrays, sin modificar HTML ni CSS.
3. Usa únicamente comandos disponibles con `amsmath` y `amssymb`. Incorporar otro paquete es una decisión de producto y exige actualizar el generador y regenerar el ejemplo.
4. Ejecuta `npm test`: se validan coherencia, cobertura, alfabeto griego, comandos prohibidos y comportamiento de inserción.

## Uso

1. Abre `index.html` —por doble clic o mediante HTTP—. Verifica los datos prellenados del curso, profesor y fecha, completa el título y añade cada bloque con el botón explícito.
2. Dentro de **Símbolos matemáticos** puedes insertar un comando en la posición del cursor, buscarlo por su nombre o, si ya lo conoces, escribirlo directamente en el contenido.
3. Revisa o cambia el orden con **Editar**, **Añadir dentro**, **Eliminar**, **Subir** y **Bajar**. No hay arrastrar y soltar: los controles nativos funcionan con teclado y evitan otra dependencia.
   - **Añadir dentro** fija el bloque como padre del siguiente que añadas, y lo mantiene para encadenar varios hermanos; el texto bajo el título del formulario dice siempre dónde caerá el bloque, y **Añadir en la raíz** deshace esa elección. Los bloques de ecuación no ofrecen el botón: no admiten hijos.
   - **Subir** y **Bajar** mueven el bloque solo entre sus hermanos, nunca fuera de su nivel; en los extremos el botón aparece deshabilitado.
   - Eliminar un bloque con descendencia pide confirmación e indica cuántos bloques anidados se van con él. Si había una edición a medias, se cancela para no escribir sobre un bloque distinto del que se estaba editando.
4. Para repetir una estructura hay **tres acciones distintas**, a propósito, porque copiar y duplicar no son lo mismo:
   - **Duplicar** deja la copia inmediatamente después del original, entre sus mismos hermanos y en su mismo nivel, con toda su descendencia. Es un atajo de un solo paso: no se elige destino. El foco pasa a **Editar** de la copia y, como cualquier cambio estructural, cancela una edición a medias y lo anuncia.
   - **Copiar bloque** guarda el bloque —y su rama entera— en una **bandeja** de la aplicación, sin moverlo ni modificarlo. Después, **Pegar bloque** lo inserta en el destino que muestra el formulario: la raíz, o el bloque que hayas fijado con **Añadir dentro**. La bandeja no se vacía al pegar, así que el mismo bloque se pega tantas veces y en tantos destinos como haga falta. Cada pegado es una copia profunda independiente: editar una no cambia las demás ni al original.
   - **Copiar texto** lleva el contenido del bloque al **portapapeles del sistema**, para pegarlo con `Ctrl+V` donde quieras, dentro o fuera de la aplicación. No es lo mismo que **Copiar código**, que copia el documento entero ya generado.
   - La bandeja vive solo en la pestaña abierta: no se guarda en el borrador ni cambia su versión, porque no forma parte del documento.
5. Pulsa **Generar documento**; la vista previa solo cambia entonces, no con cada pulsación.
6. Copia o descarga el resultado y pégalo en Overleaf. Si la API moderna del portapapeles no está disponible, se utiliza selección y copia del `textarea` como alternativa.
7. **Guardar borrador** escribe bajo demanda `{ version: 2, metadata, blocks }` en `localStorage` con la clave `tex-notes:draft:v2`. **Restaurar** lee esa clave y, si no existe, la antigua `tex-notes:draft:v1` con su lista plana: la convierte al árbol y lo dice en el anuncio. La restauración normaliza `type`, `title`, `content` y `children` de forma recursiva, tolera datos ausentes, corruptos o mal anidados a cualquier profundidad y nunca lanza. Borrar retira ambas claves, pide confirmación y nunca borra el formulario abierto.

### Apertura directa con `file://`

La aplicación se carga con **scripts clásicos** y un único global (`window.TexNotes`), nunca con módulos ES: el navegador bloquea por CORS la descarga de un módulo cuando la página se abre por doble clic, y con módulos la interfaz quedaba inerte. `index.html` carga en orden `block-types.js`, `block-tree.js`, `latex-generator.js`, `file-download.js`, `math-symbols.js`, `text-insertion.js` y `app.js`; `npm test` comprueba tanto el orden como la ausencia de `type="module"`.

Servir por HTTP sigue siendo válido y es lo que usa GitHub Pages:

```sh
python3 -m http.server 8000
# http://localhost:8000/
```

Con `file://`, el portapapeles puede estar restringido en algunos navegadores; en ese caso la aplicación recurre a seleccionar el `textarea` y avisa por la región `aria-live`.

### GitHub Pages

El flujo [`.github/workflows/pages.yml`](.github/workflows/pages.yml) prueba y publica el contenido estático al recibir cambios en `main`, usando solo acciones oficiales. En **Settings → Pages → Build and deployment**, selecciona **GitHub Actions** y ejecuta el flujo o envía cambios a `main`. Todas las rutas del sitio son relativas, por lo que funciona tanto en un dominio raíz como en una subruta de proyecto.

## Accesibilidad y diseño

La interfaz sigue semántica HTML nativa: un único `main` y `h1`, secciones tituladas, `form`/`fieldset`, **listas ordenadas anidadas** para la jerarquía de bloques y botones reales. Incluye enlace de salto visible al foco, encabezados sin saltos, etiquetas visibles enlazadas por `for`/`id`, ayudas mediante `aria-describedby` solo donde aportan contexto, errores junto al campo y regiones `aria-live` para resultados. El orden DOM coincide con el visual.

La estructura de bloques se representa con un `<ol>` dentro del `<li>` de su padre, de modo que el lector de pantalla anuncia el anidamiento por sí mismo. Además, **el nivel y el padre se escriben, no solo se sugieren**: cada bloque muestra «Nivel 2 · dentro de 1 Teorema: Fubini» y su numeración jerárquica («1.1.2»), y cada botón lleva un nombre accesible completo —acción, bloque, nivel y padre—, como `Editar 1.1.1 Texto, nivel 3, dentro de 1.1 Lista con viñetas`. La sangría y el filete lateral son un refuerzo visual, nunca la única señal. Tras cada alta, edición, movimiento o borrado el foco queda en un control previsible —el bloque afectado, el hermano que ocupa su lugar, su padre o el alta de bloque— y el resultado se anuncia en la región `aria-live` existente.

El foco tiene contorno contrastado y no depende del color; los mensajes contienen texto explícito. Los colores están diseñados para contraste AA, incluidos temas claro y oscuro. Objetivos de al menos 44 px, cuadrícula fluida, ausencia de anchos fijos y adaptación bajo 608 px permiten uso desde unos 320 px y zoom al 200 %. No se introducen animaciones; aun así, `prefers-reduced-motion` neutraliza cualquier transición futura. No hay fuentes, iconos, frameworks ni recursos remotos.

### Revisión manual

- [ ] Recorrer toda la página con `Tab` y `Shift+Tab`, activar acciones con teclado y comprobar que no hay trampas.
- [ ] Activar el enlace de salto y verificar un foco visible en todos los controles.
- [ ] Crear dos tipos de bloque, editarlos, eliminarlos y moverlos, comprobando dónde queda el foco.
- [ ] Construir un árbol de al menos tres niveles solo con teclado: añadir en la raíz, usar **Añadir dentro** dos veces y comprobar que el texto del formulario dice en todo momento dónde caerá el bloque.
- [ ] En ese árbol, editar, subir, bajar y eliminar nodos de cada nivel; confirmar que **Subir** y **Bajar** nunca sacan un bloque de su nivel y que el foco queda donde se espera tras cada acción.
- [ ] Eliminar un bloque con descendencia y comprobar el aviso con el número de bloques anidados.
- [ ] Comprobar con lector de pantalla que se anuncian el nivel y el bloque padre, y que la lista anidada se lee como tal.
- [ ] Intentar cambiar a **Ecuación destacada** un bloque que ya tiene hijos y confirmar que el error se explica junto al campo.
- [ ] Escribir en el contenido `\textbf{x}`, llaves sueltas, `50%`, `&`, `_`, `$…$` y un `$` sin pareja; generar y confirmar que el `.tex` los reproduce sin añadir ni un solo escape.
- [ ] Duplicar con teclado una hoja y una rama de tres niveles; editar la copia y confirmar que el original no cambia.
- [ ] Copiar un bloque a la bandeja y pegarlo en la raíz y dentro de otro bloque; comprobar el resumen visible de la bandeja, el anuncio con la ruta nueva y dónde queda el foco.
- [ ] Usar **Copiar texto** y pegar fuera de la aplicación; denegar el permiso del portapapeles y confirmar que el mensaje ofrece la alternativa.
- [ ] Comprobar con lector de pantalla que **Duplicar**, **Copiar bloque**, **Copiar texto** y **Pegar bloque** se distinguen entre sí y de **Copiar código**, y que cada uno nombra su bloque, nivel y padre.
- [ ] Medir el muelle completo: como máximo 320 px a 1280×800 y 400 px a 390×844; confirmar que el `textarea` permanece visible al usarlo.
- [ ] Recorrer categorías y rejilla con teclado: una sola parada en la rejilla, flechas izquierda/derecha circulares, Inicio/Fin, y salida directa hacia «Añadir bloque».
- [ ] Insertar comandos y plantillas con y sin selección; confirmar la posición del cursor y que el foco vuelve al contenido.
- [ ] Buscar en todo el catálogo y borrar la consulta; comprobar contador, ausencia de resultados y restauración de la categoría elegida.
- [ ] Comprobar a 320 CSS px que no hay desplazamiento horizontal y que cada botón conserva al menos 44 × 44 px y foco visible.
- [ ] Revisar con lector de pantalla que el orden anunciado coincide con el visual y que etiquetas, instrucciones, errores y títulos son comprensibles.
- [ ] Confirmar que altas, movimientos, borrados, generación, copia, descarga y borrador se anuncian dinámicamente y no solo mediante color.
- [ ] Forzar un título vacío y un bloque vacío; confirmar error escrito, `aria-invalid` y foco en el campo.
- [ ] Probar zoom al 200 %, 320 CSS px y orientación móvil sin pérdida de contenido ni desplazamiento horizontal de la interfaz, con un bloque de tercer nivel a la vista.
- [ ] Comprobar contraste de texto, controles, foco, errores y estados en temas claro y oscuro con una herramienta WCAG 2.1 AA.
- [ ] Usar `prefers-reduced-motion: reduce` y verificar que no aparece movimiento inesperado.
- [ ] Guardar, recargar, restaurar y borrar un borrador de un árbol de varios niveles; probar también una entrada corrupta y un borrador plano `version: 1` para comprobar la migración y su anuncio.
- [ ] Denegar permiso del portapapeles y confirmar que un fallo conserva el resultado y comunica una alternativa.
- [ ] Abrir `index.html` por doble clic (`file://`) y confirmar que se añaden bloques, se genera, se copia y se descarga sin errores en consola.
- [ ] Pegar en un proyecto vacío de Overleaf un `.tex` con texto mixto y entornos anidados, y comprobar que compila sin añadir paquetes.

## Pruebas automatizadas

Requieren Node.js 20 o posterior, sin instalar paquetes:

```sh
npm test
npm run check:js
```

`npm test` comprueba estructura HTML esencial y asociaciones de etiquetas, rutas relativas e internas, el orden de los scripts clásicos, el contenido literal de los bloques frente al escapado completo de metadatos y títulos, el duplicado y la copia profunda de ramas, títulos y bloques vacíos, varios párrafos, ecuaciones multilínea, nombres de archivo, CRLF, la correspondencia entre la tabla de tipos y las opciones de `index.html`, la derivación de `\newtheorem` sin `\theoremstyle` repetidos y la ausencia de sobre de reimportación, además de la equivalencia byte a byte con `examples/calculo-3.tex`. La bibliografía cubre varias referencias, una sola, contenido vacío, recorte de líneas, el ancho numérico para diez o más entradas y la paridad con `index.html`. `npm run check:js` analiza la sintaxis de los siete archivos del navegador.

Sobre el **contenido literal**, [`tests/content-literal.test.js`](tests/content-literal.test.js) —que sustituye al antiguo `mixed-math.test.js`— cubre la conservación de `\`, `{` y `}` en todo tipo de prosa y en los elementos de lista; comandos con argumento, del tablero y llaves sueltas; los reservados `#`, `%`, `&`, `_`, `~` y `^` sin escapar; un `align` y un `tabular` pegados desde otro documento; `$…$`, `$$…$$`, `\$` y un delimitador sin pareja; los bloques matemáticos sin regresión; y el escapado completo que conservan metadatos y títulos, barra y llaves incluidas.

Sobre **duplicar y copiar**, `tests/block-tree.test.js` añade: el duplicado de una hoja justo después del original, el de una rama de tres niveles con su orden exacto, la independencia de la copia al editar o eliminar, el rechazo con `null` de una ruta inválida sin mutar el árbol, la salida idéntica de las dos ramas, la copia suelta que entrega la bandeja con un pegado independiente por vez, el saneado de lo que entra en ella y la persistencia de ambas ramas al guardar y restaurar.

**La interfaz de `app.js` no tiene pruebas automatizadas**: no hay DOM en el entorno de pruebas y no se añaden dependencias para tenerlo. Los botones por bloque, el foco y los anuncios se comprueban en la lista de revisión manual; `tests/check-site.mjs` solo vigila lo estructural del HTML —que exista «Pegar bloque» oculto, el resumen de la bandeja y una ayuda visible que no prometa un escapado que ya no ocurre—.

Sobre los **bloques anidados**, [`tests/block-tree.test.js`](tests/block-tree.test.js) cubre la normalización de estados planos y corruptos a cualquier profundidad, qué tipos admiten hijos, las operaciones por ruta —buscar, insertar, actualizar, eliminar y mover—, su pureza, el rechazo controlado de una operación inválida, los movimientos limitados a hermanos, la generación con tres niveles y el orden exacto de un entorno con lista hija, y la persistencia: migración desde `version: 1`, restauración del esquema nuevo, versiones futuras y anidación mal formada.

Sobre la entrada matemática, `npm test` cubre además las proposiciones con y sin título, los caracteres reservados y el contenido vacío dentro de una proposición, la combinación de texto y fórmula, los dos tipos de matemática, las listas, la coherencia del catálogo de símbolos y su búsqueda, y la inserción en el cursor: al principio, en medio, al final, con selección activa, con selección invertida, sobre un campo vacío, con índices ausentes o fuera de rango y con caracteres Unicode fuera del ASCII.

Como el navegador carga scripts clásicos y no módulos, [`tests/load-app.mjs`](tests/load-app.mjs) los ejecuta en un contexto `node:vm` en el mismo orden que `index.html` y clona los datos al realm de la prueba. Así se prueba exactamente el código que se publica, sin mantener una segunda copia en formato módulo. La compilación de LaTeX queda fuera del flujo: se comparan cadenas `.tex`, no PDF compilados.

## Hitos

Cada hito es independiente y desplegable:

<details><summary><strong>1. Especificación</strong>: modelo de datos y archivo <code>.tex</code> de referencia</summary>

Contrato documentado, transformación definida y `examples/calculo-3.tex` comprobado byte a byte.
</details>
<details><summary><strong>2. Editor mínimo</strong>: formulario y lista ordenada de bloques</summary>

Metadatos, editor progresivo y acciones nativas de edición, eliminación y orden.
</details>
<details><summary><strong>3. Generación</strong>: transformación determinista y vista previa</summary>

Funciones puras, contenido literal frente a metadatos escapados, y salida de solo lectura bajo demanda.
</details>
<details><summary><strong>4. Exportación</strong>: copia y descarga</summary>

Portapapeles con alternativa, Blob local, nombre portable y revocación de URL.
</details>
<details><summary><strong>5. Calidad</strong>: accesibilidad, diseño responsive y validaciones</summary>

Semántica, errores accesibles, foco persistente, contraste, temas y pruebas ligeras.
</details>
<details><summary><strong>6. Persistencia</strong>: borrador local versionado</summary>

Guardado explícito, restauración defensiva y borrado confirmado en `localStorage`. Es un borrador de trabajo del propio dispositivo, no una copia maestra: la copia maestra está en Overleaf.
</details>
<details><summary><strong>7. Publicación</strong>: despliegue automatizado en GitHub Pages</summary>

Flujo oficial que prueba y publica el sitio estático desde `main`.
</details>
<details><summary><strong>8. Entrada matemática</strong>: tablero de símbolos y proposiciones</summary>

Catálogo estático sin dependencias, inserción accesible en la posición del cursor, entorno `proposition` con contador propio y separación explícita entre texto, matemática en línea y matemática destacada.
</details>

<details><summary><strong>9. Texto mixto y estructura anidada</strong>: fórmulas dentro de la prosa y bloques dentro de bloques</summary>

Contenido entregado tal cual —comandos, llaves y matemática delimitada— con el escapado reservado a metadatos y títulos; árbol de bloques con rutas estables y operaciones puras, incluidas duplicar y copiar; generación recursiva, editor accesible con nivel y padre explícitos, y borrador `version: 2` que migra el plano anterior.
</details>

## Criterio de finalización del MVP

El MVP está terminado cuando una persona puede, usando solamente el teclado y con la página abierta por doble clic, crear una nota con al menos dos tipos de bloque, revisar el código generado, copiarlo, descargarlo, recargar la página y recuperar el borrador.

## Pendiente

Siguiente en la secuencia: el **diccionario de macros** (`macros.js` y `validate.js`, con nombres reservados, aridad y renderizado real en KaTeX), la **vista previa con KaTeX** y el **modelo de documento de tres niveles** (Unidad → Clase → Bloques); el cuerpo ya admite bloques anidados, pero el documento sigue teniendo un solo eje: `topic` produce una única `\section`. Después, el módulo de apoyo al curso: botón de cita de asesoría, panel de fechas con `.ics` y lista de entregables.

Dentro de la entrada matemática quedan pendientes los alias personales (`imp` → `\Rightarrow`) y mover un bloque de un padre a otro: hoy **Subir** y **Bajar** solo reordenan entre hermanos, y cambiar de padre exige volver a crear el bloque.

Quedan expresamente fuera por ahora: TeX en WASM, TikZ/PGFPlots, traducción de errores de TeX, paleta de comandos, buscar y reemplazar, historial de versiones, infraestructura de sincronización y cualquier ida y vuelta desde Overleaf a la aplicación.
