import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { loadTexNotes } from "./load-app.mjs";

const {
  insertAtSelection, MATH_SYMBOLS, MATH_SYMBOL_GROUPS,
  describeCommand, filterMathSymbols, normalizeSearchTerm, symbolAccessibleName, symbolsByGroup,
} = await loadTexNotes(["math-symbols.js", "text-insertion.js"]);

// Lo que devuelve el código cargado en el vm pertenece a otro realm y fallaría en
// deepEqual por prototipo; se clona al realm de la prueba antes de compararlo.
const insert = (options) => structuredClone(insertAtSelection(options));
const commandsOf = (query) => [...filterMathSymbols(query)].map((symbol) => symbol.command);
const idsOf = (query) => [...filterMathSymbols(query)].map((symbol) => symbol.id);

test("inserta al principio, en medio y al final del contenido", () => {
  assert.deepEqual(insert({ value: "x + y", selectionStart: 0, selectionEnd: 0, insertion: "\\forall " }),
    { value: "\\forall x + y", selectionStart: 8, selectionEnd: 8, replaced: "" });
  assert.deepEqual(insert({ value: "x  y", selectionStart: 2, selectionEnd: 2, insertion: "\\land" }),
    { value: "x \\land y", selectionStart: 7, selectionEnd: 7, replaced: "" });
  assert.deepEqual(insert({ value: "x + y", selectionStart: 5, selectionEnd: 5, insertion: "\\)" }),
    { value: "x + y\\)", selectionStart: 7, selectionEnd: 7, replaced: "" });
});
test("sustituye la selección activa y conserva el resto", () => {
  assert.deepEqual(insert({ value: "P implica Q", selectionStart: 2, selectionEnd: 9, insertion: "\\Rightarrow" }),
    { value: "P \\Rightarrow Q", selectionStart: 13, selectionEnd: 13, replaced: "implica" });
});
test("acepta una selección invertida sin perder contenido", () => {
  assert.deepEqual(insert({ value: "abcdef", selectionStart: 4, selectionEnd: 1, insertion: "-" }),
    { value: "a-ef", selectionStart: 2, selectionEnd: 2, replaced: "bcd" });
});
test("trabaja sobre un campo vacío", () => {
  assert.deepEqual(insert({ value: "", selectionStart: 0, selectionEnd: 0, insertion: "\\emptyset" }),
    { value: "\\emptyset", selectionStart: 9, selectionEnd: 9, replaced: "" });
  assert.deepEqual(insert({ insertion: "\\in" }), { value: "\\in", selectionStart: 3, selectionEnd: 3, replaced: "" });
});
test("conserva caracteres Unicode fuera del ASCII y cuenta en unidades UTF-16", () => {
  assert.deepEqual(insert({ value: "áβ∀", selectionStart: 1, selectionEnd: 1, insertion: "\\gamma" }),
    { value: "á\\gammaβ∀", selectionStart: 7, selectionEnd: 7, replaced: "" });
  // Un par suplente ocupa dos unidades: insertar entre ambas no es posible desde la interfaz,
  // pero insertar después del par conserva el carácter completo.
  const result = insert({ value: "𝕉 y", selectionStart: 2, selectionEnd: 2, insertion: "\\mathbb{R}" });
  assert.equal(result.value, "𝕉\\mathbb{R} y");
  assert.equal(result.selectionStart, 12);
});
test("un índice ausente o fuera de rango se ajusta al contenido", () => {
  assert.deepEqual(insert({ value: "abc", selectionStart: 99, selectionEnd: 99, insertion: "!" }),
    { value: "abc!", selectionStart: 4, selectionEnd: 4, replaced: "" });
  assert.deepEqual(insert({ value: "abc", selectionStart: -5, selectionEnd: null, insertion: "!" }),
    { value: "!abc", selectionStart: 1, selectionEnd: 1, replaced: "" });
});
test("insertar la cadena vacía no altera el contenido", () => {
  assert.deepEqual(insert({ value: "abc", selectionStart: 1, selectionEnd: 1 }),
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
    "Insertar cuantificador universal para todo, comando barra invertida forall");
});
test("la búsqueda ignora acentos, mayúsculas y acepta el comando", () => {
  assert.equal(normalizeSearchTerm("  Conjunción  "), "conjuncion");
  assert.deepEqual(commandsOf("para todo"), ["\\forall"]);
  assert.deepEqual(commandsOf("IMPLICA"), ["\\Rightarrow", "\\Leftarrow", "\\Leftrightarrow"]);
  assert.deepEqual(commandsOf("conjunción"), ["\\land"]);
  assert.deepEqual(idsOf("\\forall"), ["forall"]);
  assert.deepEqual(commandsOf("numeros reales"), ["\\mathbb{R}"]);
});
test("una búsqueda vacía devuelve todo el catálogo y una sin coincidencias devuelve nada", () => {
  assert.equal(filterMathSymbols("").length, MATH_SYMBOLS.length);
  assert.equal(filterMathSymbols("   ").length, MATH_SYMBOLS.length);
  assert.deepEqual(commandsOf("integral triple"), ["\\iiint"]);
});

test("cubre el alfabeto griego y sus variantes válidas", () => {
  const commands = new Set(MATH_SYMBOLS.map((symbol) => symbol.command));
  for (const command of ["\\alpha", "\\beta", "\\gamma", "\\delta", "\\varepsilon", "\\zeta", "\\eta", "\\theta", "\\iota", "\\kappa", "\\lambda", "\\mu", "\\nu", "\\xi", "o", "\\pi", "\\rho", "\\sigma", "\\tau", "\\upsilon", "\\phi", "\\chi", "\\psi", "\\omega", "\\vartheta", "\\varpi", "\\varrho", "\\varsigma", "\\varphi", "\\varkappa", "\\Gamma", "\\Delta", "\\Theta", "\\Lambda", "\\Xi", "\\Pi", "\\Sigma", "\\Upsilon", "\\Phi", "\\Psi", "\\Omega"]) assert.ok(commands.has(command), `falta ${command}`);
});

test("cubre conjuntos y topología sin comandos de paquetes ajenos", () => {
  const commands = new Set(MATH_SYMBOLS.map((symbol) => symbol.command));
  for (const command of ["\\forall", "\\exists", "\\nexists", "\\subset", "\\subseteq", "\\cup", "\\cap", "\\setminus", "\\varnothing", "\\mathbb{N}", "\\mathbb{R}", "\\lVert \\cdot \\rVert", "\\operatorname{int}", "\\operatorname{diam}", "\\infty"]) assert.ok(commands.has(command), `falta ${command}`);
  for (const symbol of MATH_SYMBOLS) assert.doesNotMatch(symbol.command, /\\(?:mathscr|coloneqq|bm)\b/, `paquete ajeno en ${symbol.id}`);
});

test("las plantillas abren un hueco o envuelven una selección", () => {
  assert.deepEqual(insert({ value: "", selectionStart: 0, selectionEnd: 0, before: "\\textbf{", after: "}" }),
    { value: "\\textbf{}", selectionStart: 8, selectionEnd: 8, replaced: "" });
  assert.deepEqual(insert({ value: "hola", selectionStart: 0, selectionEnd: 4, before: "\\textbf{", after: "}" }),
    { value: "\\textbf{hola}", selectionStart: 13, selectionEnd: 13, replaced: "hola" });
});

test("todo el catálogo se puede representar con KaTeX", async () => {
  const context = vm.createContext({});
  vm.runInContext(await readFile(new URL("../assets/vendor/katex/katex.min.js", import.meta.url), "utf8"), context);
  for (const symbol of MATH_SYMBOLS) {
    const probe = symbol.katexProbe || (symbol.insert ? `${symbol.insert.before}x${symbol.insert.after}` : symbol.command);
    assert.doesNotThrow(() => context.katex.renderToString(probe, { throwOnError: true, strict: false, trust: false }), symbol.id);
  }
});
