/** Generación determinista de LaTeX. Ninguna función de este módulo modifica su entrada. */
(function (global) {
  "use strict";
  const TexNotes = global.TexNotes || (global.TexNotes = {});

  /**
   * Escapes para METADATOS Y TÍTULOS únicamente. Esos valores se interpolan
   * dentro de argumentos que genera la aplicación (\title{}, \section{},
   * \begin{teorema}[...]), donde un carácter reservado rompe el argumento y la
   * persona no tiene forma de repararlo desde la interfaz.
   *
   * El CONTENIDO de un bloque no pasa por aquí: ver contentToLatex().
   */
  const ESCAPES = { "\\": "\\textbackslash{}", "#": "\\#", "$": "\\$", "%": "\\%", "&": "\\&", "_": "\\_", "{": "\\{", "}": "\\}", "~": "\\textasciitilde{}", "^": "\\textasciicircum{}" };
  const METADATA_KEYS = ["title", "author", "course", "teacher", "date", "topic"];
  const STYLE_ORDER = ["plain", "definition", "remark"];

  function normalizeLineBreaks(value = "") {
    return String(value).replace(/\r\n?/g, "\n");
  }

  /** Escapado completo. Solo para metadatos y títulos. */
  function escapeMetadata(value = "") {
    return normalizeLineBreaks(value).replace(/[\\#$%&_{}~^]/g, (character) => ESCAPES[character]);
  }

  /** @decision DEC-004 ancla:03f12fa0 tramo:3
   * El CONTENIDO de un bloque llega al .tex tal cual se escribió: la aplicación
   * no inserta ni un solo carácter de escape.
   *
   * El motivo es que el contenido es LaTeX, no prosa mecanografiada. En cuanto
   * se admite `\textbf{...}` o `\mathbb{R}` —y el tablero de símbolos los
   * inserta— el contenido es código, y escapar «solo algunos» reservados rompe
   * ese código a la mitad: `a &= b` de un `align` saldría como `a \&= b`, y un
   * `\begin{tabular}` sería inservible. Media transparencia es peor que
   * ninguna, porque falla justo en lo que invita a escribir.
   *
   * A cambio, un `%` literal desaparece del PDF (comenta su línea) y un `_`
   * suelto no compila. Esa corrección se hace en Overleaf, que es la copia
   * maestra, o escribiendo `\%` al teclear. Quien escribe decide.
   */
  function contentToLatex(value = "") {
    return normalizeLineBreaks(value);
  }

  function optionalTitle(title) {
    const clean = escapeMetadata(title).trim();
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

  function emissionContext(block, context) {
    const type = TexNotes.blockType(block.type) || TexNotes.blockType("text");
    const outline = type.kind === "list" ? TexNotes.parseListOutline(contentToLatex(block.content), type.listEnvironment, block.listFormat) : null;
    const depth = context.depthContext;
    const childDepth = outline ? TexNotes.listOutlineDepthContext(outline, depth) :
      type.kind === "theorem" ? TexNotes.listDepthWithEnvironment(depth, type.environment) : depth;
    return { type, outline, childContext: childDepth === depth ? context : { parentType: type.id, depthContext: childDepth } };
  }

  const floatingImage = context => !context.parentType || context.parentType === "text";

  function blockToLatex(block = {}, context = {}) {
    if (!TexNotes.blockIsEmitted(block)) return "";
    const { type, outline, childContext } = emissionContext(block, context);
    const { depthContext } = context;
    const content = contentToLatex(block.content);
    const label = TexNotes.labelOf(block);
    const anchor = label ? `\\label{${label}}` : "";
    const children = (Array.isArray(block.children) ? block.children : [])
      .map((child) => ({ separator: childSeparator(child), latex: blockToLatex(child, childContext) }))
      .filter((child) => child.latex);
    const withChildren = (base) => children.reduce((text, child) => (text ? `${text}${child.separator}${child.latex}` : child.latex), base);

    if (type.kind === "equation") {
      const formula = content.trim();
      if (formula && anchor) return withChildren(`\\begin{equation}${anchor}\n${content}\n\\end{equation}`);
      const [open, close] = type.delimiters || ["\\[", "\\]"];
      const math = formula ? (type.inline ? `${open}${formula}${close}` : `${open}\n${content}\n${close}`) : "";
      // Una fórmula no admite hijos. Si un estado manipulado los trae, se
      // emiten después del cierre; dentro producirían LaTeX inválido.
      return withChildren(math);
    }
    if (type.kind === "image") {
      const path = content.trim();
      if (!path) return withChildren("");
      const { width, height, angle, align, placement } = TexNotes.normalizeImageOptions(block.options);
      const limits = [`width=${width}\\textwidth`];
      if (height) limits.push(`height=${height}cm`, "keepaspectratio");
      if (angle) limits.push(`angle=${angle}`);
      const graphics = `\\includegraphics[${limits.join(",")}]{${path}}`;
      const caption = escapeMetadata(block.title).trim();
      const countFigure = label ? "\\refstepcounter{figure}" : "";
      const alignment = { center: "\\centering", left: "\\raggedright", right: "\\raggedleft" }[align];
      let lines;
      if (floatingImage(context)) {
        lines = [`\\begin{figure}[${placement}]`, alignment, graphics,
          caption ? `\\caption{${caption}}` : countFigure, anchor, "\\end{figure}"];
      } else {
        const body = [graphics, caption && `\\par\n${caption}`, countFigure, anchor];
        lines = align === "center"
          ? ["\\begin{center}", ...body, "\\end{center}"]
          : ["\\par\\begingroup", alignment, ...body, "\\par\\endgroup"];
      }
      return withChildren(lines.filter(Boolean).join("\n"));
    }
    if (type.kind === "list") {
      return TexNotes.outlineToLatex(outline, depthContext, withChildren);
    }
    if (type.kind === "bibliography") {
      const items = content.split("\n").map((line) => line.trim()).filter(Boolean);
      if (!items.length) return withChildren("");
      const labelWidth = "9".repeat(String(items.length).length);
      const body = items.map((item, index) => `\\bibitem{ref${index + 1}} ${item}`).join("\n");
      return withChildren(`\\begin{thebibliography}{${labelWidth}}\n${body}\n\\end{thebibliography}`);
    }
    const body = content.trim();
    if (type.kind === "text") {
      const heading = escapeMetadata(block.title).trim();
      return withChildren(heading ? [`\\subsection{${heading}}`, body].filter(Boolean).join("\n") : body);
    }
    return `\\begin{${type.environment}}${optionalTitle(block.title)}${anchor}\n${withChildren(body)}\n\\end{${type.environment}}`;
  }

  /**
   * Deriva las declaraciones amsthm de la tabla de bloques, de modo que el
   * preámbulo no pueda desincronizarse de los tipos disponibles.
   */
  function buildTheoremDefs() {
    const declared = TexNotes.BLOCK_TYPES.filter((type) => type.kind === "theorem" && !type.predefined);
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

  function macrosToPreamble(macros = []) {
    if (!Array.isArray(macros) || !macros.length) return "";
    return ["% Macros personales definidas en el editor.", ...macros.map(m => `\\newcommand{\\${m.name}}${m.params ? `[${m.params}]` : ""}{${m.body}}`)].join("\n");
  }

  function hasDocumentLinks(blocks) {
    return Array.isArray(blocks) && blocks.some(block => {
      const tokens = String(block.content || "").match(/%[^\n]*|\\[a-zA-Z]+|\\[\s\S]/g) || [];
      return (block.type !== "image" && tokens.some(token => token === "\\href" || token === "\\url")) || hasDocumentLinks(block.children);
    });
  }
  function buildPreamble(macros = [], blocks = [], references = [], bibliography = {}, info = TexNotes.citationInfo({ blocks, references })) {
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
      "% graphicx permite \\includegraphics para insertar imágenes.",
      "\\usepackage{graphicx}",
      ...(info.natbib ? ["% natbib permite citas numéricas o de autor y año.",
        bibliography.style === "apa" ? "\\usepackage[round,authoryear]{natbib}" : "\\usepackage[numbers,square,sort&compress]{natbib}"] : []),
      ...(hasDocumentLinks(blocks) ? ["\\usepackage[hidelinks]{hyperref}"] : []),
      ...(macrosToPreamble(macros) ? [macrosToPreamble(macros)] : []),
      "% Los entornos siguientes se derivan de la tabla de tipos de bloque.",
      buildTheoremDefs(),
    ].join("\n");
  }

  function buildMetadata(metadata = {}) {
    const title = escapeMetadata(metadata.title).trim();
    const authorParts = [metadata.author, metadata.course, metadata.teacher && `Profesor: ${metadata.teacher}`]
      .filter(Boolean).map((value) => escapeMetadata(value).trim());
    const date = metadata.date ? escapeMetadata(metadata.date) : "";
    return [`\\title{${title}}`, `\\author{${authorParts.join(" \\\\ ")}}`, `\\date{${date}}`].join("\n");
  }

  function buildBody(state = {}, info) {
    const metadata = state.metadata || {};
    const topic = escapeMetadata(metadata.topic).trim();
    const blocks = (Array.isArray(state.blocks) ? state.blocks : []).map((block) => blockToLatex(block)).filter(Boolean);
    return ["\\begin{document}", "\\maketitle", topic ? `\\section{${topic}}` : "", ...blocks,
      TexNotes.bibliographyLatex(state, info)].filter(Boolean).join("\n\n");
  }

  function buildDocumentEnd() { return "\\end{document}"; }

  /** El archivo resultante es autocontenido: no depende de ningún .sty externo. */
  function generateLatex(state = {}) {
    const info = TexNotes.citationInfo(state);
    return `${buildPreamble(state.macros, state.blocks, state.references, state.bibliography, info)}\n\n${buildMetadata(state.metadata)}\n\n${buildBody(state, info)}\n\n${buildDocumentEnd()}\n`;
  }

  Object.assign(TexNotes, {
    METADATA_KEYS, normalizeLineBreaks, escapeMetadata, contentToLatex, emissionContext, floatingImage, blockToLatex,
    macrosToPreamble, buildTheoremDefs, buildPreamble, buildMetadata, buildBody, buildDocumentEnd, generateLatex,
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
