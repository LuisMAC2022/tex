/** Disposición estable. Los catálogos de símbolos y tipos conservan sus propios rótulos. */
(function (T) {
  "use strict";
  const insert = (id, label, icon, snippet) => ({ id, label, icon, action: { type: "insert", snippet } });
  const command = (id, label, icon, name, ...args) => ({ id, label, icon, action: { type: "command", name, args } });
  const submenu = (id, label, icon, slices) => ({ id, label, icon, action: { type: "submenu", slices } });
  T.RADIAL_COMMANDS = ["insertList", "focusTitle", "openSymbols", "setImageWidth", "setImageAlign", "chooseImageFile",
    "deleteBlock", "selectType", "focusType", "undo", "redo", "goTo", "openPreferences"];
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
        command("greek-more", "Más…", "…", "openSymbols", "greek-lower"),
      ]),
    ] },
    { context: "text", slices: [
      insert("bold", "Negrita", "N", "\\textbf{#1}#0"),
      insert("italic", "Cursiva", "C", "\\textit{#1}#0"),
      command("list", "Lista", "•", "insertList"),
      command("title", "Título", "T", "focusTitle"),
      insert("link", "Enlace", "↗", "\\href{#1}{#2}#0"),
      insert("inline", "Fórmula en línea", "ƒ", "$#1$#0"),
      insert("reference", "Referir", "↪", "\\ref{#1}#0"),
      submenu("cite", "Citar", "❞", [
        insert("cite-parentheses", "Entre paréntesis", "( )", "\\citep{#1}#0"),
        insert("cite-narrative", "En la frase", "Aa", "\\citet{#1}#0"),
      ]),
    ] },
    { context: "image", slices: [
      submenu("size", "Tamaño", "↔", [40,60,80,100].map(w => command("width-" + w, w + " %", "↔", "setImageWidth", w))),
      command("caption", "Pie", "T", "focusTitle"),
      submenu("align", "Alineación", "≡", [
        command("align-left", "Izquierda", "⇤", "setImageAlign", "left"),
        command("align-center", "Centro", "↔", "setImageAlign", "center"),
        command("align-right", "Derecha", "⇥", "setImageAlign", "right"),
      ]),
      command("replace", "Reemplazar", "↺", "chooseImageFile"),
      command("delete", "Eliminar", "×", "deleteBlock"),
    ] },
    { context: "global", slices: [
      { id: "new", label: "Nuevo bloque", icon: "+", action: { type: "blockTypes",
        ids: ["text","equation","math-inline","definition","theorem","proof","example"] } },
      command("undo", "Deshacer", "↶", "undo"),
      command("redo", "Rehacer", "↷", "redo"),
      submenu("goto", "Ir a…", "↗", [
        command("goto-content", "Contenido", "¶", "goTo", "content"),
        command("goto-tree", "Estructura", "≡", "goTo", "tree"),
        command("goto-result", "Resultado", "⇣", "goTo", "result"),
        command("goto-versions", "Versiones", "◷", "goTo", "versions"),
        command("goto-prefs", "Preferencias", "⚙", "goTo", "preferences"),
      ]),
      command("prefs", "Ajustes", "⚙", "openPreferences"),
    ] },
  ];
})(globalThis.TexNotes);
