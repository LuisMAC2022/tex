(function (T) {
  "use strict";
  T.createPanels = function (doc, deps) {
    const $ = selector => doc.querySelector(selector);
    const { metadata, imageType } = deps;
    function syncMetadataSummary(reset = false) {
      const data = metadata(), parts = [data.title, data.course, data.date].map(value => value.trim()).filter(Boolean);
      $("#datos-heading").textContent = ["Datos del documento", ...parts].join(" · ");
      if (reset || !data.title.trim()) $("#metadata-details").open = !data.title.trim();
    }
    function focusMetadata() { $( $("#metadata-details").open ? "#note-title" : "#metadata-details > summary").focus(); }
    const events = new AbortController();
    $("#metadata-details").addEventListener("input", () => syncMetadataSummary(), { signal: events.signal });
    function goTo(destination) {
      if (destination === "preferences") $("#writing-preferences").open = true;
      const target = $(({ content: imageType($("#block-type").value) ? "#image-path" : "#block-content",
        tree: "#global-menu", result: "#generate", versions: "#versions-heading", preferences: "#writing-preferences > summary" })[destination]);
      target.focus(); target.scrollIntoView({ block: "nearest" });
    }
    return { refresh: syncMetadataSummary, goTo, focusMetadata, dispose() { events.abort(); } };
  };
})(globalThis.TexNotes);
