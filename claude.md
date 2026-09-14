# Instrucciones para Claude: entrada LaTeX transparente y copia de bloques

## Encargo

Implementa en un único incremento coherente los dos cambios solicitados por el
usuario:

1. al escribir contenido de un bloque, una barra invertida (`\`) debe llegar al
   `.tex` como `\`, no como `\textbackslash{}`; una llave de apertura (`{`) debe
   llegar como `{`, no como `\{`;
2. cada bloque debe ofrecer una acción para copiarlo y así reproducir con rapidez
   estructuras o secciones repetitivas.

No interpretes «copiar» como copiar texto al portapapeles. La aplicación ya tiene
«Copiar código» para el documento generado. En la estructura de bloques, presenta
la nueva acción como **«Duplicar»** para evitar esa ambigüedad: crea otro nodo
editable en el documento.

## Origen verificado del comportamiento

El formulario no altera lo escrito. El cambio aparece al generar LaTeX:

- `assets/js/latex-generator.js` declara un único mapa `ESCAPES` que convierte
  `\` en `\textbackslash{}`, `{` en `\{` y `}` en `\}`.
- `escapeLatexText()` aplica ese mapa mediante la expresión regular
  `[\\#$%&_{}~^]`.
- `escapeMixedText()` conserva solamente los segmentos matemáticos reconocidos
  por `splitMixedContent()` y pasa toda la prosa restante por
  `escapeLatexText()`.
- `blockToLatex()` usa `escapeMixedText()` para `text`, los entornos tipo
  teorema y cada línea de `itemize`/`enumerate`. Por eso el comportamiento se ve
  en el contenido de todos esos bloques.
- Los títulos de bloque, títulos opcionales de entornos y metadatos también usan
  `escapeLatexText()`, pero son contextos diferentes y no deben adoptar sin más
  la nueva política del contenido.

El antecedente de `$` sigue el mismo patrón: antes pertenecía únicamente al
escapado general; ahora `splitMixedContent()` reconoce `$...$` y `$$...$$`, y
solo la prosa restante se escapa. No reviertas esa solución ni vuelvas a tratar
el contenido completo con una sola expresión regular.

También hay afirmaciones y pruebas que fijan expresamente el comportamiento que
ahora se quiere cambiar:

- `tests/generator.test.js` espera `\textbackslash{}` y llaves escapadas en
  `escapeLatexText()` y en contenido de entornos;
- `tests/mixed-math.test.js` espera que una barra fuera de matemáticas se vuelva
  `\textbackslash{}`;
- `README.md` y la ayuda de `index.html` dicen que los comandos fuera de
  delimitadores matemáticos se escapan;
- el tablero inserta comandos como `\forall` y `\mathbb{R}`, por lo que la
  política actual contradice el flujo natural que ofrece la propia interfaz.

## Contrato de entrada y generación

### Contenido de bloques

Separa claramente el escapado de **contenido editable** del escapado de
**metadatos/títulos**. En el contenido de `text`, entornos tipo teorema y líneas
de listas:

- conserva literalmente `\`, `{` y `}`;
- conserva el comportamiento actual de `$...$`, `$$...$$`, `\$` y delimitadores
  sin pareja;
- continúa protegiendo en prosa los demás caracteres reservados que lo
  necesiten: `#`, `%`, `&`, `_`, `~` y `^`;
- dentro de matemática delimitada continúa conservando todo literalmente;
- `equation` y `math-inline` continúan siendo contenido literal.

Aunque el usuario mencionó específicamente `{`, trata `}` de forma simétrica.
Dejar una llave del par con una política distinta sería sorprendente e impediría
escribir comandos normales como `\textbf{texto}` o `\mathbb{R}`.

Ejemplos obligatorios del nuevo contrato:

| Entrada en contenido | Salida del bloque |
| --- | --- |
| `Usa \textbf{este término}.` | `Usa \textbf{este término}.` |
| `Sea A = {1, 2}.` | `Sea A = {1, 2}.` |
| `\forall x \in \mathbb{R}` | `\forall x \in \mathbb{R}` |
| `50% & valor_1` | `50\% \& valor\_1` |
| `Sea $x_1 \in A$.` | sin cambios dentro de `$...$` |
| `Precio: \$5` | conserva `\$` como dólar literal |

No implementes un parser completo de TeX, no intentes validar comandos y no
insertes caracteres adicionales mientras la persona escribe. La transformación
sigue ocurriendo solo al generar el documento.

### Metadatos y títulos

Conserva el escapado defensivo completo en título del documento, autor, curso,
profesor, fecha, tema y títulos de bloque/entorno. Esos valores se interpolan
dentro de argumentos generados por la aplicación y no son el campo destinado a
escribir LaTeX libre. Refactoriza nombres si hace falta para que la diferencia de
contrato sea evidente; evita una función llamada genéricamente
`escapeLatexText()` usada accidentalmente en ambos contextos.

Audita todos los usos del escapado, no solo los dos caracteres reportados. En
particular, prueba comandos con argumentos, llaves sueltas, `\$`, comandos del
tablero, listas, todos los entornos, títulos y metadatos. Actualiza o reemplaza
las expectativas antiguas; no elimines cobertura simplemente porque describía
el contrato anterior.

## Acción «Duplicar» para bloques

### Semántica

Añade una operación pura al módulo del árbol que duplique el nodo indicado por
una ruta válida:

- la copia se inserta **inmediatamente después del original**, dentro de la
  misma lista de hermanos, por lo que conserva padre y nivel;
- copia `type`, `title`, `content` y recursivamente todos los `children`;
- original y copia no deben compartir objetos ni arrays: editar o borrar uno no
  puede modificar el otro;
- devuelve el árbol nuevo y la ruta de la copia, siguiendo el contrato de
  `insertBlock()` y `moveBlock()`;
- una ruta inválida devuelve `null` y no modifica la entrada;
- no incrementes la versión del borrador: el esquema no cambia.

Centraliza esta lógica en `assets/js/block-tree.js`; no montes el duplicado
mutando `blocks` directamente desde `app.js` y no uses serialización JSON como
mecanismo de clonación.

### Interfaz y accesibilidad

En el menú de acciones de cada bloque añade un botón nativo visible
**«Duplicar»**. Su nombre accesible debe incluir el mismo contexto que las demás
acciones: numeración, tipo/título, nivel y padre. Debe funcionar en cualquier
profundidad y con teclado.

Después de duplicar:

- renderiza la estructura y deja el foco en una acción predecible de la copia
  (preferentemente su botón «Editar»);
- anuncia en `#app-status` qué bloque se duplicó y cuál es la ruta nueva;
- si había una edición a medias, aplica la política existente para cambios
  estructurales: cancélala de forma segura y anúncialo;
- conserva el borrador únicamente cuando la persona use «Guardar borrador», como
  ocurre con las demás operaciones; no introduzcas guardado automático;
- no uses Clipboard API para esta acción ni confundas sus mensajes con «Copiar
  código».

Mantén listas anidadas semánticas, objetivos táctiles de al menos 44 px, foco
visible, nombres comprensibles para lector de pantalla, funcionamiento a 320 px
y zoom del 200 %, scripts clásicos y compatibilidad al abrir por `file://`.

## Pruebas mínimas

Añade o actualiza pruebas automatizadas que demuestren:

1. `\`, `{` y `}` se conservan en contenido de texto, cada entorno tipo teorema
   y cada elemento de lista;
2. un comando con argumento (`\textbf{...}`), uno del tablero
   (`\mathbb{R}`) y llaves sueltas llegan sin `\textbackslash{}`, `\{` ni `\}`;
3. `#`, `%`, `&`, `_`, `~` y `^` aún se escapan fuera de matemáticas;
4. `$...$`, `$$...$$`, `\$`, delimitadores sin cerrar, `equation` y
   `math-inline` no sufren regresiones;
5. metadatos y títulos mantienen el escapado completo, incluidas barra y llaves;
6. duplicar una hoja la coloca inmediatamente después, en el mismo nivel;
7. duplicar un bloque de tres niveles crea una copia profunda independiente y
   conserva exactamente el orden de toda la rama;
8. duplicar por una ruta inválida devuelve `null` sin mutar el árbol;
9. la interfaz ofrece «Duplicar» en todos los bloques, con nombre accesible
   contextual, anuncio y gestión de foco;
10. guardar/restaurar después de duplicar mantiene ambas ramas.

Extiende `tests/check-site.mjs` solo con verificaciones estructurales útiles; la
lógica del árbol y del generador debe probarse en tests unitarios, no mediante
búsquedas frágiles de cadenas en el código fuente.

## Documentación y cierre

Actualiza `README.md`, la ayuda visible de `index.html`, el resumen de pruebas y
la lista de revisión manual. Elimina todas las afirmaciones obsoletas que digan
que `\` o las llaves se escapan en contenido, o que un comando del tablero fuera
de `$...$` termina como `\textbackslash{}`. Explica la distinción entre contenido
LaTeX transparente y metadatos/títulos protegidos, y explica que «Duplicar» copia
la rama completa inmediatamente después de la original.

Si el contrato cambia el ejemplo determinista, regenéralo únicamente mediante
`npm run build:example` y revisa su diff. No añadas dependencias, frameworks,
renderizado matemático ni una vista previa nueva.

Antes de entregar:

1. ejecuta `npm test`;
2. ejecuta `npm run check:js`;
3. prueba manualmente comandos, llaves, dólares y caracteres reservados en texto,
   teorema y lista;
4. duplica con teclado una hoja y una rama de tres niveles, edita la copia y
   confirma que el original no cambia;
5. guarda, recarga y restaura el borrador duplicado;
6. abre `index.html` mediante `file://` y comprueba generación y duplicado sin
   errores de consola;
7. pega en un proyecto vacío de Overleaf un resultado que incluya
   `\textbf{...}`, `\mathbb{R}`, matemática delimitada y caracteres escapados, y
   confirma que compila.

Considera terminado el incremento solo cuando el flujo completo sea coherente:
la persona puede escribir comandos y llaves directamente en el contenido,
generar exactamente esa sintaxis y duplicar una rama para editar la repetición
sin afectar al original.
