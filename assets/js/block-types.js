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
   * kind: "text" | "equation" | "theorem".
   * Los tipos "theorem" declaran un entorno amsthm; buildTheoremDefs() agrupa
   * sus \newtheorem por style para no repetir \theoremstyle.
   */
  const BLOCK_TYPES = [
    { id: "text", label: "Texto", kind: "text" },
    { id: "equation", label: "Ecuación", kind: "equation" },
    { id: "definition", label: "Definición", kind: "theorem", environment: "definition", heading: "Definición", style: "definition" },
    { id: "theorem", label: "Teorema", kind: "theorem", environment: "theorem", heading: "Teorema", style: "plain" },
    { id: "example", label: "Ejemplo", kind: "theorem", environment: "example", heading: "Ejemplo", style: "definition" },
    { id: "note", label: "Nota", kind: "theorem", environment: "note", heading: "Nota", style: "remark" },
  ];

  TexNotes.BLOCK_TYPES = BLOCK_TYPES;
  TexNotes.BLOCK_TYPE_IDS = BLOCK_TYPES.map((type) => type.id);
  TexNotes.blockType = (id) => BLOCK_TYPES.find((type) => type.id === id) || null;
  TexNotes.blockLabel = (id) => (TexNotes.blockType(id) || { label: "Bloque" }).label;
})(typeof globalThis !== "undefined" ? globalThis : this);
