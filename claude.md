# Instrucciones para Claude: matemática mixta y bloques anidados

## Objetivo

Implementa en la aplicación actual, en un solo incremento coherente, estas dos capacidades solicitadas después de probar la interfaz:

1. permitir expresiones matemáticas delimitadas con `$...$` y `$$...$$` dentro del contenido de un bloque textual, sin que esos delimitadores ni la sintaxis matemática interior se escapen;
2. permitir que los bloques contengan otros bloques, con una representación, edición y generación LaTeX realmente recursivas.

No te limites a cambiar textos de ayuda ni a quitar `$` de una expresión regular: ambas funciones deben quedar implementadas, documentadas y cubiertas por pruebas.

## Diagnóstico verificado del estado actual

- `escapeLatexText()` incluye `$` en `ESCAPES` y en su expresión regular. `blockToLatex()` aplica esa función a todo bloque de texto, teorema y elemento de lista. Por ello, `Sea $x_1$` termina como `Sea \$x\_1\$` y no abre modo matemático.
- Los tipos `equation` y `math-inline` conservan LaTeX literal, pero son bloques independientes. No permiten intercalar prosa y varias fórmulas dentro de un mismo párrafo o entorno.
- El estado usa una lista plana `blocks`; cada bloque solo tiene `type`, `title` y `content`. La interfaz identifica la edición por un índice de primer nivel, muestra un solo `<ol>` y solo permite subir o bajar elementos dentro de esa lista.
- `buildBody()` hace un `map(blockToLatex)` plano. `blockToLatex()` no conoce hijos, así que el generador tampoco puede emitir entornos anidados.
- El borrador persistido tiene `version: 1` y la restauración filtra/mapea únicamente bloques planos. El ejemplo, las pruebas y la especificación del README también fijan ese contrato plano.

## Requisito 1: matemática delimitada dentro del texto

### Comportamiento requerido

Crea una función pura para transformar contenido mixto. Debe recorrer el texto y distinguir:

- prosa fuera de delimitadores: conserva el escapado actual de caracteres reservados;
- matemática entre `$...$`: conserva literalmente delimitadores y contenido;
- matemática entre `$$...$$`: conserva literalmente delimitadores y contenido, incluso si ocupa varias líneas.

Por ejemplo:

```text
El costo es 50% y $x_1 \in A & B$.
```

debe producir:

```tex
El costo es 50\% y $x_1 \in A & B$.
```

Aplica esta transformación al contenido en prosa de `text` y de los entornos tipo teorema. Aplícala también al texto de cada elemento de lista para que una línea pueda mezclar prosa y matemática. Los metadatos y títulos continúan siendo texto puro y deben seguir escapándose completamente; los bloques `equation` y `math-inline` deben conservar su comportamiento literal actual.

Define y documenta una conducta determinista para delimitadores sin cerrar y para un dólar literal escapado por el usuario (`\$`). La prioridad es no generar silenciosamente una apertura matemática rota: un delimitador sin pareja debe tratarse como texto literal escapado. No intentes construir un parser completo de TeX ni validar la expresión matemática.

### Pruebas mínimas

Añade casos automatizados para:

- una fórmula `$...$` entre prosa, con `_`, `^`, llaves, barra invertida y `&` dentro;
- dos fórmulas en el mismo párrafo;
- `$$...$$` multilínea;
- caracteres reservados antes y después de la fórmula;
- un delimitador sin cerrar y `\$` literal;
- contenido mixto dentro de un teorema y dentro de un elemento de lista;
- no regresión de metadatos, títulos y bloques matemáticos existentes.

## Requisito 2: modelo y editor de bloques anidados

### Modelo de datos

Extiende cada bloque con `children`, una lista ordenada de bloques que pueden tener sus propios hijos sin imponer una profundidad artificial. Normaliza los estados antiguos para que la ausencia de `children` equivalga a `children: []`; no obligues a reescribir manualmente el ejemplo plano.

Centraliza las operaciones del árbol mediante rutas estables (por ejemplo, matrices de índices) y funciones puras para buscar, insertar, actualizar, eliminar y mover. No uses solo el índice de primer nivel ni identifiques nodos por su texto. Una operación inválida debe fallar de forma controlada sin corromper el estado.

### Generación LaTeX

Haz recursiva la serialización. Los hijos de un bloque que abre un entorno deben emitirse antes de su `\end{...}`, preservando el orden. En un bloque de texto, sus hijos deben emitirse después de su propio contenido. Define explícitamente qué tipos pueden aceptar hijos si hay combinaciones que producirían LaTeX inválido; la interfaz y el generador deben aplicar la misma regla.

No concatenes los hijos dentro de `content`: deben seguir siendo nodos editables e independientes. Evita líneas en blanco accidentales y conserva la salida determinista.

Incluye al menos una prueba con tres niveles y otra que compruebe exactamente este orden conceptual:

```tex
\begin{theorem}
Texto del padre.
\begin{itemize}
\item ...
\end{itemize}
\end{theorem}
```

### Interfaz accesible

La persona debe poder:

- añadir un bloque en la raíz o como hijo de un bloque existente;
- reconocer visualmente y con lector de pantalla el nivel y el padre;
- editar y eliminar cualquier nodo;
- subirlo o bajarlo entre sus hermanos sin sacarlo accidentalmente de su nivel;
- anidar a más de un nivel.

Representa la jerarquía con listas anidadas semánticas. Usa botones nativos y etiquetas accesibles que incluyan contexto suficiente (acción, bloque y nivel o padre); no dependas solo de sangría, color, arrastrar y soltar ni `aria-label` genéricos. Tras cada acción conserva una ubicación de foco predecible y anuncia el resultado en la región activa existente. Mantén navegación completa por teclado, objetivos táctiles adecuados y una jerarquía comprensible a 320 px y con zoom al 200 %.

No añadas frameworks, bibliotecas de árboles ni JavaScript remoto. Esta aplicación debe seguir funcionando al abrir `index.html` mediante `file://` y mantener scripts clásicos en el orden correcto.

### Persistencia y compatibilidad

Versiona el nuevo esquema de borrador. Restaura de forma defensiva tanto borradores planos `version: 1` como el nuevo árbol, normalizando recursivamente `type`, `title`, `content` y `children`. Rechaza o sanea valores mal formados en cualquier profundidad sin lanzar una excepción no controlada. Conserva los datos actuales del formulario y la edición manual.

Añade pruebas para migración desde v1, restauración del nuevo esquema, operaciones por ruta, movimientos limitados a hermanos y datos corruptos/anidación mal formada.

## Documentación y criterios de entrega

Actualiza `README.md`, la ayuda visible de `index.html`, el estado de ejemplo si aporta cobertura y la lista de revisión manual. Elimina afirmaciones que digan que la estructura solo es plana o que la matemática debe ir necesariamente en un bloque contiguo. Explica con ejemplos breves la sintaxis `$...$`/`$$...$$`, el dólar literal y cómo añadir hijos.

Antes de terminar:

1. ejecuta `npm test` y `npm run check:js`;
2. comprueba que el ejemplo determinista continúa coincidiendo con su archivo de referencia o regenéralo de forma intencional;
3. realiza la revisión manual por teclado de altas, edición, movimientos, eliminación y foco en al menos tres niveles;
4. prueba guardado y restauración de un árbol, además de la migración de un borrador v1;
5. verifica el `.tex` resultante en Overleaf con texto mixto y entornos anidados;
6. mantén WCAG 2.1 AA, HTML semántico, DOM sencillo y ausencia de dependencias innecesarias.

Considera terminado el trabajo solo cuando las dos capacidades se puedan usar conjuntamente: por ejemplo, un teorema con texto y `$x_1$` que contenga una lista hija cuyos elementos también incluyan matemática delimitada.
