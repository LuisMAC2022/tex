/** Extracción y análisis puro de los tramos matemáticos. */
(function (global) {
  "use strict";
  const TexNotes = global.TexNotes || (global.TexNotes = {});

  const MATH_ENVIRONMENTS = new Set([
    "math", "displaymath", "equation", "eqnarray", "align", "alignat", "aligned", "alignedat", "flalign",
    "gather", "gathered", "multline", "split", "array", "matrix", "pmatrix", "bmatrix", "Bmatrix",
    "vmatrix", "Vmatrix", "smallmatrix", "cases",
  ]);

  function isEscaped(content, index) {
    let slashes = 0;
    for (let cursor = index - 1; cursor >= 0 && content[cursor] === "\\"; cursor -= 1) slashes += 1;
    return slashes % 2 === 1;
  }

  function nextOpening(content, from) {
    for (let index = from; index < content.length; index += 1) {
      if (content.startsWith("$$", index) && !isEscaped(content, index)) return { open: "$$", close: "$$", displayMode: true, index };
      if (content.startsWith("\\[", index) && !isEscaped(content, index)) return { open: "\\[", close: "\\]", displayMode: true, index };
      if (content.startsWith("\\(", index) && !isEscaped(content, index)) return { open: "\\(", close: "\\)", displayMode: false, index };
      if (content[index] === "$" && !isEscaped(content, index)) return { open: "$", close: "$", displayMode: false, index };
    }
    return null;
  }

  function closingIndex(content, delimiter, from) {
    for (let index = from; index < content.length; index += 1) {
      if (!content.startsWith(delimiter, index)) continue;
      if (isEscaped(content, index)) continue;
      if (delimiter === "$" && content.startsWith("$$", index)) return -1;
      return index;
    }
    return -1;
  }

  /** Contexto de una posición, incluidos delimitadores todavía sin cerrar. */
  function mathContextAt(content, index, typeId) {
    if (TexNotes.blockType(typeId)?.kind === "equation") return "math";
    const limit = Math.max(0, Math.min(index, content.length));
    const math = [];
    let braces = 0, textDepth = null;
    for (let i = 0; i < limit; i++) {
      const ch = content[i];
      if (isEscaped(content, i)) continue;
      if (ch === "%") {
        const newline = content.indexOf("\n", i);
        if (newline < 0 || newline >= limit) return "comment";
        i = newline; continue;
      }
      if (ch === "{") { braces++; continue; }
      if (ch === "}") {
        if (textDepth !== null && braces === textDepth) textDepth = null;
        braces--; continue;
      }
      if (textDepth !== null) continue;
      if (ch === "\\") {
        const text = /^\\(?:text|textbf|textit|mbox|emph)\s*\{/.exec(content.slice(i, limit));
        if (math.length && text) { braces++; textDepth = braces; i += text[0].length - 1; continue; }
        const env = /^\\(begin|end)\s*\{([^{}]+)\}/.exec(content.slice(i, limit));
        if (env) {
          if (MATH_ENVIRONMENTS.has(env[2].replace(/\*$/, ""))) {
            if (env[1] === "begin") math.push(`env:${env[2]}`);
            else if (math.at(-1) === `env:${env[2]}`) math.pop();
          }
          i += env[0].length - 1; continue;
        }
        const token = content.slice(i, i + 2);
        if (i + 1 < limit && ["\\(", "\\["].includes(token) && !math.length) { math.push(token === "\\(" ? "\\)" : "\\]"); i++; }
        else if (i + 1 < limit && token === math.at(-1)) { math.pop(); i++; }
      } else if (ch === "$") {
        const token = content[i + 1] === "$" && i + 1 < limit ? "$$" : "$";
        if (math.at(-1) === token) math.pop();
        else if (!math.length) math.push(token);
        i += token.length - 1;
      }
    }
    return textDepth !== null ? "text" : math.length ? "math" : "text";
  }

  /** Devuelve los tramos matemáticos en orden, con índices sobre el texto normalizado. */
  function mathSegments(content, blockTypeId) {
    const normalized = TexNotes.normalizeLineBreaks(String(content || ""));
    const type = TexNotes.blockType(blockTypeId) || TexNotes.blockType("text");
    if (type.kind === "equation") {
      const leading = normalized.length - normalized.trimStart().length;
      const math = normalized.trim();
      return math ? [{ math, displayMode: !type.inline, start: leading, end: leading + math.length }] : [];
    }

    const segments = [];
    let cursor = 0;
    while (cursor < normalized.length) {
      const opening = nextOpening(normalized, cursor);
      if (!opening) break;
      const mathStart = opening.index + opening.open.length;
      const close = closingIndex(normalized, opening.close, mathStart);
      if (close < 0) { cursor = mathStart; continue; }
      segments.push({
        math: normalized.slice(mathStart, close),
        displayMode: opening.displayMode,
        start: opening.index,
        end: close + opening.close.length,
      });
      cursor = close + opening.close.length;
    }
    return segments;
  }

  /** Ejecuta un renderizador inyectado sin convertir un fallo en validación. */
  function analyzeContent(content, blockTypeId, render) {
    const segments = mathSegments(content, blockTypeId).map((segment) => {
      const result = render(segment.math, segment.displayMode);
      return { ...segment, ...result };
    });
    return { segments, failures: segments.filter((segment) => !segment.ok) };
  }

  Object.assign(TexNotes, { MATH_ENVIRONMENTS, isEscaped, mathContextAt });
  TexNotes.mathSegments = mathSegments;
  TexNotes.analyzeContent = analyzeContent;
})(typeof globalThis !== "undefined" ? globalThis : this);
