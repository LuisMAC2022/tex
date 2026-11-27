/**
 * Inserción de texto en la posición del cursor.
 *
 * insertAtSelection es pura: recibe el estado de un campo y devuelve el estado
 * siguiente, sin tocar el DOM. Los índices son los mismos que usan selectionStart
 * y selectionEnd, es decir, unidades de código UTF-16; por eso las porciones se
 * recortan con slice y cualquier carácter fuera del plano básico se conserva
 * íntegro siempre que el navegador entregue índices válidos.
 */
(function (global) {
  "use strict";
  const TexNotes = global.TexNotes || (global.TexNotes = {});

  function clampIndex(index, length, fallback) {
    return Number.isInteger(index) ? Math.min(Math.max(index, 0), length) : fallback;
  }

  /**
   * Sustituye la selección —o inserta en el cursor si está plegada— y devuelve el
   * contenido resultante junto con la posición del cursor tras lo insertado.
   */
  function insertAtSelection({ value = "", selectionStart, selectionEnd, insertion = "", before, after } = {}) {
    const text = String(value);
    const wraps = before !== undefined || after !== undefined;
    const prefix = String(before === undefined ? insertion : before);
    const suffix = String(after === undefined ? "" : after);
    const length = text.length;
    let start = clampIndex(selectionStart, length, length);
    let end = clampIndex(selectionEnd, length, start);
    if (start > end) [start, end] = [end, start];
    const selected = text.slice(start, end);
    const inserted = wraps ? `${prefix}${selected}${suffix}` : prefix;
    const cursor = start + prefix.length + (wraps && selected ? selected.length + suffix.length : 0);
    return {
      value: `${text.slice(0, start)}${inserted}${text.slice(end)}`,
      selectionStart: cursor,
      selectionEnd: cursor,
      replaced: selected,
    };
  }

  /** Reemplazo mínimo, con límites que respetan los pares sustitutos UTF-16. */
  function diffEdit(oldValue, newValue) {
    if (oldValue === newValue) return null;
    let start = 0, oldEnd = oldValue.length, newEnd = newValue.length;
    while (start < oldEnd && start < newEnd && oldValue[start] === newValue[start]) start++;
    const splitsPair = (text, index) => index > 0 && index < text.length
      && /[\uD800-\uDBFF]/.test(text[index - 1]) && /[\uDC00-\uDFFF]/.test(text[index]);
    if (splitsPair(oldValue, start) || splitsPair(newValue, start)) start--;
    while (oldEnd > start && newEnd > start && oldValue[oldEnd - 1] === newValue[newEnd - 1]) { oldEnd--; newEnd--; }
    if (splitsPair(oldValue, oldEnd) || splitsPair(newValue, newEnd)) { oldEnd++; newEnd++; }
    return { start, end: oldEnd, text: newValue.slice(start, newEnd) };
  }

  let applying = false;
  /* @decision DEC-016 ancla:da87aee8 tramo:23
   * execCommand integra la edición en el historial nativo del textarea. El
   * respaldo conserva el texto si el navegador no admite ese comando.
   * La bandera impide que el asistente complete sus propias inserciones.
   */
  function applyFieldEdit(field, edit) {
    const change = diffEdit(field.value, edit.value);
    const previous = applying;
    applying = true;
    try {
      field.focus();
      if (change) {
        const { start, end, text } = change;
        field.setSelectionRange(start, end);
        let done = false;
        try { done = field.ownerDocument.execCommand(text ? "insertText" : "delete", false, text); } catch { /* respaldo */ }
        if (!done) {
          field.setRangeText(text, start, end, "end");
          field.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
      field.setSelectionRange(edit.selectionStart, edit.selectionEnd, edit.selectionDirection || "none");
    } finally { applying = previous; }
    return edit;
  }

  function insertIntoField(field, insertion) {
    const options = typeof insertion === "object" ? insertion : { insertion };
    const result = insertAtSelection({ value: field.value, selectionStart: field.selectionStart, selectionEnd: field.selectionEnd, ...options });
    return applyFieldEdit(field, result);
  }

  Object.assign(TexNotes, { insertAtSelection, insertIntoField, diffEdit, applyFieldEdit, isApplyingFieldEdit: () => applying });
})(typeof globalThis !== "undefined" ? globalThis : this);
