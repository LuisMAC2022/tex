(function (global) {
  "use strict";

  const SHORTCUTS = Object.freeze([
    { id: "radial.menu", code: "ContextMenu", scope: "content-widget", label: "Abrir el menú de Contenido" },
    { id: "radial.shiftMenu", code: "F10", shift: true, scope: "content-widget", label: "Abrir el menú de Contenido" },
    { id: "block.commit", code: "Enter", ctrl: true, alt: false, shift: false, meta: false, mod: true, scope: "block-editor", label: "Añadir el bloque o guardar los cambios" },
    { id: "symbols.toggle", code: "KeyS", alt: true, shift: true, ctrl: false, meta: false, scope: "block-editor", label: "Ir al tablero de símbolos o volver al campo", owner: "A" },
    { id: "symbols.escape", code: "Escape", alt: false, shift: false, ctrl: false, meta: false, scope: "symbol-widget", label: "Borrar la búsqueda o volver al campo desde el tablero", owner: "A" },
    { id: "symbols.firstResult", code: "ArrowDown", alt: false, shift: false, ctrl: false, meta: false, scope: "symbol-search-widget", label: "Ir al primer símbolo desde la búsqueda", owner: "A" },
    { id: "symbols.search", code: "ArrowUp", alt: false, shift: false, ctrl: false, meta: false, scope: "symbol-grid-widget", label: "Volver a la búsqueda desde la primera fila de símbolos", owner: "A" },
    { id: "symbols.previousGroup", code: "PageUp", alt: false, shift: false, ctrl: false, meta: false, scope: "symbol-grid-widget", label: "Ir a la categoría anterior desde la rejilla de símbolos", owner: "A" },
    { id: "symbols.nextGroup", code: "PageDown", alt: false, shift: false, ctrl: false, meta: false, scope: "symbol-grid-widget", label: "Ir a la categoría siguiente desde la rejilla de símbolos", owner: "A" },
    { id: "list.indent", code: "KeyG", alt: true, shift: true, ctrl: false, meta: false, scope: "list-editor", label: "Sangrar elementos de lista", owner: "C" },
    { id: "list.outdent", code: "KeyQ", alt: true, shift: true, ctrl: false, meta: false, scope: "list-editor", label: "Quitar sangría de elementos de lista", owner: "C" },
  ].map(Object.freeze));

  const modifiers = [
    ["ctrl", "Ctrl", "⌃", "Control"],
    ["alt", "Alt", "⌥", "Alt"],
    ["shift", "Mayús", "⇧", "Shift"],
    ["meta", "Meta", "⌘", "Meta"],
  ];
  const names = {
    ArrowLeft: "←", ArrowRight: "→", ArrowUp: "↑", ArrowDown: "↓",
    ContextMenu: "Menú", PageUp: "Re Pág", PageDown: "Av Pág", Escape: "Escape", Enter: "Intro",
  };

  function keyName(code) {
    return code.replace(/^(Key|Digit)(?=[A-Z0-9]$)/, "");
  }
  function matchShortcut(event, scope, isMac = false) {
    if (event.isComposing || event.getModifierState?.("AltGraph")) return undefined;
    return SHORTCUTS.find((shortcut) => shortcut.scope === scope && shortcut.code === event.code
      && modifiers.every(([name]) => Boolean(event[name + "Key"]) === Boolean(shortcut.mod && isMac ? (name === "meta" ? true : name === "ctrl" ? false : shortcut[name]) : shortcut[name])));
  }
  function shortcutLabel(shortcut, isMac = false) {
    const parts = modifiers.filter(([name]) => shortcut.mod && isMac ? (name === "meta" || (name !== "ctrl" && shortcut[name])) : shortcut[name]).map((item) => item[isMac ? 2 : 1]);
    return [...parts, names[shortcut.code] || keyName(shortcut.code)].join(isMac ? "" : "+");
  }
  function ariaKeyshortcuts(shortcut, isMac = false) {
    const parts = modifiers.filter(([name]) => shortcut.mod && isMac ? (name === "meta" || (name !== "ctrl" && shortcut[name])) : shortcut[name]).map((item) => item[3]);
    return [...parts, keyName(shortcut.code)].join("+");
  }

  Object.assign(global.TexNotes ??= {}, { SHORTCUTS, matchShortcut, shortcutLabel, ariaKeyshortcuts });
})(typeof globalThis !== "undefined" ? globalThis : this);
