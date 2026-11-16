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

  /**
   * Aplica insertAtSelection a un input o textarea, devuelve el foco al campo
   * y deja el cursor después de lo insertado.
   */
  function insertIntoField(field, insertion) {
    const options = typeof insertion === "object" ? insertion : { insertion };
    const result = insertAtSelection({ value: field.value, selectionStart: field.selectionStart, selectionEnd: field.selectionEnd, ...options });
    field.value = result.value;
    field.focus();
    field.setSelectionRange(result.selectionStart, result.selectionEnd);
    return result;
  }

  Object.assign(TexNotes, { insertAtSelection, insertIntoField });
})(typeof globalThis !== "undefined" ? globalThis : this);
