(function (global) {
  "use strict";
  const TexNotes = global.TexNotes || (global.TexNotes = {});
  const INDENT = "  ";
  const MAX_TOTAL_DEPTH = 6;
  const MAX_TYPE_DEPTH = 4;

  function lineParts(line) {
    const indent = line.match(/^[ \t]*/)[0];
    const rest = line.slice(indent.length);
    const marker = rest.match(/^([-*]|\d+[.)])([ \t]+)/);
    return { indent, marker, content: rest.slice(marker?.[0].length || 0).trim() };
  }

  function parseListOutline(content = "", rootType = "itemize") {
    const root = { type: rootType, items: [] };
    const lists = [root];
    for (const line of String(content).split(/\r\n?|\n/)) {
      if (!line.trim()) continue;
      const { indent, marker, content: itemContent } = lineParts(line);
      const requested = Math.floor(indent.replace(/\t/g, INDENT).length / INDENT.length);
      const depth = root.items.length ? Math.min(requested, lists.length) : 0;
      if (depth === lists.length) {
        const parent = lists[depth - 1];
        const type = !marker ? parent.type : /^\d/.test(marker[1]) ? "enumerate" : "itemize";
        const child = { type, items: [] };
        parent.items[parent.items.length - 1].children = child;
        lists.push(child);
      }
      lists.length = depth + 1;
      lists[depth].items.push({ content: itemContent, children: null });
    }
    return root;
  }

  function listDepthWithEnvironment(context = {}, environment) {
    return {
      total: (context.total || 0) + 1,
      itemize: (context.itemize || 0) + Number(environment === "itemize"),
      enumerate: (context.enumerate || 0) + Number(environment === "enumerate"),
    };
  }

  function listOutlineDepthContext(tree, context) {
    if (!tree.items.length || (context?.total || 0) >= MAX_TOTAL_DEPTH
      || (context?.[tree.type] || 0) >= MAX_TYPE_DEPTH) return context;
    return listDepthWithEnvironment(context, tree.type);
  }

  function flatItems(tree) {
    const items = [];
    const pending = [...tree.items].reverse();
    while (pending.length) {
      const item = pending.pop();
      items.push({ content: item.content, children: null });
      const children = item.children?.items || [];
      for (let index = children.length - 1; index >= 0; index -= 1) pending.push(children[index]);
    }
    return items;
  }

  function limitListOutline(tree, depthContext) {
    let limited = false;
    function limitList(list, context) {
      const inside = listOutlineDepthContext(list, context);
      if (inside === context) {
        if (list.items.length) limited = true;
        return { type: null, items: flatItems(list) };
      }
      const items = [];
      for (const item of list.items) {
        const children = item.children ? limitList(item.children, inside) : null;
        items.push({ content: item.content, children: children?.type ? children : null });
        if (children && !children.type) for (const flat of children.items) items.push(flat);
      }
      return { type: list.type, items };
    }

    const result = limitList(tree, depthContext);
    return { tree: result, limited };
  }

  function outlineToLatex(tree, depthContext, appendChildren = (body) => body) {
    const { tree: limited } = limitListOutline(tree, depthContext);
    function renderList(list, depth) {
      const indent = INDENT.repeat(depth);
      const body = list.items.map(({ content, children }) => {
        const item = content ? `${indent}\\item ${content}` : `${indent}\\item`;
        return children ? `${item}\n${renderList(children, depth + 1)}` : item;
      }).join("\n");
      return `${indent}\\begin{${list.type}}\n${depth === 0 ? appendChildren(body) : body}\n${indent}\\end{${list.type}}`;
    }
    if (!limited.type) return appendChildren(limited.items.map((item) => item.content).filter(Boolean).join("\n\n"));
    return renderList(limited, 0);
  }

  function selection({ value = "", selectionStart, selectionEnd } = {}) {
    const text = String(value);
    const clamp = (index, fallback) => Number.isInteger(index) ? Math.min(Math.max(index, 0), text.length) : fallback;
    const start = clamp(selectionStart, text.length);
    const end = clamp(selectionEnd, start);
    return { text, start: Math.min(start, end), end: Math.max(start, end) };
  }

  function lineStart(text, position) {
    return position === 0 ? 0 : text.lastIndexOf("\n", position - 1) + 1;
  }

  function lineEnd(text, start) {
    const next = text.indexOf("\n", start);
    return next === -1 ? text.length : next;
  }

  function withoutIndent(line) {
    return line.replace(/^(?: ?\t| {1,2})/, "");
  }

  function shiftLines(state, delta) {
    const { text, start, end } = selection(state);
    if (!delta) return { value: text, selectionStart: start, selectionEnd: end };
    const first = lineStart(text, start);
    const last = lineEnd(text, start === end ? end : end - 1);
    let position = first;
    let newStart = start;
    let newEnd = end;
    const shifted = text.slice(first, last).split("\n").map((line) => {
      const changed = delta > 0 ? INDENT + line : withoutIndent(line);
      const offset = changed.length - line.length;
      const adjust = (index) => index < position ? 0 : Math.max(offset, position - index);
      newStart += adjust(start);
      newEnd += adjust(end);
      position += line.length + 1;
      return changed;
    }).join("\n");
    return { value: text.slice(0, first) + shifted + text.slice(last), selectionStart: newStart, selectionEnd: newEnd };
  }

  function continueListLine(state) {
    const { text, start, end } = selection(state);
    const from = lineStart(text, start);
    const to = lineEnd(text, start);
    const { indent, marker, content } = lineParts(text.slice(from, to));
    if (!content && end <= to && indent.length) {
      const outdented = withoutIndent(indent);
      const cursor = from + outdented.length;
      return { value: text.slice(0, from) + outdented + text.slice(to), selectionStart: cursor, selectionEnd: cursor };
    }
    let insertion = "\n";
    if (content && start >= from + indent.length + (marker?.[0].length || 0)) {
      insertion += indent;
      if (marker) {
        const [digits, suffix] = [marker[1].slice(0, -1), marker[1].slice(-1)];
        const symbol = digits ? `${String(BigInt(digits) + 1n).padStart(digits.length, "0")}${suffix}` : suffix;
        insertion += symbol + marker[2];
      }
    }
    const cursor = start + insertion.length;
    return { value: text.slice(0, start) + insertion + text.slice(end), selectionStart: cursor, selectionEnd: cursor };
  }

  Object.assign(TexNotes, {
    parseListOutline, limitListOutline, outlineToLatex, listDepthWithEnvironment, listOutlineDepthContext,
    shiftLines, continueListLine,
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
