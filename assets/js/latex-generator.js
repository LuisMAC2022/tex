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

  /**
   * Busca el delimitador de cierre a partir de `from`. Una barra invertida
   * protege al carácter siguiente, de modo que un `\$` dentro de la fórmula no
   * la cierra; es la misma regla que aplica TeX.
   */
  function findClosingDelimiter(text, from, delimiter) {
    for (let index = from; index < text.length; index += 1) {
      if (text[index] === "\\") { index += 1; continue; }
      if (text.startsWith(delimiter, index)) return index;
    }
    return -1;
  }

  /**
   * Separa contenido mixto en tramos de prosa y de matemática, sin interpretar
   * la fórmula. Reglas deterministas y deliberadamente conservadoras:
   *
   * - `$...$` y `$$...$$` con pareja: el tramo se conserva literalmente, con
   *   sus delimitadores y a lo largo de varias líneas si hace falta.
   * - `\$`: es el dólar literal de la persona. Se emite como `\$` y nunca abre
   *   modo matemático.
   * - Delimitador sin pareja: se trata como texto y se escapa. Antes de abrir
   *   una fórmula rota se prefiere imprimir el dólar.
   */
  function splitMixedContent(value = "") {
    const text = normalizeLineBreaks(value);
    const segments = [];
    let prose = "";
    let index = 0;
    const flush = () => { if (prose) { segments.push({ kind: "text", value: prose }); prose = ""; } };
    while (index < text.length) {
      if (text[index] === "\\" && text[index + 1] === "$") {
        flush();
        segments.push({ kind: "literal", value: "\\$" });
        index += 2;
        continue;
      }
      if (text[index] === "$") {
        const delimiter = text.startsWith("$$", index) ? "$$" : "$";
        const close = findClosingDelimiter(text, index + delimiter.length, delimiter);
        if (close === -1) {
          // Sin pareja: se consume el delimitador entero como texto para no
          // reexaminar su segundo dólar como una apertura distinta.
          prose += delimiter;
          index += delimiter.length;
          continue;
        }
        flush();
        segments.push({ kind: "math", display: delimiter === "$$", value: text.slice(index, close + delimiter.length) });
        index = close + delimiter.length;
        continue;
      }
      prose += text[index];
      index += 1;
    }
    flush();
    return segments;
  }

  /** Escapa la prosa y conserva intactos los tramos matemáticos. */
  function escapeMixedText(value = "") {
    return splitMixedContent(value)
      .map((segment) => (segment.kind === "text" ? escapeLatexText(segment.value) : segment.value))
      .join("");
  }

  function optionalTitle(title) {
    const clean = escapeLatexText(title).trim();
    return clean ? `[${clean}]` : "";
  }

  /**
   * Un hijo de prosa necesita una línea en blanco para ser su propio párrafo;
   * un entorno o una fórmula se pegan a la línea anterior. La regla depende
   * solo del tipo del hijo, así que la salida sigue siendo determinista.
   */
  function childSeparator(child = {}) {
    const type = TexNotes.blockType(child.type) || TexNotes.blockType("text");
    return type.kind === "text" ? "\n\n" : "\n";
  }

  /**
   * Serializa un bloque y su descendencia. Los hijos de un bloque que abre un
   * entorno se emiten antes de su \end{...}; los de un bloque de texto, tras su
   * propio contenido. Nunca se concatenan dentro de `content`.
   */
  function blockToLatex(block = {}) {
    const type = TexNotes.blockType(block.type) || TexNotes.blockType("text");
    const content = normalizeLineBreaks(block.content);
    const children = (Array.isArray(block.children) ? block.children : [])
      .map((child) => ({ separator: childSeparator(child), latex: blockToLatex(child) }))
      .filter((child) => child.latex);
    const withChildren = (base) => children.reduce((text, child) => (text ? `${text}${child.separator}${child.latex}` : child.latex), base);

    if (type.kind === "equation") {
      const formula = content.trim();
      const [open, close] = type.delimiters || ["\\[", "\\]"];
      const math = formula ? (type.inline ? `${open}${formula}${close}` : `${open}\n${content}\n${close}`) : "";
      // Una fórmula no admite hijos. Si un estado manipulado los trae, se
      // emiten después del cierre; dentro producirían LaTeX inválido.
      return withChildren(math);
    }
    if (type.kind === "list") {
      const items = content.split("\n").map((line) => escapeMixedText(line).trim()).filter(Boolean);
      // Un entorno de lista sin ningún \item no compila: sin elementos, los
      // hijos se emiten por sí solos.
      if (!items.length) return withChildren("");
      const body = withChildren(items.map((item) => `\\item ${item}`).join("\n"));
      return `\\begin{${type.listEnvironment}}\n${body}\n\\end{${type.listEnvironment}}`;
    }
    const escaped = escapeMixedText(content).trim();
    if (!escaped && !children.length) return "";
    if (type.kind === "text") {
      const heading = escapeLatexText(block.title).trim();
      return withChildren(heading ? [`\\subsection{${heading}}`, escaped].filter(Boolean).join("\n") : escaped);
    }
    return `\\begin{${type.environment}}${optionalTitle(block.title)}\n${withChildren(escaped)}\n\\end{${type.environment}}`;
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
    METADATA_KEYS, normalizeLineBreaks, escapeLatexText, splitMixedContent, escapeMixedText, blockToLatex,
    buildTheoremDefs, buildPreamble, buildMetadata, buildBody, buildDocumentEnd, generateLatex,
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
