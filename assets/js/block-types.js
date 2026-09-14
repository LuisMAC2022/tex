/**
 * Única fuente de verdad de los tipos de bloque.
 *
 * La lista de `<option>` de `#block-type`, las etiquetas que muestra la interfaz,
 * los tipos aceptados por el importador y la salida del generador se derivan de
 * este catálogo, de modo que añadir un entorno no obligue a tocar cuatro sitios.
 *
 * Campos de cada entrada:
 * - `value`: identificador estable que viaja en el borrador y en el archivo .tex.
 * - `label`: nombre visible, idéntico en el selector y en la lista de bloques.
 * - `kind`: cómo se transforma el contenido. `text` y `environment` escapan el
 *   texto; `math` lo conserva literalmente; `list` escapa cada línea como ítem.
 * - `declaration`: línea del preámbulo, solo para `environment`.
 * - `environment`: nombre del entorno LaTeX, solo para `environment`.
 * - `delimiters` y `inline`: delimitadores y disposición, solo para `math`.
 * - `listEnvironment`: entorno de lista, solo para `list`.
 *
 * Regla de numeración: cada entorno declarado con `\newtheorem` mantiene un
 * contador propio, independiente y continuo en todo el documento. `proposition`
 * no comparte contador con `theorem` ni se reinicia en cada sección.
 */

export const BLOCK_TYPES = [
  { value: "text", label: "Texto", kind: "text" },
  { value: "definition", label: "Definición", kind: "environment", environment: "definition", declaration: "\\newtheorem{definition}{Definición}" },
  { value: "theorem", label: "Teorema", kind: "environment", environment: "theorem", declaration: "\\newtheorem{theorem}{Teorema}" },
  { value: "proposition", label: "Proposición", kind: "environment", environment: "proposition", declaration: "\\newtheorem{proposition}{Proposición}" },
  { value: "example", label: "Ejemplo", kind: "environment", environment: "example", declaration: "\\newtheorem{example}{Ejemplo}" },
  { value: "exercise", label: "Ejercicio", kind: "environment", environment: "exercise", declaration: "\\newtheorem{exercise}{Ejercicio}" },
  { value: "solution", label: "Solución", kind: "environment", environment: "solution", declaration: "\\newenvironment{solution}{\\par\\noindent\\textbf{Solución.} }{\\hfill$\\square$\\par}" },
  { value: "equation", label: "Ecuación destacada", kind: "math", delimiters: ["\\[", "\\]"], inline: false },
  { value: "math-inline", label: "Expresión matemática en línea", kind: "math", delimiters: ["\\(", "\\)"], inline: true },
  { value: "itemize", label: "Lista con viñetas", kind: "list", listEnvironment: "itemize" },
  { value: "enumerate", label: "Lista numerada", kind: "list", listEnvironment: "enumerate" },
];

const BY_VALUE = new Map(BLOCK_TYPES.map((type) => [type.value, type]));

/** Tipo por identificador; devuelve `undefined` si no está declarado. */
export function getBlockType(value) {
  return BY_VALUE.get(value);
}

/** Indica si el generador y el importador reconocen el identificador. */
export function isBlockType(value) {
  return BY_VALUE.has(value);
}

/** Etiqueta visible de un tipo, con alternativa genérica para datos desconocidos. */
export function blockTypeLabel(value) {
  return BY_VALUE.get(value)?.label || "Bloque";
}

/** Identificadores válidos, en el mismo orden que el selector de la interfaz. */
export const BLOCK_TYPE_VALUES = BLOCK_TYPES.map((type) => type.value);

/** Tipos cuyo contenido se conserva literalmente, sin escapar. */
export const LITERAL_BLOCK_TYPES = BLOCK_TYPES.filter((type) => type.kind === "math").map((type) => type.value);
