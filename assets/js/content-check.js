/** Comprobaciones heurísticas del contenido que se envía a LaTeX. */
(function (global) {
  "use strict";
  const TexNotes = global.TexNotes || (global.TexNotes = {});
  const MAX_DEPTH = 6;
  const GUIDE = "docs/guia-de-uso.md#";
  const RULES = {
    "brace": ["error", "llaves-y-caracteres-reservados"],
    "math-delimiter": ["error", "modo-matemático"],
    "environment": ["error", "entornos-desparejados"],
    "comment": ["aviso", "falta-un-trozo-de-texto-en-el-pdf-pero-no-hay-ningún-error"],
    "underscore": ["error", "modo-matemático"],
    "caret": ["error", "modo-matemático"],
    "ampersand": ["error", "llaves-y-caracteres-reservados"],
    "hash": ["error", "llaves-y-caracteres-reservados"],
    "depth": ["aviso", "profundidad-de-listas-y-entornos"],
  };
  const MATH_DELIMITERS = new Set(["$", "$$", "\\(", "\\)", "\\[", "\\]"]);
  const MATH_ENVIRONMENTS = new Set([
    "math", "displaymath", "equation", "eqnarray", "align", "alignat", "aligned", "alignedat", "flalign",
    "gather", "gathered", "multline", "split", "array", "matrix", "pmatrix", "bmatrix", "Bmatrix",
    "vmatrix", "Vmatrix", "smallmatrix", "cases",
  ]);
  const ALIGNMENT_ENVIRONMENTS = new Set(["tabular", "tabularx", "longtable"]);

  function hasBlockEnvironment(block, type) {
    const hasContent = Boolean(String(block.content ?? "").trim());
    if (type?.kind === "theorem") return hasContent || Boolean(block.children?.length);
    return hasContent && type?.kind === "bibliography";
  }

  function itemParts(block, type, content, depthContext) {
    let start = 0;
    const lines = content.split("\n").map((text) => {
      const line = { text, start };
      start += text.length + 1;
      return line;
    });
    const parentDepth = depthContext.total || 0;
    if (type.kind === "bibliography") {
      return lines.filter(({ text }) => text.trim()).map(({ text, start }) => ({
        content: text.trim(),
        start: start + text.length - text.trimStart().length,
        depth: parentDepth + 1,
      }));
    }

    const parsed = TexNotes.parseListOutline(content, type.listEnvironment, block.listFormat, { withPositions: true });
    const { tree } = TexNotes.limitListOutline(parsed, depthContext);
    const parts = [];
    function addItems(list, outerDepth) {
      const depth = outerDepth + Number(Boolean(list.type));
      for (const item of list.items) {
        parts.push({ content: item.content, start: lines[item.line - 1].start + item.column - 1, depth });
        if (item.children) addItems(item.children, depth);
      }
    }
    addItems(tree, parentDepth);
    return parts;
  }

  function locateIssues(content, issues) {
    let cursor = 0;
    let line = 1;
    let column = 1;
    return issues.sort((first, second) => first.index - second.index).map(({ index, code, message }) => {
      for (const character of content.slice(cursor, index)) {
        if (character === "\n") { line += 1; column = 1; }
        else column += 1;
      }
      cursor = index;
      const [severity, section] = RULES[code];
      return { code, severity, line, column, message, guide: GUIDE + section };
    });
  }

  function inspectBlock(block, depthContext = {}) {
    const type = TexNotes.blockType(block.type);
    // El contenido de una imagen es una ruta. Su campo ya comprueba ese formato.
    if (block.type === "image") return [];
    const content = TexNotes.normalizeLineBreaks(block.content ?? "");
    const issues = [];
    const report = (index, code, message) => issues.push({ index, code, message });
    const braces = [];
    const environments = [];
    const parentDepth = depthContext.total || 0;
    let mathEnvironments = 0;
    let alignmentEnvironments = 0;
    let depthReported = false;

    function checkDepth(index, depth) {
      if (depthReported || depth <= MAX_DEPTH) return;
      report(index, "depth", "El contenido supera los seis niveles de listas o entornos anidados.");
      depthReported = true;
    }

    function inspectPart({ content: text, start, depth }) {
      if (depth > parentDepth) checkDepth(start, depth);
      const uncommented = text.replace(/\\[^\n]|%[^\n]*/g, (token, index) => {
        if (token[0] !== "%") return token;
        report(start + index, "comment", "El % comenta el resto de la línea. Escribe \\% si quieres imprimirlo.");
        return " ".repeat(token.length);
      });
      // La ecuación aporta su propio modo matemático. Aquí se buscan los tramos
      // escritos a mano, separados por los elementos que genera la aplicación.
      const segments = TexNotes.mathSegments(uncommented, "text");
      const tokens = /\\(begin|end)\s*\{([^{}\s]+)\}|\\[^\n]|\$\$?|##|#[1-9]|[{}_^&#]/g;
      let segmentIndex = 0;
      for (const match of uncommented.matchAll(tokens)) {
        const [token, command, name] = match;
        const index = start + match.index;
        while (segments[segmentIndex]?.end <= match.index) segmentIndex += 1;
        const inMathSegment = segments[segmentIndex]?.start <= match.index;
        const inMath = inMathSegment || mathEnvironments > 0 || type?.kind === "equation";

        if (command === "begin") {
          const baseName = name.replace(/\*$/, "");
          const math = MATH_ENVIRONMENTS.has(baseName);
          const alignment = ALIGNMENT_ENVIRONMENTS.has(baseName);
          environments.push({ name, index, math, alignment });
          mathEnvironments += Number(math);
          alignmentEnvironments += Number(alignment);
          checkDepth(index, depth + environments.length);
        } else if (command === "end") {
          const opening = environments.pop();
          if (!opening) report(index, "environment", `El cierre ${token} no tiene un entorno abierto.`);
          else {
            mathEnvironments -= Number(opening.math);
            alignmentEnvironments -= Number(opening.alignment);
            if (opening.name !== name) {
              report(index, "environment", `El entorno ${opening.name} se cerró con ${token}.`);
            }
          }
        } else if (MATH_DELIMITERS.has(token) && !inMathSegment) {
          report(index, "math-delimiter", `El delimitador matemático ${token} no tiene pareja.`);
        } else if (token === "{") {
          braces.push(index);
        } else if (token === "}") {
          if (braces.length) braces.pop();
          else report(index, "brace", "Esta llave de cierre no tiene una llave de apertura.");
        } else if (token === "_" && !inMath) {
          report(index, "underscore", "El guion bajo _ está fuera de matemáticas. Escribe \\_ para imprimirlo.");
        } else if (token === "^" && !inMath) {
          report(index, "caret", "El signo ^ está fuera de matemáticas. Escribe \\textasciicircum{} para imprimirlo.");
        } else if (token === "&" && !inMath && !alignmentEnvironments) {
          report(index, "ampersand", "El signo & está fuera de matemáticas o de una tabla. Escribe \\& para imprimirlo.");
        } else if (token === "#") {
          report(index, "hash", "El signo # está suelto. Escribe \\# para imprimirlo.");
        }
      }
    }
    if (type?.kind === "list" || type?.kind === "bibliography") {
      itemParts(block, type, content, depthContext).forEach(inspectPart);
    } else {
      inspectPart({ content, start: 0, depth: parentDepth + Number(hasBlockEnvironment(block, type)) });
    }
    for (const index of braces) report(index, "brace", "Esta llave de apertura quedó sin cerrar.");
    for (const { name, index } of environments) report(index, "environment", `El entorno ${name} quedó sin cerrar.`);
    return locateIssues(content, issues);
  }

  function checkContent(content, typeId) {
    return inspectBlock({ type: typeId, content });
  }

  function checkBlock(block, blocks = [], parentPath = []) {
    let siblings = blocks;
    let depthContext = {};
    for (const index of parentPath) {
      const parent = siblings[index];
      if (!parent) break;
      const type = TexNotes.blockType(parent.type);
      if (type?.kind === "list") {
        const outline = TexNotes.parseListOutline(parent.content, type.listEnvironment, parent.listFormat);
        depthContext = TexNotes.listOutlineDepthContext(outline, depthContext);
      } else if (type?.kind === "theorem") {
        depthContext = TexNotes.listDepthWithEnvironment(depthContext, type.environment);
      }
      siblings = parent.children || [];
    }
    return inspectBlock(block, depthContext);
  }

  function checkDocument(state = {}) {
    const results = [];
    for (const { block, path, parentPath } of TexNotes.flattenBlocks(state.blocks)) {
      const issues = checkBlock(block, state.blocks, parentPath);
      if (issues.length) results.push({ path, issues });
    }
    return results;
  }

  Object.assign(TexNotes, { checkContent, checkBlock, checkDocument });
})(typeof globalThis !== "undefined" ? globalThis : this);
