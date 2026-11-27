/** Estructura de encabezados y numeración del documento. */
(function (T) {
  "use strict";
  const HEADINGS = ["section", "subsection", "subsubsection", "paragraph", "subparagraph"];

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

    function visit(blocks, parent, depth, insideContainer) {
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
            if (insideContainer) entry.misplaced = true;
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
        visit(block.children, path, childDepth, insideContainer || (type.kind !== "text" && type.container));
      });
    }

    const topic = String(state.metadata?.topic ?? "").trim();
    if (topic) entries.push(heading("topic", null, 0, topic));
    visit(state.blocks, [], topic ? 1 : 0, false);
    return entries;
  }

  Object.assign(T, { blockIsEmitted, outlineEntries });
})(globalThis.TexNotes || (globalThis.TexNotes = {}));
