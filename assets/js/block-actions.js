/** Acciones estructurales y recuperación del foco según el resultado de la operación. */
(function (T) {
  "use strict";
  T.bindBlockControls = function (list) {
    list.addEventListener("click", event => {
      const button = event.target.closest("button[data-action]");
      if (!button || button.getAttribute("aria-disabled") === "true") return;
      T.runAction("block." + button.dataset.action, { path: T.keyToPath(button.dataset.path), button, keyboard: !T.isPointerClick(event) }, { source: "card" });
    });
    list.addEventListener("keydown", event => {
      if (!event.altKey || !event.shiftKey || event.ctrlKey || event.metaKey) return;
      const action = { ArrowRight: "indent", ArrowLeft: "outdent" }[event.key];
      const button = event.target.closest("button, summary");
      const card = button?.closest("article[data-path]");
      if (!action || !card) return;
      event.preventDefault();
      T.runAction("block." + action, { path: T.keyToPath(card.dataset.path), button, keyboard: true }, { source: "card" });
    });
  };

  T.createMoveAnnouncements = function (doc, outlineSettings, announce) {
    const line = doc.querySelector("#structure-move-status");
    function show(summary, detail = "") {
      line.hidden = false;
      line.textContent = summary;
      announce(detail ? detail + " " + summary : summary);
    }
    return {
      error: show,
      moved(beforeBlocks, afterBlocks, path, detail = "") {
        const settings = outlineSettings();
        const before = T.outlineEntries({ blocks: beforeBlocks, ...settings });
        const after = T.outlineEntries({ blocks: afterBlocks, ...settings });
        const index = after.findIndex(entry => entry.key === T.pathToKey(path));
        if (index > 0) after.unshift(...after.splice(index, 1));
        show(T.diffOutline(before, after).summary, detail.trim());
      },
    };
  };

  T.createBlockActions = function (doc, deps) {
    const $ = selector => doc.querySelector(selector);
    const { getBlocks, focusType, setTray, renderBlocks, announce, convertLegacyBlock, openMenu, loadBlockEditor,
      cancelTemplateForStructuralChange, clearBlockFields, setEditorTarget, describeBlock, cancelEditForStructuralChange,
      changeTree, editorTarget, focusById, focusAction, updateTrayControls, copyToClipboard, focusAfterRemoval, moveAnnouncements } = deps;
    const { blockAtPath, countBlocks, duplicateBlock, cloneBlock, removeBlock, moveBlock, indentBlock, outdentBlock } = T;
    const movements = {
      up: (blocks, path) => moveBlock(blocks, path, -1),
      down: (blocks, path) => moveBlock(blocks, path, 1),
      indent: indentBlock, outdent: outdentBlock,
    };
    return async function (action, path, button, keyboard = false) {
      const blocks = getBlocks();
      const block = blockAtPath(blocks, path);
      if (!block) { renderBlocks(); $("#add-block").focus(); announce("Ese bloque ya no existe; la lista se actualizó."); return; }
      if (action === "convert-bibliography") { convertLegacyBlock(path); return; }

      if (action === "context") { openMenu(button, path, keyboard); return; }
      if (action === "edit") {
        loadBlockEditor(block, path);
        focusType(true);
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

      const result = movements[action]?.(blocks, path);
      if (!result || result.error) {
        button.focus();
        moveAnnouncements.error(result?.error || "El bloque ya está en el extremo de sus hermanos.");
        return;
      }
      const cancelled = cancelEditForStructuralChange();
      changeTree(result.blocks, block.id); renderBlocks(); setEditorTarget(editorTarget());
      focusAction(action, result.path);
      moveAnnouncements.moved(blocks, result.blocks, result.path, cancelled);
    };
  };
})(globalThis.TexNotes);
