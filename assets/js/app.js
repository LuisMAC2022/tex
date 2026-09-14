(function (global) {
  "use strict";
  const {
    METADATA_KEYS, blockLabel, acceptsChildren, generateLatex, downloadTex,
    DRAFT_VERSION, blockAtPath, cloneBlocks, countBlocks, insertBlock, keyToPath,
    moveBlock, normalizeDraft, pathLabel, pathToKey, removeBlock, updateBlock,
    MATH_SYMBOLS, MATH_SYMBOL_GROUPS, filterMathSymbols, symbolAccessibleName, symbolsByGroup, insertIntoField,
  } = global.TexNotes;

  // El borrador v1 era una lista plana. Se sigue leyendo para migrarlo; lo que
  // se guarda a partir de ahora es el árbol de la v2.
  const STORAGE_KEY = "tex-notes:draft:v2";
  const LEGACY_STORAGE_KEY = "tex-notes:draft:v1";
  const $ = (selector) => document.querySelector(selector);
  const form = $("#document-form");
  const blockList = $("#block-list");
  const output = $("#latex-output");
  const status = $("#app-status");
  let blocks = [];

  function metadata() {
    return Object.fromEntries(METADATA_KEYS.map((name) => [name, form.elements[name].value]));
  }
  function state() { return { metadata: metadata(), blocks: cloneBlocks(blocks) }; }
  function announce(message) { status.textContent = message; }
  function setMetadata(values = {}) {
    for (const name of METADATA_KEYS) form.elements[name].value = typeof values[name] === "string" ? values[name] : "";
  }

  /* --- Nombres de cada nodo, compartidos por la vista y por los anuncios --- */

  function describeBlock(block, path) {
    const title = (block.title || "").trim();
    return `${pathLabel(path)} ${blockLabel(block.type)}${title ? `: ${title}` : ""}`;
  }
  function describeLocation(parentPath) {
    const parent = parentPath.length ? blockAtPath(blocks, parentPath) : null;
    return parent ? `dentro de ${describeBlock(parent, parentPath)}, en el nivel ${parentPath.length + 1}` : "al final de la raíz del documento";
  }

  /* --- Editor: a qué nodo apunta el formulario --- */

  function editorTarget() {
    return { editing: keyToPath($("#editing-path").value), parent: keyToPath($("#parent-path").value) };
  }
  function setEditorTarget({ editing = [], parent = [] } = {}) {
    const editingBlock = editing.length ? blockAtPath(blocks, editing) : null;
    // Una ruta que ya no resuelve se descarta: el formulario nunca queda
    // apuntando a un nodo inexistente tras un borrado o un movimiento.
    const parentPath = !editingBlock && parent.length && blockAtPath(blocks, parent) ? parent : [];
    $("#editing-path").value = editingBlock ? pathToKey(editing) : "";
    $("#parent-path").value = pathToKey(parentPath);
    if (editingBlock) {
      $("#block-form-heading").textContent = `Editar bloque ${pathLabel(editing)}`;
      $("#block-target").textContent = `Editas ${describeBlock(editingBlock, editing)}. Sus bloques anidados se conservan.`;
      $("#add-block").textContent = "Guardar cambios";
      $("#cancel-edit").textContent = "Cancelar edición";
      $("#cancel-edit").hidden = false;
      return;
    }
    $("#block-form-heading").textContent = "Nuevo bloque";
    $("#block-target").textContent = `El bloque se añadirá ${describeLocation(parentPath)}.`;
    $("#add-block").textContent = "Añadir bloque";
    $("#cancel-edit").textContent = "Añadir en la raíz";
    $("#cancel-edit").hidden = !parentPath.length;
  }
  function clearBlockFields() {
    $("#block-title").value = ""; $("#block-content").value = "";
    $("#block-error").textContent = ""; $("#block-content").removeAttribute("aria-invalid");
  }
  function resetBlockEditor() { clearBlockFields(); setEditorTarget({}); }

  /**
   * Una acción sobre la estructura desplaza las rutas del resto del árbol. En
   * lugar de adivinar a qué nodo apuntaba una edición a medias, se cancela y se
   * dice: nunca se escribe sobre un bloque distinto del que se estaba editando.
   */
  function cancelEditForStructuralChange() {
    if (!editorTarget().editing.length) return "";
    resetBlockEditor();
    return " Se canceló la edición en curso porque cambió la estructura.";
  }

  /* --- Lista anidada --- */

  function actionButton(label, action, path, accessibleName, disabled = false) {
    const button = document.createElement("button");
    button.type = "button"; button.textContent = label;
    button.dataset.action = action; button.dataset.path = pathToKey(path);
    button.disabled = disabled;
    button.setAttribute("aria-label", accessibleName);
    return button;
  }

  function blockItem(block, path, parent, parentPath, siblings) {
    const position = path[path.length - 1];
    const where = parent ? `dentro de ${describeBlock(parent, parentPath)}` : "en la raíz";
    const subject = `${describeBlock(block, path)}, nivel ${path.length}, ${where}`;

    const item = document.createElement("li");
    const article = document.createElement("article");
    const heading = document.createElement("h4");
    heading.textContent = describeBlock(block, path);
    // El nivel y el padre se escriben, no solo se sugieren con la sangría.
    const meta = document.createElement("p");
    meta.className = "block-meta";
    meta.textContent = `Nivel ${path.length} · ${where}`;
    const preview = document.createElement("p");
    preview.className = "block-preview";
    preview.textContent = (block.content || "").trim() || "(Bloque vacío)";
    const actions = document.createElement("menu");
    actions.className = "block-actions";
    actions.setAttribute("aria-label", `Acciones para el bloque ${describeBlock(block, path)}`);
    actions.append(actionButton("Editar", "edit", path, `Editar ${subject}`));
    if (acceptsChildren(block.type)) actions.append(actionButton("Añadir dentro", "child", path, `Añadir un bloque dentro de ${subject}`));
    actions.append(
      actionButton("Eliminar", "delete", path, `Eliminar ${subject}`),
      actionButton("Subir", "up", path, `Subir ${subject}, entre sus hermanos`, position === 0),
      actionButton("Bajar", "down", path, `Bajar ${subject}, entre sus hermanos`, position === siblings - 1),
    );
    article.append(heading, meta, preview, actions);
    item.append(article);

    if (block.children.length) {
      const nested = document.createElement("ol");
      nested.className = "block-children";
      nested.setAttribute("aria-label", `Bloques dentro de ${describeBlock(block, path)}`);
      block.children.forEach((child, index) => nested.append(blockItem(child, [...path, index], block, path, block.children.length)));
      item.append(nested);
    }
    return item;
  }

  function renderBlocks() {
    blockList.replaceChildren();
    $("#empty-blocks").hidden = blocks.length > 0;
    blocks.forEach((block, index) => blockList.append(blockItem(block, [index], null, [], blocks.length)));
  }

  /** Devuelve true si existe y es enfocable; permite encadenar alternativas. */
  function focusAction(action, path) {
    const button = blockList.querySelector(`button[data-action="${action}"][data-path="${pathToKey(path)}"]`);
    if (!button || button.disabled) return false;
    button.focus();
    return true;
  }
  /** Tras eliminar: hermano que ocupa el hueco, anterior, padre o alta de bloque. */
  function focusAfterRemoval(path) {
    const position = path[path.length - 1];
    const parentPath = path.slice(0, -1);
    if (focusAction("edit", path)) return;
    if (position > 0 && focusAction("edit", [...parentPath, position - 1])) return;
    if (parentPath.length && (focusAction("child", parentPath) || focusAction("edit", parentPath))) return;
    $("#add-block").focus();
  }

  function blockError(message) {
    const field = $("#block-content");
    $("#block-error").textContent = message;
    field.setAttribute("aria-invalid", "true");
    field.focus();
    announce(message);
  }
  function validateBlock() {
    const field = $("#block-content");
    if (!field.value.trim()) { blockError("Escribe contenido antes de incorporar el bloque."); return false; }
    $("#block-error").textContent = ""; field.removeAttribute("aria-invalid");
    return true;
  }

  $("#add-block").addEventListener("click", () => {
    if (!validateBlock()) return;
    const draft = { type: $("#block-type").value, title: $("#block-title").value, content: $("#block-content").value, children: [] };
    const { editing, parent } = editorTarget();
    if (editing.length) {
      const next = updateBlock(blocks, editing, draft);
      if (!next) { blockError(`«${blockLabel(draft.type)}» no admite bloques anidados y este bloque ya tiene. Muévelos o elimínalos antes de cambiar el tipo.`); return; }
      blocks = next; resetBlockEditor(); renderBlocks();
      if (!focusAction("edit", editing)) $("#block-type").focus();
      announce(`Bloque ${pathLabel(editing)} actualizado.`);
      return;
    }
    const result = insertBlock(blocks, parent, draft);
    if (!result) { blockError("No se pudo añadir el bloque en esa posición; la lista se actualizó."); renderBlocks(); return; }
    blocks = result.blocks;
    clearBlockFields();
    // El destino se conserva para encadenar varios hijos del mismo padre.
    setEditorTarget({ parent });
    renderBlocks();
    $("#block-type").focus();
    announce(`Bloque ${pathLabel(result.path)} añadido ${parent.length ? `dentro de ${describeBlock(blockAtPath(blocks, parent), parent)}` : "en la raíz"}.`);
  });

  $("#cancel-edit").addEventListener("click", () => {
    const cancelled = editorTarget().editing.length;
    resetBlockEditor(); $("#block-type").focus();
    announce(cancelled ? "Edición cancelada." : "El siguiente bloque se añadirá en la raíz.");
  });

  blockList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const path = keyToPath(button.dataset.path);
    const block = blockAtPath(blocks, path);
    if (!block) { renderBlocks(); $("#add-block").focus(); announce("Ese bloque ya no existe; la lista se actualizó."); return; }
    const action = button.dataset.action;

    if (action === "edit") {
      $("#block-type").value = block.type; $("#block-title").value = block.title; $("#block-content").value = block.content;
      $("#block-error").textContent = ""; $("#block-content").removeAttribute("aria-invalid");
      setEditorTarget({ editing: path }); $("#block-type").focus();
      announce(`Editando ${describeBlock(block, path)}.`);
      return;
    }
    if (action === "child") {
      clearBlockFields(); setEditorTarget({ parent: path }); $("#block-type").focus();
      announce(`El siguiente bloque se añadirá dentro de ${describeBlock(block, path)}, en el nivel ${path.length + 1}.`);
      return;
    }
    if (action === "delete") {
      const nested = countBlocks(block.children);
      if (nested && !confirm(`¿Eliminar ${describeBlock(block, path)} y sus ${nested} ${nested === 1 ? "bloque anidado" : "bloques anidados"}?`)) {
        button.focus(); announce("No se eliminó el bloque."); return;
      }
      const next = removeBlock(blocks, path);
      if (!next) { announce("No se pudo eliminar el bloque."); return; }
      const label = describeBlock(block, path);
      const cancelled = cancelEditForStructuralChange();
      blocks = next; renderBlocks(); setEditorTarget(editorTarget()); focusAfterRemoval(path);
      announce(`Eliminado ${label}${nested ? ` con sus ${nested} bloques anidados` : ""}.${cancelled}`);
      return;
    }

    const result = moveBlock(blocks, path, action === "up" ? -1 : 1);
    if (!result) { button.focus(); announce("El bloque ya está en el extremo de sus hermanos."); return; }
    const cancelled = cancelEditForStructuralChange();
    blocks = result.blocks; renderBlocks(); setEditorTarget(editorTarget());
    // Si el botón usado quedó deshabilitado en el extremo, el foco pasa al
    // movimiento contrario y, si tampoco existe, a la edición del mismo bloque.
    if (!focusAction(action, result.path) && !focusAction(action === "up" ? "down" : "up", result.path)) focusAction("edit", result.path);
    announce(`${describeBlock(block, result.path)} movido a la posición ${result.path[result.path.length - 1] + 1} de su nivel.${cancelled}`);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault(); const title = $("#note-title");
    if (!title.value.trim()) { $("#title-error").textContent = "Escribe un título para generar el documento."; title.setAttribute("aria-invalid", "true"); title.focus(); announce("No se generó el documento: falta el título."); return; }
    $("#title-error").textContent = ""; title.removeAttribute("aria-invalid"); output.value = generateLatex(state()); announce("Documento generado.");
  });
  $("#save-draft").addEventListener("click", () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: DRAFT_VERSION, ...state() })); announce("Borrador guardado únicamente en este dispositivo."); } catch { announce("No se pudo guardar el borrador; el contenido actual se conserva."); } });
  $("#restore-draft").addEventListener("click", () => {
    let draft = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
      draft = normalizeDraft(JSON.parse(raw));
    } catch { draft = null; }
    if (!draft) { $("#restore-draft").focus(); announce("No hay un borrador válido para restaurar."); return; }
    setMetadata(draft.metadata); blocks = draft.blocks; resetBlockEditor(); renderBlocks(); $("#note-title").focus();
    announce(draft.version < DRAFT_VERSION ? "Borrador restaurado y convertido al formato con bloques anidados." : "Borrador restaurado.");
  });
  $("#delete-draft").addEventListener("click", () => {
    if (!confirm("¿Borrar el borrador guardado en este dispositivo?")) { $("#delete-draft").focus(); announce("No se borró el borrador."); return; }
    try { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(LEGACY_STORAGE_KEY); } catch { /* el contenido abierto se conserva igualmente */ }
    $("#save-draft").focus(); announce("Borrador guardado eliminado; el contenido actual se conserva.");
  });
  $("#download-tex").addEventListener("click", () => { if (!output.value) { announce("Genera el documento antes de descargarlo."); $("#generate").focus(); return; } downloadTex(output.value, $("#note-title").value); announce("Descarga del archivo .tex iniciada."); });
  $("#copy-code").addEventListener("click", async () => {
    if (!output.value) { announce("Genera el documento antes de copiarlo."); $("#generate").focus(); return; }
    try { if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(output.value); else { output.focus(); output.select(); if (!document.execCommand("copy")) throw new Error(); } announce("Código LaTeX copiado."); } catch { announce("No se pudo copiar el código; permanece disponible para seleccionarlo manualmente."); }
  });

  /* --- Tablero de símbolos matemáticos --- */

  function symbolButton(symbol) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "symbol-button";
    button.dataset.command = symbol.command;
    button.dataset.symbolId = symbol.id;
    button.setAttribute("aria-label", symbolAccessibleName(symbol));
    const glyph = document.createElement("span"); glyph.className = "symbol-glyph"; glyph.textContent = symbol.symbol;
    const name = document.createElement("span"); name.className = "symbol-name"; name.textContent = symbol.name;
    const command = document.createElement("span"); command.className = "symbol-command"; command.textContent = symbol.command;
    button.append(glyph, name, command);
    return button;
  }

  function renderSymbolBoard() {
    const container = $("#symbol-groups");
    container.replaceChildren();
    for (const group of MATH_SYMBOL_GROUPS) {
      const symbols = symbolsByGroup(group.id);
      if (!symbols.length) continue;
      const section = document.createElement("section");
      section.className = "symbol-group";
      const heading = document.createElement("h4");
      heading.id = `symbol-group-${group.id}`;
      heading.textContent = group.label;
      const list = document.createElement("menu");
      list.className = "symbol-grid";
      list.setAttribute("aria-labelledby", heading.id);
      for (const symbol of symbols) {
        const item = document.createElement("li");
        item.append(symbolButton(symbol));
        list.append(item);
      }
      section.append(heading, list);
      container.append(section);
    }
    applySymbolFilter("");
  }

  function applySymbolFilter(query) {
    const container = $("#symbol-groups");
    const visible = new Set(filterMathSymbols(query).map((symbol) => symbol.id));
    for (const button of container.querySelectorAll("button[data-symbol-id]")) button.closest("li").hidden = !visible.has(button.dataset.symbolId);
    for (const group of container.querySelectorAll(".symbol-group")) group.hidden = !group.querySelector("li:not([hidden])");
    $("#symbol-empty").hidden = visible.size > 0;
    // El recuento solo se escribe tras una búsqueda: así la región activa no anuncia nada al cargar.
    const results = $("#symbol-results");
    if (!query.trim() && !results.textContent) return;
    results.textContent = query.trim()
      ? `${visible.size} ${visible.size === 1 ? "símbolo coincide" : "símbolos coinciden"} con la búsqueda.`
      : `Se muestran los ${MATH_SYMBOLS.length} símbolos del tablero.`;
  }

  $("#symbol-search").addEventListener("input", (event) => applySymbolFilter(event.currentTarget.value));
  $("#symbol-groups").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-command]");
    if (!button) return;
    const symbol = MATH_SYMBOLS.find((candidate) => candidate.id === button.dataset.symbolId);
    insertIntoField($("#block-content"), button.dataset.command);
    announce(`Símbolo insertado en el contenido: ${symbol ? symbol.name : button.dataset.command}.`);
  });

  renderSymbolBoard();
  renderBlocks();
  setEditorTarget({});
})(typeof globalThis !== "undefined" ? globalThis : this);
