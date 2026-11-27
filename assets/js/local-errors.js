(function (T) {
  "use strict";
  T.createErrorReport = function (doc, {copy}) {
    const win=doc.defaultView, $=selector=>doc.querySelector(selector);
    const key="tex-notes:errors:v1", sessionKey="tex-notes:errors:aviso";
    const events=new AbortController(), options={signal:events.signal};
    const notice=$("#error-notice"), report=$("#error-report"), area=$("#error-report-text"), status=$("#error-report-status");
    function read(previous=[]) {
      try { return T.recentErrors(JSON.parse(win.localStorage.getItem(key) || "[]")); }
      catch { return previous; }
    }
    let entries=read(), warned=false, memoryOnly=false;
    try { warned=win.sessionStorage.getItem(sessionKey)==="1"; } catch { /* La pestaña mantiene su estado en memoria. */ }
    function refresh() {
      area.value=T.formatErrors(entries);
      $("#error-report-copy").disabled=$("#error-report-clear").disabled=!entries.length;
      status.textContent=entries.length ? entries.length+(entries.length===1?" error registrado.":" errores registrados.") : "Sin errores registrados.";
    }
    function save() {
      try {
        if(entries.length) win.localStorage.setItem(key,JSON.stringify(entries));
        else win.localStorage.removeItem(key);
        memoryOnly=false;
      } catch { memoryOnly=true; }
      refresh();
      if(memoryOnly) status.textContent+=" El informe se conserva en esta pestaña.";
    }
    function context() {
      const panel=$('#mobile-navigation:not([hidden]) [aria-selected="true"]')?.textContent || "Escritorio";
      const dialog=$("dialog[open]"), menu=$('.radial-layer:not([hidden]) [role="menu"]');
      const opened=[panel];
      if(dialog) opened.push(doc.getElementById(dialog.getAttribute("aria-labelledby"))?.textContent || "Diálogo");
      if(menu) opened.push(menu.getAttribute("aria-label"));
      if($("#assist-list:not([hidden])")) opened.push("Sugerencias");
      if($(".symbol-sheet")) opened.push("Símbolos");
      if(panel==="Escribir" || panel==="Escritorio") opened.push($("#block-type")?.selectedOptions[0]?.textContent);
      return opened.filter(Boolean).join(" · ");
    }
    function record(reason,fallback) {
      if(!memoryOnly) entries=read(entries);
      entries=T.recentErrors(entries,T.errorRecord(reason,fallback,new Date().toISOString(),context()));
      save();
      if(!warned) {
        warned=true; notice.hidden=false;
        try { win.sessionStorage.setItem(sessionKey,"1"); } catch { /* Una vez en esta pestaña. */ }
      }
    }
    async function copyReport() {
      const text=T.formatErrors(entries);
      try { await copy(text); status.textContent="Informe copiado."; $("#error-notice-status").textContent="Informe copiado."; }
      catch {
        const tab=doc.body.dataset.workspaceView ? $("#workspace-document") : $("#tab-more"); if(tab?.getClientRects().length) tab.click();
        report.open=true; area.focus(); area.select(); status.textContent="Selecciona Copiar para copiar el informe.";
      }
    }
    win.addEventListener("error",e=>record(e.error,e.message),options);
    win.addEventListener("unhandledrejection",e=>record(e.reason),options);
    win.addEventListener("storage",e=>{
      if(e.key!==null && e.key!==key)return;
      entries=read(entries);refresh();if(!entries.length)notice.hidden=true;
    },options);
    $("#error-notice-copy").addEventListener("click",copyReport,options);
    $("#error-report-copy").addEventListener("click",copyReport,options);
    $("#error-notice-close").addEventListener("click",()=>{notice.hidden=true;},options);
    $("#error-report-clear").addEventListener("click",()=>{
      entries=[];save();notice.hidden=true;report.querySelector("summary").focus();
    },options);
    refresh();
    return {dispose(){events.abort();}};
  };
})(globalThis.TexNotes);
