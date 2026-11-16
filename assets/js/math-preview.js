/** Extracción y análisis puro de los tramos matemáticos. */
(function (global) {
  "use strict";
  const TexNotes = global.TexNotes || (global.TexNotes = {});

  function escapedDollar(content, index) {
    let slashes = 0;
    for (let cursor = index - 1; cursor >= 0 && content[cursor] === "\\"; cursor -= 1) slashes += 1;
    return slashes % 2 === 1;
  }

  function nextOpening(content, from) {
    for (let index = from; index < content.length; index += 1) {
      if (content.startsWith("$$", index) && !escapedDollar(content, index)) return { open: "$$", close: "$$", displayMode: true, index };
      if (content.startsWith("\\[", index)) return { open: "\\[", close: "\\]", displayMode: true, index };
      if (content.startsWith("\\(", index)) return { open: "\\(", close: "\\)", displayMode: false, index };
      if (content[index] === "$" && !escapedDollar(content, index)) return { open: "$", close: "$", displayMode: false, index };
    }
    return null;
  }

  function closingIndex(content, delimiter, from) {
    for (let index = from; index < content.length; index += 1) {
      if (!content.startsWith(delimiter, index)) continue;
      if (delimiter.includes("$") && escapedDollar(content, index)) continue;
      if (delimiter === "$" && content.startsWith("$$", index)) continue;
      return index;
    }
    return -1;
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

  TexNotes.mathSegments = mathSegments;
  TexNotes.analyzeContent = analyzeContent;
})(typeof globalThis !== "undefined" ? globalThis : this);
