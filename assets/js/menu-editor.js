/** Editor de anillos. Los cambios de la hoja son borradores hasta Guardar posición. */
(function (T) {
  "use strict";
  T.createMenuEditor = function (doc, { readWritingStorage, writeWritingStorage, announce }) {
    const $ = id => doc.getElementById(id), win = doc.defaultView;
    const events = new AbortController();
    const on = (node,type,fn) => node.addEventListener(type,fn,{signal:events.signal});
    const store = "tex-notes:menus:v1", stored = readWritingStorage(store,null);
    let menus = stored && !T.validateMenus(stored).length ? stored : T.defaultMenus();
    const directions = T.MENU_DIRECTIONS, contexts = T.MENU_CONTEXTS;
    const tabs = {snippet:"Fragmento",symbol:"Símbolo",action:"Acción",submenu:"Submenú",empty:"Vacío"};
    const choice = $("menu-choice"), diagram = $("menu-diagram"), dialog = $("slice-dialog");
    let draft, slot = 0, child = null, children = [], parentFields, kind, dragSlot;
    const clone = value => JSON.parse(JSON.stringify(value));
    function options(select, entries) {
      select.replaceChildren(...entries.map(([value,label]) => new win.Option(label,value)));
    }
    function tell(text) { $("menu-error").textContent=text; announce(text); }
    function newId(base) {
      let id = base, n = 1;
      while (menus.rings.some(r => r.id === id)) id = base+"-"+ ++n;
      return id;
    }
    function choose(id) {
      const existing = menus.rings.find(r => r.id === id);
      const context = id.startsWith("default:") ? id.slice(8) : null;
      draft = existing ? clone(existing) : {id:newId("m-"+(context || "personal")),label:contexts[context] || "Mi menú",replaces:context,slices:Array(8).fill(null)};
      choice.value=id; $("menu-name").value=draft.label; $("menu-context").value=draft.replaces || "";
      $("menu-error").textContent=""; draw();
    }
    function prospective(ring) {
      const rings = menus.rings.some(r => r.id === ring.id)
        ? menus.rings.map(r => r.id === ring.id ? ring : r) : [...menus.rings, ring];
      return { ...menus, rings };
    }
    function draw() {
      const menu = T.resolveMenu(prospective(draft),draft.replaces || "text","text",{},draft.id);
      T.drawStaticRing(doc,diagram,menu.slices);
    }
    function refresh(id = choice.value) {
      const defaults = Object.entries(contexts).filter(([k]) => !menus.rings.some(r => r.replaces===k)).map(([k,v])=>["default:"+k,v+" (predeterminado)"]);
      options(choice,[...defaults,...menus.rings.map(r=>[r.id,r.label]),["new","Nuevo anillo"]]);
      const actions = T.ACTIONS.filter(a=>a.contexts.some(c=>c!=="card")).map(a=>[a.id,a.label]);
      options($("menu-button"),[...actions,...menus.rings.map(r=>["ring:"+r.id,"Anillo · "+r.label])]);
      $("menu-button").value=menus.button;
      const personal=$("thumb-personal"), ring=menus.rings.find(r=>"ring:"+r.id===menus.button);
      if (ring) { personal.dataset.ring=ring.id; delete personal.dataset.actionId; }
      else { delete personal.dataset.ring; personal.dataset.actionId=menus.button; }
      personal.title=ring?.label || T.actionById(menus.button).label;
      choose(Array.from(choice.options).some(o=>o.value===id) ? id : choice.options[0].value);
    }
    function persist(value,id) {
      menus=value; writeWritingStorage(store,menus); refresh(id);
    }
    function saveDraft(slices = draft.slices) {
      const ring = {...draft,label:$("menu-name").value.trim(),replaces:$("menu-context").value || null,slices};
      const next = prospective(ring), errors=T.validateMenus(next);
      if (errors.length) { tell(errors.join(" ")); $("slice-error").textContent=errors.join(" "); return false; }
      persist(next,ring.id); return true;
    }
    function symbolOptions() {
      options($("slice-symbol"), T.filterMathSymbols($("slice-search").value).map(s=>[s.id,s.symbol+" · "+s.name]));
    }
    function preview() {
      const out=$("slice-preview"), warning=$("slice-warning"), source=$("slice-snippet").value;
      out.replaceChildren(); warning.textContent="";
      if (!source) return;
      try {
        const sample = source.replace(/(^|[^\\])#([0-9])/g,(_,prefix,n)=>prefix+(n==="0"?"":"x"));
        win.katex.render(sample,out,{throwOnError:true,trust:false,strict:"ignore"});
      } catch { out.textContent=source; warning.textContent="KaTeX no representa este fragmento. Puedes guardarlo."; }
    }
    function childButtons() {
      const names = children.map((s,i) => {
        const label=s?.label || T.actionById(s?.action)?.label || T.MATH_SYMBOLS.find(m=>m.id===s?.symbol)?.name || menus.rings.find(r=>r.id===s?.ring)?.label || "Vacío";
        const b=doc.createElement("button"); b.type="button"; b.dataset.child=i; b.textContent=directions[i]+" · "+label; return b;
      });
      $("slice-children").replaceChildren(...names); $("slice-children").hidden=Boolean($("slice-link").value);
    }
    function setTab(name) {
      kind=name;
      for(const tab of $("slice-tabs").children) {
        tab.hidden=child!==null && tab.dataset.kind==="submenu" && !menus.rings.some(r=>r.id!==draft.id);
        const selected=tab.dataset.kind===name;
        tab.setAttribute("aria-selected",String(selected)); tab.tabIndex=selected?0:-1;
      }
      $("slice-panel").setAttribute("aria-labelledby","slice-tab-"+name);
      for(const field of $("slice-panel").querySelectorAll("[data-kinds]")) field.hidden=!field.dataset.kinds.split(" ").includes(name);
      $("slice-error").textContent="";
      if (name==="snippet") preview();
    }
    function fillFields(s) {
      $("slice-heading").textContent=child===null ? directions[slot] : directions[slot]+" · "+directions[child];
      $("slice-tools").hidden=child!==null;
      $("slice-label").value=s?.label || ""; $("slice-icon").value=s?.icon || ""; $("slice-snippet").value=s?.snippet || "";
      $("slice-search").value=""; symbolOptions(); if (s?.symbol) $("slice-symbol").value=s.symbol;
      const actions=draft.replaces ? T.actionsFor(draft.replaces) : T.ACTIONS;
      options($("slice-action"),actions.map(a=>[a.id,a.label])); if (s?.action) $("slice-action").value=s.action;
      const links=menus.rings.filter(r=>r.id!==draft.id).map(r=>[r.id,r.label]);
      options($("slice-link"),child===null ? [["","Lista de sectores"],...links] : links);
      if (s?.ring) $("slice-link").value=s.ring;
      childButtons();
      setTab(s?.ring || s?.submenu ? "submenu" : Object.keys(tabs).find(k=>s && Object.hasOwn(s,k)) || "empty");
    }
    function openSlot(i) {
      slot=i; child=null;
      const s=draft.slices[i];
      children=Array.from({length:8},(_,j)=>clone(s?.submenu?.[j] ?? null));
      options($("slice-swap"),directions.map((v,j)=>[String(j),v]).filter(([j])=>Number(j)!==i));
      fillFields(s); dialog.showModal();
      $("slice-tabs").querySelector('[aria-selected="true"]').focus();
    }
    function readSlice() {
      const label=$("slice-label").value.trim(), icon=$("slice-icon").value.trim();
      if (kind==="snippet") return {snippet:$("slice-snippet").value,label,icon};
      if (kind==="symbol") return {symbol:$("slice-symbol").value};
      if (kind==="action") return {action:$("slice-action").value};
      if (kind==="submenu") {
        const ring=$("slice-link").value, labels={};
        if (label) labels.label=label;
        if (icon) labels.icon=icon;
        return ring ? {ring,...labels} : {submenu:children,...labels};
      }
      return null;
    }
    function finish() {
      dialog.close();
      diagram.querySelector('button[data-slot="'+slot+'"]').focus({preventScroll:true});
    }
    function updateSlot(value) {
      const slices=Array.from({length:8},(_,i)=>i===slot?value:draft.slices[i] ?? null);
      if (saveDraft(slices)) { finish(); tell("Posición guardada."); }
    }
    function portableSlice(item) {
      if (!item) return null;
      if (item.children) return {submenu:item.children.map(portableSlice),label:item.label,icon:item.icon};
      const a=item.action;
      if (a.type==="action") return {action:a.id,...(a.args?.length?{args:a.args}:{}),label:item.label.slice(0,24),icon:item.icon};
      if (a.type==="symbol") return {symbol:a.symbol};
      return {snippet:a.snippet,label:item.label,icon:item.icon};
    }
    function swap(a,b) {
      if (a===b) return false;
      const defaults=T.slicesFor(draft.replaces,"text");
      const slices=Array.from({length:8},(_,i)=>draft.slices[i] ?? null);
      const content=i=>slices[i] || portableSlice(defaults[i]);
      [slices[a],slices[b]]=[content(b),content(a)];
      return saveDraft(slices);
    }
    options($("menu-context"),[["","Ninguno (anillo independiente)"],...Object.entries(contexts)]);
    for (const [id,label] of Object.entries(tabs)) {
      const b=doc.createElement("button"); b.type="button"; b.setAttribute("role","tab"); b.id="slice-tab-"+id;
      b.setAttribute("aria-controls","slice-panel"); b.dataset.kind=id; b.textContent=label; $("slice-tabs").append(b);
    }
    on(choice,"change",()=>choose(choice.value));
    on($("menu-context"),"change",()=>{ draft.replaces=$("menu-context").value || null; draw(); });
    on($("menu-save"),"click",()=>{ if(saveDraft()) tell("Anillo guardado."); });
    on($("menu-button"),"change",()=>{ persist({...menus,button:$("menu-button").value},choice.value); tell("Mi botón actualizado."); });
    on($("menu-reset"),"click",()=>{
      const id=draft.id, rings=menus.rings.filter(r=>r.id!==id), next={...menus,rings,button:menus.button==="ring:"+id?"edit.undo":menus.button};
      if (T.validateMenus(next).length) { if(saveDraft(Array(8).fill(null))) tell("Posiciones restauradas. Otros anillos conservan su enlace."); return; }
      persist(next,draft.replaces?"default:"+draft.replaces:"new"); tell("Menú restaurado.");
    });
    on(diagram,"click",e=>{const hit=e.target.closest("[data-slot]"); if(hit) openSlot(Number(hit.dataset.slot));});
    on(diagram,"dragstart",e=>{dragSlot=Number(e.target.closest("[data-slot]")?.dataset.slot);e.dataTransfer.setData("text/plain",String(dragSlot));});
    on(diagram,"dragover",e=>{if(Number.isInteger(dragSlot))e.preventDefault();});
    on(diagram,"drop",e=>{const hit=e.target.closest("[data-slot]");if(hit && Number.isInteger(dragSlot)){e.preventDefault(); if(swap(dragSlot,Number(hit.dataset.slot))) tell("Posiciones intercambiadas.");} dragSlot=null;});
    on(diagram,"dragend",()=>{dragSlot=null;});
    on($("slice-tabs"),"click",e=>{if(e.target.dataset.kind)setTab(e.target.dataset.kind);});
    on($("slice-tabs"),"keydown",e=>{
      const visible=Array.from($("slice-tabs").children).filter(b=>!b.hidden);
      const i=visible.indexOf(doc.activeElement); if(i<0 || !["ArrowLeft","ArrowRight","Home","End"].includes(e.key))return;
      e.preventDefault(); const n=e.key==="Home"?0:e.key==="End"?visible.length-1:(i+(e.key==="ArrowLeft"?-1:1)+visible.length)%visible.length;
      setTab(visible[n].dataset.kind);visible[n].focus();
    });
    on($("slice-snippet"),"input",preview); on($("slice-search"),"input",symbolOptions);
    on($("slice-link"),"change",childButtons);
    on($("slice-children"),"click",e=>{
      if(!e.target.hasAttribute("data-child"))return;
      parentFields=readSlice(); child=Number(e.target.dataset.child); fillFields(children[child]);
      $("slice-tabs").querySelector('[aria-selected="true"]').focus();
    });
    function returnToParent() { child=null;fillFields({...parentFields,submenu:children});$("slice-tab-submenu").focus(); }
    on($("slice-save"),"click",()=>{
      const entry=readSlice();
      if(child===null){updateSlot(entry);return;}
      const list=children.slice();list[child]=entry;
      const slices=Array.from({length:8},(_,i)=>i===slot?{...parentFields,submenu:list}:draft.slices[i] ?? null);
      const errors=T.validateMenus(prospective({...draft,slices}));
      if(errors.length){$("slice-error").textContent=errors.join(" ");return;}
      children=list;returnToParent();
    });
    on($("slice-cancel"),"click",()=>child===null?finish():returnToParent());
    on(dialog,"cancel",e=>{e.preventDefault();if(child===null)finish();else returnToParent();});
    on($("slice-reset"),"click",()=>updateSlot(null));
    on($("slice-exchange"),"click",()=>{if(swap(slot,Number($("slice-swap").value))){finish();tell("Posiciones intercambiadas.");}});
    refresh();
    return { read:()=>menus, apply:value=>persist(T.migrateMenus(value)), resolve:(...args)=>T.resolveMenu(menus,...args),
      dispose(){events.abort();if(dialog.open)dialog.close();} };
  };
})(globalThis.TexNotes);
