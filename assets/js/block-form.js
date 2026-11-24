(function (T) {
  "use strict";
  T.createBlockForm = function (doc, deps) {
    const $ = selector => doc.querySelector(selector);
    const { getBlock, describeBlock, describeLocation, updateTrayControls, blockFieldHooks, renderEditorPreview } = deps;
    const { keyToPath, pathToKey, pathLabel } = T;
    function editorTarget() {
      return { editing: keyToPath($("#editing-path").value), parent: keyToPath($("#parent-path").value) };
    }
    function setEditorTarget({ editing = [], parent = [] } = {}) {
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

    return { editorTarget, setEditorTarget, clearBlockFields, resetBlockEditor, selectBlockType };
  };
})(globalThis.TexNotes);
