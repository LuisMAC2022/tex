/** Posiciones personales y resolución del anillo. No accede al DOM ni al almacenamiento. */
(function (T) {
  "use strict";
  const MENU_DIRECTIONS = ["Arriba", "Arriba a la derecha", "Derecha", "Abajo a la derecha", "Abajo", "Abajo a la izquierda", "Izquierda", "Arriba a la izquierda"];
  const MENU_CONTEXTS = { formula: "Fórmula", text: "Texto", image: "Imagen", card: "Bloque", global: "General" };
  const defaultMenus = () => ({ kind: "notas-latex-menus", version: 1, rings: [], button: "edit.undo" });
  const empty = () => ({ label: "Vacío", icon: "·", disabled: true });
  const segmenter = typeof Intl.Segmenter === "function" && new Intl.Segmenter("es", { granularity: "grapheme" });
  const length = s => typeof s === "string" ? Array.from(segmenter ? segmenter.segment(s.trim()) : s.trim()).length : 0;
  const idPattern = /^[a-z][a-z0-9_-]{0,63}$/;
  const kinds = ["action", "symbol", "snippet", "submenu", "ring"];
  function validateMenus(data) {
    const errors = [];
    if (data?.kind !== "notas-latex-menus" || data.version !== 1 || !Array.isArray(data.rings)) return ["rings: formato de menús desconocido."];
    if (data.rings.length > 6) errors.push("rings: el máximo es seis anillos.");
    const ids = new Set(), contexts = new Set(), links = new Map();
    for (const ring of data.rings) {
      if (typeof ring?.id === "string") links.set(ring.id, []);
    }
    function checkSlice(s, path, edges, child) {
      if (s === null) return;
      if (!s || typeof s !== "object" || kinds.filter(k => Object.hasOwn(s,k)).length !== 1) {
        errors.push(path + ": elige una sola clase de sector."); return;
      }
      if (("label" in s || "snippet" in s) && !(length(s.label) >= 1 && length(s.label) <= 24)) errors.push(path + ".label: usa de 1 a 24 caracteres.");
      if (("icon" in s || "snippet" in s) && !(length(s.icon) >= 1 && length(s.icon) <= 3)) errors.push(path + ".icon: usa de 1 a 3 caracteres.");
      if ("action" in s && !T.actionById(s.action)) errors.push(path + ".action: acción desconocida.");
      if (s.args !== undefined && (!Array.isArray(s.args) || s.args.length !== 1 ||
          !T.RADIAL_MENUS.flatMap(m => T.slicesFor(m.context)).flatMap(item => [item, ...(item.children || [])])
            .some(item => item.action?.id === s.action && item.action.args?.[0] === s.args[0]))) errors.push(path + ".args: parámetro desconocido.");
      if ("symbol" in s && !T.MATH_SYMBOLS.some(m => m.id === s.symbol)) errors.push(path + ".symbol: símbolo desconocido.");
      if ("snippet" in s && (typeof s.snippet !== "string" || !s.snippet.trim() || !T.validSnippetMarkers(s.snippet))) errors.push(path + ".snippet: escribe un fragmento con marcadores #0 a #9 válidos.");
      if ("ring" in s) {
        if (!links.has(s.ring)) errors.push(path + ".ring: anillo desconocido.");
        else edges.push({ to:s.ring, path });
      }
      if ("submenu" in s) {
        if (child || !Array.isArray(s.submenu) || !s.submenu.length || s.submenu.length > 8) errors.push(path + ".submenu: usa un nivel con 1 a 8 posiciones.");
        else s.submenu.forEach((item,i) => checkSlice(item, path+".submenu["+i+"]", edges, true));
      }
    }
    data.rings.forEach((r,i) => {
      const path = "rings["+i+"]";
      if (!r || typeof r !== "object") { errors.push(path + ": anillo inválido."); return; }
      if (typeof r.id !== "string" || !idPattern.test(r.id) || ids.has(r.id)) errors.push(path + ".id: identificador inválido o repetido.");
      ids.add(r.id);
      if (length(r.label) < 1 || length(r.label) > 24) errors.push(path + ".label: usa de 1 a 24 caracteres.");
      if (r.replaces !== null) {
        if (!Object.hasOwn(MENU_CONTEXTS,r.replaces) || contexts.has(r.replaces)) errors.push(path + ".replaces: contexto desconocido o repetido.");
        contexts.add(r.replaces);
      }
      if (!Array.isArray(r.slices) || r.slices.length > 8) errors.push(path + ".slices: el máximo es ocho posiciones.");
      else r.slices.forEach((s,j) => checkSlice(s,path+".slices["+j+"]",links.get(r.id) || [],false));
    });
    const visiting = new Set(), visited = new Set();
    function visit(id) {
      if (visited.has(id)) return;
      visiting.add(id);
      for (const {to,path} of links.get(id)) {
        if (visiting.has(to)) errors.push(path+".ring: el enlace crea un ciclo.");
        else visit(to);
      }
      visiting.delete(id); visited.add(id);
    }
    if (links.size <= 6) for (const id of links.keys()) visit(id);
    const button = data.button;
    if (typeof button !== "string" || !(button.startsWith("ring:") ? ids.has(button.slice(5)) :
        T.actionById(button)?.contexts.some(c => c !== "card"))) errors.push("button: elige una acción o un anillo existente.");
    return errors;
  }
  function migrateMenus(data) {
    if (data == null) return defaultMenus();
    const errors = validateMenus(data);
    if (errors.length) throw Error(errors.join(" "));
    return JSON.parse(JSON.stringify(data));
  }
  function resolveMenu(data, context, blockType, summary = {}, ringId) {
    const ring = data.rings.find(r => ringId ? r.id === ringId : r.replaces === context);
    if (!ring) return { slices:T.slicesFor(context,blockType,summary) };
    const defaults = ring.replaces ? T.slicesFor(ring.replaces,blockType,summary) : [];
    function resolve(s) {
      if (!s) return empty();
      if (s.action) {
        const a = T.actionById(s.action);
        return { label:s.label || a.label, icon:s.icon || a.icon, action:{type:"action",id:a.id,args:s.args},
          disabled:!a.contexts.includes(context) || Boolean(a.enabled && !a.enabled(summary)) };
      }
      if (s.symbol) {
        const item = T.MATH_SYMBOLS.find(m => m.id === s.symbol);
        return { label:s.label || item.name, icon:s.icon || item.symbol, action:{type:"symbol",symbol:s.symbol} };
      }
      if (s.snippet) return { label:s.label, icon:s.icon, action:{type:"insert",snippet:s.snippet} };
      if (s.submenu) return { label:s.label || "Submenú", icon:s.icon || "…", children:s.submenu.map(resolve) };
      return { label:s.label || data.rings.find(r => r.id === s.ring)?.label, icon:s.icon || "↗", action:{type:"ring",id:s.ring} };
    }
    return { name:ring.label, slices:MENU_DIRECTIONS.map((_,i) => ring.slices[i] ? resolve(ring.slices[i]) : defaults[i] || empty()) };
  }
  T.registerConfigPart({ key:"menus", version:1, defaults:defaultMenus, validate:validateMenus, migrate:migrateMenus });
  Object.assign(T,{ MENU_DIRECTIONS,MENU_CONTEXTS,defaultMenus,validateMenus,migrateMenus,resolveMenu });
})(globalThis.TexNotes);
