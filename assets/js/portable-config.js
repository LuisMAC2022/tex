(function (T) {
  "use strict";
  T.createPortableConfig = function (doc, parts, announce) {
    const $ = selector => doc.querySelector(selector), win = doc.defaultView;
    const events = new AbortController(), options = { signal: events.signal };
    function portableConfig() {
      return T.buildConfig(Object.fromEntries(Object.entries(parts).map(([key, part]) => [key, part.read()])));
    }
    function applyPortableConfig(data, applyDefaults = true) {
      const checked = T.validateConfig(data);
      if (checked.errors.length) throw Error(checked.errors.join(" "));
      for (const [key, value] of Object.entries(checked.values)) parts[key].apply(value, applyDefaults);
      return checked.warnings;
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
        const data = JSON.parse(await file.text()), { errors, warnings } = T.validateConfig(data);
        if (errors.length) { announce(errors.join(" ")); return; }
        if (!win.confirm(["¿Reemplazar con este archivo las partes incluidas en la configuración?", ...warnings].join(" "))) return;
        applyPortableConfig(data);
        announce(["Configuración importada.", ...warnings].join(" "));
      } catch { announce("No se pudo leer la configuración. Comprueba que sea un archivo JSON válido."); }
      finally { event.target.value = ""; }
    }, options);
    return { portableConfig, applyPortableConfig, dispose: () => events.abort() };
  };
})(globalThis.TexNotes);
