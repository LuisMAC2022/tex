/** Apertura, gestos y teclado de los anillos. */
(function (T) {
  "use strict";
  T.createRadialController = function (document, deps) {
    const global = document.defaultView;
    const $ = selector => document.querySelector(selector);
    const { blockContent, imagePath, blockEditor, closeAssistMenu, closeSymbolSheet, getBlock,
      loadBlockEditor, writingMode, getScopeMode, captureSymbolOrigin, applyRadialAction, announce, vibration } = deps;
    const { keyToPath, blockType, SHORTCUTS, ariaKeyshortcuts, matchShortcut } = T;
    const listeners = new AbortController();
    function listen(node, type, handler, options = {}) {
      const settings = typeof options === "boolean" ? { capture: options } : options;
      node.addEventListener(type, handler, { ...settings, signal: listeners.signal });
    }
    let radialState = T.radialReduce(null, {}), radialModel = null, press = null, holdTimer;
    let suppressClickUntil = 0;
    const contextNames = { text: "texto", image: "imagen", formula: "fórmula", global: "acciones generales" };
    const viewport = () => {
      const v = global.visualViewport;
      return { x: v?.offsetLeft || 0, y: v?.offsetTop || 0, width: v?.width ?? innerWidth, height: v?.height ?? innerHeight };
    };
    const radialView = T.createRadialView(document, {
      pick: (index, keyboard) => radialDispatch({ type: "pick", index }, keyboard),
      back: () => radialDispatch({ type: "escape" }, document.activeElement.closest(".radial-layer")),
      cancel: () => radialDispatch({ type: "cancel" }), bottom: () => viewport().y + viewport().height,
    });
    function articleTarget(node) { return { source: "card", path: keyToPath(node.closest("article").dataset.path) }; }
    function radialTarget(node) {
      if (node.closest("#type-chip")) return { source: "editor", name: "Tipo de bloque", slices: T.typeMenuSlices() };
      if (node.closest('#thumb-symbols')) return { source: "editor", name: "Categorías de símbolos", slices: T.symbolCategorySlices() };
      if (node.closest("#thumb-menu, #content-menu") || node === blockContent) return { source: "editor" };
      if (node.closest("input,textarea,select,button,a,summary,[contenteditable],dialog,.radial-layer,#assist-list")) return null;
      if (node.closest("#block-list article")) return articleTarget(node);
      return { source: "global" };
    }
    function focusWritingOrigin(origin) {
      origin.field.focus({ preventScroll: true });
      if (origin.selection) origin.field.setSelectionRange(...origin.selection);
    }
    function radialScrollPositions(node) {
      const positions = new Map();
      const remember = element => {
        if (element) positions.set(element, [element.scrollLeft, element.scrollTop]);
      };
      remember(document.scrollingElement);
      remember(blockEditor);
      remember(blockContent);
      for (let part = node; part?.nodeType === 1; part = part.parentElement) remember(part);
      return positions;
    }
    function clearRadialPress() {
      clearTimeout(holdTimer);
      if (press?.node.hasPointerCapture?.(press.id)) press.node.releasePointerCapture(press.id);
      press = null;
    }
    function radialDispatch(event, focus = false) {
      const before = radialState;
      radialState = T.radialReduce(before, event, radialModel || {});
      if (radialState.phase === "idle") {
        const model = radialModel; radialModel = null;
        radialView.hide(); clearRadialPress();
        if (!model) return;
        focusWritingOrigin(model.originField);
        if (radialState.action) applyRadialAction(radialState.action, { ...model.target, context: model.context });
        else if (radialState.cancelled) announce("Menú cerrado.");
        return;
      }
      if (!radialModel || radialState.phase === "waiting") return;
      if (before.phase === "drag" && radialState.phase === "tap" && event.type !== "open") {
        Object.assign(radialModel, T.radialLayout(radialModel.slices, { ...radialModel.origin, mode: "tap" }, viewport()));
      }
      const { parent, highlight } = radialState, model = radialModel;
      const items = parent < 0 ? model.slices : model.slices[parent].children;
      const ring = parent < 0 ? model.root : model.child(parent);
      const name = parent < 0 ? (model.target.name || "Menú de " + contextNames[model.context]) : model.slices[parent].label;
      radialView.draw(ring, items, name, radialState, model);
      if (before.parent !== parent || event.type === "open" || event.type === "hold") announce(name + ", " + items.length + " opciones.");
      if (radialState.haptic && vibration()) navigator.vibrate?.(10);
      if (focus) radialView.focus(Math.max(0, highlight));
    }
    function openRadial(target, point, mode, keyboard = false, bar = false) {
      closeAssistMenu(); closeSymbolSheet();
      let type = $("#block-type").value;
      if (target.source === "card") {
        const block = getBlock(target.path); if (!block) return;
        type = block.type; loadBlockEditor(block, target.path);
        blockContent.setSelectionRange(blockContent.value.length, blockContent.value.length);
      }
      const kind = blockType(type)?.kind;
      // En la ruta histórica de tarjeta el menú corresponde al contenido cargado.
      const context = T.actionContext({ source: target.source === "card" ? "content" : target.source, blockKind: kind,
        mathMode: target.source === "editor" && writingMode(), scopeMode: target.source === "editor" && getScopeMode() });
      const field = kind === "image" ? imagePath : blockContent;
      const slices = target.slices || T.slicesFor(context, type), area = viewport(), origin = { ...point, mode, bar };
      const scrollPositions = radialScrollPositions(press?.node || document.elementFromPoint?.(point.x, point.y));
      radialModel = { target, context, origin, scrollPositions, originField: captureSymbolOrigin(field), ...T.radialLayout(slices, origin, area) };
      radialDispatch({ type: "open", mode, point, keyboard }, keyboard);
      if (press) { try { press.node.setPointerCapture(press.id); } catch { /* puntero ya liberado */ } }
    }
    function openRadialAtButton(button, target, keyboard) {
      const rect = button.getBoundingClientRect();
      openRadial(target, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }, "tap", keyboard, button === $("#thumb-menu"));
    }
    const chip = $("#type-chip");
    listen(chip, "pointerdown", event => event.preventDefault());
    listen(chip, "click", event => openRadialAtButton(chip, radialTarget(chip), !T.isPointerClick(event)));
    for (const id of ["thumb-menu","content-menu","global-menu"]) {
      const button = $("#" + id);
      listen(button, "pointerdown", e => e.preventDefault());
      listen(button, "click", e => T.runAction(button.dataset.actionId, { button, keyboard: !T.isPointerClick(e) }));
    }
    blockContent.setAttribute("aria-keyshortcuts", SHORTCUTS.filter(s => s.scope === "content-widget").map(s => ariaKeyshortcuts(s)).join(" "));
    listen(blockContent, "keydown", e => {
      if (!matchShortcut(e, "content-widget") || !["idle","waiting"].includes(radialState.phase)) return;
      e.preventDefault(); T.runAction(matchShortcut(e, "content-widget").id, { button: blockContent, keyboard: true });
    });
    listen(document, "keydown", e => {
      if (!radialModel) return;
      const items = radialState.parent < 0 ? radialModel.slices : radialModel.slices[radialState.parent].children;
      let i = Math.max(0, radialState.highlight);
      if (e.key === "Escape") radialDispatch({ type: "escape" }, true);
      else if (["Enter"," ","ArrowRight"].includes(e.key) && (e.key !== "ArrowRight" || items[i].children)) radialDispatch({ type: "pick", index: i }, true);
      else if (["Home","End","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) {
        i = e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 :
          (i + items.length + (["ArrowUp","ArrowLeft"].includes(e.key) ? -1 : 1)) % items.length;
        radialDispatch({ type: "focus", index: i }, true);
      } else if (e.key === "Tab") { radialDispatch({ type: "cancel" }); return; } else return;
      e.preventDefault(); e.stopPropagation();
    }, true);
    listen(document, "pointerdown", e => {
      suppressClickUntil = 0;
      if (!e.isPrimary || (press && press.id !== e.pointerId)) { radialDispatch({ type: "second" }); return; }
      if (radialModel || e.button !== 0) return;
      const node = e.target, bar = !!node.closest("#thumb-menu"), deferred = !!node.closest("[data-drag-ring]");
      if (!bar && !deferred && (e.pointerType === "mouse" || (node === blockContent && !T.LONG_PRESS_IN_FIELD))) return;
      const target = radialTarget(node); if (!target) return;
      const point = { x: e.clientX, y: e.clientY };
      press = { node, id: e.pointerId, point, target, bar, deferred, scrollPositions: radialScrollPositions(node) };
      radialDispatch({ type: "down", point });
      if (bar) { e.preventDefault(); openRadial(target, point, "drag", false, true); }
      else if (!deferred) holdTimer = setTimeout(() => { if (press) openRadial(target, point, "drag"); }, T.RADIAL_HOLD);
    }, true);
    for (const name of ["pointermove","pointerup","pointercancel"]) listen(document, name, e => {
      if (!press || e.pointerId !== press.id) return;
      if (name === "pointercancel") { radialDispatch({ type: "cancel" }); return; }
      const point = { x: e.clientX, y: e.clientY }, end = name === "pointerup";
      if (!end && press.deferred && !radialModel) {
        if (Math.hypot(point.x - press.point.x, point.y - press.point.y) <= T.RADIAL_SLOP) return;
        openRadial(press.target, press.point, "drag", false, !!press.node.closest("#thumb-bar"));
      }
      if (end && radialModel) suppressClickUntil = performance.now() + 350;
      if (end && press.bar && Math.hypot(point.x - press.point.x, point.y - press.point.y) <= T.RADIAL_SLOP) {
        const original = press; clearRadialPress(); openRadial(original.target, original.point, "tap", false, true); return;
      }
      radialDispatch({ type: end ? "up" : "move", point });
      if (end) clearRadialPress();
    }, true);
    listen(document, "click", e => {
      if (performance.now() < suppressClickUntil && T.isPointerClick(e)) { e.preventDefault(); e.stopImmediatePropagation(); suppressClickUntil = 0; }
    }, true);
    listen(document, "contextmenu", e => {
      const touch = e.pointerType === "touch" || e.sourceCapabilities?.firesTouchEvents;
      if (touch && e.target === blockContent && !T.LONG_PRESS_IN_FIELD) return;
      const target = radialTarget(e.target); if (!target && !radialModel) return;
      e.preventDefault();
      if (radialModel || touch) return;
      clearRadialPress(); openRadial(target, { x: e.clientX, y: e.clientY }, "tap");
    });
    function cancelRadial(reason) { if (radialModel || press) radialDispatch({ type: reason }); }
    listen(document, "scroll", event => {
      const positions = radialModel?.scrollPositions || press?.scrollPositions;
      if (!positions) return;
      const node = event.target === document ? document.scrollingElement : event.target;
      radialDispatch({ type: "scroll", previous: positions.get(node), x: node?.scrollLeft, y: node?.scrollTop });
    }, true);
    listen(document, "visibilitychange", () => { if (document.hidden) cancelRadial("hidden"); });
    for (const surface of [$("#thumb-bar"), $(".structure-panel")]) listen(surface, "touchmove", e => {
      if (radialModel && e.touches.length === 1) e.preventDefault();
    }, { passive: false });

    return {
      openAtButton: openRadialAtButton,
      dispose() {
        clearRadialPress();
        listeners.abort();
        radialView.layer.remove();
      },
    };
  };
})(globalThis.TexNotes);
