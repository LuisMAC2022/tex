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
    { type: "text|equation|math-inline|definition|theorem|proposition|example|note|itemize|enumerate", title: "opcional", content: "texto" }
  ]
}
```

- El **título de la nota** es el único campo obligatorio en la interfaz. Autor, curso, profesor y fecha son opcionales. Para acelerar las entregas actuales, la interfaz inicia con el curso **Cálculo III (1352)**, el profesor **Guzmán Fuentes Ricardo** y la fecha **2026-09-13** ya escritos; siguen siendo campos editables y un borrador restaurado puede reemplazarlos.
- El **tema o unidad** produce una `\section` cuando no está vacío.
- `blocks` es una lista ordenada. Su orden determina exactamente el orden del cuerpo del documento.
- Los tipos de bloque viven en una sola tabla, [`assets/js/block-types.js`](assets/js/block-types.js). Los bloques `definition`, `theorem`, `proposition`, `example` y `note` se convierten en sus entornos homónimos; `text` es texto normal y, si tiene título, comienza con `\subsection`.
- Hay **dos tipos de contenido matemático**, deliberadamente separados del texto: `equation` queda delimitado por `\[` y `\]` en líneas propias, y `math-inline` por `\(` y `\)` en una sola línea. Ambos conservan literalmente lo escrito y solo se diferencian por sus delimitadores en la tabla.
- `itemize` y `enumerate` producen listas: **cada línea no vacía del contenido es un `\item`**, con su texto escapado.
- `buildTheoremDefs()` deriva las declaraciones `\newtheorem` de esa misma tabla y agrupa los entornos por `\theoremstyle`, de modo que el preámbulo no puede desincronizarse de los tipos disponibles: añadir un tipo es una entrada en la tabla y su `<option>` en `index.html`, y una prueba compara ambas listas.
- **Regla de numeración:** cada entorno declarado con `\newtheorem` mantiene un contador propio, independiente y continuo en todo el documento. `proposition` comparte `\theoremstyle{plain}` con `theorem`, pero **no comparte contador** ni se reinicia por sección. Cambiar esa regla es editar una sola entrada de la tabla, y es un cambio de contrato que debe documentarse aquí.
- Los caracteres reservados `#`, `$`, `%`, `&`, `_`, `{`, `}`, `~`, `^` y `\` se escapan en metadatos, títulos, contenido textual y elementos de lista. En cambio, el contenido de un **bloque matemático conserva literalmente la sintaxis escrita por el usuario**. El escapado nunca se desactiva de forma global: escribir `\forall` dentro de una proposición produce `\textbackslash{}forall`, y para obtener el símbolo hay que añadir un bloque matemático contiguo.
- Una **proposición** se compone, por tanto, de un bloque `proposition` con su enunciado en prosa y uno o más bloques matemáticos adyacentes. No existe todavía un análisis de LaTeX mixto dentro de un mismo bloque, y evitarlo es deliberado: conserva el escapado y no obliga a escribir un parser.
- Los saltos CRLF y CR se normalizan a LF. Las líneas vacías de un bloque textual conservan los párrafos. Los bloques sin contenido no se emiten.
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
    { "type": "definition", "title": "Integral doble", "content": "Sea f: A → R. La integral sobre A se escribe en la ecuación siguiente." },
    { "type": "equation", "title": "", "content": "\\iint_A f(x,y) \\, dx \\, dy" },
    { "type": "theorem", "title": "Fubini", "content": "Bajo las hipótesis del curso, el orden de integración no altera el resultado." },
    { "type": "example", "title": "Rectángulo", "content": "Para f(x,y)=x+y en [0,1] \\times [0,2], calculamos el valor por iteración.\n\nEste bloque tiene dos párrafos y conserva el signo = como texto." },
    { "type": "note", "title": "", "content": "La argumentación escrita cuenta para la calificación: no basta con el símbolo." }
  ]
}
```

El archivo exacto producido y comprobado byte a byte es [`examples/calculo-3.tex`](examples/calculo-3.tex). Ese estado vive en [`tests/example-state.mjs`](tests/example-state.mjs) y lo comparten la prueba y `npm run build:example`, que regenera el archivo cuando el formato cambia a propósito.

## Símbolos matemáticos

El tablero de símbolos es un mecanismo de **descubrimiento**, no el modo principal de entrada. La progresión prevista es: pulsar un botón del tablero, buscar por nombre (por ejemplo «para todo», «implica» o «conjunción»), escribir el comando directamente y, más adelante, definir alias personales.

- El tablero vive plegado dentro del editor de bloques, en `<details><summary>`, y se abre con teclado o ratón.
- Cada símbolo es un `button` nativo que muestra **nombre, carácter Unicode y comando LaTeX**, y expone un nombre accesible explícito, como `Insertar cuantificador universal, comando barra invertida forall`: el carácter por sí solo no basta con lector de pantalla.
- Al pulsarlo se inserta **únicamente el comando** en `#block-content`, en la posición del cursor: sustituye la selección si la hay, conserva el resto, devuelve el foco al campo, deja el cursor tras lo insertado y anuncia el símbolo en `#app-status`, sin releer todo el tablero. La inserción vive en `insertAtSelection`, una función pura que recibe el estado del campo y devuelve el siguiente.
- No se carga ninguna biblioteca de renderizado matemático: aumentaría el peso y la complejidad sin ser necesaria para insertar texto. La vista previa con KaTeX sigue siendo un hito aparte.
- **Los comandos solo se conservan literalmente en los bloques matemáticos.** Insertar `\forall` en un bloque de texto produce `\textbackslash{}forall`, que es el comportamiento correcto y seguro.

### Conjunto inicial

El catálogo es deliberadamente pequeño; una tabla breve es preferible a cientos de botones. Vive en [`assets/js/math-symbols.js`](assets/js/math-symbols.js) y agrupa 30 símbolos:

| Grupo | Comandos |
| --- | --- |
| Variables griegas | `\alpha`, `\beta`, `\gamma`, `\varphi` |
| Conectores lógicos | `\neg`, `\land`, `\lor`, `\Rightarrow`, `\Leftrightarrow` |
| Cuantificadores | `\forall`, `\exists` |
| Relaciones | `=`, `\neq`, `\in`, `\notin`, `\subseteq` |
| Conjuntos y números | `\mathbb{N}`, `\mathbb{Z}`, `\mathbb{Q}`, `\mathbb{R}`, `\emptyset`, `\cup`, `\cap` |
| Delimitadores y agrupación | `(`, `)`, `\{`, `\}`, `\left(`, `\right)`, `\mid` |

### Cómo ampliarlo

1. Añade una entrada a `MATH_SYMBOLS` con `id` único, `group` existente, `symbol` (carácter Unicode), `command` (comando exacto que se insertará), `name` en español y `keywords`, es decir, los términos de búsqueda que esperarías teclear, sin acentos.
2. Si el símbolo no encaja en ningún grupo, declara primero uno nuevo en `MATH_SYMBOL_GROUPS`; el orden del array es el orden visible.
3. Si el comando necesita un paquete que el preámbulo no carga —como `amssymb` para `\mathbb`—, añade ese `\usepackage` en `buildPreamble` de [`assets/js/latex-generator.js`](assets/js/latex-generator.js).
4. Ejecuta `npm test`: las pruebas comprueban identificadores únicos, grupos declarados, campos obligatorios y que ningún grupo quede vacío. No hay que tocar el HTML ni el CSS: el tablero se renderiza desde el catálogo y usa delegación de eventos.

Queda fuera de esta iteración lo que la búsqueda por nombre no resuelve: alias personales (`imp` → `\Rightarrow`), vista previa renderizada y comandos con argumentos que coloquen el cursor entre llaves.

## Uso

1. Abre `index.html` —por doble clic o mediante HTTP—. Verifica los datos prellenados del curso, profesor y fecha, completa el título y añade cada bloque con el botón explícito.
2. Dentro de **Símbolos matemáticos** puedes insertar un comando en la posición del cursor, buscarlo por su nombre o, si ya lo conoces, escribirlo directamente en el contenido.
3. Revisa o cambia el orden con **Editar**, **Eliminar**, **Subir** y **Bajar**. No hay arrastrar y soltar: los controles nativos funcionan con teclado y evitan otra dependencia.
4. Pulsa **Generar documento**; la vista previa solo cambia entonces, no con cada pulsación.
5. Copia o descarga el resultado y pégalo en Overleaf. Si la API moderna del portapapeles no está disponible, se utiliza selección y copia del `textarea` como alternativa.
6. **Guardar borrador** escribe bajo demanda `{ version: 1, metadata, blocks }` en `localStorage` con la clave `tex-notes:draft:v1`. Restaurar tolera datos ausentes o corruptos. Borrar pide confirmación y nunca borra el formulario abierto.

### Apertura directa con `file://`

La aplicación se carga con **scripts clásicos** y un único global (`window.TexNotes`), nunca con módulos ES: el navegador bloquea por CORS la descarga de un módulo cuando la página se abre por doble clic, y con módulos la interfaz quedaba inerte. `index.html` carga en orden `block-types.js`, `latex-generator.js`, `file-download.js`, `math-symbols.js`, `text-insertion.js` y `app.js`; `npm test` comprueba tanto el orden como la ausencia de `type="module"`.

Servir por HTTP sigue siendo válido y es lo que usa GitHub Pages:

```sh
python3 -m http.server 8000
# http://localhost:8000/
```

Con `file://`, el portapapeles puede estar restringido en algunos navegadores; en ese caso la aplicación recurre a seleccionar el `textarea` y avisa por la región `aria-live`.

### GitHub Pages

El flujo [`.github/workflows/pages.yml`](.github/workflows/pages.yml) prueba y publica el contenido estático al recibir cambios en `main`, usando solo acciones oficiales. En **Settings → Pages → Build and deployment**, selecciona **GitHub Actions** y ejecuta el flujo o envía cambios a `main`. Todas las rutas del sitio son relativas, por lo que funciona tanto en un dominio raíz como en una subruta de proyecto.

## Accesibilidad y diseño

La interfaz sigue semántica HTML nativa: un único `main` y `h1`, secciones tituladas, `form`/`fieldset`, lista ordenada y botones reales. Incluye enlace de salto visible al foco, encabezados sin saltos, etiquetas visibles enlazadas por `for`/`id`, ayudas mediante `aria-describedby` solo donde aportan contexto, errores junto al campo y regiones `aria-live` para resultados. El orden DOM coincide con el visual.

El foco tiene contorno contrastado y no depende del color; los mensajes contienen texto explícito. Los colores están diseñados para contraste AA, incluidos temas claro y oscuro. Objetivos de al menos 44 px, cuadrícula fluida, ausencia de anchos fijos y adaptación bajo 608 px permiten uso desde unos 320 px y zoom al 200 %. No se introducen animaciones; aun así, `prefers-reduced-motion` neutraliza cualquier transición futura. No hay fuentes, iconos, frameworks ni recursos remotos.

### Revisión manual

- [ ] Recorrer toda la página con `Tab` y `Shift+Tab`, activar acciones con teclado y comprobar que no hay trampas.
- [ ] Activar el enlace de salto y verificar un foco visible en todos los controles.
- [ ] Crear dos tipos de bloque, editarlos, eliminarlos y moverlos, comprobando dónde queda el foco.
- [ ] Abrir y cerrar el tablero de símbolos solo con teclado; recorrer los botones y comprobar que el lector de pantalla lee el nombre del símbolo, no únicamente el carácter.
- [ ] Insertar un símbolo con el cursor al principio, en medio, al final y sobre una selección; confirmar que el foco vuelve al contenido, que el cursor queda tras el comando y que el anuncio no relee todo el tablero.
- [ ] Buscar «para todo» y una consulta sin resultados; comprobar el recuento anunciado y el mensaje de ausencia de coincidencias.
- [ ] Comprobar que los botones del tablero conservan al menos 44 por 44 píxeles y foco visible a 320 CSS px y con zoom del 200 %.
- [ ] Revisar con lector de pantalla que el orden anunciado coincide con el visual y que etiquetas, instrucciones, errores y títulos son comprensibles.
- [ ] Confirmar que altas, movimientos, borrados, generación, copia, descarga y borrador se anuncian dinámicamente y no solo mediante color.
- [ ] Forzar un título vacío y un bloque vacío; confirmar error escrito, `aria-invalid` y foco en el campo.
- [ ] Probar zoom al 200 %, 320 CSS px y orientación móvil sin pérdida de contenido ni desplazamiento horizontal de la interfaz.
- [ ] Comprobar contraste de texto, controles, foco, errores y estados en temas claro y oscuro con una herramienta WCAG 2.1 AA.
- [ ] Usar `prefers-reduced-motion: reduce` y verificar que no aparece movimiento inesperado.
- [ ] Guardar, recargar, restaurar y borrar un borrador; probar también una entrada corrupta en `localStorage`.
- [ ] Denegar permiso del portapapeles y confirmar que un fallo conserva el resultado y comunica una alternativa.
- [ ] Abrir `index.html` por doble clic (`file://`) y confirmar que se añaden bloques, se genera, se copia y se descarga sin errores en consola.
- [ ] Pegar el `.tex` generado en un proyecto vacío de Overleaf y comprobar que compila sin añadir paquetes.

## Pruebas automatizadas

Requieren Node.js 20 o posterior, sin instalar paquetes:

```sh
npm test
npm run check:js
```

`npm test` comprueba estructura HTML esencial y asociaciones de etiquetas, rutas relativas e internas, el orden de los scripts clásicos, caracteres reservados, títulos y bloques vacíos, varios párrafos, ecuaciones multilínea, nombres de archivo, CRLF, la correspondencia entre la tabla de tipos y las opciones de `index.html`, la derivación de `\newtheorem` sin `\theoremstyle` repetidos y la ausencia de sobre de reimportación, además de la equivalencia byte a byte con `examples/calculo-3.tex`. `npm run check:js` analiza la sintaxis de los seis archivos del navegador.

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

Funciones puras, escapado contextual y salida de solo lectura bajo demanda.
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

## Criterio de finalización del MVP

El MVP está terminado cuando una persona puede, usando solamente el teclado y con la página abierta por doble clic, crear una nota con al menos dos tipos de bloque, revisar el código generado, copiarlo, descargarlo, recargar la página y recuperar el borrador.

## Pendiente

Siguiente en la secuencia: el **diccionario de macros** (`macros.js` y `validate.js`, con nombres reservados, aridad y renderizado real en KaTeX), la **vista previa con KaTeX** y el **modelo de documento de tres niveles** (Unidad → Clase → Bloques); hoy la estructura es plana y `topic` produce una única `\section`. Después, el módulo de apoyo al curso: botón de cita de asesoría, panel de fechas con `.ics` y lista de entregables.

También quedan pendientes, dentro de la entrada matemática ya empezada: los alias personales (`imp` → `\Rightarrow`), las listas anidadas y la mezcla de texto y fórmulas dentro de un mismo bloque.

Quedan expresamente fuera por ahora: TeX en WASM, TikZ/PGFPlots, traducción de errores de TeX, paleta de comandos, buscar y reemplazar, historial de versiones, infraestructura de sincronización y cualquier ida y vuelta desde Overleaf a la aplicación.
