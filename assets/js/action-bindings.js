(function (T) {
  "use strict";
  T.createActionBindings = function (doc, d) {
    const $ = selector => doc.querySelector(selector);
    function cardAction(id, args) {
      const path = args.path || d.editorTarget().editing;
      const card = Array.from($("#block-list").querySelectorAll("article")).find(a => a.dataset.path === T.pathToKey(path));
      const button = args.button || card?.querySelector('[data-action="' + id + '"]') || card?.querySelector("button");
      if (button) return d.handleBlockAction(id, path, button, args.keyboard);
    }
    function openMenu(args, source = "editor") {
      const button = args.button || $(source === "global" ? "#global-menu" : "#content-menu");
      d.radial.openAtButton(button, args.target || { source, button }, args.keyboard);
    }
    function deleteImage() {
      const path = d.editorTarget().editing, block = d.getBlock(path);
      if (!block) return d.announce("Guarda la imagen antes de eliminarla de la estructura.");
      if (!block.children.length && !doc.defaultView.confirm("¿Eliminar " + d.describeBlock(block, path) + "?")) return;
      return cardAction("delete", { path });
    }
    const handlers = Object.fromEntries(T.actionsFor("card").map(a => [a.id, args => cardAction(a.id.slice(6), args)]));
    return Object.assign(handlers, {
      "block.move": args => d.openMove(args.path || d.editorTarget().editing),
      "block.template": args => d.saveBlockTemplate(args.path || d.editorTarget().editing),
      "block.pasteInside": args => d.pasteBlock(args.path || d.editorTarget().editing),
      "radial.menu": args => openMenu(args),
      "radial.shiftMenu": args => openMenu(args),
      "radial.global": args => openMenu(args, "global"),
      "block.commit": args => { d.closeAssistMenu(); if (args.keepFieldFocus) d.closeSymbolSheet(); d.commitBlock(args.keepFieldFocus); },
      "write.previous": () => d.thumbStep(-1),
      "write.next": () => d.thumbStep(1),
      "write.scope": d.toggleScope,
      "write.symbols": args => d.toggleSymbols(args.keyboard),
      "write.list": () => T.blockType($("#block-type").value)?.kind === "list" ? d.shiftListSelection(1) : d.putSnippet("\\begin{itemize}\n\\item #1\n\\end{itemize}#0"),
      "write.title": d.blockForm.showTitle,
      "edit.undo": () => doc.execCommand("undo"),
      "edit.redo": () => doc.execCommand("redo"),
      "structure.undo": () => d.travelStructure("undo"),
      "structure.redo": () => d.travelStructure("redo"),
      "image.width": ({ value = 80 }) => { const field = $("#image-width"); field.value = value; field.dispatchEvent(new Event("input", { bubbles: true })); },
      "image.align": ({ value = "center" }) => Array.from(doc.getElementsByName("imageAlign")).find(n => n.value === value)?.click(),
      "image.file": () => $("#image-file").click(),
      "image.delete": deleteImage,
      "block.type": ({ value }, origin) => { if (!value) return d.blockForm.pickType(); if (origin.source === "global") d.resetBlockEditor(); d.selectBlockType(value); d.focusBlockContent(); },
      "block.typePicker": d.blockForm.pickType,
      "navigation.go": ({ value = "content" }) => d.goTo(value),
      "navigation.preferences": () => d.goTo("preferences"),
      "list.indent": () => d.shiftListSelection(1),
      "list.outdent": () => d.shiftListSelection(-1),
      "symbols.open": ({ value }) => { d.openSymbolSearch($("#block-content")); if (value) d.selectSymbolCategory(value); },
      "symbols.toggle": ({ field = doc.activeElement }) => {
        d.closeAssistMenu();
        if (field.closest(".symbol-board")) d.returnToSymbolOrigin(); else d.openSymbolSearch(field);
      },
      "symbols.escape": ({ field = doc.activeElement }) => {
        if (field.id === "symbol-search" && field.value) { field.value = ""; d.updateSymbolSearch(); }
        else d.returnToSymbolOrigin();
      },
      "symbols.firstResult": () => d.focusSymbolAt(0),
      "symbols.search": () => $("#symbol-search").focus(),
      "symbols.previousGroup": ({ index = 0 }) => d.changeSymbolGroup(-1, index),
      "symbols.nextGroup": ({ index = 0 }) => d.changeSymbolGroup(1, index),
    });
  };
})(globalThis.TexNotes);
