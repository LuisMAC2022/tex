/** Disposición estable. Los catálogos de símbolos y tipos conservan sus propios rótulos. */
(function (T) {
  "use strict";
  const insert = (id, label, icon, snippet) => ({ id, label, icon, action: { type: "insert", snippet } });
  const command = (id, label, icon, action, ...args) => ({ id, label, icon, action, args });
  const submenu = (id, label, icon, slices) => ({ id, label, icon, action: { type: "submenu", slices } });
  T.typeMenuSlices = () => T.slicesFor("global").find(s => s.id === "new").children;
  T.symbolCategorySlices = function () {
    const ids = ["recent", "greek-lower", "logic", "sets", "relations", "integrals"];
    const icons = ["◷", "α", "⇒", "∈", "≤", "∫"];
    const slices = ids.map((id, index) => ({ id: "category-" + id, label: T.SYMBOL_BOARD_GROUPS.find(g => g.id === id).label,
      icon: icons[index], action: { type: "action", id: "symbols.open", args: [id] } }));
    return [...slices, { id: "category-more", label: "Más…", icon: "…", action: { type: "action", id: "symbols.open" } }];
  };
  T.RADIAL_MENUS = [
    { context: "formula", slices: [
      insert("frac", "Fracción", "a⁄b", "\\frac{#1}{#2}#0"),
      insert("sqrt", "Raíz", "√", "\\sqrt{#1}#0"),
      insert("int", "Integral", "∫", "\\int_{#1}^{#2} #3 \\, d#4#0"),
      insert("sum", "Suma", "Σ", "\\sum_{#1}^{#2} #0"),
      insert("super", "Superíndice", "x²", "^{#1}#0"),
      insert("sub", "Subíndice", "x₂", "_{#1}#0"),
      insert("matrix", "Matriz", "▦", "\\begin{pmatrix}\n#1 & #2 \\\\\n#3 & #4\n\\end{pmatrix}#0"),
      submenu("greek", "Griegas", "αβ", [
        ...["alpha","beta","delta","varepsilon","theta","lambda","pi"].map(symbol => ({ id: "greek-" + symbol, action: { type: "symbol", symbol } })),
        command("greek-more", "Más…", "…", "symbols.open", "greek-lower"),
      ]),
    ] },
    { context: "text", slices: [
      insert("bold", "Negrita", "N", "\\textbf{#1}#0"),
      insert("italic", "Cursiva", "C", "\\textit{#1}#0"),
      command("list", "Lista", "•", "write.list"),
      command("title", "Título", "T", "write.title"),
      insert("link", "Enlace", "↗", "\\href{#1}{#2}#0"),
      insert("inline", "Fórmula en línea", "ƒ", "$#1$#0"),
      insert("reference", "Referir", "↪", "\\ref{#1}#0"),
      submenu("cite", "Citar", "❞", [
        insert("cite-parentheses", "Entre paréntesis", "( )", "\\citep{#1}#0"),
        insert("cite-narrative", "En la frase", "Aa", "\\citet{#1}#0"),
      ]),
    ] },
    { context: "image", slices: [
      submenu("size", "Tamaño", "↔", [40,60,80,100].map(w => command("width-" + w, w + " %", "↔", "image.width", w))),
      command("caption", "Pie", "T", "write.title"),
      submenu("align", "Alineación", "≡", [
        command("align-left", "Izquierda", "⇤", "image.align", "left"),
        command("align-center", "Centro", "↔", "image.align", "center"),
        command("align-right", "Derecha", "⇥", "image.align", "right"),
      ]),
      command("replace", "Reemplazar", "↺", "image.file"),
      command("delete", "Eliminar", "×", "image.delete"),
    ] },
    { context: "card", slices: ["up", "duplicate", "copy", "copy-text", "down", "move", "delete", "pasteInside"].map(name => ({
      id: "card-" + name, action: "block." + name,
    })) },
    { context: "global", slices: [
      { id: "new", label: "Nuevo bloque", icon: "+", action: { type: "blockTypes",
        ids: ["text","equation","math-inline","definition","theorem","proof","example"] } },
      command("undo", "Deshacer", "↶", "structure.undo"),
      command("redo", "Rehacer", "↷", "structure.redo"),
      submenu("goto", "Ir a…", "↗", [
        command("goto-content", "Contenido", "¶", "navigation.go", "content"),
        command("goto-tree", "Estructura", "≡", "navigation.go", "tree"),
        command("goto-result", "Resultado", "⇣", "navigation.go", "result"),
        command("goto-versions", "Versiones", "◷", "navigation.go", "versions"),
        command("goto-prefs", "Preferencias", "⚙", "navigation.go", "preferences"),
      ]),
      command("prefs", "Ajustes", "⚙", "navigation.preferences"),
    ] },
  ];
})(globalThis.TexNotes);
