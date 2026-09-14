# Notas LaTeX

Aplicación web estática, sin dependencias de ejecución, para ordenar apuntes y exportarlos como un archivo LaTeX reproducible. Todo el trabajo —incluido el borrador versionado— permanece en el navegador del dispositivo; la aplicación no envía información a un servidor.

> **Alcance de la primera versión:** no interpreta, valida ni compila las matemáticas. Una ecuación se copia literalmente al `.tex`; la prueba automatizada compara cadenas `.tex`, no genera ni compara PDF.

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
    { type: "text|definition|theorem|proposition|example|exercise|solution|equation|math-inline|itemize|enumerate", title: "opcional", content: "texto" }
  ]
}
```

- El **título de la nota** es el único campo obligatorio en la interfaz. Autor, curso, profesor y fecha son opcionales.
- El **tema o unidad** produce una `\section` cuando no está vacío.
- `blocks` es una lista ordenada. Su orden determina exactamente el orden del cuerpo del documento.
- Los bloques `definition`, `theorem`, `proposition`, `example`, `exercise` y `solution` se convierten en sus entornos homónimos; `text` es texto normal y, si tiene título, comienza con `\subsection`.
- Hay **dos tipos de contenido matemático**, deliberadamente separados del texto: `equation` queda delimitado por `\[` y `\]` en líneas propias, y `math-inline` por `\(` y `\)` en una sola línea. Ambos conservan literalmente lo escrito.
- `itemize` y `enumerate` producen listas: **cada línea no vacía del contenido es un `\item`**, con su texto escapado.
- Los caracteres reservados `#`, `$`, `%`, `&`, `_`, `{`, `}`, `~`, `^` y `\` se escapan en metadatos, títulos, contenido textual y elementos de lista. En cambio, el contenido de un **bloque matemático conserva literalmente la sintaxis escrita por el usuario**. El escapado nunca se desactiva de forma global: escribir `\forall` en una proposición produce `\textbackslash{}forall`, y para obtener el símbolo hay que añadir un bloque matemático contiguo.
- Una **proposición** se compone, por tanto, de un bloque `proposition` con su enunciado en prosa y uno o más bloques matemáticos adyacentes. No existe todavía un análisis de LaTeX mixto dentro de un mismo bloque.
- **Regla de numeración:** cada entorno declarado con `\newtheorem` mantiene un contador propio, independiente y continuo en todo el documento. `proposition` no comparte contador con `theorem` ni se reinicia por sección. Cambiar esta regla —por ejemplo, compartir contador con `[theorem]` o numerar por sección— exige editar una sola línea `declaration` en `assets/js/block-types.js`.
- Los tipos de bloque están centralizados en [`assets/js/block-types.js`](assets/js/block-types.js): de ahí salen las etiquetas visibles, las declaraciones del preámbulo, la transformación del generador y los tipos que acepta el importador. `npm test` comprueba que la lista de `<option>` de `index.html` coincide exactamente, en valor y orden, con ese catálogo.
- Los saltos CRLF y CR se normalizan a LF. Las líneas vacías de un bloque textual conservan los párrafos. Los bloques sin contenido no se emiten.
- La plantilla `article` incluye solamente `fontenc` (salida latina copiable), `inputenc` (fuente UTF-8), `babel` (español), `amsmath` (matemáticas), `amssymb` (los conjuntos `\mathbb` del tablero) y `amsthm` (entornos). El propio preámbulo documenta el motivo.
- El resultado termina siempre con un salto de línea y es determinista: el mismo estado produce exactamente la misma cadena.
- Antes del LaTeX visible se escribe un sobre de comentarios estable, `% TEX-NOTES:FORMAT:1`, con secciones `METADATA` y `BLOCK` cuyos datos JSON UTF-8 están codificados en Base64. La codificación evita que los datos puedan cerrar un marcador y los comentarios no afectan a la compilación.
- El importador lee exclusivamente ese sobre y se detiene en `% TEX-NOTES:CONTENT:BEGIN`: no analiza comandos generales de TeX ni ejecuta el contenido. Por ello, un texto de usuario idéntico a un marcador —incluso dentro de una ecuación sin escapar— se conserva como dato codificado y cualquier apariencia de marcador en el LaTeX posterior se ignora.
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
    { "type": "example", "title": "Rectángulo", "content": "Para f(x,y)=x+y en [0,1] \\times [0,2], calculamos el valor por iteración.\n\nEste bloque tiene dos párrafos y conserva el signo = como texto." },
    { "type": "exercise", "title": "Práctica #1", "content": "Calcula el área de A = [0,2] \\times [0,3]." },
    { "type": "solution", "title": "", "content": "El área es 2 \\times 3 = 6 unidades cuadradas." }
  ]
}
```

El archivo exacto producido y comprobado byte a byte es [`examples/calculo-3.tex`](examples/calculo-3.tex). Se mantiene como archivo de referencia independiente para que cualquier cambio del formato versionado sea explícito en la revisión.

## Símbolos matemáticos

El tablero de símbolos es un mecanismo de **descubrimiento**, no el modo principal de entrada. La progresión prevista es: pulsar un botón del tablero, buscar por nombre (por ejemplo «para todo», «implica» o «conjunción»), escribir el comando directamente y, más adelante, definir alias personales.

- El tablero vive plegado dentro del editor de bloques, en `<details><summary>`, y se abre con teclado o ratón.
- Cada símbolo es un `button` nativo que muestra **nombre, carácter Unicode y comando LaTeX**, y expone un nombre accesible explícito, como `Insertar cuantificador universal, comando barra invertida forall`: el carácter por sí solo no basta con lector de pantalla.
- Al pulsarlo se inserta **únicamente el comando** en `#block-content`, en la posición del cursor: sustituye la selección si la hay, conserva el resto, devuelve el foco al campo, deja el cursor tras lo insertado y anuncia el símbolo en `#app-status`, sin releer todo el tablero.
- No se carga ninguna biblioteca de renderizado matemático: aumentaría el peso y la complejidad sin ser necesaria para insertar texto.
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

Queda fuera de esta iteración lo que la lectura por nombre no resuelve: alias personales (`imp` → `\Rightarrow`), vista previa renderizada y comandos con argumentos que coloquen el cursor entre llaves.

## Uso

1. Abre el sitio mediante HTTP, completa los datos y añade cada bloque con el botón explícito.
2. Dentro de **Símbolos matemáticos** puedes insertar un comando en la posición del cursor, buscarlo por su nombre o, si ya lo conoces, escribirlo directamente en el contenido.
3. Revisa o cambia el orden con **Editar**, **Eliminar**, **Subir** y **Bajar**. No hay arrastrar y soltar: los controles nativos funcionan con teclado y evitan otra dependencia.
4. Pulsa **Generar documento**; la vista previa solo cambia entonces, no con cada pulsación.
5. Copia o descarga el resultado. Si la API moderna del portapapeles no está disponible, se utiliza selección y copia del `textarea` como alternativa.
6. **Guardar borrador** escribe bajo demanda `{ version: 1, metadata, blocks }` en `localStorage` con la clave `tex-notes:draft:v1`. Restaurar tolera datos ausentes o corruptos. Borrar pide confirmación y nunca borra el formulario abierto.
7. **Importar un documento .tex** acepta inicialmente solo archivos exportados por la aplicación, de hasta 1 MB. Se valida y analiza localmente antes de tocar el editor; se anuncia título y número de bloques, y si el documento abierto no está vacío se solicita confirmación antes de reemplazarlo. Un error o una cancelación conserva todo el contenido abierto.

### Servidor HTTP local

Desde la raíz del repositorio, utiliza una de estas opciones y visita la URL indicada:

```sh
python3 -m http.server 8000
# http://localhost:8000/
```

También sirve `npx serve .`, si ya se dispone de esa herramienta. Abrir `index.html` directamente puede limitar el portapapeles o los módulos ES en algunos navegadores; por eso se recomienda HTTP.

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
- [ ] Importar un `.tex` propio con y sin contenido abierto; comprobar resumen, confirmación, foco y anuncios con lector de pantalla.

## Pruebas automatizadas

Requieren Node.js 20 o posterior, sin instalar paquetes:

```sh
npm test
npm run check:js
```

`npm test` comprueba estructura HTML esencial y asociaciones de etiquetas, rutas relativas e internas, caracteres reservados, títulos y bloques vacíos, varios párrafos, ecuaciones multilínea, nombres de archivo, ida y vuelta de importación, UTF-8, CRLF, límites y errores de formato, además de la equivalencia byte a byte con `examples/calculo-3.tex`. También cubre las proposiciones con y sin título, la combinación de texto y fórmula, los dos tipos de matemática, las listas, la inserción en el cursor —principio, medio, final, con selección activa, campo vacío, índices fuera de rango y caracteres Unicode— y la coherencia entre el selector de `index.html`, el catálogo de tipos y el generador. `npm run check:js` analiza la sintaxis de todos los módulos. La compilación de LaTeX queda deliberadamente fuera del flujo: se comparan cadenas `.tex`, no PDF compilados.

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

Guardado explícito, restauración defensiva y borrado confirmado en `localStorage`.
</details>
<details><summary><strong>7. Publicación</strong>: despliegue automatizado en GitHub Pages</summary>

Flujo oficial que prueba y publica el sitio estático desde `main`.
</details>

<details><summary><strong>8. Entrada matemática</strong>: tablero de símbolos y proposiciones</summary>

Catálogo estático sin dependencias, inserción accesible en la posición del cursor, entorno `proposition` y separación explícita entre texto, matemática en línea y matemática destacada.
</details>

## Criterio de finalización del MVP

El MVP está terminado cuando una persona puede, usando solamente el teclado, crear una nota con al menos dos tipos de bloque, revisar el código generado, copiarlo, descargarlo, recargar la página y recuperar el borrador.

Quedan expresamente para iteraciones posteriores: plantillas múltiples, alias y macros personalizadas, importación de `.tex` ajenos a la aplicación, vista previa matemática renderizada, listas anidadas, texto y fórmulas mezclados dentro de un mismo bloque, historial de documentos y compilación.
