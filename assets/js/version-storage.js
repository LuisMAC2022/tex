/** Adaptadores de la interfaz. Una operación modifica todas sus versiones en una transacción. */
(function (T) {
  "use strict";
  const key="tex-notes:versions:v1";
  function indexedStore(db) {
    function run(change) {
      return new Promise((resolve,reject)=>{
        const tx=db.transaction("versions",change?"readwrite":"readonly"), store=tx.objectStore("versions");
        let result, problem;
        tx.oncomplete=()=>resolve(result);
        tx.onabort=()=>reject(problem || tx.error || new Error("Transacción cancelada"));
        tx.onerror=()=>{ problem ||= tx.error; };
        const req=store.getAll();
        req.onsuccess=()=>{
          const rows=req.result;
          try {
            result=change ? change(rows) : rows;
            if (!change) return;
            const old=new Map(rows.map(row=>[row.id,row]));
            for (const row of result) { if (old.get(row.id)!==row) store.put(row); old.delete(row.id); }
            for (const id of old.keys()) store.delete(id);
          } catch(e) { problem=e; tx.abort(); }
        };
      });
    }
    return {kind:"IndexedDB",limit:30,read:()=>run(),update:run};
  }
  function localStore(env) {
    const read=()=>{ const rows=JSON.parse(env.localStorage.getItem(key)||"[]"); if (!Array.isArray(rows)) throw Error("Versiones ilegibles"); return rows; };
    async function update(change) {
      const write=()=>{const rows=change(read()); env.localStorage.setItem(key,JSON.stringify(rows)); return rows;};
      return env.navigator?.locks ? env.navigator.locks.request(key,write) : write();
    }
    return {kind:"localStorage",limit:8,read:async()=>read(),update};
  }
  async function openVersionStore(env) {
    try {
      const db=await new Promise((resolve,reject)=>{
        const request=env.indexedDB.open("tex-notes",1);
        request.onupgradeneeded=()=>{ if (!request.result.objectStoreNames.contains("versions")) request.result.createObjectStore("versions",{keyPath:"id"}); };
        let blocked=false;
        request.onsuccess=()=>{ if (blocked) request.result.close(); else resolve(request.result); };
        request.onerror=()=>reject(request.error);
        request.onblocked=()=>{blocked=true;reject(Error("Almacén bloqueado"));};
      });
      db.onversionchange=()=>db.close();
      const store=indexedStore(db);
      async function recoverLocal() {
        const saved=env.localStorage.getItem(key);
        if (!saved) return;
        const rows=JSON.parse(saved);
        if (!Array.isArray(rows)) throw Error("La copia local es ilegible.");
        await store.update(existing=>T.pruneVersions(T.mergeVersions(existing,rows),store.limit));
        if (env.localStorage.getItem(key)===saved) env.localStorage.removeItem(key);
      }
      try {
        if (env.navigator?.locks) await env.navigator.locks.request(key,recoverLocal);
        else await recoverLocal();
      } catch { store.notice="No se pudo incorporar la copia alternativa de versiones."; }
      return store;
    } catch { return localStore(env); }
  }
  T.openVersionStore=openVersionStore;
})(globalThis.TexNotes);
