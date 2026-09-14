/**
 * Inserción de texto en la posición del cursor.
 *
 * `insertAtSelection` es pura: recibe el estado de un campo y devuelve el estado
 * siguiente, sin tocar el DOM. Los índices son los mismos que usan `selectionStart`
 * y `selectionEnd`, es decir, unidades de código UTF-16; por eso las porciones se
 * recortan con `slice` y cualquier carácter fuera del plano básico se conserva
 * íntegro siempre que el navegador entregue índices válidos.
 */

function clampIndex(index, length, fallback) {
  return Number.isInteger(index) ? Math.min(Math.max(index, 0), length) : fallback;
}

/**
 * Sustituye la selección —o inserta en el cursor si está plegada— y devuelve el
 * contenido resultante junto con la posición del cursor tras lo insertado.
 *
 * @param {{value?: string, selectionStart?: number, selectionEnd?: number, insertion?: string}} options
 * @returns {{value: string, selectionStart: number, selectionEnd: number, replaced: string}}
 */
export function insertAtSelection({ value = "", selectionStart, selectionEnd, insertion = "" } = {}) {
  const text = String(value);
  const inserted = String(insertion);
  const length = text.length;
  let start = clampIndex(selectionStart, length, length);
  let end = clampIndex(selectionEnd, length, start);
  if (start > end) [start, end] = [end, start];
  const cursor = start + inserted.length;
  return {
    value: `${text.slice(0, start)}${inserted}${text.slice(end)}`,
    selectionStart: cursor,
    selectionEnd: cursor,
    replaced: text.slice(start, end),
  };
}

/**
 * Aplica `insertAtSelection` a un `input` o `textarea`, devuelve el foco al campo
 * y deja el cursor después de lo insertado.
 */
export function insertIntoField(field, insertion) {
  const result = insertAtSelection({ value: field.value, selectionStart: field.selectionStart, selectionEnd: field.selectionEnd, insertion });
  field.value = result.value;
  field.focus();
  field.setSelectionRange(result.selectionStart, result.selectionEnd);
  return result;
}
