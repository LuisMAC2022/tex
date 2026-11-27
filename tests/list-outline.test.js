import test from "node:test";
import assert from "node:assert/strict";
import { loadTexNotes } from "./load-app.mjs";

const { parseListOutline, limitListOutline, outlineToLatex, shiftLines, continueListLine } = await loadTexNotes(["list-outline.js"]);

const item = (content, children = null) => ({ content, children });
const list = (type, ...items) => ({ type, items });
const plain = (data) => structuredClone(data);

test("la sangría acepta espacios y tabuladores, recorta saltos e ignora líneas vacías y CRLF", () => {
  const input = "  Primera al nivel raíz\r\n    Hija\r\n\t\tNieta\r\n\t  \r\n\tOtra hija\r\n  Con espacios\r\n Raíz con un espacio";
  assert.deepEqual(plain(parseListOutline(input, "enumerate")), list("enumerate",
    item("Primera al nivel raíz", list("enumerate",
      item("Hija", list("enumerate", item("Nieta"))), item("Otra hija"), item("Con espacios"),
    )),
    item("Raíz con un espacio"),
  ));
});

test("los marcadores fijan el tipo de un subnivel al abrirlo y se consumen en todos los niveles", () => {
  const input = "- A\n  4. B\n    * C\n    2) D\n  - E\n{}- Guion literal\n  * F\nG\n  2) H\n  I\n-";
  assert.deepEqual(plain(parseListOutline(input)), list("itemize",
    item("A", list("enumerate", item("B", list("itemize", item("C"), item("D"))), item("E"))),
    item("{}- Guion literal", list("itemize", item("F"))),
    item("G", list("enumerate", item("H"), item("I"))),
    item("-"),
  ));
});

test("las posiciones opcionales apuntan al texto en listas planas y anidadas, incluso al recortar niveles", () => {
  const content = "- Padre\r\n\r\n  12) $😀$";
  const annotated = parseListOutline(content, "itemize", "outline", { withPositions: true });
  const { tree } = limitListOutline(annotated, { total: 5 });
  assert.deepEqual(plain(tree.items), [
    { content: "Padre", children: null, line: 1, column: 3 },
    { content: "$😀$", children: null, line: 3, column: 7 },
  ]);
  const flat = parseListOutline(content, "itemize", "flat", { withPositions: true });
  assert.deepEqual(plain(flat.items), [
    { content: "- Padre", children: null, line: 1, column: 1 },
    { content: "12) $😀$", children: null, line: 3, column: 3 },
  ]);
});

test("la salida de una lista mixta sangra solo los subniveles y preserva el contenido literal", () => {
  const input = "- Raíz \\textbf{A}\n  1. $x_1 & y$\n    * {}- Guion literal.\nOtra raíz 50%";
  assert.equal(outlineToLatex(parseListOutline(input)), [
    "\\begin{itemize}", "\\item Raíz \\textbf{A}",
    "  \\begin{enumerate}", "  \\item $x_1 & y$",
    "    \\begin{itemize}", "    \\item {}- Guion literal.", "    \\end{itemize}",
    "  \\end{enumerate}", "\\item Otra raíz 50%", "\\end{itemize}",
  ].join("\n"));
});

test("hay como máximo cuatro listas del mismo tipo y se conservan los elementos recortados en orden", () => {
  const input = "Uno\n  Dos\n    Tres\n      Cuatro\n        Cinco\n          Seis\n        Siete\n      Ocho";
  const tree = parseListOutline(input);
  const before = plain(tree);
  const output = outlineToLatex(tree);
  assert.equal(output.match(/\\begin\{itemize\}/g).length, 4);
  assert.match(output, /      \\item Cuatro\n      \\item Cinco\n      \\item Seis\n      \\item Siete\n      \\item Ocho/);
  assert.deepEqual(plain(tree), before);
});

test("el límite total cuenta las listas mixtas y los entornos que ya rodean al bloque", () => {
  const input = "- Nivel 1\n  1. Nivel 2\n    - Nivel 3\n      1. Nivel 4\n        - Nivel 5\n          1. Nivel 6\n            - Nivel 7";
  const tree = parseListOutline(input);
  const root = outlineToLatex(tree);
  assert.equal(root.match(/\\begin\{/g).length, 6);
  assert.match(root, /          \\item Nivel 6\n          \\item Nivel 7/);
  const deep = outlineToLatex(tree, { total: 2, itemize: 1, enumerate: 0 });
  assert.equal(deep.match(/\\begin\{/g).length, 4);
  assert.match(deep, /      \\item Nivel 4\n      \\item Nivel 5\n      \\item Nivel 6\n      \\item Nivel 7/);
  assert.equal(outlineToLatex(tree, { total: 6, itemize: 0, enumerate: 0 }),
    "Nivel 1\n\nNivel 2\n\nNivel 3\n\nNivel 4\n\nNivel 5\n\nNivel 6\n\nNivel 7");
});

test("sangrar conserva una selección invertida con Unicode y excluye la línea tras su extremo", () => {
  const value = "α😀\nβ\nγ";
  const shifted = shiftLines({ value, selectionStart: 6, selectionEnd: 1 }, 1);
  assert.deepEqual(plain(shifted), { value: "  α😀\n  β\nγ", selectionStart: 3, selectionEnd: 10 });
  assert.deepEqual(plain(shiftLines(shifted, -1)), { value, selectionStart: 1, selectionEnd: 6 });
});

test("quitar sangría ajusta cursores dentro del prefijo, respeta líneas planas y retira espacios o tabulador", () => {
  assert.deepEqual(plain(shiftLines({ value: "  α", selectionStart: 1 }, -1)),
    { value: "α", selectionStart: 0, selectionEnd: 0 });
  assert.deepEqual(plain(shiftLines({ value: " \t\tα\n β\nγ", selectionStart: 0, selectionEnd: 9 }, -1)),
    { value: "\tα\nβ\nγ", selectionStart: 0, selectionEnd: 6 });
});

test("Intro conserva el prefijo, aumenta marcadores numerados y reemplaza una selección invertida con Unicode", () => {
  assert.deepEqual(plain(continueListLine({ value: "  * á😀", selectionStart: 7, selectionEnd: 7 })),
    { value: "  * á😀\n  * ", selectionStart: 12, selectionEnd: 12 });
  assert.deepEqual(plain(continueListLine({ value: "\t09) α😀 resto", selectionStart: 9, selectionEnd: 6 })),
    { value: "\t09) α\n\t10) resto", selectionStart: 12, selectionEnd: 12 });
  assert.deepEqual(plain(continueListLine({ value: "  Sin marcador" })),
    { value: "  Sin marcador\n  ", selectionStart: 17, selectionEnd: 17 });
});

test("Intro quita un nivel en elementos vacíos y deja un salto normal en la raíz", () => {
  assert.deepEqual(plain(continueListLine({ value: "Raíz\n    - " })),
    { value: "Raíz\n  ", selectionStart: 7, selectionEnd: 7 });
  assert.deepEqual(plain(continueListLine({ value: "Raíz\n\t" })),
    { value: "Raíz\n", selectionStart: 5, selectionEnd: 5 });
  assert.deepEqual(plain(continueListLine({ value: "Raíz\n- " })),
    { value: "Raíz\n- \n", selectionStart: 8, selectionEnd: 8 });
});
