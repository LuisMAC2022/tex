(function (T) {
  "use strict";
  T.createBlockForm = function (doc, deps) {
    const $ = selector => doc.querySelector(selector);
    const { getBlock, describeBlock, describeLocation, updateTrayControls, blockFieldHooks, renderEditorPreview, cancelTemplateForStructuralChange } = deps;
    const { keyToPath, pathToKey, pathLabel } = T;
    const mobile = doc.defaultView.matchMedia("(pointer: coarse)");
    const type = $("#block-type"), title = $("#block-title"), typeChip = $("#type-chip"), titleChip = $("#title-chip");
    const nativeType = $("#native-type-field"), nativeTitle = $("#native-title-field");
    let titleExpanded = false, nativePicker = false;
    function refresh() {
      const label = T.blockLabel(type.value), image = T.blockType(type.value)?.kind === "image";
      typeChip.textContent = "¶ " + label + " ▾";
      typeChip.setAttribute("aria-label", "Tipo de bloque: " + label);
      titleChip.textContent = image ? "＋ Pie" : "＋ Título";
      titleChip.setAttribute("aria-label", image ? "Añadir pie" : "Añadir título");
      nativeTitle.hidden = mobile.matches && !title.value && !titleExpanded;
      titleChip.hidden = !nativeTitle.hidden;
      const clipped = mobile.matches && !nativePicker;
      nativeType.classList.toggle("native-clipped", clipped);
      if (clipped) { type.tabIndex = -1; type.setAttribute("aria-hidden", "true"); }
      else { type.removeAttribute("tabindex"); type.removeAttribute("aria-hidden"); }
    }
    function showTitle() { deps.reveal(title); titleExpanded = true; refresh(); title.focus(); }
    function focusType() { const field = mobile.matches ? typeChip : type; deps.reveal(field); field.focus(); }
    function pickType() {
      if (mobile.matches && typeof type.showPicker === "function") {
        try { type.showPicker(); return; } catch { /* Se ofrece el control nativo visible. */ }
      }
      nativePicker = mobile.matches; refresh(); type.focus();
    }
    const events = new AbortController(), options = { signal: events.signal };
    titleChip.addEventListener("click", showTitle, options);
    title.addEventListener("blur", () => { titleExpanded = Boolean(title.value); refresh(); }, options);
    type.addEventListener("change", () => { nativePicker = false; refresh(); }, options);
    type.addEventListener("blur", () => { nativePicker = false; refresh(); }, options);
    mobile.addEventListener("change", refresh, options);
    refresh();
    function editorTarget() {
      return { editing: keyToPath($("#editing-path").value), parent: keyToPath($("#parent-path").value) };
    }
    function setEditorTarget({ editing = [], parent = [] } = {}) {
      refresh();
      const editingBlock = editing.length ? getBlock(editing) : null;
      // Una ruta que ya no resuelve se descarta: el formulario nunca queda
      // apuntando a un nodo inexistente tras un borrado o un movimiento.
      const parentPath = !editingBlock && parent.length && getBlock(parent) ? parent : [];
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
      titleExpanded = false; refresh();
      for (const hook of blockFieldHooks) hook.clear?.();
      $("#block-error").textContent = ""; $("#block-content").removeAttribute("aria-invalid");
      renderEditorPreview();
    }
    function resetBlockEditor() { clearBlockFields(); setEditorTarget({}); }

    /* @decision DEC-018 ancla:a8b1aa78 tramo:4
     * Asignar el selector no emite change. El evento explícito sincroniza imagen,
     * herramientas de listas y vista previa cuando el tipo viene del menú /.
     */
    function selectBlockType(typeId) {
      $("#block-type").value = typeId;
      $("#block-type").dispatchEvent(new Event("change", { bubbles: true }));
    }

    function loadBlockEditor(block, path) {
      cancelTemplateForStructuralChange();
      $("#block-type").value = block.type; $("#block-title").value = block.title; $("#block-content").value = block.content;
      titleExpanded = Boolean(block.title); refresh();
      for (const hook of blockFieldHooks) hook.fill?.(block);
      $("#block-error").textContent = ""; $("#block-content").removeAttribute("aria-invalid");
      setEditorTarget({ editing: path }); renderEditorPreview();
    }
    return { refresh, dispose: () => events.abort(), focusType, showTitle, pickType, loadBlockEditor, editorTarget, setEditorTarget, clearBlockFields, resetBlockEditor, selectBlockType };
  };
})(globalThis.TexNotes);
