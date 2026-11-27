/** Acciones estructurales y recuperación del foco según el resultado de la operación. */
(function (T) {
  "use strict";
  T.createBlockActions = function (doc, deps) {
    const $ = selector => doc.querySelector(selector);
    const { getBlocks, focusType, setTray, renderBlocks, announce, convertLegacyBlock, openMenu, loadBlockEditor,
      cancelTemplateForStructuralChange, clearBlockFields, setEditorTarget, describeBlock, cancelEditForStructuralChange,
      changeTree, editorTarget, focusById, updateTrayControls, copyToClipboard, focusAfterRemoval } = deps;
    const { blockAtPath, countBlocks, duplicateBlock, cloneBlock, removeBlock, moveBlock } = T;
    return async function (action, path, button, keyboard = false) {
      const blocks = getBlocks();
      const block = blockAtPath(blocks, path);
      if (!block) { renderBlocks(); $("#add-block").focus(); announce("Ese bloque ya no existe; la lista se actualizó."); return; }
      if (action === "convert-bibliography") { convertLegacyBlock(path); return; }

      if (action === "context") { openMenu(button, path, keyboard); return; }
      if (action === "edit") {
        loadBlockEditor(block, path);
        focusType();
        announce(`Editando ${describeBlock(block, path)}.`);
        return;
      }
      if (action === "child") {
        cancelTemplateForStructuralChange();
        clearBlockFields(); setEditorTarget({ parent: path }); focusType();
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
        const tray = { block: cloneBlock(block) };
        setTray(tray.block ? tray : null);
        if (!tray.block) { button.focus(); announce("No se pudo copiar ese bloque."); return; }
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
    };
  };
})(globalThis.TexNotes);
