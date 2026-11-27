/** Geometría y transiciones en coordenadas CSS de la ventana. */
(function (T) {
  "use strict";
  const TAU = Math.PI * 2, HOLD = 400, SLOP = 10, DEAD = 20;
  /* @decision DEC-031 ancla:fd59e818 tramo:1
   * En «Contenido» la pulsación larga es de Android: selecciona texto. El menú
   * se abre ahí con el botón Menú de la barra, la tecla Menú o Mayús+F10.
   */
  const LONG_PRESS_IN_FIELD = false;
  const normalize = a => ((a % TAU) + TAU) % TAU;
  const bounded = (x, lo, hi) => Math.max(lo, Math.min(x, hi));
  const angleOf = (dx, dy) => normalize(Math.atan2(dx, -dy));
  const pointAt = (o, angle, radius) => ({ x: o.x + Math.sin(angle) * radius, y: o.y - Math.cos(angle) * radius });
  function sectorAt(angle, n, start = -Math.PI / n, span = TAU) {
    let d = normalize(angle - start);
    if (TAU - d < 1e-10) d = 0;
    if (span < TAU && d >= span - 1e-10) return -1;
    return Math.floor(d / (span / n) + 1e-10) % n;
  }
  function bounds(ring) {
    const { start, span, inner, outer } = ring;
    const angles = [start, start + span, ...[0, Math.PI / 2, Math.PI, 3 * Math.PI / 2].filter(a => normalize(a - start) <= span)];
    const points = angles.flatMap(a => [pointAt({ x: 0, y: 0 }, a, inner), pointAt({ x: 0, y: 0 }, a, outer)]);
    return { left: Math.min(...points.map(p => p.x)), right: Math.max(...points.map(p => p.x)),
      top: Math.min(...points.map(p => p.y)), bottom: Math.max(...points.map(p => p.y)) };
  }
  function fitMenu(origin, viewport, n, parent = null) {
    const x = viewport.x || 0, y = viewport.y || 0, right = x + viewport.width, bottom = y + viewport.height;
    const make = (kind, inner, outer, start, span) => ({ kind, inner, outer, start, span, n, x: origin.x, y: origin.y });
    const half = !origin.full && (origin.bar || bottom - origin.y < 102 || viewport.height < 216);
    const root = half ? make("half", 86, 146, -Math.PI / 2, Math.PI) : make("full", 32, 104, -Math.PI / n, TAU);
    if (parent) {
      const fan = make("fan", parent.outer + 8, parent.outer + 72, parent.angle - 5 * Math.PI / 12, 5 * Math.PI / 6);
      // El arco mínimo se comprueba también cuando un padre tiene pocos sectores.
      const b = bounds(fan);
      if (fan.x + b.left >= x && fan.x + b.right <= right && fan.y + b.top >= y && fan.y + b.bottom <= bottom) return fan;
      const replacement = fitMenu({ ...origin, bar: parent.kind === "half" }, viewport, n);
      return { ...replacement, kind: "replacement" };
    }
    if (origin.mode !== "drag") {
      const b = bounds(root);
      root.x = bounded(root.x, x - b.left, right - b.right);
      root.y = bounded(root.y, y - b.top, bottom - b.bottom);
    }
    return root;
  }
  const centerAngle = (ring, i) => ring.start + (i + .5) * ring.span / ring.n;
  function radialLayout(slices, origin, area) {
    const root = fitMenu(origin, area, slices.length), children = new Map();
    return { root, slices, child(index) {
      if (!children.has(index)) {
        const parent = { ...root, angle: centerAngle(root, index) };
        children.set(index, fitMenu({ ...origin, x: root.x, y: root.y }, area, slices[index].children.length, parent));
      }
      return children.get(index);
    } };
  }
  function slicesFor(context, blockType, summary = {}) {
    const source = T.RADIAL_MENUS.find(m => m.context === context)?.slices || [];
    function resolve(slice) {
      const action = slice.action;
      if (typeof action === "string") {
        const command = T.actionById(action);
        const label = action === "write.list" && T.blockType(blockType)?.kind === "list" ? "Sangrar" : slice.label || command.label;
        return { ...slice, label, icon: slice.icon || command.icon, disabled: command.enabled ? !command.enabled(summary) : false, action: { type: "action", id: action, args: slice.args } };
      }
      if (action.type === "symbol") {
        const s = T.MATH_SYMBOLS.find(s => s.id === action.symbol);
        return { ...slice, label: slice.label || s.name, icon: slice.icon || s.symbol };
      }
      if (action.type === "blockTypes") {
        const children = action.ids.map(id => ({ id: "type-" + id, label: T.blockLabel(id), icon: "¶",
          action: { type: "action", id: "block.type", args: [id] } }));
        children.push({ id: "type-more", label: "Más…", icon: "…", action: { type: "action", id: "block.typePicker" } });
        return { ...slice, children };
      }
      if (action.type === "submenu") return { ...slice, children: action.slices.map(resolve) };
      return slice;
    }
    return source.map(resolve);
  }
  function applyRadialSnippet(state, source) {
    const parsed = T.parseSnippet(source);
    const markers = [...source.matchAll(/#([0-9])/g)].filter(m => !T.isEscaped(source, m.index));
    if (!markers.length) parsed.holes = [];
    const result = T.snippetEdit(state, source, false, parsed);
    if (state.selectionStart === state.selectionEnd || !markers.some(m => m[1] === "1")) return result;
    const selected = state.value.slice(state.selectionStart, state.selectionEnd);
    const filled = T.replaceSelection(result.edit, selected);
    return T.nextSnippetHole(filled, result.session) || { edit: filled, session: null };
  }
  const idle = () => ({ phase: "idle", parent: -1, highlight: -1, action: null, cancelled: false, haptic: false });
  function radialReduce(previous, event, layout = {}) {
    const s = { ...(previous || idle()), action: null, cancelled: false, haptic: false };
    const children = i => layout.slices?.[i]?.children;
    const items = () => s.parent < 0 ? layout.slices : children(s.parent);
    const cancel = () => ({ ...idle(), cancelled: true });
    const finish = action => ({ ...idle(), action });
    // Un desplazamiento previo a la apertura puede notificarse después del toque.
    if (event.type === "scroll" && event.previous && event.x === event.previous[0] && event.y === event.previous[1]) return s;
    if (["cancel","scroll","hidden","second"].includes(event.type)) return cancel();
    if (event.type === "down") return { ...idle(), phase: "waiting", origin: event.point };
    if (event.type === "open") return { ...idle(), phase: event.mode || "tap", origin: event.point, highlight: event.keyboard ? 0 : -1 };
    if (s.phase === "waiting") {
      if (event.type === "hold" && event.ms >= HOLD) return { ...s, phase: "drag" };
      if (event.type === "up" || (event.point && Math.hypot(event.point.x - s.origin.x, event.point.y - s.origin.y) > SLOP)) return cancel();
      return s;
    }
    if (s.phase === "idle") return s;
    if (event.type === "escape") return s.parent < 0 ? cancel() : { ...s, phase: "tap", parent: -1, highlight: s.parent };
    if (event.type === "focus") return { ...s, highlight: event.index };
    if (event.type === "pick") {
      const element = items()?.[event.index];
      if (!element) return cancel();
      if (element.disabled) return s;
      return element.children ? { ...s, phase: "tap", parent: event.index, highlight: 0 } : finish(element.action);
    }
    if (s.phase !== "drag" || !event.point) return s;
    const dx = event.point.x - s.origin.x, dy = event.point.y - s.origin.y;
    const distance = Math.hypot(dx, dy), angle = angleOf(dx, dy);
    let highlight = -1, parent = s.parent;
    if (distance <= layout.root.outer) parent = -1;
    if (distance >= DEAD) {
      const root = layout.root;
      const index = sectorAt(angle, root.n, root.start, root.span);
      if (parent < 0 && children(index) && distance > root.outer) parent = index;
      const ring = parent < 0 ? root : layout.child(parent);
      highlight = sectorAt(angle, ring.n, ring.start, ring.span);
    }
    if (event.type === "up") {
      const hit = (parent < 0 ? layout.slices : children(parent))?.[highlight];
      if (!hit || hit.disabled) return cancel();
      return hit.children ? { ...s, phase: "tap", parent: highlight, highlight: 0 } : finish(hit.action);
    }
    return { ...s, parent, highlight, haptic: highlight >= 0 && (highlight !== s.highlight || parent !== s.parent) };
  }

  function arcPath(ring, index) {
    const a = ring.start + index * ring.span / ring.n, b = a + ring.span / ring.n - 1e-7;
    const coord = (angle, r) => { const p = pointAt(ring, angle, r); return p.x + " " + p.y; };
    const large = b - a > Math.PI ? 1 : 0;
    return "M " + coord(a, ring.outer) + " A " + ring.outer + " " + ring.outer + " 0 " + large + " 1 " + coord(b, ring.outer)
      + " L " + coord(b, ring.inner) + " A " + ring.inner + " " + ring.inner + " 0 " + large + " 0 " + coord(a, ring.inner) + " Z";
  }
  function drawStaticRing(doc, container, items) {
    const size = 232, middle = size / 2, ns = "http://www.w3.org/2000/svg";
    const ring = fitMenu({ x: middle, y: middle, full: true }, { width: size, height: size }, items.length);
    const art = doc.createElementNS(ns, "svg");
    art.setAttribute("viewBox", "0 0 " + size + " " + size); art.setAttribute("aria-hidden", "true");
    container.replaceChildren(art);
    items.forEach((item, i) => {
      const path = doc.createElementNS(ns, "path");
      path.setAttribute("d", arcPath(ring, i)); path.dataset.slot = i; art.append(path);
      const point = pointAt(ring, centerAngle(ring, i), (ring.inner + ring.outer) / 2);
      const button = doc.createElement("button"); button.type = "button"; button.dataset.slot = i;
      button.textContent = item.icon; button.title = T.MENU_DIRECTIONS[i] + " · " + item.label;
      button.setAttribute("aria-label", button.title); button.draggable = true;
      button.style.left = (100 * point.x / size) + "%"; button.style.top = (100 * point.y / size) + "%";
      container.append(button);
    });
  }
  // Chromium también emite clics táctiles con detail 0. Una activación
  // desde el teclado carece de puntero y debe poder llevar el foco al menú.
  function isPointerClick(event) {
    return event.detail > 0 || Boolean(event.pointerType) || event.sourceCapabilities?.firesTouchEvents === true;
  }
  function createRadialView(doc, handlers) {
    const layer = doc.createElement("div");
    layer.className = "radial-layer"; layer.hidden = true;
    const ns = "http://www.w3.org/2000/svg";
    const svg = doc.createElementNS(ns, "svg"); svg.setAttribute("aria-hidden", "true");
    const parentArt = doc.createElementNS(ns, "g"), activeArt = doc.createElementNS(ns, "g");
    parentArt.setAttribute("class", "radial-parent"); svg.append(parentArt, activeArt);
    const menu = doc.createElement("div"); menu.setAttribute("role", "menu");
    const back = doc.createElement("button"); back.type = "button"; back.className = "radial-back";
    layer.append(svg, menu, back); doc.body.append(layer);
    let lastRing, lastItems;
    function draw(ring, items, name, state, model) {
      layer.hidden = false;
      if (ring !== lastRing || items !== lastItems) {
        lastRing = ring; lastItems = items;
        menu.setAttribute("aria-label", name); menu.replaceChildren(); activeArt.replaceChildren(); parentArt.replaceChildren();
        if (ring.kind === "fan") model.slices.forEach((item, i) => {
          const shape = doc.createElementNS(ns, "path"); shape.setAttribute("d", arcPath(model.root, i));
          shape.dataset.parentIndex = i; shape.classList.toggle("current", i === state.parent);
          const mark = doc.createElementNS(ns, "text");
          const p = pointAt(model.root, centerAngle(model.root, i), (model.root.inner + model.root.outer) / 2);
          mark.setAttribute("x", p.x); mark.setAttribute("y", p.y); mark.textContent = item.icon; parentArt.append(shape, mark);
        });
        items.forEach((item, i) => {
          const path = doc.createElementNS(ns, "path"); path.setAttribute("d", arcPath(ring, i)); path.dataset.index = i;
          const button = doc.createElement("button"); button.type = "button"; button.setAttribute("role", "menuitem"); button.dataset.index = i;
          if (item.disabled) { button.setAttribute("aria-disabled", "true"); path.classList.add("disabled"); }
          if (item.children) button.setAttribute("aria-haspopup", "menu");
          const icon = doc.createElement("span"); icon.setAttribute("aria-hidden", "true"); icon.textContent = item.icon;
          const label = doc.createElement("span"); label.textContent = item.label;
          button.append(icon, label); button.title = item.label;
          const pt = pointAt(ring, centerAngle(ring, i), (ring.inner + ring.outer) / 2);
          button.style.left = pt.x + "px"; button.style.top = pt.y + "px";
          activeArt.append(path); menu.append(button);
        });
        back.textContent = state.parent >= 0 ? "Volver" : "Cerrar";
        back.style.left = ring.x + "px"; back.style.top = Math.min(ring.y, handlers.bottom() - 24) + "px";
      }
      [...menu.children].forEach((b, i) => {
        b.tabIndex = i === Math.max(0, state.highlight) ? 0 : -1;
        b.classList.toggle("current", i === state.highlight);
        activeArt.children[i].classList.toggle("current", i === state.highlight);
      });
    }
    layer.addEventListener("pointerdown", e => { if (e.isPrimary !== false) e.preventDefault(); });
    layer.addEventListener("click", e => {
      const item = e.target.closest("[data-index]");
      if (e.target.closest("[data-parent-index]")) {
        handlers.back(); handlers.pick(Number(e.target.closest("[data-parent-index]").dataset.parentIndex), false);
      } else if (item) handlers.pick(Number(item.dataset.index), !isPointerClick(e));
      else if (e.target === back) handlers.back();
      else handlers.cancel();
    });
    return { layer, draw, focus: i => menu.children[i]?.focus({ preventScroll: true }),
      hide() { layer.hidden = true; lastRing = lastItems = null; } };
  }
  Object.assign(T, { RADIAL_HOLD: HOLD, RADIAL_SLOP: SLOP, LONG_PRESS_IN_FIELD, angleOf, centerAngle, sectorAt,
    fitMenu, radialLayout, slicesFor, applyRadialSnippet, radialReduce, isPointerClick, drawStaticRing, createRadialView });
})(globalThis.TexNotes);
