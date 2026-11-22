(function (global) {
  "use strict";
  const {
    METADATA_KEYS, blockLabel, acceptsChildren, generateLatex, downloadTex,
    DRAFT_VERSION, blockAtPath, cloneBlock, cloneBlocks, countBlocks, duplicateBlock, insertBlock, keyToPath,
    moveBlock, normalizeDraft, pathLabel, pathToKey, removeBlock, updateBlock,
    MATH_SYMBOLS, MATH_SYMBOL_GROUPS, filterMathSymbols, symbolAccessibleName, symbolsByGroup, insertIntoField,
    analyzeContent, normalizeLineBreaks, blockType, SHORTCUTS, shortcutLabel,
  } = global.TexNotes;

  // Estas dos claves identifican los borradores anteriores que se migran a Versiones.
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
  const ACTIVE_DOCUMENT_KEY = "tex-notes:active-document";
  let documentId = global.TexNotes.newId("d");
  try {
    const saved = localStorage.getItem(ACTIVE_DOCUMENT_KEY) || JSON.parse(localStorage.getItem("tex-notes:autosave:v1"))?.documentId;
    if (global.TexNotes.validDocumentId(saved)) documentId = saved;
  } catch { /* Es posible editar sin almacenamiento. */ }
  let history = { past: [], future: [] }, committedMetadata, generatedSnapshot = null, lastChangedId = null;
  let blocks = [];
  let macros = [];
  let previewVersion = 0;
  const structurePreviewCache = new Map();
  /**
   * Bandeja de copia: un bloque suelto, fuera del árbol, a la espera de que la
   * persona elija dónde pegarlo. Deliberadamente NO es el portapapeles del
   * sistema: ahí va «Copiar texto», que saca el contenido de la aplicación.
   * Tampoco se persiste en el borrador, porque no forma parte del documento.
   */
  let tray = null;
  let previewTimer = null;
  let announcedPreviewFailures = null;

  function katexRender(math, displayMode, macroList = macros) {
    try {
      return { ok: true, html: global.katex.renderToString(global.TexNotes.macroPreviewDefinitions(macroList) + math, {
        macros: global.TexNotes.katexMacros(macroList),
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
    const cacheable = context.structure && blockType(block.type)?.kind !== "image";
    const depthKey = listDepthForPath(context.parentPath);
    const key = JSON.stringify([block.type, block.listFormat, block.content, depthKey, previewVersion]);
    const cached = cacheable && structurePreviewCache.get(key);
    if (cached) { container.replaceChildren(cached.node.cloneNode(true)); return cached.analysis; }
    const renderer = previewRenderers.get(blockType(block.type)?.kind);
    const content = context.structure ? (block.content || "").trim() : block.content;
    const analysis = renderer ? renderer(container, block, context) : fillMathPreview(container, content, block.type, context.structure);
    if (!renderer && context.structure && !content) container.textContent = "(Bloque vacío)";
    if (cacheable) {
      const node = document.createDocumentFragment();
      for (const child of container.childNodes) node.append(child.cloneNode(true));
      if (structurePreviewCache.size >= 1000) structurePreviewCache.clear();
      structurePreviewCache.set(key, { node, analysis });
    }
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
  function state() { return { documentId, metadata: metadata(), blocks: cloneBlocks(blocks), macros: macros.map(m => ({ ...m })) }; }
  function announce(message) { status.textContent = message; }
  function setMetadata(values = {}) {
    for (const name of METADATA_KEYS) form.elements[name].value = typeof values[name] === "string" ? values[name] : "";
    committedMetadata = metadata();
    syncMetadataSummary(true);
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
    const templateCancelled = cancelTemplateForStructuralChange();
    if (!editorTarget().editing.length) return templateCancelled;
    resetBlockEditor();
    return " Se canceló la edición en curso porque cambió la estructura." + templateCancelled;
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
    article.dataset.path = pathToKey(path);
    article.dataset.blockId = block.id;
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
    actions.append(actionButton("Editar", "edit", path, `Editar ${subject}`));
    if (acceptsChildren(block.type)) actions.append(actionButton("Añadir dentro", "child", path, `Añadir un bloque dentro de ${subject}`));
    const disclosure = document.createElement("details"), summary = document.createElement("summary"), more = document.createElement("div");
    disclosure.className = "block-more"; summary.textContent = "Más acciones"; summary.setAttribute("aria-label", `Más acciones para ${subject}`); more.className = "block-more-actions";
    const menuButton = actionButton("Menú del bloque", "context", path, "Menú de " + subject);
    menuButton.setAttribute("aria-haspopup", "menu");
    more.append(menuButton,
      actionButton("Duplicar", "duplicate", path, `Duplicar ${subject}: la copia queda justo después`),
      actionButton("Copiar bloque", "copy", path, `Copiar ${subject} a la bandeja, para pegarlo donde elijas`),
      actionButton("Copiar texto", "copy-text", path, `Copiar al portapapeles el texto de ${subject}`),
      actionButton("Eliminar", "delete", path, `Eliminar ${subject}`),
      actionButton("Subir", "up", path, `Subir ${subject}, entre sus hermanos`, position === 0),
      actionButton("Bajar", "down", path, `Bajar ${subject}, entre sus hermanos`, position === siblings - 1),
    );
    disclosure.append(summary, more); actions.append(disclosure);
    article.append(heading, meta, preview, actions);
    for (const extend of blockItemExtensions) extend(block, path, { article, actions, more, subject });
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
    saveSession();
  }

  /** Devuelve true si existe y es enfocable; permite encadenar alternativas. */
  function focusAction(action, path) {
    const button = blockList.querySelector(`button[data-action="${action}"][data-path="${pathToKey(path)}"]`);
    if (!button || button.disabled) return false;
    let disclosure = button.closest("details");
    while (disclosure) { disclosure.open = true; disclosure = disclosure.parentElement.closest("details"); }
    button.focus();
    return document.activeElement === button || (action !== "edit" && focusAction("edit", path));
  }
  function focusById(action, id) {
    const path = global.TexNotes.pathOfId(blocks, id);
    return path !== null && focusAction(action, path);
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

  function commitBlock(keepFieldFocus = false) {
    const draft = blockDraft();
    if (!validateBlock(draft.type)) return;
    const { editing, parent } = editorTarget();
    if (editing.length) {
      const next = updateBlock(blocks, editing, draft);
      if (!next) { blockError(`«${blockLabel(draft.type)}» no admite bloques anidados y este bloque ya tiene. Muévelos o elimínalos antes de cambiar el tipo.`); return; }
      changeTree(next, blockAtPath(next, editing).id); resetBlockEditor(); renderBlocks();
      if (keepFieldFocus) focusBlockContent();
      else if (!focusById("edit", blockAtPath(next, editing).id)) $("#block-type").focus();
      announce(`Bloque ${pathLabel(editing)} actualizado.`);
      return;
    }
    const result = insertBlock(blocks, parent, draft);
    if (!result) { blockError("No se pudo añadir el bloque en esa posición; la lista se actualizó."); renderBlocks(); return; }
    changeTree(result.blocks, result.id);
    clearBlockFields();
    // El destino se conserva para encadenar varios hijos del mismo padre.
    setEditorTarget({ parent });
    renderBlocks();
    focusBlockContent();
    const templateMessage = commitTemplateStep(result.path);
    announce(`Bloque ${pathLabel(result.path)} añadido ${parent.length ? `dentro de ${describeBlock(blockAtPath(blocks, parent), parent)}` : "en la raíz"}.${templateMessage ? ` ${templateMessage}` : ""}`);
  }
  $("#add-block").addEventListener("click", () => commitBlock());

  $("#paste-block").addEventListener("click", () => {
    if (!tray) { updateTrayControls(); announce("La bandeja está vacía: copia un bloque antes de pegar."); return; }
    const { parent } = editorTarget();
    // Cada pegado entrega una copia nueva: la bandeja conserva su bloque y dos
    // pegados del mismo origen no comparten objetos.
    const result = insertBlock(blocks, parent, cloneBlock(tray.block));
    if (!result) { renderBlocks(); setEditorTarget(editorTarget()); announce("No se pudo pegar el bloque en ese destino; la lista se actualizó."); return; }
    const label = trayLabel();
    const cancelled = cancelEditForStructuralChange();
    changeTree(result.blocks, result.id); renderBlocks(); setEditorTarget(editorTarget());
    if (!focusById("edit", result.id)) $("#add-block").focus();
    announce(`${label} pegado como bloque ${pathLabel(result.path)} ${describeLocation(parent)}. Sigue en la bandeja para pegarlo otra vez.${cancelled}`);
  });

  $("#cancel-edit").addEventListener("click", () => {
    const cancelled = editorTarget().editing.length;
    cancelTemplateForStructuralChange();
    resetBlockEditor(); $("#block-type").focus();
    announce(cancelled ? "Edición cancelada." : "El siguiente bloque se añadirá en la raíz.");
  });

  function loadBlockEditor(block, path) {
    cancelTemplateForStructuralChange();
    $("#block-type").value = block.type; $("#block-title").value = block.title; $("#block-content").value = block.content;
    for (const hook of blockFieldHooks) hook.fill?.(block);
    $("#block-error").textContent = ""; $("#block-content").removeAttribute("aria-invalid");
    setEditorTarget({ editing: path }); renderEditorPreview();
  }
  blockList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const path = keyToPath(button.dataset.path);
    const block = blockAtPath(blocks, path);
    if (!block) { renderBlocks(); $("#add-block").focus(); announce("Ese bloque ya no existe; la lista se actualizó."); return; }
    const action = button.dataset.action;

    if (action === "context") { openRadialAtButton(button, articleTarget(button), event.detail === 0); return; }
    if (action === "edit") {
      loadBlockEditor(block, path);
      $("#block-type").focus();
      announce(`Editando ${describeBlock(block, path)}.`);
      return;
    }
    if (action === "child") {
      cancelTemplateForStructuralChange();
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
      changeTree(result.blocks, block.id); renderBlocks(); setEditorTarget(editorTarget());
      if (!focusById("edit", result.id)) $("#add-block").focus();
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
      changeTree(next, block.id); renderBlocks(); setEditorTarget(editorTarget()); focusAfterRemoval(path);
      announce(`Eliminado ${label}${nested ? ` con sus ${nested} bloques anidados` : ""}.${cancelled}`);
      return;
    }

    const result = moveBlock(blocks, path, action === "up" ? -1 : 1);
    if (!result) { button.focus(); announce("El bloque ya está en el extremo de sus hermanos."); return; }
    const cancelled = cancelEditForStructuralChange();
    changeTree(result.blocks, block.id); renderBlocks(); setEditorTarget(editorTarget());
    // Si el botón usado quedó deshabilitado en el extremo, el foco pasa al
    // movimiento contrario y, si tampoco existe, a la edición del mismo bloque.
    if (!focusById(action, block.id) && !focusById(action === "up" ? "down" : "up", block.id)) focusById("edit", block.id);
    announce(`${describeBlock(block, result.path)} movido a la posición ${result.path[result.path.length - 1] + 1} de su nivel.${cancelled}`);
  });

  function generateOutput() {
    const title = $("#note-title");
    if (!title.value.trim()) {
      $("#metadata-details").open = true; $("#title-error").textContent = "Escribe un título para generar el documento.";
      title.setAttribute("aria-invalid", "true"); title.focus(); announce("No se generó el documento: falta el título."); return false;
    }
    $("#title-error").textContent = ""; title.removeAttribute("aria-invalid");
    generatedSnapshot = state();
    for (const hook of beforeGenerateHooks) hook(generatedSnapshot);
    output.value = generateLatex(generatedSnapshot);
    return true;
  }
  function exportSnapshot() {
    if (!output.value) { announce("Genera el documento antes de exportarlo."); $("#generate").focus(); return null; }
    if ((!generatedSnapshot || generatedSnapshot.documentId !== documentId || !global.TexNotes.sameDocument(generatedSnapshot, state())) && !generateOutput()) return null;
    return generatedSnapshot;
  }
  form.addEventListener("submit", event => {
    event.preventDefault();
    if (generateOutput()) { announce("Documento generado."); saveExportVersion(generatedSnapshot); }
  });
  $("#download-tex").addEventListener("click", () => {
    const snapshot = exportSnapshot(); if (!snapshot) return;
    downloadTex(output.value, snapshot.metadata.title); saveExportVersion(snapshot); announce("Descarga del archivo .tex iniciada.");
  });
  $("#copy-code").addEventListener("click", async () => {
    const snapshot = exportSnapshot(); if (!snapshot) return;
    try { await copyToClipboard(output.value, output); saveExportVersion(snapshot); announce("Código LaTeX copiado."); }
    catch { announce("No se pudo copiar el código; permanece disponible para seleccionarlo manualmente."); }
  });

  function focusBlockContent() { $(blockType($("#block-type").value)?.kind === "image" ? "#image-path" : "#block-content").focus(); }
  // Se amplía en [F] cuando hay un menú de escritura.
  let closeAssistMenu = () => {};

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
    closeSymbolSheet();
    field.focus();
    if (selection) field.setSelectionRange(...selection);
  }

  function openSymbolSearch(field) {
    symbolOrigin = field ? captureSymbolOrigin(field) : symbolOrigin ?? captureSymbolOrigin(lastBlockField);
    if (coarsePointer.matches) showSymbolSheet();
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
    closeSymbolSheet();
    insertIntoField(destination, symbol.insert || symbol.command);
    symbolOrigin = null;
    if (destination !== field) field.focus();
    if (destination === blockContent) scheduleEditorPreview();

    noteUsage(`symbol:${id}`);
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
    if (event.defaultPrevented || event.isComposing) return;
    const shortcut = matchShortcut(event, "block-editor", listIsMac);
    if (shortcut?.id === "block.commit") {
      event.preventDefault();
      if (!event.repeat) { closeAssistMenu(); $("#add-block").click(); }
      return;
    }
    if (event.key === "Enter" && !(event.ctrlKey || event.metaKey || event.altKey || event.shiftKey)) {
      if (event.target.id === "block-title") { event.preventDefault(); focusBlockContent(); return; }
      if (event.target.matches('#image-fields input[type="text"], #image-fields input[type="number"]')) { event.preventDefault(); return; }
    }
    if (symbolBoard.hidden) return;
    const inBoard = symbolBoard.contains(event.target);
    if ((inBoard || event.target.matches("input, select, textarea"))
        && matchShortcut(event, "block-editor")?.id === "symbols.toggle") {
      event.preventDefault();
      if (event.repeat) return;
      closeAssistMenu();
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
    $("#proof-help").hidden = $("#block-type").value !== "proof";
    imageFields.hidden = !active;
    $("#block-content").closest(".field").hidden = active;
    $(".symbol-board").hidden = active;
    for (const id of ["thumb-prev", "thumb-next", "thumb-selection", "thumb-symbols"]) $("#" + id).disabled = active;
    const buttons = [...$("#thumb-bar").querySelectorAll("button")];
    if (!buttons.some(button => !button.disabled && button.tabIndex === 0)) {
      for (const button of buttons) button.tabIndex = -1;
      buttons.find(button => !button.disabled).tabIndex = 0;
    }
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
    shiftLines, continueListLine, listFormatAfterEdit,
  } = global.TexNotes;
  const listContent = $("#block-content");
  const listLimit = $("#list-limit");
  const listShortcuts = SHORTCUTS.filter(({ scope }) => scope === "list-editor");
  const listKeyNames = listShortcuts.map(shortcut => listAriaKeyshortcuts(shortcut));
  let loadedListBlock = null;

  blockFieldHooks.push({
    fill(block) { loadedListBlock = blockType(block.type)?.kind === "list" ? block : null; },
    clear() { loadedListBlock = null; },
    read(type) {
      if (blockType(type)?.kind !== "list") return {};
      const original = blockAtPath(blocks, editorTarget().editing) || loadedListBlock;
      return { listFormat: listFormatAfterEdit(original, listContent.value) };
    },
  });

  function listDepthForPath(parentPath) {
    let depth;
    let siblings = blocks;
    for (const index of parentPath) {
      const ancestor = siblings[index];
      if (!ancestor) break;
      const type = blockType(ancestor.type);
      if (type?.kind === "theorem") depth = listDepthWithEnvironment(depth, type.environment);
      if (type?.kind === "list") {
        depth = listOutlineDepthContext(parseListOutline(ancestor.content, type.listEnvironment, ancestor.listFormat), depth);
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
    const parsed = parseListOutline(block.content, blockType(block.type).listEnvironment, block.listFormat);
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
    const legacy = block.listFormat === "flat";
    $("#list-tools").hidden = !isList;
    $("#list-help").hidden = !isList;
    $("#legacy-list-help").hidden = !legacy;
    if (!isList) showListLimit("");
    const descriptions = [];
    if (legacy) descriptions.push("legacy-list-help");
    if (isList) descriptions.push("list-help");
    if (!listLimit.hidden) descriptions.push("list-limit");
    updateListFieldAttribute("aria-describedby", ["legacy-list-help", "list-help", "list-limit"], descriptions);
    updateListFieldAttribute("aria-keyshortcuts", listKeyNames, isList ? listKeyNames : []);
  });

  function applyListEdit(edit, direction) {
    global.TexNotes.applyFieldEdit(listContent, { ...edit, selectionDirection: direction });
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

  $("#list-tools").addEventListener("keydown", (event) => {
    if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const buttons = [...$("#list-tools").querySelectorAll("button")];
    const next = buttons.find((button) => button !== event.target);
    for (const button of buttons) button.tabIndex = button === next ? 0 : -1;
    next?.focus();
  });

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
    const issues = checkBlock({ ...block, children: savedBlock?.children }, blocks, parentPath, { macros });
    editorContentCheck.textContent = issues.map(issueText).join("\n");
    editorContentCheck.hidden = !issues.length;
  });

  blockItemExtensions.push((block, path, { article, actions }) => {
    const editButton = actions.querySelector('[data-action="edit"]');
    editButton.id = editButtonId(path);
    if (badgedBlocks !== blocks) {
      issuesByPath = new Map(checkDocument({ blocks, macros }).map(({ path: issuePath, issues }) => [pathToKey(issuePath), issues.length]));
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
    const found = `Se ${total === 1 ? "encontró" : "encontraron"} ${issueCount(total)}`;
    generatedBlocks = blocks;
    contentCheckSummary.textContent = total
      ? `${found} en ${checked.length} ${checked.length === 1 ? "bloque" : "bloques"}.`
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
    if (total) global.queueMicrotask(() => announce(`Documento generado. ${found}.`));
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

  blockItemExtensions.push((_block, path, { more, subject }) => {
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
    more.append(button);
  });

  $("#move-block-cancel").addEventListener("click", () => moveDialog.close());
  $("#move-block-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const position = movePosition.value === "start" ? 0 : undefined;
    const movedId = blockAtPath(blocks, movingPath)?.id;
    const result = moveBlockTo(blocks, movingPath, keyToPath(moveDestination.value), position);
    moveDialog.close();
    if (!result) {
      announce("No se pudo mover el bloque a ese destino.");
      return;
    }

    const previous = editorTarget();
    const cancelled = cancelEditForStructuralChange();
    changeTree(result.blocks, movedId);
    renderBlocks();
    setEditorTarget({});
    renderEditorPreview();
    focusById("edit", movedId);
    const targetReset = previous.parent.length ? " El siguiente bloque se añadirá en la raíz." : "";
    announce(`Bloque movido de ${pathLabel(movingPath)} a ${pathLabel(result.path)}.${cancelled}${targetReset}`);
  });
  /* --- fin [E] --- */

  /* --- [F] Asistente de escritura --- */
  const T = global.TexNotes;
  let pendingPairs = [];
  let prefs = { autoPair: true, vibration: true };
  try { const saved = JSON.parse(global.localStorage.getItem("tex-notes:prefs:v1")); for (const key of ["autoPair","vibration"]) if (typeof saved?.[key] === "boolean") prefs[key] = saved[key]; } catch { /* valores predeterminados */ }
  $("#radial-vibration").checked = prefs.vibration;
  $("#radial-vibration").addEventListener("change", () => {
    prefs.vibration = $("#radial-vibration").checked; writeWritingStorage("tex-notes:prefs:v1", prefs);
  });
  $("#auto-pair").checked = prefs.autoPair;
  $("#auto-pair").addEventListener("change", () => {
    prefs.autoPair = $("#auto-pair").checked;
    pendingPairs = [];
    try { global.localStorage.setItem("tex-notes:prefs:v1", JSON.stringify(prefs)); } catch { /* preferencia en memoria */ }
  });
  function fieldState() { return { value: blockContent.value, selectionStart: blockContent.selectionStart, selectionEnd: blockContent.selectionEnd }; }
  function applyAssist(result) {
    T.applyFieldEdit(blockContent, result.edit || result);
    if (result.pending) pendingPairs = result.pending;
    scheduleEditorPreview(); scheduleSessionSave();
  }
  blockFieldHooks.push({ fill() { pendingPairs = []; }, clear() { pendingPairs = []; } });
  blockContent.addEventListener("beforeinput", (event) => {
    if (event.defaultPrevented || T.isApplyingFieldEdit() || event.isComposing || event.inputType !== "insertText" || event.data?.length !== 1) return;
    if (assistState?.token.kind === "slash") return;
    if (assistState && !/[A-Za-z]/.test(event.data)) closeAssistMenu();
    if (!prefs.autoPair) return;
    const current = fieldState();
    const result = T.autoPair(current, event.data, { mode: T.mathContextAt(current.value, current.selectionStart, $("#block-type").value), pending: pendingPairs });
    if (result) { event.preventDefault(); applyAssist(result); }
  });
  /* @decision DEC-016 ancla:3d5a2b69 tramo:14
   * La captura en el fieldset antecede al manejador de Intro de listas. Solo
   * se consume la tecla cuando existe una edición del asistente aplicable.
   */
  blockEditor.addEventListener("keydown", (event) => {
    if (event.target !== blockContent || event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || !prefs.autoPair) return;
    if (assistState) { handleWritingKey(event); if (event.defaultPrevented) return; }
    const current = fieldState();
    const result = event.key === "Backspace" ? T.deleteEmptyPair(current, pendingPairs)
      : event.key === "Enter" ? T.completeEnvironment(current, $("#block-type").value) : null;
    if (result) { event.preventDefault(); applyAssist(result); }
  }, true);
  function prunePairs() { if (!T.isApplyingFieldEdit()) pendingPairs = T.activePairs(fieldState(), pendingPairs); }
  blockContent.addEventListener("input", prunePairs);
  blockContent.addEventListener("select", prunePairs);
  blockContent.addEventListener("keyup", prunePairs);
  blockContent.addEventListener("click", prunePairs);
  blockContent.addEventListener("blur", () => { pendingPairs = []; });
  function readWritingStorage(key, fallback) {
    try { return JSON.parse(global.localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  }
  function writeWritingStorage(key, value) {
    try { global.localStorage.setItem(key, JSON.stringify(value)); } catch { announce("No se pudo guardar la configuración; se conserva mientras esta pestaña siga abierta."); }
  }
  let usage = T.recordUsage(readWritingStorage("tex-notes:usage:v1", {}), null, Date.now());
  function noteUsage(key) { usage = T.recordUsage(usage, key, Date.now()); writeWritingStorage("tex-notes:usage:v1", usage); }
  let aliases = readWritingStorage("tex-notes:aliases:v1", T.DEFAULT_ALIASES);
  if (!Array.isArray(aliases) || aliases.some((a, i) => T.validateAlias(a, aliases.slice(0, i)).length)) aliases = T.DEFAULT_ALIASES.map(a => ({ ...a }));
  aliases = aliases.map(a => ({ ...a }));
  let ownTemplates = [];
  let getCompletionMacros = () => [];
  let getConfigMacros = () => [];
  let setConfigMacros = () => {};
  let refreshTemplates = () => {};
  let specialCompletions = () => null;
  let acceptSpecialCompletion = () => false;
  let snippetSession = null;
  let assistState = null;
  const assistList = $("#assist-list");
  closeAssistMenu = () => {
    assistState = null; assistList.hidden = true; assistList.replaceChildren();
    for (const name of ["aria-autocomplete", "aria-controls", "aria-activedescendant"]) blockContent.removeAttribute(name);
  };
  function writingMode() { return T.mathContextAt(blockContent.value, blockContent.selectionStart, $("#block-type").value); }
  function positionAssistMenu() {
    if (!assistState) return;
    const rect = blockContent.getBoundingClientRect();
    const narrow = global.matchMedia("(max-width: 38rem)").matches;
    let x = rect.left, y = rect.bottom;
    if (!narrow) {
      const mirror = document.createElement("div"), marker = document.createElement("span");
      const style = getComputedStyle(blockContent);
      for (const key of ["font", "lineHeight", "letterSpacing", "padding", "border", "boxSizing", "tabSize", "textIndent"]) mirror.style[key] = style[key];
      Object.assign(mirror.style, { position: "fixed", visibility: "hidden", whiteSpace: "pre-wrap", overflowWrap: "break-word", width: `${rect.width}px`, left: `${rect.left}px`, top: `${rect.top}px` });
      mirror.textContent = blockContent.value.slice(0, blockContent.selectionStart);
      marker.textContent = "\u200b"; mirror.append(marker); document.body.append(mirror);
      const caret = marker.getBoundingClientRect();
      x = caret.left - blockContent.scrollLeft; y = caret.bottom - blockContent.scrollTop;
      mirror.remove();
    }
    assistList.style.width = `${Math.max(0, Math.min(narrow ? rect.width : 420, global.innerWidth - 16))}px`;
    const width = assistList.offsetWidth, height = assistList.offsetHeight;
    assistList.style.left = `${Math.max(8, Math.min(x, global.innerWidth - width - 8))}px`;
    assistList.style.top = `${Math.max(8, Math.min(y, global.innerHeight - height - 8))}px`;
  }
  function selectAssist(index, speak = true) {
    if (!assistState) return;
    assistState.index = (index + assistState.entries.length) % assistState.entries.length;
    for (const [i, option] of [...assistList.children].entries()) option.setAttribute("aria-selected", String(i === assistState.index));
    const active = assistList.children[assistState.index];
    blockContent.setAttribute("aria-activedescendant", active.id);
    active.scrollIntoView({ block: "nearest" });
    if (speak) announce(`${assistState.entries[assistState.index].label}. ${assistState.index + 1} de ${assistState.entries.length}.`);
  }
  function openAssistMenu(entries, token, mode) {
    if (!entries.length) { closeAssistMenu(); return; }
    const opened = !assistState;
    assistState = { entries, token: { ...token, cursor: blockContent.selectionStart }, mode, index: 0 };
    assistList.replaceChildren(...entries.map((entry, i) => {
      const option = document.createElement("li");
      option.id = `assist-option-${i}`; option.setAttribute("role", "option");
      const name = document.createElement("strong"), detail = document.createElement("span");
      name.textContent = entry.label; detail.textContent = entry.detail || entry.trigger;
      option.append(name, detail);
      option.addEventListener("pointerdown", (event) => { event.preventDefault(); acceptAssist(i); });
      return option;
    }));
    assistList.hidden = false;
    blockContent.setAttribute("aria-autocomplete", "list"); blockContent.setAttribute("aria-controls", "assist-list");
    selectAssist(0, false); positionAssistMenu();
    if (opened) announce(`${entries.length} sugerencias. ${entries[0].label}.`);
  }
  function updateAssistMenu(event) {
    if (T.isApplyingFieldEdit()) return;
    if (event.isComposing || event.inputType !== "insertText" || event.data?.length !== 1) { closeAssistMenu(); return; }
    const current = fieldState(), mode = writingMode();
    if (mode === "comment") { closeAssistMenu(); return; }
    const special = specialCompletions(current, event);
    if (special) { openAssistMenu(special.entries, special.token, mode); return; }
    const token = T.completionToken(current);
    if (!token) { closeAssistMenu(); return; }
    const entries = T.completionEntries(getCompletionMacros()).filter(e => (e.kind === "environment") === (token.kind === "environment"));
    openAssistMenu(T.rankCompletions(token.query, entries, usage, Date.now(), mode), token, mode);
  }
  function insertWritingSnippet(source, start, end, wrapMath) {
    const current = fieldState();
    const result = T.snippetEdit({ ...current, selectionStart: start, selectionEnd: end }, source, wrapMath);
    const previousPairs = T.pairsAfterReplacement(current, pendingPairs, start, end);
    applyAssist({ edit: result.edit, pending: [...previousPairs, ...result.pending] });
    snippetSession = result.session;
  }
  function acceptAssist(index = assistState?.index) {
    if (!assistState) return;
    const { entries, token, mode } = assistState, entry = entries[index];
    closeAssistMenu();
    if (acceptSpecialCompletion(entry, token)) return;
    insertWritingSnippet(entry.insert, token.start, token.end, mode === "text" && entry.mode === "math");
    noteUsage(entry.key);
  }
  function expandAlias(current) {
    const mode = writingMode(), found = T.aliasAt(current, aliases, mode);
    if (!found) return false;
    insertWritingSnippet(found.alias.expansion, found.start, found.end, mode === "text" && found.alias.mode === "math");
    noteUsage(`alias:${found.alias.trigger}`); return true;
  }
  /* @decision DEC-015 ancla:369b59aa tramo:28
   * Tab se consume solo con una sugerencia, hueco, cierre o alias pendiente.
   * Escape cancela sin mover el cursor. El resto conserva la navegación nativa.
   */
  function handleWritingKey(event) {
    if (event.target !== blockContent || event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (assistState && ["ArrowDown", "ArrowUp", "Enter", "Tab", "Escape"].includes(event.key)) {
      event.preventDefault();
      if (event.key === "Escape") { closeAssistMenu(); event.stopPropagation(); }
      else if (event.key === "ArrowDown" || event.key === "ArrowUp") selectAssist(assistState.index + (event.key === "ArrowDown" ? 1 : -1));
      else acceptAssist();
      return;
    }
    if (event.key === "Escape" && snippetSession) { event.preventDefault(); snippetSession = null; return; }
    if (event.key !== "Tab") return;
    const current = fieldState();
    const hole = T.nextSnippetHole(current, snippetSession);
    if (hole) { event.preventDefault(); T.applyFieldEdit(blockContent, hole.edit); snippetSession = hole.session; return; }
    snippetSession = null;
    const close = T.skipPendingClose(current, pendingPairs);
    if (close) { event.preventDefault(); applyAssist(close); return; }
    if (expandAlias(current)) event.preventDefault();
  }
  blockEditor.addEventListener("keydown", handleWritingKey, true);
  blockContent.addEventListener("input", updateAssistMenu);
  function pruneWritingSessions() {
    if (T.isApplyingFieldEdit()) return;
    snippetSession = T.activeSnippet(fieldState(), snippetSession);
    if (assistState && (blockContent.selectionStart !== assistState.token.cursor || blockContent.selectionStart !== blockContent.selectionEnd)) closeAssistMenu();
  }
  blockContent.addEventListener("select", pruneWritingSessions);
  blockContent.addEventListener("keyup", pruneWritingSessions);
  blockContent.addEventListener("click", pruneWritingSessions);
  blockContent.addEventListener("blur", closeAssistMenu);
  blockContent.addEventListener("scroll", positionAssistMenu);
  global.addEventListener("resize", positionAssistMenu);
  document.addEventListener("scroll", positionAssistMenu, true);
  blockFieldHooks.push({ fill() { snippetSession = null; closeAssistMenu(); }, clear() { snippetSession = null; closeAssistMenu(); } });

  let editingAlias = -1;
  function renderAliases() {
    $("#alias-list").replaceChildren(...aliases.map((alias, index) => {
      const row = document.createElement("tr");
      for (const value of [alias.trigger, alias.expansion, alias.mode === "math" ? "Matemáticas" : alias.mode === "text" ? "Texto" : "Cualquier contexto"]) {
        const cell = document.createElement("td"); cell.textContent = value; row.append(cell);
      }
      const cell = document.createElement("td"), edit = document.createElement("button"), remove = document.createElement("button");
      edit.type = remove.type = "button"; edit.textContent = "Editar alias"; remove.textContent = "Borrar alias";
      edit.setAttribute("aria-label", `Editar alias ${alias.trigger}`); remove.setAttribute("aria-label", `Borrar alias ${alias.trigger}`);
      edit.addEventListener("click", () => { editingAlias = index; $("#alias-trigger").value = alias.trigger; $("#alias-expansion").value = alias.expansion; $("#alias-mode").value = alias.mode; $("#alias-trigger").focus(); });
      remove.addEventListener("click", () => { aliases.splice(index, 1); editingAlias = -1; persistAliases(); $("#alias-trigger").focus(); announce("Alias borrado."); });
      cell.append(edit, remove); row.append(cell); return row;
    }));
  }
  function persistAliases() { writeWritingStorage("tex-notes:aliases:v1", aliases); renderAliases(); }
  function saveAlias() {
    const alias = { trigger: $("#alias-trigger").value.trim(), expansion: $("#alias-expansion").value, mode: $("#alias-mode").value };
    const errors = T.validateAlias(alias, aliases.filter((a, i) => i !== editingAlias));
    $("#alias-error").textContent = errors.join(" ");
    if (errors.length) { announce(errors[0]); return; }
    if (editingAlias >= 0) aliases[editingAlias] = alias; else aliases.push(alias);
    editingAlias = -1; persistAliases(); $("#alias-trigger").value = ""; $("#alias-expansion").value = ""; $("#alias-trigger").focus(); announce("Alias guardado.");
  }
  $("#save-alias").addEventListener("click", saveAlias);
  $("#alias-fields").addEventListener("keydown", (event) => { if (event.key === "Enter" && event.target.tagName !== "TEXTAREA" && !event.isComposing) { event.preventDefault(); saveAlias(); } });
  $("#cancel-alias").addEventListener("click", () => { editingAlias = -1; $("#alias-trigger").value = ""; $("#alias-expansion").value = ""; $("#alias-error").textContent = ""; });
  $("#reset-aliases").addEventListener("click", () => { aliases = T.DEFAULT_ALIASES.map(a => ({ ...a })); editingAlias = -1; persistAliases(); announce("Alias predeterminados restaurados."); });
  function portableConfig() {
    return { kind: "notas-latex-config", version: 1, aliases, templates: ownTemplates, prefs, macros: getConfigMacros() };
  }
  function applyPortableConfig(data, applyDefaults = true) {
    aliases = data.aliases; ownTemplates = data.templates; prefs = { autoPair: data.prefs.autoPair, vibration: data.prefs.vibration !== false }; editingAlias = -1;
    persistAliases(); writeWritingStorage("tex-notes:prefs:v1", prefs); writeWritingStorage("tex-notes:templates:v1", ownTemplates);
    $("#radial-vibration").checked = prefs.vibration; $("#auto-pair").checked = prefs.autoPair;
    pendingPairs = []; setConfigMacros(data.macros, applyDefaults); refreshTemplates();
  }
  $("#export-config").addEventListener("click", () => {
    const data = portableConfig();
    const url = global.URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "notas-latex-configuracion.json"; document.body.append(link); link.click(); link.remove();
    global.setTimeout(() => global.URL.revokeObjectURL(url), 0); announce("Configuración exportada.");
  });
  $("#import-config").addEventListener("change", async (event) => {
    const file = event.target.files[0]; if (!file) return;
    try {
      const data = JSON.parse(await file.text()), errors = T.validateConfiguration(data);
      if (errors.length) { announce(errors.join(" ")); return; }
      if (!global.confirm("¿Reemplazar tus alias, plantillas, preferencias y macros predeterminadas con esta configuración?")) return;
      applyPortableConfig(data);
      announce("Configuración importada.");
    } catch { announce("No se pudo leer la configuración. Comprueba que sea un archivo JSON válido."); }
    finally { event.target.value = ""; }
  });
  renderAliases();
  /* --- fin [F] --- */

  /* --- [G] Comandos / y plantillas --- */
  let slashSession = false;
  let templateSession = null;
  let renamingTemplate = -1;
  let savedTemplateBranch = null;
  const templateDialog = $("#save-template-dialog");
  const storedTemplates = readWritingStorage("tex-notes:templates:v1", []);
  if (Array.isArray(storedTemplates)) {
    for (const template of storedTemplates) if (!T.validateTemplate(template, [...T.BUILTIN_TEMPLATES, ...ownTemplates]).length) ownTemplates.push(template);
  }
  const closeCompletionMenu = closeAssistMenu;
  closeAssistMenu = () => { slashSession = false; closeCompletionMenu(); };
  blockContent.addEventListener("beforeinput", (event) => {
    if (!T.isApplyingFieldEdit() && !event.isComposing && event.inputType === "insertText" && event.data === "/" && !blockContent.value) slashSession = true;
  });
  specialCompletions = (current) => {
    if (!slashSession) return null;
    const result = T.slashCompletions(current, [...T.BUILTIN_TEMPLATES, ...ownTemplates]);
    if (!result || !result.entries.length) { closeAssistMenu(); return { entries: [], token: { kind: "slash" } }; }
    return result;
  };
  /* @decision DEC-018 ancla:a8b1aa78 tramo:4
   * Asignar el selector no emite change. El evento explícito sincroniza imagen,
   * herramientas de listas y vista previa cuando el tipo viene del menú /.
   */
  function selectBlockType(typeId) {
    $("#block-type").value = typeId;
    $("#block-type").dispatchEvent(new Event("change", { bubbles: true }));
  }
  acceptSpecialCompletion = (entry, token) => {
    if (entry.kind === "template") {
      const target = editorTarget();
      templateSession = { template: entry.template, index: 0, basePath: target.editing.length ? target.editing.slice(0, -1) : target.parent, paths: [] };
      noteUsage(entry.key); loadTemplateStep(); return true;
    }
    if (entry.kind !== "type") return false;
    selectBlockType(entry.typeId);
    if (token.title !== undefined) $("#block-title").value = token.title;
    applyAssist({ value: "", selectionStart: 0, selectionEnd: 0 });
    snippetSession = null; pendingPairs = []; renderEditorPreview(); focusBlockContent(); noteUsage(entry.key);
    announce(`Tipo: ${blockLabel(entry.typeId)}.${token.title ? ` Título: ${token.title}.` : ""}`);
    return true;
  };
  function renderTemplateProgress() {
    const progress = $("#template-progress");
    progress.hidden = !templateSession;
    if (!templateSession) return;
    const { template, index } = templateSession, next = template.steps[index + 1];
    $("#template-progress-text").textContent = `Plantilla «${template.name}»: paso ${index + 1} de ${template.steps.length}${next ? ` · Siguiente: ${blockLabel(next.block.type)}` : " · Último paso"}.`;
  }
  function loadTemplateStep() {
    const { block } = templateSession.template.steps[templateSession.index];
    const parent = T.templateParent(templateSession);
    if (!parent) { cancelTemplateForStructuralChange(); announce("La plantilla perdió su destino y se canceló."); return; }
    setEditorTarget({ parent }); selectBlockType(block.type);
    $("#block-title").value = block.title;
    for (const hook of blockFieldHooks) hook.fill?.(block);
    insertWritingSnippet(block.content, 0, blockContent.value.length, false);
    renderEditorPreview(); renderTemplateProgress(); focusBlockContent(); saveSession();
    announce($("#template-progress-text").textContent);
  }
  function commitTemplateStep(path) {
    if (!templateSession) return "";
    const name = templateSession.template.name;
    templateSession = T.advanceTemplate(templateSession, path);
    renderTemplateProgress();
    if (templateSession) { loadTemplateStep(); return `Sigue la plantilla ${name}.`; }
    return `Plantilla ${name} completada.`;
  }
  function cancelTemplateForStructuralChange() {
    if (!templateSession) return "";
    templateSession = null; renderTemplateProgress();
    return " Se canceló la plantilla porque cambió la estructura o el destino.";
  }
  $("#skip-template-step").addEventListener("click", () => {
    if (!templateSession) return;
    templateSession = T.advanceTemplate(templateSession, null); renderTemplateProgress();
    if (templateSession) loadTemplateStep();
    else { clearBlockFields(); focusBlockContent(); announce("Plantilla terminada; se omitió el paso y su descendencia."); }
  });
  $("#cancel-template").addEventListener("click", () => {
    templateSession = null; renderTemplateProgress(); focusBlockContent(); announce("Plantilla cancelada; el contenido del paso actual se conserva.");
  });
  blockItemExtensions.push((block, path, { more, subject }) => {
    const button = document.createElement("button"); button.type = "button"; button.textContent = "Guardar como plantilla";
    button.setAttribute("aria-label", `Guardar como plantilla ${subject}`); button.setAttribute("aria-haspopup", "dialog");
    button.addEventListener("click", () => {
      renamingTemplate = -1; savedTemplateBranch = cloneBlock(block);
      $("#template-name").value = block.title || blockLabel(block.type); $("#template-trigger").value = ""; $("#template-error").textContent = "";
      templateDialog.showModal();
    });
    more.append(button);
  });
  refreshTemplates = () => {
    $("#own-template-list").replaceChildren(...ownTemplates.map((template, index) => {
      const item = document.createElement("li"), rename = document.createElement("button"), remove = document.createElement("button");
      rename.type = remove.type = "button"; rename.textContent = "Renombrar plantilla"; remove.textContent = "Borrar plantilla";
      rename.setAttribute("aria-label", `Renombrar plantilla ${template.name}`); remove.setAttribute("aria-label", `Borrar plantilla ${template.name}`);
      rename.addEventListener("click", () => { renamingTemplate = index; $("#template-name").value = template.name; $("#template-trigger").value = template.trigger; $("#template-error").textContent = ""; templateDialog.showModal(); });
      remove.addEventListener("click", () => { ownTemplates.splice(index, 1); writeWritingStorage("tex-notes:templates:v1", ownTemplates); refreshTemplates(); $("#writing-preferences > summary").focus(); announce("Plantilla borrada."); });
      item.append(`${template.name} · /${template.trigger} `, rename, remove); return item;
    }));
  };
  $("#save-template-cancel").addEventListener("click", () => templateDialog.close());
  $("#save-template-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const values = { name: $("#template-name").value.trim(), trigger: $("#template-trigger").value.trim() };
    const template = renamingTemplate >= 0 ? { ...ownTemplates[renamingTemplate], ...values }
      : T.templateFromBranch(savedTemplateBranch, { ...values, id: `personal-${Date.now().toString(36)}-${ownTemplates.length}` });
    const existing = [...T.BUILTIN_TEMPLATES, ...ownTemplates.filter((t, i) => i !== renamingTemplate)];
    const errors = T.validateTemplate(template, existing); $("#template-error").textContent = errors.join(" ");
    if (errors.length) { announce(errors[0]); return; }
    if (renamingTemplate >= 0) ownTemplates[renamingTemplate] = template; else ownTemplates.push(template);
    writeWritingStorage("tex-notes:templates:v1", ownTemplates); refreshTemplates(); templateDialog.close(); announce("Plantilla guardada.");
  });
  refreshTemplates();
  /* --- fin [G] --- */

  /* --- [H] Macros del documento --- */
  let editingMacro = -1;
  let defaultMacros = [];
  for (const macro of T.normalizeMacros(readWritingStorage("tex-notes:macros-default:v1", []))) {
    if (!T.validateMacro(macro, defaultMacros).length) defaultMacros.push(macro);
  }
  const existingSnapshot = [STORAGE_KEY, LEGACY_STORAGE_KEY, "tex-notes:autosave:v1"].some(key => normalizeDraft(readWritingStorage(key, null)));
  if (!existingSnapshot) macros = defaultMacros.map(m => ({ ...m }));
  getCompletionMacros = () => macros;
  getConfigMacros = () => defaultMacros;
  setConfigMacros = (next, applyDefaults = true) => {
    defaultMacros = next.map(m => ({ ...m })); writeWritingStorage("tex-notes:macros-default:v1", defaultMacros);
    if (applyDefaults && !blocks.length && !blockContent.value.trim() && !$("#block-title").value.trim() && !$("#note-title").value.trim()) setDocumentMacros(defaultMacros);
  };
  function setDocumentMacros(next, draw = true) {
    if (draw) rememberChange();
    macros = next.map(m => ({ ...m })); previewVersion++; badgedBlocks = null;
    renderMacroList();
    if (draw) { closeAssistMenu(); renderBlocks(); renderEditorPreview(); saveSession(); }
  }
  function macroCandidate() { return { name: $("#macro-name").value.trim(), params: Number($("#macro-params").value), body: $("#macro-body").value }; }
  function updateMacroPreview() {
    const candidate = macroCandidate(), existing = macros.filter((m, i) => i !== editingMacro);
    const errors = T.validateMacroFields(candidate, existing);
    for (const field of ["name", "params", "body"]) {
      const shown = candidate.name || candidate.body ? errors[field].join(" ") : "";
      $("#macro-" + field + "-error").textContent = shown;
      if (shown) $("#macro-" + field).setAttribute("aria-invalid", "true"); else $("#macro-" + field).removeAttribute("aria-invalid");
    }
    const preview = $("#macro-preview");
    if (Object.values(errors).some(list => list.length)) { preview.textContent = "Completa una macro válida para ver su vista previa."; return; }
    const example = "\\" + candidate.name + Array.from({ length: candidate.params }, (_, i) => `{${String.fromCharCode(120 + i % 3)}}`).join("");
    const rendered = katexRender(example, false, [...existing, candidate]);
    if (rendered.ok) preview.innerHTML = rendered.html; else preview.textContent = `No se pudo previsualizar: ${rendered.message}`;
  }
  function clearMacroForm() {
    editingMacro = -1; $("#macro-name").value = ""; $("#macro-body").value = ""; $("#macro-params").value = "0"; updateMacroPreview();
  }
  function renderMacroList() {
    $("#macro-list").replaceChildren(...macros.map((macro, index) => {
      const item = document.createElement("li"), text = document.createElement("code"), edit = document.createElement("button"), remove = document.createElement("button");
      text.textContent = `\\${macro.name}${macro.params ? `[${macro.params}]` : ""} = ${macro.body}`;
      edit.type = remove.type = "button"; edit.textContent = "Editar macro"; remove.textContent = "Borrar macro";
      edit.setAttribute("aria-label", `Editar macro ${macro.name}`); remove.setAttribute("aria-label", `Borrar macro ${macro.name}`);
      edit.addEventListener("click", () => {
        editingMacro = index; $("#macro-name").value = macro.name; $("#macro-params").value = macro.params; $("#macro-body").value = macro.body; updateMacroPreview(); $("#macro-name").focus();
      });
      remove.addEventListener("click", () => { const next = macros.filter((m, i) => i !== index); clearMacroForm(); setDocumentMacros(next); $("#macro-name").focus(); announce("Macro borrada; se actualizaron las vistas previas y la comprobación."); });
      item.append(text, " ", edit, " ", remove); return item;
    }));
  }
  function saveMacro() {
    const candidate = macroCandidate(), errors = T.validateMacro(candidate, macros.filter((m, i) => i !== editingMacro));
    updateMacroPreview();
    if (errors.length) { announce(errors[0]); return; }
    const next = macros.map(m => ({ ...m }));
    if (editingMacro >= 0) next[editingMacro] = candidate; else next.push(candidate);
    clearMacroForm(); setDocumentMacros(next); $("#macro-name").focus(); announce("Macro guardada en el documento.");
  }
  $("#save-macro").addEventListener("click", saveMacro);
  $("#cancel-macro").addEventListener("click", clearMacroForm);
  $("#macro-fields").addEventListener("input", updateMacroPreview);
  $("#macro-fields").addEventListener("keydown", (event) => { if (event.key === "Enter" && !event.isComposing) { event.preventDefault(); saveMacro(); } });
  $("#use-default-macros").addEventListener("click", () => { defaultMacros = macros.map(m => ({ ...m })); writeWritingStorage("tex-notes:macros-default:v1", defaultMacros); announce("Macros predeterminadas guardadas para documentos nuevos."); });
  renderMacroList(); updateMacroPreview();
  /* --- fin [H] --- */

  function syncMetadataSummary(reset = false) {
    const data = metadata(), parts = [data.title, data.course, data.date].map(value => value.trim()).filter(Boolean);
    $("#datos-heading").textContent = ["Datos del documento", ...parts].join(" · ");
    if (reset || !data.title.trim()) $("#metadata-details").open = !data.title.trim();
  }
  function focusMetadata() { $( $("#metadata-details").open ? "#note-title" : "#metadata-details > summary").focus(); }
  $("#metadata-details").addEventListener("input", () => syncMetadataSummary());
  syncMetadataSummary(true);

  const thumbBar = $("#thumb-bar");
  const coarsePointer = global.matchMedia("(pointer: coarse)");
  const rootStyle = document.documentElement.style;
  function syncThumbViewport() {
    const v = global.visualViewport;
    const inset = v ? Math.max(0, global.innerHeight - v.offsetTop - v.height) : 0;
    rootStyle.setProperty("--keyboard-inset", inset + "px");
    rootStyle.setProperty("--thumb-height", thumbBar.offsetHeight + "px");
    rootStyle.setProperty("--sheet-height", ((v?.height ?? global.innerHeight) * .4) + "px");
  }
  function revealThumbField() {
    syncThumbViewport();
    if (coarsePointer.matches && document.activeElement === blockContent) blockContent.scrollIntoView({ block: "nearest" });
  }
  global.visualViewport?.addEventListener("resize", revealThumbField);
  global.visualViewport?.addEventListener("scroll", syncThumbViewport);
  global.addEventListener("resize", syncThumbViewport);
  if (global.ResizeObserver) new ResizeObserver(syncThumbViewport).observe(thumbBar);
  blockContent.addEventListener("focus", () => { if (coarsePointer.matches) requestAnimationFrame(revealThumbField); });
  function showSymbolSheet() {
    symbolOrigin ??= captureSymbolOrigin(blockContent);
    symbolBoard.classList.add("symbol-sheet");
    symbolDetails.open = true;
    $("#close-symbol-sheet").hidden = false;
    $("#thumb-symbols").setAttribute("aria-expanded", "true");
  }
  function closeSymbolSheet() {
    symbolBoard.classList.remove("symbol-sheet");
    $("#close-symbol-sheet").hidden = true;
    $("#thumb-symbols").setAttribute("aria-expanded", "false");
  }
  coarsePointer.addEventListener("change", () => { closeSymbolSheet(); syncThumbViewport(); });
  $("#close-symbol-sheet").addEventListener("click", returnToSymbolOrigin);
  symbolBoard.addEventListener("pointerdown", event => {
    if (symbolBoard.classList.contains("symbol-sheet") && event.target.closest("button")) event.preventDefault();
  });
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape" || !symbolBoard.classList.contains("symbol-sheet")) return;
    event.preventDefault(); event.stopPropagation(); returnToSymbolOrigin();
  }, true);
  thumbBar.addEventListener("pointerdown", event => { if (event.target.closest("button")) event.preventDefault(); });
  thumbBar.addEventListener("keydown", event => {
    const buttons = [...thumbBar.querySelectorAll("button:enabled")];
    const index = buttons.indexOf(event.target);
    if (index < 0 || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 :
      (index + buttons.length + (event.key === "ArrowLeft" ? -1 : 1)) % buttons.length;
    buttons[index].tabIndex = -1;
    buttons[next].tabIndex = 0;
    buttons[next].focus();
  });
  const scopeButton = $("#thumb-selection");
  let scopeMode = null, scopeStack = [], scopeRange = null;
  function clearScope() {
    scopeMode = null;
    scopeStack = [];
    scopeRange = null;
    scopeButton.setAttribute("aria-pressed", "false");
  }
  function currentScopeRange() {
    return { start: blockContent.selectionStart, end: blockContent.selectionEnd, direction: blockContent.selectionDirection };
  }
  function focusRange(range) {
    blockContent.focus({ preventScroll: true });
    blockContent.setSelectionRange(range.start, range.end, range.direction || "forward");
  }
  scopeButton.addEventListener("click", () => {
    const range = currentScopeRange();
    if (scopeMode) {
      clearScope();
      announce("Selección por alcance desactivada.");
    } else {
      scopeMode = T.scopeModeAt(blockContent.value, range, $("#block-type").value);
      scopeRange = range;
      scopeButton.setAttribute("aria-pressed", "true");
      closeAssistMenu();
      announce("Selección por alcance. Siguiente amplía, Anterior reduce.");
    }
    focusRange(range);
  });
  blockContent.addEventListener("input", clearScope);
  $("#block-type").addEventListener("change", clearScope);
  blockFieldHooks.push({ fill: clearScope, clear: clearScope });
  function stepScope(direction) {
    const actual = currentScopeRange();
    if (actual.start !== scopeRange?.start || actual.end !== scopeRange?.end) {
      scopeStack = [];
      scopeRange = actual;
      scopeMode = T.scopeModeAt(blockContent.value, actual, $("#block-type").value);
    }
    const next = direction > 0 ? T.expandScope(blockContent.value, scopeRange, scopeMode, scopeStack) :
      T.shrinkScope(scopeRange, scopeStack);
    scopeRange = next.range;
    scopeStack = next.stack;
    focusRange(scopeRange);
    const selected = blockContent.value.slice(scopeRange.start, scopeRange.end);
    announce(selected ? (scopeRange.name || "Selección original") + ": " + selected.slice(0, 120) :
      "Cursor en la posición " + (scopeRange.start + 1) + ".");
  }
  function thumbStep(direction) {
    closeAssistMenu();
    if (scopeMode) { stepScope(direction); return; }
    const current = fieldState();
    const hole = direction > 0 ? T.nextSnippetHole(current, snippetSession) : T.previousSnippetHole(current, snippetSession);
    if (hole) {
      T.applyFieldEdit(blockContent, hole.edit); snippetSession = hole.session;
      announce(hole.session ? "Hueco " + (hole.session.index + 1) + " de " + hole.session.holes.length : "Fin del fragmento.");
    } else {
      snippetSession = null;
      const index = T.tokenBoundary(current.value, direction > 0 ? current.selectionEnd : current.selectionStart, direction);
      T.applyFieldEdit(blockContent, { ...current, selectionStart: index, selectionEnd: index });
      announce("Cursor en la posición " + (index + 1) + ".");
    }
  }
  $("#thumb-prev").addEventListener("click", () => thumbStep(-1));
  $("#thumb-next").addEventListener("click", () => thumbStep(1));
  $("#thumb-add").addEventListener("click", () => { closeAssistMenu(); closeSymbolSheet(); commitBlock(true); });
  $("#thumb-symbols").addEventListener("click", event => {
    if (symbolBoard.classList.contains("symbol-sheet")) { returnToSymbolOrigin(); return; }
    blockContent.focus(); showSymbolSheet();
    if (event.detail === 0) symbolSearch.focus();
    announce("Tablero de símbolos abierto.");
  });
  syncThumbViewport();

  let radialState = T.radialReduce(null, {}), radialModel = null, press = null, holdTimer;
  let suppressClickUntil = 0;
  const contextNames = { text: "texto", image: "imagen", formula: "fórmula", global: "acciones generales" };
  const viewport = () => {
    const v = global.visualViewport;
    return { x: v?.offsetLeft || 0, y: v?.offsetTop || 0, width: v?.width ?? innerWidth, height: v?.height ?? innerHeight };
  };
  const radialView = T.createRadialView(document, {
    pick: (index, keyboard) => radialDispatch({ type: "pick", index }, keyboard),
    back: () => radialDispatch({ type: "escape" }, document.activeElement.closest(".radial-layer")),
    cancel: () => radialDispatch({ type: "cancel" }), bottom: () => viewport().y + viewport().height,
  });
  function articleTarget(node) { return { source: "card", path: keyToPath(node.closest("article").dataset.path) }; }
  function radialTarget(node) {
    if (node.closest("#thumb-menu, #content-menu") || node === blockContent) return { source: "editor" };
    if (node.closest("input,textarea,select,button,a,summary,[contenteditable],dialog,.radial-layer")) return null;
    if (node.closest("#block-list article")) return articleTarget(node);
    return { source: "global" };
  }
  function focusWritingOrigin(origin) {
    origin.field.focus({ preventScroll: true });
    if (origin.selection) origin.field.setSelectionRange(...origin.selection);
  }
  function putRadialSnippet(source) {
    const result = T.applyRadialSnippet(fieldState(), source);
    applyAssist({ edit: result.edit, pending: [] }); snippetSession = result.session;
    announce(result.session ? "Hueco " + (result.session.index + 1) + " de " + result.session.holes.length : "Fragmento insertado.");
  }
  function goTo(destination) {
    if (destination === "preferences") $("#writing-preferences").open = true;
    const target = $(({ content: imageType($("#block-type").value) ? "#image-path" : "#block-content",
      tree: "#global-menu", result: "#generate", versions: "#versions-heading", preferences: "#writing-preferences > summary" })[destination]);
    target.focus(); target.scrollIntoView({ block: "nearest" });
  }
  const radialCommands = {
    insertList() {
      if (blockType($("#block-type").value)?.kind === "list") shiftListSelection(1);
      else putRadialSnippet("\\begin{itemize}\n\\item #1\n\\end{itemize}#0");
    },
    focusTitle() { $("#block-title").focus(); },
    openSymbols(group) { openSymbolSearch(blockContent); selectSymbolCategory(group); },
    setImageWidth(width) { imageWidth.value = width; imageWidth.dispatchEvent(new Event("input", { bubbles: true })); },
    setImageAlign(align) { imageFields.querySelector('input[name="imageAlign"][value="' + align + '"]').click(); },
    chooseImageFile() { imageFile.click(); },
    deleteBlock() {
      const path = editorTarget().editing, block = blockAtPath(blocks, path);
      if (!block) { announce("Guarda la imagen antes de eliminarla de la estructura."); return; }
      if (!block.children.length && !confirm("¿Eliminar " + describeBlock(block, path) + "?")) return;
      blockList.querySelector('[data-action="delete"][data-path="' + pathToKey(path) + '"]')?.click();
    },
    selectType(type) { resetBlockEditor(); selectBlockType(type); focusBlockContent(); },
    focusType() { $("#block-type").focus(); },
    undo(source) { if (source === "global") travelStructure("undo"); else document.execCommand("undo"); },
    redo(source) { if (source === "global") travelStructure("redo"); else document.execCommand("redo"); },
    goTo(destination) { goTo(destination); },
    openPreferences() { goTo("preferences"); },
  };
  function applyRadialAction(action, from) {
    if (action.type === "insert") putRadialSnippet(action.snippet);
    if (action.type === "symbol") { symbolOrigin = captureSymbolOrigin(blockContent); insertSymbol(action.symbol); }
    if (action.type === "command") radialCommands[action.name](...(action.args || []), from);
  }
  function radialScrollPositions(node) {
    const positions = new Map();
    const remember = element => {
      if (element) positions.set(element, [element.scrollLeft, element.scrollTop]);
    };
    remember(document.scrollingElement);
    remember(blockEditor);
    remember(blockContent);
    for (let part = node; part?.nodeType === 1; part = part.parentElement) remember(part);
    return positions;
  }
  function clearRadialPress() {
    clearTimeout(holdTimer);
    if (press?.node.hasPointerCapture?.(press.id)) press.node.releasePointerCapture(press.id);
    press = null;
  }
  function radialDispatch(event, focus = false) {
    const before = radialState;
    radialState = T.radialReduce(before, event, radialModel || {});
    if (radialState.phase === "idle") {
      const model = radialModel; radialModel = null;
      radialView.hide(); clearRadialPress();
      if (!model) return;
      focusWritingOrigin(model.originField);
      if (radialState.action) applyRadialAction(radialState.action, model.context);
      else if (radialState.cancelled) announce("Menú cerrado.");
      return;
    }
    if (!radialModel || radialState.phase === "waiting") return;
    if (before.phase === "drag" && radialState.phase === "tap" && event.type !== "open") {
      Object.assign(radialModel, T.radialLayout(radialModel.slices, { ...radialModel.origin, mode: "tap" }, viewport()));
    }
    const { parent, highlight } = radialState, model = radialModel;
    const items = parent < 0 ? model.slices : model.slices[parent].children;
    const ring = parent < 0 ? model.root : model.child(parent);
    const name = parent < 0 ? "Menú de " + contextNames[model.context] : model.slices[parent].label;
    radialView.draw(ring, items, name, radialState, model);
    if (before.parent !== parent || event.type === "open" || event.type === "hold") announce(name + ", " + items.length + " opciones.");
    if (radialState.haptic && prefs.vibration) navigator.vibrate?.(10);
    if (focus) radialView.focus(Math.max(0, highlight));
  }
  function openRadial(target, point, mode, keyboard = false, bar = false) {
    closeAssistMenu(); closeSymbolSheet();
    let type = $("#block-type").value;
    if (target.source === "card") {
      const block = blockAtPath(blocks, target.path); if (!block) return;
      type = block.type; loadBlockEditor(block, target.path);
      blockContent.setSelectionRange(blockContent.value.length, blockContent.value.length);
    }
    const kind = blockType(type)?.kind;
    const context = target.source === "global" ? "global" : kind === "image" ? "image" :
      kind === "equation" || (target.source === "editor" && (writingMode() === "math" || scopeMode === "math")) ? "formula" : "text";
    const field = kind === "image" ? imagePath : blockContent;
    const slices = T.slicesFor(context, type), area = viewport(), origin = { ...point, mode, bar };
    const scrollPositions = radialScrollPositions(press?.node || document.elementFromPoint?.(point.x, point.y));
    radialModel = { context, origin, scrollPositions, originField: captureSymbolOrigin(field), ...T.radialLayout(slices, origin, area) };
    radialDispatch({ type: "open", mode, point, keyboard }, keyboard);
    if (press) { try { press.node.setPointerCapture(press.id); } catch { /* puntero ya liberado */ } }
  }
  function openRadialAtButton(button, target, keyboard) {
    const rect = button.getBoundingClientRect();
    openRadial(target, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }, "tap", keyboard, button === $("#thumb-menu"));
  }
  for (const id of ["thumb-menu","content-menu","global-menu"]) {
    const button = $("#" + id);
    button.addEventListener("pointerdown", e => e.preventDefault());
    button.addEventListener("click", e => openRadialAtButton(button, { source: id === "global-menu" ? "global" : "editor" }, e.detail === 0));
  }
  blockContent.setAttribute("aria-keyshortcuts", SHORTCUTS.filter(s => s.scope === "content-widget").map(s => ariaKeyshortcuts(s)).join(" "));
  blockContent.addEventListener("keydown", e => {
    if (!matchShortcut(e, "content-widget") || !["idle","waiting"].includes(radialState.phase)) return;
    e.preventDefault(); openRadialAtButton(blockContent, { source: "editor" }, true);
  });
  document.addEventListener("keydown", e => {
    if (!radialModel) return;
    const items = radialState.parent < 0 ? radialModel.slices : radialModel.slices[radialState.parent].children;
    let i = Math.max(0, radialState.highlight);
    if (e.key === "Escape") radialDispatch({ type: "escape" }, true);
    else if (["Enter"," ","ArrowRight"].includes(e.key) && (e.key !== "ArrowRight" || items[i].children)) radialDispatch({ type: "pick", index: i }, true);
    else if (["Home","End","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
      i = e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 :
        (i + items.length + (["ArrowUp","ArrowLeft"].includes(e.key) ? -1 : 1)) % items.length;
      radialDispatch({ type: "focus", index: i }, true);
    } else if (e.key === "Tab") { radialDispatch({ type: "cancel" }); return; } else return;
    e.preventDefault(); e.stopPropagation();
  }, true);
  document.addEventListener("pointerdown", e => {
    suppressClickUntil = 0;
    if (!e.isPrimary || (press && press.id !== e.pointerId)) { radialDispatch({ type: "second" }); return; }
    if (radialModel || e.button !== 0) return;
    const node = e.target, bar = !!node.closest("#thumb-menu");
    if (!bar && (e.pointerType === "mouse" || (node === blockContent && !T.LONG_PRESS_IN_FIELD))) return;
    const target = radialTarget(node); if (!target) return;
    const point = { x: e.clientX, y: e.clientY };
    press = { node, id: e.pointerId, point, target, bar, scrollPositions: radialScrollPositions(node) };
    radialDispatch({ type: "down", point });
    if (bar) { e.preventDefault(); openRadial(target, point, "drag", false, true); }
    else holdTimer = setTimeout(() => { if (press) openRadial(target, point, "drag"); }, T.RADIAL_HOLD);
  }, true);
  for (const name of ["pointermove","pointerup","pointercancel"]) document.addEventListener(name, e => {
    if (!press || e.pointerId !== press.id) return;
    if (name === "pointercancel") { radialDispatch({ type: "cancel" }); return; }
    const point = { x: e.clientX, y: e.clientY }, end = name === "pointerup";
    if (end && radialModel) suppressClickUntil = performance.now() + 350;
    if (end && press.bar && Math.hypot(point.x - press.point.x, point.y - press.point.y) <= T.RADIAL_SLOP) {
      const original = press; clearRadialPress(); openRadial(original.target, original.point, "tap", false, true); return;
    }
    radialDispatch({ type: end ? "up" : "move", point });
    if (end) clearRadialPress();
  }, true);
  document.addEventListener("click", e => {
    if (performance.now() < suppressClickUntil && e.detail) { e.preventDefault(); e.stopImmediatePropagation(); suppressClickUntil = 0; }
  }, true);
  document.addEventListener("contextmenu", e => {
    const touch = e.pointerType === "touch" || e.sourceCapabilities?.firesTouchEvents;
    if (touch && e.target === blockContent && !T.LONG_PRESS_IN_FIELD) return;
    const target = radialTarget(e.target); if (!target && !radialModel) return;
    e.preventDefault();
    if (radialModel || touch) return;
    clearRadialPress(); openRadial(target, { x: e.clientX, y: e.clientY }, "tap");
  });
  function cancelRadial(reason) { if (radialModel || press) radialDispatch({ type: reason }); }
  document.addEventListener("scroll", event => {
    const positions = radialModel?.scrollPositions || press?.scrollPositions;
    if (!positions) return;
    const node = event.target === document ? document.scrollingElement : event.target;
    radialDispatch({ type: "scroll", previous: positions.get(node), x: node?.scrollLeft, y: node?.scrollTop });
  }, true);
  document.addEventListener("visibilitychange", () => { if (document.hidden) cancelRadial("hidden"); });
  for (const surface of [thumbBar, $(".structure-panel")]) surface.addEventListener("touchmove", e => {
    if (radialModel && e.touches.length === 1) e.preventDefault();
  }, { passive: false });

  function renderShortcutPanel() {
    const isMac = /Mac/.test(global.navigator.userAgentData?.platform || global.navigator.platform || "");
    const commitShortcut = SHORTCUTS.find(s => s.id === "block.commit");
    $("#commit-key-label").textContent = shortcutLabel(commitShortcut, isMac);
    $("#add-block").setAttribute("aria-keyshortcuts", ariaKeyshortcuts(commitShortcut, isMac));
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

  /* --- Autoguardado separado del borrador explícito --- */
  const AUTOSAVE_KEY = "tex-notes:autosave:v1";
  let pendingSession = null;
  let autosaveTimer;
  let autosaveReady = false;
  let backedUpSession = false;
  let announcedStorageError = false;
  try { const raw = JSON.parse(global.localStorage.getItem(AUTOSAVE_KEY)); const draft = normalizeDraft(raw); pendingSession = draft ? { ...raw, ...draft } : null; } catch { /* sin almacenamiento */ }
  const hasSessionContent = global.TexNotes.sessionHasContent;
  /* @decision DEC-019 ancla:0b9a8596 tramo:19
   * El autoguardado no escribe sesiones vacías ni reemplaza el borrador elegido.
   * Antes del primer reemplazo conserva la sesión anterior en una clave aparte.
   */
  function saveSession() {
    if (!autosaveReady) return;
    const type = $("#block-type").value;
    const session = { version: DRAFT_VERSION, savedAt: new Date().toISOString(), ...state(), editor: {
      type, title: $("#block-title").value, content: blockContent.value,
      editingPath: editorTarget().editing, parentPath: editorTarget().parent,
      image: blockFieldHooks.find((hook) => hook.appliesTo?.("image"))?.read("image"),
    } };
    if (!hasSessionContent(session)) return;
    try {
      if (!backedUpSession && hasSessionContent(pendingSession)) global.localStorage.setItem("tex-notes:autosave:previous", JSON.stringify(pendingSession));
      global.localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(session));
      backedUpSession = true;
    } catch {
      if (!announcedStorageError) { announce("No se pudo autoguardar la sesión; guarda o descarga tu trabajo."); announcedStorageError = true; }
    }
  }
  function scheduleSessionSave() { global.clearTimeout(autosaveTimer); autosaveTimer = global.setTimeout(saveSession, 800); }
  form.addEventListener("input", scheduleSessionSave);
  form.addEventListener("change", scheduleSessionSave);
  document.addEventListener("visibilitychange", () => { if (document.hidden) saveSession(); });
  global.addEventListener("pagehide", saveSession);
  if (hasSessionContent(pendingSession) && normalizeDraft(pendingSession)) {
    $("#autosave-banner").hidden = false;
    const savedDate = new Date(pendingSession.savedAt);
    const date = Number.isFinite(savedDate.getTime()) ? savedDate.toLocaleString("es-MX") : "fecha desconocida";
    $("#autosave-message").textContent = `Hay una sesión sin guardar del ${date} con ${countBlocks(pendingSession.blocks)} bloques.`;
  }
  $("#recover-session").addEventListener("click", () => {
    const draft = normalizeDraft(pendingSession);
    if (!draft) { announce("No hay una sesión válida para recuperar."); return; }
    cancelTemplateForStructuralChange();
    setDocumentMacros(draft.macros, false);
    rememberChange(); selectDocument(draft.documentId); setMetadata(draft.metadata); blocks = draft.blocks;
    const editor = pendingSession.editor || {};
    $("#block-type").value = blockType(editor.type) ? editor.type : "text";
    $("#block-title").value = typeof editor.title === "string" ? editor.title : "";
    blockContent.value = typeof editor.content === "string" ? editor.content : "";
    const paths = { editing: Array.isArray(editor.editingPath) ? editor.editingPath : [], parent: Array.isArray(editor.parentPath) ? editor.parentPath : [] };
    if (paths.parent.length && !acceptsChildren(blockAtPath(blocks, paths.parent)?.type)) paths.parent = [];
    for (const hook of blockFieldHooks) hook.fill?.({ ...blockDraft(), ...(editor.image || {}), type: $("#block-type").value });
    setEditorTarget(paths); renderBlocks(); renderEditorPreview(); focusBlockContent();
    $("#autosave-banner").hidden = true;
    paintVersions(knownVersions); announce("Sesión recuperada, incluido el bloque a medio escribir.");
  });
  $("#discard-session").addEventListener("click", () => {
    try { global.localStorage.removeItem(AUTOSAVE_KEY); } catch { /* la aplicación sigue disponible */ }
    pendingSession = null; $("#autosave-banner").hidden = true; focusBlockContent(); announce("Sesión anterior descartada.");
  });
  autosaveReady = true;

  function selectDocument(id) {
    documentId = id;
    try { localStorage.setItem(ACTIVE_DOCUMENT_KEY,id); } catch { /* sesión en memoria */ }
  }
  function focusId() {
    return document.activeElement.closest?.("article[data-block-id]")?.dataset.blockId ||
      blockAtPath(blocks,editorTarget().editing)?.id || null;
  }
  function syncHistoryButtons() {
    $("#undo-structure").disabled = !history.past.length; $("#redo-structure").disabled = !history.future.length;
  }
  function rememberChange(id = focusId(), previous = state()) {
    history = T.rememberHistory(history,T.historyEntry(previous,id));
    syncHistoryButtons();
  }
  function changeTree(next, id) { rememberChange(id); lastChangedId=id; blocks = next; }
  function loadVersionState(data, id, targetId) {
    form.inert=false;
    cancelTemplateForStructuralChange(); clearMacroForm();
    selectDocument(id); setDocumentMacros(data.macros,false); setMetadata(data.metadata); blocks=T.cloneBlocks(data.blocks);
    resetBlockEditor(); renderBlocks(); renderEditorPreview(); output.value=""; generatedSnapshot=null;
    $("#version-diff").hidden=true;
    if (!focusById("edit",targetId)) focusBlockContent();
    // Se persiste también la restauración de un estado vacío.
    if (!hasSessionContent(state())) {
      try { localStorage.removeItem(AUTOSAVE_KEY); } catch { /* almacenamiento no disponible */ }
    }
  }
  function travelStructure(direction) {
    const next=T.travelHistory(history,T.historyEntry(state(),focusId() || lastChangedId),direction);
    if (!next) { announce("No hay más cambios en esa dirección."); return; }
    history=next.history; syncHistoryButtons(); loadVersionState(next.entry.state,next.entry.documentId,next.entry.focusId);
    if (knownVersions) paintVersions(knownVersions);
    announce(direction==="undo" ? "Cambio estructural deshecho." : "Cambio estructural rehecho.");
  }
  committedMetadata=metadata();
  $("#metadata-details").addEventListener("change",event=>{
    const name=event.target.name;
    if (!METADATA_KEYS.includes(name) || committedMetadata[name]===event.target.value) return;
    const before=state(); before.metadata[name]=committedMetadata[name];
    rememberChange(focusId(),before); committedMetadata=metadata();
  });
  $("#undo-structure").addEventListener("click",()=>travelStructure("undo"));
  $("#redo-structure").addEventListener("click",()=>travelStructure("redo"));

  let knownVersions = [], persistenceRequest = null;
  const storageReady = T.openVersionStore(global);
  const versionStatus = message => { $("#version-status").textContent=message; };
  async function reportStorage(store, request=false) {
    if (request && !persistenceRequest) {
      persistenceRequest = Promise.resolve().then(()=>navigator.storage?.persist?.()).catch(()=>false);
    }
    let persistent=false, estimate={};
    try { persistent=Boolean(persistenceRequest ? await persistenceRequest : await navigator.storage?.persisted?.()); } catch {}
    try { estimate=(await navigator.storage?.estimate?.()) || {}; } catch {}
    const usage = Number.isFinite(estimate.usage) ? " Uso: " + (estimate.usage/1048576).toFixed(1) + " MiB" +
      (Number.isFinite(estimate.quota) ? " de " + (estimate.quota/1048576).toFixed(1) : "") + "." : "";
    $("#storage-status").textContent=(store.notice ? store.notice+" " : "")+(store.kind==="localStorage" ? "IndexedDB no disponible. Se usa localStorage (8 versiones automáticas por documento). " : "")+
      (persistent ? "Almacenamiento persistente concedido." : "Sin almacenamiento persistente confirmado. Exporta el proyecto con regularidad.")+usage;
  }
  const optionsFor=(origin,label="")=>({origin,label,createdAt:new Date().toISOString(),id:T.newId("v")+T.newId("")});
  function paintVersions(rows) {
    knownVersions=rows;
    const list=$("#version-list");
    const visible=T.newestFirst(rows.filter(v=>v.documentId===documentId || v.origin==="respaldo" || v.id==="borrador-guardado-migrado"));
    list.replaceChildren(...visible.map(v=>{
      const li=document.createElement("li"), title=document.createElement("p");
      title.textContent=[new Date(v.createdAt).toLocaleString("es-MX"), v.label || "Sin nombre", v.origin,
        v.summary.title || "Sin título", v.summary.blocks+" bloques"].join(" · ");
      li.append(title);
      for (const [key,label] of [["diff","Ver cambios"],["restore","Restaurar"],["rename","Renombrar"],["delete","Eliminar"]]) {
        const b=document.createElement("button"); b.type="button"; b.className="secondary";
        b.dataset.versionId=v.id; b.dataset.operation=key; b.textContent=label; b.setAttribute("aria-label",label+" · "+title.textContent); li.append(b);
      }
      return li;
    }));
    if (!visible.length) { const li=document.createElement("li"); li.textContent="Todavía no hay versiones."; list.append(li); }
  }
  let versionQueue=Promise.resolve();
  function withVersions(operation, exclusive=false) {
    const run=async()=>{
      const store=await storageReady;
      if (exclusive) form.inert=true;
      try { return await operation(store); } finally { if (exclusive) form.inert=false; }
    };
    versionQueue=versionQueue.then(run).catch(error=>{
      versionStatus("No se completó la operación de versiones. "+(error?.message || "Almacenamiento no disponible."));
    });
    return versionQueue;
  }
  function saveExportVersion(snapshot) {
    withVersions(async store=>{
      const rows=await store.update(all=>T.addVersion(all,snapshot,optionsFor("exportación"),store.limit));
      paintVersions(rows); void reportStorage(store,true);
    });
  }
  $("#save-version").addEventListener("click",()=>{
    const snapshot=state(), label=$("#version-label").value.trim(), options=optionsFor("manual",label);
    withVersions(async store=>{
      paintVersions(await store.update(all=>T.addVersion(all,snapshot,options,store.limit)));
      if ($("#version-label").value.trim()===label) $("#version-label").value="";
      versionStatus("Versión guardada."); void reportStorage(store,true);
    });
  });
  function describeDiff(diff) {
    const lines=[];
    for (const [key,label] of [["added","Añadido"],["removed","Eliminado"],["moved","Movido"],["modified","Modificado"]]) {
      for (const item of diff[key]) {
        lines.push(label+" · "+(item.title || blockLabel(item.type))+" ("+item.id+")");
        if (item.from) lines.push("  "+(item.from.parent||"Raíz")+" · "+(item.from.position+1)+" → "+(item.to.parent||"Raíz")+" · "+(item.to.position+1));
        if (item.fields) lines.push("  "+item.fields.map(k=>({title:"título",type:"tipo",content:"contenido",options:"opciones",listFormat:"formato de lista"})[k]).join(", "));
        if (item.lines?.truncated) lines.push("  Diferencia por líneas omitida por tamaño.");
        for (const line of item.lines?.changes||[]) lines.push("  "+(line.kind==="added"?"+ ":"− ")+line.line+" "+line.text);
      }
    }
    for (const [key,label] of [["metadata","Metadato"],["macros","Macro"]]) for (const change of diff[key]) {
      lines.push(label+" "+change.key+": "+JSON.stringify(change.before??null)+" → "+JSON.stringify(change.after??null));
    }
    return lines.join("\n") || "Sin cambios respecto a esta versión.";
  }
  $("#version-list").addEventListener("click",event=>{
    const button=event.target.closest("button[data-version-id]"); if (!button) return;
    const id=button.dataset.versionId, op=button.dataset.operation;
    if (op==="delete" && !confirm("¿Eliminar esta versión guardada?")) return;
    const current=knownVersions.find(v=>v.id===id);
    const label=op==="rename" ? global.prompt("Nombre de la versión",current?.label || "") : null;
    if (op==="rename" && label===null) return;
    withVersions(async store=>{
      const get=all=>{const row=all.find(v=>v.id===id); if(!row) throw Error("La versión ya no existe."); return row;};
      if (op==="diff") {
        const row=get(await store.read()), panel=$("#version-diff");
        panel.textContent=describeDiff(T.diffDocuments(row.state,state())); panel.hidden=false; panel.focus(); return;
      }
      const snapshot=state(), currentFocus=focusId();
      let restored;
      const rows=await store.update(all=>{
        const row=get(all);
        if (op==="delete") return all.filter(v=>v.id!==id);
        if (op==="rename") return all.map(v=>v.id===id?{...v,label:label.trim()}:v);
        restored=row;
        return T.addVersion(all,snapshot,optionsFor("respaldo","Antes de restaurar"),store.limit);
      });
      if (restored) {
        rememberChange(currentFocus,snapshot); loadVersionState(restored.state,restored.documentId,currentFocus);
      }
      paintVersions(rows); versionStatus(restored?"Versión restaurada. Se guardó un respaldo.":op==="rename"?"Versión renombrada.":"Versión eliminada.");
      if (!restored) $("#save-version").focus();
    },op==="restore");
  });
  $("#export-project").addEventListener("click",()=>{
    const snapshot=state(), config=$("#project-config").checked ? JSON.parse(JSON.stringify(portableConfig())) : null;
    withVersions(async store=>{
      let versions=[], warning="";
      try { versions=(await store.read()).filter(v=>v.documentId===snapshot.documentId); }
      catch { warning=" No se pudieron incluir las versiones almacenadas."; }
      T.downloadProject({kind:"notas-latex-proyecto",version:1,exportedAt:new Date().toISOString(),documentId:snapshot.documentId,
        current:T.documentSnapshot(snapshot),versions,...(config?{config}:{})});
      versionStatus("Proyecto exportado."+warning); void reportStorage(store,true);
    });
  });
  $("#import-project").addEventListener("change",async event=>{
    const field=event.target, file=field.files[0]; if (!file) return;
    let checked;
    try { checked=T.validateProject(await file.text()); } catch { checked={error:"No se pudo leer el archivo."}; }
    field.value="";
    if (checked.error) { versionStatus(checked.error); return; }
    const {project,skipped}=checked;
    withVersions(async store=>{
      const snapshot=state(), currentFocus=focusId();
      const rows=await store.update(all=>T.addVersion(T.mergeVersions(all,project.versions),snapshot,optionsFor("respaldo","Antes de importar"),store.limit));
      rememberChange(currentFocus,snapshot); loadVersionState(project.current,project.documentId,null);
      if (project.config) applyPortableConfig(project.config,false);
      paintVersions(rows); void reportStorage(store,true);
      versionStatus("Proyecto importado con respaldo previo."+(skipped.length?" Versiones omitidas: "+skipped.join(", ")+".":""));
    },true);
  });
  withVersions(async store=>{
    const legacy=readWritingStorage(STORAGE_KEY,null) || readWritingStorage(LEGACY_STORAGE_KEY,null);
    let rows;
    if (legacy) {
      let migrated;
      rows=await store.update(all=>{
        migrated=T.migrateSingleDraft(all,legacy,{documentId,createdAt:new Date().toISOString()});
        return migrated?.rows || all;
      });
      if (migrated) {
        try { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(LEGACY_STORAGE_KEY); } catch { /* la migración es idempotente */ }
        versionStatus("Borrador guardado (migrado) disponible en Versiones.");
      } else versionStatus("El borrador anterior es ilegible. Se conserva su copia original.");
    } else rows=await store.read();
    paintVersions(rows); void reportStorage(store);
  });
  selectDocument(documentId);

  renderShortcutPanel();
  renderSymbolBoard();
  renderBlocks();
  setEditorTarget({});
  renderEditorPreview();
})(typeof globalThis !== "undefined" ? globalThis : this);
