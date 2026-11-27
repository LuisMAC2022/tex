/** Selección semántica. Los índices se refieren al texto original en unidades UTF-16. */
(function (T) {
  "use strict";
  const words = new Intl.Segmenter("es", { granularity: "word" });
  const sentences = new Intl.Segmenter("es", { granularity: "sentence" });
  const graphemes = new Intl.Segmenter("es", { granularity: "grapheme" });
  const relations = new Set([
    "=", "<", ">", "≤", "≥", "≠", "≈", "∈", "⊂", "→", "\\le", "\\leq", "\\ge", "\\geq",
    "\\ne", "\\neq", "\\in", "\\notin", "\\subset", "\\subseteq", "\\supset", "\\supseteq",
    "\\to", "\\rightarrow", "\\leftrightarrow", "\\implies", "\\iff", "\\equiv", "\\approx", "\\sim",
  ]);
  const matrixNames = new Set([
    "matrix", "pmatrix", "bmatrix", "Bmatrix", "vmatrix", "Vmatrix", "smallmatrix", "array",
    "cases", "align", "aligned", "alignat", "alignedat", "split",
  ]);
  const openers = new Map([["{", "brace"], ["[", "bracket"], ["(", "paren"], ["\\(", "math:paren"], ["\\[", "math:bracket"]]);
  const closers = new Map([["}", "brace"], ["]", "bracket"], [")", "paren"], ["\\)", "math:paren"], ["\\]", "math:bracket"]]);
  const textCommands = new Set(["\\text", "\\mbox", "\\textbf", "\\textit"]);
  const contains = (outer, inner) => outer.start <= inner.start && inner.end <= outer.end;

  function rangeOf(value, range) {
    const clamp = index => Math.min(value.length, Math.max(0, Number.isFinite(index) ? index : 0));
    const start = clamp(range.start ?? range.selectionStart);
    const end = clamp(range.end ?? range.selectionEnd ?? start);
    return { start: Math.min(start, end), end: Math.max(start, end) };
  }
  function probe(value, range) {
    if (range.start !== range.end || !value.length) return range;
    const start = Math.min(value.length - 1, range.start);
    return { start, end: start + 1 };
  }
  function trimmed(value, start, end) {
    while (start < end && /\s/u.test(value[start])) start++;
    while (end > start && /\s/u.test(value[end - 1])) end--;
    return { start, end };
  }
  function prose(value, start, end, query, offer) {
    const part = value.slice(start, end);
    for (const [name, segmenter] of [["Palabra", words], ["Oración", sentences]]) {
      for (const item of segmenter.segment(part)) {
        if (name === "Palabra" && !item.isWordLike) continue;
        const range = trimmed(value, start + item.index, start + item.index + item.segment.length);
        if (contains(range, query)) {
          offer(range.start, range.end, name);
          break;
        }
      }
    }
    let from = start;
    for (const gap of part.matchAll(/(?:\r?\n)[^\S\r\n]*(?:\r?\n)+/g)) {
      offer(from, start + gap.index, "Párrafo");
      from = start + gap.index + gap[0].length;
    }
    offer(from, end, "Párrafo");
    offer(start, end, "Bloque");
  }

  function tokens(value) {
    // Los comentarios y escapes se consumen antes de interpretar cualquier delimitador.
    const scanner = /%[^\r\n]*|\\(?:begin|end)\s*\{[^{}\s]+\}|\\(?:left|right)(?![a-zA-Z])\s*(?:\\[a-zA-Z]+|\\[^\r\n]|[^\s\\])|\\[a-zA-Z]+|\\[^\r\n]|\$\$|\s+/guy;
    const characters = graphemes.segment(value);
    const list = [];
    for (let start = 0; start < value.length;) {
      scanner.lastIndex = start;
      const match = scanner.exec(value);
      const character = match ? null : characters.containing(start);
      const end = match ? scanner.lastIndex : character.index + character.segment.length;
      const text = value.slice(start, end);
      const token = { start, end, text };
      const environment = /^\\(begin|end)\s*\{([^}]+)\}$/.exec(text);
      if (environment) token[environment[1] === "begin" ? "open" : "close"] = "env:" + environment[2];
      else if (/^\\left(?![a-zA-Z])/.test(text)) token.open = "left";
      else if (/^\\right(?![a-zA-Z])/.test(text)) token.close = "left";
      else if (text === "$" || text === "$$") token.toggle = "math:" + text;
      else if (openers.has(text)) token.open = openers.get(text);
      else if (closers.has(text)) token.close = closers.get(text);
      list.push(token);
      start = end;
    }
    return list;
  }
  function mathTree(value) {
    const list = tokens(value);
    const stack = [], pairs = new Map();
    for (const [index, token] of list.entries()) {
      const top = stack.at(-1);
      if (top && top.key === (token.close || token.toggle)) {
        stack.pop();
        pairs.set(top.index, index);
      } else if (token.open || token.toggle) {
        stack.push({ index, key: token.open || token.toggle });
      }
    }
    function sequence(first, last, depth) {
      const nodes = [];
      for (let index = first; index < last; index++) {
        const token = list[index], close = pairs.get(index);
        if (close === undefined || close >= last) {
          nodes.push(token);
          continue;
        }
        nodes.push({
          ...token, group: token.open || token.toggle,
          insideStart: token.end, insideEnd: list[close].start, end: list[close].end,
          nodes: depth < 100 ? sequence(index + 1, close, depth + 1) : [],
        });
        index = close;
      }
      return nodes;
    }
    return sequence(0, list.length, 0);
  }
  function mathWindow(node) {
    return node.group?.startsWith("math:") ||
      (node.group?.startsWith("env:") && T.MATH_ENVIRONMENTS.has(node.group.slice(4).replace(/\*$/, "")));
  }
  function enclosingMath(nodes, query, accept) {
    for (const node of nodes) {
      if (!node.group || !contains(node, query)) continue;
      if (mathWindow(node) && accept(node)) return node;
      return enclosingMath(node.nodes, query, accept);
    }
    return null;
  }
  function scopeModeAt(value, range, type) {
    if (T.blockType(type)?.kind === "equation") return "equation";
    const query = probe(value, rangeOf(value, range));
    if (enclosingMath(mathTree(value), query, () => true)) return "math";
    return T.mathContextAt(value, query.start, type) === "math" ? "math" : "text";
  }

  function mathScopes(value, query, mode, offer) {
    const root = mathTree(value);
    const island = enclosingMath(root, query, node => mode !== "equation" || node.group.startsWith("math:"));
    const cellBreak = text => text === "&" || text === "\\\\";
    const termBreak = text => cellBreak(text) || relations.has(text) || ["+", "-", "−"].includes(text);

    function split(nodes, start, end, separates, name) {
      let from = start;
      for (const node of nodes) {
        if (node.group || !separates(node.text)) continue;
        const range = trimmed(value, from, node.start);
        offer(range.start, range.end, name);
        from = node.end;
      }
      const range = trimmed(value, from, end);
      offer(range.start, range.end, name);
    }
    function visitGroup(node, asText) {
      if (!contains(node, query)) return;
      const { insideStart, insideEnd } = node;
      offer(node.start, insideStart, "Delimitador");
      offer(insideEnd, node.end, "Delimitador");
      if (contains({ start: insideStart, end: insideEnd }, query)) {
        if (matrixNames.has(node.group.replace(/^env:/, "").replace(/\*$/, ""))) {
          split(node.nodes, insideStart, insideEnd, cellBreak, "Celda");
          split(node.nodes, insideStart, insideEnd, text => text === "\\\\", "Fila");
        }
        if (asText) {
          prose(value, insideStart, insideEnd, query, (a, b, name) => offer(a, b, name === "Bloque" ? "Texto" : name));
        } else {
          visit(node.nodes, insideStart, insideEnd);
        }
        offer(insideStart, insideEnd, mathWindow(node) ? "Fórmula" : "Argumento");
      }
      offer(node.start, node.end, mathWindow(node) ? "Fórmula con delimitadores" : "Grupo");
    }
    function visit(nodes, start, end) {
      function skipSpaces(index) {
        while (index < nodes.length && /^\s+$/.test(nodes[index].text)) index++;
        return index;
      }
      let base = null;
      for (let index = 0; index < nodes.length; index++) {
        const node = nodes[index], text = node.text;
        if (/^\s+$/.test(text)) continue;
        if (node.group) visitGroup(node, false);
        else offer(node.start, node.end, text.startsWith("%") ? "Comentario" : text.startsWith("\\") ? "Comando" : "Símbolo");
        if (termBreak(text)) {
          base = null;
          continue;
        }

        const first = skipSpaces(index + 1);
        if (text === "\\frac" || text === "\\sqrt" || textCommands.has(text)) {
          let argument = first;
          if (text === "\\sqrt" && nodes[argument]?.group === "bracket") {
            visitGroup(nodes[argument], false);
            argument = skipSpaces(argument + 1);
          }
          const count = text === "\\frac" ? 2 : 1;
          let last = index;
          for (let arg = 0; arg < count && nodes[argument]?.group === "brace"; arg++) {
            visitGroup(nodes[argument], textCommands.has(text));
            last = argument;
            argument = skipSpaces(argument + 1);
          }
          if (last !== index) offer(node.start, nodes[last].end, "Término");
          index = last;
          base = node.start;
        } else if ((text === "^" || text === "_") && nodes[first]) {
          const argument = nodes[first];
          if (argument.group) visitGroup(argument, false);
          else offer(argument.start, argument.end, "Argumento");
          offer(node.start, argument.end, text === "^" ? "Superíndice" : "Subíndice");
          base ??= node.start;
          offer(base, argument.end, "Término");
          index = first;
        } else {
          base = node.start;
        }
      }
      split(nodes, start, end, termBreak, "Término");
      split(nodes, start, end, text => cellBreak(text) || relations.has(text), "Miembro");
    }

    if (island) visitGroup(island, false);
    else {
      visit(root, 0, value.length);
      offer(0, value.length, "Fórmula");
    }
  }

  function scopeLevels(value, range, mode) {
    const initial = rangeOf(value, range), query = probe(value, initial);
    const candidates = [];
    function offer(start, end, name) {
      if (end > start && start <= query.start && query.end <= end && (start < initial.start || end > initial.end)) {
        candidates.push({ start, end, name });
      }
    }
    if (mode === "math" || mode === "equation") mathScopes(value, query, mode, offer);
    else prose(value, 0, value.length, query, offer);

    candidates.sort((a, b) => (a.end - a.start) - (b.end - b.start));
    const chain = [];
    for (const candidate of candidates) {
      const previous = chain.at(-1) || initial;
      if (contains(candidate, previous) && (candidate.start < previous.start || previous.end < candidate.end)) chain.push(candidate);
    }
    return chain;
  }
  function expandScope(value, range, mode, stack = []) {
    const larger = scopeLevels(value, range, mode)[0];
    return larger ? { range: larger, stack: [...stack, { ...range }] } : { range, stack };
  }
  function shrinkScope(range, stack = []) {
    return stack.length ? { range: stack.at(-1), stack: stack.slice(0, -1) } : { range, stack };
  }
  Object.assign(T, { scopeLevels, scopeModeAt, expandScope, shrinkScope });
})(globalThis.TexNotes);
