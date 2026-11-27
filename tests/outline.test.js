import test from "node:test";
import assert from "node:assert/strict";
import { loadTexNotes } from "./load-app.mjs";

const { outlineEntries, outlineLabel, blockIsEmitted, blockToLatex, diffOutline, indentBlock } = await loadTexNotes();
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

test("las insignias del tema y sus textos muestran la numeración del PDF", () => {
  const b = texto("B"), a = texto("A", [b]), c = texto("C");
  const entries = esquema([a, c], "Unidad 1");
  const labels = entries.map((entry, i) => outlineLabel(entry, [{}, a, b, c][i]));
  assert.deepEqual(structuredClone(labels), [
    { badge: "Sección", text: "1 Unidad 1" },
    { badge: "Subsección", text: "1.1 A" },
    { badge: "Subsubsección", text: "1.1.1 B" },
    { badge: "Subsección", text: "1.2 C" },
  ]);
});

test("los encabezados sin número muestran Párrafo o Subpárrafo y solo el título", () => {
  const [root] = ramaProfunda();
  const entries = esquema([root], "", { numberedLevels: 0 });
  const levels = [entries[0], entries[3], entries[4]];
  assert.deepEqual(structuredClone(levels.map(entry => outlineLabel(entry, root))), [
    { badge: "Párrafo", text: "Padre" },
    { badge: "Párrafo", text: "Padre" },
    { badge: "Subpárrafo", text: "Padre" },
  ]);
});

test("las etiquetas de teorema incluyen su contador y el título opcional", () => {
  const blocks = ["", " Fubini "].map(title => ({ type: "theorem", title, content: "Enunciado" }));
  const labels = esquema(blocks).map((entry, index) => outlineLabel(entry, blocks[index]));
  assert.deepEqual(structuredClone(labels), [
    { badge: "Teorema", text: "Teorema 1" },
    { badge: "Teorema", text: "Teorema 2 (Fubini)" },
  ]);
});

test("los bloques sin encabezado muestran el tipo y su título si existe", () => {
  const image = { type: "image", title: " Figura ", content: "figura.png" };
  assert.deepEqual(structuredClone(outlineLabel(esquema([image])[0], image)), { badge: "Imagen", text: "Figura" });
  assert.deepEqual(structuredClone(outlineLabel(undefined, texto(""))), { badge: "Texto", text: "" });
});

test("la etiqueta de un encabezado fuera de lugar avisa qué entorno lo contiene", () => {
  const block = texto("Interior");
  const entries = esquema([{ type: "definition", children: [texto("", [block])] }]);
  assert.deepEqual(structuredClone(outlineLabel(entries[1], block)), {
    badge: "Sección", text: "1 Interior",
    warning: "Encabezado dentro de Definición: LaTeX lo admite pero rompe la jerarquía",
  });
});

const identificado = (title, id, children = []) => ({ ...texto(title, children), id });

test("el resumen sigue los ids al anidar y cuenta los demás bloques renumerados", () => {
  const blocks = [identificado("Clase", "clase"), identificado("Pre-Clase", "pre"), identificado("Repaso", "repaso")];
  const result = indentBlock(blocks, [1]);
  const diff = structuredClone(diffOutline(esquema(blocks, "Tema"), esquema(result.blocks, "Tema")));
  assert.deepEqual(diff, {
    changes: [
      { id: "pre", title: "Pre-Clase", before: { number: "1.2", level: 1 }, after: { number: "1.1.1", level: 2 } },
      { id: "repaso", title: "Repaso", before: { number: "1.3", level: 1 }, after: { number: "1.2", level: 1 } },
    ],
    summary: "Pre-Clase: 1.2 → 1.1.1. Otro bloque cambia de número.",
  });
});

test("el resumen usa el plural cuando varios otros bloques cambian de número", () => {
  const blocks = ["Clase", "Pre-Clase", "C", "D", "E", "F"].map((title, index) => identificado(title, String(index)));
  const result = indentBlock(blocks, [1]);
  const diff = diffOutline(esquema(blocks, "Tema"), esquema(result.blocks, "Tema"));
  assert.equal(diff.summary, "Pre-Clase: 1.2 → 1.1.1. Otros 4 bloques cambian de número.");
});

test("el resumen indica cuándo un encabezado queda como párrafo sin número", () => {
  const siblings = [identificado("Padre", "padre"), identificado("Pre-Clase", "pre")];
  const blocks = [identificado("Sección", "sec", siblings)];
  const nested = indentBlock(blocks, [0, 1]);
  const diff = diffOutline(esquema(blocks, "Tema"), esquema(nested.blocks, "Tema"));
  assert.deepEqual(structuredClone(diff.changes[0].after), { number: null, level: 3 });
  assert.equal(diff.summary, "Pre-Clase quedará como párrafo sin número.");
});

test("el resumen detecta cambios de nivel entre dos encabezados sin número y usa la clave si no hay id", () => {
  const before = [{ key: "0.0.0.0", title: "Pre-Clase", level: 3, number: null }];
  const after = [{ ...before[0], level: 4 }];
  assert.deepEqual(structuredClone(diffOutline(before, after)), {
    changes: [{ id: "0.0.0.0", title: "Pre-Clase", before: { number: null, level: 3 }, after: { number: null, level: 4 } }],
    summary: "Pre-Clase quedará como subpárrafo sin número.",
  });
});

test("el resumen informa cuando un movimiento no cambia la numeración", () => {
  const blocks = [identificado("A", "a"), { type: "equation", id: "ec", content: "x+1" }];
  const result = indentBlock(blocks, [1]);
  assert.deepEqual(structuredClone(diffOutline(esquema(blocks), esquema(result.blocks))), {
    changes: [], summary: "Sin cambios de numeración",
  });
});
