(function (global) {
  "use strict";

  const SHORTCUTS = Object.freeze([
    { id: "symbols.toggle", code: "KeyS", alt: true, shift: true, ctrl: false, meta: false, scope: "block-editor", label: "Abrir o cerrar el tablero de símbolos", owner: "A" },
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
    PageUp: "Re Pág", PageDown: "Av Pág", Escape: "Escape",
  };

  function keyName(code) {
    return code.replace(/^(Key|Digit)(?=[A-Z0-9]$)/, "");
  }
  function matchShortcut(event, scope) {
    if (event.isComposing || event.getModifierState?.("AltGraph")) return undefined;
    return SHORTCUTS.find((shortcut) => shortcut.scope === scope && shortcut.code === event.code
      && modifiers.every(([name]) => Boolean(event[name + "Key"]) === shortcut[name]));
  }
  function shortcutLabel(shortcut, isMac = false) {
    const parts = modifiers.filter(([name]) => shortcut[name]).map((item) => item[isMac ? 2 : 1]);
    return [...parts, names[shortcut.code] || keyName(shortcut.code)].join(isMac ? "" : "+");
  }
  function ariaKeyshortcuts(shortcut) {
    const parts = modifiers.filter(([name]) => shortcut[name]).map((item) => item[3]);
    return [...parts, keyName(shortcut.code)].join("+");
  }

  Object.assign(global.TexNotes ??= {}, { SHORTCUTS, matchShortcut, shortcutLabel, ariaKeyshortcuts });
})(typeof globalThis !== "undefined" ? globalThis : this);
