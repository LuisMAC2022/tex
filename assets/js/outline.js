/** Estructura de encabezados y numeración del documento. */
(function (T) {
  "use strict";
  const HEADINGS = ["section", "subsection", "subsubsection", "paragraph", "subparagraph"];

  const HEADING_LABELS = ["Sección", "Subsección", "Subsubsección", "Párrafo", "Subpárrafo"];

  function outlineLabel(entry, block) {
    const title = String(block.title ?? "").trim();
    if (entry?.kind === "heading" || entry?.kind === "topic") {
      const badge = entry.number ? HEADING_LABELS[entry.level] : HEADING_LABELS[Math.max(3, entry.level)];
      const text = entry.number ? `${entry.number} ${entry.title}` : entry.title;
      const label = { badge, text };
      if (entry.misplaced) {
        label.warning = `Encabezado dentro de ${T.blockLabel(entry.containerType)}: LaTeX lo admite pero rompe la jerarquía`;
      }
      return label;
    }
    if (entry?.kind === "theorem") {
      return { badge: entry.heading, text: `${entry.heading} ${entry.number}${title ? ` (${title})` : ""}` };
    }
    return { badge: T.blockLabel(block.type), text: title };
  }

  function blockIsEmitted(block) {
    return Boolean(block && (String(block.content === undefined ? "" : block.content).trim() ||
      (Array.isArray(block.children) && block.children.some(blockIsEmitted))));
  }

  function outlineEntries(state = {}, options = {}) {
    const entries = [];
    const counters = HEADINGS.map(() => 0);
    const numberedLevels = options.numberedLevels ?? 3;
    const environments = new Map();

    function heading(kind, path, depth, title) {
      const level = Math.min(depth, HEADINGS.length - 1);
      counters[level]++;
      counters.fill(0, level + 1);
      const number = level < numberedLevels ? counters.slice(0, level + 1).join(".") : null;
      return { kind, path, key: path && T.pathToKey(path), level, command: HEADINGS[level], title, number };
    }

    function visit(blocks, parent, depth, containerType) {
      if (!Array.isArray(blocks)) return;
      blocks.forEach((block, index) => {
        if (!blockIsEmitted(block)) return;
        const path = [...parent, index];
        const type = T.blockType(block.type) || T.blockType("text");
        let childDepth = depth;
        if (type.kind === "text") {
          const title = String(block.title ?? "").trim();
          if (title) {
            const entry = heading("heading", path, depth, title);
            if (containerType) {
              entry.misplaced = true;
              entry.containerType = containerType;
            }
            entries.push(entry);
            childDepth++;
          }
        } else if (type.kind === "theorem") {
          const { environment, heading } = type;
          const number = (environments.get(environment) || 0) + 1;
          environments.set(environment, number);
          entries.push({ kind: "theorem", path, key: T.pathToKey(path), environment, heading, number });
        } else {
          entries.push({ kind: "other", path, key: T.pathToKey(path), type: type.id });
        }
        visit(block.children, path, childDepth, type.kind !== "text" && type.container ? type.id : containerType);
      });
    }

    const topic = String(state.metadata?.topic ?? "").trim();
    if (topic) entries.push(heading("topic", null, 0, topic));
    visit(state.blocks, [], topic ? 1 : 0, null);
    return entries;
  }

  Object.assign(T, { blockIsEmitted, outlineEntries, outlineLabel });
})(globalThis.TexNotes || (globalThis.TexNotes = {}));
