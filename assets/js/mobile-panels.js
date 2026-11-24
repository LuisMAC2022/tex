(function (T) {
  "use strict";
  const sections = {
    write: ['section[aria-labelledby="contenido-heading"]'], tree: [".structure-panel"],
    document: ['section[aria-labelledby="datos-heading"]', 'section[aria-labelledby="resultado-heading"]'],
    more: ['section[aria-labelledby="versions-heading"]', 'section[aria-labelledby="writing-heading"]', ".shortcut-panel"],
  };
  T.createPanels = function (doc, deps) {
    const $ = selector => doc.querySelector(selector), win = doc.defaultView;
    const media = win.matchMedia("(pointer: coarse) and (max-width: 47.99rem)");
    const events = new AbortController(), options = { signal: events.signal };
    const navigation = $("#mobile-navigation"), tabs = Array.from(navigation.querySelectorAll('[role="tab"]'));
    const panels = new Map(), positions = new Map(), original = [];
    const preview = $(".math-preview-panel"), previewKey = "tex-notes:mobile-preview:v1";
    let active = null, desktopPreview = preview.open;

    function syncMetadataSummary(reset = false) {
      const data = deps.metadata(), parts = [data.title, data.course, data.date].map(value => value.trim()).filter(Boolean);
      $("#datos-heading").textContent = ["Datos del documento", ...parts].join(" · ");
      if (reset || !data.title.trim()) $("#metadata-details").open = !data.title.trim();
    }
    function select(key, { speak = true, focus = false } = {}) {
      if (!media.matches || !panels.has(key)) return;
      if (active !== key) {
        if (active) {
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
        $("#panel-menu").hidden = key === "write";
        win.scrollTo({ top: positions.get(key) || 0, behavior: "instant" });
      }
      const tab = tabs.find(t => t.dataset.panel === key);
      if (focus) tab.focus({ preventScroll: true });
      if (speak) {
        const count = $("#block-list").querySelectorAll("article").length;
        deps.announce("Panel " + tab.textContent + (key === "tree" ? ", " + count + (count === 1 ? " bloque." : " bloques.") : "."));
      }
    }
    function reveal(element) {
      const panel = element?.closest('[role="tabpanel"]');
      if (panel && panel.hidden) select(panel.dataset.panel, { speak: false });
    }
    function focusTarget(target) { reveal(target); target.focus(); target.scrollIntoView({ block: "nearest" }); }
    function goTo(destination) {
      if (destination === "preferences") $("#writing-preferences").open = true;
      const selector = { content: deps.imageType($("#block-type").value) ? "#image-path" : "#block-content",
        tree: "#global-menu", result: "#generate", versions: "#versions-heading", preferences: "#writing-preferences > summary" }[destination];
      if (selector) focusTarget($(selector));
    }
    function unmount() {
      if (!panels.size) return;
      for (const { node, marker } of original.splice(0).reverse()) marker.replaceWith(node);
      for (const panel of panels.values()) panel.remove();
      panels.clear(); active = null; navigation.hidden = true; preview.open = desktopPreview;
    }
    function syncLayout() {
      if (!media.matches) { unmount(); return; }
      if (panels.size) return;
      desktopPreview = preview.open;
      const focused = doc.activeElement;
      for (const tab of tabs) {
        const key = tab.dataset.panel, panel = doc.createElement("div");
        panel.id = tab.getAttribute("aria-controls"); panel.dataset.panel = key;
        panel.setAttribute("role", "tabpanel"); panel.setAttribute("aria-labelledby", tab.id); panel.tabIndex = -1;
        $("#document-form").append(panel); panels.set(key, panel);
        for (const selector of sections[key]) {
          const node = $(selector), marker = doc.createComment("posición de " + selector);
          node.before(marker); original.push({ node, marker }); panel.append(node);
        }
      }
      navigation.hidden = false;
      try { preview.open = win.localStorage.getItem(previewKey) === "open"; } catch { preview.open = false; }
      const previous = focused.closest?.('[role="tabpanel"]');
      select(previous?.dataset.panel || "write", { speak: false });
    }
    for (const [i, tab] of tabs.entries()) {
      tab.addEventListener("click", () => select(tab.dataset.panel, { focus: true }), options);
      tab.addEventListener("keydown", event => {
        const next = { Home: 0, End: tabs.length - 1, ArrowLeft: (i + tabs.length - 1) % tabs.length, ArrowRight: (i + 1) % tabs.length }[event.key];
        if (next === undefined) return;
        event.preventDefault(); select(tabs[next].dataset.panel, { focus: true });
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
    preview.addEventListener("toggle", savePreview, options);
    win.addEventListener("pagehide", savePreview, options);
    media.addEventListener("change", syncLayout, options);
    syncLayout();
    return { refresh: syncMetadataSummary, goTo, reveal, focusTarget, current: () => active,
      focusMetadata: () => focusTarget($($("#metadata-details").open ? "#note-title" : "#metadata-details > summary")),
      dispose() { events.abort(); unmount(); },
    };
  };
})(globalThis.TexNotes);
