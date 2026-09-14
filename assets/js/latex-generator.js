/** Generación determinista de LaTeX. Ninguna función de este módulo modifica su entrada. */
(function (global) {
  "use strict";
  const TexNotes = global.TexNotes || (global.TexNotes = {});

  const ESCAPES = { "\\": "\\textbackslash{}", "#": "\\#", "$": "\\$", "%": "\\%", "&": "\\&", "_": "\\_", "{": "\\{", "}": "\\}", "~": "\\textasciitilde{}", "^": "\\textasciicircum{}" };
  const METADATA_KEYS = ["title", "author", "course", "teacher", "date", "topic"];
  const STYLE_ORDER = ["plain", "definition", "remark"];

  function normalizeLineBreaks(value = "") {
    return String(value).replace(/\r\n?/g, "\n");
  }

  function escapeLatexText(value = "") {
    return normalizeLineBreaks(value).replace(/[\\#$%&_{}~^]/g, (character) => ESCAPES[character]);
  }

  function optionalTitle(title) {
    const clean = escapeLatexText(title).trim();
    return clean ? `[${clean}]` : "";
  }

  function blockToLatex(block = {}) {
    const type = TexNotes.blockType(block.type) || TexNotes.blockType("text");
    const content = normalizeLineBreaks(block.content);
    if (type.kind === "equation") {
      const formula = content.trim();
      if (!formula) return "";
      const [open, close] = type.delimiters || ["\\[", "\\]"];
      return type.inline ? `${open}${formula}${close}` : `${open}\n${content}\n${close}`;
    }
    if (type.kind === "list") {
      const items = content.split("\n").map((line) => escapeLatexText(line).trim()).filter(Boolean);
      if (!items.length) return "";
      return `\\begin{${type.listEnvironment}}\n${items.map((item) => `\\item ${item}`).join("\n")}\n\\end{${type.listEnvironment}}`;
    }
    const escaped = escapeLatexText(content).trim();
    if (!escaped) return "";
    if (type.kind === "text") {
      const heading = escapeLatexText(block.title).trim();
      return heading ? `\\subsection{${heading}}\n${escaped}` : escaped;
    }
    return `\\begin{${type.environment}}${optionalTitle(block.title)}\n${escaped}\n\\end{${type.environment}}`;
  }

  /**
   * Deriva las declaraciones amsthm de la tabla de bloques, de modo que el
   * preámbulo no pueda desincronizarse de los tipos disponibles.
   */
  function buildTheoremDefs() {
    const declared = TexNotes.BLOCK_TYPES.filter((type) => type.kind === "theorem");
    const styles = [...STYLE_ORDER, ...declared.map((type) => type.style)].filter((style, index, all) => all.indexOf(style) === index);
    const lines = [];
    let current = null;
    for (const style of styles) {
      for (const type of declared.filter((entry) => entry.style === style)) {
        if (style !== current) { lines.push(`\\theoremstyle{${style}}`); current = style; }
        lines.push(`\\newtheorem{${type.environment}}{${type.heading}}`);
      }
    }
    return lines.join("\n");
  }

  function buildPreamble() {
    return [
      "\\documentclass[11pt]{article}",
      "% fontenc genera PDF con caracteres latinos copiables.",
      "\\usepackage[T1]{fontenc}",
      "% inputenc permite que el archivo fuente esté codificado en UTF-8.",
      "\\usepackage[utf8]{inputenc}",
      "% babel adapta al español los nombres y la separación silábica.",
      "\\usepackage[spanish]{babel}",
      "% amsmath proporciona los entornos matemáticos habituales.",
      "\\usepackage{amsmath}",
      "% amssymb aporta los conjuntos numéricos \\mathbb del tablero de símbolos.",
      "\\usepackage{amssymb}",
      "% amsthm permite declarar teoremas y bloques relacionados.",
      "\\usepackage{amsthm}",
      "% Los entornos siguientes se derivan de la tabla de tipos de bloque.",
      buildTheoremDefs(),
    ].join("\n");
  }

  function buildMetadata(metadata = {}) {
    const title = escapeLatexText(metadata.title).trim();
    const authorParts = [metadata.author, metadata.course, metadata.teacher && `Profesor: ${metadata.teacher}`]
      .filter(Boolean).map((value) => escapeLatexText(value).trim());
    const date = metadata.date ? escapeLatexText(metadata.date) : "";
    return [`\\title{${title}}`, `\\author{${authorParts.join(" \\\\ ")}}`, `\\date{${date}}`].join("\n");
  }

  function buildBody(state = {}) {
    const metadata = state.metadata || {};
    const topic = escapeLatexText(metadata.topic).trim();
    const blocks = (Array.isArray(state.blocks) ? state.blocks : []).map(blockToLatex).filter(Boolean);
    return ["\\begin{document}", "\\maketitle", topic ? `\\section{${topic}}` : "", ...blocks].filter(Boolean).join("\n\n");
  }

  function buildDocumentEnd() { return "\\end{document}"; }

  /** El archivo resultante es autocontenido: no depende de ningún .sty externo. */
  function generateLatex(state = {}) {
    return `${buildPreamble()}\n\n${buildMetadata(state.metadata)}\n\n${buildBody(state)}\n\n${buildDocumentEnd()}\n`;
  }

  Object.assign(TexNotes, {
    METADATA_KEYS, normalizeLineBreaks, escapeLatexText, blockToLatex,
    buildTheoremDefs, buildPreamble, buildMetadata, buildBody, buildDocumentEnd, generateLatex,
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
