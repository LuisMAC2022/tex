(function (T) {
  "use strict";
  T.createMoveDialog = function (document, deps) {
    const $ = selector => document.querySelector(selector), events = new AbortController(), options = {signal:events.signal};
    const { blockAtPath, pathToKey, keyToPath, acceptsChildren } = T;
    const { getBlocks, describeBlock, editorTarget, cancelEditForStructuralChange, changeTree, renderBlocks,
      setEditorTarget, renderEditorPreview, focusById, pathLabel, announce } = deps;
    const { flattenBlocks, moveBlockTo } = T;
    const moveDialog = $("#move-block-dialog");
    const moveDestination = $("#move-block-destination");
    const movePosition = $("#move-block-position");
    let movingPath = [];

    function openMove(path) {
      const subject = describeBlock(blockAtPath(getBlocks(), path), path);
      movingPath = path;
      const sourceKey = pathToKey(path);
      const options = [moveDestination.options[0]];
      for (const { block, path: parentPath } of flattenBlocks(getBlocks())) {
        const key = pathToKey(parentPath);
        if (!acceptsChildren(block.type) || key === sourceKey || key.startsWith(`${sourceKey}.`)) continue;
        options.push(new Option(describeBlock(block, parentPath), key));
      }
      $("#move-block-subject").textContent = `Bloque ${subject}`;
      moveDestination.replaceChildren(...options);
      const touch = document.defaultView.matchMedia("(pointer: coarse)").matches;
      moveDestination.size = touch && options.length > 1 ? Math.min(5, options.length) : 1;
      moveDestination.value = pathToKey(path.slice(0, -1));
      movePosition.value = "end";
      moveDialog.showModal();
    }

    $("#move-block-cancel").addEventListener("click", () => moveDialog.close(), options);
    $("#move-block-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const position = movePosition.value === "start" ? 0 : undefined;
      const movedId = blockAtPath(getBlocks(), movingPath)?.id;
      const result = moveBlockTo(getBlocks(), movingPath, keyToPath(moveDestination.value), position);
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
    }, options);
    return {open:openMove, dispose() { events.abort(); if (moveDialog.open) moveDialog.close(); }};
  };
})(globalThis.TexNotes);
