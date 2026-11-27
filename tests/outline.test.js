import test from "node:test";
import assert from "node:assert/strict";
import { loadTexNotes } from "./load-app.mjs";

const { outlineEntries, blockIsEmitted, blockToLatex } = await loadTexNotes();
const texto = (title, children) => ({ type: "text", title, content: "Prosa", children });
const esquema = (blocks, topic, options) => structuredClone(outlineEntries({ blocks, metadata: { topic } }, options));

test("el tema numera los encabezados hermanos como subsecciones", () => {
  assert.deepEqual(esquema([texto(" A "), texto("B")], " Tema "), [
    { kind: "topic", path: null, key: null, level: 0, command: "section", title: "Tema", number: "1" },
    { kind: "heading", path: [0], key: "0", level: 1, command: "subsection", title: "A", number: "1.1" },
    { kind: "heading", path: [1], key: "1", level: 1, command: "subsection", title: "B", number: "1.2" },
  ]);
});

test("las ramas se numeran en profundidad y reinician los contadores inferiores", () => {
  const blocks = [texto("A", [texto("X")]), texto("B", [texto("Y")])];
  assert.deepEqual(esquema(blocks, "Tema").map(e => e.number), ["1", "1.1", "1.1.1", "1.2", "1.2.1"]);
});

test("sin tema los textos de la raíz son secciones", () => {
  assert.deepEqual(esquema([texto("A"), texto("B")], "  ").map(e => [e.command, e.number]),
    [["section", "1"], ["section", "2"]]);
});

test("el texto sin título deja pasar a sus hijos en el mismo nivel", () => {
  const entries = esquema([texto("A", [texto("  ", [texto("B")])])]);
  assert.deepEqual(entries.map(e => [e.key, e.level]), [["0", 0], ["0.0.0", 1]]);
});

function ramaProfunda() {
  let block = texto("Último");
  for (let i = 0; i < 6; i++) block = texto("Padre", [block]);
  return [block];
}

test("los niveles profundos llegan hasta subparagraph y por defecto pierden el número", () => {
  const entries = esquema(ramaProfunda());
  assert.deepEqual(entries.map(e => e.level), [0, 1, 2, 3, 4, 4, 4]);
  assert.deepEqual(entries.slice(3).map(e => [e.command, e.number]), [
    ["paragraph", null], ["subparagraph", null], ["subparagraph", null], ["subparagraph", null],
  ]);
});

test("el esquema y el generador omiten el texto cuyo único contenido es el título", () => {
  const empty = { type: "text", title: "Vacío", content: " \r\n" };
  for (const block of [empty, { ...empty, children: [empty] }]) {
    assert.equal(blockIsEmitted(block), false);
    assert.equal(blockToLatex(block), "");
    assert.deepEqual(esquema([block]), []);
  }
  const parent = { ...empty, children: [texto("Hijo")] };
  assert.equal(blockIsEmitted(parent), true);
  assert.match(blockToLatex(parent), /\\subsection\{Vacío\}/);
  assert.deepEqual(esquema([empty, parent]).map(e => e.key), ["1", "1.0"]);
});

test("un encabezado dentro de una definición conserva su nivel y se marca fuera de lugar", () => {
  const list = { type: "itemize", content: "Uno", children: [texto("", [texto("Interior")])] };
  const entries = esquema([{ type: "definition", children: [list] }, texto("Exterior")]);
  assert.deepEqual(entries[1], { kind: "other", path: [0, 0], key: "0.0", type: "itemize" });
  assert.deepEqual(entries.slice(2).map(e => [e.key, e.level, e.misplaced]), [
    ["0.0.0.0", 0, true], ["1", 0, undefined],
  ]);
});

test("cada entorno de teorema lleva un contador continuo e independiente", () => {
  const theorem = { type: "theorem", content: "Enunciado" };
  const definition = { type: "definition", content: "Concepto" };
  const entries = esquema([theorem, texto("A", [definition, theorem]), { type: "definition" }, definition]);
  assert.deepEqual(entries.filter(e => e.kind === "theorem").map(e => [e.key, e.environment, e.heading, e.number]), [
    ["0", "theorem", "Teorema", 1], ["1.0", "definition", "Definición", 1],
    ["1.1", "theorem", "Teorema", 2], ["3", "definition", "Definición", 2],
  ]);
});

test("cinco niveles numerados incluyen paragraph y subparagraph", () => {
  assert.deepEqual(esquema(ramaProfunda(), "", { numberedLevels: 5 }).slice(3).map(e => e.number),
    ["1.1.1.1", "1.1.1.1.1", "1.1.1.1.2", "1.1.1.1.3"]);
});
