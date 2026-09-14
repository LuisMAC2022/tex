import test from "node:test";
import assert from "node:assert/strict";
import { insertAtSelection } from "../assets/js/text-insertion.js";
import { MATH_SYMBOLS, MATH_SYMBOL_GROUPS, describeCommand, filterMathSymbols, normalizeSearchTerm, symbolAccessibleName, symbolsByGroup } from "../assets/js/math-symbols.js";

test("inserta al principio, en medio y al final del contenido", () => {
  assert.deepEqual(insertAtSelection({ value: "x + y", selectionStart: 0, selectionEnd: 0, insertion: "\\forall " }),
    { value: "\\forall x + y", selectionStart: 8, selectionEnd: 8, replaced: "" });
  assert.deepEqual(insertAtSelection({ value: "x  y", selectionStart: 2, selectionEnd: 2, insertion: "\\land" }),
    { value: "x \\land y", selectionStart: 7, selectionEnd: 7, replaced: "" });
  assert.deepEqual(insertAtSelection({ value: "x + y", selectionStart: 5, selectionEnd: 5, insertion: "\\)" }),
    { value: "x + y\\)", selectionStart: 7, selectionEnd: 7, replaced: "" });
});
test("sustituye la selección activa y conserva el resto", () => {
  assert.deepEqual(insertAtSelection({ value: "P implica Q", selectionStart: 2, selectionEnd: 9, insertion: "\\Rightarrow" }),
    { value: "P \\Rightarrow Q", selectionStart: 13, selectionEnd: 13, replaced: "implica" });
});
test("acepta una selección invertida sin perder contenido", () => {
  assert.deepEqual(insertAtSelection({ value: "abcdef", selectionStart: 4, selectionEnd: 1, insertion: "-" }),
    { value: "a-ef", selectionStart: 2, selectionEnd: 2, replaced: "bcd" });
});
test("trabaja sobre un campo vacío", () => {
  assert.deepEqual(insertAtSelection({ value: "", selectionStart: 0, selectionEnd: 0, insertion: "\\emptyset" }),
    { value: "\\emptyset", selectionStart: 9, selectionEnd: 9, replaced: "" });
  assert.deepEqual(insertAtSelection({ insertion: "\\in" }), { value: "\\in", selectionStart: 3, selectionEnd: 3, replaced: "" });
});
test("conserva caracteres Unicode fuera del ASCII y cuenta en unidades UTF-16", () => {
  assert.deepEqual(insertAtSelection({ value: "áβ∀", selectionStart: 1, selectionEnd: 1, insertion: "\\gamma" }),
    { value: "á\\gammaβ∀", selectionStart: 7, selectionEnd: 7, replaced: "" });
  // Un par suplente ocupa dos unidades: insertar entre ambas no es posible desde la interfaz,
  // pero insertar después del par conserva el carácter completo.
  const result = insertAtSelection({ value: "𝕉 y", selectionStart: 2, selectionEnd: 2, insertion: "\\mathbb{R}" });
  assert.equal(result.value, "𝕉\\mathbb{R} y");
  assert.equal(result.selectionStart, 12);
});
test("un índice ausente o fuera de rango se ajusta al contenido", () => {
  assert.deepEqual(insertAtSelection({ value: "abc", selectionStart: 99, selectionEnd: 99, insertion: "!" }),
    { value: "abc!", selectionStart: 4, selectionEnd: 4, replaced: "" });
  assert.deepEqual(insertAtSelection({ value: "abc", selectionStart: -5, selectionEnd: null, insertion: "!" }),
    { value: "!abc", selectionStart: 1, selectionEnd: 1, replaced: "" });
});
test("insertar la cadena vacía no altera el contenido", () => {
  assert.deepEqual(insertAtSelection({ value: "abc", selectionStart: 1, selectionEnd: 1 }),
    { value: "abc", selectionStart: 1, selectionEnd: 1, replaced: "" });
});

test("el catálogo es coherente: identificadores únicos y grupos declarados", () => {
  const groups = new Set(MATH_SYMBOL_GROUPS.map((group) => group.id));
  const ids = new Set();
  for (const symbol of MATH_SYMBOLS) {
    assert.ok(!ids.has(symbol.id), `identificador repetido: ${symbol.id}`);
    ids.add(symbol.id);
    assert.ok(groups.has(symbol.group), `grupo desconocido: ${symbol.group}`);
    for (const field of ["symbol", "command", "name"]) assert.ok(symbol[field]?.trim(), `falta ${field} en ${symbol.id}`);
    assert.ok(Array.isArray(symbol.keywords) && symbol.keywords.length, `faltan términos de búsqueda en ${symbol.id}`);
  }
  for (const group of MATH_SYMBOL_GROUPS) assert.ok(symbolsByGroup(group.id).length, `grupo vacío: ${group.id}`);
});
test("el conjunto inicial cubre griegas, conectores, cuantificadores, relaciones y agrupación", () => {
  const commands = new Set(MATH_SYMBOLS.map((symbol) => symbol.command));
  for (const command of ["\\alpha", "\\beta", "\\gamma", "\\varphi", "\\neg", "\\land", "\\lor", "\\Rightarrow", "\\Leftrightarrow", "\\forall", "\\exists", "=", "\\neq", "\\in", "\\notin", "\\subseteq", "\\mathbb{R}"]) {
    assert.ok(commands.has(command), `falta el comando ${command}`);
  }
});
test("el nombre accesible describe el comando en palabras", () => {
  assert.equal(describeCommand("\\forall"), "barra invertida forall");
  assert.equal(describeCommand("\\mathbb{R}"), "barra invertida mathbb llave izquierda R llave derecha");
  assert.equal(describeCommand("="), "igual");
  assert.equal(symbolAccessibleName(MATH_SYMBOLS.find((symbol) => symbol.id === "forall")),
    "Insertar cuantificador universal, comando barra invertida forall");
});
test("la búsqueda ignora acentos, mayúsculas y acepta el comando", () => {
  assert.equal(normalizeSearchTerm("  Conjunción  "), "conjuncion");
  assert.deepEqual(filterMathSymbols("para todo").map((symbol) => symbol.command), ["\\forall"]);
  assert.deepEqual(filterMathSymbols("IMPLICA").map((symbol) => symbol.command), ["\\Rightarrow", "\\Leftrightarrow"]);
  assert.deepEqual(filterMathSymbols("conjunción").map((symbol) => symbol.command), ["\\land"]);
  assert.deepEqual(filterMathSymbols("\\forall").map((symbol) => symbol.id), ["forall"]);
  assert.deepEqual(filterMathSymbols("numeros reales").map((symbol) => symbol.command), ["\\mathbb{R}"]);
});
test("una búsqueda vacía devuelve todo el catálogo y una sin coincidencias devuelve nada", () => {
  assert.equal(filterMathSymbols("").length, MATH_SYMBOLS.length);
  assert.equal(filterMathSymbols("   ").length, MATH_SYMBOLS.length);
  assert.deepEqual(filterMathSymbols("integral triple"), []);
});
