/** Bibliografía del documento y del curso. Sin DOM ni almacenamiento. */
(function (T) {
  "use strict";
  const COURSE_REFERENCES = [
    ["leithold1992", ["Leithold, L."], "1992", "El cálculo con geometría", "Harla"],
    ["spivak1993", ["Spivak, M."], "1993", "Cálculo infinitesimal", "Reverté"],
    ["stein1995", ["Stein, S."], "1995", "Cálculo y geometría analítica", "McGraw Hill"],
    ["stewart1994", ["Stewart, J."], "1994", "Cálculo", "Iberoamérica"],
    ["boyce1994", ["Boyce, D."], "1994", "Cálculo", "CECSA"],
    ["larson1995", ["Larson", "Hostetler"], "1995", "Cálculo y geometría analítica", "McGraw Hill"],
    ["swokowski1989", ["Swokowski, E."], "1989", "Cálculo con geometría analítica", "Iberoamérica"],
    ["zill1996", ["Zill, D."], "1996", "Cálculo con geometría analítica", "Iberoamérica"],
  ].map(([key, authors, year, title, publisher]) => ({
    key, authors, year, title, publisher, place: "México", edition: "", url: "", text: "",
  }));
  const natbibCommands = new Set(["citep", "citet", "citealt", "citealp", "citeauthor", "citeyear"]);
  const isCitation = name => name === "cite" || natbibCommands.has(name);
  const validKey = key => /^[a-z0-9][a-z0-9-]*$/.test(key);
  const compare = (a, b) => a.localeCompare(b, "es", { sensitivity: "base" });
  const clean = value => typeof value === "string" ? value.trim() : "";
  const surname = author => author.split(",")[0].trim();
  const fields = ["key", "year", "title", "edition", "publisher", "place", "url"];
  function normalizeBibliography(raw) {
    return { style: raw?.style === "apa" ? "apa" : "ieee", includeUncited: raw?.includeUncited === true };
  }
  function normalizeReference(raw) {
    const entry = Object.fromEntries(fields.map(key => [key, clean(raw?.[key])]));
    entry.authors = Array.isArray(raw?.authors) ? raw.authors.map(clean).filter(Boolean) : [];
    entry.text = typeof raw?.text === "string" ? raw.text : "";
    return entry;
  }
  function normalizeReferences(raw) {
    const entries = [], keys = new Set();
    for (const value of Array.isArray(raw) ? raw : []) {
      const entry = normalizeReference(value);
      if (validKey(entry.key) && !keys.has(entry.key)) { entries.push(entry); keys.add(entry.key); }
    }
    return entries;
  }
  function validateReference(raw, existing = [], style = "ieee") {
    const entry = normalizeReference(raw), errors = {};
    if (!validKey(entry.key)) errors.key = "Usa minúsculas, cifras y guiones. Empieza por una letra o cifra.";
    else if (existing.some(r => (r?.key ?? r) === entry.key)) errors.key = "Esta clave ya existe.";
    const free = Boolean(entry.text.trim());
    if ((!free || style === "apa") && (!entry.authors.length || entry.authors.some(a => !surname(a))))
      errors.authors = "Escribe al menos un apellido, con un autor por línea.";
    if ((!free || style === "apa") && !/^\d{4}$/.test(entry.year)) errors.year = "Escribe un año de cuatro cifras.";
    if (!free && !entry.title) errors.title = "Escribe el título o completa el texto libre.";
    if (entry.edition && (!/^\d+$/.test(entry.edition) || Number(entry.edition) < 2)) errors.edition = "Usa un entero a partir de 2 o deja la edición vacía.";
    return errors;
  }
  // 0 → a, 25 → z, 26 → aa.
  function letters(index) {
    let result = "";
    do {
      result = String.fromCharCode(97 + index % 26) + result;
      index = Math.floor(index / 26) - 1;
    } while (index >= 0);
    return result;
  }
  function suggestReferenceKey(raw, existing = []) {
    const entry = normalizeReference(raw);
    const name = surname(entry.authors[0] || "").normalize("NFD").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!name || !/^\d{4}$/.test(entry.year)) return "";
    const keys = new Set(existing.map(r => r?.key ?? r)), base = name + entry.year;
    let key = base, index = 0;
    while (keys.has(key)) key = base + letters(++index);
    return key;
  }
  function citationInfo(state) {
    const uses = [], counts = new Map(), legacy = [];
    let natbib = Boolean(state.references?.length);
    for (const { block, path, type } of T.emittedBlocks(state)) {
      if (type.kind === "bibliography" && block.content?.trim()) legacy.push({ block, path });
      for (const cmd of T.documentCommands(block)) {
        if (!isCitation(cmd.name)) continue;
        if (natbibCommands.has(cmd.name)) natbib = true;
        if (cmd.arg === undefined) continue;
        let start = cmd.argStart;
        const content = T.normalizeLineBreaks(block.content);
        // Los comentarios se enmascaran sin desplazar las columnas originales.
        for (const part of cmd.rawArg.split(",")) {
          const key = part.trim();
          if (key) {
            const index = start + part.length - part.trimStart().length;
            uses.push({ key, path, index, content });
            counts.set(key, (counts.get(key) || 0) + 1);
          }
          start += part.length + 1;
        }
      }
    }
    return { uses, counts, legacy, natbib };
  }
  function saveReference(state, raw, originalKey) {
    const entry = normalizeReference(raw), references = normalizeReferences(state.references);
    const errors = validateReference(entry, references.filter(r => r.key !== originalKey), state.bibliography?.style);
    if (originalKey && originalKey !== entry.key && citationInfo(state).counts.has(originalKey))
      errors.key = "La clave está citada en el documento. Retira primero sus citas.";
    if (Object.keys(errors).length) return { errors };
    return { references: originalKey ? references.map(r => r.key === originalKey ? entry : r) : [...references, entry] };
  }
  function authorLabel(entry, escape = value => value) {
    const names = entry.authors.map(author => escape(surname(author)));
    if (names.length > 2) return names[0] + " et~al.";
    return names.join(" y ");
  }
  function printedReferences(state, info = citationInfo(state)) {
    const entries = normalizeReferences(state.references);
    const byKey = new Map(entries.map(r => [r.key, r]));
    const cited = [...info.counts.keys()].filter(key => byKey.has(key)).map(key => byKey.get(key));
    const options = normalizeBibliography(state.bibliography);
    const ordered = options.includeUncited ? [...cited, ...entries.filter(r => !info.counts.has(r.key))] : cited;
    if (options.style === "apa") ordered.sort((a,b) => compare(surname(a.authors[0] || ""), surname(b.authors[0] || "")) ||
      compare(a.year,b.year) || compare(a.title,b.title) || compare(a.key,b.key));
    const groups = new Map(), suffixes = new Map();
    for (const entry of ordered) {
      if (!entry.authors.length || !entry.year) continue;
      const key = JSON.stringify([authorLabel(entry), entry.year]);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(entry);
    }
    for (const group of groups.values()) if (group.length > 1) {
      group.sort((a,b) => compare(a.title,b.title) || compare(a.key,b.key))
        .forEach((entry, i) => suffixes.set(entry.key, letters(i)));
    }
    return ordered.map(entry => ({ entry, suffix: suffixes.get(entry.key) || "" }));
  }
  function joinNames(names) {
    return names.length < 2 ? names.join("") : names.slice(0, -1).join(", ") + " y " + names.at(-1);
  }
  function formatReference(raw, style = "ieee", suffix = "") {
    const entry = normalizeReference(raw);
    if (entry.text.trim()) return entry.text;
    const esc = T.escapeMetadata;
    const names = entry.authors.map(author => {
      const family = esc(surname(author)), initials = esc(author.split(",").slice(1).join(",").trim());
      if (!initials) return family;
      return style === "apa" ? family + ", " + initials : initials.replace(/\s+/g, "~") + "~" + family;
    });
    const title = "\\emph{" + esc(entry.title) + "}", edition = entry.edition && esc(entry.edition) + ".ª ed.";
    const publisher = esc(entry.publisher), place = esc(entry.place), year = esc(entry.year);
    let text;
    if (style === "apa") {
      const authors = names.length > 20 ? names.slice(0, 19).join(", ") + ", … " + names.at(-1) : joinNames(names);
      text = authors + " (" + year + suffix + "). " + title + (edition ? " (" + edition + ")" : "") + ".";
      if (publisher) text += " " + publisher + ".";
    } else {
      const authors = names.length > 6 ? names[0] + " \\emph{et al.}" : joinNames(names);
      const imprint = [place, publisher].filter(Boolean).join(": ");
      text = authors + ", " + title + (edition ? ", " + edition : ".") + " " + [imprint, year].filter(Boolean).join(", ") + ".";
    }
    return text + (entry.url ? " \\texttt{" + esc(entry.url) + "}" : "");
  }
  function bibliographyLatex(state, info) {
    const rows = printedReferences(state, info);
    if (!rows.length) return "";
    const items = rows.map(({ entry, suffix }) => {
      const label = authorLabel(entry, T.escapeMetadata);
      const optional = label && /^\d{4}$/.test(entry.year) ? "[" + (label.includes("]") ? "{" + label + "}" : label) +
        "(" + T.escapeMetadata(entry.year) + suffix + ")]" : "";
      return "\\bibitem" + optional + "{" + entry.key + "} " + formatReference(entry, state.bibliography?.style, suffix);
    });
    return ["\\begin{thebibliography}{" + "9".repeat(String(rows.length).length) + "}", ...items, "\\end{thebibliography}"].join("\n");
  }
  function legacyEntries(block) {
    return T.normalizeLineBreaks(block.content).split("\n").map(line => line.trim()).filter(Boolean)
      .map((text, index) => normalizeReference({ key: "ref" + (index + 1), text }));
  }
  function convertBibliography(state, path) {
    const block = T.blockAtPath(state.blocks, path);
    if (block?.type !== "bibliography") return { error: "Ese bloque no es una bibliografía." };
    const entries = legacyEntries(block), references = normalizeReferences(state.references);
    const keys = new Set(references.map(entry => entry.key));
    const conflict = entries.find(entry => keys.has(entry.key));
    if (conflict) return { error: "Ya existe la clave " + conflict.key + ". No se convirtió el bloque." };
    return { blocks: T.removeBlock(state.blocks, path), references: [...references, ...entries] };
  }
  function bibliographyIssues(state) {
    const info = citationInfo(state), rows = printedReferences(state, info);
    const entries = normalizeReferences(state.references), options = normalizeBibliography(state.bibliography);
    const keys = new Set(entries.map(entry => entry.key)), issues = [];
    const add = (path, code, severity, message, extra = {}) => issues.push({ path, issue: { code, severity, line: 1, column: 1,
      message, guide: "docs/guia-de-uso.md#citas-y-bibliografía", ...extra } });
    for (const { block, path } of info.legacy) {
      for (const r of legacyEntries(block)) keys.add(r.key);
      if (options.style === "apa") add(path, "legacy-apa", "error", "La bibliografía manual es incompatible con APA.", { canConvert: true });
      if (rows.length) add(path, "two-bibliographies", "error", "El documento generaría dos listas de referencias.", { canConvert: true });
    }
    for (const { key, path, content, index } of info.uses) {
      if (keys.has(key)) continue;
      const lines = content.slice(0, index).split("\n");
      add(path, "missing-citation", "error", "La cita " + key + " no tiene referencia. El PDF mostraría " +
        (options.style === "apa" ? "(?)." : "[?]."), { line:lines.length, column:Array.from(lines.at(-1)).length+1 });
    }
    for (const { entry } of rows) if (options.style === "apa" && (!entry.authors.length || !/^\d{4}$/.test(entry.year))) {
      add([], "apa-author-year", "error", entry.key + " necesita autor y año para las citas APA.", { referenceKey: entry.key });
    }
    if (!options.includeUncited) for (const entry of entries) if (!info.counts.has(entry.key))
      add([], "uncited-reference", "aviso", "Ningún bloque cita " + entry.key + ".", { referenceKey: entry.key });
    return issues;
  }
  Object.assign(T, { COURSE_REFERENCES, isCitation, normalizeBibliography, normalizeReference, normalizeReferences, validateReference,
    suggestReferenceKey, citationInfo, saveReference, printedReferences, authorLabel, formatReference, bibliographyLatex, convertBibliography, bibliographyIssues });
})(globalThis.TexNotes);
