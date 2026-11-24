/** Modelo y formato del informe local. No depende de la página, la hora ni el almacenamiento. */
(function (T) {
  "use strict";
  function stringValue(value, fallback = "") {
    try { return value == null ? fallback : String(value).slice(0, 2000); }
    catch { return fallback; }
  }
  function property(value, field) {
    try { return value?.[field]; } catch { return undefined; }
  }
  function errorRecord(reason, fallback, date, context) {
    const message = property(reason, "message") || fallback || reason;
    const stack = stringValue(property(reason, "stack")).split(/\r?\n/).filter(Boolean).slice(0, 3);
    return { message: stringValue(message, "Error sin mensaje"), stack, date, context };
  }
  function recentErrors(entries, entry) {
    const list = Array.isArray(entries) ? entries.filter(item => item && typeof item.message === "string" &&
      typeof item.date === "string" && typeof item.context === "string" && Array.isArray(item.stack)) : [];
    return (entry ? [...list, entry] : list).slice(-20);
  }
  function formatErrors(entries) {
    return recentErrors(entries).slice().reverse().map(item =>
      [item.date+" · "+item.context, item.message, ...item.stack.slice(0,3)].join("\n")).join("\n\n");
  }
  Object.assign(T, {errorRecord, recentErrors, formatErrors});
})(globalThis.TexNotes);
