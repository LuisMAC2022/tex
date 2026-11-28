(function (T) {
  "use strict";
  // Cada sección indica su panel en teléfono y en portátil. Las secciones
  // anidadas sin destino propio en portátil viajan con su contenedor.
  const sections = [
    ['section[aria-labelledby="contenido-heading"]', "write", "write"],
    [".structure-panel", "tree"],
    ['section[aria-labelledby="datos-heading"]', "document", "document"],
    ['section[aria-labelledby="resultado-heading"]', "document", "export"],
    ['section[aria-labelledby="versions-heading"]', "more", "export"],
    ['section[aria-labelledby="writing-heading"]', "more", "document"],
    [".shortcut-panel", "more"],
  ];
  T.createPanels = function (doc, deps) {
    const $ = selector => doc.querySelector(selector), win = doc.defaultView;
    const media = win.matchMedia("(max-width: 47.99rem)");
    const events = new AbortController(), options = { signal: events.signal };
    const navigation = $("#mobile-navigation"), mobileTabs = Array.from(navigation.querySelectorAll('[role="tab"]'));
    const resultHelp = $("#resultado-heading + p"), originalHelp = resultHelp.textContent;
    const desktopTabs = ["write", "document", "export"].map(key => $("#workspace-" + key));
    let tabs = [], mode = null;
    const panels = new Map(), positions = new Map(), original = [];
    const preview = $(".math-preview-panel"), previewKey = "tex-notes:mobile-preview:v1";
    let active = null, desktopPreview = preview.open;

    const concentration = $("#focus-writing"), structure = $(".structure-panel");
    const structureToggle = $("#toggle-structure"), review = $("#review-writing");
    const workspace = $(".editor-workspace");
    const desktop = win.matchMedia("(min-width: 64rem) and (pointer: fine)");
    const inlinePreview = win.matchMedia("(min-width: 64rem) and (width < 80rem) and (pointer: fine)");
    const previewPosition = doc.createComment("posición de la vista previa");
    const contentField = $("#block-content").closest(".field");
    const contentError = $("#block-error"), imageFields = $("#image-fields");
    const contentObserver = new win.MutationObserver(placeInlinePreview);
    const layoutKey = "tex-notes:workspace:v1";
    let layout = {};
    try { layout = JSON.parse(win.localStorage.getItem(layoutKey)) || {}; } catch { /* Sesión en memoria. */ }
    function saveLayout() {
      try { win.localStorage.setItem(layoutKey, JSON.stringify(layout)); } catch { /* Sesión en memoria. */ }
    }
    function paintLayout() {
      const focused = Boolean(layout.focus);
      doc.body.classList.toggle("writing-focus", focused);
      concentration.setAttribute("aria-pressed", String(focused));
      structure.hidden = !media.matches && (focused || Boolean(layout.hideStructure));
      structureToggle.setAttribute("aria-expanded", String(!structure.hidden));
      workspace.classList.toggle("structure-folded", structure.hidden);
      review.setAttribute("aria-expanded", String(preview.open && !focused));
    }
    function placeInlinePreview() {
      const anchor = contentField.hidden ? imageFields : contentError;
      if (anchor.nextElementSibling === preview) return;
      const focused = doc.activeElement;
      anchor.after(preview);
      if (preview.contains(focused)) focused.focus({ preventScroll: true });
    }
    function restorePreview() {
      contentObserver.disconnect();
      if (!previewPosition.isConnected) return;
      const focused = doc.activeElement;
      previewPosition.replaceWith(preview);
      if (preview.contains(focused)) focused.focus({ preventScroll: true });
    }
    function syncPreviewPlacement() {
      if (!inlinePreview.matches) { restorePreview(); return; }
      preview.before(previewPosition);
      placeInlinePreview();
      contentObserver.observe(contentField, { attributes: true, attributeFilter: ["hidden"] });
    }
    concentration.addEventListener("click", () => {
      layout.focus = !layout.focus;
      paintLayout(); saveLayout();
    }, options);
    structureToggle.addEventListener("click", () => {
      layout.hideStructure = !layout.hideStructure;
      paintLayout(); saveLayout();
    }, options);
    review.addEventListener("click", () => {
      preview.open = !preview.open;
      paintLayout();
      if (preview.open) preview.querySelector("summary").focus();
    }, options);
    preview.addEventListener("toggle", paintLayout, options);
    $("#workspace-document").addEventListener("click", () => {
      if (desktop.matches) return;
      const details = $("#metadata-details");
      details.open = true;
      focusTarget($("#note-title"));
    }, options);
    $("#workspace-export").addEventListener("click", () => { if (!desktop.matches) goTo("result"); }, options);

    function syncMetadataSummary(reset = false) {
      const data = deps.metadata(), parts = [data.title, data.course, data.date].map(value => value.trim()).filter(Boolean);
      $("#datos-heading").textContent = ["Datos del documento", ...parts].join(" · ");
      if (reset || !data.title.trim()) $("#metadata-details").open = !data.title.trim();
    }
    function select(key, { speak = true, focus = false } = {}) {
      if (!panels.has(key)) return;
      if (active !== key) {
        if (active && mode === "mobile") {
          positions.set(active, win.scrollY);
          if (active === "document" && $("#note-title").value.trim()) $("#metadata-details").open = false;
          if (active === "write") deps.closeWriting();
        }
        active = key;
        for (const [id, panel] of panels) panel.hidden = id !== key;
        for (const tab of tabs) {
          const selected = tab.dataset.panel === key;
          tab.setAttribute("aria-selected", String(selected)); tab.tabIndex = selected ? 0 : -1;
        }
        if (mode === "mobile") {
          $("#panel-menu").hidden = key === "write";
          mobileTabs.find(t => t.dataset.panel === key).scrollIntoView({ inline: "nearest", block: "nearest" });
          win.scrollTo({ top: positions.get(key) || 0, behavior: "instant" });
        } else {
          doc.body.dataset.workspaceView = key;
          if (key === "export") {
            $("#generate").click();
            if ($("#note-title").getAttribute("aria-invalid") === "true") {
              $("#latex-output").value = "";
              speak = false; // Conservar el aviso del generador sobre el título.
            }
          }
        }
      }
      const tab = tabs.find(t => t.dataset.panel === key);
      if (focus) {
        let target = tab;
        if (mode === "desktop") {
          target = panels.get(key);
          if (key === "document") {
            $("#metadata-details").open = true;
            target = $("#note-title");
          }
        }
        target.focus({ preventScroll: true });
      }
      if (speak) {
        const count = $("#block-list").querySelectorAll("article").length;
        deps.announce(key === "tree" ? "Panel Estructura, " + count + (count === 1 ? " bloque." : " bloques.") : "Panel " + tab.textContent + ".");
      }
    }
    function reveal(element) {
      const panel = element?.closest('[role="tabpanel"]');
      if (panel && panel.hidden) select(panel.dataset.panel, { speak: false });
      if (!media.matches && element && (structure.contains(element) || element.closest("section") !== workspace.closest("section"))) {
        layout.focus = false;
        if (structure.contains(element)) layout.hideStructure = false;
        paintLayout(); saveLayout();
      }
    }
    function focusTarget(target) { reveal(target); target.focus(); target.scrollIntoView({ block: "nearest" }); }
    function goTo(destination) {
      if (destination === "preferences") $("#writing-preferences").open = true;
      const selector = { content: deps.imageType($("#block-type").value) ? "#image-path" : "#block-content",
        tree: "#global-menu", result: "#generate", versions: "#versions-heading", preferences: "#writing-preferences > summary" }[destination];
      if (selector) focusTarget($(selector));
    }
    $("#generate").addEventListener("click", event => {
      if (mode === "desktop" && event.isTrusted && !$("#note-title").value.trim()) {
        select("document", { speak: false });
      }
    }, options);
    function unmount() {
      if (!panels.size) return;
      for (const { node, marker } of original.splice(0).reverse()) marker.replaceWith(node);
      for (const panel of panels.values()) panel.remove();
      panels.clear(); active = null; navigation.hidden = true;
      if (mode === "mobile") preview.open = desktopPreview;
      if (mode === "desktop") {
        delete doc.body.dataset.workspaceView;
        $("#workspace-write").hidden = true;
        $("#workspace-export").textContent = "Exportación";
        $("#generate").textContent = "Generar documento";
        resultHelp.textContent = originalHelp;
        for (const tab of desktopTabs) {
          for (const name of ["role", "aria-selected", "aria-controls", "tabindex", "data-panel"]) tab.removeAttribute(name);
        }
      }
      mode = null;
    }
    function syncLayout() {
      const next = desktop.matches ? "desktop" : media.matches ? "mobile" : null;
      if (mode === next && mode) return;
      const focused = doc.activeElement;
      unmount();
      mode = next;
      if (!mode) { paintLayout(); return; }
      tabs = mode === "mobile" ? mobileTabs : desktopTabs;
      if (mode === "desktop") {
        $("#workspace-write").hidden = false;
        $("#workspace-export").textContent = "Exportar";
        $("#generate").textContent = "Regenerar";
        resultHelp.textContent = "El código se genera al abrir esta vista si el documento tiene título.";
        for (const tab of tabs) {
          tab.dataset.panel = tab.id.slice("workspace-".length);
          tab.setAttribute("role", "tab");
          tab.setAttribute("aria-controls", "workspace-panel-" + tab.dataset.panel);
        }
      }
      paintLayout();
      desktopPreview = preview.open;
      for (const tab of tabs) {
        const key = tab.dataset.panel, panel = doc.createElement("div");
        panel.id = tab.getAttribute("aria-controls"); panel.dataset.panel = key;
        panel.setAttribute("role", "tabpanel"); panel.setAttribute("aria-labelledby", tab.id); panel.tabIndex = -1;
        $("#document-form").append(panel); panels.set(key, panel);
        for (const [selector, mobileKey, desktopKey] of sections) {
          if ((mode === "mobile" ? mobileKey : desktopKey) !== key) continue;
          const node = $(selector), marker = doc.createComment("posición de " + selector);
          node.before(marker); original.push({ node, marker }); panel.append(node);
        }
      }
      if (mode === "desktop") {
        const more = doc.createElement("h2");
        more.textContent = "Más";
        $("#writing-heading").closest("section").before(more);
        const footer = $("footer"), marker = doc.createComment("posición del pie");
        footer.before(marker); original.push({ node: footer, marker }); panels.get("export").append(footer);
      } else {
        navigation.hidden = false;
        try { preview.open = win.localStorage.getItem(previewKey) === "open"; } catch { preview.open = false; }
      }
      const previous = focused.closest?.('[role="tabpanel"]');
      select(previous?.dataset.panel || "write", { speak: false });
      if (focused.closest?.('[role="tabpanel"]:not([hidden])')) focused.focus({ preventScroll: true });
    }
    for (const group of [mobileTabs, desktopTabs]) for (const [i, tab] of group.entries()) {
      tab.addEventListener("click", () => select(tab.dataset.panel, { focus: true }), options);
      tab.addEventListener("keydown", event => {
        if (tabs !== group || !mode) return;
        const next = { Home: 0, End: tabs.length - 1, ArrowLeft: (i + tabs.length - 1) % tabs.length, ArrowRight: (i + 1) % tabs.length }[event.key];
        if (next === undefined) return;
        event.preventDefault();
        if (mode === "desktop") tabs[next].focus();
        else select(tabs[next].dataset.panel, { focus: true });
      }, options);
    }
    $(".skip-link").addEventListener("click", event => {
      if (!media.matches) return;
      event.preventDefault(); panels.get(active)?.focus();
    }, options);
    $("#metadata-details").addEventListener("input", () => syncMetadataSummary(), options);
    function savePreview() {
      if (media.matches) try { win.localStorage.setItem(previewKey, preview.open ? "open" : "closed"); } catch { /* Solo para esta sesión. */ }
    }
    preview.querySelector("summary").addEventListener("click", event => {
      if (desktop.matches && preview.open) review.focus({ preventScroll: true });
      if (!media.matches) return;
      event.preventDefault();
      preview.open = !preview.open;
      savePreview();
    }, options);
    preview.addEventListener("toggle", savePreview, options);
    win.addEventListener("pagehide", savePreview, options);
    desktop.addEventListener("change", syncLayout, options);
    media.addEventListener("change", syncLayout, options);
    inlinePreview.addEventListener("change", syncPreviewPlacement, options);
    syncLayout();
    syncPreviewPlacement();
    return { refresh: syncMetadataSummary, goTo, reveal, focusTarget, current: () => active,
      focusMetadata: () => focusTarget($($("#metadata-details").open ? "#note-title" : "#metadata-details > summary")),
      dispose() { events.abort(); restorePreview(); unmount(); },
    };
  };
})(globalThis.TexNotes);
