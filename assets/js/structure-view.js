(function (T) {
  "use strict";
  T.createStructureView = function (document, deps) {
    const { getBlocks, getTarget, refreshTargets, getTopic, renderBlockPreview, blockItemExtensions, syncReferenceKey, saveSession } = deps;
    const { pathToKey, acceptsChildren } = T;
    const $ = selector => document.querySelector(selector);
    const blockList = $("#block-list");
    const icons = { text: "¶", equation: "∑", "math-inline": "ƒ", definition: "≔", theorem: "⊢",
      proposition: "⇒", proof: "∎", example: "◇", note: "✧", itemize: "•",
      enumerate: "№", bibliography: "▤", image: "▧" };
    const coarse = document.defaultView.matchMedia("(pointer: coarse)");
    const desktop = T.desktopCardsMedia(document);
    const disposeDesktopCards = T.createDesktopCards(document, blockList, desktop);
    const mode = $("#structure-mode"), search = $("#structure-search"), results = $("#structure-results");
    const win = document.defaultView, key = "tex-notes:structure:v1";
    const normalize = value => value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
    let settings = {};
    try { settings = JSON.parse(win.localStorage.getItem(key)) || {}; } catch { /* Sesión en memoria. */ }
    mode.value = settings.mode === "outline" ? "outline" : "cards";
    const collapsed = new Set(Array.isArray(settings.collapsed) ? settings.collapsed : []);
    const expanded = new Set(Array.isArray(settings.expanded) ? settings.expanded : []);
    const rows = new Map();
    let entries = new Map();

    function blockLabelParts(block, path) {
      const entry = entries.get(pathToKey(path));
      const { badge, text, warning } = T.outlineLabel(entry, block);
      // El rótulo de teorema ya empieza por el nombre que muestra la insignia.
      return { badge, text: entry?.kind === "theorem" ? text.slice(badge.length + 1) : text, warning };
    }
    function describeBlock(block, path) {
      const { badge, text } = blockLabelParts(block ?? T.blockAtPath(getBlocks(), path), path);
      return text ? badge + " " + text : badge;
    }
    function persist() {
      try { win.localStorage.setItem(key, JSON.stringify({ mode: mode.value, collapsed: [...collapsed], expanded: [...expanded] })); }
      catch { /* Sesión en memoria. */ }
    }
    function syncSelection() {
      const editing = $("#editing-path").value;
      for (const { article } of rows.values()) {
        if (editing && article.dataset.path === editing) article.setAttribute("aria-current", "true");
        else article.removeAttribute("aria-current");
      }
    }
    const selection = new MutationObserver(syncSelection);
    selection.observe($("#editing-path"), { attributes: true, attributeFilter: ["value"] });

    function filter() {
      const words = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
      const searching = words.length > 0;
      let matches = 0;
      for (const { item, article, nested, branch, block, label, searchable } of [...rows.values()].reverse()) {
        const matched = !searching || words.every(word => searchable.includes(word));
        if (matched) matches += 1;
        item.hidden = !matched && !Array.from(nested?.children || []).some(child => !child.hidden);
        article.classList.toggle("search-context", searching && !matched);
        if (nested) {
          nested.hidden = searching ? false : collapsed.has(block.id);
          branch.hidden = searching;
          branch.setAttribute("aria-expanded", String(!nested.hidden));
          branch.textContent = nested.hidden ? "Desplegar" : "Plegar";
          branch.setAttribute("aria-label", branch.textContent + " rama " + label);
        }
      }
      results.hidden = !searching;
      results.textContent = matches === 1 ? "1 bloque encontrado" : matches + " bloques encontrados";
    }
    search.addEventListener("input", filter);
    mode.addEventListener("change", () => { blockList.dataset.view = mode.value; persist(); });
    blockList.dataset.view = mode.value;
    const resize = new ResizeObserver(entries => {
      for (const { target } of entries) updateDisclosure(target);
    });
    function updateDisclosure(preview) {
      const toggle = preview.nextElementSibling;
      if (!toggle?.classList.contains("preview-toggle")) return;
      toggle.hidden = !preview.classList.contains("expanded") && preview.scrollHeight <= preview.clientHeight + 1;
    }
    function actionButton(label, action, path, accessibleName, disabled = false) {
      const button = document.createElement("button");
      button.className = "secondary";
      button.type = "button"; button.textContent = label;
      button.dataset.action = action; button.dataset.path = pathToKey(path);
      button.disabled = disabled;
      button.setAttribute("aria-label", accessibleName);
      return button;
    }

    function blockItem(block, path, parent, parentPath, siblings) {
      const position = path[path.length - 1];
      const where = parent ? `dentro de ${describeBlock(parent, parentPath)}` : "en la raíz";
      const { badge, text, warning } = blockLabelParts(block, path);
      const label = text ? badge + " " + text : badge;
      const subject = `${label}, nivel ${path.length}, ${where}`;

      const item = document.createElement("li");
      const article = document.createElement("article");
      article.dataset.path = pathToKey(path);
      article.dataset.blockId = block.id;
      const record = { block, item, article, label, searchable: normalize([label, T.blockLabel(block.type), block.type, block.title, block.content].join(" ")) };
      rows.set(block.id, record);
      const heading = document.createElement("h4");
      const marker = document.createElement("span");
      marker.className = "block-outline-badge";
      marker.textContent = badge;
      heading.append(marker);
      if (text) heading.append(" " + text);
      heading.setAttribute("aria-label", label);
      const icon = document.createElement("span");
      icon.className = "outline-icon"; icon.textContent = icons[block.type]; icon.setAttribute("aria-hidden", "true");
      heading.prepend(icon);
      // El nivel y el padre se escriben, no solo se sugieren con la sangría.
      const meta = document.createElement("p");
      meta.className = "block-meta";
      meta.textContent = `Nivel ${path.length} · ${where}`;
      if (coarse.matches || desktop.matches) meta.textContent = "N" + path.length + " · " + (parent ? describeBlock(parent, parentPath) : "raíz");
      const target = getTarget(block.label);
      if (target) meta.textContent += " · " + target.word + (target.number === null ? "" : " " + target.number) + " · " + target.label;
      if (desktop.matches) {
        heading.title = label;
        meta.title = `Nivel ${path.length} · ${where}` + (target ? " · " + target.label : "");
      }
      const preview = document.createElement("div");
      preview.className = "block-preview";
      renderBlockPreview(preview, block, { parentPath, structure: true });
      const toggle = document.createElement("button");
      toggle.type = "button"; toggle.className = "preview-toggle"; toggle.textContent = "Ver todo"; toggle.hidden = true;
      toggle.classList.toggle("tertiary", desktop.matches);
      preview.classList.toggle("expanded", expanded.has(block.id));
      toggle.setAttribute("aria-expanded", String(expanded.has(block.id)));
      if (expanded.has(block.id)) toggle.textContent = "Ver menos";
      toggle.addEventListener("click", () => {
        const open = preview.classList.toggle("expanded");
        if (open) expanded.add(block.id);
        else expanded.delete(block.id);
        toggle.setAttribute("aria-expanded", String(open)); toggle.textContent = open ? "Ver menos" : "Ver todo";
        persist();
      });
      const actions = document.createElement("menu");
      actions.className = "block-actions";
      actions.setAttribute("aria-label", `Acciones para el bloque ${label}`);
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
        // «⋯» ya abre el menú del bloque: no se repite dentro de «Más acciones».
        menuButton.remove();
        menu.setAttribute("aria-haspopup", "menu"); actions.append(menu, disclosure);
      } else actions.append(disclosure);
      const head = document.createElement("div"); head.className = "card-heading"; head.append(heading, meta);
      article.append(head);
      if (warning) {
        const notice = document.createElement("p");
        notice.className = "block-outline-warning";
        notice.textContent = warning;
        article.append(notice);
      }
      article.append(preview, toggle, actions);
      resize.observe(preview);
      for (const extend of blockItemExtensions) extend(block, path, { article, actions, more, subject });
      // En el portátil, Editar precede al plegado y a la vista previa en el orden de Tab.
      if (desktop.matches) article.prepend(actions);
      item.append(article);

      if (block.children.length) {
        const nested = document.createElement("ol");
        nested.className = "block-children";
        nested.id = "branch-" + path.join("-");
        const branch = document.createElement("button");
        branch.type = "button";
        branch.className = "secondary branch-toggle";
        branch.setAttribute("aria-controls", nested.id);
        branch.addEventListener("click", () => {
          if (collapsed.has(block.id)) collapsed.delete(block.id);
          else collapsed.add(block.id);
          filter(); persist();
        });
        record.nested = nested;
        record.branch = branch;
        head.append(branch);
        if (path.length >= 3) nested.classList.add("shallow-indent");
        nested.setAttribute("aria-label", `Bloques dentro de ${label}`);
        block.children.forEach((child, index) => nested.append(blockItem(child, [...path, index], block, path, block.children.length)));
        item.append(nested);
      }
      return item;
    }

    function renderBlocks() {
      const active = document.activeElement;
      const id = active.closest?.("article")?.dataset.blockId;
      const action = active.dataset?.action;
      const blocks = getBlocks();
      resize.disconnect();
      entries = new Map(T.outlineEntries({ blocks, metadata: { topic: getTopic() } })
        .map(entry => [entry.key, entry]));
      refreshTargets(blocks);
      blockList.replaceChildren();
      rows.clear();
      $("#empty-blocks").hidden = blocks.length > 0;
      blocks.forEach((block, index) => blockList.append(blockItem(block, [index], null, [], blocks.length)));
      filter(); syncSelection();
      const current = rows.get(id)?.article;
      if (current && action) [...current.querySelectorAll("button[data-action]")].find(button => button.dataset.action === action)?.focus({ preventScroll: true });
      else if (current && active.matches(".branch-toggle, .preview-toggle, summary")) {
        const selector = ["summary", ".branch-toggle", ".preview-toggle"].find(candidate => active.matches(candidate));
        current.querySelector(selector)?.focus({ preventScroll: true });
      }
      syncReferenceKey();
      saveSession();
    }

    /** Devuelve true si existe y es enfocable; permite encadenar alternativas. */
    function focusAction(action, path) {
      const button = blockList.querySelector(`button[data-action="${action}"][data-path="${pathToKey(path)}"]`);
      if (!button || button.disabled) return false;
      if (button.closest("li[hidden]") && search.value) search.value = "";
      for (let branch = button.closest(".block-children"); branch; branch = branch.parentElement.closest(".block-children")) {
        collapsed.delete(branch.parentElement.firstElementChild.dataset.blockId);
      }
      filter(); persist();
      deps.reveal(button);
      let disclosure = button.closest("details");
      while (disclosure) { disclosure.open = true; disclosure = disclosure.parentElement.closest("details"); }
      if (desktop.matches) T.focusWithinDesktopPanel(button, blockList.closest(".structure-panel"));
      else button.focus();
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
    desktop.addEventListener("change", renderBlocks);
    return {
      dispose() {
        selection.disconnect(); resize.disconnect(); disposeDesktopCards();
        coarse.removeEventListener("change", renderBlocks);
        desktop.removeEventListener("change", renderBlocks);
      },
      refresh: renderBlocks, actionButton, describeBlock, renderBlocks, focusAction, focusAfterRemoval, focusById,
    };
  };
})(globalThis.TexNotes);
