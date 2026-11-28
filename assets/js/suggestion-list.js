(function (T) {
  "use strict";
  T.fieldCaretRect = function (blockContent) {
    const document = blockContent.ownerDocument, rect = blockContent.getBoundingClientRect();
    const mirror = document.createElement("div"), marker = document.createElement("span");
    const style = getComputedStyle(blockContent);
    for (const key of ["font", "lineHeight", "letterSpacing", "padding", "border", "boxSizing", "tabSize", "textIndent"]) mirror.style[key] = style[key];
    Object.assign(mirror.style, { position: "fixed", visibility: "hidden", whiteSpace: "pre-wrap", overflowWrap: "break-word", width: `${rect.width}px`, left: `${rect.left}px`, top: `${rect.top}px` });
    mirror.textContent = blockContent.value.slice(0, blockContent.selectionStart);
    marker.textContent = "\u200b"; mirror.append(marker); document.body.append(mirror);
    const caret = marker.getBoundingClientRect();
    mirror.remove();
    return caret;
  };
  T.createSuggestionList = function (document, { blockContent, announce, acceptAssist }) {
    const global = document.defaultView, $ = selector => document.querySelector(selector);
    const events = new AbortController(), options = {signal:events.signal};
    const closeListeners = new Set();
    let assistState = null;
    const assistList = $("#assist-list");
    function close() {
      assistState = null; assistList.hidden = true; assistList.replaceChildren();
      for (const name of ["aria-autocomplete", "aria-controls", "aria-activedescendant"]) blockContent.removeAttribute(name);
      for (const callback of closeListeners) callback();
    }
    function positionAssistMenu() {
      if (!assistState) return;
      const rect = blockContent.getBoundingClientRect();
      const narrow = global.matchMedia("(max-width: 38rem)").matches;
      const caret = T.fieldCaretRect(blockContent);
      const clamp = (value) => Math.max(rect.top, Math.min(value, rect.bottom));
      const anchor = { top: clamp(caret.top - blockContent.scrollTop), bottom: clamp(caret.bottom - blockContent.scrollTop) };
      const x = narrow ? rect.left : caret.left - blockContent.scrollLeft;
      // La barra del pulgar y el teclado virtual tapan el borde inferior.
      const view = global.visualViewport, top = (view?.offsetTop ?? 0) + 8;
      const bottom = (view ? view.offsetTop + view.height : global.innerHeight) - ($("#thumb-bar")?.offsetHeight || 0) - 8;
      const scrolled = assistList.scrollTop;
      assistList.style.maxHeight = "";
      assistList.style.width = `${Math.max(0, Math.min(narrow ? rect.width : 420, global.innerWidth - 16))}px`;
      const width = assistList.offsetWidth, place = T.placeSuggestions(anchor, assistList.offsetHeight, { top, bottom });
      assistList.style.maxHeight = `${place.maxHeight}px`;
      assistList.style.left = `${Math.max(8, Math.min(x, global.innerWidth - width - 8))}px`;
      assistList.style.top = `${place.top}px`;
      assistList.scrollTop = scrolled;
    }
    function selectAssist(index, speak = true) {
      if (!assistState) return;
      assistState.index = (index + assistState.entries.length) % assistState.entries.length;
      for (const [i, option] of [...assistList.children].entries()) option.setAttribute("aria-selected", String(i === assistState.index));
      const active = assistList.children[assistState.index];
      blockContent.setAttribute("aria-activedescendant", active.id);
      active.scrollIntoView({ block: "nearest" });
      if (speak) announce(`${assistState.entries[assistState.index].label}. ${assistState.index + 1} de ${assistState.entries.length}.`);
    }
    function openAssistMenu(entries, token) {
      if (!entries.length) { close(); return; }
      const opened = !assistState;
      assistState = { entries, token: { ...token, cursor: blockContent.selectionStart }, index: 0 };
      assistList.replaceChildren(...entries.map((entry, i) => {
        const option = document.createElement("li");
        option.id = `assist-option-${i}`; option.setAttribute("role", "option");
        const name = document.createElement("strong"), detail = document.createElement("span");
        name.textContent = entry.label; detail.textContent = entry.detail || entry.trigger;
        option.append(name, detail);
        // Aceptar en pointerdown impedía desplazar la lista con el dedo: el primer
        // toque del gesto elegía la opción. pointerdown solo conserva el foco.
        option.addEventListener("pointerdown", (event) => event.preventDefault());
        option.addEventListener("click", () => acceptAssist(i));
        return option;
      }));
      assistList.hidden = false;
      blockContent.setAttribute("aria-autocomplete", "list"); blockContent.setAttribute("aria-controls", "assist-list");
      selectAssist(0, false); positionAssistMenu();
      if (opened) announce(`${entries.length} sugerencias. ${entries[0].label}.`);
    }
    blockContent.addEventListener("scroll", positionAssistMenu, options);
    global.addEventListener("resize", positionAssistMenu, options);
    global.visualViewport?.addEventListener("resize", positionAssistMenu, options);
    document.addEventListener("scroll", (event) => { if (event.target !== assistList) positionAssistMenu(); }, { ...options, capture: true });
    return { get state() { return assistState; }, open: openAssistMenu, select: selectAssist, close,
      onClose(callback) { closeListeners.add(callback); return () => closeListeners.delete(callback); },
      dispose() { events.abort(); close(); closeListeners.clear(); } };
  };
})(globalThis.TexNotes);
