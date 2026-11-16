# Notas LaTeX

Aplicación web estática para consolidar apuntes de clase y exportarlos como un archivo LaTeX autocontenido. El editor y el borrador funcionan en el navegador, con KaTeX y sus fuentes incluidos en el sitio.

> Invariantes vigiladas: [`INVARIANTES.md`](INVARIANTES.md) · por qué de cada
> decisión: [`decisiones/`](decisiones/) · reglas para agentes:
> [`PROTOCOLO.md`](PROTOCOLO.md) · cómo se usa:
> [`docs/guia-de-uso.md`](docs/guia-de-uso.md) · cómo se extiende:
> [`docs/guia-de-desarrollo.md`](docs/guia-de-desarrollo.md)

> **Overleaf es la copia maestra.** Esta aplicación es un frente de redacción **de ida**: el `.tex` generado se copia o se descarga y se pega en Overleaf, donde se corrige y se compila. Las correcciones hechas allí no vuelven a la aplicación.


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
- El campo `container` de la tabla de tipos define cuáles admiten hijos. La interfaz y el generador aplican la misma regla. Los bloques de texto, los cinco entornos tipo teorema y las dos listas admiten hijos. En un borrador que trae hijos en una fórmula o bibliografía, estos se conservan como hermanos posteriores.
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
- La rejilla tiene una sola parada de tabulación. Las flechas horizontales recorren los símbolos de forma circular, las verticales cambian de fila e Inicio y Fin llevan a los extremos.
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

El aviso «No se pudo previsualizar» indica que KaTeX no pudo representar un tramo.
Puedes seguir generando el `.tex`, que conserva el contenido original. Overleaf
compila el documento completo y verifica la prosa, las macros y los entornos.

KaTeX 0.18.7 se distribuye desde `assets/vendor/katex/` con 20 fuentes WOFF2 y
su licencia MIT, aproximadamente 600 KB en total. Funciona con `file://` y sin red.

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
   - Eliminar un bloque con descendencia pide confirmación e indica cuántos bloques anidados se van con él. Si había una edición a medias, se cancela para no escribir sobre un bloque distinto del que se estaba editando.
4. Para repetir una estructura hay **tres acciones distintas**, a propósito, porque copiar y duplicar no son lo mismo:
   - **Duplicar** deja la copia inmediatamente después del original, entre sus mismos hermanos y en su mismo nivel, con toda su descendencia. Es un atajo de un solo paso: no se elige destino. El foco pasa a **Editar** de la copia y, como cualquier cambio estructural, cancela una edición a medias y lo anuncia.
   - **Copiar bloque** guarda el bloque —y su rama entera— en una **bandeja** de la aplicación, sin moverlo ni modificarlo. Después, **Pegar bloque** lo inserta en el destino que muestra el formulario: la raíz, o el bloque que hayas fijado con **Añadir dentro**. La bandeja no se vacía al pegar, así que el mismo bloque se pega tantas veces y en tantos destinos como haga falta. Cada pegado es una copia profunda independiente: editar una no cambia las demás ni al original.
   - **Copiar texto** lleva el contenido del bloque al **portapapeles del sistema**, para pegarlo con `Ctrl+V` donde quieras, dentro o fuera de la aplicación. No es lo mismo que **Copiar código**, que copia el documento entero ya generado.
   - La bandeja vive solo en la pestaña abierta: no se guarda en el borrador ni cambia su versión, porque no forma parte del documento.
5. Pulsa **Generar documento** para actualizar el código `.tex` completo.
6. Copia o descarga el resultado y pégalo en Overleaf. Si la API moderna del portapapeles no está disponible, se utiliza selección y copia del `textarea` como alternativa.
7. **Guardar borrador** escribe bajo demanda `{ version: 2, metadata, blocks }` en `localStorage` con la clave `tex-notes:draft:v2`. **Restaurar** lee esa clave y, si no existe, la antigua `tex-notes:draft:v1` con su lista plana: la convierte al árbol y lo dice en el anuncio. La restauración normaliza `type`, `title`, `content` y `children` de forma recursiva, tolera datos ausentes, corruptos o mal anidados a cualquier profundidad y nunca lanza. Borrar retira ambas claves, pide confirmación y nunca borra el formulario abierto.

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

Siguen pendientes el **diccionario de macros** (`macros.js` y `validate.js`, con nombres reservados, aridad y renderizado en KaTeX) y el **modelo de documento de tres niveles** (Unidad → Clase → Bloques). Hoy `topic` produce una sola `\section`. Después viene el módulo de apoyo al curso, con cita de asesoría, fechas `.ics` y entregables.

El bloque de imagen queda pendiente de implementación. El [encargo original](https://github.com/LuisMAC2022/tex/blob/e515a9cece9aad07cdeb2a49d2b274d06cd8844c/agents.md) describe `\includegraphics`, el uso de `graphicx` y los casos de exportación que se deben comprobar en Overleaf.

Dentro de la entrada matemática quedan pendientes los alias personales (`imp` → `\Rightarrow`) y mover un bloque de un padre a otro: hoy **Subir** y **Bajar** solo reordenan entre hermanos, y cambiar de padre exige volver a crear el bloque.

Quedan expresamente fuera por ahora: TeX en WASM, TikZ/PGFPlots, traducción de errores de TeX, paleta de comandos, buscar y reemplazar, historial de versiones, infraestructura de sincronización y cualquier ida y vuelta desde Overleaf a la aplicación.

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
