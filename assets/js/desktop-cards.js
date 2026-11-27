(function (T) {
  "use strict";
  const media = "(min-width: 64rem) and (pointer: fine)";
  T.desktopCardsMedia = doc => doc.defaultView.matchMedia(media);

  // Los navegadores que ignoran «container» desplazan también los ancestros.
  let supportsContainer = false;
  document.createElement("div").scrollIntoView({
    get container() { supportsContainer = true; return "nearest"; },
  });

  function scrollWithin(element, panel) {
    if (!element.getClientRects().length) return;
    if (supportsContainer) {
      element.scrollIntoView({ block: "nearest", inline: "nearest", container: "nearest" });
      return;
    }
    const box = element.getBoundingClientRect();
    const style = panel.ownerDocument.defaultView.getComputedStyle(panel);
    const top = panel.getBoundingClientRect().top + panel.clientTop;
    const before = box.top - (top + (parseFloat(style.scrollPaddingTop) || 0));
    const after = box.bottom - (top + panel.clientHeight - (parseFloat(style.scrollPaddingBottom) || 0));
    if (before < 0 && after > 0) return;
    if (before < 0) panel.scrollTop += Math.max(before, Math.min(0, after));
    else if (after > 0) panel.scrollTop += Math.min(after, before);
  }

  T.focusWithinDesktopPanel = function (element, panel) {
    element.focus({ preventScroll: true });
    scrollWithin(element, panel);
  };

  T.createDesktopCards = function (doc, list, desktop) {
    const panel = list.closest(".structure-panel");
    const editing = doc.querySelector("#editing-path");
    const events = new AbortController();
    let editedId;

    function keepCardVisible() {
      if (!desktop.matches) { editedId = undefined; return; }
      const card = editing.value
        ? list.querySelector(`article[data-path="${CSS.escape(editing.value)}"]`)
        : editedId && list.querySelector(`article[data-block-id="${CSS.escape(editedId)}"]`);
      editedId = editing.value ? card?.dataset.blockId : undefined;
      if (card) scrollWithin(card, panel);
    }

    const observer = new MutationObserver(keepCardVisible);
    observer.observe(editing, { attributes: true, attributeFilter: ["value"] });
    desktop.addEventListener("change", keepCardVisible, { signal: events.signal });

    list.addEventListener("click", event => {
      if (!desktop.matches || event.defaultPrevented || !T.isPointerClick(event)
        || (event.pointerType && event.pointerType !== "mouse") || event.sourceCapabilities?.firesTouchEvents
        || event.target.closest("a, button, summary, input, select, textarea, label, [contenteditable]")) return;
      const card = event.target.closest("article[data-path]");
      const selection = doc.getSelection();
      if (selection && !selection.isCollapsed && card?.contains(selection.anchorNode)) return;
      card?.querySelector('button[data-action="edit"]')?.click();
    }, { signal: events.signal });

    return () => { observer.disconnect(); events.abort(); };
  };
})(globalThis.TexNotes);
