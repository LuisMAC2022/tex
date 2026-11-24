(function (T) {
  "use strict";
  T.createThumbBar = function (document, deps) {
    const $ = selector => document.querySelector(selector);
    const global = document.defaultView;
    const { blockContent, symbolBoard, symbolDetails, symbolSearch, coarsePointer, ensureSymbolOrigin,
      returnToSymbolOrigin, announce, closeAssistMenu, fieldState, getListIndex, selectAssist, getSnippet, setSnippet } = deps;
    const listeners = new AbortController();
    function listen(node, name, handler, capture = false) {
      node?.addEventListener(name, handler, { capture, signal: listeners.signal });
    }
    const thumbBar = $("#thumb-bar");
    const rootStyle = document.documentElement.style;
    function syncThumbViewport() {
      const v = global.visualViewport;
      const inset = v ? Math.max(0, global.innerHeight - v.offsetTop - v.height) : 0;
      rootStyle.setProperty("--keyboard-inset", inset + "px");
      rootStyle.setProperty("--thumb-height", thumbBar.offsetHeight + "px");
      rootStyle.setProperty("--sheet-height", ((v?.height ?? global.innerHeight) * .4) + "px");
    }
    function revealThumbField() {
      syncThumbViewport();
      if (coarsePointer.matches && document.activeElement === blockContent) blockContent.scrollIntoView({ block: "nearest" });
    }
    listen(global.visualViewport, "resize", revealThumbField);
    listen(global.visualViewport, "scroll", syncThumbViewport);
    listen(global, "resize", syncThumbViewport);
    const resize = global.ResizeObserver && new ResizeObserver(syncThumbViewport);
    resize?.observe(thumbBar);
    listen(blockContent, "focus", () => { if (coarsePointer.matches) requestAnimationFrame(revealThumbField); });
    function showSymbolSheet() {
      ensureSymbolOrigin();
      symbolBoard.classList.add("symbol-sheet");
      symbolDetails.open = true;
      $("#close-symbol-sheet").hidden = false;
      $("#thumb-symbols").setAttribute("aria-expanded", "true");
    }
    function closeSymbolSheet() {
      symbolBoard.classList.remove("symbol-sheet");
      $("#close-symbol-sheet").hidden = true;
      $("#thumb-symbols").setAttribute("aria-expanded", "false");
    }
    listen(coarsePointer, "change", () => { closeSymbolSheet(); syncThumbViewport(); });
    listen($("#close-symbol-sheet"), "click", returnToSymbolOrigin);
    listen(symbolBoard, "pointerdown", event => {
      if (symbolBoard.classList.contains("symbol-sheet") && event.target.closest("button")) event.preventDefault();
    });
    listen(document, "keydown", event => {
      if (event.key !== "Escape" || !symbolBoard.classList.contains("symbol-sheet")) return;
      event.preventDefault(); event.stopPropagation(); returnToSymbolOrigin();
    }, true);
    listen(thumbBar, "pointerdown", event => { if (event.target.closest("button")) event.preventDefault(); });
    listen(thumbBar, "keydown", event => {
      const buttons = [...thumbBar.querySelectorAll("button:enabled")];
      const index = buttons.indexOf(event.target);
      if (index < 0 || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 :
        (index + buttons.length + (event.key === "ArrowLeft" ? -1 : 1)) % buttons.length;
      buttons[index].tabIndex = -1;
      buttons[next].tabIndex = 0;
      buttons[next].focus();
    });
    const scopeButton = $("#thumb-selection");
    let scopeMode = null, scopeStack = [], scopeRange = null;
    function clearScope() {
      scopeMode = null;
      scopeStack = [];
      scopeRange = null;
      scopeButton.setAttribute("aria-pressed", "false");
    }
    function currentScopeRange() {
      return { start: blockContent.selectionStart, end: blockContent.selectionEnd, direction: blockContent.selectionDirection };
    }
    function focusRange(range) {
      blockContent.focus({ preventScroll: true });
      blockContent.setSelectionRange(range.start, range.end, range.direction || "forward");
    }
    function toggleScope() {
      const range = currentScopeRange();
      if (scopeMode) {
        clearScope();
        announce("Selección por alcance desactivada.");
      } else {
        scopeMode = T.scopeModeAt(blockContent.value, range, $("#block-type").value);
        scopeRange = range;
        scopeButton.setAttribute("aria-pressed", "true");
        closeAssistMenu();
        announce("Selección por alcance. Siguiente amplía, Anterior reduce.");
      }
      focusRange(range);
    }
    listen(blockContent, "input", clearScope);
    listen($("#block-type"), "change", clearScope);
    function stepScope(direction) {
      const actual = currentScopeRange();
      if (actual.start !== scopeRange?.start || actual.end !== scopeRange?.end) {
        scopeStack = [];
        scopeRange = actual;
        scopeMode = T.scopeModeAt(blockContent.value, actual, $("#block-type").value);
      }
      const next = direction > 0 ? T.expandScope(blockContent.value, scopeRange, scopeMode, scopeStack) :
        T.shrinkScope(scopeRange, scopeStack);
      scopeRange = next.range;
      scopeStack = next.stack;
      focusRange(scopeRange);
      const selected = blockContent.value.slice(scopeRange.start, scopeRange.end);
      announce(selected ? (scopeRange.name || "Selección original") + ": " + selected.slice(0, 120) :
        "Cursor en la posición " + (scopeRange.start + 1) + ".");
    }
    function thumbStep(direction) {
      // Con sugerencias abiertas, la barra las recorre como las flechas del teclado.
      const listIndex = getListIndex();
      if (listIndex !== undefined) { selectAssist(listIndex + direction); return; }
      if (scopeMode) { stepScope(direction); return; }
      const current = fieldState();
      const hole = direction > 0 ? T.nextSnippetHole(current, getSnippet()) : T.previousSnippetHole(current, getSnippet());
      if (hole) {
        T.applyFieldEdit(blockContent, hole.edit); setSnippet(hole.session);
        announce(hole.session ? "Hueco " + (hole.session.index + 1) + " de " + hole.session.holes.length : "Fin del fragmento.");
      } else {
        setSnippet(null);
        const index = T.tokenBoundary(current.value, direction > 0 ? current.selectionEnd : current.selectionStart, direction);
        T.applyFieldEdit(blockContent, { ...current, selectionStart: index, selectionEnd: index });
        announce("Cursor en la posición " + (index + 1) + ".");
      }
    }
    function toggleSymbols(keyboard) {
      if (symbolBoard.classList.contains("symbol-sheet")) { returnToSymbolOrigin(); return; }
      blockContent.focus(); showSymbolSheet();
      if (keyboard) symbolSearch.focus();
      announce("Tablero de símbolos abierto.");
    }
    listen(thumbBar, "click", event => {
      const button = event.target.closest("[data-action-id]");
      if (button && button.id !== "thumb-menu") T.runAction(button.dataset.actionId, {
        keepFieldFocus: true, keyboard: !T.isPointerClick(event), button,
      }, { source: "editor" });
    });
    syncThumbViewport();

    return { refresh: syncThumbViewport, showSymbolSheet, closeSymbolSheet, clearScope, toggleScope, toggleSymbols, thumbStep,
      getScopeMode: () => scopeMode,
      dispose() { listeners.abort(); resize?.disconnect(); },
    };
  };
})(globalThis.TexNotes);
