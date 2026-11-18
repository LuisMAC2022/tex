(function (global) {
  "use strict";
  const {
    METADATA_KEYS, blockLabel, acceptsChildren, generateLatex, downloadTex,
    DRAFT_VERSION, blockAtPath, cloneBlock, cloneBlocks, countBlocks, duplicateBlock, insertBlock, keyToPath,
    moveBlock, normalizeDraft, pathLabel, pathToKey, removeBlock, updateBlock,
    MATH_SYMBOLS, MATH_SYMBOL_GROUPS, filterMathSymbols, symbolAccessibleName, symbolsByGroup, insertIntoField,
    analyzeContent, normalizeLineBreaks, blockType, SHORTCUTS, shortcutLabel,
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
  const blockItemExtensions = [];
  const previewRenderers = new Map();
  const blockFieldHooks = [];
  const beforeGenerateHooks = [];
  const editorPreviewHooks = [];
  let blocks = [];
  /**
   * Bandeja de copia: un bloque suelto, fuera del árbol, a la espera de que la
   * persona elija dónde pegarlo. Deliberadamente NO es el portapapeles del
   * sistema: ahí va «Copiar texto», que saca el contenido de la aplicación.
   * Tampoco se persiste en el borrador, porque no forma parte del documento.
   */
  let tray = null;
  let previewTimer = null;
  let announcedPreviewFailures = null;

  function katexRender(math, displayMode) {
    try {
      return { ok: true, html: global.katex.renderToString(math, {
        displayMode, throwOnError: true, strict: false, trust: false, output: "htmlAndMathml",
      }) };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : String(error) };
    }
  }

  function fillMathPreview(container, content, blockTypeId, showLiteral = false) {
    const normalized = normalizeLineBreaks(content || "");
    const analysis = analyzeContent(normalized, blockTypeId, katexRender);
    if (!analysis.segments.length) { container.textContent = showLiteral ? normalized : normalized.trim() ? "No hay tramos matemáticos delimitados para previsualizar." : "Escribe contenido para ver aquí sus matemáticas."; return analysis; }
    const fragment = document.createDocumentFragment();
    let cursor = 0;
    for (const segment of analysis.segments) {
      fragment.append(document.createTextNode(normalized.slice(cursor, segment.start)));
      const rendered = document.createElement(segment.displayMode ? "div" : "span");
      rendered.className = segment.ok ? "math-rendered" : "math-preview-failure";
      if (segment.ok) rendered.innerHTML = segment.html;
      else rendered.textContent = `No se pudo previsualizar: ${segment.math || "(tramo vacío)"}. ${segment.message}`;
      fragment.append(rendered);
      cursor = segment.end;
    }
    fragment.append(document.createTextNode(normalized.slice(cursor)));
    container.replaceChildren(fragment);
    return analysis;
  }

  function blockDraft() {
    const type = $("#block-type").value;
    return Object.assign({ type, title: $("#block-title").value, content: $("#block-content").value, children: [] },
      ...blockFieldHooks.map((hook) => hook.read?.(type)));
  }

  function renderBlockPreview(container, block, context) {
    const renderer = previewRenderers.get(blockType(block.type)?.kind);
    if (renderer) return renderer(container, block, context);
    const content = context.structure ? (block.content || "").trim() : block.content;
    const analysis = fillMathPreview(container, content, block.type, context.structure);
    if (context.structure && !content) container.textContent = "(Bloque vacío)";
    return analysis;
  }

  function renderEditorPreview() {
    const block = blockDraft();
    const paths = editorTarget();
    const parentPath = paths.editing.length ? paths.editing.slice(0, -1) : paths.parent;
    const analysis = renderBlockPreview($("#math-preview"), block, { parentPath, structure: false });
    for (const hook of editorPreviewHooks) hook(block, { parentPath });
    const failures = analysis.failures.length;
    if (failures !== announcedPreviewFailures) {
      $("#math-preview-status").textContent = failures
        ? `No se pudo previsualizar ${failures} ${failures === 1 ? "tramo matemático" : "tramos matemáticos"}. Esto no impide generar el documento.`
        : "";
      announcedPreviewFailures = failures;
    }
  }

  function scheduleEditorPreview() {
    global.clearTimeout(previewTimer);
    previewTimer = global.setTimeout(renderEditorPreview, 200);
  }

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
      updateTrayControls();
      return;
    }
    $("#block-form-heading").textContent = "Nuevo bloque";
    $("#block-target").textContent = `El bloque se añadirá ${describeLocation(parentPath)}.`;
    $("#add-block").textContent = "Añadir bloque";
    $("#cancel-edit").textContent = "Añadir en la raíz";
    $("#cancel-edit").hidden = !parentPath.length;
    updateTrayControls();
  }
  function clearBlockFields() {
    $("#block-title").value = ""; $("#block-content").value = "";
    for (const hook of blockFieldHooks) hook.clear?.();
    $("#block-error").textContent = ""; $("#block-content").removeAttribute("aria-invalid");
    renderEditorPreview();
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
    const preview = document.createElement("div");
    preview.className = "block-preview";
    renderBlockPreview(preview, block, { parentPath, structure: true });
    const actions = document.createElement("menu");
    actions.className = "block-actions";
    actions.setAttribute("aria-label", `Acciones para el bloque ${describeBlock(block, path)}`);
    actions.append(
      actionButton("Editar", "edit", path, `Editar ${subject}`),
      // Tres operaciones distintas, con nombres distintos a propósito:
      // duplicar deja la copia aquí mismo; copiar la guarda para elegir destino;
      // copiar texto saca el contenido de la aplicación.
      actionButton("Duplicar", "duplicate", path, `Duplicar ${subject}: la copia queda justo después`),
      actionButton("Copiar bloque", "copy", path, `Copiar ${subject} a la bandeja, para pegarlo donde elijas`),
      actionButton("Copiar texto", "copy-text", path, `Copiar al portapapeles el texto de ${subject}`),
    );
    if (acceptsChildren(block.type)) actions.append(actionButton("Añadir dentro", "child", path, `Añadir un bloque dentro de ${subject}`));
    actions.append(
      actionButton("Eliminar", "delete", path, `Eliminar ${subject}`),
      actionButton("Subir", "up", path, `Subir ${subject}, entre sus hermanos`, position === 0),
      actionButton("Bajar", "down", path, `Bajar ${subject}, entre sus hermanos`, position === siblings - 1),
    );
    article.append(heading, meta, preview, actions);
    for (const extend of blockItemExtensions) extend(block, path, { article, actions, subject });
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

  /* --- Bandeja de copia y portapapeles del sistema --- */

  /** Describe lo que hay en la bandeja, con el tamaño de la rama si la tiene. */
  function trayLabel() {
    if (!tray) return "";
    const nested = countBlocks(tray.block.children);
    const title = (tray.block.title || "").trim();
    return `${blockLabel(tray.block.type)}${title ? `: ${title}` : ""}${nested ? ` con ${nested} ${nested === 1 ? "bloque anidado" : "bloques anidados"}` : ""}`;
  }

  /**
   * «Pegar bloque» solo aparece cuando hay algo que pegar, y dice siempre dónde
   * caerá: reutiliza el mismo destino que «Añadir bloque», el que muestra
   * #block-target, en vez de inventar un gesto de colocación nuevo.
   */
  function updateTrayControls() {
    const paste = $("#paste-block");
    const summary = $("#tray-summary");
    paste.hidden = !tray;
    summary.hidden = !tray;
    if (!tray) { summary.textContent = ""; return; }
    const label = trayLabel();
    summary.textContent = `En la bandeja: ${label}. Se pegará ${describeLocation(editorTarget().parent)}.`;
    paste.setAttribute("aria-label", `Pegar ${label} ${describeLocation(editorTarget().parent)}`);
  }

  /**
   * Copia al portapapeles del sistema. Sin la API moderna —file:// o permiso
   * denegado— se recurre a seleccionar un campo: el de salida cuando existe, o
   * uno temporal fuera de la vista para el texto de un bloque.
   */
  async function copyToClipboard(text, field = null) {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return; }
    const source = field || document.createElement("textarea");
    if (!field) {
      source.value = text;
      source.setAttribute("readonly", "");
      source.setAttribute("aria-hidden", "true");
      source.style.cssText = "position:fixed;top:-1000px;left:-1000px";
      document.body.append(source);
    }
    source.focus(); source.select();
    const copied = document.execCommand("copy");
    if (!field) source.remove();
    if (!copied) throw new Error("No se pudo copiar");
  }

  function blockError(message) {
    const field = $("#block-content");
    $("#block-error").textContent = message;
    field.setAttribute("aria-invalid", "true");
    field.focus();
    announce(message);
  }
  function validateBlock(type) {
    const custom = blockFieldHooks.find((hook) => hook.validate && hook.appliesTo?.(type));
    if (custom) return custom.validate();
    const field = $("#block-content");
    if (!field.value.trim()) { blockError("Escribe contenido antes de incorporar el bloque."); return false; }
    $("#block-error").textContent = ""; field.removeAttribute("aria-invalid");
    return true;
  }

  $("#add-block").addEventListener("click", () => {
    const draft = blockDraft();
    if (!validateBlock(draft.type)) return;
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

  $("#paste-block").addEventListener("click", () => {
    if (!tray) { updateTrayControls(); announce("La bandeja está vacía: copia un bloque antes de pegar."); return; }
    const { parent } = editorTarget();
    // Cada pegado entrega una copia nueva: la bandeja conserva su bloque y dos
    // pegados del mismo origen no comparten objetos.
    const result = insertBlock(blocks, parent, cloneBlock(tray.block));
    if (!result) { renderBlocks(); setEditorTarget(editorTarget()); announce("No se pudo pegar el bloque en ese destino; la lista se actualizó."); return; }
    const label = trayLabel();
    blocks = result.blocks; renderBlocks(); setEditorTarget(editorTarget());
    if (!focusAction("edit", result.path)) $("#add-block").focus();
    announce(`${label} pegado como bloque ${pathLabel(result.path)} ${describeLocation(parent)}. Sigue en la bandeja para pegarlo otra vez.`);
  });

  $("#cancel-edit").addEventListener("click", () => {
    const cancelled = editorTarget().editing.length;
    resetBlockEditor(); $("#block-type").focus();
    announce(cancelled ? "Edición cancelada." : "El siguiente bloque se añadirá en la raíz.");
  });

  blockList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const path = keyToPath(button.dataset.path);
    const block = blockAtPath(blocks, path);
    if (!block) { renderBlocks(); $("#add-block").focus(); announce("Ese bloque ya no existe; la lista se actualizó."); return; }
    const action = button.dataset.action;

    if (action === "edit") {
      $("#block-type").value = block.type; $("#block-title").value = block.title; $("#block-content").value = block.content;
      for (const hook of blockFieldHooks) hook.fill?.(block);
      $("#block-error").textContent = ""; $("#block-content").removeAttribute("aria-invalid");
      setEditorTarget({ editing: path }); $("#block-type").focus();
      renderEditorPreview();
      announce(`Editando ${describeBlock(block, path)}.`);
      return;
    }
    if (action === "child") {
      clearBlockFields(); setEditorTarget({ parent: path }); $("#block-type").focus();
      announce(`El siguiente bloque se añadirá dentro de ${describeBlock(block, path)}, en el nivel ${path.length + 1}.`);
      return;
    }
    if (action === "duplicate") {
      const result = duplicateBlock(blocks, path);
      if (!result) { button.focus(); announce("No se pudo duplicar el bloque."); return; }
      const nested = countBlocks(block.children);
      // La copia se inserta entre hermanos y desplaza las rutas siguientes: una
      // edición a medias se cancela, como en cualquier cambio estructural.
      const cancelled = cancelEditForStructuralChange();
      blocks = result.blocks; renderBlocks(); setEditorTarget(editorTarget());
      if (!focusAction("edit", result.path)) $("#add-block").focus();
      announce(`${describeBlock(block, path)} duplicado como ${describeBlock(block, result.path)}${nested ? `, con sus ${nested} ${nested === 1 ? "bloque anidado" : "bloques anidados"}` : ""}. El original no cambia.${cancelled}`);
      return;
    }
    if (action === "copy") {
      tray = { block: cloneBlock(block) };
      if (!tray.block) { tray = null; button.focus(); announce("No se pudo copiar ese bloque."); return; }
      updateTrayControls();
      button.focus();
      announce(`${describeBlock(block, path)} copiado a la bandeja. Elige dónde pegarlo con «Pegar bloque»; el original se queda donde está.`);
      return;
    }
    if (action === "copy-text") {
      const text = block.content || "";
      if (!text.trim()) { button.focus(); announce("Ese bloque no tiene texto que copiar."); return; }
      try {
        await copyToClipboard(text);
        button.focus(); announce(`Texto de ${describeBlock(block, path)} copiado al portapapeles. Pégalo donde quieras con Ctrl+V.`);
      } catch {
        button.focus(); announce("No se pudo copiar el texto; ábrelo con «Editar» y cópialo desde el campo de contenido.");
      }
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
    $("#title-error").textContent = "";
    title.removeAttribute("aria-invalid");
    const documentState = state();
    for (const hook of beforeGenerateHooks) hook(documentState);
    output.value = generateLatex(documentState);
    announce("Documento generado.");
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
    try { await copyToClipboard(output.value, output); announce("Código LaTeX copiado."); } catch { announce("No se pudo copiar el código; permanece disponible para seleccionarlo manualmente."); }
  });

  /* --- [A] Atajos del tablero --- */

  const {
    adjacentGroup, ariaKeyshortcuts, matchShortcut, recentSymbolIds,
    RECENT_SYMBOL_GROUP, SYMBOL_BOARD_GROUPS, symbolGridTarget,
  } = global.TexNotes;
  const symbolBoard = $(".symbol-board");
  const symbolDetails = $("#symbol-details");
  const symbolSearch = $("#symbol-search");
  const symbolGrid = $("#symbol-groups");
  const categoryPicker = $("#symbol-category-picker");
  const symbolDetail = $("#symbol-detail");
  const symbolDetailPlaceholder = symbolDetail.textContent;
  const blockContent = $("#block-content");
  const blockEditor = blockContent.closest("fieldset");
  const symbolCatalog = new Map(MATH_SYMBOLS.map((symbol) => [symbol.id, symbol]));
  const recentSymbolStorageKey = "tex-notes:recent-symbols";
  let activeSymbolGroup = MATH_SYMBOL_GROUPS[0].id;
  let recentSymbols = [];
  let lastBlockField = blockContent;
  let symbolOrigin;

  try {
    recentSymbols = recentSymbolIds(JSON.parse(global.localStorage.getItem(recentSymbolStorageKey)));
  } catch {
    // El catálogo sigue disponible si el navegador impide leer el historial.
  }

  function symbolButton(symbol) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "symbol-button";
    button.dataset.command = symbol.command;
    button.dataset.symbolId = symbol.id;
    button.tabIndex = -1;
    button.setAttribute("aria-label", symbolAccessibleName(symbol));
    // La longitud del glifo elige su tamaño dentro de una casilla fija.
    button.dataset.glyphLength = String(Math.min([...symbol.symbol].length, 7));
    const glyph = document.createElement("span");
    glyph.className = "symbol-glyph";
    glyph.textContent = symbol.symbol;
    button.append(glyph);
    return button;
  }

  function renderSymbolBoard() {
    for (const group of SYMBOL_BOARD_GROUPS) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "symbol-category";
      button.dataset.groupId = group.id;
      button.textContent = group.label;
      categoryPicker.append(button);
    }
    const shortcut = SHORTCUTS.find(({ id }) => id === "symbols.toggle");
    const isMac = /Mac/.test(global.navigator.userAgentData?.platform || global.navigator.platform || "");
    $("#symbol-shortcut-label").textContent = shortcutLabel(shortcut, isMac);
    for (const field of [blockContent, symbolSearch]) {
      field.setAttribute("aria-keyshortcuts", ariaKeyshortcuts(shortcut));
    }
    applySymbolFilter();
  }

  function symbolCategoryLabel() {
    if (symbolSearch.value.trim()) return "búsqueda";
    return SYMBOL_BOARD_GROUPS.find(({ id }) => id === activeSymbolGroup).label;
  }

  function applySymbolFilter() {
    const query = symbolSearch.value.trim();
    const category = activeSymbolGroup === RECENT_SYMBOL_GROUP.id
      ? recentSymbols.map((id) => symbolCatalog.get(id))
      : symbolsByGroup(activeSymbolGroup);
    const visible = query ? filterMathSymbols(query) : category;
    symbolGrid.replaceChildren(...visible.map((symbol, index) => {
      const item = document.createElement("li");
      item.setAttribute("role", "presentation");
      const button = symbolButton(symbol);
      if (index === 0) button.tabIndex = 0;
      item.append(button);
      return item;
    }));
    symbolGrid.scrollTop = 0;
    for (const button of categoryPicker.children) {
      button.setAttribute("aria-pressed", String(!query && button.dataset.groupId === activeSymbolGroup));
    }
    symbolDetail.textContent = symbolDetailPlaceholder;
    symbolGrid.setAttribute("aria-label", query ? "Resultados de símbolos" : `Símbolos: ${symbolCategoryLabel()}`);
    const empty = $("#symbol-empty");
    empty.hidden = visible.length > 0;
    empty.textContent = query ? "Ningún símbolo coincide con la búsqueda." : "Aún no has insertado símbolos.";
    const results = $("#symbol-results");
    results.hidden = !query || !visible.length;
    results.textContent = `${visible.length} ${visible.length === 1 ? "resultado" : "resultados"}`;
  }

  function announceSymbolCount(instructions = "") {
    const count = symbolGrid.childElementCount;
    announce(`Tablero de símbolos: ${symbolCategoryLabel()}, ${count} ${count === 1 ? "símbolo" : "símbolos"}.${instructions}`);
  }

  function updateSymbolSearch() {
    applySymbolFilter();
    announceSymbolCount();
  }

  function selectSymbolCategory(id) {
    activeSymbolGroup = id;
    symbolSearch.value = "";
    applySymbolFilter();
    categoryPicker.querySelector('[aria-pressed="true"]').scrollIntoView({ block: "nearest", inline: "nearest" });
    announceSymbolCount();
  }

  function captureSymbolOrigin(field) {
    const selection = typeof field.selectionStart === "number"
      ? [field.selectionStart, field.selectionEnd, field.selectionDirection]
      : null;
    return { field, selection };
  }

  function returnToSymbolOrigin() {
    const { field, selection } = symbolOrigin ?? captureSymbolOrigin(lastBlockField);
    symbolOrigin = null;
    field.focus();
    if (selection) field.setSelectionRange(...selection);
  }

  function openSymbolSearch(field) {
    symbolOrigin = field ? captureSymbolOrigin(field) : symbolOrigin ?? captureSymbolOrigin(lastBlockField);
    symbolDetails.open = true;
    symbolSearch.focus();
    symbolSearch.select();
    announceSymbolCount(" Escape vuelve al contenido.");
  }

  function insertSymbol(id) {
    const symbol = symbolCatalog.get(id);
    const { field, selection } = symbolOrigin ?? captureSymbolOrigin(lastBlockField);
    const destination = selection && !field.readOnly ? field : blockContent;
    if (destination === field) destination.setSelectionRange(...selection);
    insertIntoField(destination, symbol.insert || symbol.command);
    symbolOrigin = null;
    if (destination !== field) field.focus();
    if (destination === blockContent) scheduleEditorPreview();

    recentSymbols = recentSymbolIds([id, ...recentSymbols]);
    try {
      global.localStorage.setItem(recentSymbolStorageKey, JSON.stringify(recentSymbols));
    } catch {
      // Los recientes se conservan en memoria mientras la página siga abierta.
    }
    if (activeSymbolGroup === RECENT_SYMBOL_GROUP.id && !symbolSearch.value.trim()) applySymbolFilter();
    announce(`Símbolo insertado: ${symbol.name}.`);
  }

  function focusSymbolAt(index) {
    const button = symbolGrid.children[index]?.firstElementChild;
    if (!button) {
      symbolGrid.focus();
      return;
    }
    symbolGrid.querySelector('[tabindex="0"]')?.setAttribute("tabindex", "-1");
    button.tabIndex = 0;
    button.focus();
  }

  function navigateSymbolGrid(event) {
    const shortcut = matchShortcut(event, "symbol-grid-widget");
    const count = symbolGrid.childElementCount;
    const index = [...symbolGrid.children].indexOf(event.target.closest("li"));
    if (shortcut?.id === "symbols.previousGroup" || shortcut?.id === "symbols.nextGroup") {
      event.preventDefault();
      selectSymbolCategory(adjacentGroup(activeSymbolGroup, shortcut.id === "symbols.previousGroup" ? -1 : 1));
      focusSymbolAt(Math.max(0, Math.min(index, symbolGrid.childElementCount - 1)));
      return;
    }

    const unmodified = !(event.altKey || event.ctrlKey || event.metaKey || event.shiftKey);
    if (unmodified && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      if (index < 0 && shortcut?.id !== "symbols.search") return;
      const columns = Math.max(1, getComputedStyle(symbolGrid).gridTemplateColumns.split(" ").filter(Boolean).length);
      const next = symbolGridTarget({ index, count, columns, key: event.key });
      if (next === null) symbolSearch.focus();
      else focusSymbolAt(next);
      return;
    }

    const canType = event.getModifierState("AltGraph") || !(event.altKey || event.ctrlKey || event.metaKey);
    if (canType && event.key !== " " && [...event.key].length === 1) {
      event.preventDefault();
      symbolSearch.focus();
      symbolSearch.value += event.key;
      updateSymbolSearch();
    }
  }

  function navigateSymbolSearch(event) {
    const first = symbolGrid.firstElementChild?.firstElementChild;
    if (matchShortcut(event, "symbol-search-widget")?.id === "symbols.firstResult") {
      event.preventDefault();
      if (first) focusSymbolAt(0);
    } else if (event.key === "Enter" && !(event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)) {
      event.preventDefault();
      if (first) insertSymbol(first.dataset.symbolId);
    }
  }

  blockEditor.addEventListener("focusin", (event) => {
    if (symbolBoard.contains(event.target)) {
      symbolOrigin ??= captureSymbolOrigin(lastBlockField);
      return;
    }
    symbolOrigin = null;
    if (event.target.matches("input, select, textarea")) lastBlockField = event.target;
  });

  symbolBoard.addEventListener("focusout", (event) => {
    if (event.relatedTarget && !symbolBoard.contains(event.relatedTarget)) symbolOrigin = null;
  });

  blockEditor.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.isComposing || symbolBoard.hidden) return;
    const inBoard = symbolBoard.contains(event.target);
    if ((inBoard || event.target.matches("input, select, textarea"))
        && matchShortcut(event, "block-editor")?.id === "symbols.toggle") {
      event.preventDefault();
      if (event.repeat) return;
      if (inBoard) returnToSymbolOrigin();
      else openSymbolSearch(event.target);
      return;
    }
    if (!inBoard) return;
    if (matchShortcut(event, "symbol-widget")?.id === "symbols.escape") {
      event.preventDefault();
      if (event.target === symbolSearch && symbolSearch.value) {
        symbolSearch.value = "";
        updateSymbolSearch();
      } else {
        returnToSymbolOrigin();
      }
    } else if (event.target === symbolSearch) {
      navigateSymbolSearch(event);
    } else if (symbolGrid.contains(event.target)) {
      navigateSymbolGrid(event);
    }
  });

  $("#symbol-toggle").addEventListener("click", () => openSymbolSearch());
  symbolSearch.addEventListener("input", updateSymbolSearch);
  categoryPicker.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-group-id]");
    if (button) selectSymbolCategory(button.dataset.groupId);
  });
  function updateSymbolDetail(event) {
    const button = event.target.closest("button[data-symbol-id]");
    if (!button) return;
    const symbol = symbolCatalog.get(button.dataset.symbolId);
    symbolDetail.textContent = `${symbol.name} — ${symbol.command}`;
  }
  symbolGrid.addEventListener("mouseover", updateSymbolDetail);
  symbolGrid.addEventListener("focusin", updateSymbolDetail);
  symbolGrid.addEventListener("mouseleave", () => {
    if (!symbolGrid.contains(document.activeElement)) symbolDetail.textContent = symbolDetailPlaceholder;
  });
  symbolGrid.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-symbol-id]");
    if (button) insertSymbol(button.dataset.symbolId);
  });

  /* --- fin [A] --- */

  /* --- [B] Imagen --- */
  const imageFields = $("#image-fields");
  const imagePath = $("#image-path");
  const imageFile = $("#image-file");
  const imageWidth = $("#image-width");
  const imageHeight = $("#image-height");
  const imageAngle = $("#image-angle");
  const imagePlacement = $("#image-placement");
  const imageLabel = $("#image-label");
  const imageError = $("#image-error");
  const imageWarnings = $("#image-warnings");
  const imagePreviews = new Map();
  const { normalizeImageOptions, imagePathWarnings } = global.TexNotes;
  const imageType = (id) => blockType(id)?.kind === "image";
  const previewTitle = $(".math-preview-panel > summary");
  const previewHelp = $(".math-preview-panel > p");
  const originalPreviewTitle = previewTitle.textContent;
  const originalTitleDescription = $("#block-title").getAttribute("aria-describedby");

  function showImagePathFeedback(message = "") {
    if (message) imagePath.setAttribute("aria-invalid", "true");
    else imagePath.removeAttribute("aria-invalid");
    imageError.textContent = message;
    imageError.hidden = !message;
    imageWarnings.textContent = imagePathWarnings(imagePath.value).join(" ");
    imageWarnings.hidden = !imageWarnings.textContent;
  }

  function updateImageWidth() {
    const text = `${imageWidth.value} %`;
    $("#image-width-value").textContent = text;
    imageWidth.setAttribute("aria-valuetext", text);
    return text;
  }

  function syncImageFields() {
    const active = imageType($("#block-type").value);
    imageFields.hidden = !active;
    $("#block-content").closest(".field").hidden = active;
    $(".symbol-board").hidden = active;
    if (active) previewTitle.textContent = "Vista previa de la imagen";
    else previewTitle.textContent = originalPreviewTitle;
    previewHelp.hidden = active;
    if (active) $("#block-title").setAttribute("aria-describedby", "image-caption-help");
    else if (originalTitleDescription) $("#block-title").setAttribute("aria-describedby", originalTitleDescription);
    else $("#block-title").removeAttribute("aria-describedby");
    showImagePathFeedback();
  }

  function fillImageFields(block = {}) {
    const { width, height, angle, align, placement, label } = normalizeImageOptions(block.options);
    imagePath.value = imageType(block.type) ? block.content.trim() : "";
    imageFile.value = "";
    imageWidth.value = Math.round(width * 100);
    imageHeight.value = height ?? "";
    imageAngle.value = angle;
    imageFields.querySelector(`input[name="imageAlign"][value="${align}"]`).checked = true;
    imagePlacement.value = placement;
    imageLabel.value = label ?? "";
    updateImageWidth();
    syncImageFields();
  }

  blockFieldHooks.push({
    appliesTo: imageType,
    read(type) {
      if (!imageType(type)) return;
      return {
        content: imagePath.value.trim(),
        options: normalizeImageOptions({
          width: Number(imageWidth.value) / 100,
          height: imageHeight.value,
          angle: imageAngle.value,
          align: imageFields.querySelector('input[name="imageAlign"]:checked')?.value,
          placement: imagePlacement.value,
          label: imageLabel.value,
        }),
      };
    },
    fill: fillImageFields,
    clear: fillImageFields,
    validate() {
      const { editing } = editorTarget();
      let message = "";
      if (!imagePath.value.trim()) message = "Escribe la ruta del archivo de imagen.";
      else if (blockAtPath(blocks, editing)?.children.length) {
        message = "«Imagen» no admite bloques anidados y este bloque ya tiene. Muévelos o elimínalos antes de cambiar el tipo.";
      }
      showImagePathFeedback(message);
      if (message) {
        imagePath.focus();
        announce(message);
      }
      return !message;
    },
  });

  blockItemExtensions.push((block, path, { article }) => {
    if (!imageType(block.type)) return;
    const { width, angle } = normalizeImageOptions(block.options);
    const summary = document.createElement("p");
    summary.className = "image-summary";
    summary.textContent = `${block.content.trim()} · ${Math.round(width * 100)} % · ${angle}°`;
    article.querySelector(".block-preview").append(summary);
  });

  previewRenderers.set("image", (container, block, { structure }) => {
    const path = block.content.trim();
    const preview = imagePreviews.get(path);
    const fallback = structure ? "" : path || "Escribe la ruta o elige un archivo de imagen.";
    container.textContent = fallback;
    if (preview) {
      if (preview.pdf) {
        const pdf = document.createElement("object");
        pdf.className = "image-thumbnail";
        pdf.type = "application/pdf";
        pdf.data = `${preview.url}#toolbar=0&navpanes=0&page=1`;
        pdf.setAttribute("aria-label", `Vista previa de ${path}`);
        pdf.tabIndex = -1;
        pdf.textContent = fallback;
        container.replaceChildren(pdf);
      } else {
        const image = document.createElement("img");
        image.className = "image-thumbnail";
        image.alt = `Miniatura de ${path}`;
        image.addEventListener("error", () => { if (image.parentNode === container) image.replaceWith(fallback); }, { once: true });
        image.src = preview.url;
        container.replaceChildren(image);
      }
    }
    return { failures: [] };
  });

  $("#block-type").addEventListener("change", syncImageFields);
  imageFields.addEventListener("input", (event) => {
    if (event.target === imagePath) showImagePathFeedback();
    if (event.target === imageWidth) updateImageWidth();
    scheduleEditorPreview();
  });
  imageFields.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-image-width]");
    if (!button) return;
    imageWidth.value = button.dataset.imageWidth;
    announce(`Ancho de la imagen: ${updateImageWidth()}.`);
    renderEditorPreview();
  });
  $("#image-turn").addEventListener("click", () => {
    const { angle } = normalizeImageOptions({ angle: imageAngle.value });
    imageAngle.value = Number((angle + 90 > 360 ? angle - 270 : angle + 90).toFixed(2));
    announce(`Ángulo de giro: ${imageAngle.value}°.`);
    renderEditorPreview();
  });
  imageFile.addEventListener("change", () => {
    const file = imageFile.files[0];
    if (!file) return;
    imagePath.value = file.name;
    const path = file.name.trim();
    const previous = imagePreviews.get(path);
    const url = global.URL.createObjectURL(file);
    imagePreviews.set(path, { url, pdf: file.type === "application/pdf" || /\.pdf$/i.test(path) });
    if (previous) global.URL.revokeObjectURL(previous.url);
    showImagePathFeedback();
    renderEditorPreview();
    renderBlocks();
    announce(`Archivo elegido: ${file.name}. Sube este archivo a Overleaf con el mismo nombre.`);
  });
  /* --- fin [B] --- */

  /* --- [C] Listas --- */

  const {
    ariaKeyshortcuts: listAriaKeyshortcuts, matchShortcut: matchListShortcut,
    parseListOutline, limitListOutline, listDepthWithEnvironment, listOutlineDepthContext,
    shiftLines, continueListLine,
  } = global.TexNotes;
  const listContent = $("#block-content");
  const listLimit = $("#list-limit");
  const listShortcuts = SHORTCUTS.filter(({ scope }) => scope === "list-editor");
  const listKeyNames = listShortcuts.map(listAriaKeyshortcuts);

  function listDepthForPath(parentPath) {
    let depth;
    let siblings = blocks;
    for (const index of parentPath) {
      const ancestor = siblings[index];
      if (!ancestor) break;
      const type = blockType(ancestor.type);
      if (type?.kind === "theorem") depth = listDepthWithEnvironment(depth, type.environment);
      if (type?.kind === "list") {
        depth = listOutlineDepthContext(parseListOutline(ancestor.content, type.listEnvironment), depth);
      }
      siblings = ancestor.children;
    }
    return depth;
  }

  function showListLimit(message) {
    if (listLimit.textContent === message) return;
    listLimit.hidden = !message;
    listLimit.textContent = message;
    if (message) announce(message);
  }

  previewRenderers.set("list", (container, block, { parentPath, structure }) => {
    const parsed = parseListOutline(block.content, blockType(block.type).listEnvironment);
    const { tree, limited } = limitListOutline(parsed, listDepthForPath(parentPath));
    const analysis = { segments: [], failures: [] };
    function fillItem(item, content) {
      const formulae = fillMathPreview(item, content, block.type, true);
      for (const segment of formulae.segments) analysis.segments.push(segment);
      for (const failure of formulae.failures) analysis.failures.push(failure);
    }
    function elementForList(list) {
      const element = document.createElement(list.type === "enumerate" ? "ol" : "ul");
      element.className = "outline-preview";
      for (const { content, children } of list.items) {
        const item = document.createElement("li");
        fillItem(item, content);
        if (children) item.append(elementForList(children));
        element.append(item);
      }
      return element;
    }
    container.replaceChildren();
    if (tree.type) container.append(elementForList(tree));
    else if (tree.items.length) {
      for (const { content } of tree.items) {
        if (!content) continue;
        const paragraph = document.createElement("p");
        fillItem(paragraph, content);
        container.append(paragraph);
      }
    } else container.textContent = structure ? "(Bloque vacío)" : "Escribe un elemento para ver aquí la lista.";

    const warning = !limited ? "" : tree.type
      ? "Se alcanzó el límite de anidación. Los elementos más profundos quedan en el último nivel disponible."
      : "Se alcanzó el límite de anidación. Los elementos de este bloque se emitirán como párrafos.";
    if (!structure) showListLimit(warning);
    else if (warning) {
      const message = document.createElement("p");
      message.className = "list-preview-warning";
      message.textContent = warning;
      container.append(message);
    }
    return analysis;
  });

  function updateListFieldAttribute(attribute, listValues, visibleValues) {
    const current = listContent.getAttribute(attribute) || "";
    const otherValues = current.split(/\s+/).filter((value) => value && !listValues.includes(value));
    const next = [...otherValues, ...visibleValues].join(" ");
    if (current === next) return;
    if (next) listContent.setAttribute(attribute, next);
    else listContent.removeAttribute(attribute);
  }

  editorPreviewHooks.push((block) => {
    const isList = blockType(block.type)?.kind === "list";
    $("#list-tools").hidden = !isList;
    $("#list-help").hidden = !isList;
    if (!isList) showListLimit("");
    const descriptions = isList ? ["list-help", ...(listLimit.hidden ? [] : ["list-limit"])] : [];
    updateListFieldAttribute("aria-describedby", ["list-help", "list-limit"], descriptions);
    updateListFieldAttribute("aria-keyshortcuts", listKeyNames, isList ? listKeyNames : []);
  });

  function applyListEdit(edit, direction) {
    if (listContent.value !== edit.value) listContent.value = edit.value;
    listContent.focus();
    listContent.setSelectionRange(edit.selectionStart, edit.selectionEnd, direction);
    scheduleEditorPreview();
  }

  function shiftListSelection(delta) {
    const edit = shiftLines(listContent, delta);
    const changed = edit.value !== listContent.value;
    applyListEdit(edit, listContent.selectionDirection);
    if (delta > 0) announce("Se añadió sangría.");
    else announce(changed ? "Se quitó sangría." : "No hay sangría que quitar.");
  }

  const listIsMac = /Mac/.test(global.navigator.userAgentData?.platform || global.navigator.platform || "");
  for (const shortcut of listShortcuts) {
    const indent = shortcut.id === "list.indent";
    const button = $(indent ? "#list-indent" : "#list-outdent");
    button.setAttribute("aria-keyshortcuts", listAriaKeyshortcuts(shortcut));
    button.title = shortcutLabel(shortcut, listIsMac);
    button.addEventListener("click", () => shiftListSelection(indent ? 1 : -1));
    button.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      listContent.focus();
    });
  }

  listContent.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.isComposing || blockType($("#block-type").value)?.kind !== "list") return;
    const shortcut = matchListShortcut(event, "list-editor");
    if (shortcut) {
      event.preventDefault();
      shiftListSelection(shortcut.id === "list.indent" ? 1 : -1);
    } else if (event.key === "Enter" && !(event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)) {
      event.preventDefault();
      applyListEdit(continueListLine(listContent));
    }
  });

  /* --- fin [C] --- */

  /* --- [D] Comprobación --- */
  const { checkBlock, checkDocument } = global.TexNotes;
  const editorContentCheck = $("#editor-content-check");
  const resultContentCheck = $("#result-content-check");
  const contentCheckSummary = $("#content-check-summary");
  const contentCheckBlocks = $("#content-check-blocks");
  let badgedBlocks = null;
  let issuesByPath;
  let generatedBlocks = null;

  function issueCount(count) { return `${count} ${count === 1 ? "aviso" : "avisos"}`; }
  function issueText({ severity, line, column, message }) {
    return `${severity === "error" ? "Error" : "Aviso"} en línea ${line}, columna ${column}. ${message}`;
  }
  function editButtonId(path) { return `content-check-edit-${pathToKey(path)}`; }

  editorPreviewHooks.push((block, { parentPath }) => {
    const savedBlock = blockAtPath(blocks, editorTarget().editing);
    const issues = checkBlock({ ...block, children: savedBlock?.children }, blocks, parentPath);
    editorContentCheck.textContent = issues.map(issueText).join("\n");
    editorContentCheck.hidden = !issues.length;
  });

  blockItemExtensions.push((block, path, { article, actions }) => {
    const editButton = actions.querySelector('[data-action="edit"]');
    editButton.id = editButtonId(path);
    if (badgedBlocks !== blocks) {
      issuesByPath = new Map(checkDocument({ blocks }).map(({ path: issuePath, issues }) => [pathToKey(issuePath), issues.length]));
      badgedBlocks = blocks;
    }
    const count = issuesByPath.get(pathToKey(path));
    if (!count) return;
    const badge = document.createElement("p");
    badge.className = "block-warning-count";
    badge.textContent = issueCount(count);
    article.insertBefore(badge, actions);
  });

  beforeGenerateHooks.push((documentState) => {
    const checked = checkDocument(documentState);
    const total = checked.reduce((count, { issues }) => count + issues.length, 0);
    generatedBlocks = blocks;
    contentCheckSummary.textContent = total
      ? `Se encontraron ${issueCount(total)} en ${checked.length} ${checked.length === 1 ? "bloque" : "bloques"}.`
      : "No se encontraron avisos.";
    contentCheckBlocks.replaceChildren();
    contentCheckBlocks.hidden = !total;
    for (const { path, issues } of checked) {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.className = "content-check-link";
      link.href = `#${editButtonId(path)}`;
      link.textContent = `Ir al bloque ${pathLabel(path)}`;
      link.addEventListener("click", (event) => {
        event.preventDefault();
        if (generatedBlocks === blocks) focusAction("edit", path);
      });
      const details = document.createElement("ul");
      for (const issue of issues) {
        const detail = document.createElement("li");
        detail.textContent = issueText(issue);
        details.append(detail);
      }
      item.append(link, details);
      contentCheckBlocks.append(item);
    }
    resultContentCheck.hidden = false;
    if (total) global.queueMicrotask(() => announce(`Documento generado. Se encontraron ${issueCount(total)}.`));
  });

  // Las rutas del resumen solo identifican el árbol con el que se generó.
  new global.MutationObserver(() => {
    if (generatedBlocks && generatedBlocks !== blocks) {
      resultContentCheck.hidden = true;
      generatedBlocks = null;
    }
  }).observe(blockList, { childList: true });
  /* --- fin [D] --- */

  /* --- [E] Mover --- */
  const { flattenBlocks, moveBlockTo } = global.TexNotes;
  const moveDialog = $("#move-block-dialog");
  const moveDestination = $("#move-block-destination");
  const movePosition = $("#move-block-position");
  let movingPath = [];

  blockItemExtensions.push((_block, path, { actions, subject }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Mover a…";
    button.setAttribute("aria-label", `Mover a… · Bloque ${subject}`);
    button.setAttribute("aria-haspopup", "dialog");
    button.addEventListener("click", () => {
      movingPath = path;
      const sourceKey = pathToKey(path);
      const options = [moveDestination.options[0]];
      for (const { block, path: parentPath } of flattenBlocks(blocks)) {
        const key = pathToKey(parentPath);
        if (!acceptsChildren(block.type) || key === sourceKey || key.startsWith(`${sourceKey}.`)) continue;
        options.push(new Option(describeBlock(block, parentPath), key));
      }
      $("#move-block-subject").textContent = `Bloque ${subject}`;
      moveDestination.replaceChildren(...options);
      moveDestination.value = pathToKey(path.slice(0, -1));
      movePosition.value = "end";
      button.focus();
      moveDialog.showModal();
    });
    actions.append(button);
  });

  $("#move-block-cancel").addEventListener("click", () => moveDialog.close());
  $("#move-block-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const position = movePosition.value === "start" ? 0 : undefined;
    const result = moveBlockTo(blocks, movingPath, keyToPath(moveDestination.value), position);
    moveDialog.close();
    if (!result) {
      announce("No se pudo mover el bloque a ese destino.");
      return;
    }

    const previous = editorTarget();
    const cancelled = cancelEditForStructuralChange();
    blocks = result.blocks;
    renderBlocks();
    setEditorTarget({});
    focusAction("edit", result.path);
    const targetReset = previous.parent.length ? " El siguiente bloque se añadirá en la raíz." : "";
    announce(`Bloque movido de ${pathLabel(movingPath)} a ${pathLabel(result.path)}.${cancelled}${targetReset}`);
  });
  /* --- fin [E] --- */

  function renderShortcutPanel() {
    const isMac = /Mac/.test(global.navigator.userAgentData?.platform || global.navigator.platform || "");
    const items = SHORTCUTS.map((shortcut) => {
      const item = document.createElement("li");
      const keys = document.createElement("kbd");
      keys.textContent = shortcutLabel(shortcut, isMac);
      item.append(keys, ` · ${shortcut.label}`);
      return item;
    });
    $("#keyboard-shortcuts").replaceChildren(...items);
  }

  $("#block-content").addEventListener("input", scheduleEditorPreview);
  $("#block-type").addEventListener("change", renderEditorPreview);

  renderShortcutPanel();
  renderSymbolBoard();
  renderBlocks();
  setEditorTarget({});
  renderEditorPreview();
})(typeof globalThis !== "undefined" ? globalThis : this);
