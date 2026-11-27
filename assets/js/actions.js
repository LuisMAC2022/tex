/** Catálogo común de las acciones disponibles desde los controles de la aplicación. */
(function (T) {
  "use strict";
  const editor = ["text", "formula", "image"], card = ["card"], global = ["global"];
  const labels = new Map(T.SHORTCUTS.map(s => [s.id, s.label]));
  function action(id, label, icon, contexts, options = {}) {
    return Object.freeze({ id, label: label || labels.get(id), icon, contexts, ...options });
  }
  const ACTIONS = Object.freeze([
    action("radial.menu", "Menú de contenido", "✥", editor),
    action("radial.shiftMenu", null, "✥", editor),
    action("radial.global", "Menú general", "✥", global),
    action("block.commit", "Añadir bloque", "＋", editor),
    action("write.previous", "Anterior", "◀", editor),
    action("write.next", "Siguiente", "▶", editor),
    action("write.scope", "Selección por alcance", "↔", editor),
    action("write.symbols", "Símbolos", "Ω", editor),
    action("write.list", "Lista", "•", ["text"]),
    action("write.title", "Título", "T", editor),
    action("edit.undo", "Deshacer", "↶", editor),
    action("edit.redo", "Rehacer", "↷", editor),
    action("structure.undo", "Deshacer cambio", "↶", global),
    action("structure.redo", "Rehacer cambio", "↷", global),
    action("image.width", "Tamaño", "↔", ["image"]),
    action("image.align", "Alineación", "≡", ["image"]),
    action("image.file", "Reemplazar", "↺", ["image"]),
    action("image.delete", "Eliminar imagen", "×", ["image"]),
    action("block.type", "Elegir tipo", "¶", [...editor, "global"]),
    action("block.typePicker", "Más tipos", "…", [...editor, "global"]),
    action("navigation.go", "Ir a…", "↗", global),
    action("navigation.preferences", "Preferencias", "⚙", global),
    action("block.edit", "Editar", "✎", card),
    action("block.child", "Añadir dentro", "↳", card, { enabled: c => c.container }),
    action("block.context", "Acciones", "⋯", card),
    action("block.duplicate", "Duplicar", "⧉", card),
    action("block.copy", "Copiar bloque", "▣", card),
    action("block.copy-text", "Copiar texto", "T", card),
    action("block.delete", "Eliminar", "×", card),
    action("block.up", "Subir", "↑", card, { enabled: c => c.position > 0 }),
    action("block.down", "Bajar", "↓", card, { enabled: c => c.position + 1 < c.siblings }),
    action("block.convert-bibliography", "Convertir en referencias del documento", "§", card, { enabled: c => c.type === "bibliography" }),
    action("block.move", "Mover…", "↗", card),
    action("block.template", "Guardar como plantilla", "☆", card),
    action("block.pasteInside", "Pegar dentro", "⇥", card, { enabled: c => c.container && c.hasTray }),
    action("symbols.open", "Abrir símbolos", "Ω", editor),
    action("symbols.toggle", null, "Ω", editor),
    action("symbols.escape", null, "×", editor),
    action("symbols.firstResult", null, "↓", editor),
    action("symbols.search", null, "⌕", editor),
    action("symbols.previousGroup", null, "◀", editor),
    action("symbols.nextGroup", null, "▶", editor),
    action("list.indent", null, "→", ["text"]),
    action("list.outdent", null, "←", ["text"]),
  ]);
  const byId = new Map(ACTIONS.map(a => [a.id, a]));
  const actionById = id => byId.get(id);
  const actionsFor = context => ACTIONS.filter(a => a.contexts.includes(context));
  function actionContext({ source, blockKind, mathMode, scopeMode }) {
    if (source === "global" || source === "card") return source;
    if (blockKind === "image") return "image";
    if (blockKind === "equation" || mathMode === "math" || scopeMode === "math") return "formula";
    return "text";
  }
  function blockActionState(blocks, path, hasTray) {
    const block = T.blockAtPath(blocks, path);
    if (!block) return {};
    const parent = T.blockAtPath(blocks, path.slice(0, -1));
    return { type: block.type, position: path.at(-1), siblings: parent ? parent.children.length : blocks.length,
      container: T.acceptsChildren(block.type), hasTray };
  }
  const actionHandlers = Object.create(null);
  function registerActionHandlers(handlers) {
    for (const [id, handler] of Object.entries(handlers)) {
      if (!byId.has(id) || typeof handler !== "function") throw Error("Acción inválida: " + id);
      actionHandlers[id] = handler;
    }
  }
  function runAction(id, args = {}, origen = {}) {
    return actionHandlers[id]?.(args, origen);
  }
  Object.assign(T, { ACTIONS, actionById, actionsFor, actionContext, blockActionState, actionHandlers, registerActionHandlers, runAction });
})(globalThis.TexNotes);
