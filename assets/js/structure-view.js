(function (T) {
  "use strict";
  T.createStructureView = function (document, deps) {
    const { getBlocks, getTarget, refreshTargets, describeBlock, renderBlockPreview, blockItemExtensions, syncReferenceKey, saveSession } = deps;
    const { pathToKey, acceptsChildren } = T;
    const $ = selector => document.querySelector(selector);
    const blockList = $("#block-list");
    const coarse = document.defaultView.matchMedia("(pointer: coarse)");
    const resize = new ResizeObserver(entries => {
      for (const { target } of entries) updateDisclosure(target);
    });
    function updateDisclosure(preview) {
      const toggle = preview.nextElementSibling;
      if (!toggle?.classList.contains("preview-toggle")) return;
      toggle.hidden = !coarse.matches || (!preview.classList.contains("expanded") && preview.scrollHeight <= preview.clientHeight + 1);
    }
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
      heading.textContent = coarse.matches ? T.pathLabel(path) + " · " + T.blockLabel(block.type) + (block.title ? ": " + block.title : "") : describeBlock(block, path);
      // El nivel y el padre se escriben, no solo se sugieren con la sangría.
      const meta = document.createElement("p");
      meta.className = "block-meta";
      meta.textContent = `Nivel ${path.length} · ${where}`;
      if (coarse.matches) meta.textContent = "N" + path.length + " · " + (parent ? T.pathLabel(parentPath) : "raíz");
      const target = getTarget(block.label);
      if (target) meta.textContent += " · " + target.word + (target.number === null ? "" : " " + target.number) + " · " + target.label;
      const preview = document.createElement("div");
      preview.className = "block-preview";
      renderBlockPreview(preview, block, { parentPath, structure: true });
      const toggle = document.createElement("button");
      toggle.type = "button"; toggle.className = "preview-toggle"; toggle.textContent = "Ver todo"; toggle.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      toggle.addEventListener("click", () => {
        const expanded = preview.classList.toggle("expanded");
        toggle.setAttribute("aria-expanded", String(expanded)); toggle.textContent = expanded ? "Ver menos" : "Ver todo";
      });
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
      const move = actionButton("Mover a…", "move", path, "Mover a… · Bloque " + subject);
      move.setAttribute("aria-haspopup", "dialog"); more.append(move);
      for (const id of ["convert-bibliography", "template"]) {
        const command = T.actionById("block." + id);
        const name = command.label;
        const btn = actionButton(name, id, path, name + " · " + subject, command.enabled && !command.enabled({ type: block.type }));
        if (id !== "convert-bibliography") btn.setAttribute("aria-haspopup", "dialog");
        more.append(btn);
      }
      disclosure.append(summary, more);
      if (coarse.matches) {
        for (const button of actions.children) button.textContent = T.actionById("block." + button.dataset.action).icon;
        const menu = actionButton("⋯", "context", path, "Acciones para " + subject);
        menu.setAttribute("aria-haspopup", "menu"); actions.append(menu);
      } else actions.append(disclosure);
      const head = document.createElement("div"); head.className = "card-heading"; head.append(heading, meta);
      article.append(head, preview, toggle, actions);
      if (coarse.matches) resize.observe(preview);
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
      const blocks = getBlocks();
      resize.disconnect();
      refreshTargets(blocks);
      blockList.replaceChildren();
      $("#empty-blocks").hidden = blocks.length > 0;
      blocks.forEach((block, index) => blockList.append(blockItem(block, [index], null, [], blocks.length)));
      syncReferenceKey();
      saveSession();
    }

    /** Devuelve true si existe y es enfocable; permite encadenar alternativas. */
    function focusAction(action, path) {
      const button = blockList.querySelector(`button[data-action="${action}"][data-path="${pathToKey(path)}"]`);
      if (!button || button.disabled) return false;
      deps.reveal(button);
      let disclosure = button.closest("details");
      while (disclosure) { disclosure.open = true; disclosure = disclosure.parentElement.closest("details"); }
      button.focus();
      return document.activeElement === button || (action !== "edit" && focusAction("edit", path));
    }
    function focusById(action, id) {
      const path = T.pathOfId(getBlocks(), id);
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

    coarse.addEventListener("change", renderBlocks);
    return { dispose() { resize.disconnect(); coarse.removeEventListener("change", renderBlocks); }, refresh: renderBlocks, actionButton, renderBlocks, focusAction, focusAfterRemoval, focusById };
  };
})(globalThis.TexNotes);
