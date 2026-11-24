/** Instantáneas, versiones, formato de intercambio y autoguardado local. */
(function (T) {
  "use strict";
  const origins = ["manual", "exportación", "respaldo"];
  const isoDate = s => typeof s === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(s) && Number.isFinite(Date.parse(s));
  const validDocumentId = id => typeof id === "string" && /^d[a-z0-9]{8}$/.test(id);
  function documentSnapshot({ metadata, blocks, macros, references, bibliography }) {
    return { version: T.DRAFT_VERSION, metadata: { ...metadata }, blocks: T.cloneBlocks(blocks), macros: T.normalizeMacros(macros),
      references: T.normalizeReferences(references), bibliography: T.normalizeBibliography(bibliography) };
  }
  function canonical(value) {
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])]));
    return value;
  }
  const equal = (a,b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
  const sameDocument = (a,b) => equal(documentSnapshot(a), documentSnapshot(b));
  const historyEntry = (data,focusId) => ({ documentId: data.documentId, state: documentSnapshot(data), focusId });
  function rememberHistory(history, entry) { return { past: [...history.past,entry].slice(-100), future: [] }; }
  function travelHistory(history,current,direction) {
    const back = direction === "undo", source = back ? history.past : history.future;
    if (!source.length) return null;
    const remaining = source.slice(0,-1);
    return { entry: source.at(-1), history: back ? { past:remaining, future:[...history.future,current] } :
      { past:[...history.past,current].slice(-100), future:remaining } };
  }
  function diffLines(before, after) {
    if (before.length + after.length > 16000) return { truncated:true, changes:[] };
    const a = before.split("\n"), b = after.split("\n");
    if (a.length > 200 || b.length > 200) return { truncated:true, changes:[] };
    const keep = Array.from({length:a.length+1}, () => new Uint16Array(b.length+1));
    for (let i=a.length-1;i>=0;i--) for (let j=b.length-1;j>=0;j--) {
      keep[i][j] = a[i] === b[j] ? 1+keep[i+1][j+1] : Math.max(keep[i+1][j],keep[i][j+1]);
    }
    const changes = [];
    let i=0,j=0;
    while (i<a.length || j<b.length) {
      if (i<a.length && j<b.length && a[i]===b[j]) { i++; j++; }
      else if (i<a.length && (j===b.length || keep[i+1][j] >= keep[i][j+1])) {
        changes.push({kind:"removed",line:i+1,text:a[i++]});
      } else changes.push({kind:"added",line:j+1,text:b[j++]});
    }
    return { truncated:false, changes };
  }
  function changedKeys(a,b) {
    return [...new Set([...Object.keys(a),...Object.keys(b)])].filter(k=>!equal(a[k],b[k])).map(key=>({key,before:a[key],after:b[key]}));
  }
  function diffDocuments(a,b) {
    const index = doc => new Map(T.flattenBlocks(doc.blocks).map(({block,parent,position}) =>
      [block.id,{block,parent:parent?.id || null,position}]));
    const left=index(a), right=index(b);
    const byName = list => Object.fromEntries((list||[]).map(m=>[m.name,m]));
    const result={added:[],removed:[],moved:[],modified:[],metadata:changedKeys(a.metadata||{},b.metadata||{}),macros:changedKeys(byName(a.macros),byName(b.macros))};
    const refs = doc => Object.fromEntries(T.normalizeReferences(doc.references).map(r => [r.key, r]));
    result.references = changedKeys(refs(a), refs(b)).map(change => ({ ...change,
      kind: change.before === undefined ? "added" : change.after === undefined ? "removed" : "modified" }));
    result.bibliography = changedKeys(T.normalizeBibliography(a.bibliography), T.normalizeBibliography(b.bibliography));
    const names = list => (list||[]).map(m=>m.name);
    if (!equal(names(a.macros),names(b.macros)) && equal([...names(a.macros)].sort(),[...names(b.macros)].sort())) {
      result.macros.push({key:"orden",before:names(a.macros),after:names(b.macros)});
    }
    for (const [id,{block}] of left) if (!right.has(id)) result.removed.push({id,title:block.title,type:block.type});
    for (const [id,entry] of right) {
      const old=left.get(id), block=entry.block;
      const info={id,title:block.title,type:block.type};
      if (!old) { result.added.push(info); continue; }
      if (old.parent!==entry.parent || old.position!==entry.position) result.moved.push({...info,
        from:{parent:old.parent,position:old.position},to:{parent:entry.parent,position:entry.position}});
      const fields=["type","title","content","options","listFormat","label"].filter(k=>!equal(old.block[k],block[k]));
      if (fields.length) result.modified.push({...info,fields,
        ...(fields.includes("content") ? {lines:diffLines(old.block.content,block.content)} : {})});
    }
    return result;
  }
  function newestFirst(rows) {
    return [...rows].sort((a,b)=>b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
  }
  function pruneVersions(rows, limit=30) {
    const count = new Map();
    return newestFirst(rows).filter(v=>{
      if (v.origin==="manual") return true;
      const n=count.get(v.documentId)||0; count.set(v.documentId,n+1); return n<limit;
    });
  }
  function mergeVersions(existing, incoming) {
    const all=new Map(existing.map(v=>[v.id,v]));
    for (const v of incoming) if (!all.has(v.id)) all.set(v.id,v);
    return [...all.values()];
  }
  function versionRecord(id, documentId, createdAt, label, origin, data) {
    const state=documentSnapshot(data);
    return {id,documentId,createdAt,label,origin,state,summary:{title:state.metadata.title||"",blocks:T.countBlocks(state.blocks)}};
  }
  function upgradeStoredVersions(rows) {
    return rows.map(row => {
      if (!row.state || row.state.version >= T.DRAFT_VERSION) return row;
      const draft = T.normalizeDraft({ ...row.state, documentId: row.documentId });
      return draft ? { ...row, state: documentSnapshot(draft) } : row;
    });
  }
  function addVersion(rows, data, options, limit=30) {
    const latest=newestFirst(rows.filter(v=>v.documentId===data.documentId))[0];
    if (options.origin==="exportación" && latest && sameDocument(latest.state,data)) return rows;
    const time=Math.max(Date.parse(options.createdAt),latest ? Date.parse(latest.createdAt)+1 : 0);
    const used=new Set(rows.map(v=>v.id));
    let id=options.id, suffix=0;
    while (used.has(id)) id=options.id+"-"+(++suffix);
    const record=versionRecord(id,data.documentId,new Date(time).toISOString(),options.label||"",options.origin,data);
    return pruneVersions(mergeVersions(rows,[record]),limit);
  }
  function migrateSingleDraft(rows, raw, options) {
    const id="borrador-guardado-migrado";
    const prior=rows.find(v=>v.id===id);
    if (prior) return {rows,documentId:prior.documentId};
    const draft=T.normalizeDraft(raw);
    if (!draft) return null;
    draft.documentId=validDocumentId(raw.documentId) ? raw.documentId : options.documentId;
    return {rows:addVersion(rows,draft,{...options,id,origin:"manual",label:"Borrador guardado (migrado)"}),documentId:draft.documentId};
  }
  function validateProject(raw) {
    const fail = error => ({error,skipped:[],project:null});
    try {
      if (typeof raw==="string") raw=JSON.parse(raw);
      if (raw?.kind!=="notas-latex-proyecto" || raw.version!==1 || !validDocumentId(raw.documentId) ||
        !Array.isArray(raw.versions) || !isoDate(raw.exportedAt)) return fail("Formato o versión de proyecto incompatible.");
      const readState = s => {
        if (!s || !Array.isArray(s.blocks) || (s.version >= 3 && !Array.isArray(s.macros))) return null;
        if (s.version >= 6 && (!Array.isArray(s.references) || !s.bibliography ||
            !["ieee","apa"].includes(s.bibliography.style) || typeof s.bibliography.includeUncited !== "boolean" ||
            T.normalizeReferences(s.references).length !== s.references.length)) return null;
        const draft=T.normalizeDraft({...s,documentId:raw.documentId});
        return draft && documentSnapshot(draft);
      };
      const current=readState(raw.current);
      if (!current) return fail("El estado actual del proyecto es inválido.");
      if (raw.config && T.validateConfiguration(raw.config).length) return fail("La configuración incluida es inválida.");
      const skipped=[], versions=[], ids=new Set();
      raw.versions.forEach((v,index)=>{
        const state=readState(v?.state);
        if (!state || typeof v.id!=="string" || !v.id.trim() || ids.has(v.id) || v.documentId!==raw.documentId ||
          !origins.includes(v.origin) || typeof v.label!=="string" || !isoDate(v.createdAt)) {
          skipped.push(typeof v?.id==="string" ? v.id : "posición " + (index+1)); return;
        }
        ids.add(v.id); versions.push(versionRecord(v.id,v.documentId,new Date(v.createdAt).toISOString(),v.label,v.origin,state));
      });
      return {error:null,skipped,project:{kind:raw.kind,version:1,exportedAt:raw.exportedAt,documentId:raw.documentId,current,versions,
        ...(raw.config?{config:raw.config}:{})}};
    } catch { return fail("No se pudo leer el proyecto JSON."); }
  }
  Object.assign(T,{validDocumentId,documentSnapshot,sameDocument,historyEntry,rememberHistory,travelHistory,diffLines,diffDocuments,
    newestFirst,pruneVersions,mergeVersions,addVersion,migrateSingleDraft,upgradeStoredVersions,validateProject});
  const autosaveKey = "tex-notes:autosave:v1";
  T.session = {
    // Recibe la ventana: leer `localStorage` lanza si el sitio no tiene almacenamiento.
    read(win) {
      try {
        const raw = JSON.parse(win.localStorage.getItem(autosaveKey));
        const draft = T.normalizeDraft(raw);
        return draft ? { ...raw, ...draft } : null;
      } catch { return null; }
    },
    discard(storage) { storage.removeItem(autosaveKey); },
    bind(document, form, previous, snapshot) {
      const win = document.defaultView;
      const status = document.querySelector("#session-status");
      let timer, backedUp = false;
      /* @decision DEC-019 ancla:70c280cd tramo:15
       * El autoguardado omite sesiones vacías y conserva una copia de la
       * sesión anterior antes de escribir la primera vez.
       */
      function save() {
        win.clearTimeout(timer);
        const session = { ...snapshot(), savedAt: new Date().toISOString() };
        if (!T.sessionHasContent(session)) { status.textContent = ""; return; }
        try {
          const storage = win.localStorage;
          if (!backedUp && T.sessionHasContent(previous())) {
            storage.setItem("tex-notes:autosave:previous", JSON.stringify(previous()));
          }
          storage.setItem(autosaveKey, JSON.stringify(session));
          backedUp = true;
          status.textContent = "Sesión guardada en este navegador";
        } catch {
          status.textContent = "No se pudo guardar la sesión en este navegador";
        }
      }
      function schedule(event) {
        if (event?.target.closest(".structure-filters, .symbol-board")) return;
        status.textContent = "Cambios pendientes de guardar";
        win.clearTimeout(timer);
        timer = win.setTimeout(save, 800);
      }
      form.addEventListener("input", schedule);
      form.addEventListener("change", schedule);
      document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });
      win.addEventListener("pagehide", save);
      return { save, schedule };
    },
  };
})(globalThis.TexNotes);
