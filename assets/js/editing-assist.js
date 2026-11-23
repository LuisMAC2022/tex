/** Reglas puras del asistente del campo Contenido. Índices UTF-16. */
(function (global) {
  "use strict";
  const T = global.TexNotes;
  function replaceSelection(state, text, cursor = text.length, end = cursor) {
    const start = state.selectionStart;
    return { value: state.value.slice(0, start) + text + state.value.slice(state.selectionEnd), selectionStart: start + cursor, selectionEnd: start + end };
  }
  /* @decision DEC-016 ancla:50c7df6a tramo:11
   * La distancia al final deja estables los cierres cuando se escribe dentro.
   * Una discrepancia o salir del par más interno invalida toda la sesión.
   */
  function activePairs(state, pending = []) {
    if (!pending.length) return [];
    const valid = pending.every((p) => state.value.slice(state.value.length - p.distance).startsWith(p.close));
    const inner = pending.at(-1);
    const end = state.value.length - inner.distance;
    return valid && state.selectionStart >= inner.start + inner.open.length && state.selectionEnd <= end ? pending : [];
  }
  function autoPair(state, data, { mode, pending = [] } = {}) {
    if (data.length !== 1 || mode === "comment") return null;
    pending = activePairs(state, pending);
    const { value, selectionStart: start, selectionEnd: end } = state;
    const before = value.slice(0, start), selected = value.slice(start, end);
    const last = pending.at(-1), closeAt = last && value.length - last.distance;
    if (last && start === end && start === closeAt && last.key === data) {
      if (data === "$" && last.open === "$" && start === last.start + 1) {
        const edit = { value: value.slice(0, last.start) + "$$$$" + value.slice(start + 1), selectionStart: start + 1, selectionEnd: start + 1 };
        return { edit, pending: [...pending.slice(0, -1), { ...last, open: "$$", close: "$$", distance: edit.value.length - start - 1 }] };
      }
      return { edit: { value, selectionStart: closeAt + last.close.length, selectionEnd: closeAt + last.close.length }, pending: pending.slice(0, -1) };
    }
    if (!selected && start < value.length && !/[\s)\]}$,.;:]/.test(value[start])) return null;
    const slash = before.endsWith("\\") && !T.isEscaped(value, start - 1);
    const left = before.endsWith("\\left") && !T.isEscaped(value, start - 5);
    const leftBrace = before.endsWith("\\left\\") && !T.isEscaped(value, start - 6);
    let inserted = data, close = "", open = data, openStart = start, key = "";
    if (data === "{") {
      close = slash ? "\\}" : "}"; key = "}";
      if (slash) { open = "\\{"; openStart--; }
      if (mode === "math" && leftBrace) { close = "\\right\\}"; open = "\\left\\{"; openStart = start - 6; }
    } else if ((data === "(" || data === "[") && (mode === "math" || (mode === "text" && slash))) {
      key = data === "(" ? ")" : "]"; close = key;
      if (mode === "text" && slash) { close = "\\" + key; open = "\\" + data; openStart--; }
      else if (left) { close = "\\right" + key; open = "\\left" + data; openStart -= 5; }
    } else if (data === "|" && mode === "math" && left) {
      close = "\\right|"; key = "|"; open = "\\left|"; openStart -= 5;
    } else if (data === "$" && mode === "text" && !T.isEscaped(value, start)) {
      close = "$"; key = "$";
    } else if ((data === "^" || data === "_") && selected && mode === "math" && !T.isEscaped(value, start)) {
      // Sin selección no se abre llave: véase DEC-022.
      inserted += "{"; open = "{"; openStart++; close = "}"; key = "}";
    } else return null;
    const edit = replaceSelection(state, inserted + selected + close, inserted.length, inserted.length + selected.length);
    const pair = { start: openStart, open, close, key, distance: edit.value.length - (start + inserted.length + selected.length) };
    return { edit, pending: [...pending, pair] };
  }
  function deleteEmptyPair(state, pending = []) {
    const pairs = activePairs(state, pending), pair = pairs.at(-1);
    if (!pair || state.selectionStart !== state.selectionEnd || state.selectionStart !== pair.start + pair.open.length
      || state.selectionStart !== state.value.length - pair.distance) return null;
    const edit = replaceSelection({ ...state, selectionStart: pair.start, selectionEnd: state.selectionStart + pair.close.length }, "");
    return { edit, pending: pairs.slice(0, -1) };
  }
  function completeEnvironment(state, typeId) {
    if (["list", "bibliography"].includes(T.blockType(typeId)?.kind) || state.selectionStart !== state.selectionEnd) return null;
    const before = state.value.slice(0, state.selectionStart);
    const line = before.slice(before.lastIndexOf("\n") + 1);
    const match = /\\begin\{([^{}\s]+)\}(?:\[[^\]\n]*\]|\{[^{}\n]*\})*\s*$/.exec(line);
    if (!match || T.isEscaped(line, match.index)) return null;
    const name = match[1];
    const tokens = [...state.value.matchAll(/\\(begin|end)\{([^{}]+)\}/g)].filter(m => !T.isEscaped(state.value, m.index) && T.mathContextAt(state.value, m.index, "text") !== "comment" && m[2] === name);
    if (tokens.reduce((n, m) => n + (m[1] === "begin" ? 1 : -1), 0) <= 0) return null;
    return replaceSelection(state, `\n\n\\end{${name}}`, 1);
  }
  function parseSnippet(source) {
    const input = typeof source === "object" ? String(source.before || "") + "#1" + String(source.after || "") : String(source);
    let text = "", final = null;
    const markers = [];
    for (let i = 0; i < input.length; i++) {
      if (input[i] === "#" && !T.isEscaped(input, i) && /[0-9]/.test(input[i + 1] || "")) {
        const n = Number(input[++i]);
        if (n === 0) final = text.length;
        else markers.push({ n, index: text.length });
      } else text += input[i];
    }
    const holes = markers.length || final !== null ? markers.sort((a, b) => a.n - b.n).map(m => m.index)
      : [...text.matchAll(/\{\}/g)].filter(m => !T.isEscaped(text, m.index)).map(m => m.index + 1);
    return { text, holes, final: final === null ? text.length : final };
  }
  function pairsAfterReplacement(state, pending, start, end) {
    return activePairs(state, pending).filter(pair => pair.start < start && state.value.length - pair.distance >= end);
  }
  function snippetEdit(state, source, wrapMath = false) {
    const snippet = parseSnippet(source);
    const prefix = wrapMath ? "$" : "", suffix = wrapMath ? "$" : "";
    const text = prefix + snippet.text + suffix;
    const start = state.selectionStart, first = snippet.holes[0] ?? snippet.final;
    const edit = replaceSelection(state, text, prefix.length + first);
    const session = snippet.holes.length ? { start, endDistance: edit.value.length - start - text.length,
      holes: snippet.holes.map(index => edit.value.length - start - prefix.length - index),
      finalDistance: edit.value.length - start - prefix.length - snippet.final, index: 0 } : null;
    const pending = wrapMath ? [{ start, open: "$", close: "$", key: "$", distance: edit.value.length - start - text.length + 1 }] : [];
    return { edit, session, pending };
  }
  function activeSnippet(state, session) {
    return session && state.selectionStart >= session.start && state.selectionEnd <= state.value.length - session.endDistance ? session : null;
  }
  function nextSnippetHole(state, session) {
    if (!activeSnippet(state, session)) return null;
    const index = session.index + 1;
    const cursor = state.value.length - (session.holes[index] ?? session.finalDistance);
    return { edit: { ...state, selectionStart: cursor, selectionEnd: cursor }, session: index < session.holes.length ? { ...session, index } : null };
  }
  function skipPendingClose(state, pending) {
    const pairs = activePairs(state, pending), pair = pairs.at(-1);
    if (!pair || state.selectionStart !== state.selectionEnd) return null;
    const closeAt = state.value.length - pair.distance;
    if (!/^\s*$/.test(state.value.slice(state.selectionStart, closeAt))) return null;
    return { edit: { ...state, selectionStart: closeAt + pair.close.length, selectionEnd: closeAt + pair.close.length }, pending: pairs.slice(0, -1) };
  }
  Object.assign(T, { parseSnippet, pairsAfterReplacement, snippetEdit, activeSnippet, nextSnippetHole, skipPendingClose });
  Object.assign(T, { replaceSelection, activePairs, autoPair, deleteEmptyPair, completeEnvironment });
})(typeof globalThis !== "undefined" ? globalThis : this);
