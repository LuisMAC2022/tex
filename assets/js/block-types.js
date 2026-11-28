/**
 * Tabla única de tipos de bloque.
 * El preámbulo, la interfaz y el generador se derivan de aquí: añadir un tipo
 * es una sola entrada en esta tabla (y su opción en index.html, que una prueba
 * compara contra esta lista).
 */
(function (global) {
  "use strict";
  const TexNotes = global.TexNotes || (global.TexNotes = {});

  /** @decision DEC-005 ancla:fc78f5a2 tramo:15
   * kind: "text" | "equation" | "theorem" | "list" | "bibliography" | "image".
   * Los tipos "theorem" declaran un entorno amsthm; buildTheoremDefs() agrupa
   * sus \newtheorem por style para no repetir \theoremstyle.
   * Los tipos "equation" conservan el contenido literalmente y solo se
   * diferencian por sus delimitadores: destacada en líneas propias o en línea.
   * Los tipos "list" convierten cada línea no vacía en un \item, sin escaparla.
   *
   * container: el tipo admite bloques hijos. Es la única fuente de verdad de esa
   * regla: la interfaz solo ofrece «Añadir dentro» en un tipo con container, y la
   * normalización del árbol sube a hermanos los hijos de un tipo sin él. Los dos
   * tipos "equation" no lo llevan porque cualquier bloque dentro de \[...\] o
   * \(...\) produciría LaTeX inválido. "bibliography" tampoco lo lleva: dentro
   * de thebibliography solo deben aparecer sus propios \bibitem. Una imagen
   * representa una sola figura y sus opciones no afectan a otros bloques.
   *
   * predefined excluye los entornos ya definidos por amsthm del preámbulo.
   * slash declara los comandos del menú desde esta misma tabla.
   *
   * Numeración: cada entorno declarado con \newtheorem lleva un contador propio,
   * independiente y continuo en todo el documento. "proposition" no comparte
   * contador con "theorem" ni se reinicia por sección.
   */
  const BLOCK_TYPES = [
    { id: "text", label: "Texto", kind: "text", container: true, slash: ["txt", "texto"] },
    { id: "equation", label: "Ecuación destacada", labelPrefix: "ec", heading: "Ecuación", kind: "equation", delimiters: ["\\[", "\\]"], slash: ["ec"] },
    { id: "math-inline", label: "Expresión matemática en línea", kind: "equation", delimiters: ["\\(", "\\)"], inline: true, slash: ["el"] },
    { id: "definition", label: "Definición", labelPrefix: "def", kind: "theorem", environment: "definition", heading: "Definición", style: "definition", container: true, slash: ["def"] },
    { id: "theorem", label: "Teorema", labelPrefix: "teo", kind: "theorem", environment: "theorem", heading: "Teorema", style: "plain", container: true, slash: ["teo"] },
    { id: "proposition", label: "Proposición", labelPrefix: "prop", kind: "theorem", environment: "proposition", heading: "Proposición", style: "plain", container: true, slash: ["prop"] },
    { id: "proof", label: "Demostración", kind: "theorem", environment: "proof", heading: "Demostración", style: "plain", predefined: true, container: true, slash: ["dem"] },
    { id: "example", label: "Ejemplo", labelPrefix: "ej", kind: "theorem", environment: "example", heading: "Ejemplo", style: "definition", container: true, slash: ["ej"] },
    { id: "note", label: "Nota", labelPrefix: "nota", kind: "theorem", environment: "note", heading: "Nota", style: "remark", container: true, slash: ["nota"] },
    { id: "itemize", label: "Lista con viñetas", kind: "list", listEnvironment: "itemize", container: true, slash: ["lista", "vi"] },
    { id: "enumerate", label: "Lista numerada", kind: "list", listEnvironment: "enumerate", container: true, slash: ["enum", "num"] },
    { id: "bibliography", label: "Bibliografía (IEEE)", kind: "bibliography", container: false, slash: ["bib"] },
    { id: "image", label: "Imagen", labelPrefix: "fig", heading: "Figura", kind: "image", container: false, slash: ["img"] },
  ];

  function normalizeLabel(value, prefix) {
    if (!prefix || typeof value !== "string") return "";
    const key = value.normalize("NFD").toLowerCase().replace(/[^a-z0-9:-]/g, "");
    const rest = key.startsWith(prefix + ":") ? key.slice(prefix.length + 1) : key;
    return rest ? prefix + ":" + rest : "";
  }

  function labelFromTitle(title, prefix, existing = []) {
    if (!prefix) return "";
    const taken = new Set(existing);
    const stem = String(title || "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    let n = 1;
    let key = prefix + ":" + (stem || n);
    while (taken.has(key)) {
      n++;
      key = prefix + ":" + (stem ? stem + "-" + n : n);
    }
    return key;
  }

  function labelOf(block) {
    return normalizeLabel(block.label ?? (block.type === "image" ? block.options?.label : ""), TexNotes.blockType(block.type)?.labelPrefix);
  }

  Object.assign(TexNotes, { normalizeLabel, labelFromTitle, labelOf });
  TexNotes.BLOCK_TYPES = BLOCK_TYPES;
  TexNotes.blockType = (id) => BLOCK_TYPES.find((type) => type.id === id) || null;
  TexNotes.blockLabel = (id) => (TexNotes.blockType(id) || { label: "Bloque" }).label;
  /** Un tipo desconocido cae en "text", que sí admite hijos. */
  TexNotes.acceptsChildren = (id) => (TexNotes.blockType(id) || TexNotes.blockType("text")).container === true;
})(typeof globalThis !== "undefined" ? globalThis : this);
