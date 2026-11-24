(function (T) {
  "use strict";
  T.createPortableConfig = function (doc, parts, announce) {
    const $ = selector => doc.querySelector(selector), win = doc.defaultView;
    const events = new AbortController(), options = { signal: events.signal };
    function portableConfig() {
      return { kind: "notas-latex-config", version: 1, aliases: parts.aliases.read(), templates: parts.templates.read(),
        prefs: parts.prefs.read(), macros: parts.macros.read(), references: parts.references.read() };
    }
    function applyPortableConfig(data, applyDefaults = true) {
      for (const key of ["aliases", "templates", "prefs", "macros", "references"]) {
        if (data[key] !== undefined) parts[key].apply(data[key], applyDefaults);
      }
    }
    $("#export-config").addEventListener("click", () => {
      const data = portableConfig();
      const url = win.URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
      const link = doc.createElement("a"); link.href = url; link.download = "notas-latex-configuracion.json"; doc.body.append(link); link.click(); link.remove();
      win.setTimeout(() => win.URL.revokeObjectURL(url), 0); announce("Configuración exportada.");
    }, options);
    $("#import-config").addEventListener("change", async (event) => {
      const file = event.target.files[0]; if (!file) return;
      try {
        const data = JSON.parse(await file.text()), errors = T.validateConfiguration(data);
        if (errors.length) { announce(errors.join(" ")); return; }
        if (!win.confirm("¿Reemplazar con este archivo las preferencias y los catálogos incluidos en la configuración?")) return;
        applyPortableConfig(data);
        announce("Configuración importada.");
      } catch { announce("No se pudo leer la configuración. Comprueba que sea un archivo JSON válido."); }
      finally { event.target.value = ""; }
    }, options);
    return { portableConfig, applyPortableConfig, dispose: () => events.abort() };
  };
})(globalThis.TexNotes);
