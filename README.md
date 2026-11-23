# Notas LaTeX

Aplicación web estática para consolidar apuntes de clase y exportarlos como un archivo LaTeX para compilar en Overleaf. El editor y el borrador funcionan en el navegador, con KaTeX y sus fuentes incluidos en el sitio.

> Invariantes vigiladas: [`INVARIANTES.md`](INVARIANTES.md) · por qué de cada
> decisión: [`decisiones/`](decisiones/) · reglas para agentes:
> [`PROTOCOLO.md`](PROTOCOLO.md) · cómo se usa:
> [`docs/guia-de-uso.md`](docs/guia-de-uso.md) · cómo se extiende:
> [`docs/guia-de-desarrollo.md`](docs/guia-de-desarrollo.md)

> **La aplicación es la copia maestra y Overleaf solo compila** ([DEC-021](decisiones/DEC-021-aplicacion-copia-maestra.md)). El `.tex` es un producto derivado: se genera, se copia o se descarga y se compila en Overleaf. Los errores se localizan allí y se corrigen aquí, porque las correcciones hechas en Overleaf no vuelven a la aplicación. Mientras no existan las versiones ni el archivo de proyecto, el único respaldo es el borrador local de este dispositivo.


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
  macros: [{ name: "R", params: 0, body: "\\mathbb{R}" }],
  blocks: [
    {
      type: "text|equation|math-inline|definition|theorem|proposition|proof|example|note|itemize|enumerate|bibliography|image",
      title: "opcional",
      content: "texto",
      children: [ /* bloques con la misma forma, sin profundidad máxima */ ],
      options: { width: 0.8, angle: 0, align: "center", placement: "htbp" }, // opcional, solo en image
      listFormat: "flat|outline" // opcional, solo en listas
    }
  ]
}
```

- El **título de la nota** es el único campo obligatorio en la interfaz. Autor, curso, profesor y fecha son opcionales. Para acelerar las entregas actuales, la interfaz inicia con el curso **Cálculo III (1352)**, el profesor **Guzmán Fuentes Ricardo** y la fecha local del día ya escritos; siguen siendo campos editables y un borrador restaurado puede reemplazarlos. La fecha la escribe `app.js` al cargar con `localDateValue()`, no el HTML.
- El **tema o unidad** produce una `\section` cuando no está vacío.
- `blocks` es una lista ordenada **de árboles**. Su orden determina exactamente el orden del cuerpo del documento, y el de `children` el de cada rama.
- `children` es opcional: **su ausencia equivale a `children: []`**, así que un estado plano escrito para la versión anterior sigue siendo válido y no hay que reescribirlo.
- Los tipos de bloque viven en una sola tabla, [`assets/js/block-types.js`](assets/js/block-types.js). Los bloques `definition`, `theorem`, `proposition`, `proof`, `example` y `note` se convierten en sus entornos homónimos; `text` es texto normal y, si tiene título, comienza con `\subsection`.
- Hay **dos tipos de contenido matemático**, deliberadamente separados del texto: `equation` queda delimitado por `\[` y `\]` en líneas propias, y `math-inline` por `\(` y `\)` en una sola línea. Ambos conservan literalmente lo escrito y solo se diferencian por sus delimitadores en la tabla.
- `itemize` y `enumerate` producen listas. Cada línea no vacía da un `\item`. Dos espacios o un tabulador forman un nivel de sangría, y cada línea puede bajar hasta un nivel respecto de la anterior. La primera línea comienza en el nivel raíz.
- El bloque define el tipo de la lista raíz. Al abrir una sublista, el primer elemento fija su tipo con `- ` o `* ` para viñetas y un número seguido de `. ` o `) ` para numeración. Sin marcador hereda el tipo de la lista que la contiene. Los marcadores se consumen en todos los niveles. `{}- ` conserva el guion como parte del elemento.
- Se permiten hasta cuatro niveles de un mismo tipo y seis entornos combinados, contando los teoremas y las listas envolventes que genera el editor. Los elementos que alcancen el límite se incorporan al último nivel disponible sin alterar su orden. Si el bloque completo ya está en el límite, sus elementos se emiten como párrafos.
- Una lista plana sin marcadores conserva el formato `.tex` anterior. Cada nivel de sublista añade dos espacios al comienzo de sus líneas. Los bloques de «Añadir dentro» se emiten después de los elementos y antes del cierre de la lista raíz, si la lista puede abrirse.
- Al restaurar un borrador antiguo, sus listas sin `listFormat` conservan los marcadores literales y se muestran planas. Cambiar su contenido activa la sintaxis por sangría. Las listas nuevas guardan su formato dentro del borrador v3.
- `bibliography` produce una **bibliografía manual con aspecto IEEE**: cada línea no vacía y recortada del contenido se conserva literalmente y se convierte en un `\bibitem{refN}` dentro de `thebibliography`. Este entorno del núcleo de LaTeX aporta por sí mismo la numeración entre corchetes, sin BibTeX, `natbib`, `IEEEtran` ni paquetes adicionales. El campo `title` no se usa, igual que en las listas. Las claves `ref1`, `ref2`, etc. son predecibles y únicas solo dentro de cada bloque; dos bloques de bibliografía repetirán claves y LaTeX mostrará una advertencia de etiqueta duplicada, una limitación aceptada porque la aplicación no genera `\cite{}`.
- `image` usa la ruta recortada y literal de `content` y el pie opcional de `title`, escapado. No admite hijos. Sus `options` son opcionales y se guardan en el borrador `version: 3`.
- `buildTheoremDefs()` deriva las declaraciones `\newtheorem` de esa misma tabla, omite los tipos predefinidos como proof y agrupa los entornos por `\theoremstyle`, de modo que el preámbulo no puede desincronizarse de los tipos disponibles: añadir un tipo es una entrada en la tabla y su `<option>` en `index.html`, y una prueba compara ambas listas.
- **Regla de numeración:** cada entorno declarado con `\newtheorem` mantiene un contador propio, independiente y continuo en todo el documento. `proposition` comparte `\theoremstyle{plain}` con `theorem`, pero **no comparte contador** ni se reinicia por sección. Cambiar esa regla es editar una sola entrada de la tabla, y es un cambio de contrato que debe documentarse aquí.
- **El contenido de un bloque llega al `.tex` tal cual se escribió.** La aplicación no inserta ningún carácter de escape en `content`: ni en prosa, ni en los entornos tipo teorema, ni en los elementos de lista, ni por supuesto en los bloques matemáticos. Escribir `\forall x \in \mathbb{R}` produce exactamente eso, y un fragmento de LaTeX pegado desde otro documento —un `align`, un `tabular`— llega intacto.
- **Los metadatos y los títulos sí se escapan por completo** (`#`, `$`, `%`, `&`, `_`, `{`, `}`, `~`, `^` y `\`). Son valores que la aplicación interpola dentro de un argumento que ella misma genera —`\title{}`, `\section{}`, `\begin{theorem}[…]`—, donde un carácter reservado rompe el argumento y quien escribe no tiene forma de repararlo desde la interfaz. Son dos funciones distintas y con nombres distintos: `contentToLatex()` y `escapeMetadata()`.
- Una **proposición** puede escribirse ya como un solo bloque de prosa con sus fórmulas intercaladas, o bien, si se prefiere destacarlas, como un bloque `proposition` seguido de bloques matemáticos adyacentes. Ambas formas son válidas.

### Por qué el contenido no se escapa

El contenido de un bloque llega al `.tex` sin un solo escape; los metadatos y los
títulos se escapan por completo. El porqué —qué se intentó antes, por qué se retiró y
qué cuesta— está en [DEC-004](decisiones/DEC-004-contenido-sin-escapar.md), y lo
vigilan INV-002 e INV-003. Lo que sigue es el contrato vigente.

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
- El campo `container` de la tabla de tipos define cuáles admiten hijos. La interfaz y el generador aplican la misma regla. Los bloques de texto, los entornos tipo teorema y las dos listas admiten hijos. En un borrador que trae hijos en una fórmula, una imagen o una bibliografía, estos se conservan como hermanos posteriores.
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
- La plantilla `article` incluye solamente `fontenc` (salida latina copiable), `inputenc` (fuente UTF-8), `babel` (español), `amsmath` (matemáticas), `amssymb` (los conjuntos `\mathbb` del tablero de símbolos), `amsthm` (entornos) y `graphicx` (imágenes). El propio preámbulo documenta el motivo. El archivo usa los paquetes estándar de Overleaf y los archivos de imagen que se indiquen en los bloques.
- El resultado termina siempre con un salto de línea y es determinista: el mismo estado produce exactamente la misma cadena.
- El nombre sugerido se deriva del título: minúsculas, sin diacríticos, grupos no alfanuméricos convertidos en guiones y extensión `.tex`. Si queda vacío, se usa **`notas-calculo-3.tex`**.

### Imágenes

Indica la ruta que tendrá el archivo en Overleaf. El archivo seleccionado en el
editor sirve para previsualizarlo durante la sesión. Sube el archivo a Overleaf
con el mismo nombre.

| Opción | Valores y valor inicial |
| --- | --- |
| `width` | Fracción de `\textwidth` entre 0.1 y 1. Inicialmente 0.8. |
| `height` | Altura máxima opcional en cm. Con `width` activa `keepaspectratio`. |
| `angle` | Giro entre −360 y 360 grados. Inicialmente 0. |
| `align` | `center`, `left` o `right`. Inicialmente `center`. |
| `placement` | Subconjunto de `htbp`. Inicialmente `htbp`. |
| `label` | Etiqueta opcional con prefijo `fig:`. Solo admite minúsculas ASCII, cifras, guiones y dos puntos. |

Los tamaños y el giro se redondean a dos decimales. El generador escribe los
límites de escala antes del giro y omite el giro cero, el pie vacío y la etiqueta
vacía. Una ruta vacía omite la imagen y conserva cualquier hijo que traiga el
estado original, emitido después como bloque separado.

```tex
\begin{figure}[htbp]
\centering
\includegraphics[width=0.6\textwidth,angle=90]{figuras/grafica.png}
\caption{Gráfica de la función}
\label{fig:grafica}
\end{figure}
```

En la raíz y en bloques de texto fuera de un entorno, la imagen es flotante.
En un entorno de teorema o lista conserva su lugar, incluso a través de un hijo
de texto. Se escribe con `center` o con un grupo de alineación lateral, seguido
del pie como párrafo. La posición `htbp` solo afecta a las figuras flotantes.
Una etiqueta sin `\caption` avanza el contador de figuras para que `\ref` tenga
un número propio.

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
- `Alt+Mayús+S` (`⌥⇧S` en macOS) o el botón **Buscar** llevan al buscador. El atajo y Escape devuelven el foco al campo de origen con su selección. Si la búsqueda tiene texto, Escape la borra primero.
- Cada botón nativo mide al menos 44 × 44 px y muestra solo el glifo. Una única línea visual presenta `nombre — comando`; está oculta a lectores de pantalla porque el `aria-label` completo del botón ya comunica ambos datos.
- La rejilla tiene una sola parada de tabulación. Las flechas horizontales recorren los símbolos de forma circular, las verticales cambian de fila e Inicio y Fin llevan a los extremos. Re Pág y Av Pág cambian de categoría. Desde la primera fila, ↑ vuelve al buscador. Escribir en la rejilla añade a la búsqueda.
- En el buscador, ↓ lleva al primer resultado e Intro lo inserta. La categoría **Recientes** conserva los últimos doce símbolos distintos en este navegador, fuera del borrador.
- El catálogo compatible con `amsmath` y `amssymb` contiene 210 entradas para griegas, lógica, conjuntos, topología, funciones, cálculo, vectores y estructura.
- Un símbolo sencillo inserta `command`. Una plantilla puede declarar `insert: { before, after }`: envuelve una selección o, si no existe, deja el cursor entre ambas partes.

### Cómo ampliarlo

1. Añade una entrada a `MATH_SYMBOLS` con `id` único, `group`, `symbol`, `command`, `name` y `keywords` en español. Si es una plantilla, añade opcionalmente `insert: { before, after }`.
2. Si hace falta una categoría nueva, declárala en `MATH_SYMBOL_GROUPS`; el selector y la rejilla se generan desde esos arrays, sin modificar HTML ni CSS.
3. Usa únicamente comandos disponibles con `amsmath` y `amssymb`. Incorporar otro paquete es una decisión de producto y exige actualizar el generador y regenerar el ejemplo.
4. Ejecuta `npm test`: se validan coherencia, cobertura, alfabeto griego, comandos prohibidos y comportamiento de inserción.

## Vista previa matemática

La vista bajo «Contenido» se actualiza 200 ms después de escribir. En los bloques
de ecuación representa todo el contenido. En otros bloques reconoce `$…$`,
`$$…$$`, `\(…\)` y `\[…\]`. La estructura del documento muestra las mismas
fórmulas y la salida incluye MathML para tecnologías de asistencia.

En los bloques de lista, «Vista previa de las matemáticas» muestra las viñetas y
la numeración por niveles, con las fórmulas representadas dentro de cada elemento.
«Sangrar» (Alt+Mayús+G) y «Quitar sangría» (Alt+Mayús+Q) actúan sobre las líneas de
la selección. Intro conserva la sangría y continúa los marcadores.

El aviso «No se pudo previsualizar» indica que KaTeX no pudo representar un tramo.
Puedes seguir generando el `.tex`, que conserva el contenido original. Overleaf
compila el documento completo y verifica la prosa, las macros y los entornos.

KaTeX 0.18.7 se distribuye desde `assets/vendor/katex/` con 20 fuentes WOFF2 y
su licencia MIT, aproximadamente 600 KB en total. Funciona con `file://` y sin red.

## Comprobación previa a Overleaf

El editor señala posibles errores de LaTeX bajo «Contenido» después de la misma
pausa que la vista previa. La estructura indica cuántos avisos hay en cada
bloque. Al generar, «Resultado» muestra las líneas y columnas de los avisos y
enlaces a los botones «Editar» de sus bloques. El contenido llega al `.tex` tal
cual, incluso cuando la comprobación encuentra errores.

## Uso

> Para quien solo va a **usar** la aplicación, sin tocar el código, está la
> [**guía de uso**](docs/guia-de-uso.md): lleva de unos apuntes a un PDF
> compilado, e incluye qué hacer cuando Overleaf da error. Para extenderla, la
> [**guía de desarrollo**](docs/guia-de-desarrollo.md), con el mapa del código y
> las recetas de los cambios habituales. Lo que sigue aquí es el resumen del flujo.

1. Abre `index.html` —por doble clic o mediante HTTP—. Verifica los datos prellenados del curso, profesor y fecha, completa el título y añade cada bloque con el botón explícito.
2. Dentro de **Símbolos matemáticos** puedes insertar un comando en la posición del cursor, buscarlo por su nombre o, si ya lo conoces, escribirlo directamente en el contenido.
3. Revisa o cambia el orden con **Editar**, **Añadir dentro**, **Eliminar**, **Subir** y **Bajar**. No hay arrastrar y soltar: los controles nativos funcionan con teclado y evitan otra dependencia.
   - **Añadir dentro** fija el texto, lista o entorno de teorema seleccionado como padre de los siguientes bloques. El formulario muestra el destino y **Añadir en la raíz** deshace la elección.
   - **Subir** y **Bajar** mueven el bloque solo entre sus hermanos, nunca fuera de su nivel; en los extremos el botón aparece deshabilitado.
   - **Mover a…** lleva el bloque y todos sus hijos a la raíz o a otro contenedor, al principio o al final de sus bloques. El foco pasa a **Editar** del bloque movido y se anuncian sus rutas anterior y nueva.
   - Eliminar un bloque con descendencia pide confirmación e indica cuántos bloques anidados se van con él. Si había una edición a medias, se cancela para no escribir sobre un bloque distinto del que se estaba editando.
4. Para repetir una estructura hay **tres acciones distintas**, a propósito, porque copiar y duplicar no son lo mismo:
   - **Duplicar** deja la copia inmediatamente después del original, entre sus mismos hermanos y en su mismo nivel, con toda su descendencia. Es un atajo de un solo paso: no se elige destino. El foco pasa a **Editar** de la copia y, como cualquier cambio estructural, cancela una edición a medias y lo anuncia.
   - **Copiar bloque** guarda el bloque —y su rama entera— en una **bandeja** de la aplicación, sin moverlo ni modificarlo. Después, **Pegar bloque** lo inserta en el destino que muestra el formulario: la raíz, o el bloque que hayas fijado con **Añadir dentro**. La bandeja no se vacía al pegar, así que el mismo bloque se pega tantas veces y en tantos destinos como haga falta. Cada pegado es una copia profunda independiente: editar una no cambia las demás ni al original.
   - **Copiar texto** lleva el contenido del bloque al **portapapeles del sistema**, para pegarlo con `Ctrl+V` donde quieras, dentro o fuera de la aplicación. No es lo mismo que **Copiar código**, que genera y copia el documento entero.
   - La bandeja vive solo en la pestaña abierta: no se guarda en el borrador ni cambia su versión, porque no forma parte del documento.
5. Pulsa **Generar documento** para actualizar el código `.tex` completo.
6. Copia o descarga el resultado y pégalo en Overleaf. Copiar y descargar regeneran el documento antes de exportarlo, así que nunca entregan un `.tex` anterior a los últimos cambios. Si la API moderna del portapapeles no está disponible, se utiliza selección y copia del `textarea` como alternativa.
7. **Guardar borrador** escribe bajo demanda `{ version: 3, metadata, blocks, macros }` en `localStorage` con la clave `tex-notes:draft:v2`. **Restaurar** lee esa clave y, si no existe, la antigua `tex-notes:draft:v1` con su lista plana: la convierte al árbol y lo dice en el anuncio. La restauración normaliza `type`, `title`, `content` y `children` de forma recursiva, tolera datos ausentes, corruptos o mal anidados a cualquier profundidad y nunca lanza. Borrar retira ambas claves, pide confirmación y nunca borra el formulario abierto.

### Apertura directa con `file://`

La aplicación carga **scripts clásicos** para funcionar al abrirla por doble clic.
`index.html` carga primero KaTeX, luego los scripts de `window.TexNotes` y por
último `app.js`. `npm test` comprueba el orden, las rutas y las fuentes locales.

Servir por HTTP sigue siendo válido y es lo que usa GitHub Pages:

```sh
python3 -m http.server 8000
# http://localhost:8000/
```

Con `file://`, el portapapeles puede estar restringido en algunos navegadores; en ese caso la aplicación recurre a seleccionar el `textarea` y avisa por la región `aria-live`.

### GitHub Pages

El flujo [`.github/workflows/pages.yml`](.github/workflows/pages.yml) prueba y publica el contenido estático al recibir cambios en `main`, usando solo acciones oficiales. En **Settings → Pages → Build and deployment**, selecciona **GitHub Actions** y ejecuta el flujo o envía cambios a `main`. Todas las rutas del sitio son relativas, por lo que funciona tanto en un dominio raíz como en una subruta de proyecto.

## Accesibilidad y diseño

La interfaz sigue semántica HTML nativa: un único `main` y `h1`, secciones tituladas, `form`/`fieldset`, **listas ordenadas anidadas** para la jerarquía de bloques y botones reales. Incluye enlace de salto visible al foco cuyo destino puede recibir foco sin añadir una parada al recorrido con `Tab`, encabezados sin saltos, etiquetas visibles enlazadas por `for`/`id`, ayudas mediante `aria-describedby` solo donde aportan contexto, errores junto al campo y regiones `aria-live` para resultados. El foco visible en el contenido confirma también que el enlace de salto cambió el contexto. El orden DOM coincide con el visual.

La estructura de bloques se representa con un `<ol>` dentro del `<li>` de su padre, de modo que el lector de pantalla anuncia el anidamiento por sí mismo. Además, **el nivel y el padre se escriben, no solo se sugieren**: cada bloque muestra «Nivel 2 · dentro de 1 Teorema: Fubini» y su numeración jerárquica («1.1.2»), y cada botón lleva un nombre accesible completo —acción, bloque, nivel y padre—, como `Editar 1.1.1 Texto, nivel 3, dentro de 1.1 Lista con viñetas`. La sangría y el filete lateral son un refuerzo visual, nunca la única señal. Tras cada alta, edición, movimiento o borrado el foco queda en un control previsible —el bloque afectado, el hermano que ocupa su lugar, su padre o el alta de bloque— y el resultado se anuncia en la región `aria-live` existente.

El foco tiene contorno contrastado y no depende del color; los mensajes contienen texto explícito. Los colores están diseñados para contraste AA, incluidos temas claro y oscuro. Objetivos de al menos 44 px, cuadrícula fluida, ausencia de anchos fijos y adaptación bajo 608 px permiten uso desde unos 320 px y zoom al 200 %. `prefers-reduced-motion` reduce las transiciones cuando el usuario lo solicita. Las fuentes matemáticas se sirven con el sitio.

### Revisión manual

La lista de comprobación que se recorre a mano cada ronda —teclado, foco, lector de
pantalla, contraste, zoom, `file://` y compilación en Overleaf— está en
[`docs/revision-manual.md`](docs/revision-manual.md).

## Pruebas automatizadas

Requieren Node.js 20 o posterior, sin instalar paquetes:

```sh
npm test
npm run check:js
```

El inventario de cada prueba, con su nombre y su archivo, está en
[`docs/pruebas.md`](docs/pruebas.md). Se **genera** desde la suite con
`npm run inventario`, así que no puede quedarse atrás; `tests/documentacion.test.js`
exige que esté al día.

Por qué `app.js` no tiene pruebas automatizadas y qué se comprueba a mano en su
lugar: [DEC-007](decisiones/DEC-007-sin-dom-en-pruebas.md) y
[`docs/revision-manual.md`](docs/revision-manual.md).

## Hitos

Los hitos entregados están en [`docs/hitos.md`](docs/hitos.md).

## Criterio de finalización del MVP

El MVP está terminado cuando una persona puede, usando solamente el teclado y con la página abierta por doble clic, crear una nota con al menos dos tipos de bloque, revisar el código generado, copiarlo, descargarlo, recargar la página y recuperar el borrador.

## Pendiente

### Siguiente ronda

- **Bloque de tabla o tabla de verdad** con `tabular`, como las del Repaso −1 del temario.
- **Referencias cruzadas** con etiquetas en teoremas y ecuaciones y una acción para insertar `\ref`.

También siguen pendientes el **modelo de documento de tres niveles** (Unidad → Clase → Bloques) y el módulo de apoyo al curso con cita de asesoría, fechas `.ics` y entregables. Hoy `topic` produce una sola `\section`.

En curso, según el encargo de `agents.md` en la rama `claude/ui-ux`: distribución para Android con barra del pulgar, menús radiales contextuales, identificadores estables de bloque, versiones con archivo de proyecto y selección por alcance.

Quedan expresamente fuera por ahora: TeX en WASM, TikZ/PGFPlots, traducción de errores de TeX, paleta de comandos, buscar y reemplazar, infraestructura de sincronización y cualquier ida y vuelta desde el `.tex` o desde Overleaf a la aplicación. La ejecución de Python está sin decidir y no forma parte de ese encargo.

### Sistema de documentación

Instalado y cerrado. Las capas —[`INVARIANTES.md`](INVARIANTES.md),
[`decisiones/`](decisiones/), los bloques `@decision` y
[`PROTOCOLO.md`](PROTOCOLO.md)—, las dos guías de [`docs/`](docs/) y el reparto de
este README están en su sitio, y [DEC-008](decisiones/DEC-008-seis-documentos.md)
fija qué documento se actualiza al cambiar qué.

Queda decidir, cuando se note la falta, si `## Pendiente` basta como capa prospectiva
o hace falta una bitácora aparte. De momento basta.

Limitación conocida: la huella de los bloques `@decision` colapsa los espacios pero no
los elimina, así que un formateador automático (Prettier o similar) movería todas las
anclas a la vez. Si algún día se adopta uno, hay que endurecer la normalización antes.

## Captura continua

Ctrl+Intro (⌘+Intro en macOS) añade el bloque o guarda sus cambios. El foco
permite encadenar bloques desde Contenido. El autoguardado independiente incluye
el bloque en curso, ofrece recuperarlo al abrir y conserva una sesión anterior.
Las vistas previas de la estructura se reutilizan por contenido y profundidad.

## Asistente de escritura

En Contenido, una barra seguida de letras abre sugerencias locales del catálogo.
Las fórmulas aceptadas desde prosa se envuelven en dólares. Los fragmentos
admiten huecos #1 a #9 y una posición final #0. Tab acepta el menú, avanza huecos,
salta cierres o expande alias; sin trabajo pendiente conserva la navegación.
Escape cierra el menú o termina los huecos. Las preferencias incluyen gestión
de alias y exportación/importación de configuración entre navegadores.

## Comandos y plantillas

El menú / al comienzo de Contenido vacío cambia el tipo y permite escribir un
título tras el comando: /teo Fubini, /ec, /lista o /dem. Demostración usa el
entorno proof predefinido de amsthm, sin newtheorem; su título opcional sustituye
el encabezado. Las once plantillas incluidas se aplican como una cola de pasos
que se confirman con Ctrl+Intro, con destino y profundidad relativos. Se pueden
omitir pasos, cancelar la cola y guardar una rama como plantilla personal.
Las plantillas personales viajan en la configuración y se gestionan en preferencias.

## Macros del documento y borrador v3

`macros` es un array de `{ name, params, body }`. El nombre usa letras latinas,
params es un entero de 0 a 9 y body es literal. `buildPreamble(macros)` emite
newcommand después de graphicx; sin macros la salida de referencia no cambia.
La vista previa emplea las mismas definiciones, aisladas entre renderizados.
La comprobación previa distingue comandos exclusivos de KaTeX y reconoce las
macros del documento.

Los borradores v1 y v2 se normalizan con macros vacías; el v3 las conserva.
Las versiones futuras se rechazan. La clave histórica tex-notes:draft:v2 se
mantiene con un sobre version:3, que las aplicaciones anteriores rechazan.
El autoguardado también incorpora macros. Las predeterminadas se guardan en
tex-notes:macros-default:v1 y se incluyen en la configuración portátil.

## Distribución del editor

Desde 75 rem se muestran dos columnas: editor con desplazamiento propio y
estructura. Los metadatos se pueden plegar y su resumen identifica el documento.
Las tarjetas mantienen Editar y Añadir dentro visibles y agrupan el resto en
Más acciones. El panel de teclado describe el asistente y la navegación nativa.
