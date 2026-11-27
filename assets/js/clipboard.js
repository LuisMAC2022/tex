(function (global) {
  "use strict";
  const T = global.TexNotes || (global.TexNotes = {});
  T.createClipboard = function (document) {
    /**
     * Copia al portapapeles del sistema. Sin la API moderna —file:// o permiso
     * denegado— se recurre a seleccionar un campo: el de salida cuando existe, o
     * uno temporal fuera de la vista para el texto de un bloque.
     */
    return async function copyToClipboard(text, field = null) {
      if (document.defaultView.navigator.clipboard?.writeText) { await document.defaultView.navigator.clipboard.writeText(text); return; }
      const source = field || document.createElement("textarea");
      if (!field) {
        source.value = text;
        source.setAttribute("readonly", "");
        source.setAttribute("aria-hidden", "true");
        source.style.cssText = "position:fixed;top:-1000px;left:-1000px";
        document.body.append(source);
      }
      source.focus(); source.select();
      const copied = document.execCommand("copy");
      if (!field) source.remove();
      if (!copied) throw new Error("No se pudo copiar");
    }
  };
})(globalThis);
