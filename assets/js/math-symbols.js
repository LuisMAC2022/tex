/**
 * Catálogo estático de símbolos matemáticos.
 *
 * Es deliberadamente pequeño: el tablero sirve para descubrir comandos, no para
 * sustituir a escribirlos. No se carga ninguna biblioteca de renderizado; cada
 * botón muestra el carácter Unicode y el comando, y la aplicación inserta
 * únicamente el comando LaTeX.
 *
 * Campos de cada símbolo:
 * - `id`: identificador único y estable dentro del catálogo.
 * - `group`: identificador de un grupo declarado en `MATH_SYMBOL_GROUPS`.
 * - `symbol`: carácter Unicode que se muestra; nunca es el texto insertado.
 * - `command`: comando LaTeX exacto que se inserta.
 * - `name`: nombre en español, visible y usado en el nombre accesible.
 * - `keywords`: términos de búsqueda en español, sin acentos obligatorios.
 */

export const MATH_SYMBOL_GROUPS = [
  { id: "griegas", label: "Variables griegas" },
  { id: "conectores", label: "Conectores lógicos" },
  { id: "cuantificadores", label: "Cuantificadores" },
  { id: "relaciones", label: "Relaciones" },
  { id: "conjuntos", label: "Conjuntos y números" },
  { id: "agrupacion", label: "Delimitadores y agrupación" },
];

export const MATH_SYMBOLS = [
  { id: "alpha", group: "griegas", symbol: "α", command: "\\alpha", name: "alfa", keywords: ["alfa", "letra griega", "variable"] },
  { id: "beta", group: "griegas", symbol: "β", command: "\\beta", name: "beta", keywords: ["beta", "letra griega", "variable"] },
  { id: "gamma", group: "griegas", symbol: "γ", command: "\\gamma", name: "gamma", keywords: ["gamma", "letra griega", "variable"] },
  { id: "varphi", group: "griegas", symbol: "φ", command: "\\varphi", name: "fi variante", keywords: ["fi", "phi", "letra griega", "proposicion"] },

  { id: "neg", group: "conectores", symbol: "¬", command: "\\neg", name: "negación", keywords: ["negacion", "no", "complemento logico"] },
  { id: "land", group: "conectores", symbol: "∧", command: "\\land", name: "conjunción", keywords: ["conjuncion", "y", "and"] },
  { id: "lor", group: "conectores", symbol: "∨", command: "\\lor", name: "disyunción", keywords: ["disyuncion", "o", "or"] },
  { id: "implies", group: "conectores", symbol: "⇒", command: "\\Rightarrow", name: "implicación", keywords: ["implica", "implicacion", "entonces", "condicional"] },
  { id: "iff", group: "conectores", symbol: "⇔", command: "\\Leftrightarrow", name: "doble implicación", keywords: ["si y solo si", "bicondicional", "equivale", "doble implicacion"] },

  { id: "forall", group: "cuantificadores", symbol: "∀", command: "\\forall", name: "cuantificador universal", keywords: ["para todo", "todo", "universal", "cuantificador"] },
  { id: "exists", group: "cuantificadores", symbol: "∃", command: "\\exists", name: "cuantificador existencial", keywords: ["existe", "alguno", "existencial", "cuantificador"] },

  { id: "equal", group: "relaciones", symbol: "=", command: "=", name: "igual", keywords: ["igual", "igualdad"] },
  { id: "neq", group: "relaciones", symbol: "≠", command: "\\neq", name: "distinto", keywords: ["distinto", "no igual", "desigual"] },
  { id: "in", group: "relaciones", symbol: "∈", command: "\\in", name: "pertenece", keywords: ["pertenece", "elemento de", "pertenencia"] },
  { id: "notin", group: "relaciones", symbol: "∉", command: "\\notin", name: "no pertenece", keywords: ["no pertenece", "no es elemento"] },
  { id: "subseteq", group: "relaciones", symbol: "⊆", command: "\\subseteq", name: "subconjunto", keywords: ["subconjunto", "contenido en", "inclusion"] },

  { id: "naturals", group: "conjuntos", symbol: "ℕ", command: "\\mathbb{N}", name: "números naturales", keywords: ["naturales", "n", "conjunto numerico"] },
  { id: "integers", group: "conjuntos", symbol: "ℤ", command: "\\mathbb{Z}", name: "números enteros", keywords: ["enteros", "z", "conjunto numerico"] },
  { id: "rationals", group: "conjuntos", symbol: "ℚ", command: "\\mathbb{Q}", name: "números racionales", keywords: ["racionales", "q", "conjunto numerico"] },
  { id: "reals", group: "conjuntos", symbol: "ℝ", command: "\\mathbb{R}", name: "números reales", keywords: ["reales", "r", "conjunto numerico"] },
  { id: "emptyset", group: "conjuntos", symbol: "∅", command: "\\emptyset", name: "conjunto vacío", keywords: ["vacio", "conjunto vacio", "nulo"] },
  { id: "cup", group: "conjuntos", symbol: "∪", command: "\\cup", name: "unión", keywords: ["union", "reunion", "conjuntos"] },
  { id: "cap", group: "conjuntos", symbol: "∩", command: "\\cap", name: "intersección", keywords: ["interseccion", "comun", "conjuntos"] },

  { id: "paren-open", group: "agrupacion", symbol: "(", command: "(", name: "paréntesis de apertura", keywords: ["parentesis", "abrir", "agrupar"] },
  { id: "paren-close", group: "agrupacion", symbol: ")", command: ")", name: "paréntesis de cierre", keywords: ["parentesis", "cerrar", "agrupar"] },
  { id: "brace-open", group: "agrupacion", symbol: "{", command: "\\{", name: "llave de apertura", keywords: ["llave", "abrir", "conjunto por extension"] },
  { id: "brace-close", group: "agrupacion", symbol: "}", command: "\\}", name: "llave de cierre", keywords: ["llave", "cerrar", "conjunto por extension"] },
  { id: "left-paren", group: "agrupacion", symbol: "(", command: "\\left(", name: "paréntesis ajustable de apertura", keywords: ["parentesis grande", "left", "ajustable"] },
  { id: "right-paren", group: "agrupacion", symbol: ")", command: "\\right)", name: "paréntesis ajustable de cierre", keywords: ["parentesis grande", "right", "ajustable"] },
  { id: "mid", group: "agrupacion", symbol: "|", command: "\\mid", name: "barra de separación", keywords: ["tal que", "barra", "divide", "condicion"] },
];

const SPOKEN_CHARACTERS = {
  "\\": " barra invertida ",
  "{": " llave izquierda ",
  "}": " llave derecha ",
  "(": " paréntesis izquierdo ",
  ")": " paréntesis derecho ",
  "[": " corchete izquierdo ",
  "]": " corchete derecho ",
  "=": " igual ",
  "|": " barra vertical ",
};

/** Convierte un comando en una lectura comprensible: `\forall` → «barra invertida forall». */
export function describeCommand(command = "") {
  return String(command)
    .replace(/[\\{}()[\]=|]/g, (character) => SPOKEN_CHARACTERS[character])
    .replace(/\s+/g, " ")
    .trim();
}

/** Nombre accesible del botón de un símbolo. */
export function symbolAccessibleName(symbol = {}) {
  return `Insertar ${symbol.name}, comando ${describeCommand(symbol.command)}`;
}

/** Normaliza para buscar: sin diacríticos, en minúsculas y sin espacios sobrantes. */
export function normalizeSearchTerm(value = "") {
  return String(value).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/**
 * Filtra el catálogo por nombre, comando o términos de búsqueda.
 * Una consulta vacía devuelve el catálogo completo; varias palabras se exigen todas.
 */
export function filterMathSymbols(query = "", symbols = MATH_SYMBOLS) {
  const tokens = normalizeSearchTerm(query).split(/\s+/).filter(Boolean);
  if (!tokens.length) return [...symbols];
  return symbols.filter((symbol) => {
    const haystack = normalizeSearchTerm([symbol.name, symbol.command, symbol.symbol, ...(symbol.keywords || [])].join(" "));
    return tokens.every((token) => haystack.includes(token));
  });
}

/** Símbolos de un grupo, en el orden declarado en el catálogo. */
export function symbolsByGroup(groupId, symbols = MATH_SYMBOLS) {
  return symbols.filter((symbol) => symbol.group === groupId);
}
