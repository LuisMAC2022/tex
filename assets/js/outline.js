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
        const identity = block.id ? { id: block.id } : {};
        const title = String(block.title ?? "").trim();
        let childDepth = depth;
        if (type.kind === "text") {
          if (title) {
            const entry = { ...heading("heading", path, depth, title), ...identity };
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
          entries.push({ kind: "theorem", path, key: T.pathToKey(path), environment, heading, number, ...identity, ...(title ? { title } : {}) });
        } else {
          entries.push({ kind: "other", path, key: T.pathToKey(path), type: type.id, ...identity });
        }
        visit(block.children, path, childDepth, type.kind !== "text" && type.container ? type.id : containerType);
      });
    }

    const topic = String(state.metadata?.topic ?? "").trim();
    if (topic) entries.push(heading("topic", null, 0, topic));
    visit(state.blocks, [], topic ? 1 : 0, null);
    return entries;
  }

  function diffOutline(beforeEntries, afterEntries) {
    const identity = entry => entry.id ?? entry.key;
    const previous = new Map(beforeEntries.map(entry => [identity(entry), entry]));
    const changes = [];
    for (const entry of afterEntries) {
      const id = identity(entry);
      const old = id == null ? undefined : previous.get(id);
      if (!old || (old.number === entry.number && old.level === entry.level)) continue;
      changes.push({
        id, title: entry.title || entry.heading || "Bloque",
        before: { number: old.number ?? null, level: old.level ?? null },
        after: { number: entry.number ?? null, level: entry.level ?? null },
      });
    }
    if (!changes.length) return { changes, summary: "Sin cambios de numeración" };

    const first = changes.find(change => change.after.number === null && change.after.level !== null) || changes[0];
    const { title, before, after } = first;
    const label = value => value.number ?? HEADING_LABELS[Math.max(3, value.level)].toLowerCase() + " sin número";
    let summary;
    if (after.number === null && after.level !== null) {
      summary = `${title} quedará como ${label(after)}.`;
    } else {
      summary = `${title}: ${label(before)} → ${label(after)}.`;
    }
    const others = changes.filter(change => change !== first);
    const what = others.every(change => change.before.number !== change.after.number) ? "de número" : "de nivel o de número";
    if (others.length === 1) summary += ` Otro bloque cambia ${what}.`;
    else if (others.length > 1) summary += ` Otros ${others.length} bloques cambian ${what}.`;
    return { changes, summary };
  }

  Object.assign(T, { blockIsEmitted, outlineEntries, outlineLabel, diffOutline });
})(globalThis.TexNotes || (globalThis.TexNotes = {}));
