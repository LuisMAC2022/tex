(function (global) {
  "use strict";
  const {
    METADATA_KEYS, blockLabel, generateLatex, downloadTex,
    MATH_SYMBOLS, MATH_SYMBOL_GROUPS, filterMathSymbols, symbolAccessibleName, symbolsByGroup, insertIntoField,
  } = global.TexNotes;

  const STORAGE_KEY = "tex-notes:draft:v1";
  const $ = (selector) => document.querySelector(selector);
  const form = $("#document-form");
  const blockList = $("#block-list");
  const output = $("#latex-output");
  const status = $("#app-status");
  let blocks = [];

  function metadata() {
    return Object.fromEntries(METADATA_KEYS.map((name) => [name, form.elements[name].value]));
  }
  function state() { return { metadata: metadata(), blocks: blocks.map((block) => ({ ...block })) }; }
  function announce(message) { status.textContent = message; }
  function setMetadata(values = {}) {
    for (const name of METADATA_KEYS) form.elements[name].value = typeof values[name] === "string" ? values[name] : "";
  }
  function resetBlockEditor() {
    $("#editing-index").value = ""; $("#block-title").value = ""; $("#block-content").value = "";
    $("#add-block").textContent = "Añadir bloque"; $("#cancel-edit").hidden = true; $("#block-form-heading").textContent = "Nuevo bloque";
  }
  function actionButton(label, action, index, disabled = false) {
    const button = document.createElement("button"); button.type = "button"; button.textContent = label; button.dataset.action = action; button.dataset.index = index; button.disabled = disabled; return button;
  }
  function renderBlocks(focus = null) {
    blockList.replaceChildren(); $("#empty-blocks").hidden = blocks.length > 0;
    blocks.forEach((block, index) => {
      const item = document.createElement("li"); const article = document.createElement("article"); const heading = document.createElement("h4");
      heading.textContent = `${blockLabel(block.type)}${block.title ? `: ${block.title}` : ""}`;
      const preview = document.createElement("p"); preview.textContent = block.content || "(Bloque vacío)";
      const actions = document.createElement("menu"); actions.className = "block-actions"; actions.setAttribute("aria-label", `Acciones para bloque ${index + 1}`);
      [["Editar", "edit", false], ["Eliminar", "delete", false], ["Subir", "up", index === 0], ["Bajar", "down", index === blocks.length - 1]].forEach(([label, action, disabled]) => actions.append(actionButton(label, action, index, disabled)));
      article.append(heading, preview, actions); item.append(article); blockList.append(item);
    });
    if (focus && blocks.length) blockList.querySelector(`[data-action="${focus.action}"][data-index="${focus.index}"]`)?.focus();
  }
  function validateBlock() {
    const field = $("#block-content"); const error = $("#block-error");
    if (!field.value.trim()) { error.textContent = "Escribe contenido antes de incorporar el bloque."; field.setAttribute("aria-invalid", "true"); field.focus(); return false; }
    error.textContent = ""; field.removeAttribute("aria-invalid"); return true;
  }

  $("#add-block").addEventListener("click", () => {
    if (!validateBlock()) return;
    const block = { type: $("#block-type").value, title: $("#block-title").value, content: $("#block-content").value };
    const editing = $("#editing-index").value;
    if (editing === "") { blocks.push(block); announce(`Bloque ${blocks.length} añadido.`); } else { blocks[Number(editing)] = block; announce(`Bloque ${Number(editing) + 1} actualizado.`); }
    resetBlockEditor(); renderBlocks(); $("#block-type").focus();
  });
  $("#cancel-edit").addEventListener("click", () => { resetBlockEditor(); $("#block-type").focus(); announce("Edición cancelada."); });
  blockList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]"); if (!button) return;
    const index = Number(button.dataset.index); const action = button.dataset.action;
    if (action === "edit") {
      const block = blocks[index]; $("#block-type").value = block.type; $("#block-title").value = block.title; $("#block-content").value = block.content; $("#editing-index").value = index;
      $("#add-block").textContent = "Guardar cambios"; $("#cancel-edit").hidden = false; $("#block-form-heading").textContent = `Editar bloque ${index + 1}`; $("#block-type").focus(); announce(`Editando el bloque ${index + 1}.`); return;
    }
    if (action === "delete") { blocks.splice(index, 1); renderBlocks(blocks.length ? { action: "delete", index: Math.min(index, blocks.length - 1) } : null); if (!blocks.length) $("#add-block").focus(); announce(`Bloque ${index + 1} eliminado.`); return; }
    const target = action === "up" ? index - 1 : index + 1; [blocks[index], blocks[target]] = [blocks[target], blocks[index]]; renderBlocks({ action, index: target }); announce(`Bloque movido a la posición ${target + 1}.`);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault(); const title = $("#note-title");
    if (!title.value.trim()) { $("#title-error").textContent = "Escribe un título para generar el documento."; title.setAttribute("aria-invalid", "true"); title.focus(); announce("No se generó el documento: falta el título."); return; }
    $("#title-error").textContent = ""; title.removeAttribute("aria-invalid"); output.value = generateLatex(state()); announce("Documento generado.");
  });
  $("#save-draft").addEventListener("click", () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, ...state() })); announce("Borrador guardado únicamente en este dispositivo."); } catch { announce("No se pudo guardar el borrador; el contenido actual se conserva."); } });
  $("#restore-draft").addEventListener("click", () => {
    try { const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY)); if (!parsed || parsed.version !== 1 || !parsed.metadata || !Array.isArray(parsed.blocks)) throw new Error(); setMetadata(parsed.metadata); blocks = parsed.blocks.filter((block) => block && typeof block.content === "string" && typeof block.type === "string").map((block) => ({ type: block.type, title: typeof block.title === "string" ? block.title : "", content: block.content })); resetBlockEditor(); renderBlocks(); $("#note-title").focus(); announce("Borrador restaurado."); } catch { $("#restore-draft").focus(); announce("No hay un borrador válido para restaurar."); }
  });
  $("#delete-draft").addEventListener("click", () => { if (!confirm("¿Borrar el borrador guardado en este dispositivo?")) { $("#delete-draft").focus(); announce("No se borró el borrador."); return; } localStorage.removeItem(STORAGE_KEY); $("#save-draft").focus(); announce("Borrador guardado eliminado; el contenido actual se conserva."); });
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
})(typeof globalThis !== "undefined" ? globalThis : this);
