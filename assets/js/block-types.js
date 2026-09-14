/**
 * Tabla única de tipos de bloque.
 * El preámbulo, la interfaz y el generador se derivan de aquí: añadir un tipo
 * es una sola entrada en esta tabla (y su opción en index.html, que una prueba
 * compara contra esta lista).
 */
(function (global) {
  "use strict";
  const TexNotes = global.TexNotes || (global.TexNotes = {});

  /**
   * kind: "text" | "equation" | "theorem" | "list".
   * Los tipos "theorem" declaran un entorno amsthm; buildTheoremDefs() agrupa
   * sus \newtheorem por style para no repetir \theoremstyle.
   * Los tipos "equation" conservan el contenido literalmente y solo se
   * diferencian por sus delimitadores: destacada en líneas propias o en línea.
   * Los tipos "list" escapan cada línea no vacía y la convierten en un \item.
   *
   * Numeración: cada entorno declarado con \newtheorem lleva un contador propio,
   * independiente y continuo en todo el documento. "proposition" no comparte
   * contador con "theorem" ni se reinicia por sección.
   */
  const BLOCK_TYPES = [
    { id: "text", label: "Texto", kind: "text" },
    { id: "equation", label: "Ecuación destacada", kind: "equation", delimiters: ["\\[", "\\]"] },
    { id: "math-inline", label: "Expresión matemática en línea", kind: "equation", delimiters: ["\\(", "\\)"], inline: true },
    { id: "definition", label: "Definición", kind: "theorem", environment: "definition", heading: "Definición", style: "definition" },
    { id: "theorem", label: "Teorema", kind: "theorem", environment: "theorem", heading: "Teorema", style: "plain" },
    { id: "proposition", label: "Proposición", kind: "theorem", environment: "proposition", heading: "Proposición", style: "plain" },
    { id: "example", label: "Ejemplo", kind: "theorem", environment: "example", heading: "Ejemplo", style: "definition" },
    { id: "note", label: "Nota", kind: "theorem", environment: "note", heading: "Nota", style: "remark" },
    { id: "itemize", label: "Lista con viñetas", kind: "list", listEnvironment: "itemize" },
    { id: "enumerate", label: "Lista numerada", kind: "list", listEnvironment: "enumerate" },
  ];

  TexNotes.BLOCK_TYPES = BLOCK_TYPES;
  TexNotes.BLOCK_TYPE_IDS = BLOCK_TYPES.map((type) => type.id);
  TexNotes.blockType = (id) => BLOCK_TYPES.find((type) => type.id === id) || null;
  TexNotes.blockLabel = (id) => (TexNotes.blockType(id) || { label: "Bloque" }).label;
})(typeof globalThis !== "undefined" ? globalThis : this);
